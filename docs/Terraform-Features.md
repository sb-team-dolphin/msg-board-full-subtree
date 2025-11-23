# 🔧 Terraform 기능

Easy Terraform에서 지원하는 Terraform 명령어와 기능들입니다.

## 📋 지원 명령어

### ✅ 현재 지원

| 명령어 | 상태 | 설명 | 자동 실행 |
|--------|------|------|----------|
| `init` | ✅ 지원 | Terraform 초기화, 플러그인 다운로드 | 자동 |
| `plan` | ✅ 지원 | 변경사항 미리보기 (`-detailed-exitcode` 포함) | 자동 |
| `apply` | ✅ 지원 | 실제 리소스 배포 (`-auto-approve`) | 수동 확인 |
| `destroy` | ✅ 지원 | 모든 리소스 삭제 (`-auto-approve`) | 수동 확인 |

### ⬜ 향후 추가 예정

| 명령어 | 우선순위 | 설명 |
|--------|----------|------|
| `output` | 높음 | Outputs 값만 조회 |
| `validate` | 중간 | 설정 파일 유효성 검증 |
| `fmt` | 낮음 | 코드 포맷팅 |
| `show` | 낮음 | 현재 상태 표시 |
| `refresh` | 낮음 | 상태 갱신 |

---

## 🔄 Init

### 개요
Terraform 프로젝트를 초기화하고 필요한 provider 플러그인을 다운로드합니다.

### 자동 실행
- "시작하기" 버튼 클릭 시 자동 실행
- 백그라운드에서 실행 (사용자 개입 불필요)

### 실행 옵션
```bash
terraform init
```

### 로그 출력 예시
```
[16:49:21] Executing: terraform.exe init
[16:49:22] Initializing the backend...
[16:49:23] Initializing provider plugins...
[16:49:25] - Finding hashicorp/aws versions matching "~> 5.0"...
[16:49:30] - Installing hashicorp/aws v5.100.0...
[16:49:35] Terraform has been successfully initialized!
```

---

## 📊 Plan

### 개요
실제 변경을 가하지 않고 Terraform이 수행할 작업을 미리 확인합니다.

### 자동 실행
- Init 완료 후 자동 실행
- Exit code 2 (변경사항 있음)를 성공으로 처리

### 실행 옵션
```bash
terraform plan -detailed-exitcode
```

### Exit Code
- `0`: 변경사항 없음
- `1`: 오류 발생
- `2`: 변경사항 있음 (정상)

### 결과 표시
Plan 완료 후 **90% 크기 모달**로 결과 표시:
```
┌──────────────────────────────────┐
│ 📊 Terraform Plan 결과           │
├──────────────────────────────────┤
│ ➕ 생성: 49개                    │
│ 🔄 변경: 0개                     │
│ ➖ 삭제: 0개                     │
│                                  │
│ ⚠️ 주의: Apply 실행 시 비용 발생 │
│                                  │
│     [취소]  [✅ Apply 실행]      │
└──────────────────────────────────┘
```

---

## ✅ Apply

### 개요
Plan에서 확인한 변경사항을 실제로 AWS에 적용합니다.

### 실행 방식
- **수동 확인 필요**: Plan 결과 모달에서 "Apply 실행" 버튼 클릭
- 자동 승인 옵션으로 실행

### 실행 옵션
```bash
terraform apply -auto-approve
```

### 결과 파싱
```javascript
// "Apply complete! Resources: 49 added, 0 changed, 0 destroyed."
{
  resourceChanges: {
    added: 49,
    changed: 0,
    destroyed: 0
  }
}
```

### Outputs 추출
Apply 완료 후 Terraform Outputs 자동 파싱 및 표시:
```
Outputs:

alb_dns_name = "myapp-alb-123456789.ap-northeast-2.elb.amazonaws.com"
ecr_repository_url = "123456789012.dkr.ecr.ap-northeast-2.amazonaws.com/myapp-backend"
```

---

## 🗑️ Destroy

### 개요
Terraform으로 생성한 모든 AWS 리소스를 삭제합니다.

### 실행 방식
- **2단계 확인 필요**:
  1. 완료 화면에서 "🗑️ 리소스 삭제" 버튼 클릭
  2. 확인 모달에서 "삭제 실행" 버튼 클릭

### 실행 옵션
```bash
terraform destroy -auto-approve
```

### 안전 장치
```
⚠️ 리소스 삭제 확인

경고: 이 작업은 되돌릴 수 없습니다!

모든 AWS 리소스가 영구적으로 삭제됩니다.
계속하시겠습니까?

⚠️ 삭제될 리소스: 49개

      [취소]  [삭제 실행]
```

### 결과 파싱
```javascript
// "Destroy complete! Resources: 49 destroyed."
{
  resourceChanges: {
    destroyed: 49
  }
}
```

### 사용 시나리오
- 테스트 환경 정리
- 비용 절감
- 재배포 전 클린업

---

## 🔐 AWS 자격증명 처리

모든 Terraform 명령은 앱에서 설정한 AWS 자격증명을 사용합니다:

```javascript
// 환경변수로 전달
env: {
  AWS_ACCESS_KEY_ID: '...',
  AWS_SECRET_ACCESS_KEY: '...',
  AWS_DEFAULT_REGION: '...',
  AWS_PROFILE: '',  // 시스템 프로파일 비활성화
  AWS_SHARED_CREDENTIALS_FILE: '',
  AWS_CONFIG_FILE: '',
}
```

**장점**:
- 시스템 설정 보존
- 프로세스 격리
- 다른 도구에 영향 없음

---

## 📝 변수 처리

### 자동 생성
- `variables.tf` 파싱
- `terraform.tfvars.example` 기본값 읽기
- GUI로 변수 입력
- `terraform.tfvars` 자동 생성

### 지원 타입
| Terraform 타입 | 입력 방식 | 예시 |
|---------------|----------|------|
| `string` | 텍스트 | `"ap-northeast-2"` |
| `number` | 숫자 | `3` |
| `bool` | 체크박스 | `true` |
| `list(string)` | 쉼표 구분 | `["a", "b"]` |

---

## 🎨 출력 처리

### ANSI 색상 지원
Terraform의 색상 출력을 그대로 표시:
- 🟢 초록 (`[32m`): 생성
- 🟡 노랑 (`[33m`): 변경
- 🔴 빨강 (`[31m`): 삭제
- 🔵 파랑 (`[34m`): 정보
- **굵게** (`[1m`): 제목

### 적용 범위
1. **실시간 로그**: 실행 중 터미널 출력
2. **Terraform Outputs**: 완료 화면의 결과 값 🆕

### 실시간 로그
- 줄 단위로 즉시 표시
- 로컬 시간 타임스탬프 (HH:MM:SS)
- HTML로 변환하여 색상 렌더링
- ANSI → HTML 자동 변환

### Terraform Outputs 표시
Apply 완료 후 Outputs를 색상으로 표현:
```
┌────────────────────────────────────┐
│ 📊 Terraform Outputs      [📋 복사] │
├────────────────────────────────────┤
│ alb_dns_name = "..."  🟢           │
│ ecr_url = "..."       🟢           │
└────────────────────────────────────┘
```

**특징**:
- 화면: ANSI → HTML 변환 (색상 표시)
- 복사: ANSI 제거 (깔끔한 텍스트)

---

## 📊 진행률 관리

### 스마트 진행률
실패한 단계에서 진행률이 멈춤:

**Apply 워크플로우**:
```
0% → 10%(Init 시작) → 33%(Init 완료) → 40%(Plan 시작) 
→ 66%(Plan 완료) → 70%(Apply 시작) → 100%(완료)
```

**Destroy 워크플로우**:
```
0% → 10%(Init 시작) → 50%(Init 완료) → 60%(Destroy 시작) 
→ 100%(완료)
```

**실패 처리**:
- Init 실패 → 10%에서 멈춤
- Plan 실패 → 40%에서 멈춤
- Apply 실패 → 70%에서 멈춤

---

## 🗂️ 세션 관리

### 세션 기반 실행
각 실행마다 타임스탬프 기반 세션 디렉토리 생성:

```
temp/
├── 2025-11-22T16-30-45/  ← 세션 1
│   └── project/
├── 2025-11-22T16-35-20/  ← 세션 2
│   └── project/
└── 2025-11-22T17-00-00/  ← 세션 3
    └── project/
```

**장점**:
- 충돌 없는 동시 실행
- 24시간 자동 정리
- 타임스탬프로 추적 가능

---

## 🚀 향후 계획

### Phase 2 기능
1. **`terraform output`** - Outputs만 조회
2. **`terraform validate`** - 파일 검증
3. **다중 프로젝트** - 여러 프로젝트 관리
4. **State 관리** - 상태 파일 백업/복원
5. **워크스페이스** - Workspace 지원

### Phase 3 기능
1. **`terraform import`** - 기존 리소스 가져오기
2. **모듈 지원** - Private registry
3. **비용 추정** - Infracost 통합
4. **Graph 시각화** - 리소스 관계도

---

## 📚 참고 자료

- [Terraform CLI Commands](https://www.terraform.io/cli/commands)
- [Terraform Environment Variables](https://www.terraform.io/cli/config/environment-variables)
- [Terraform Exit Codes](https://www.terraform.io/cli/commands/plan#detailed-exitcode)

