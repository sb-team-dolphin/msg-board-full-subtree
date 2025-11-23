const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const https = require('https');

class AWSCliInstaller {
  constructor() {
    this.installerUrl = 'https://awscli.amazonaws.com/AWSCLIV2.msi';
    this.installerPath = null;
  }

  /**
   * AWS CLI 설치 여부 확인
   * @returns {Promise<Object>}
   */
  async checkInstallation() {
    try {
      const result = await this.execCommand('aws', ['--version']);

      if (result.exitCode === 0) {
        // "aws-cli/2.13.0 Python/3.11.4 Windows/10 exe/AMD64"
        const versionMatch = result.stdout.match(/aws-cli\/([\d.]+)/);
        const version = versionMatch ? versionMatch[1] : 'unknown';

        return {
          installed: true,
          version: version,
          path: await this.getAwsCliPath(),
        };
      }

      return { installed: false };
    } catch (error) {
      return { installed: false };
    }
  }

  /**
   * AWS CLI 설치 경로 찾기
   * @returns {Promise<string|null>}
   */
  async getAwsCliPath() {
    try {
      const result = await this.execCommand('where', ['aws']);
      if (result.exitCode === 0) {
        return result.stdout.trim().split('\n')[0];
      }
      return null;
    } catch (error) {
      return null;
    }
  }

  /**
   * AWS CLI 설치 파일 다운로드
   * @param {Function} onProgress - 진행률 콜백
   * @returns {Promise<string>} 다운로드된 파일 경로
   */
  async downloadInstaller(onProgress) {
    return new Promise((resolve, reject) => {
      const tempDir = require('electron').app.getPath('temp');
      this.installerPath = path.join(tempDir, 'AWSCLIV2.msi');

      // 이미 존재하면 삭제
      if (fs.existsSync(this.installerPath)) {
        fs.unlinkSync(this.installerPath);
      }

      const file = fs.createWriteStream(this.installerPath);

      https.get(this.installerUrl, (response) => {
        const totalSize = parseInt(response.headers['content-length'], 10);
        let downloadedSize = 0;

        response.on('data', (chunk) => {
          downloadedSize += chunk.length;
          const progress = Math.round((downloadedSize / totalSize) * 100);

          if (onProgress) {
            onProgress({
              progress: progress,
              downloaded: this.formatBytes(downloadedSize),
              total: this.formatBytes(totalSize),
            });
          }
        });

        response.pipe(file);

        file.on('finish', () => {
          file.close(() => {
            resolve(this.installerPath);
          });
        });
      }).on('error', (error) => {
        fs.unlink(this.installerPath, () => {});
        reject(new Error(`Download failed: ${error.message}`));
      });
    });
  }

  /**
   * AWS CLI 설치 실행
   * @param {Function} onLog - 로그 콜백
   * @returns {Promise<Object>}
   */
  async install(onLog) {
    try {
      if (!this.installerPath || !fs.existsSync(this.installerPath)) {
        throw new Error('Installer file not found');
      }

      onLog({ type: 'info', message: 'AWS CLI 설치를 시작합니다...' });

      // MSI 무음 설치 실행
      // /qn: 무음 설치, /norestart: 재시작 안 함
      const result = await this.execCommand('msiexec', [
        '/i',
        this.installerPath,
        '/qn',
        '/norestart',
      ]);

      if (result.exitCode === 0) {
        onLog({ type: 'success', message: 'AWS CLI 설치가 완료되었습니다.' });

        // 설치 후 PATH 환경 변수 새로고침
        await this.refreshEnvironmentVariables();

        return { success: true };
      } else {
        throw new Error(`Installation failed with exit code ${result.exitCode}`);
      }
    } catch (error) {
      onLog({ type: 'error', message: `설치 실패: ${error.message}` });
      throw error;
    } finally {
      // 설치 파일 정리
      this.cleanup();
    }
  }

  /**
   * 환경 변수 새로고침
   * @returns {Promise<void>}
   */
  async refreshEnvironmentVariables() {
    // Windows에서 환경 변수 새로고침
    // 주의: 현재 프로세스에서는 완전한 새로고침이 어려움
    // 재시작 권장 메시지 표시 필요
    try {
      await this.execCommand('refreshenv', []);
    } catch (error) {
      // refreshenv가 없을 수 있음 (Chocolatey 필요)
      // 무시하고 계속 진행
    }
  }

  /**
   * 임시 파일 정리
   */
  cleanup() {
    if (this.installerPath && fs.existsSync(this.installerPath)) {
      try {
        fs.unlinkSync(this.installerPath);
        this.installerPath = null;
      } catch (error) {
        console.error('Failed to cleanup installer:', error);
      }
    }
  }

  /**
   * 바이트를 읽기 쉬운 형식으로 변환
   * @param {number} bytes
   * @returns {string}
   */
  formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  }

  /**
   * 명령 실행 헬퍼
   * @param {string} command
   * @param {string[]} args
   * @returns {Promise<Object>}
   */
  execCommand(command, args) {
    return new Promise((resolve, reject) => {
      const proc = spawn(command, args, {
        shell: true,
        windowsHide: true,
      });

      let stdout = '';
      let stderr = '';

      proc.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      proc.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      proc.on('close', (code) => {
        resolve({
          exitCode: code,
          stdout: stdout.trim(),
          stderr: stderr.trim(),
        });
      });

      proc.on('error', (error) => {
        reject(error);
      });
    });
  }
}

module.exports = new AWSCliInstaller();

