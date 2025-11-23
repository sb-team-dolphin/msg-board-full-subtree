const AdmZip = require('adm-zip');
const fs = require('fs');
const path = require('path');

class Unzipper {
  constructor() {
    this.baseTempDir = path.join(require('electron').app.getPath('temp'), 'terraform-runner');
    this.sessionId = null;
    this.extractPath = null;
  }

  /**
   * 세션 ID 생성 (타임스탬프 기반)
   * @returns {string} 세션 ID
   */
  generateSessionId() {
    const now = new Date();
    const timestamp = now.toISOString().replace(/[:.]/g, '-').slice(0, -5);
    return timestamp; // 예: 2025-11-22T16-30-45
  }

  /**
   * ZIP 파일 압축 해제
   * @param {string} zipPath - ZIP 파일 경로
   * @returns {Promise<Object>} 결과 객체
   */
  async extractZip(zipPath) {
    try {
      // 세션 ID 생성 (타임스탬프 기반)
      this.sessionId = this.generateSessionId();

      // 세션별 temp 디렉토리 경로: temp/<timestamp>/
      const sessionTempDir = path.join(this.baseTempDir, this.sessionId);
      this.extractPath = path.join(sessionTempDir, 'project');

      // 세션 디렉터리 생성
      if (!fs.existsSync(sessionTempDir)) {
        fs.mkdirSync(sessionTempDir, { recursive: true });
      }

      // ZIP 압축 해제
      const zip = new AdmZip(zipPath);
      zip.extractAllTo(this.extractPath, true);

      // .tf 파일 검색
      const tfFiles = this.findTfFiles(this.extractPath);

      if (tfFiles.length === 0) {
        throw new Error('No .tf files found in the ZIP archive');
      }

      // .tf 파일이 있는 실제 작업 디렉터리 찾기
      const workingDir = this.findTerraformWorkingDirectory(tfFiles);

      return {
        success: true,
        extractPath: workingDir, // 실제 .tf 파일이 있는 디렉터리 반환
        tfFiles: tfFiles,
        fileCount: tfFiles.length,
      };
    } catch (error) {
      throw new Error(`Failed to extract ZIP: ${error.message}`);
    }
  }

  /**
   * Terraform 작업 디렉터리 찾기
   * .tf 파일들이 있는 공통 상위 디렉터리를 반환
   * @param {string[]} tfFiles - .tf 파일 경로 배열
   * @returns {string} Terraform 작업 디렉터리
   */
  findTerraformWorkingDirectory(tfFiles) {
    if (tfFiles.length === 0) {
      return this.extractPath;
    }

    // 첫 번째 .tf 파일의 디렉터리를 작업 디렉터리로 사용
    const firstTfFile = tfFiles[0];
    const workingDir = path.dirname(firstTfFile);

    // 모든 .tf 파일이 같은 디렉터리 또는 하위 디렉터리에 있는지 확인
    const allInSameRoot = tfFiles.every(file => {
      return file.startsWith(workingDir);
    });

    if (allInSameRoot) {
      return workingDir;
    }

    // 여러 디렉터리에 분산되어 있으면 공통 상위 디렉터리 찾기
    return this.findCommonDirectory(tfFiles);
  }

  /**
   * 여러 파일의 공통 상위 디렉터리 찾기
   * @param {string[]} files - 파일 경로 배열
   * @returns {string} 공통 디렉터리
   */
  findCommonDirectory(files) {
    if (files.length === 0) {
      return this.extractPath;
    }

    // 모든 파일의 디렉터리 경로 추출
    const dirs = files.map(file => path.dirname(file));

    // 첫 번째 디렉터리를 기준으로 시작
    let commonDir = dirs[0];

    // 모든 디렉터리가 공통으로 포함하는 상위 디렉터리 찾기
    for (const dir of dirs) {
      while (!dir.startsWith(commonDir)) {
        // 한 단계 위로 올라감
        const parentDir = path.dirname(commonDir);
        if (parentDir === commonDir) {
          // 더 이상 올라갈 수 없으면 extractPath 반환
          return this.extractPath;
        }
        commonDir = parentDir;
      }
    }

    return commonDir;
  }

  /**
   * .tf 파일 찾기 (재귀적으로 검색)
   * @param {string} dir - 검색할 디렉터리
   * @returns {string[]} .tf 파일 경로 배열
   */
  findTfFiles(dir) {
    let results = [];

    if (!fs.existsSync(dir)) {
      return results;
    }

    const files = fs.readdirSync(dir);

    for (const file of files) {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);

      if (stat.isDirectory()) {
        // 재귀적으로 하위 디렉터리 검색
        results = results.concat(this.findTfFiles(filePath));
      } else if (file.endsWith('.tf')) {
        results.push(filePath);
      }
    }

    return results;
  }

  /**
   * 디렉터리 제거 (재귀적)
   * @param {string} dir - 제거할 디렉터리
   */
  removeDirectory(dir) {
    if (fs.existsSync(dir)) {
      fs.readdirSync(dir).forEach((file) => {
        const filePath = path.join(dir, file);
        if (fs.statSync(filePath).isDirectory()) {
          this.removeDirectory(filePath);
        } else {
          fs.unlinkSync(filePath);
        }
      });
      fs.rmdirSync(dir);
    }
  }

  /**
   * 현재 세션 디렉토리 정리
   * @returns {Promise<void>}
   */
  async cleanup() {
    try {
      if (this.extractPath && fs.existsSync(this.extractPath)) {
        const sessionDir = path.dirname(this.extractPath); // sessionTempDir
        this.removeDirectory(sessionDir);
        console.log(`Session directory cleaned up: ${this.sessionId}`);
      }
    } catch (error) {
      throw new Error(`Failed to cleanup: ${error.message}`);
    }
  }

  /**
   * 오래된 세션 디렉토리 정리 (24시간 이상)
   * @param {number} maxAgeHours - 최대 보관 시간 (시간)
   */
  cleanupOldSessions(maxAgeHours = 24) {
    try {
      if (!fs.existsSync(this.baseTempDir)) {
        return;
      }

      const now = Date.now();
      const maxAge = maxAgeHours * 60 * 60 * 1000; // 시간을 밀리초로 변환

      const sessions = fs.readdirSync(this.baseTempDir);
      let cleanedCount = 0;

      for (const session of sessions) {
        const sessionPath = path.join(this.baseTempDir, session);

        if (!fs.lstatSync(sessionPath).isDirectory()) {
          continue;
        }

        const stats = fs.statSync(sessionPath);
        const age = now - stats.mtimeMs;

        if (age > maxAge) {
          try {
            this.removeDirectory(sessionPath);
            cleanedCount++;
            console.log(`Old session cleaned: ${session} (${Math.round(age / 1000 / 60 / 60)}h old)`);
          } catch (error) {
            console.error(`Failed to clean old session ${session}:`, error);
          }
        }
      }

      if (cleanedCount > 0) {
        console.log(`Cleaned ${cleanedCount} old session(s)`);
      }
    } catch (error) {
      console.error('Failed to cleanup old sessions:', error);
    }
  }

  /**
   * 추출된 프로젝트 경로 반환
   * @returns {string}
   */
  getExtractPath() {
    return this.extractPath;
  }
}

module.exports = new Unzipper();

