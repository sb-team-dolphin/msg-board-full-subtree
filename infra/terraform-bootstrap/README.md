# Terraform Bootstrap

Terraform State 관리를 위한 S3 버킷과 DynamoDB 테이블을 생성합니다.

## 왜 필요한가?

- **S3 버킷**: Terraform State 파일을 원격 저장 (팀 협업)
- **DynamoDB 테이블**: State Lock (동시 수정 방지)

## 사용 방법

### 1. Bootstrap 실행 (최초 1회)

```bash
cd terraform-bootstrap

terraform init
terraform plan
terraform apply
```

### 2. 출력값 확인

```bash
terraform output backend_config
```

### 3. Backend 설정 적용

출력된 설정을 `terraform-backend/provider.tf`와 `terraform-frontend/provider.tf`에 추가:

```hcl
terraform {
  backend "s3" {
    bucket         = "myapp-terraform-state"
    key            = "backend/terraform.tfstate"  # frontend는 "frontend/terraform.tfstate"
    region         = "ap-northeast-2"
    encrypt        = true
    dynamodb_table = "myapp-terraform-lock"
  }
}
```

### 4. Backend/Frontend 초기화

```bash
# Backend
cd terraform-backend
terraform init

# Frontend
cd terraform-frontend
terraform init
```

## 주의사항

- Bootstrap은 **최초 1회만** 실행합니다
- S3 버킷은 `prevent_destroy = true`로 실수로 삭제 방지됨
- Bootstrap의 state는 로컬에 저장됩니다 (이 자체를 원격 저장하면 닭과 달걀 문제)

## 생성되는 리소스

| 리소스 | 이름 | 용도 |
|--------|------|------|
| S3 Bucket | `{project_name}-terraform-state` | State 파일 저장 |
| DynamoDB Table | `{project_name}-terraform-lock` | State Lock |

## 삭제

**주의**: State 파일이 삭제됩니다!

```bash
# prevent_destroy를 false로 변경 후
terraform destroy
```
