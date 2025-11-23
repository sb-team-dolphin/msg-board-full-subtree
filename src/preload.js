const { contextBridge, ipcRenderer } = require('electron');

// Renderer에 노출할 API 정의
contextBridge.exposeInMainWorld('api', {
  // ZIP 파일 관련
  selectZipFile: () => ipcRenderer.invoke('select-zip-file'),
  extractZip: (zipPath) => ipcRenderer.invoke('extract-zip', zipPath),

  // AWS 설정
  configureAWS: (credentials) => ipcRenderer.invoke('configure-aws', credentials),
  checkAWSCli: () => ipcRenderer.invoke('check-aws-cli'),
  checkAWSCliDetailed: () => ipcRenderer.invoke('check-aws-cli-detailed'),
  downloadAWSCli: () => ipcRenderer.invoke('download-aws-cli'),
  installAWSCli: () => ipcRenderer.invoke('install-aws-cli'),

  // Terraform 실행
  runTerraform: (command, projectPath) => ipcRenderer.invoke('run-terraform', command, projectPath),
  checkTerraform: () => ipcRenderer.invoke('check-terraform'),

  // Terraform 변수
  parseTfVariables: (projectPath) => ipcRenderer.invoke('parse-tf-variables', projectPath),
  generateTfvars: (projectPath, variables) => ipcRenderer.invoke('generate-tfvars', projectPath, variables),
  copyExampleTfvars: (projectPath) => ipcRenderer.invoke('copy-example-tfvars', projectPath),

  // 파일 시스템
  getTempDir: () => ipcRenderer.invoke('get-temp-dir'),
  cleanupTemp: () => ipcRenderer.invoke('cleanup-temp'),

  // 로그
  saveLogs: (logs, filename) => ipcRenderer.invoke('save-logs', logs, filename),

  // 앱 정보
  getAppInfo: () => ipcRenderer.invoke('get-app-info'),

  // 이벤트 리스너 (Main → Renderer)
  onTerraformLog: (callback) => {
    ipcRenderer.on('terraform-log', (event, data) => callback(data));
  },
  onProgressUpdate: (callback) => {
    ipcRenderer.on('progress-update', (event, data) => callback(data));
  },
  onStepComplete: (callback) => {
    ipcRenderer.on('step-complete', (event, data) => callback(data));
  },
  onError: (callback) => {
    ipcRenderer.on('error-occurred', (event, data) => callback(data));
  },
  onAWSCliDownloadProgress: (callback) => {
    ipcRenderer.on('aws-cli-download-progress', (event, data) => callback(data));
  },
  onAWSCliInstallLog: (callback) => {
    ipcRenderer.on('aws-cli-install-log', (event, data) => callback(data));
  },

  // 이벤트 리스너 제거
  removeListener: (channel, callback) => {
    ipcRenderer.removeListener(channel, callback);
  },
});

