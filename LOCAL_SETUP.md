# 로컬 실행 가이드 (Docker 없이)

Docker Desktop 없이 로컬에서 애플리케이션을 실행하는 방법입니다.

## 사전 요구사항

### Java 17 설치 확인
```powershell
java -version
```

출력 예시:
```
java version "17.0.x"
```

Java가 없다면:
```powershell
# Chocolatey로 설치
choco install openjdk17 -y

# 또는 수동 다운로드
# https://adoptium.net/
```

### Maven 설치 확인
```powershell
mvn -version
```

Maven이 없다면:
```powershell
# Chocolatey로 설치
choco install maven -y
```

### Node.js 설치 확인
```powershell
node --version
npm --version
```

Node.js가 없다면:
```powershell
# Chocolatey로 설치
choco install nodejs -y
```

---

## Backend 실행 (Spring Boot)

### 방법 1: Maven으로 직접 실행 (권장)

```powershell
cd P:\SoftBank\backend

# 빌드 및 실행
mvn spring-boot:run
```

**성공 메시지:**
```
Tomcat started on port(s): 8080 (http)
Started MyAppApplication in X.XXX seconds
```

### 방법 2: Maven Wrapper 사용

```powershell
cd P:\SoftBank\backend

# Windows
.\mvnw.cmd spring-boot:run

# 또는 (Git Bash)
./mvnw spring-boot:run
```

### 방법 3: JAR 파일로 실행

```powershell
cd P:\SoftBank\backend

# 빌드
mvn clean package

# 실행
java -jar target\myapp-backend.jar
```

### Backend 테스트

**새 PowerShell 창 열기:**
```powershell
# Health Check
curl http://localhost:8080/health

# User API
curl http://localhost:8080/api/users
```

**브라우저에서:**
- http://localhost:8080/health
- http://localhost:8080/api/users

**예상 결과:**
```json
{
  "status": "UP",
  "service": "myapp-backend",
  "version": "1.0.0"
}
```

---

## Frontend 실행 (React)

**새 PowerShell 창 열기:**

```powershell
cd P:\SoftBank\frontend

# 의존성 설치 (최초 1회만)
npm install

# 개발 서버 실행
npm start
```

**성공 메시지:**
```
Compiled successfully!

You can now view myapp-frontend in the browser.

  Local:            http://localhost:3000
```

브라우저가 자동으로 http://localhost:3000 으로 열립니다.

### Frontend 기능 테스트

1. **User 목록 확인**: 3명의 사용자가 표시되어야 함
2. **User 추가**: 폼에서 새 사용자 추가
3. **User 수정**: Edit 버튼 클릭하여 수정
4. **User 삭제**: Delete 버튼 클릭하여 삭제

---

## 문제 해결

### Backend 실행 시 포트 충돌

**오류:**
```
Port 8080 is already in use
```

**해결:**
```powershell
# 포트 사용 중인 프로세스 찾기
netstat -ano | findstr :8080

# 프로세스 종료 (PID 확인 후)
taskkill /PID <PID> /F
```

### Frontend npm install 오류

**오류:**
```
npm ERR! code ENOENT
```

**해결:**
```powershell
# node_modules 삭제 후 재설치
cd frontend
Remove-Item -Recurse -Force node_modules
Remove-Item package-lock.json
npm install
```

### CORS 에러

Frontend에서 Backend API 호출 시 CORS 에러가 발생하면:

**확인 사항:**
1. Backend가 8080 포트에서 실행 중인지 확인
2. `UserController.java`에 `@CrossOrigin(origins = "*")` 어노테이션 있는지 확인

### Maven Wrapper 실행 오류

**오류:**
```
'mvnw' is not recognized as an internal or external command
```

**해결:**
```powershell
# Maven 직접 사용
mvn spring-boot:run

# 또는 mvnw.cmd 사용
.\mvnw.cmd spring-boot:run
```

---

## 개발 워크플로우

### 1. Backend 수정 시

```powershell
# 변경 사항 저장 후
# Ctrl+C로 서버 중지
# 다시 실행
mvn spring-boot:run
```

**Hot Reload 활성화 (선택):**
```xml
<!-- pom.xml에 추가 -->
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-devtools</artifactId>
    <optional>true</optional>
</dependency>
```

### 2. Frontend 수정 시

Frontend는 자동으로 Hot Reload가 활성화되어 있습니다.
- 파일 저장 시 자동으로 브라우저가 새로고침됨

---

## 테스트 실행

### Backend 테스트

```powershell
cd backend

# 모든 테스트 실행
mvn test

# 특정 테스트 클래스 실행
mvn test -Dtest=UserControllerTests
```

### Frontend 테스트

```powershell
cd frontend

# 테스트 실행
npm test

# 커버리지 포함
npm test -- --coverage
```

---

## 빌드 (프로덕션용)

### Backend 빌드

```powershell
cd backend

# JAR 파일 생성
mvn clean package

# 빌드 결과 확인
dir target\*.jar
```

### Frontend 빌드

```powershell
cd frontend

# 프로덕션 빌드
npm run build

# 빌드 결과 확인
dir build\
```

---

## 다음 단계

로컬 개발이 완료되면:

### Docker 사용 (선택)

1. **Docker Desktop 다운로드 및 설치**
   - https://www.docker.com/products/docker-desktop

2. **Docker Desktop 실행**
   - 시스템 트레이에서 Docker 아이콘 확인

3. **Docker 이미지 빌드**
```powershell
# Backend
cd backend
docker build -t myapp-backend .
docker run -p 8080:8080 myapp-backend

# Frontend
cd frontend
docker build -t myapp-frontend .
docker run -p 80:80 myapp-frontend
```

### AWS 배포

Docker 테스트가 완료되면:
1. [SETUP_GUIDE.md](./SETUP_GUIDE.md) - AWS 인프라 구축
2. [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) - 배포 가이드

---

## 추가 도구 (선택)

### IDE 설정

**IntelliJ IDEA (Backend):**
```
File → Open → P:\SoftBank\backend\pom.xml
Run → Edit Configurations → Spring Boot
Main class: com.myapp.MyAppApplication
```

**VS Code (Frontend):**
```
File → Open Folder → P:\SoftBank\frontend
Extensions 설치:
  - ESLint
  - Prettier
  - React Developer Tools
```

### 데이터베이스 (향후 추가 가능)

현재는 In-Memory 저장소를 사용하지만, 향후 PostgreSQL 연동 가능:
```powershell
# PostgreSQL (Docker 사용)
docker run -d \
  --name postgres \
  -e POSTGRES_PASSWORD=password \
  -e POSTGRES_DB=myapp \
  -p 5432:5432 \
  postgres:15-alpine
```

---

## 요약

### Backend
```powershell
cd P:\SoftBank\backend
mvn spring-boot:run
```
→ http://localhost:8080

### Frontend
```powershell
cd P:\SoftBank\frontend
npm install
npm start
```
→ http://localhost:3000

### 확인
- Backend Health: http://localhost:8080/health
- Backend API: http://localhost:8080/api/users
- Frontend UI: http://localhost:3000

---

**로컬 개발 완료!** 🎉

이제 코드를 수정하고 테스트할 수 있습니다.
Docker와 AWS 배포는 준비되면 진행하세요.
