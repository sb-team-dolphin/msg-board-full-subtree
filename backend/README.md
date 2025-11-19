# MyApp Backend

Spring Boot 기반 RESTful API 서버

## 기술 스택

- Java 17
- Spring Boot 3.2.0
- Maven
- Lombok

## 빠른 시작

### 사전 요구사항

- JDK 17 이상
- Maven 3.6 이상

### 로컬 실행

```bash
# 빌드
mvn clean package

# 실행
mvn spring-boot:run

# 또는 JAR 파일 실행
java -jar target/myapp-backend.jar
```

애플리케이션이 http://localhost:8080 에서 실행됩니다.

### Docker로 실행

```bash
# Docker 이미지 빌드
docker build -t myapp-backend .

# Docker 컨테이너 실행
docker run -p 8080:8080 myapp-backend
```

---

## API 엔드포인트

### Health Check

```bash
# 기본 Health Check
GET /health

# 상세 Health Check
GET /health/detail

# Actuator Health
GET /actuator/health
```

### User API

#### 모든 사용자 조회
```bash
GET /api/users

# 예시
curl http://localhost:8080/api/users
```

#### 사용자 상세 조회
```bash
GET /api/users/{id}

# 예시
curl http://localhost:8080/api/users/1
```

#### 사용자 생성
```bash
POST /api/users
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "role": "Developer"
}

# 예시
curl -X POST http://localhost:8080/api/users \
  -H "Content-Type: application/json" \
  -d '{"name":"John Doe","email":"john@example.com","role":"Developer"}'
```

#### 사용자 수정
```bash
PUT /api/users/{id}
Content-Type: application/json

{
  "name": "John Updated",
  "email": "john.updated@example.com",
  "role": "Senior Developer"
}

# 예시
curl -X PUT http://localhost:8080/api/users/1 \
  -H "Content-Type: application/json" \
  -d '{"name":"John Updated","email":"john.updated@example.com","role":"Senior Developer"}'
```

#### 사용자 삭제
```bash
DELETE /api/users/{id}

# 예시
curl -X DELETE http://localhost:8080/api/users/1
```

---

## 테스트

```bash
# 모든 테스트 실행
mvn test

# 특정 테스트 클래스 실행
mvn test -Dtest=UserControllerTests

# 테스트 커버리지 리포트 생성
mvn test jacoco:report
```

---

## 프로파일

### dev (개발)
```bash
mvn spring-boot:run -Dspring-boot.run.profiles=dev
```

### prod (프로덕션)
```bash
java -jar target/myapp-backend.jar --spring.profiles.active=prod
```

---

## 환경 변수

| 변수명 | 설명 | 기본값 |
|--------|------|--------|
| `SPRING_PROFILES_ACTIVE` | 활성 프로파일 | `dev` |
| `SERVER_PORT` | 서버 포트 | `8080` |

---

## 프로젝트 구조

```
backend/
├── src/
│   ├── main/
│   │   ├── java/com/myapp/
│   │   │   ├── MyAppApplication.java       # 메인 클래스
│   │   │   ├── controller/
│   │   │   │   ├── HealthController.java   # Health Check API
│   │   │   │   └── UserController.java     # User CRUD API
│   │   │   ├── service/
│   │   │   │   └── UserService.java        # 비즈니스 로직
│   │   │   ├── repository/
│   │   │   │   └── UserRepository.java     # 데이터 저장소
│   │   │   └── model/
│   │   │       └── User.java               # User 모델
│   │   └── resources/
│   │       ├── application.yml             # 기본 설정
│   │       └── application-prod.yml        # 프로덕션 설정
│   └── test/
│       └── java/com/myapp/
│           ├── MyAppApplicationTests.java
│           └── controller/
│               └── UserControllerTests.java
├── Dockerfile
├── .dockerignore
├── pom.xml
└── README.md
```

---

## 빌드 및 배포

### Maven 빌드

```bash
# 컴파일
mvn compile

# 패키징 (JAR 생성)
mvn clean package

# 테스트 없이 패키징
mvn clean package -DskipTests
```

### Docker 빌드

```bash
# 이미지 빌드
docker build -t myapp-backend:latest .

# 특정 태그로 빌드
docker build -t myapp-backend:1.0.0 .

# 이미지 확인
docker images | grep myapp-backend
```

---

## 트러블슈팅

### 포트 충돌
```bash
# 8080 포트를 사용 중인 프로세스 확인 (Windows)
netstat -ano | findstr :8080

# 다른 포트로 실행
mvn spring-boot:run -Dspring-boot.run.arguments=--server.port=8081
```

### 메모리 부족
```bash
# JVM 힙 메모리 설정
export MAVEN_OPTS="-Xmx1024m"
mvn spring-boot:run
```

### Docker 빌드 실패
```bash
# Maven wrapper 권한 부여 (Linux/Mac)
chmod +x mvnw

# Docker 캐시 없이 빌드
docker build --no-cache -t myapp-backend .
```

---

## 로그 확인

### 로컬 실행 시
로그는 콘솔에 출력됩니다.

### Docker 실행 시
```bash
# 컨테이너 로그 확인
docker logs <container-id>

# 실시간 로그 확인
docker logs -f <container-id>
```

### ECS 배포 시
CloudWatch Logs에서 확인:
```bash
aws logs tail /ecs/myapp-backend --follow
```

---

## 다음 단계

1. [프론트엔드](../frontend/README.md)와 연동
2. [Terraform](../terraform/README.md)으로 인프라 구축
3. [GitHub Actions](../.github/workflows/)로 CI/CD 설정

---

## 참고

- [Spring Boot Documentation](https://docs.spring.io/spring-boot/docs/current/reference/html/)
- [Maven Documentation](https://maven.apache.org/guides/)
