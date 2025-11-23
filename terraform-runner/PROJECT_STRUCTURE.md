# 📁 프로젝트 구조

Terraform Runner 프로젝트의 전체 파일 구조입니다.

```
terraform-runner/
│
├─ 📁 src/                              # Main Process (백엔드)
│  ├─ 📄 main.js                        # Electron 메인 진입점, IPC 핸들러
│  ├─ 📄 preload.js                     # Preload 스크립트, contextBridge
│  └─ 📁 services/                      # 비즈니스 로직 모듈
│     ├─ 📄 unzipper.js                 # ZIP 압축 해제 및 .tf 파일 검색 (중첩 구조 지원)
│     ├─ 📄 aws-config.js               # AWS 자격증명 메모리 관리 및 환경변수 전달 🔒
│     ├─ 📄 aws-cli-installer.js        # AWS CLI 자동 다운로드 및 설치
│     ├─ 📄 tf-runner.js                # Terraform 명령 실행, ANSI 로그 파싱
│     ├─ 📄 tfvars-parser.js            # variables.tf 파싱 및 tfvars 생성 ✨
│     └─ 📄 logger.js                   # 로깅 시스템
│
├─ 📁 renderer/                         # Renderer Process (프론트엔드)
│  ├─ 📄 index.html                     # UI HTML 구조
│  ├─ 📄 index.js                       # UI 로직 및 이벤트 핸들러
│  └─ 📄 style.css                      # 스타일시트 (Tailwind 스타일)
│
├─ 📁 bin/                               # 실행 파일
│  ├─ 📄 README.md                      # Terraform 설치 가이드
│  └─ ⚙️ terraform.exe                  # Terraform 실행 파일 (사용자 추가)
│
├─ 📁 assets/                            # 앱 리소스
│  ├─ 📄 README.md                      # 아이콘 가이드
│  ├─ 🖼️ icon.png                       # 앱 아이콘 (256x256)
│  └─ 🖼️ icon.ico                       # Windows 아이콘
│
├─ 📁 docs/                              # 프로젝트 문서
│  ├─ 📄 prd.md                         # 제품 요구사항 문서 (PRD)
│  ├─ 📄 Electron-IPC-Flow.md           # IPC 통신 플로우 다이어그램
│  ├─ 📄 UI-Mockup.md                   # UI 설계 및 mockup
│  └─ 📄 UI-Features.md                 # UI 기능 상세 (색상 로그, 모달 등) ✨
│
├─ 📁 .vscode/                           # VS Code 설정
│  ├─ 📄 launch.json                    # 디버깅 설정
│  └─ 📄 settings.json                  # 에디터 설정
│
├─ 📁 temp/                              # 임시 파일 (런타임 생성) 🗂️
│  ├─ 📁 2025-11-22T16-30-45/           # 세션별 격리된 디렉토리 (타임스탬프)
│  │  └─ 📁 project/                   # 압축 해제된 Terraform 프로젝트
│  ├─ 📁 2025-11-22T16-35-20/           # 다른 세션
│  │  └─ 📁 project/
│  └─ 📁 2025-11-22T17-00-00/           # 또 다른 세션
│     └─ 📁 project/
│
├─ 📁 dist/                              # 빌드 결과물 (빌드 시 생성)
│  ├─ 📦 terraform-runner Setup.exe    # Windows 설치 파일
│  └─ 📁 win-unpacked/                  # 언패킹된 앱
│
├─ 📄 package.json                      # NPM 패키지 설정 및 스크립트
├─ 📄 .gitignore                        # Git 무시 파일 목록
├─ 📄 .npmrc                            # NPM 설정
├─ 📄 .editorconfig                     # 에디터 설정
│
├─ 📄 README.md                         # 📚 메인 문서
├─ 📄 QUICKSTART.md                     # ⚡ 빠른 시작 가이드
├─ 📄 DEVELOPER.md                      # 🔧 개발자 가이드
├─ 📄 CONTRIBUTING.md                   # 🤝 기여 가이드
├─ 📄 CHANGELOG.md                      # 📝 변경 이력
├─ 📄 PROJECT_STRUCTURE.md              # 📁 프로젝트 구조 (현재 파일)
├─ 📄 SECURITY.md                       # 🔒 보안 정책 (AWS 자격증명 관리)
├─ 📄 AWS_CLI_LICENSE_NOTICE.md         # ⚖️ AWS CLI 라이선스 고지
│
└─ 📄 TERRAFORM_LICENSE                 # ⚖️ Terraform 라이선스 고지

```

## 📊 통계

### 파일 수
- **JavaScript 파일**: 10개 (tfvars-parser.js, aws-cli-installer.js 추가)
- **HTML 파일**: 1개
- **CSS 파일**: 1개
- **문서 파일**: 14개 (SECURITY.md, UI-Features.md, AWS_CLI_LICENSE_NOTICE.md 추가)
- **설정 파일**: 5개

### 코드 라인 (대략)
- **Main Process**: ~700 라인 (IPC 핸들러 추가)
- **Services**: ~1,300 라인 (세션 관리 추가)
- **Renderer**: ~1,000 라인 (변수 UI, 모달, ANSI 변환, 스마트 진행률)
- **HTML/CSS**: ~900 라인 (모달 스타일 추가)
- **총계**: ~3,900 라인

## 🔑 핵심 파일

### 필수 파일
1. **src/main.js** - 앱 진입점
2. **src/preload.js** - IPC 브릿지
3. **renderer/index.html** - UI
4. **package.json** - 설정

### 중요 파일
1. **src/services/tf-runner.js** - Terraform 실행 및 ANSI 파싱
2. **src/services/aws-config.js** - 격리된 AWS 자격증명 관리 🔒
3. **src/services/tfvars-parser.js** - 변수 파싱 및 UI 자동 생성
4. **renderer/index.js** - UI 로직 (색상 로그, 모달)
5. **README.md** - 문서

## 📦 빌드 시 포함되는 파일

Electron Builder가 패키지에 포함시키는 파일:

```json
{
  "files": [
    "src/**/*",
    "renderer/**/*",
    "package.json"
  ],
  "extraResources": [
    "bin/terraform.exe"
  ]
}
```

## 🚫 제외되는 파일

`.gitignore`에 의해 제외:
- `node_modules/`
- `dist/`
- `temp/`
- `.vscode/`
- `*.log`

## 📚 문서 파일 가이드

| 파일 | 대상 독자 | 내용 |
|------|----------|------|
| README.md | 모든 사용자 | 프로젝트 개요, 설치, 사용법 |
| QUICKSTART.md | 초보 사용자 | 5분 안에 시작하기 |
| SECURITY.md | 보안 관리자 | AWS 자격증명 격리 정책 🔒 |
| DEVELOPER.md | 개발자 | 아키텍처, API, 디버깅 |
| CONTRIBUTING.md | 기여자 | 기여 방법, 코드 스타일 |
| CHANGELOG.md | 모든 사용자 | 버전별 변경사항 |
| PROJECT_STRUCTURE.md | 개발자 | 파일 구조 (현재) |
| docs/UI-Features.md | 개발자/사용자 | UI 기능 상세 (색상, 모달 등) |

## 🔄 데이터 흐름

```
ZIP 파일
  ↓
unzipper.js → temp/<timestamp>/project/ (세션별 격리) 🗂️
  ↓
자동 정리 → 24시간 이상 된 세션 삭제
  ↓
tfvars-parser.js → variables.tf 파싱
  ↓
renderer/index.js → 변수 입력 UI 표시
  ↓
AWS Credentials (메모리 저장)
  ↓
aws-config.js → 환경변수로 격리 🔒
  ↓
tf-runner.js → terraform.exe (환경변수 전달)
  ↓
진행률 업데이트 → 성공 시에만 증가 📊
  ↓
ANSI 색상 로그 → HTML 변환 🎨
  ↓
renderer/index.js → 실시간 컬러 로그 표시
  ↓
Plan 결과 모달 (90% 크기) 📊
  ↓
Apply 실행
  ↓
완료 화면 + Outputs
```

## 🎯 다음 단계

이 구조를 기반으로:
1. ✅ 코드 작성 완료
2. ⬜ 테스트 추가
3. ⬜ CI/CD 설정
4. ⬜ 아이콘 디자인
5. ⬜ 첫 릴리스

---

**전체 구조를 이해하셨나요?** [DEVELOPER.md](DEVELOPER.md)에서 더 자세한 내용을 확인하세요!

