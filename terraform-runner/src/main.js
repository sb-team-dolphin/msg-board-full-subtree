const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');

// Services
const unzipper = require('./services/unzipper');
const awsConfig = require('./services/aws-config');
const tfRunner = require('./services/tf-runner');
const logger = require('./services/logger');
const awsCliInstaller = require('./services/aws-cli-installer');
const tfvarsParser = require('./services/tfvars-parser');

let mainWindow;

// ============================================
// App Lifecycle
// ============================================

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1000,
    height: 700,
    minWidth: 900,
    minHeight: 650,
    autoHideMenuBar: true, // 메뉴바 숨김
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
    },
    icon: path.join(__dirname, '../assets/icon.png'),
    title: 'Terraform Runner',
  });

  mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));

  // 개발 모드에서는 DevTools 자동 열기
  if (process.argv.includes('--dev')) {
    mainWindow.webContents.openDevTools();
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// ============================================
// IPC Handlers
// ============================================

// ZIP 파일 선택
ipcMain.handle('select-zip-file', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openFile'],
    filters: [{ name: 'ZIP Files', extensions: ['zip'] }],
  });

  if (result.canceled) {
    return { success: false };
  }

  logger.info(`ZIP file selected: ${result.filePaths[0]}`);
  return { success: true, path: result.filePaths[0] };
});

// ZIP 압축 해제
ipcMain.handle('extract-zip', async (event, zipPath) => {
  try {
    // 입력 검증
    if (!zipPath || typeof zipPath !== 'string') {
      throw new Error('Invalid ZIP path');
    }

    if (!fs.existsSync(zipPath)) {
      throw new Error('ZIP file not found');
    }

    if (!zipPath.toLowerCase().endsWith('.zip')) {
      throw new Error('Not a ZIP file');
    }

    // 오래된 세션 정리 (24시간 이상)
    unzipper.cleanupOldSessions(24);

    const result = await unzipper.extractZip(zipPath);
    logger.info(`ZIP extracted to session ${unzipper.sessionId}: ${result.extractPath}, found ${result.tfFiles.length} .tf files`);
    return result;
  } catch (error) {
    logger.error(`Extract failed: ${error.message}`);
    return { success: false, error: error.message };
  }
});

// AWS 설정
ipcMain.handle('configure-aws', async (event, credentials) => {
  try {
    // 입력 검증
    if (!credentials || !credentials.accessKey || !credentials.secretKey || !credentials.region) {
      throw new Error('Missing AWS credentials');
    }

    const result = await awsConfig.configure(credentials);
    logger.info('AWS configured successfully');
    return result;
  } catch (error) {
    logger.error(`AWS config failed: ${error.message}`);
    return { success: false, error: error.message };
  }
});

// AWS CLI 확인
ipcMain.handle('check-aws-cli', async () => {
  try {
    const version = await awsConfig.checkVersion();
    return { installed: true, version };
  } catch (error) {
    return { installed: false };
  }
});

// Terraform 실행
ipcMain.handle('run-terraform', async (event, command, projectPath) => {
  try {
    // 입력 검증
    if (!command || !projectPath) {
      throw new Error('Missing command or project path');
    }

    // 실시간 로그 전송 콜백
    const onLog = (log) => {
      event.sender.send('terraform-log', {
        ...log,
        timestamp: new Date().toISOString(),
      });
      logger.info(`[TF ${command}] ${log.message}`);
    };

    // 진행률 업데이트 콜백
    const onProgress = (progress) => {
      event.sender.send('progress-update', progress);
    };

    logger.info(`Starting terraform ${command}`);
    const result = await tfRunner.run(command, projectPath, onLog, onProgress);

    // 단계 완료 알림
    event.sender.send('step-complete', {
      step: command,
      success: result.success,
    });

    logger.info(`Terraform ${command} completed: ${result.success ? 'SUCCESS' : 'FAILED'}`);
    return result;
  } catch (error) {
    logger.error(`Terraform ${command} failed: ${error.message}`);

    // 오류 알림
    event.sender.send('error-occurred', {
      step: command,
      error: error.message,
    });

    return { success: false, error: error.message };
  }
});

// Terraform 확인
ipcMain.handle('check-terraform', async () => {
  try {
    const terraformPath = tfRunner.getTerraformPath();

    if (!fs.existsSync(terraformPath)) {
      return {
        available: false,
        error: 'Terraform executable not found. Please add terraform.exe to the bin/ folder.'
      };
    }

    const version = await tfRunner.getVersion();
    return { available: true, version };
  } catch (error) {
    return { available: false, error: error.message };
  }
});

// 임시 디렉터리
ipcMain.handle('get-temp-dir', async () => {
  const tempDir = path.join(app.getPath('temp'), 'terraform-runner');
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
  }
  return { path: tempDir };
});

// 임시 파일 정리
ipcMain.handle('cleanup-temp', async () => {
  try {
    await unzipper.cleanup();
    logger.info('Temporary files cleaned up');
    return { success: true };
  } catch (error) {
    logger.error(`Cleanup failed: ${error.message}`);
    return { success: false, error: error.message };
  }
});

// 로그 저장
ipcMain.handle('save-logs', async (event, logs, filename) => {
  try {
    const result = await dialog.showSaveDialog(mainWindow, {
      defaultPath: filename || 'terraform-logs.txt',
      filters: [{ name: 'Text Files', extensions: ['txt', 'log'] }],
    });

    if (result.canceled) {
      return { success: false };
    }

    await logger.saveToFile(logs, result.filePath);
    logger.info(`Logs saved to: ${result.filePath}`);
    return { success: true, path: result.filePath };
  } catch (error) {
    logger.error(`Save logs failed: ${error.message}`);
    return { success: false, error: error.message };
  }
});

// 앱 정보
ipcMain.handle('get-app-info', async () => {
  return {
    name: app.getName(),
    version: app.getVersion(),
    electron: process.versions.electron,
    node: process.versions.node,
  };
});

// AWS CLI 설치 확인 (상세)
ipcMain.handle('check-aws-cli-detailed', async () => {
  try {
    const result = await awsCliInstaller.checkInstallation();
    return result;
  } catch (error) {
    return { installed: false, error: error.message };
  }
});

// AWS CLI 다운로드
ipcMain.handle('download-aws-cli', async (event) => {
  try {
    const onProgress = (progress) => {
      event.sender.send('aws-cli-download-progress', progress);
    };

    const installerPath = await awsCliInstaller.downloadInstaller(onProgress);
    logger.info(`AWS CLI installer downloaded: ${installerPath}`);
    return { success: true, path: installerPath };
  } catch (error) {
    logger.error(`AWS CLI download failed: ${error.message}`);
    return { success: false, error: error.message };
  }
});

// AWS CLI 설치
ipcMain.handle('install-aws-cli', async (event) => {
  try {
    const onLog = (log) => {
      event.sender.send('aws-cli-install-log', {
        ...log,
        timestamp: new Date().toISOString(),
      });
      logger.info(`[AWS CLI Install] ${log.message}`);
    };

    const result = await awsCliInstaller.install(onLog);
    logger.info('AWS CLI installation completed');
    return result;
  } catch (error) {
    logger.error(`AWS CLI installation failed: ${error.message}`);
    return { success: false, error: error.message };
  }
});

// Terraform 변수 파싱
ipcMain.handle('parse-tf-variables', async (event, projectPath) => {
  try {
    const variables = tfvarsParser.getVariablesForUI(projectPath);
    logger.info(`Parsed ${variables.length} Terraform variables`);
    return { success: true, variables };
  } catch (error) {
    logger.error(`Failed to parse variables: ${error.message}`);
    return { success: false, error: error.message };
  }
});

// Terraform 변수 파일 생성
ipcMain.handle('generate-tfvars', async (event, projectPath, variables) => {
  try {
    const success = tfvarsParser.generateTfvarsFile(projectPath, variables);
    if (success) {
      logger.info('terraform.tfvars file generated successfully');
      return { success: true };
    } else {
      throw new Error('Failed to generate tfvars file');
    }
  } catch (error) {
    logger.error(`Failed to generate tfvars: ${error.message}`);
    return { success: false, error: error.message };
  }
});

// 기본값으로 tfvars 생성 (빠른 시작)
ipcMain.handle('copy-example-tfvars', async (event, projectPath) => {
  try {
    const success = tfvarsParser.copyExampleToTfvars(projectPath);
    if (success) {
      logger.info('Copied terraform.tfvars.example to terraform.tfvars');
      return { success: true };
    } else {
      throw new Error('Example file not found or already exists');
    }
  } catch (error) {
    logger.error(`Failed to copy example tfvars: ${error.message}`);
    return { success: false, error: error.message };
  }
});

