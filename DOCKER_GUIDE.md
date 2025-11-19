# Docker 빌드 및 실행 가이드

## 사전 준비

### Docker Desktop 실행 확인
```powershell
docker --version
docker ps
```

---

## Backend 빌드 및 실행

### 옵션 1: Docker에서 모든 것 빌드

```powershell
cd P:\SoftBank\backend
docker build -t myapp-backend .
docker run -d --name backend -p 8080:8080 myapp-backend
```

### 옵션 2: 로컬 빌드 후 Docker 이미지 생성 (빠름)

```powershell
cd P:\SoftBank\backend

# Maven 빌드
mvn clean package

# Docker 이미지 생성
docker build -f Dockerfile.simple -t myapp-backend .

# 실행
docker run -d --name backend -p 8080:8080 myapp-backend
```

### Backend 테스트

```powershell
# Health Check
curl http://localhost:8080/health

# API 테스트
curl http://localhost:8080/api/users
```

### Backend 로그 확인

```powershell
# 실시간 로그
docker logs -f backend

# 최근 100줄
docker logs --tail 100 backend
```

---

## Frontend 빌드 및 실행

### 옵션 1: Docker에서 모든 것 빌드

```powershell
cd P:\SoftBank\frontend
docker build -t myapp-frontend .
docker run -d --name frontend -p 80:80 myapp-frontend
```

### 옵션 2: 로컬 빌드 후 Docker 이미지 생성 (빠름)

```powershell
cd P:\SoftBank\frontend

# npm 빌드
npm install
npm run build

# Docker 이미지 생성
docker build -f Dockerfile.simple -t myapp-frontend .

# 실행
docker run -d --name frontend -p 80:80 myapp-frontend
```

### Frontend 테스트

브라우저에서:
- http://localhost

또는:
```powershell
curl http://localhost/health
```

---

## Docker Compose로 모두 실행 (권장)

### 한 번에 모두 실행

```powershell
cd P:\SoftBank

# 빌드 및 실행
docker-compose up --build

# 백그라운드 실행
docker-compose up -d

# 로그 확인
docker-compose logs -f

# 특정 서비스만
docker-compose logs -f backend
docker-compose logs -f frontend
```

### 서비스 관리

```powershell
# 상태 확인
docker-compose ps

# 서비스 재시작
docker-compose restart backend
docker-compose restart frontend

# 서비스 중지
docker-compose stop

# 서비스 삭제
docker-compose down

# 볼륨까지 삭제
docker-compose down -v
```

---

## 컨테이너 관리

### 실행 중인 컨테이너 확인

```powershell
docker ps
```

### 모든 컨테이너 확인 (중지된 것 포함)

```powershell
docker ps -a
```

### 컨테이너 중지

```powershell
docker stop backend
docker stop frontend
```

### 컨테이너 삭제

```powershell
docker rm backend
docker rm frontend

# 강제 삭제 (실행 중이어도)
docker rm -f backend frontend
```

### 컨테이너 내부 접속

```powershell
# Backend (Alpine은 /bin/sh 사용)
docker exec -it backend /bin/sh

# Frontend
docker exec -it frontend /bin/sh

# 컨테이너 내부에서
wget -O- http://localhost:8080/health
exit
```

---

## 이미지 관리

### 이미지 목록

```powershell
docker images
```

### 이미지 삭제

```powershell
docker rmi myapp-backend
docker rmi myapp-frontend

# 강제 삭제
docker rmi -f myapp-backend myapp-frontend
```

### 사용하지 않는 이미지 정리

```powershell
docker image prune

# 모든 사용하지 않는 이미지 삭제
docker image prune -a
```

---

## 문제 해결

### 포트 충돌

**오류:**
```
Bind for 0.0.0.0:8080 failed: port is already allocated
```

**해결:**
```powershell
# 실행 중인 컨테이너 확인
docker ps

# 해당 컨테이너 중지
docker stop <container-name>

# 또는 다른 포트 사용
docker run -d --name backend -p 8081:8080 myapp-backend
```

### 빌드 실패

**캐시 없이 다시 빌드:**
```powershell
docker build --no-cache -t myapp-backend .
```

**빌드 로그 자세히:**
```powershell
docker build --progress=plain -t myapp-backend .
```

### 컨테이너가 즉시 종료됨

**로그 확인:**
```powershell
docker logs <container-name>
```

**문제 진단:**
```powershell
# 컨테이너 상태 확인
docker ps -a

# 종료 코드 확인
docker inspect <container-name> | grep "ExitCode"
```

### Health Check 실패

**Health Check 상태 확인:**
```powershell
docker inspect backend | grep -A 10 Health
```

**수동으로 Health Check 테스트:**
```powershell
docker exec backend wget --spider http://localhost:8080/health
```

---

## 디버깅

### 네트워크 확인

```powershell
# Docker 네트워크 목록
docker network ls

# 네트워크 상세 정보
docker network inspect bridge
```

### 리소스 사용량 확인

```powershell
# 실시간 통계
docker stats

# 특정 컨테이너만
docker stats backend frontend
```

### 파일 복사

```powershell
# 컨테이너 → 호스트
docker cp backend:/app/logs/app.log ./app.log

# 호스트 → 컨테이너
docker cp ./config.yml backend:/app/config.yml
```

---

## 프로덕션 배포용 이미지 태깅

### 버전 태그 추가

```powershell
# 버전 태그
docker tag myapp-backend:latest myapp-backend:1.0.0
docker tag myapp-frontend:latest myapp-frontend:1.0.0

# ECR용 태그 (AWS 배포 시)
docker tag myapp-backend:latest <AWS_ACCOUNT_ID>.dkr.ecr.ap-northeast-2.amazonaws.com/myapp-backend:latest
docker tag myapp-frontend:latest <AWS_ACCOUNT_ID>.dkr.ecr.ap-northeast-2.amazonaws.com/myapp-frontend:latest
```

---

## 환경별 실행

### Development

```powershell
docker run -d --name backend \
  -p 8080:8080 \
  -e SPRING_PROFILES_ACTIVE=dev \
  myapp-backend
```

### Production

```powershell
docker run -d --name backend \
  -p 8080:8080 \
  -e SPRING_PROFILES_ACTIVE=prod \
  myapp-backend
```

---

## 유용한 명령어 모음

```powershell
# 모든 컨테이너 중지
docker stop $(docker ps -aq)

# 모든 컨테이너 삭제
docker rm $(docker ps -aq)

# 사용하지 않는 리소스 모두 정리
docker system prune -a

# 디스크 사용량 확인
docker system df

# Docker 정보
docker info
```

---

## 다음 단계

Docker 로컬 테스트가 완료되면:
1. [SETUP_GUIDE.md](./SETUP_GUIDE.md) - AWS 인프라 구축
2. [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) - 실제 배포

---

## 빠른 명령어 치트시트

```powershell
# 전체 스택 실행
docker-compose up -d

# 로그 확인
docker-compose logs -f

# 상태 확인
docker-compose ps

# 중지 및 삭제
docker-compose down

# Backend만 재빌드
docker-compose up -d --build backend

# Frontend만 재빌드
docker-compose up -d --build frontend
```

---

**Docker 환경 준비 완료!** 🐳

이제 로컬에서 프로덕션과 동일한 환경으로 테스트할 수 있습니다.
