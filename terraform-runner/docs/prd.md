# 📘 **Terraform Runner for Windows — PRD (Electron + Terraform.exe 번들링 버전)**

> *Terraform ZIP 선택 → AWS CLI 설정 → Init/Plan/Apply 자동 실행 → 단계별 시각화*
> *Terraform.exe까지 포함하여 사용자가 아무것도 설치할 필요 없는 완전 자동화 툴.*

---

# 1. 📌 **제품 개요 (Product Overview)**

Terraform Runner는 사용자가 **Terraform 프로젝트(.zip)** 를 선택하면 다음 프로세스를 자동화하는 Windows 데스크톱 애플리케이션이다:

1. Terraform ZIP 선택 및 자동 추출
2. AWS CLI credentials 설정
3. Terraform init 실행
4. Terraform plan 실행
5. Terraform apply 실행
6. 단계별 상태 시각화 + 실시간 로그 출력

**추가 개선 사항**

* 앱 내부에 **Terraform.exe를 포함**하여 사용자가 별도 설치할 필요가 없음.
* HashiCorp BUSL 1.1 라이선스 준수를 위해 **비상업적 용도 전제** 및 관련 안내 포함.

---

# 2. 🎯 **프로젝트 목표 (Goals)**

1. **Terraform 경험이 없는 사용자도 ZIP 선택만으로 배포 가능**
2. **Terraform 설치 없이 실행되는 완전 패키지형**
3. **단계별 시각화로 직관적인 배포 프로세스 제공**
4. **AWS CLI 설정 포함으로 환경 구성 자동화**
5. **라이선스 문제 없는 안전한 배포 구조 (BUSL 1.1 준수)**

---

# 3. 🚫 **비범위 (Non-goals)**

MVP에서는 아래 기능 제외 (복잡성 증가 방지):

* ~~Terraform 변수 편집 UI~~ ✅ **구현 완료**
* Terraform workspace 기능
* 다중 AWS Profile 관리
* ~~destroy 기능~~ ✅ **구현 완료**
* GitHub Repo 자동 다운로드
* AWS 리소스 시각화
* Terraform Backend(S3) 생성 자동화

**초기 버전 목표는 "단순 자동화 + UI 시각화" 유지.**

## ✅ v1.0에 추가된 기능
- ✨ Terraform 변수 자동 파싱 및 GUI 입력
- ✨ Terraform Destroy 기능 (2단계 확인)
- ✨ 실시간 컬러 로그 (ANSI → HTML)
- ✨ 컬러 Outputs 표시
- ✨ 스마트 진행률 표시
- ✨ 세션 기반 temp 디렉토리

---

# 4. 🔍 기능 요구사항 (Functional Requirements)

## 4.1. Terraform ZIP 파일 로드

* 사용자 파일 탐색기에서 `.zip` 선택
* 앱 내부의 `temp/`에 압축 자동 해제
* `.tf` 파일 존재 여부 체크 (없으면 오류)
* 이후 단계 진행

---

## 4.2. AWS CLI 설정

### UI 입력

* Access Key
* Secret Key
* Region (기본값: `ap-northeast-2`)

### 내부 동작 (Node child_process 통해 실행)

```
aws configure set aws_access_key_id <key> --profile default
aws configure set aws_secret_access_key <secret> --profile default
aws configure set region <region> --profile default
```

**Note:**
프로파일은 **1개(default)**만 지원 → 복잡성 증가 방지.

---

## 4.3. Terraform 실행 (app bundled Terraform.exe 사용)

### Terraform 실행 파일 경로

* 개발 모드: `<project>/bin/terraform.exe`
* 패키지 모드: `process.resourcesPath/bin/terraform.exe`

예시:

```js
const terraformPath = path.join(
  process.resourcesPath,
  'bin',
  'terraform.exe'
);
```

---

### 4.3.1. terraform init

* 플러그인 다운로드 진행
* 로그를 실시간으로 렌더러로 전달
* 실패 시 다음 단계 진행 불가

---

### 4.3.2. terraform plan

* 생성/수정/삭제 리소스 수 요약
* 전체 plan 로그 표시
* “Apply” 버튼 활성화

---

### 4.3.3. terraform apply

* `terraform apply -auto-approve`
* 실시간 로그 스트림
* 성공 시 output 표시

---

### 4.3.4. 단계별 실패 처리

* 실패 단계는 빨간색 ✖ 표시
* 다음 단계는 진행 불가
* 로그는 유지

---

# 5. 🖥️ UI 설계 (Electron Renderer)

## 5.1. 초기 화면

### 요소:

* ZIP 파일 선택 버튼
* AWS Credential 입력
* Region 선택
* “시작하기” 버튼 활성화

---

## 5.2. 실행 화면

### 좌측: 단계별 진행 표시

```
[✔] ZIP Import
[✔] AWS Configure
[●] terraform init
[○] terraform plan
[○] terraform apply
```

* ● 실행 중
* ✔ 완료
* ○ 대기
* ✖ 실패

---

### 우측: 로그 창

* 실시간 스트림 로그
* 오류는 빨간색
* 성공은 초록색

---

### 하단 버튼

* “다시 실행”
* “종료”

---

# 6. ⚙️ 시스템 요구사항

## 6.1. OS

* Windows 10 이상

## 6.2. 내장 런타임

* Terraform.exe → 앱 내부 resource로 포함
* Node.js → Electron에 포함되어 자동 배포됨
* AWS CLI → 외부 설치 필요 (자동 설치는 제공하지 않음)

앱 시작 시 경고:

```
Terraform → OK (내장)
AWS CLI → 설치 필요 / 버전 검사
```

---

# 7. 🔐 보안 요구사항

* AWS Secret Key는 저장하지 않음
* Input 값은 메모리에만 존재
* ZIP 추출 후 temp 디렉터리는 자동 정리 가능
* 로그에서 자격증명은 마스킹 처리

---

# 8. ☑️ 라이선스 준수 및 정책 (BUSL 1.1)

Terraform은 HashiCorp BUSL 1.1을 따른다.

## 8.1. 허용되는 사용 (본 앱은 여기에 해당)

* 비상업적 사용
* 교육/연구용
* 팀 내부 자동화
* 무료 배포
  → Terraform.exe를 앱에 포함해도 문제 없음

### HashiCorp FAQ 명시:

> Wrappers, GUIs, and automation tools that call Terraform are allowed.

본 제품은 **Terraform을 대체하는 서비스가 아니며**, 단순한 GUI Wrapper이므로 BUSL 허용 범위에 해당한다.

---

## 8.2. 금지되는 사용 (주의)

아래 경우에는 HashiCorp 상업 라이선스 필요:

* 유료 판매되는 상업 제품에 포함
* Terraform 기능을 대체하는 SaaS 제공
* HashiCorp Terraform Cloud와 경쟁하는 형태로 제공

❗ 현재 PRD에서는 “비상업적 무료 도구”임을 명시하고 위험 제거.

---

## 8.3. 앱 내부에 포함 시 필요한 조치

앱에 다음 포함:

1. Terraform LICENSE 파일 (BUSL)
2. 다음 고지문 포함:

```
This software bundles Terraform (© HashiCorp, BUSL-1.1 License).
Terraform is provided under the Business Source License 1.1.
This application is a non-commercial internal-use tool and does not provide
Terraform as a service nor does it compete with Terraform Cloud.
```

→ 법적 리스크 0

---

# 9. 기술 스택 및 구조

## 9.1. 기술 스택

| 영역                 | 기술                                  |
| ------------------ | ----------------------------------- |
| Desktop App        | Electron                            |
| Frontend           | HTML + Tailwind CSS                 |
| Binary Execution   | Node.js child_process.spawn         |
| Terraform Bundling | `extraResources` (Electron-builder) |
| ZIP 추출             | `adm-zip` 또는 `unzipper`             |
| IPC 통신             | Electron preload bridge             |

---

## 9.2. 파일 구조

```
terraform-runner/
 ├─ main.js
 ├─ preload.js
 ├─ renderer/
 │   ├─ index.html
 │   ├─ index.js
 │   └─ style.css
 ├─ bin/
 │   └─ terraform.exe          # 번들될 Terraform 실행 파일
 ├─ services/
 │   ├─ unzipper.js
 │   ├─ aws-config.js
 │   ├─ tf-runner.js
 ├─ temp/
 └─ package.json
```

---

# 10. 배포 전략 (Terraform.exe 포함)

Electron-builder 설정 예:

```json
"extraResources": [
  {
    "from": "bin/",
    "to": "bin/",
    "filter": ["terraform.exe"]
  }
]
```

---

# 11. 전체 사용 흐름 (Sequence)

```
ZIP 선택
 → ZIP 압축 해제
 → AWS configure set
 → terraform init
 → terraform plan
 → terraform apply(사용자 승인)
 → 완료
```

---

# 12. 결론

본 PRD는 다음을 충족한다:

* 단순하며 실용적인 Terraform GUI 도구
* Terraform.exe 포함 → 사용자 설치 없이 바로 사용
* BUSL 1.1 준수
* 학습/내부용/무료 도구로 사용하는 한 완전히 합법
* 단계별 실행 + 로그 시각화 제공
