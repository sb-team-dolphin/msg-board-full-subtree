# GitHub Actions CI/CD 설계

## 목차
- [GitHub Actions 개요](#github-actions-개요)
- [CI/CD 파이프라인 구조](#cicd-파이프라인-구조)
- [워크플로우 설계](#워크플로우-설계)
- [백엔드 워크플로우 예시](#백엔드-워크플로우-예시)
- [프론트엔드 워크플로우 예시](#프론트엔드-워크플로우-예시)
- [Secrets 설정](#secrets-설정)
- [베스트 프랙티스](#베스트-프랙티스)

---

## GitHub Actions 개요

### GitHub Actions란?
- GitHub에 내장된 CI/CD 플랫폼
- 코드 push, PR 생성 등 이벤트에 자동으로 반응
- YAML 파일로 워크플로우 정의
- 무료 사용 가능 (Public 저장소 무제한, Private 월 2,000분)

### 왜 GitHub Actions를 사용하는가?

**장점:**
- GitHub와 완벽 통합 (별도 설정 불필요)
- 다양한 이벤트 트리거 지원
- Marketplace에서 재사용 가능한 Actions 제공
- 병렬 실행으로 빠른 빌드
- 다양한 환경 (Linux, Windows, macOS) 지원

---

## CI/CD 파이프라인 구조

```
┌─────────────────────────────────────────────────────────────┐
│                   GitHub Repository                          │
│                                                              │
│  Developer pushes code → triggers workflow                  │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│                   CI Stage (Continuous Integration)          │
│                                                              │
│  1. Checkout Code                                           │
│  2. Setup Environment (Java/Node.js/Python)                 │
│  3. Install Dependencies                                     │
│  4. Run Tests (Unit, Integration)                           │
│  5. Code Quality Check (Linting, SonarQube)                 │
│  6. Build Application                                        │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│                   Build & Push Docker Image                  │
│                                                              │
│  1. Build Docker Image                                       │
│  2. Tag Image (latest, version, commit-sha)                 │
│  3. Login to AWS ECR                                         │
│  4. Push Image to ECR                                        │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│                   CD Stage (Continuous Deployment)           │
│                                                              │
│  1. Update ECS Task Definition                              │
│  2. Register New Task Definition                            │
│  3. Trigger ECS Service Update                              │
│  4. Wait for Deployment (Blue/Green)                        │
│  5. Verify Health Checks                                     │
└─────────────────────────────────────────────────────────────┘
                          ↓
                   ✅ Deployment Complete
```

---

## 워크플로우 설계

### 디렉토리 구조

```
.github/
└── workflows/
    ├── backend-ci-cd.yml          # 백엔드 CI/CD
    ├── frontend-ci-cd.yml         # 프론트엔드 CI/CD
    ├── pr-check.yml               # Pull Request 검증
    └── deploy-staging.yml         # Staging 환경 배포
```

---

### 트리거 설정

```yaml
# main 브랜치에 push 시 자동 배포
on:
  push:
    branches:
      - main
      - develop

# Pull Request 생성 시 검증만 수행
on:
  pull_request:
    branches:
      - main

# 수동 실행 가능
on:
  workflow_dispatch:
    inputs:
      environment:
        description: 'Environment to deploy'
        required: true
        default: 'staging'
```

---

## 백엔드 워크플로우 예시

### Java Spring Boot (Maven)

`.github/workflows/backend-ci-cd.yml`

```yaml
name: Backend CI/CD Pipeline

on:
  push:
    branches:
      - main
    paths:
      - 'backend/**'
  workflow_dispatch:

env:
  AWS_REGION: ap-northeast-2
  ECR_REPOSITORY: my-app-backend
  ECS_SERVICE: my-app-backend-service
  ECS_CLUSTER: my-app-cluster
  ECS_TASK_DEFINITION: backend-task-definition
  CONTAINER_NAME: backend

jobs:
  # ============================================
  # CI Stage: Build & Test
  # ============================================
  build-and-test:
    name: Build and Test
    runs-on: ubuntu-latest

    steps:
      # 1. 소스 코드 체크아웃
      - name: Checkout code
        uses: actions/checkout@v4

      # 2. Java 환경 설정
      - name: Set up JDK 17
        uses: actions/setup-java@v4
        with:
          java-version: '17'
          distribution: 'temurin'
          cache: 'maven'

      # 3. 의존성 설치 및 빌드
      - name: Build with Maven
        working-directory: ./backend
        run: mvn clean package -DskipTests

      # 4. 테스트 실행
      - name: Run tests
        working-directory: ./backend
        run: mvn test

      # 5. 테스트 결과 업로드
      - name: Upload test results
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: test-results
          path: backend/target/surefire-reports/

      # 6. 빌드된 JAR 파일 업로드 (다음 Job에서 사용)
      - name: Upload JAR artifact
        uses: actions/upload-artifact@v4
        with:
          name: app-jar
          path: backend/target/*.jar

  # ============================================
  # Docker Build & Push to ECR
  # ============================================
  build-and-push:
    name: Build Docker Image and Push to ECR
    runs-on: ubuntu-latest
    needs: build-and-test
    outputs:
      image: ${{ steps.build-image.outputs.image }}

    steps:
      # 1. 소스 코드 체크아웃
      - name: Checkout code
        uses: actions/checkout@v4

      # 2. 이전 Job에서 빌드한 JAR 다운로드
      - name: Download JAR artifact
        uses: actions/download-artifact@v4
        with:
          name: app-jar
          path: backend/target/

      # 3. AWS 자격 증명 설정
      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v4
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: ${{ env.AWS_REGION }}

      # 4. ECR 로그인
      - name: Login to Amazon ECR
        id: login-ecr
        uses: aws-actions/amazon-ecr-login@v2

      # 5. Docker 이미지 빌드 및 태깅
      - name: Build, tag, and push image to Amazon ECR
        id: build-image
        env:
          ECR_REGISTRY: ${{ steps.login-ecr.outputs.registry }}
          IMAGE_TAG: ${{ github.sha }}
        working-directory: ./backend
        run: |
          # Docker 이미지 빌드
          docker build -t $ECR_REGISTRY/$ECR_REPOSITORY:$IMAGE_TAG .
          docker tag $ECR_REGISTRY/$ECR_REPOSITORY:$IMAGE_TAG $ECR_REGISTRY/$ECR_REPOSITORY:latest

          # ECR에 이미지 Push
          docker push $ECR_REGISTRY/$ECR_REPOSITORY:$IMAGE_TAG
          docker push $ECR_REGISTRY/$ECR_REPOSITORY:latest

          # 다음 Job에서 사용할 이미지 URI 출력
          echo "image=$ECR_REGISTRY/$ECR_REPOSITORY:$IMAGE_TAG" >> $GITHUB_OUTPUT

  # ============================================
  # CD Stage: Deploy to ECS
  # ============================================
  deploy:
    name: Deploy to ECS
    runs-on: ubuntu-latest
    needs: build-and-push

    steps:
      # 1. 소스 코드 체크아웃
      - name: Checkout code
        uses: actions/checkout@v4

      # 2. AWS 자격 증명 설정
      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v4
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: ${{ env.AWS_REGION }}

      # 3. 현재 Task Definition 가져오기
      - name: Download task definition
        run: |
          aws ecs describe-task-definition \
            --task-definition ${{ env.ECS_TASK_DEFINITION }} \
            --query taskDefinition > task-definition.json

      # 4. 새 이미지로 Task Definition 업데이트
      - name: Fill in the new image ID in the Amazon ECS task definition
        id: task-def
        uses: aws-actions/amazon-ecs-render-task-definition@v1
        with:
          task-definition: task-definition.json
          container-name: ${{ env.CONTAINER_NAME }}
          image: ${{ needs.build-and-push.outputs.image }}

      # 5. ECS 서비스 배포 (Blue/Green)
      - name: Deploy Amazon ECS task definition
        uses: aws-actions/amazon-ecs-deploy-task-definition@v1
        with:
          task-definition: ${{ steps.task-def.outputs.task-definition }}
          service: ${{ env.ECS_SERVICE }}
          cluster: ${{ env.ECS_CLUSTER }}
          wait-for-service-stability: true

      # 6. 배포 완료 알림
      - name: Deployment success
        run: |
          echo "✅ Deployment completed successfully!"
          echo "Image: ${{ needs.build-and-push.outputs.image }}"
```

---

### Dockerfile (Backend)

`backend/Dockerfile`

```dockerfile
# Multi-stage build for smaller image size

# Stage 1: Build (이미 GitHub Actions에서 빌드했으므로 생략 가능)
FROM eclipse-temurin:17-jdk-alpine AS builder
WORKDIR /app
COPY target/*.jar app.jar
RUN java -Djarmode=layertools -jar app.jar extract

# Stage 2: Runtime
FROM eclipse-temurin:17-jre-alpine
WORKDIR /app

# 보안을 위해 non-root user 생성
RUN addgroup -S spring && adduser -S spring -G spring
USER spring:spring

# JAR 파일 복사
COPY --from=builder app/dependencies/ ./
COPY --from=builder app/spring-boot-loader/ ./
COPY --from=builder app/snapshot-dependencies/ ./
COPY --from=builder app/application/ ./

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:8080/health || exit 1

# Port 노출
EXPOSE 8080

# 애플리케이션 실행
ENTRYPOINT ["java", "org.springframework.boot.loader.JarLauncher"]
```

---

## 프론트엔드 워크플로우 예시

### React (npm)

`.github/workflows/frontend-ci-cd.yml`

```yaml
name: Frontend CI/CD Pipeline

on:
  push:
    branches:
      - main
    paths:
      - 'frontend/**'
  workflow_dispatch:

env:
  AWS_REGION: ap-northeast-2
  ECR_REPOSITORY: my-app-frontend
  ECS_SERVICE: my-app-frontend-service
  ECS_CLUSTER: my-app-cluster
  ECS_TASK_DEFINITION: frontend-task-definition
  CONTAINER_NAME: frontend

jobs:
  # ============================================
  # CI Stage: Build & Test
  # ============================================
  build-and-test:
    name: Build and Test
    runs-on: ubuntu-latest

    steps:
      # 1. 소스 코드 체크아웃
      - name: Checkout code
        uses: actions/checkout@v4

      # 2. Node.js 환경 설정
      - name: Set up Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'
          cache-dependency-path: frontend/package-lock.json

      # 3. 의존성 설치
      - name: Install dependencies
        working-directory: ./frontend
        run: npm ci

      # 4. Linting (코드 품질 검사)
      - name: Run ESLint
        working-directory: ./frontend
        run: npm run lint

      # 5. 테스트 실행
      - name: Run tests
        working-directory: ./frontend
        run: npm test -- --coverage

      # 6. 프로덕션 빌드
      - name: Build application
        working-directory: ./frontend
        env:
          REACT_APP_API_URL: ${{ secrets.API_URL }}
        run: npm run build

      # 7. 빌드 결과물 업로드
      - name: Upload build artifacts
        uses: actions/upload-artifact@v4
        with:
          name: frontend-build
          path: frontend/build/

  # ============================================
  # Docker Build & Push to ECR
  # ============================================
  build-and-push:
    name: Build Docker Image and Push to ECR
    runs-on: ubuntu-latest
    needs: build-and-test
    outputs:
      image: ${{ steps.build-image.outputs.image }}

    steps:
      # 1. 소스 코드 체크아웃
      - name: Checkout code
        uses: actions/checkout@v4

      # 2. 빌드 결과물 다운로드
      - name: Download build artifacts
        uses: actions/download-artifact@v4
        with:
          name: frontend-build
          path: frontend/build/

      # 3. AWS 자격 증명 설정
      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v4
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: ${{ env.AWS_REGION }}

      # 4. ECR 로그인
      - name: Login to Amazon ECR
        id: login-ecr
        uses: aws-actions/amazon-ecr-login@v2

      # 5. Docker 이미지 빌드 및 Push
      - name: Build, tag, and push image to Amazon ECR
        id: build-image
        env:
          ECR_REGISTRY: ${{ steps.login-ecr.outputs.registry }}
          IMAGE_TAG: ${{ github.sha }}
        working-directory: ./frontend
        run: |
          docker build -t $ECR_REGISTRY/$ECR_REPOSITORY:$IMAGE_TAG .
          docker tag $ECR_REGISTRY/$ECR_REPOSITORY:$IMAGE_TAG $ECR_REGISTRY/$ECR_REPOSITORY:latest
          docker push $ECR_REGISTRY/$ECR_REPOSITORY:$IMAGE_TAG
          docker push $ECR_REGISTRY/$ECR_REPOSITORY:latest
          echo "image=$ECR_REGISTRY/$ECR_REPOSITORY:$IMAGE_TAG" >> $GITHUB_OUTPUT

  # ============================================
  # CD Stage: Deploy to ECS
  # ============================================
  deploy:
    name: Deploy to ECS
    runs-on: ubuntu-latest
    needs: build-and-push

    steps:
      # 1. 소스 코드 체크아웃
      - name: Checkout code
        uses: actions/checkout@v4

      # 2. AWS 자격 증명 설정
      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v4
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: ${{ env.AWS_REGION }}

      # 3. Task Definition 업데이트 및 배포
      - name: Download task definition
        run: |
          aws ecs describe-task-definition \
            --task-definition ${{ env.ECS_TASK_DEFINITION }} \
            --query taskDefinition > task-definition.json

      - name: Fill in the new image ID in the Amazon ECS task definition
        id: task-def
        uses: aws-actions/amazon-ecs-render-task-definition@v1
        with:
          task-definition: task-definition.json
          container-name: ${{ env.CONTAINER_NAME }}
          image: ${{ needs.build-and-push.outputs.image }}

      - name: Deploy Amazon ECS task definition
        uses: aws-actions/amazon-ecs-deploy-task-definition@v1
        with:
          task-definition: ${{ steps.task-def.outputs.task-definition }}
          service: ${{ env.ECS_SERVICE }}
          cluster: ${{ env.ECS_CLUSTER }}
          wait-for-service-stability: true

      - name: Deployment success
        run: echo "✅ Frontend deployment completed!"
```

---

### Dockerfile (Frontend)

`frontend/Dockerfile`

```dockerfile
# Multi-stage build

# Stage 1: Build (이미 빌드된 경우 생략 가능)
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Stage 2: Runtime (Nginx로 정적 파일 서빙)
FROM nginx:alpine

# Nginx 설정 파일 복사
COPY nginx.conf /etc/nginx/conf.d/default.conf

# 빌드된 파일 복사
COPY --from=builder /app/build /usr/share/nginx/html

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:80/health || exit 1

# Port 노출
EXPOSE 80

# Nginx 실행
CMD ["nginx", "-g", "daemon off;"]
```

---

### Nginx 설정 (frontend/nginx.conf)

```nginx
server {
    listen 80;
    server_name localhost;
    root /usr/share/nginx/html;
    index index.html;

    # Health check endpoint
    location /health {
        access_log off;
        return 200 "OK\n";
        add_header Content-Type text/plain;
    }

    # SPA routing (React Router 등)
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Gzip 압축
    gzip on;
    gzip_vary on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;

    # 캐싱 설정
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

---

## Secrets 설정

### GitHub Secrets 등록

```
Repository → Settings → Secrets and variables → Actions → New repository secret
```

**필수 Secrets:**

```
AWS_ACCESS_KEY_ID          # AWS IAM 사용자 Access Key
AWS_SECRET_ACCESS_KEY      # AWS IAM 사용자 Secret Key
API_URL                    # 백엔드 API URL (프론트엔드용)
```

**선택 Secrets:**

```
SLACK_WEBHOOK_URL          # Slack 알림용
SONAR_TOKEN                # SonarQube 코드 품질 분석용
```

---

### IAM 사용자 권한

GitHub Actions에서 사용할 IAM 사용자에 필요한 권한:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "ecr:GetAuthorizationToken",
        "ecr:BatchCheckLayerAvailability",
        "ecr:GetDownloadUrlForLayer",
        "ecr:PutImage",
        "ecr:InitiateLayerUpload",
        "ecr:UploadLayerPart",
        "ecr:CompleteLayerUpload"
      ],
      "Resource": "*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "ecs:DescribeTaskDefinition",
        "ecs:RegisterTaskDefinition",
        "ecs:UpdateService",
        "ecs:DescribeServices"
      ],
      "Resource": "*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "iam:PassRole"
      ],
      "Resource": "arn:aws:iam::*:role/ecsTaskExecutionRole"
    }
  ]
}
```

---

## 베스트 프랙티스

### 1. Job 분리 및 병렬 실행
```yaml
jobs:
  lint:
    runs-on: ubuntu-latest
    steps: [...]

  test:
    runs-on: ubuntu-latest
    steps: [...]

  build:
    needs: [lint, test]  # lint, test가 성공해야 실행
    runs-on: ubuntu-latest
    steps: [...]
```

---

### 2. 캐싱 활용 (빌드 속도 향상)

```yaml
# Maven 캐시
- uses: actions/setup-java@v4
  with:
    cache: 'maven'

# npm 캐시
- uses: actions/setup-node@v4
  with:
    cache: 'npm'

# Docker 레이어 캐시
- uses: docker/build-push-action@v5
  with:
    cache-from: type=gha
    cache-to: type=gha,mode=max
```

---

### 3. 환경별 배포

```yaml
jobs:
  deploy:
    strategy:
      matrix:
        environment: [staging, production]
    environment: ${{ matrix.environment }}
    steps:
      - name: Deploy to ${{ matrix.environment }}
        run: |
          # 환경별 배포 로직
```

---

### 4. 알림 설정 (Slack)

```yaml
- name: Notify Slack on success
  if: success()
  uses: slackapi/slack-github-action@v1
  with:
    webhook-url: ${{ secrets.SLACK_WEBHOOK_URL }}
    payload: |
      {
        "text": "✅ Deployment successful: ${{ github.sha }}"
      }

- name: Notify Slack on failure
  if: failure()
  uses: slackapi/slack-github-action@v1
  with:
    webhook-url: ${{ secrets.SLACK_WEBHOOK_URL }}
    payload: |
      {
        "text": "❌ Deployment failed: ${{ github.sha }}"
      }
```

---

### 5. PR 자동 검증

`.github/workflows/pr-check.yml`

```yaml
name: Pull Request Check

on:
  pull_request:
    branches:
      - main

jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'

      - name: Install dependencies
        run: npm ci

      - name: Lint
        run: npm run lint

      - name: Test
        run: npm test

      - name: Build
        run: npm run build

      # PR에 코멘트 추가
      - name: Comment PR
        uses: actions/github-script@v7
        with:
          script: |
            github.rest.issues.createComment({
              issue_number: context.issue.number,
              owner: context.repo.owner,
              repo: context.repo.repo,
              body: '✅ All checks passed!'
            })
```

---

## 주요 명령어 및 팁

### 로컬에서 워크플로우 테스트

```bash
# act 도구 설치 (GitHub Actions 로컬 실행)
brew install act

# 워크플로우 실행
act push

# 특정 Job만 실행
act -j build
```

---

### 워크플로우 디버깅

```yaml
- name: Debug
  run: |
    echo "Current directory: $(pwd)"
    echo "Files: $(ls -la)"
    echo "Environment: ${{ runner.os }}"
```

---

## 다음 단계

GitHub Actions 설정이 완료되면:
- [04-ecr-ecs-bluegreen.md](./04-ecr-ecs-bluegreen.md) - ECS Blue/Green 배포 상세
