const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const awsConfig = require('./aws-config');

class TerraformRunner {
  constructor() {
    this.terraformPath = this.getTerraformPath();
  }

  /**
   * Terraform 실행 파일 경로 반환
   * @returns {string}
   */
  getTerraformPath() {
    const isDev = process.argv.includes('--dev') || process.env.NODE_ENV === 'development';

    if (isDev) {
      // 개발 모드: 프로젝트 루트의 bin/terraform.exe
      return path.join(process.cwd(), 'bin', 'terraform.exe');
    } else {
      // 프로덕션 모드: 패키지된 리소스 경로
      return path.join(process.resourcesPath, 'bin', 'terraform.exe');
    }
  }

  /**
   * Terraform 명령 실행
   * @param {string} command - 실행할 명령 (init, plan, apply, etc.)
   * @param {string} projectPath - Terraform 프로젝트 경로
   * @param {Function} onLog - 로그 콜백 함수
   * @param {Function} onProgress - 진행률 콜백 함수
   * @returns {Promise<Object>} 실행 결과
   */
  async run(command, projectPath, onLog, onProgress) {
    return new Promise((resolve, reject) => {
      // Terraform 실행 파일 존재 확인
      if (!fs.existsSync(this.terraformPath)) {
        const error = `Terraform executable not found at: ${this.terraformPath}`;
        onLog({ type: 'error', message: error });
        reject(new Error(error));
        return;
      }

      // 프로젝트 경로 존재 확인
      if (!fs.existsSync(projectPath)) {
        const error = `Project path not found: ${projectPath}`;
        onLog({ type: 'error', message: error });
        reject(new Error(error));
        return;
      }

      // 명령 인자 구성
      const args = [command];

      // apply/destroy 명령의 경우 자동 승인 옵션 추가
      if (command === 'apply' || command === 'destroy') {
        args.push('-auto-approve');
      }

      // plan 명령의 경우 상세 출력
      if (command === 'plan') {
        args.push('-detailed-exitcode');
      }

      onLog({
        type: 'info',
        message: `Executing: ${path.basename(this.terraformPath)} ${args.join(' ')}`
      });

      // AWS 자격증명 환경변수 가져오기
      const env = awsConfig.getEnvironmentVariables();

      // Terraform 프로세스 시작 (앱에서 설정한 AWS 자격증명 사용)
      const proc = spawn(this.terraformPath, args, {
        cwd: projectPath,
        shell: true,
        windowsHide: false,
        env: env,  // 앱 자격증명 사용!
      });

      let stdout = '';
      let stderr = '';
      let hasError = false;

      // stdout 처리
      proc.stdout.on('data', (data) => {
        const text = data.toString();
        stdout += text;

        // 줄 단위로 로그 전송
        const lines = text.split('\n');
        lines.forEach((line) => {
          if (line.trim()) {
            onLog({ type: 'info', message: line });
          }
        });

        // 진행률 파싱 (간단한 예시)
        this.parseProgress(text, command, onProgress);
      });

      // stderr 처리
      proc.stderr.on('data', (data) => {
        const text = data.toString();
        stderr += text;
        hasError = true;

        // 줄 단위로 로그 전송
        const lines = text.split('\n');
        lines.forEach((line) => {
          if (line.trim()) {
            onLog({ type: 'error', message: line });
          }
        });
      });

      // 프로세스 종료 처리
      proc.on('close', (code) => {
        onLog({
          type: code === 0 ? 'success' : 'error',
          message: `Terraform ${command} exited with code ${code}`
        });

        if (code === 0 || (command === 'plan' && code === 2)) {
          // code 2는 plan에서 변경사항이 있음을 의미 (정상)
          const output = this.parseOutput(command, stdout, stderr);
          resolve({
            success: true,
            exitCode: code,
            output: output,
            stdout: stdout,
            stderr: stderr,
          });
        } else {
          reject({
            success: false,
            exitCode: code,
            error: stderr || stdout || `Process exited with code ${code}`,
            stdout: stdout,
            stderr: stderr,
          });
        }
      });

      // 프로세스 에러 처리
      proc.on('error', (error) => {
        const errorMsg = `Failed to start terraform: ${error.message}`;
        onLog({ type: 'error', message: errorMsg });
        reject({
          success: false,
          error: errorMsg,
        });
      });
    });
  }

  /**
   * Terraform 버전 확인
   * @returns {Promise<string>} Terraform 버전
   */
  async getVersion() {
    return new Promise((resolve, reject) => {
      if (!fs.existsSync(this.terraformPath)) {
        reject(new Error('Terraform executable not found'));
        return;
      }

      const proc = spawn(this.terraformPath, ['version'], {
        shell: true,
        windowsHide: true,
      });

      let stdout = '';

      proc.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      proc.on('close', (code) => {
        if (code === 0) {
          // "Terraform v1.6.0"
          const match = stdout.match(/Terraform v([\d.]+)/);
          resolve(match ? match[1] : stdout.trim());
        } else {
          reject(new Error('Failed to get Terraform version'));
        }
      });

      proc.on('error', (error) => {
        reject(error);
      });
    });
  }

  /**
   * 진행률 파싱 (간단한 구현)
   * @param {string} text - 출력 텍스트
   * @param {string} command - 실행 중인 명령
   * @param {Function} onProgress - 진행률 콜백
   */
  parseProgress(text, command, onProgress) {
    if (!onProgress) return;

    // init: 플러그인 다운로드 진행률
    if (command === 'init') {
      if (text.includes('Initializing')) {
        onProgress({ step: command, progress: 10 });
      } else if (text.includes('Downloading')) {
        onProgress({ step: command, progress: 50 });
      } else if (text.includes('Installing')) {
        onProgress({ step: command, progress: 70 });
      } else if (text.includes('has been successfully initialized')) {
        onProgress({ step: command, progress: 100 });
      }
    }

    // plan/apply/destroy: 리소스 처리 진행
    if (command === 'plan' || command === 'apply' || command === 'destroy') {
      const resourceMatch = text.match(/(\d+) to add, (\d+) to change, (\d+) to destroy/);
      if (resourceMatch) {
        onProgress({
          step: command,
          progress: 80,
          resourceStats: {
            toAdd: parseInt(resourceMatch[1]),
            toChange: parseInt(resourceMatch[2]),
            toDestroy: parseInt(resourceMatch[3]),
          }
        });
      }

      if (text.includes('Apply complete!') || text.includes('Destroy complete!')) {
        onProgress({ step: command, progress: 100 });
      }
    }
  }

  /**
   * 출력 파싱 (리소스 변경사항 등)
   * @param {string} command - 실행한 명령
   * @param {string} stdout - 표준 출력
   * @param {string} stderr - 표준 에러
   * @returns {Object} 파싱된 결과
   */
  parseOutput(command, stdout, stderr) {
    const output = {
      command: command,
      raw: stdout,
    };

    if (command === 'plan') {
      // ANSI escape codes 제거 (색상 코드 등)
      // eslint-disable-next-line no-control-regex
      const cleanStdout = stdout.replace(/\x1B\[[0-9;]*[a-zA-Z]/g, '');

      // "Plan: 12 to add, 3 to change, 0 to destroy."
      const match = cleanStdout.match(/Plan:\s*(\d+)\s*to add,\s*(\d+)\s*to change,\s*(\d+)\s*to destroy/i);
      if (match) {
        const toAdd = parseInt(match[1], 10);
        const toChange = parseInt(match[2], 10);
        const toDestroy = parseInt(match[3], 10);

        output.resourceChanges = {
          toAdd: toAdd,
          toChange: toChange,
          toDestroy: toDestroy,
        };

        // 변경사항 확인 (하나라도 0이 아니면 변경사항 있음!)
        output.hasChanges = (toAdd > 0 || toChange > 0 || toDestroy > 0);

        console.log(`[DEBUG] Plan parsed: ${toAdd} add, ${toChange} change, ${toDestroy} destroy, hasChanges: ${output.hasChanges}`);
      } else {
        // 변경사항 없음
        output.resourceChanges = {
          toAdd: 0,
          toChange: 0,
          toDestroy: 0,
        };
        output.hasChanges = false;
        console.log('[DEBUG] No plan changes detected (regex did not match)');
        console.log('[DEBUG] Clean stdout snippet:', cleanStdout.substring(0, 500));
      }
    }

    if (command === 'apply') {
      // "Apply complete! Resources: 12 added, 0 changed, 0 destroyed."
      const match = stdout.match(/Apply complete!\s*Resources:\s*(\d+)\s*added,\s*(\d+)\s*changed,\s*(\d+)\s*destroyed/i);
      if (match) {
        output.resourceChanges = {
          added: parseInt(match[1], 10),
          changed: parseInt(match[2], 10),
          destroyed: parseInt(match[3], 10),
        };
      } else {
        output.resourceChanges = {
          added: 0,
          changed: 0,
          destroyed: 0,
        };
      }

      // Outputs 추출
      const outputsMatch = stdout.match(/Outputs:\s*([\s\S]*?)$/);
      if (outputsMatch) {
        const outputsText = outputsMatch[1].trim();
        output.terraformOutputs = outputsText;

        // 개별 output 파싱
        output.outputs = {};
        const lines = outputsText.split('\n');
        for (const line of lines) {
          const lineMatch = line.match(/^(\w+)\s*=\s*(.+)$/);
          if (lineMatch) {
            const key = lineMatch[1];
            let value = lineMatch[2].trim();
            // 따옴표 제거
            value = value.replace(/^["']|["']$/g, '');
            output.outputs[key] = value;
          }
        }
      }
    }

    if (command === 'destroy') {
      // "Destroy complete! Resources: 49 destroyed."
      const match = stdout.match(/Destroy complete!\s*Resources:\s*(\d+)\s*destroyed/i);
      if (match) {
        output.resourceChanges = {
          destroyed: parseInt(match[1], 10),
        };
      } else {
        output.resourceChanges = {
          destroyed: 0,
        };
      }
    }

    return output;
  }
}

module.exports = new TerraformRunner();

