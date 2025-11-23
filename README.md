# 🚀 Terraform Runner for Windows

Terraform 프로젝트를 쉽게 배포할 수 있는 Windows 데스크톱 애플리케이션입니다.

## ✨ 주요 기능

- **간편한 프로젝트 로드**: ZIP 파일 선택만으로 Terraform 프로젝트 실행
- **변수 자동 파싱**: variables.tf를 읽고 GUI로 변수 입력 ✨
- **빠른 시작 모드**: terraform.tfvars.example 기본값으로 즉시 실행 ✨
- **격리된 AWS 자격증명**: 시스템 설정 변경 없이 환경변수로 안전하게 관리 🔒
- **세션 기반 실행**: 타임스탬프 기반 격리로 충돌 없는 동시 실행 🗂️
- **자동화된 실행**: Init → Plan → Apply 단계 자동 실행
- **리소스 삭제**: Destroy 기능으로 생성된 AWS 리소스 일괄 삭제 🗑️
- **실시간 컬러 로그**: Terraform 색상 출력을 그대로 표시 🎨
- **컬러 Outputs**: 완료 화면의 Outputs도 색상으로 표현 🎨
- **스마트 진행률**: 실패 시 정확한 지점에서 멈춤 📊
- **Plan 결과 모달**: 로그를 보면서 Plan 결과 확인 가능 📊
- **단계별 시각화**: 현재 진행 단계를 직관적으로 표시
- **Terraform 내장**: 별도 설치 없이 바로 사용 가능
- **AWS CLI 자동 설치**: 앱에서 AWS CLI를 원클릭으로 설치 가능
- **컴팩트한 UI**: 깔끔한 1000x700 창 크기, 메뉴바 자동 숨김 ✨

## 📋 시스템 요구사항

- **OS**: Windows 10 이상
- **필수 프로그램**: 
  - ✅ Terraform (내장됨 - 별도 설치 불필요)
  - ⚙️ AWS CLI (v2.0 이상) - 앱에서 자동 설치 가능

## 🛠️ 설치 방법

### 1. Terraform 실행 파일 추가

**중요**: 애플리케이션을 실행하기 전에 `bin/` 폴더에 `terraform.exe`를 추가해야 합니다.

1. [Terraform 공식 웹사이트](https://www.terraform.io/downloads)에서 Windows 버전 다운로드
2. 다운로드한 ZIP 파일에서 `terraform.exe` 추출
3. `bin/terraform.exe` 경로에 파일 배치

```
terraform-runner/
├─ bin/
│  └─ terraform.exe  ← 여기에 추가!
├─ src/
├─ renderer/
└─ ...
```

### 2. AWS CLI (선택사항)

AWS CLI가 없어도 괜찮습니다! 앱이 자동으로 설치를 도와드립니다:

- **자동 설치**: 앱 실행 시 AWS CLI가 없으면 자동 설치 안내
- **원클릭 설치**: 모달에서 "설치하기" 버튼 클릭
- **수동 설치**: 직접 설치를 원하시면 [AWS CLI 공식 페이지](https://aws.amazon.com/cli/) 방문

### 3. 개발 모드 실행

```bash
# 의존성 설치
npm install

# 개발 모드 실행
npm run dev
```

### 4. 앱 실행

처음 실행하면 AWS CLI 설치 여부를 확인합니다:

```
⚙️ AWS CLI 설치 필요
자동으로 다운로드하여 설치하시겠습니까?

[나중에] [설치하기]
```

### 5. 프로덕션 빌드

```bash
# Windows 실행 파일 빌드
npm run build:win
```

빌드된 설치 파일은 `dist/` 폴더에 생성됩니다.

## 📖 사용 방법

### 0단계: AWS CLI 설치 (처음 한 번만)

앱을 처음 실행하면 AWS CLI 설치 안내가 표시됩니다:

1. **자동 설치** 선택 시:
   - 앱이 자동으로 AWS CLI를 다운로드 (약 40-50MB)
   - 무인 설치 진행 (약 1-2분)
   - 설치 완료!

2. **나중에** 선택 시:
   - 나중에 상태 표시줄에서 "설치하기" 버튼 클릭 가능
   - 또는 수동으로 설치 후 앱 재시작

### 1단계: Terraform 프로젝트 준비

Terraform 프로젝트를 ZIP 파일로 압축합니다:

```
my-terraform-project.zip
├─ main.tf
├─ variables.tf
├─ terraform.tfvars.example  ← 선택사항: 기본값 제공
├─ outputs.tf
└─ ...
```

**권장**: `terraform.tfvars.example` 파일을 포함하면 빠른 시작이 가능합니다!

### 2단계: 애플리케이션 실행

1. **ZIP 파일 선택**: "ZIP 파일 선택" 버튼 클릭
2. **변수 설정** (자동으로 다음 화면으로 이동):
   - Terraform 변수 자동 파싱 및 표시
   - 기본값이 자동으로 채워짐
   - **값 수정**: 필요한 변수 값 직접 입력
   - **리셋**: "🔄 기본값으로 리셋" 버튼으로 초기값 복원
3. **AWS Credentials 입력**:
   - Access Key ID
   - Secret Access Key
   - Region 선택 (기본: ap-northeast-2)
4. **작업 선택**:
   - **🚀 배포하기**: 새로운 리소스 생성
   - **🗑️ 리소스 삭제**: 기존 리소스 제거

### 3단계: 실행 및 모니터링

- **Init**: Terraform 초기화 (플러그인 다운로드)
- **Plan**: 변경사항 확인
- **Apply**: 실제 리소스 배포 (사용자 승인 필요)

### 4단계: 완료

배포 완료 후 다음 정보를 확인할 수 있습니다:
- 총 소요 시간
- 생성/변경/삭제된 리소스 수
- Terraform Outputs

### 5단계: 리소스 정리 (선택사항) 🗑️

테스트가 끝났거나 리소스를 정리하고 싶다면:

1. 완료 화면에서 **"🗑️ 리소스 삭제"** 버튼 클릭
2. 삭제 확인 모달에서 리소스 개수 확인
3. **"삭제 실행"** 버튼 클릭
4. 모든 AWS 리소스가 자동으로 삭제됨

⚠️ **주의**: Destroy는 되돌릴 수 없습니다!

## 🏗️ 프로젝트 구조

```
terraform-runner/
├─ src/                      # Main Process
│  ├─ main.js               # Electron 메인 진입점
│  ├─ preload.js            # Preload 스크립트
│  └─ services/             # 백엔드 서비스
│     ├─ unzipper.js        # ZIP 압축 해제
│     ├─ aws-config.js      # AWS CLI 설정
│     ├─ tf-runner.js       # Terraform 실행
│     └─ logger.js          # 로깅
├─ renderer/                 # Renderer Process
│  ├─ index.html            # UI HTML
│  ├─ index.js              # UI 로직
│  └─ style.css             # 스타일
├─ bin/                      # 실행 파일
│  └─ terraform.exe         # Terraform (사용자가 추가)
├─ docs/                     # 문서
│  ├─ prd.md
│  ├─ Electron-IPC-Flow.md
│  └─ UI-Mockup.md
├─ package.json
└─ README.md
```

## 🔒 보안 고려사항

- **격리된 자격증명 관리**: AWS Credentials는 메모리에만 존재하며 환경변수로 전달
- **시스템 설정 보존**: `~/.aws/` 설정 파일을 수정하지 않음
- **프로세스 격리**: 앱이 실행하는 Terraform에만 자격증명 전달
- **세션 격리**: 타임스탬프 기반 세션별 temp 디렉토리로 충돌 방지 🗂️
- **ANSI 코드 처리**: 색상 코드를 안전하게 HTML로 변환
- **로컬 시간 표시**: 사용자 시간대로 로그 표시
- **임시 파일 자동 정리**: 24시간 이상 된 세션 자동 삭제

자세한 내용은 [SECURITY.md](SECURITY.md)를 참조하세요.

## 📜 라이선스

이 프로젝트는 MIT 라이선스를 따릅니다.

### Terraform 라이선스 고지

이 애플리케이션은 HashiCorp Terraform (BUSL-1.1 License)을 포함합니다.

```
This software bundles Terraform (© HashiCorp, BUSL-1.1 License).
Terraform is provided under the Business Source License 1.1.
This application is a non-commercial internal-use tool and does not provide
Terraform as a service nor does it compete with Terraform Cloud.
```

**중요**: 이 애플리케이션은 비상업적 용도로만 사용 가능합니다.

## 🐛 문제 해결

### Terraform 실행 파일을 찾을 수 없음

```
✖ Terraform - 설치 필요 (bin/terraform.exe 추가)
```

**해결 방법**: `bin/terraform.exe` 파일을 추가하세요.

### AWS CLI를 찾을 수 없음

```
✖ AWS CLI - 설치 필요 [설치하기]
```

**해결 방법 1 (권장)**: 앱 내에서 "설치하기" 버튼 클릭

**해결 방법 2**: 수동 설치
```bash
msiexec.exe /i https://awscli.amazonaws.com/AWSCLIV2.msi
```

### ZIP 압축 해제 실패

```
No .tf files found in the ZIP archive
```

**해결 방법**: ZIP 파일에 `.tf` 파일이 포함되어 있는지 확인하세요.

### AWS 자격증명 오류

```
AWS configuration failed: Invalid credentials
```

**해결 방법**:
- Access Key ID가 올바른지 확인
- Secret Access Key가 올바른지 확인
- AWS 계정에 필요한 권한이 있는지 확인

## 🤝 기여하기

버그 리포트, 기능 제안, Pull Request를 환영합니다!

## 📞 지원

문제가 발생하면 GitHub Issues에 문의해 주세요.

## 🙏 감사의 말

- [Electron](https://www.electronjs.org/) - 크로스 플랫폼 데스크톱 앱 프레임워크
- [HashiCorp Terraform](https://www.terraform.io/) - 인프라 자동화 도구
- [AWS CLI](https://aws.amazon.com/cli/) - AWS 명령줄 인터페이스

---

**Made with ❤️ for DevOps Engineers**

