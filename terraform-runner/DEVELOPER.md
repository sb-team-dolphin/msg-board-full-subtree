# 개발자 가이드

Terraform Runner 프로젝트 개발을 위한 상세 가이드입니다.

## 🏗️ 프로젝트 아키텍처

### Electron 프로세스 구조

```
┌─────────────────────────────────────┐
│       Renderer Process              │
│    (renderer/index.js)              │
│                                     │
│  - UI 렌더링                        │
│  - 사용자 인터랙션                  │
│  - window.api를 통한 IPC 호출       │
└──────────────┬──────────────────────┘
               │ contextBridge
               ▼
┌─────────────────────────────────────┐
│       Preload Script                │
│       (src/preload.js)              │
│                                     │
│  - 안전한 API 노출                  │
│  - IPC 통신 중계                    │
└──────────────┬──────────────────────┘
               │ ipcMain/ipcRenderer
               ▼
┌─────────────────────────────────────┐
│       Main Process                  │
│       (src/main.js)                 │
│                                     │
│  - 앱 생명주기 관리                 │
│  - IPC 핸들러                       │
│  - Services 조율                    │
└──────────────┬──────────────────────┘
               │
        ┌──────┴──────┬─────────┐
        ▼             ▼         ▼
    unzipper    aws-config  tf-runner
```

## 📂 디렉터리 구조

```
terraform-runner/
├─ src/                         # Main Process (백엔드)
│  ├─ main.js                  # 진입점, IPC 핸들러
│  ├─ preload.js               # Preload 스크립트
│  └─ services/                # 비즈니스 로직
│     ├─ unzipper.js           # ZIP 압축 해제
│     ├─ aws-config.js         # AWS CLI 설정
│     ├─ tf-runner.js          # Terraform 실행
│     └─ logger.js             # 로깅 시스템
│
├─ renderer/                    # Renderer Process (프론트엔드)
│  ├─ index.html               # UI 구조
│  ├─ index.js                 # UI 로직
│  └─ style.css                # 스타일
│
├─ bin/                         # 바이너리 파일
│  └─ terraform.exe            # Terraform (사용자 추가)
│
├─ assets/                      # 리소스
│  ├─ icon.png                 # 앱 아이콘
│  └─ icon.ico                 # Windows 아이콘
│
├─ docs/                        # 문서
│  ├─ prd.md                   # 제품 요구사항
│  ├─ Electron-IPC-Flow.md     # IPC 통신 플로우
│  └─ UI-Mockup.md             # UI 설계
│
├─ temp/                        # 임시 파일 (런타임)
│  └─ project/                 # 압축 해제된 프로젝트
│
└─ dist/                        # 빌드 결과물
   └─ terraform-runner Setup.exe
```

## 🔧 주요 컴포넌트

### Main Process (src/main.js)

**역할**: Electron 앱 생명주기 관리 및 IPC 핸들러

```javascript
// 주요 IPC 채널
- select-zip-file    : 파일 선택 다이얼로그
- extract-zip        : ZIP 압축 해제
- configure-aws      : AWS 설정
- run-terraform      : Terraform 명령 실행
- check-aws-cli      : AWS CLI 버전 확인
- check-terraform    : Terraform 버전 확인
```

### Services

#### unzipper.js
- ZIP 파일 압축 해제
- .tf 파일 검색
- 임시 디렉터리 관리

#### aws-config.js
- AWS CLI 명령 실행
- 자격증명 검증
- 버전 확인

#### tf-runner.js
- Terraform 명령 실행
- 실시간 로그 스트리밍
- 진행률 파싱

#### logger.js
- 콘솔 및 파일 로깅
- 로그 레벨 관리
- 로그 저장

### Renderer Process (renderer/index.js)

**역할**: UI 렌더링 및 사용자 인터랙션

```javascript
// 주요 함수
- showScreen()           : 화면 전환
- addLog()              : 로그 추가
- updateStepStatus()    : 단계 상태 업데이트
- updateProgress()      : 진행률 업데이트
- runTerraformWorkflow() : Terraform 워크플로우 실행
```

## 🔌 IPC 통신

### Request-Response (invoke/handle)

```javascript
// Renderer에서 요청
const result = await window.api.selectZipFile();

// Main에서 응답
ipcMain.handle('select-zip-file', async () => {
  // ... 로직
  return { success: true, path: '...' };
});
```

### Event (send/on)

```javascript
// Main에서 이벤트 발송
event.sender.send('terraform-log', {
  type: 'info',
  message: 'Initializing...'
});

// Renderer에서 수신
window.api.onTerraformLog((log) => {
  addLog(log.type, log.message);
});
```

## 🎨 UI 상태 관리

### State Object

```javascript
const state = {
  zipPath: null,           // ZIP 파일 경로
  extractPath: null,       // 추출된 경로
  tfFiles: [],            // .tf 파일 목록
  credentials: {},        // AWS 자격증명
  logs: [],               // 로그 배열
  startTime: null,        // 시작 시간
  endTime: null,          // 종료 시간
  planResult: null,       // Plan 결과
  applyResult: null       // Apply 결과
};
```

### Screen Management

```javascript
// 화면 ID
- setup-screen      : 초기 설정 화면
- execution-screen  : 실행 화면
- plan-screen       : Plan 확인 화면
- complete-screen   : 완료 화면
```

## 🧪 개발 및 디버깅

### 개발 모드 실행

```bash
npm run dev
```

개발 모드에서는:
- DevTools 자동 열림
- Hot reload 비활성화 (Electron 특성)
- `bin/terraform.exe` 사용

### 로깅

```javascript
// Main Process (콘솔)
console.log('Message');

// Renderer Process (DevTools)
console.log('Message');

// Logger 서비스
logger.info('Message');
logger.error('Error');
```

### 디버깅 팁

1. **Main Process 디버깅**
   - VS Code: `F5` (launch.json 설정 필요)
   - Console.log 사용

2. **Renderer Process 디버깅**
   - DevTools 사용 (자동 열림)
   - React DevTools 미사용 (Vanilla JS)

3. **IPC 통신 디버깅**
   ```javascript
   // Renderer
   console.log('Calling API:', 'select-zip-file');
   const result = await window.api.selectZipFile();
   console.log('Result:', result);
   ```

## 📦 빌드 프로세스

### 1. 개발 빌드

```bash
npm run dev
```

### 2. 프로덕션 빌드

```bash
npm run build:win
```

**결과물**:
- `dist/terraform-runner Setup.exe` - 설치 파일
- `dist/win-unpacked/` - 언패킹된 파일

### 3. Electron Builder 설정

```json
{
  "build": {
    "appId": "com.terraform.runner",
    "win": {
      "target": ["nsis"]
    },
    "extraResources": [
      {
        "from": "bin/",
        "to": "bin/"
      }
    ]
  }
}
```

## 🔐 보안 고려사항

### 1. Context Isolation

```javascript
// preload.js
contextBridge.exposeInMainWorld('api', {
  // 안전한 API만 노출
});
```

### 2. Node Integration 비활성화

```javascript
// main.js
webPreferences: {
  nodeIntegration: false,  // ✓
  contextIsolation: true   // ✓
}
```

### 3. 입력 검증

```javascript
// Main Process에서 모든 입력 검증
ipcMain.handle('extract-zip', async (event, zipPath) => {
  if (!zipPath || typeof zipPath !== 'string') {
    return { success: false, error: 'Invalid path' };
  }
  // ...
});
```

## 🐛 일반적인 문제 해결

### 1. Terraform 실행 파일을 찾을 수 없음

**원인**: `bin/terraform.exe` 파일 누락

**해결**:
```bash
# bin/terraform.exe 추가
```

### 2. AWS CLI 명령 실패

**원인**: AWS CLI 미설치 또는 PATH 설정 안 됨

**해결**:
```bash
# AWS CLI 설치 확인
aws --version

# PATH에 추가 (필요시)
```

### 3. IPC 통신 오류

**원인**: preload.js가 로드되지 않음

**해결**:
```javascript
// main.js에서 경로 확인
preload: path.join(__dirname, 'preload.js')
```

## 📚 참고 자료

### Electron 문서
- [Electron 공식 문서](https://www.electronjs.org/docs)
- [IPC 튜토리얼](https://www.electronjs.org/docs/latest/tutorial/ipc)
- [Context Bridge](https://www.electronjs.org/docs/latest/api/context-bridge)

### Terraform 문서
- [Terraform CLI 문서](https://www.terraform.io/cli)
- [Terraform Commands](https://www.terraform.io/cli/commands)

### Node.js 문서
- [child_process](https://nodejs.org/api/child_process.html)
- [File System](https://nodejs.org/api/fs.html)

## 🤝 기여하기

[CONTRIBUTING.md](CONTRIBUTING.md) 파일을 참조하세요.

## 📞 도움이 필요하신가요?

GitHub Issues에 질문을 남겨주세요!

---

**Happy Coding! 🚀**

