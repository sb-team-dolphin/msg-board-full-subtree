# 배포 가이드

## 목차

1. [첫 배포 실행](#첫-배포-실행)
2. [수동 배포](#수동-배포)
3. [롤백 방법](#롤백-방법)
4. [배포 모니터링](#배포-모니터링)
5. [환경별 배포](#환경별-배포)

---

## 첫 배포 실행

### 사전 준비 체크리스트

- [ ] Terraform으로 인프라 구축 완료
- [ ] GitHub Secrets 설정 완료
- [ ] ECR Repository 생성 확인
- [ ] ECS Cluster 생성 확인

### 1단계: 초기 Docker 이미지 Push

ECS Service를 처음 생성할 때는 ECR에 이미지가 있어야 합니다.

#### Backend 이미지 Push

```bash
cd backend

# AWS CLI로 ECR 로그인
aws ecr get-login-password --region ap-northeast-2 | \
  docker login --username AWS --password-stdin \
  <AWS_ACCOUNT_ID>.dkr.ecr.ap-northeast-2.amazonaws.com

# Docker 이미지 빌드
docker build -t myapp-backend .

# ECR Repository URL 확인 (Terraform output에서)
ECR_URL=$(cd ../terraform && terraform output -raw ecr_backend_repository_url)

# 이미지 태깅
docker tag myapp-backend:latest $ECR_URL:latest

# ECR에 Push
docker push $ECR_URL:latest
```

#### Frontend 이미지 Push

```bash
cd frontend

# Docker 이미지 빌드
docker build -t myapp-frontend .

# ECR Repository URL 확인
ECR_URL=$(cd ../terraform && terraform output -raw ecr_frontend_repository_url)

# 이미지 태깅
docker tag myapp-frontend:latest $ECR_URL:latest

# ECR에 Push
docker push $ECR_URL:latest
```

### 2단계: ECS Service 시작 확인

```bash
# Backend Service 확인
aws ecs describe-services \
  --cluster myapp-cluster \
  --services myapp-backend-service \
  --region ap-northeast-2

# Task 실행 확인
aws ecs list-tasks \
  --cluster myapp-cluster \
  --service-name myapp-backend-service \
  --region ap-northeast-2
```

### 3단계: ALB Health Check 확인

```bash
# ALB DNS 확인
ALB_DNS=$(cd terraform && terraform output -raw alb_dns_name)

# Health Check
curl http://$ALB_DNS/health

# Backend API 테스트
curl http://$ALB_DNS/api/users

# Frontend 접속
echo "Frontend URL: http://$ALB_DNS"
```

### 4단계: GitHub Actions로 자동 배포

```bash
# 코드 수정 (예: README 수정)
echo "# MyApp" > README.md

# Git 커밋 및 Push
git add .
git commit -m "Trigger first deployment"
git push origin main
```

**GitHub에서 확인:**
1. Repository → Actions 탭
2. 워크플로우 실행 확인
3. 실시간 로그 확인

---

## 수동 배포

GitHub Actions 없이 수동으로 배포하는 방법

### Backend 수동 배포

```bash
# 1. Docker 이미지 빌드
cd backend
docker build -t myapp-backend:v1.0.1 .

# 2. ECR 로그인
aws ecr get-login-password --region ap-northeast-2 | \
  docker login --username AWS --password-stdin \
  <AWS_ACCOUNT_ID>.dkr.ecr.ap-northeast-2.amazonaws.com

# 3. 이미지 태깅 및 Push
ECR_URL=<AWS_ACCOUNT_ID>.dkr.ecr.ap-northeast-2.amazonaws.com/myapp-backend
docker tag myapp-backend:v1.0.1 $ECR_URL:v1.0.1
docker tag myapp-backend:v1.0.1 $ECR_URL:latest
docker push $ECR_URL:v1.0.1
docker push $ECR_URL:latest

# 4. ECS Service 강제 재배포
aws ecs update-service \
  --cluster myapp-cluster \
  --service myapp-backend-service \
  --force-new-deployment \
  --region ap-northeast-2

# 5. 배포 확인
aws ecs describe-services \
  --cluster myapp-cluster \
  --services myapp-backend-service \
  --query 'services[0].deployments' \
  --region ap-northeast-2
```

### Frontend 수동 배포

```bash
# 1. Docker 이미지 빌드
cd frontend
docker build -t myapp-frontend:v1.0.1 .

# 2. 이미지 Push (Backend와 동일한 방법)
ECR_URL=<AWS_ACCOUNT_ID>.dkr.ecr.ap-northeast-2.amazonaws.com/myapp-frontend
docker tag myapp-frontend:v1.0.1 $ECR_URL:v1.0.1
docker tag myapp-frontend:v1.0.1 $ECR_URL:latest
docker push $ECR_URL:v1.0.1
docker push $ECR_URL:latest

# 3. ECS Service 재배포
aws ecs update-service \
  --cluster myapp-cluster \
  --service myapp-frontend-service \
  --force-new-deployment \
  --region ap-northeast-2
```

---

## 롤백 방법

### 자동 롤백

ECS는 Health Check 실패 시 자동으로 이전 버전으로 롤백합니다.

**Circuit Breaker 설정 (Terraform에서 활성화됨):**
```hcl
deployment_circuit_breaker {
  enable   = true
  rollback = true
}
```

### 수동 롤백

#### 1. 이전 Task Definition으로 롤백

```bash
# 현재 Task Definition 확인
aws ecs describe-services \
  --cluster myapp-cluster \
  --services myapp-backend-service \
  --query 'services[0].taskDefinition' \
  --region ap-northeast-2

# Task Definition 목록 확인
aws ecs list-task-definitions \
  --family-prefix myapp-backend-task \
  --region ap-northeast-2

# 이전 버전으로 롤백 (예: revision 5)
aws ecs update-service \
  --cluster myapp-cluster \
  --service myapp-backend-service \
  --task-definition myapp-backend-task:5 \
  --force-new-deployment \
  --region ap-northeast-2
```

#### 2. 이전 Docker 이미지로 롤백

```bash
# ECR 이미지 목록 확인
aws ecr describe-images \
  --repository-name myapp-backend \
  --query 'sort_by(imageDetails,& imagePushedAt)[*].[imageTags[0],imagePushedAt]' \
  --output table \
  --region ap-northeast-2

# 특정 이미지로 재배포
# (Task Definition을 수정하여 이미지 태그 변경 필요)
```

#### 3. GitHub Actions에서 이전 커밋 재배포

```bash
# 이전 커밋 해시 확인
git log --oneline

# 이전 커밋으로 되돌리기
git revert HEAD

# Push하여 자동 배포
git push origin main
```

---

## 배포 모니터링

### ECS 배포 상태 확인

```bash
# 실시간 배포 모니터링
watch -n 5 'aws ecs describe-services \
  --cluster myapp-cluster \
  --services myapp-backend-service \
  --query "services[0].deployments" \
  --region ap-northeast-2'
```

**출력 해석:**
- `runningCount`: 현재 실행 중인 Task 수
- `desiredCount`: 목표 Task 수
- `status`: PRIMARY (현재 버전), ACTIVE (새 버전)

### CloudWatch Logs 확인

```bash
# Backend 로그 실시간 확인
aws logs tail /ecs/myapp-backend --follow --region ap-northeast-2

# Frontend 로그 실시간 확인
aws logs tail /ecs/myapp-frontend --follow --region ap-northeast-2

# 에러 로그만 필터링
aws logs tail /ecs/myapp-backend --follow --filter-pattern "ERROR" --region ap-northeast-2
```

### ALB Health Check 상태

```bash
# Target Group Health 확인
aws elbv2 describe-target-health \
  --target-group-arn <TARGET_GROUP_ARN> \
  --region ap-northeast-2

# Terraform output에서 Target Group ARN 확인
cd terraform
terraform output
```

### CloudWatch 메트릭

AWS Console → CloudWatch → Metrics:
- **ECS**:
  - CPUUtilization
  - MemoryUtilization
- **ALB**:
  - TargetResponseTime
  - RequestCount
  - HTTPCode_Target_5XX_Count
  - HealthyHostCount
  - UnHealthyHostCount

---

## 환경별 배포

### Development 환경

```bash
# Dev 브랜치에 Push
git checkout develop
git push origin develop
```

**GitHub Actions 설정:**
```yaml
on:
  push:
    branches:
      - develop
```

### Staging 환경

```bash
# Staging 브랜치 생성 및 배포
git checkout -b staging
git push origin staging
```

### Production 환경

```bash
# Main 브랜치로 Merge
git checkout main
git merge staging
git push origin main
```

---

## Blue/Green 배포 (향후 추가)

현재 Rolling Update 방식을 사용하고 있습니다.
Blue/Green 배포를 원하면 CodeDeploy 설정이 필요합니다.

### CodeDeploy 추가 설정

```hcl
# Terraform에 추가
deployment_controller {
  type = "CODE_DEPLOY"
}
```

---

## 배포 체크리스트

### 배포 전
- [ ] 로컬 테스트 완료
- [ ] Unit 테스트 통과
- [ ] Docker 이미지 빌드 확인
- [ ] 환경 변수 확인
- [ ] Health Check 엔드포인트 확인

### 배포 중
- [ ] GitHub Actions 워크플로우 실행 확인
- [ ] ECR 이미지 Push 완료
- [ ] ECS 새 Task 시작 확인
- [ ] Health Check 통과 확인
- [ ] 이전 Task 종료 확인

### 배포 후
- [ ] ALB로 접속 확인
- [ ] API 동작 확인
- [ ] Frontend 정상 작동 확인
- [ ] CloudWatch 로그 확인
- [ ] 에러 없는지 모니터링

---

## 배포 시간

### 예상 소요 시간

| 단계 | 시간 |
|------|------|
| GitHub Actions CI (Build + Test) | 2-3분 |
| Docker 이미지 빌드 및 ECR Push | 2-3분 |
| ECS 새 Task 시작 | 1-2분 |
| Health Check 및 트래픽 전환 | 1-2분 |
| 이전 Task 종료 | 30초 |
| **총 배포 시간** | **약 7-11분** |

---

## 배포 전략

### Rolling Update (현재 사용 중)

**장점:**
- 설정 간단
- 추가 비용 없음
- 점진적 배포

**단점:**
- 일시적으로 두 버전 동시 실행
- 롤백이 느림

**설정:**
```hcl
deployment_configuration {
  maximum_percent         = 200  # 최대 200% (2배)
  minimum_healthy_percent = 100  # 최소 100% 유지
}
```

### Blue/Green (향후 추가 가능)

**장점:**
- 즉시 롤백 가능
- 트래픽 전환 제어
- 테스트 시간 확보

**단점:**
- 2배 리소스 필요 (비용 증가)
- 설정 복잡

---

## 트러블슈팅

### 배포가 실패하는 경우

1. **CloudWatch Logs 확인**
```bash
aws logs tail /ecs/myapp-backend --follow
```

2. **ECS 이벤트 확인**
```bash
aws ecs describe-services \
  --cluster myapp-cluster \
  --services myapp-backend-service \
  --query 'services[0].events[0:10]'
```

3. **Task 실행 실패 원인 확인**
```bash
aws ecs describe-tasks \
  --cluster myapp-cluster \
  --tasks <TASK_ARN> \
  --query 'tasks[0].stopReason'
```

### Health Check 실패

**확인 사항:**
- `/health` 엔드포인트가 200 응답하는지
- 컨테이너 시작 시간이 충분한지 (startPeriod 확인)
- Security Group에서 ALB → ECS 통신 허용되는지

---

## 다음 단계

- [트러블슈팅 가이드](./TROUBLESHOOTING.md)
- [모니터링 설정](./MONITORING_GUIDE.md)
- [보안 강화](./SECURITY_GUIDE.md)

---

## 참고

- [AWS ECS Deployment Types](https://docs.aws.amazon.com/AmazonECS/latest/developerguide/deployment-types.html)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
