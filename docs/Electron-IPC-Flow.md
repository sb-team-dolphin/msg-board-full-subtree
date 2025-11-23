# 🔄 Electron IPC Flow Diagram

> **Terraform Runner의 Electron IPC 통신 흐름도**  
> Main Process, Preload Script, Renderer Process 간의 상호작용을 상세하게 정의합니다.

---

## 📐 Electron 프로세스 구조 개요

```
┌─────────────────────────────────────────────────────────────────────┐
│                        Electron Application                         │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌─────────────────┐         ┌─────────────────┐                  │
│  │  Renderer       │  IPC    │   Main          │                  │
│  │  Process        │ ◄─────► │   Process       │                  │
│  │  (Frontend)     │         │   (Backend)     │                  │
│  └─────────────────┘         └─────────────────┘                  │
│         │                            │                             │
│         │                            │                             │
│         │   ┌─────────────────┐     │                             │
│         └──►│   Preload       │◄────┘                             │
│             │   Script        │                                    │
│             │   (Bridge)      │                                    │
│             └─────────────────┘                                    │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 🏗️ 아키텍처 다이어그램

### 전체 구조

```
┌────────────────────────────────────────────────────────────────────────┐
│                           Renderer Process                             │
│                         (index.html + index.js)                        │
├────────────────────────────────────────────────────────────────────────┤
│                                                                        │
│  • UI 렌더링 (HTML/CSS/JS)                                             │
│  • 사용자 인터랙션 처리                                                 │
│  • window.api를 통한 Main Process 호출                                 │
│  • IPC 이벤트 리스너 등록                                               │
│                                                                        │
└────────────────────────────────────────────────────────────────────────┘
                                   ▲
                                   │ contextBridge
                                   │ (window.api)
                                   ▼
┌────────────────────────────────────────────────────────────────────────┐
│                           Preload Script                               │
│                            (preload.js)                                │
├────────────────────────────────────────────────────────────────────────┤
│                                                                        │
│  • contextBridge로 안전한 API 노출                                      │
│  • Renderer → Main 메시지 전달                                          │
│  • Main → Renderer 이벤트 리스닝                                        │
│  • 보안 경계 (Security Boundary)                                       │
│                                                                        │
└────────────────────────────────────────────────────────────────────────┘
                                   ▲
                                   │ ipcMain / ipcRenderer
                                   │
                                   ▼
┌────────────────────────────────────────────────────────────────────────┐
│                            Main Process                                │
│                              (main.js)                                 │
├────────────────────────────────────────────────────────────────────────┤
│                                                                        │
│  • Electron 앱 생명주기 관리                                            │
│  • BrowserWindow 생성                                                  │
│  • IPC 핸들러 등록 (ipcMain.handle, ipcMain.on)                        │
│  • Services 호출 및 조율                                                │
│  • child_process 실행 (Terraform, AWS CLI)                            │
│                                                                        │
└───────────────────────┬────────────────────────────────────────────────┘
                        │
                        │ require/import
                        │
        ┌───────────────┼───────────────┬──────────────┐
        ▼               ▼               ▼              ▼
┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐
│  unzipper   │ │ aws-config  │ │  tf-runner  │ │   logger    │
│  .js        │ │  .js        │ │  .js        │ │   .js       │
├─────────────┤ ├─────────────┤ ├─────────────┤ ├─────────────┤
│             │ │             │ │             │ │             │
│ • ZIP 압축  │ │ • AWS CLI   │ │ • terraform │ │ • 로그 파일 │
│   해제      │ │   configure │ │   init/plan │ │   저장      │
│ • 파일 검증 │ │   실행      │ │   /apply    │ │ • 타임스탬프│
│ • 임시 폴더 │ │ • 자격증명  │ │ • 실시간    │ │   추가      │
│   관리      │ │   설정      │ │   로그 출력 │ │             │
│             │ │             │ │             │ │             │
└─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘
        │               │               │
        │               │               │
        └───────────────┴───────────────┴─────────────┐
                                                       ▼
                                              ┌─────────────────┐
                                              │  child_process  │
                                              │  (Node.js API)  │
                                              └─────────────────┘
                                                       │
                        ┌──────────────────────────────┼──────────────┐
                        ▼                              ▼              ▼
                ┌──────────────┐            ┌──────────────┐  ┌──────────────┐
                │  terraform   │            │   aws.exe    │  │  File System │
                │  .exe        │            │              │  │              │
                └──────────────┘            └──────────────┘  └──────────────┘
```

---

## 🔄 IPC 통신 플로우

### 1️⃣ ZIP 파일 선택 플로우

```
┌─────────────────┐                                              
│   Renderer      │                                              
└────────┬────────┘                                              
         │ 1. 사용자가 "ZIP 파일 선택" 버튼 클릭                   
         │                                                        
         │ 2. window.api.selectZipFile() 호출                    
         ▼                                                        
┌─────────────────┐                                              
│   Preload       │                                              
└────────┬────────┘                                              
         │ 3. ipcRenderer.invoke('select-zip-file')             
         ▼                                                        
┌─────────────────────────────────────────────────┐              
│   Main Process                                  │              
│                                                 │              
│   ipcMain.handle('select-zip-file', async () => {             
│     const result = await dialog.showOpenDialog({              
│       filters: [{ name: 'ZIP', extensions: ['zip'] }]         
│     });                                                        
│     if (!result.canceled) {                                   
│       return { success: true, path: result.filePaths[0] };    
│     }                                                          
│   });                                                          
│                                                 │              
└────────┬────────────────────────────────────────┘              
         │ 4. return { success: true, path: "..." }             
         ▼                                                        
┌─────────────────┐                                              
│   Preload       │                                              
└────────┬────────┘                                              
         │ 5. Promise resolves                                  
         ▼                                                        
┌─────────────────┐                                              
│   Renderer      │                                              
└────────┬────────┘                                              
         │ 6. UI 업데이트: 선택된 파일 경로 표시                   
         │                                                        
         │ 7. window.api.extractZip(zipPath) 호출                
         ▼                                                        
┌─────────────────┐                                              
│   Preload       │                                              
└────────┬────────┘                                              
         │ 8. ipcRenderer.invoke('extract-zip', zipPath)        
         ▼                                                        
┌─────────────────────────────────────────────────┐              
│   Main Process                                  │              
│                                                 │              
│   ipcMain.handle('extract-zip', async (_, path) => {          
│     const extractor = require('./services/unzipper');         
│     return await extractor.extractZip(path);                  
│   });                                                          
│                                                 │              
└────────┬────────────────────────────────────────┘              
         │ 9. call unzipper.js                                  
         ▼                                                        
┌─────────────────────────────────────────────────┐              
│   unzipper.js                                   │              
│                                                 │              
│   async extractZip(zipPath) {                                 
│     // ZIP 압축 해제                                           
│     const extractPath = './temp/project';                     
│     await extract(zipPath, extractPath);                      
│     // .tf 파일 검증                                           
│     const tfFiles = findTfFiles(extractPath);                 
│     if (tfFiles.length === 0) {                               
│       throw new Error('No .tf files found');                  
│     }                                                          
│     return {                                                   
│       success: true,                                          
│       extractPath,                                            
│       tfFiles                                                 
│     };                                                         
│   }                                                            
│                                                 │              
└────────┬────────────────────────────────────────┘              
         │ 10. return result                                    
         ▼                                                        
┌─────────────────┐                                              
│   Main Process  │                                              
└────────┬────────┘                                              
         │ 11. return to Renderer                               
         ▼                                                        
┌─────────────────┐                                              
│   Renderer      │                                              
└────────┬────────┘                                              
         │ 12. UI 업데이트: ✅ ZIP Import 완료                    
         │     발견된 .tf 파일 수 표시                            
         ▼                                                        
```

**IPC 메시지**

| Direction | Channel | Data |
|-----------|---------|------|
| Renderer → Main | `select-zip-file` | none |
| Main → Renderer | return | `{ success: boolean, path: string }` |
| Renderer → Main | `extract-zip` | `{ zipPath: string }` |
| Main → Renderer | return | `{ success: boolean, extractPath: string, tfFiles: string[] }` |

---

### 2️⃣ AWS Credentials 설정 플로우

```
┌─────────────────┐
│   Renderer      │
└────────┬────────┘
         │ 1. 사용자가 AWS Credentials 입력 완료
         │
         │ 2. window.api.configureAWS({
         │      accessKey: "...",
         │      secretKey: "...",
         │      region: "ap-northeast-2"
         │    })
         ▼
┌─────────────────┐
│   Preload       │
└────────┬────────┘
         │ 3. ipcRenderer.invoke('configure-aws', credentials)
         ▼
┌─────────────────────────────────────────────────┐
│   Main Process                                  │
│                                                 │
│   ipcMain.handle('configure-aws',              │
│     async (_, credentials) => {                │
│       const awsConfig = require('./services/aws-config');
│       return await awsConfig.configure(credentials);
│     }                                           │
│   );                                            │
│                                                 │
└────────┬────────────────────────────────────────┘
         │ 4. call aws-config.js
         ▼
┌─────────────────────────────────────────────────┐
│   aws-config.js                                 │
│                                                 │
│   async configure(credentials) {                │
│     const { spawn } = require('child_process'); │
│                                                 │
│     // aws configure set 명령 실행              │
│     await execCommand('aws configure set       │
│       aws_access_key_id ' + credentials.accessKey);
│     await execCommand('aws configure set       │
│       aws_secret_access_key ' + credentials.secretKey);
│     await execCommand('aws configure set       │
│       region ' + credentials.region);          │
│                                                 │
│     // 검증: aws sts get-caller-identity       │
│     const result = await execCommand(          │
│       'aws sts get-caller-identity'            │
│     );                                          │
│                                                 │
│     if (result.exitCode === 0) {               │
│       return { success: true };                │
│     } else {                                    │
│       return {                                  │
│         success: false,                         │
│         error: 'Invalid credentials'           │
│       };                                        │
│     }                                           │
│   }                                             │
│                                                 │
└────────┬────────────────────────────────────────┘
         │ 5. return result
         ▼
┌─────────────────┐
│   Main Process  │
└────────┬────────┘
         │ 6. return to Renderer
         ▼
┌─────────────────┐
│   Renderer      │
└────────┬────────┘
         │ 7. UI 업데이트:
         │    성공 → ✅ AWS Configure 완료
         │    실패 → ❌ 오류 메시지 표시
         ▼
```

**IPC 메시지**

| Direction | Channel | Data |
|-----------|---------|------|
| Renderer → Main | `configure-aws` | `{ accessKey: string, secretKey: string, region: string }` |
| Main → Renderer | return | `{ success: boolean, error?: string }` |

---

### 3️⃣ Terraform Init/Plan/Apply 실행 플로우

```
┌─────────────────┐
│   Renderer      │
└────────┬────────┘
         │ 1. "시작하기" 버튼 클릭
         │
         │ 2. window.api.runTerraform('init', projectPath)
         ▼
┌─────────────────┐
│   Preload       │
└────────┬────────┘
         │ 3. ipcRenderer.invoke('run-terraform', 'init', path)
         ▼
┌─────────────────────────────────────────────────────────┐
│   Main Process                                          │
│                                                         │
│   ipcMain.handle('run-terraform',                      │
│     async (event, command, projectPath) => {           │
│       const tfRunner = require('./services/tf-runner');│
│                                                         │
│       // Renderer에게 실시간 로그 전송 설정             │
│       const onLog = (log) => {                         │
│         event.sender.send('terraform-log', log);       │
│       };                                                │
│                                                         │
│       return await tfRunner.run(                       │
│         command,                                        │
│         projectPath,                                    │
│         onLog                                           │
│       );                                                │
│     }                                                   │
│   );                                                    │
│                                                         │
└────────┬────────────────────────────────────────────────┘
         │ 4. call tf-runner.js
         ▼
┌─────────────────────────────────────────────────────────┐
│   tf-runner.js                                          │
│                                                         │
│   async run(command, projectPath, onLog) {             │
│     const { spawn } = require('child_process');        │
│     const path = require('path');                      │
│                                                         │
│     // Terraform 실행 파일 경로                         │
│     const terraformPath = path.join(                   │
│       process.resourcesPath,                           │
│       'bin',                                            │
│       'terraform.exe'                                   │
│     );                                                  │
│                                                         │
│     return new Promise((resolve, reject) => {          │
│       const proc = spawn(terraformPath, [command], {   │
│         cwd: projectPath,                              │
│         shell: true                                     │
│       });                                               │
│                                                         │
│       // stdout 실시간 전송                             │
│       proc.stdout.on('data', (data) => {               │
│         const log = data.toString();                   │
│         onLog({ type: 'info', message: log });         │
│       });                                               │
│                                                         │
│       // stderr 실시간 전송                             │
│       proc.stderr.on('data', (data) => {               │
│         const log = data.toString();                   │
│         onLog({ type: 'error', message: log });        │
│       });                                               │
│                                                         │
│       // 프로세스 종료 처리                             │
│       proc.on('close', (code) => {                     │
│         if (code === 0) {                              │
│           resolve({ success: true, exitCode: code });  │
│         } else {                                        │
│           reject({                                      │
│             success: false,                            │
│             exitCode: code,                            │
│             error: `Process exited with code ${code}`  │
│           });                                           │
│         }                                               │
│       });                                               │
│     });                                                 │
│   }                                                     │
│                                                         │
└────────┬────────────────────────────────────────────────┘
         │ 5. 실시간 로그 이벤트 발생
         ▼
┌─────────────────┐
│   Main Process  │
└────────┬────────┘
         │ 6. event.sender.send('terraform-log', log)
         ▼
┌─────────────────┐
│   Preload       │
└────────┬────────┘
         │ 7. ipcRenderer.on('terraform-log')
         ▼
┌─────────────────┐
│   Renderer      │
└────────┬────────┘
         │ 8. UI 업데이트:
         │    - 로그 창에 실시간 추가
         │    - 프로그레스 바 업데이트
         │    - 현재 단계 상태 변경
         ▼
         
         (프로세스 완료 후)
         
┌─────────────────┐
│   Main Process  │
└────────┬────────┘
         │ 9. return { success: true, exitCode: 0 }
         ▼
┌─────────────────┐
│   Renderer      │
└────────┬────────┘
         │ 10. UI 업데이트:
         │     ✅ terraform init 완료
         │
         │ 11. 다음 단계 자동 실행:
         │     window.api.runTerraform('plan', projectPath)
         ▼
         
         (plan 완료 후)
         
┌─────────────────┐
│   Renderer      │
└────────┬────────┘
         │ 12. Plan 결과 파싱 및 표시
         │     - 생성/변경/삭제 리소스 수
         │     - "Apply 실행" 버튼 활성화
         │
         │ 13. 사용자가 "Apply 실행" 클릭
         │     window.api.runTerraform('apply', projectPath)
         ▼
         
         (apply 완료 후)
         
┌─────────────────┐
│   Renderer      │
└────────┬────────┘
         │ 14. ✅ 모든 단계 완료
         │     - Terraform outputs 표시
         │     - 완료 화면으로 전환
         ▼
```

**IPC 메시지**

| Direction | Channel | Data |
|-----------|---------|------|
| Renderer → Main | `run-terraform` | `{ command: 'init'|'plan'|'apply', projectPath: string }` |
| Main → Renderer | `terraform-log` (event) | `{ type: 'info'|'error', message: string, timestamp: string }` |
| Main → Renderer | return | `{ success: boolean, exitCode: number, error?: string }` |

---

## 📋 전체 IPC 채널 목록

### Invoke/Handle 방식 (요청-응답)

| Channel Name | Direction | Parameters | Return Value | 설명 |
|-------------|-----------|------------|--------------|------|
| `select-zip-file` | R→M | none | `{ success: boolean, path?: string }` | 파일 선택 다이얼로그 |
| `extract-zip` | R→M | `{ zipPath: string }` | `{ success: boolean, extractPath?: string, tfFiles?: string[] }` | ZIP 압축 해제 |
| `configure-aws` | R→M | `{ accessKey, secretKey, region }` | `{ success: boolean, error?: string }` | AWS 자격증명 설정 |
| `run-terraform` | R→M | `{ command: string, projectPath: string }` | `{ success: boolean, exitCode: number, output?: string }` | Terraform 명령 실행 |
| `check-aws-cli` | R→M | none | `{ installed: boolean, version?: string }` | AWS CLI 설치 확인 |
| `check-terraform` | R→M | none | `{ available: boolean, version?: string }` | Terraform 사용 가능 여부 |
| `get-temp-dir` | R→M | none | `{ path: string }` | 임시 디렉터리 경로 |
| `cleanup-temp` | R→M | none | `{ success: boolean }` | 임시 파일 정리 |
| `save-logs` | R→M | `{ logs: string[], filename: string }` | `{ success: boolean, path?: string }` | 로그 파일로 저장 |

### Event 방식 (단방향 알림)

| Channel Name | Direction | Data | 설명 |
|-------------|-----------|------|------|
| `terraform-log` | M→R | `{ type: 'info'|'error'|'warning', message: string, timestamp: string }` | 실시간 Terraform 로그 |
| `progress-update` | M→R | `{ step: string, progress: number }` | 진행률 업데이트 |
| `step-complete` | M→R | `{ step: string, success: boolean }` | 단계 완료 알림 |
| `error-occurred` | M→R | `{ error: string, details?: any }` | 오류 발생 알림 |

*R = Renderer, M = Main*

---

## 📄 preload.js 상세 코드

```javascript
const { contextBridge, ipcRenderer } = require('electron');

// Renderer에 노출할 API 정의
contextBridge.exposeInMainWorld('api', {
  // ZIP 파일 관련
  selectZipFile: () => ipcRenderer.invoke('select-zip-file'),
  extractZip: (zipPath) => ipcRenderer.invoke('extract-zip', zipPath),

  // AWS 설정
  configureAWS: (credentials) => 
    ipcRenderer.invoke('configure-aws', credentials),
  checkAWSCli: () => ipcRenderer.invoke('check-aws-cli'),

  // Terraform 실행
  runTerraform: (command, projectPath) => 
    ipcRenderer.invoke('run-terraform', command, projectPath),
  checkTerraform: () => ipcRenderer.invoke('check-terraform'),

  // 파일 시스템
  getTempDir: () => ipcRenderer.invoke('get-temp-dir'),
  cleanupTemp: () => ipcRenderer.invoke('cleanup-temp'),

  // 로그
  saveLogs: (logs, filename) => 
    ipcRenderer.invoke('save-logs', logs, filename),

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

  // 이벤트 리스너 제거
  removeListener: (channel, callback) => {
    ipcRenderer.removeListener(channel, callback);
  }
});
```

---

## 📄 main.js IPC 핸들러

```javascript
const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');

// Services
const unzipper = require('./services/unzipper');
const awsConfig = require('./services/aws-config');
const tfRunner = require('./services/tf-runner');
const logger = require('./services/logger');

let mainWindow;

// ============================================
// IPC Handlers
// ============================================

// ZIP 파일 선택
ipcMain.handle('select-zip-file', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openFile'],
    filters: [{ name: 'ZIP Files', extensions: ['zip'] }]
  });

  if (result.canceled) {
    return { success: false };
  }

  return { success: true, path: result.filePaths[0] };
});

// ZIP 압축 해제
ipcMain.handle('extract-zip', async (event, zipPath) => {
  try {
    const result = await unzipper.extractZip(zipPath);
    logger.info(`ZIP extracted: ${result.extractPath}`);
    return result;
  } catch (error) {
    logger.error(`Extract failed: ${error.message}`);
    return { success: false, error: error.message };
  }
});

// AWS 설정
ipcMain.handle('configure-aws', async (event, credentials) => {
  try {
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
    // 실시간 로그 전송 콜백
    const onLog = (log) => {
      event.sender.send('terraform-log', {
        ...log,
        timestamp: new Date().toISOString()
      });
      logger.info(log.message);
    };

    // 진행률 업데이트 콜백
    const onProgress = (progress) => {
      event.sender.send('progress-update', progress);
    };

    const result = await tfRunner.run(
      command,
      projectPath,
      onLog,
      onProgress
    );

    // 단계 완료 알림
    event.sender.send('step-complete', {
      step: command,
      success: result.success
    });

    return result;
  } catch (error) {
    logger.error(`Terraform ${command} failed: ${error.message}`);
    
    // 오류 알림
    event.sender.send('error-occurred', {
      step: command,
      error: error.message
    });

    return { success: false, error: error.message };
  }
});

// Terraform 확인
ipcMain.handle('check-terraform', async () => {
  try {
    const terraformPath = path.join(
      process.resourcesPath,
      'bin',
      'terraform.exe'
    );
    const version = await tfRunner.getVersion(terraformPath);
    return { available: true, version };
  } catch (error) {
    return { available: false };
  }
});

// 임시 디렉터리
ipcMain.handle('get-temp-dir', async () => {
  return { path: path.join(app.getPath('temp'), 'terraform-runner') };
});

// 임시 파일 정리
ipcMain.handle('cleanup-temp', async () => {
  try {
    await unzipper.cleanup();
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// 로그 저장
ipcMain.handle('save-logs', async (event, logs, filename) => {
  try {
    const result = await dialog.showSaveDialog(mainWindow, {
      defaultPath: filename || 'terraform-logs.txt',
      filters: [{ name: 'Text Files', extensions: ['txt'] }]
    });

    if (result.canceled) {
      return { success: false };
    }

    await logger.saveToFile(logs, result.filePath);
    return { success: true, path: result.filePath };
  } catch (error) {
    return { success: false, error: error.message };
  }
});
```

---

## 📄 renderer/index.js 사용 예시

```javascript
// DOM 로드 완료 후
document.addEventListener('DOMContentLoaded', () => {
  
  // ============================================
  // ZIP 파일 선택
  // ============================================
  const selectZipBtn = document.getElementById('select-zip-btn');
  selectZipBtn.addEventListener('click', async () => {
    const result = await window.api.selectZipFile();
    
    if (result.success) {
      // UI 업데이트
      document.getElementById('zip-path').textContent = result.path;
      
      // ZIP 압축 해제
      const extractResult = await window.api.extractZip(result.path);
      
      if (extractResult.success) {
        console.log(`Found ${extractResult.tfFiles.length} .tf files`);
        updateStepStatus('zip-import', 'completed');
      }
    }
  });

  // ============================================
  // AWS 설정
  // ============================================
  const configureAwsBtn = document.getElementById('configure-aws-btn');
  configureAwsBtn.addEventListener('click', async () => {
    const credentials = {
      accessKey: document.getElementById('access-key').value,
      secretKey: document.getElementById('secret-key').value,
      region: document.getElementById('region').value
    };

    const result = await window.api.configureAWS(credentials);
    
    if (result.success) {
      updateStepStatus('aws-config', 'completed');
    } else {
      showError('AWS 설정 실패: ' + result.error);
    }
  });

  // ============================================
  // Terraform 실행
  // ============================================
  const startBtn = document.getElementById('start-btn');
  startBtn.addEventListener('click', async () => {
    const projectPath = document.getElementById('project-path').value;

    try {
      // Init
      updateStepStatus('terraform-init', 'in-progress');
      await window.api.runTerraform('init', projectPath);
      updateStepStatus('terraform-init', 'completed');

      // Plan
      updateStepStatus('terraform-plan', 'in-progress');
      const planResult = await window.api.runTerraform('plan', projectPath);
      updateStepStatus('terraform-plan', 'completed');

      // Apply 승인 대기
      showApplyConfirmation(planResult);

    } catch (error) {
      showError('실행 실패: ' + error.message);
    }
  });

  // ============================================
  // 실시간 로그 수신
  // ============================================
  window.api.onTerraformLog((log) => {
    const logContainer = document.getElementById('log-output');
    const logLine = document.createElement('div');
    logLine.className = `log-line log-${log.type}`;
    logLine.textContent = `[${log.timestamp}] ${log.message}`;
    logContainer.appendChild(logLine);
    
    // 자동 스크롤
    logContainer.scrollTop = logContainer.scrollHeight;
  });

  // ============================================
  // 진행률 업데이트
  // ============================================
  window.api.onProgressUpdate((progress) => {
    const progressBar = document.getElementById('progress-bar');
    progressBar.style.width = `${progress.progress}%`;
  });

  // ============================================
  // 단계 완료 알림
  // ============================================
  window.api.onStepComplete((data) => {
    updateStepStatus(data.step, data.success ? 'completed' : 'error');
  });

  // ============================================
  // 오류 알림
  // ============================================
  window.api.onError((error) => {
    showError(`${error.step} 단계 오류: ${error.error}`);
  });
});

// ============================================
// 유틸리티 함수
// ============================================

function updateStepStatus(step, status) {
  const stepElement = document.getElementById(`step-${step}`);
  stepElement.className = `step step-${status}`;
  
  const icons = {
    'pending': '⏸️',
    'in-progress': '🔄',
    'completed': '✅',
    'error': '❌'
  };
  
  stepElement.querySelector('.icon').textContent = icons[status];
}

function showError(message) {
  const errorDiv = document.createElement('div');
  errorDiv.className = 'error-message';
  errorDiv.textContent = message;
  document.getElementById('error-container').appendChild(errorDiv);
}

function showApplyConfirmation(planResult) {
  const modal = document.getElementById('apply-modal');
  document.getElementById('resources-to-create').textContent = 
    planResult.toCreate;
  document.getElementById('resources-to-change').textContent = 
    planResult.toChange;
  modal.style.display = 'block';
}
```

---

## 🔒 보안 고려사항

### contextBridge 사용
- **목적**: Renderer에서 Main의 기능을 안전하게 호출
- **장점**: 직접 Node.js API 노출 방지

### 입력 검증
```javascript
// Main Process에서 모든 입력 검증
ipcMain.handle('extract-zip', async (event, zipPath) => {
  // 경로 검증
  if (!zipPath || typeof zipPath !== 'string') {
    return { success: false, error: 'Invalid path' };
  }
  
  // 파일 존재 확인
  if (!fs.existsSync(zipPath)) {
    return { success: false, error: 'File not found' };
  }
  
  // ZIP 파일인지 확인
  if (!zipPath.endsWith('.zip')) {
    return { success: false, error: 'Not a ZIP file' };
  }
  
  // 처리...
});
```

### 자격증명 처리
- **저장하지 않음**: AWS credentials를 디스크에 저장하지 않음
- **메모리에만 존재**: 실행 중에만 유지
- **로그 마스킹**: 로그에서 자격증명 정보 제거

---

## 🎯 오류 처리 플로우

```
┌─────────────────┐
│   Renderer      │
│   (try/catch)   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   Preload       │
│   (pass-through)│
└────────┬────────┘
         │
         ▼
┌─────────────────────────────────┐
│   Main Process                  │
│                                 │
│   try {                         │
│     // Service 실행              │
│   } catch (error) {             │
│     logger.error(error);        │
│     return {                    │
│       success: false,           │
│       error: error.message      │
│     };                           │
│   }                              │
│                                 │
└────────┬────────────────────────┘
         │
         ▼
┌─────────────────┐
│   Service       │
│   (throw Error) │
└────────┬────────┘
         │
         ▼
     [Logger]
     [Error Modal]
     [Sentry 등 에러 추적 서비스]
```

---

## 📊 성능 최적화

### 대용량 로그 처리
```javascript
// 로그 버퍼링 (0.1초마다 배치 전송)
let logBuffer = [];
let bufferTimer = null;

const onLog = (log) => {
  logBuffer.push(log);
  
  if (!bufferTimer) {
    bufferTimer = setTimeout(() => {
      event.sender.send('terraform-log-batch', logBuffer);
      logBuffer = [];
      bufferTimer = null;
    }, 100);
  }
};
```

### 장시간 실행 작업
```javascript
// 타임아웃 설정
const runWithTimeout = (fn, timeout = 300000) => {
  return Promise.race([
    fn(),
    new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Timeout')), timeout)
    )
  ]);
};
```

---

## 🧪 테스트 시나리오

### IPC 통신 테스트

```javascript
// Renderer에서 테스트
async function testIPCFlow() {
  console.log('1. Testing ZIP selection...');
  const zipResult = await window.api.selectZipFile();
  console.assert(zipResult.success, 'ZIP selection failed');

  console.log('2. Testing ZIP extraction...');
  const extractResult = await window.api.extractZip(zipResult.path);
  console.assert(extractResult.success, 'ZIP extraction failed');

  console.log('3. Testing AWS configuration...');
  const awsResult = await window.api.configureAWS({
    accessKey: 'test',
    secretKey: 'test',
    region: 'ap-northeast-2'
  });
  console.assert(awsResult.success, 'AWS config failed');

  console.log('All IPC tests passed!');
}
```

---

## 📝 참고 자료

### Electron IPC 문서
- [IPC Tutorial](https://www.electronjs.org/docs/latest/tutorial/ipc)
- [Context Bridge](https://www.electronjs.org/docs/latest/api/context-bridge)
- [Security Best Practices](https://www.electronjs.org/docs/latest/tutorial/security)

### 아키텍처 패턴
- **Request-Response**: `ipcRenderer.invoke()` + `ipcMain.handle()`
- **Event Emitter**: `event.sender.send()` + `ipcRenderer.on()`
- **Bridge Pattern**: `contextBridge.exposeInMainWorld()`

---

*본 문서는 Terraform Runner의 IPC 통신 구조를 정의합니다.*  
*실제 구현 시 프로젝트 요구사항에 맞게 조정 가능합니다.*

