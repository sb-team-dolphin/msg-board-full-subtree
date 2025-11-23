const { spawn } = require('child_process');
const logger = require('./logger');

class AWSConfig {
  constructor() {
    // 앱에서 설정한 자격증명을 메모리에만 저장
    this.credentials = null;
  }

  /**
   * AWS 자격증명 설정 (메모리에만 저장, 시스템 설정 변경 안 함!)
   * @param {Object} credentials - AWS 자격증명
   * @returns {Promise<Object>} 설정 결과
   */
  async configure(credentials) {
    const { accessKey, secretKey, region } = credentials;

    // 유효성 검증
    if (!accessKey || !secretKey || !region) {
      return {
        success: false,
        error: 'Missing required credentials'
      };
    }

    // 메모리에 저장 (시스템 설정 절대 변경 안 함!)
    this.credentials = {
      accessKey,
      secretKey,
      region
    };

    const maskedAccessKey = this.maskCredential(accessKey);
    const maskedSecretKey = this.maskCredential(secretKey);

    logger.info(`AWS credentials stored in memory (system unchanged)`);
    logger.info(`Access Key: ${maskedAccessKey}, Region: ${region}`);

    // 선택사항: 자격증명 테스트
    try {
      const testResult = await this.testConnection();
      if (testResult.success) {
        logger.info(`AWS connection test passed (Account: ${testResult.accountId})`);
        return {
          success: true,
          accountInfo: testResult
        };
      } else {
        logger.warn(`AWS connection test failed: ${testResult.error}`);
        // 테스트 실패해도 자격증명은 저장됨 (사용자가 수동으로 확인 가능)
        return {
          success: true,
          warning: 'Credentials stored but connection test failed'
        };
      }
    } catch (error) {
      // 테스트 실패해도 자격증명은 저장
      return { success: true };
    }
  }

  /**
   * 저장된 자격증명 가져오기
   * @returns {Object|null} 자격증명 또는 null
   */
  getCredentials() {
    return this.credentials;
  }

  /**
   * 환경변수 객체 생성 (Terraform 실행 시 사용)
   * @returns {Object} 환경변수 객체
   */
  getEnvironmentVariables() {
    if (!this.credentials) {
      // 자격증명 없으면 기존 환경변수만 반환
      return process.env;
    }

    // 기존 환경변수 + AWS 자격증명
    return {
      ...process.env,

      // AWS 자격증명 환경변수 (Terraform과 AWS CLI 모두 인식)
      AWS_ACCESS_KEY_ID: this.credentials.accessKey,
      AWS_SECRET_ACCESS_KEY: this.credentials.secretKey,
      AWS_DEFAULT_REGION: this.credentials.region,
      AWS_REGION: this.credentials.region,

      // AWS CLI 프로필 무시 (시스템 설정 사용 안 함)
      AWS_PROFILE: '',
      AWS_SHARED_CREDENTIALS_FILE: '',
      AWS_CONFIG_FILE: '',
    };
  }

  /**
   * 자격증명 초기화
   */
  clearCredentials() {
    this.credentials = null;
    logger.info('AWS credentials cleared from memory');
  }

  /**
   * AWS CLI 버전 확인
   * @returns {Promise<string>} AWS CLI 버전
   */
  async checkVersion() {
    return new Promise((resolve, reject) => {
      const versionProcess = spawn('aws', ['--version'], {
        shell: true,
        windowsHide: true,
      });

      let output = '';

      versionProcess.stdout.on('data', (data) => {
        output += data.toString();
      });

      versionProcess.stderr.on('data', (data) => {
        output += data.toString();
      });

      versionProcess.on('close', (code) => {
        if (code === 0 || output.includes('aws-cli')) {
          // AWS CLI 버전 추출
          const versionMatch = output.match(/aws-cli\/([\d.]+)/);
          const version = versionMatch ? versionMatch[1] : 'unknown';
          resolve(version);
        } else {
          reject(new Error('AWS CLI not found'));
        }
      });
    });
  }

  /**
   * 현재 설정된 자격증명으로 AWS 연결 테스트
   * @returns {Promise<Object>} 테스트 결과
   */
  async testConnection() {
    if (!this.credentials) {
      return {
        success: false,
        error: 'No credentials configured'
      };
    }

    return new Promise((resolve) => {
      // 앱 자격증명으로 환경변수 설정
      const env = this.getEnvironmentVariables();

      const testProcess = spawn('aws', ['sts', 'get-caller-identity'], {
        shell: true,
        windowsHide: true,
        env: env  // 앱 자격증명 사용!
      });

      let output = '';
      let error = '';

      testProcess.stdout.on('data', (data) => {
        output += data.toString();
      });

      testProcess.stderr.on('data', (data) => {
        error += data.toString();
      });

      testProcess.on('close', (code) => {
        if (code === 0) {
          try {
            const identity = JSON.parse(output);
            resolve({
              success: true,
              accountId: identity.Account,
              userId: identity.UserId,
              arn: identity.Arn
            });
          } catch (e) {
            resolve({ success: true });
          }
        } else {
          resolve({
            success: false,
            error: error || 'Connection test failed'
          });
        }
      });

      testProcess.on('error', () => {
        resolve({
          success: false,
          error: 'AWS CLI not available'
        });
      });
    });
  }

  /**
   * 자격증명 마스킹 (보안용)
   * @param {string} credential - 마스킹할 자격증명
   * @returns {string} 마스킹된 문자열
   */
  maskCredential(credential) {
    if (!credential || credential.length < 8) {
      return '****';
    }
    const start = credential.substring(0, 4);
    const end = credential.substring(credential.length - 4);
    const middle = '*'.repeat(Math.min(credential.length - 8, 16));
    return start + middle + end;
  }
}

module.exports = new AWSConfig();
