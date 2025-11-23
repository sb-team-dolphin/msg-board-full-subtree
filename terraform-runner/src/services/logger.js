const fs = require('fs');
const path = require('path');

class Logger {
  constructor() {
    this.logs = [];
    this.logFile = null;
  }

  /**
   * 로그 파일 초기화
   * @param {string} logDir - 로그 디렉터리
   */
  initLogFile(logDir) {
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    this.logFile = path.join(logDir, `terraform-runner-${timestamp}.log`);

    this.info('Logger initialized');
  }

  /**
   * 로그 추가 (일반 정보)
   * @param {string} message - 로그 메시지
   */
  info(message) {
    this.log('INFO', message);
  }

  /**
   * 로그 추가 (경고)
   * @param {string} message - 로그 메시지
   */
  warn(message) {
    this.log('WARN', message);
  }

  /**
   * 로그 추가 (에러)
   * @param {string} message - 로그 메시지
   */
  error(message) {
    this.log('ERROR', message);
  }

  /**
   * 로그 추가 (성공)
   * @param {string} message - 로그 메시지
   */
  success(message) {
    this.log('SUCCESS', message);
  }

  /**
   * 로그 기록
   * @param {string} level - 로그 레벨
   * @param {string} message - 로그 메시지
   */
  log(level, message) {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level,
      message,
    };

    this.logs.push(logEntry);

    // 콘솔 출력
    const formattedLog = `[${timestamp}] [${level}] ${message}`;
    console.log(formattedLog);

    // 파일에 기록 (비동기)
    if (this.logFile) {
      fs.appendFile(this.logFile, formattedLog + '\n', (err) => {
        if (err) {
          console.error('Failed to write log to file:', err);
        }
      });
    }
  }

  /**
   * 모든 로그 반환
   * @returns {Array} 로그 배열
   */
  getLogs() {
    return this.logs;
  }

  /**
   * 로그를 파일로 저장
   * @param {Array|string} logs - 로그 배열 또는 문자열
   * @param {string} filePath - 저장할 파일 경로
   * @returns {Promise<void>}
   */
  async saveToFile(logs, filePath) {
    try {
      let content = '';

      if (typeof logs === 'string') {
        content = logs;
      } else if (Array.isArray(logs)) {
        content = logs
          .map((log) => {
            if (typeof log === 'string') {
              return log;
            } else if (log.timestamp && log.level && log.message) {
              return `[${log.timestamp}] [${log.level}] ${log.message}`;
            } else {
              return JSON.stringify(log);
            }
          })
          .join('\n');
      } else {
        content = JSON.stringify(logs, null, 2);
      }

      await fs.promises.writeFile(filePath, content, 'utf8');
    } catch (error) {
      throw new Error(`Failed to save logs: ${error.message}`);
    }
  }

  /**
   * 로그 초기화
   */
  clear() {
    this.logs = [];
    this.info('Logs cleared');
  }

  /**
   * 로그 통계
   * @returns {Object} 로그 통계
   */
  getStats() {
    const stats = {
      total: this.logs.length,
      info: 0,
      warn: 0,
      error: 0,
      success: 0,
    };

    this.logs.forEach((log) => {
      const level = log.level.toLowerCase();
      if (stats.hasOwnProperty(level)) {
        stats[level]++;
      }
    });

    return stats;
  }
}

module.exports = new Logger();

