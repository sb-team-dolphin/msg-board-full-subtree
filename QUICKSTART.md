# ⚡ 빠른 시작 가이드

Terraform Runner를 5분 안에 실행하는 방법입니다.

## 📋 체크리스트

시작하기 전에 다음 항목을 확인하세요:

- [ ] Node.js 설치됨 (v16 이상) - 개발 모드 실행용
- [ ] ~~AWS CLI 설치됨~~ ✨ **앱에서 자동 설치 가능!**
- [ ] Terraform.exe 다운로드 완료
- [ ] Terraform 프로젝트 ZIP 파일 준비
- [ ] (선택) `terraform.tfvars.example` 파일 준비 - 빠른 시작용

## 🚀 5분 설치 가이드

### 1단계: 프로젝트 클론 (1분)

```bash
git clone <repository-url>
cd terraform-runner
```

### 2단계: 의존성 설치 (1분)

```bash
npm install
```

### 3단계: Terraform 실행 파일 추가 (2분)

1. [Terraform 다운로드](https://www.terraform.io/downloads)
2. `terraform.exe`를 `bin/` 폴더에 복사

```
terraform-runner/
├─ bin/
│  └─ terraform.exe  ← 여기!
```

### 4단계: 실행 (1분)

```bash
npm run dev
```

## 🎯 첫 실행

### 0. AWS CLI 설치 (자동) ✨

앱을 처음 실행하면 AWS CLI 설치를 확인합니다:

```
⚙️ AWS CLI가 설치되어 있지 않습니다
자동으로 설치하시겠습니까? (약 2분 소요)

[나중에] [설치하기]  ← 클릭!
```

### 1. ZIP 파일 준비

Terraform 프로젝트를 ZIP으로 압축:

```
my-project.zip
├─ main.tf
├─ variables.tf
├─ terraform.tfvars.example  ← 권장! (기본값 제공)
└─ ...
```

### 2. 변수 설정 ✨

ZIP 선택 후 자동으로 변수 입력 화면 표시:

```
┌────────────────────────────────┐
│ ⚙️ Terraform 변수 설정          │
│ [⬅️ 이전]  [🔄 기본값으로 리셋]  │ ← 상단 버튼
├────────────────────────────────┤
│ 📝 변수 설정                   │
│ aws_region                     │
│ ┌────────────────────────────┐ │
│ │ ap-northeast-2             │ │ ← 기본값 자동 채워짐
│ └────────────────────────────┘ │
│                                │
│ project_name                   │
│ ┌────────────────────────────┐ │
│ │ myapp                      │ │
│ └────────────────────────────┘ │
│                                │
│ 🔑 AWS Credentials             │
│ ...                            │
├────────────────────────────────┤
│  [🚀 배포하기] [🗑️ 리소스 삭제]  │ ← 작업 선택
└────────────────────────────────┘
```

### 3. AWS Credentials 입력

다음 정보가 필요합니다:
- **Access Key ID**: `AKIAIOSFODNN7EXAMPLE`
- **Secret Access Key**: `wJalrXUtnFEMI/K7MDENG/...`
- **Region**: `ap-northeast-2` (서울)

🔒 **보안**: 자격증명은 메모리에만 저장되며 시스템 설정을 변경하지 않습니다!

### 4. 실행 및 모니터링

1. "시작하기" 클릭
2. **Init**: Terraform 초기화 (자동)
3. **Plan**: 변경사항 확인 (자동)
   - 📊 **Plan 결과 모달** 표시
   - 생성/변경/삭제될 리소스 확인
   - 로그를 보면서 확인 가능!
4. **Apply 실행** 버튼 클릭
5. 완료!

## 🎉 완료!

첫 Terraform 배포가 완료되었습니다!

### 리소스 정리하기 🗑️

테스트가 끝났다면 AWS 비용을 절감하기 위해 리소스를 삭제하세요:

1. 완료 화면에서 **"🗑️ 리소스 삭제"** 버튼 클릭
2. 삭제 확인 (⚠️ 되돌릴 수 없습니다!)
3. 모든 리소스가 자동으로 삭제됨

이 기능은 `terraform destroy` 명령을 GUI로 실행합니다.

## 💡 팁

### 기본값 리셋
변수를 수정했다가 다시 처음 값으로 돌리고 싶다면 "🔄 기본값으로 리셋" 버튼을 클릭하세요!

### 컬러 로그
Terraform의 색상 출력이 그대로 표시됩니다:
- 🟢 초록: 생성될 리소스
- 🟡 노랑: 변경될 리소스
- 🔴 빨강: 삭제될 리소스

### Plan 결과 모달
로그를 계속 보면서 Plan 결과를 확인할 수 있습니다!

## ❓ 문제 발생 시

### AWS CLI 없음
✨ **해결**: 앱에서 "설치하기" 버튼 클릭! (자동 설치)

또는 수동 설치:
```bash
# Windows
msiexec.exe /i https://awscli.amazonaws.com/AWSCLIV2.msi
```

### Terraform 없음
`bin/terraform.exe` 파일을 추가하세요.

### ZIP 구조 오류
ZIP 파일 내부에 `.tf` 파일이 있어야 합니다. 
중첩된 폴더 구조도 자동으로 감지합니다!

### 더 많은 도움이 필요하신가요?
- [README.md](README.md) - 전체 문서
- [SECURITY.md](SECURITY.md) - 보안 관련
- [docs/UI-Features.md](docs/UI-Features.md) - UI 기능 상세

---

**다음 단계**: [전체 문서](README.md) 읽기

