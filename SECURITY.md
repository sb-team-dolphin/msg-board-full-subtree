# 🔒 보안 정책

## AWS 자격증명 관리

### ✅ 안전한 처리 방식

이 앱은 AWS 자격증명을 다음과 같이 안전하게 처리합니다:

1. **메모리에만 저장**
   - 입력한 AWS 자격증명은 앱 실행 중에만 메모리에 보관됩니다
   - 디스크나 파일에 저장되지 않습니다
   - 앱 종료 시 자동으로 삭제됩니다

2. **시스템 설정 보존**
   - `~/.aws/credentials` 파일을 변경하지 않습니다
   - `~/.aws/config` 파일을 변경하지 않습니다
   - 기존 AWS CLI 설정에 영향을 주지 않습니다

3. **격리된 실행 환경**
   - 환경변수를 통해 Terraform 프로세스에만 자격증명 전달
   - 다른 프로세스나 도구에서는 접근 불가
   - 앱이 실행하는 Terraform 명령에만 적용

### 🔐 기술적 구현

```javascript
// 앱이 사용하는 방식 (환경변수)
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
AWS_DEFAULT_REGION=...

// 시스템 설정 무시하도록 명시적 비활성화
AWS_PROFILE=
AWS_SHARED_CREDENTIALS_FILE=
AWS_CONFIG_FILE=
```

이 방식은:
- ✅ Terraform에서 공식 지원
- ✅ AWS CLI 기본 동작 방식
- ✅ 임시 자격증명 사용에 적합
- ✅ 시스템 설정과 완전 분리됨
- ✅ 프로세스 종료 시 자동 삭제
- ✅ 다른 프로세스에서 접근 불가

### ❌ 사용하지 않는 방식

```bash
# 이런 명령은 실행하지 않습니다
aws configure set aws_access_key_id ...
aws configure set aws_secret_access_key ...
```

이 명령들은:
- ❌ `~/.aws/credentials` 파일 수정
- ❌ 시스템 전역 설정 변경
- ❌ 다른 프로젝트에 영향

---

## 세션 격리 🗂️

### 타임스탬프 기반 세션

각 실행마다 고유한 세션 디렉토리를 생성:

```
temp/
├── 2025-11-22T16-30-45/  ← 세션 1
│   └── project/
├── 2025-11-22T16-35-20/  ← 세션 2
│   └── project/
└── 2025-11-22T17-00-00/  ← 세션 3
    └── project/
```

### 보안 장점

1. **충돌 방지**: 동시 실행 시 파일 충돌 없음
2. **격리된 실행**: 각 세션이 독립적으로 작동
3. **추적 가능**: 타임스탬프로 실행 이력 확인
4. **자동 정리**: 24시간 후 자동 삭제로 디스크 관리

### 자동 정리

```javascript
// 24시간 이상 된 세션 자동 삭제
cleanupOldSessions(24);

// 예시 로그:
[16:00:00] Old session cleaned: 2025-11-21T10-00-00 (30h old)
[16:00:00] Cleaned 2 old session(s)
```

### 민감 정보 보호

- 세션 종료 후 자동 정리
- 오래된 Terraform state 파일 자동 삭제
- 임시 자격증명 정보 제거

---

## 로그 보안

### 자격증명 마스킹

로그에 AWS 자격증명이 노출되지 않도록 처리:

```
[20:23:50] AWS 설정 완료  ← 로컬 시간 표시
Access Key: AKIA****************  ← 마스킹됨
Secret Key: **********************  ← 마스킹됨
Region: ap-northeast-2
```

### 로그 저장

- 저장된 로그 파일에도 민감 정보 포함 안 됨
- Terraform 출력만 기록 (ANSI 색상 코드 제거됨)
- AWS 자격증명은 저장되지 않음
- 로컬 시간대로 타임스탬프 기록

### ANSI 코드 처리

- Terraform의 색상 코드를 안전하게 HTML로 변환
- XSS 방지를 위해 제한된 스타일만 허용
- 민감 정보가 색상 코드에 숨겨지지 않도록 검증

---

## 권장 사항

### 1. IAM 사용자 생성

프로덕션 환경에서는 루트 계정 대신 IAM 사용자 사용:

```bash
# AWS Console에서 생성
1. IAM → Users → Add user
2. 필요한 권한만 부여 (최소 권한 원칙)
3. Access Key 생성
```

### 2. 임시 자격증명 사용

가능하면 임시 자격증명(STS) 사용:

```bash
# AWS CLI로 임시 자격증명 생성
aws sts get-session-token --duration-seconds 3600
```

### 3. 자격증명 로테이션

정기적으로 Access Key 교체:
- 주기적으로 새 키 생성
- 기존 키 비활성화
- 90일 이상 사용한 키 삭제

---

## 취약점 신고

보안 취약점 발견 시:
- 이슈 트래커에 공개하지 마세요
- security@example.com으로 비공개 보고
- 24시간 내 응답 예상

---

## 참고 자료

- [AWS Security Best Practices](https://aws.amazon.com/security/best-practices/)
- [Terraform Security](https://www.terraform.io/docs/cloud/users-teams-organizations/permissions.html)
- [AWS Credential Management](https://docs.aws.amazon.com/cli/latest/userguide/cli-configure-files.html)

