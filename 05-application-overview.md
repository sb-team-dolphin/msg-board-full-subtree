# 애플리케이션 구조 개요

## 목차
- [프로젝트 구조](#프로젝트-구조)
- [백엔드 애플리케이션](#백엔드-애플리케이션)
- [프론트엔드 애플리케이션](#프론트엔드-애플리케이션)
- [Health Check 엔드포인트](#health-check-엔드포인트)
- [환경 변수 관리](#환경-변수-관리)
- [로깅 및 모니터링](#로깅-및-모니터링)
- [보안 고려사항](#보안-고려사항)

---

## 프로젝트 구조

### 전체 프로젝트 구조

```
my-app/
├── .github/
│   └── workflows/
│       ├── backend-ci-cd.yml
│       └── frontend-ci-cd.yml
│
├── backend/                    # 백엔드 애플리케이션
│   ├── src/
│   │   ├── main/
│   │   │   ├── java/
│   │   │   │   └── com/myapp/
│   │   │   │       ├── controller/
│   │   │   │       │   ├── HealthController.java
│   │   │   │       │   └── UserController.java
│   │   │   │       ├── service/
│   │   │   │       ├── repository/
│   │   │   │       └── MyAppApplication.java
│   │   │   └── resources/
│   │   │       ├── application.yml
│   │   │       └── application-prod.yml
│   │   └── test/
│   ├── Dockerfile
│   ├── pom.xml                 # Maven
│   └── build.gradle            # 또는 Gradle
│
├── frontend/                   # 프론트엔드 애플리케이션
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── services/
│   │   ├── App.js
│   │   └── index.js
│   ├── nginx.conf
│   ├── Dockerfile
│   ├── package.json
│   └── .env.production
│
└── terraform/                  # 인프라 코드
    ├── main.tf
    ├── variables.tf
    └── modules/
```

---

## 백엔드 애플리케이션

### 1. Spring Boot (Java) 예시

#### MyAppApplication.java

```java
package com.myapp;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class MyAppApplication {
    public static void main(String[] args) {
        SpringApplication.run(MyAppApplication.class, args);
    }
}
```

---

#### HealthController.java

```java
package com.myapp.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.Map;

@RestController
public class HealthController {

    /**
     * Health Check 엔드포인트
     * ALB와 ECS에서 사용
     */
    @GetMapping("/health")
    public ResponseEntity<Map<String, String>> health() {
        Map<String, String> response = new HashMap<>();
        response.put("status", "UP");
        response.put("service", "my-app-backend");
        response.put("version", "1.0.0");
        return ResponseEntity.ok(response);
    }

    /**
     * 상세 Health Check (DB 연결 등 포함)
     */
    @GetMapping("/health/detail")
    public ResponseEntity<Map<String, Object>> healthDetail() {
        Map<String, Object> response = new HashMap<>();
        response.put("status", "UP");
        response.put("database", checkDatabase());
        response.put("redis", checkRedis());
        return ResponseEntity.ok(response);
    }

    private String checkDatabase() {
        // DB 연결 확인 로직
        return "connected";
    }

    private String checkRedis() {
        // Redis 연결 확인 로직
        return "connected";
    }
}
```

---

#### UserController.java

```java
package com.myapp.controller;

import com.myapp.model.User;
import com.myapp.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/users")
public class UserController {

    @Autowired
    private UserService userService;

    @GetMapping
    public ResponseEntity<List<User>> getAllUsers() {
        return ResponseEntity.ok(userService.findAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<User> getUserById(@PathVariable Long id) {
        return userService.findById(id)
            .map(ResponseEntity::ok)
            .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<User> createUser(@RequestBody User user) {
        User created = userService.save(user);
        return ResponseEntity.ok(created);
    }

    @PutMapping("/{id}")
    public ResponseEntity<User> updateUser(@PathVariable Long id, @RequestBody User user) {
        return userService.update(id, user)
            .map(ResponseEntity::ok)
            .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteUser(@PathVariable Long id) {
        userService.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}
```

---

#### application.yml

```yaml
spring:
  application:
    name: my-app-backend

  # 프로파일별 설정 분리
  profiles:
    active: ${SPRING_PROFILES_ACTIVE:dev}

  # 데이터베이스 설정
  datasource:
    url: jdbc:postgresql://${DB_HOST:localhost}:5432/${DB_NAME:myapp}
    username: ${DB_USERNAME:postgres}
    password: ${DB_PASSWORD:password}
    driver-class-name: org.postgresql.Driver

  # JPA 설정
  jpa:
    hibernate:
      ddl-auto: validate
    show-sql: false
    properties:
      hibernate:
        format_sql: true

# 서버 설정
server:
  port: 8080
  shutdown: graceful  # Graceful shutdown for Blue/Green

# 로깅 설정
logging:
  level:
    root: INFO
    com.myapp: DEBUG
  pattern:
    console: "%d{yyyy-MM-dd HH:mm:ss} [%thread] %-5level %logger{36} - %msg%n"

# Actuator (모니터링)
management:
  endpoints:
    web:
      exposure:
        include: health,info,metrics
  endpoint:
    health:
      show-details: always
```

---

#### application-prod.yml

```yaml
# 프로덕션 환경 설정
spring:
  datasource:
    hikari:
      maximum-pool-size: 20
      minimum-idle: 5

logging:
  level:
    root: WARN
    com.myapp: INFO

# CloudWatch Logs로 전송
logging:
  pattern:
    console: '{"timestamp":"%d{ISO8601}","level":"%level","logger":"%logger","message":"%message"}%n'
```

---

#### pom.xml

```xml
<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0
         https://maven.apache.org/xsd/maven-4.0.0.xsd">
    <modelVersion>4.0.0</modelVersion>

    <parent>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-parent</artifactId>
        <version>3.2.0</version>
    </parent>

    <groupId>com.myapp</groupId>
    <artifactId>my-app-backend</artifactId>
    <version>1.0.0</version>
    <name>My App Backend</name>

    <properties>
        <java.version>17</java.version>
    </properties>

    <dependencies>
        <!-- Spring Boot Web -->
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-web</artifactId>
        </dependency>

        <!-- Spring Data JPA -->
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-data-jpa</artifactId>
        </dependency>

        <!-- PostgreSQL Driver -->
        <dependency>
            <groupId>org.postgresql</groupId>
            <artifactId>postgresql</artifactId>
        </dependency>

        <!-- Actuator (Health Check) -->
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-actuator</artifactId>
        </dependency>

        <!-- Test -->
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-test</artifactId>
            <scope>test</scope>
        </dependency>
    </dependencies>

    <build>
        <plugins>
            <plugin>
                <groupId>org.springframework.boot</groupId>
                <artifactId>spring-boot-maven-plugin</artifactId>
            </plugin>
        </plugins>
    </build>
</project>
```

---

### 2. Node.js (Express) 예시

#### index.js

```javascript
const express = require('express');
const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(express.json());

// Health Check
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'UP',
    service: 'my-app-backend',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

// API Routes
app.get('/api/users', async (req, res) => {
  // User 조회 로직
  res.json([
    { id: 1, name: 'Alice' },
    { id: 2, name: 'Bob' }
  ]);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

const server = app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
```

---

#### package.json

```json
{
  "name": "my-app-backend",
  "version": "1.0.0",
  "description": "My App Backend API",
  "main": "index.js",
  "scripts": {
    "start": "node index.js",
    "dev": "nodemon index.js",
    "test": "jest"
  },
  "dependencies": {
    "express": "^4.18.2",
    "pg": "^8.11.0",
    "dotenv": "^16.3.1"
  },
  "devDependencies": {
    "nodemon": "^3.0.1",
    "jest": "^29.6.0"
  }
}
```

---

## 프론트엔드 애플리케이션

### React 예시

#### App.js

```javascript
import React, { useState, useEffect } from 'react';
import './App.css';

function App() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8080';

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await fetch(`${API_URL}/api/users`);
      const data = await response.json();
      setUsers(data);
    } catch (error) {
      console.error('Failed to fetch users:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <div className="App">
      <header className="App-header">
        <h1>My App</h1>
      </header>
      <main>
        <h2>Users</h2>
        <ul>
          {users.map(user => (
            <li key={user.id}>{user.name}</li>
          ))}
        </ul>
      </main>
    </div>
  );
}

export default App;
```

---

#### .env.production

```bash
# 프로덕션 환경 변수
REACT_APP_API_URL=https://api.myapp.com
REACT_APP_VERSION=1.0.0
```

---

#### package.json

```json
{
  "name": "my-app-frontend",
  "version": "1.0.0",
  "private": true,
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-router-dom": "^6.14.0",
    "axios": "^1.4.0"
  },
  "scripts": {
    "start": "react-scripts start",
    "build": "react-scripts build",
    "test": "react-scripts test",
    "eject": "react-scripts eject",
    "lint": "eslint src/"
  },
  "devDependencies": {
    "react-scripts": "5.0.1",
    "eslint": "^8.45.0"
  },
  "browserslist": {
    "production": [
      ">0.2%",
      "not dead",
      "not op_mini all"
    ],
    "development": [
      "last 1 chrome version",
      "last 1 firefox version",
      "last 1 safari version"
    ]
  }
}
```

---

## Health Check 엔드포인트

### 왜 필요한가?

```
ALB와 ECS는 Health Check를 통해:
1. 컨테이너가 정상 작동 중인지 확인
2. 문제 있는 컨테이너를 트래픽에서 제외
3. Blue/Green 배포 시 새 버전이 준비되었는지 확인
```

---

### Health Check 구현 예시

#### 1. 기본 Health Check (Spring Boot)

```java
@GetMapping("/health")
public ResponseEntity<String> health() {
    return ResponseEntity.ok("OK");
}
```

#### 2. 상세 Health Check (의존성 포함)

```java
@GetMapping("/health")
public ResponseEntity<HealthResponse> health() {
    HealthResponse response = new HealthResponse();
    response.setStatus("UP");

    // Database 체크
    try {
        dataSource.getConnection().close();
        response.setDatabase("UP");
    } catch (Exception e) {
        response.setDatabase("DOWN");
        response.setStatus("DOWN");
    }

    // Redis 체크
    try {
        redisTemplate.getConnectionFactory().getConnection().ping();
        response.setRedis("UP");
    } catch (Exception e) {
        response.setRedis("DOWN");
        response.setStatus("DOWN");
    }

    if ("DOWN".equals(response.getStatus())) {
        return ResponseEntity.status(503).body(response);
    }

    return ResponseEntity.ok(response);
}
```

#### 3. Node.js Health Check

```javascript
app.get('/health', async (req, res) => {
  const health = {
    status: 'UP',
    timestamp: new Date().toISOString(),
    checks: {}
  };

  // Database 체크
  try {
    await db.query('SELECT 1');
    health.checks.database = 'UP';
  } catch (error) {
    health.checks.database = 'DOWN';
    health.status = 'DOWN';
  }

  const statusCode = health.status === 'UP' ? 200 : 503;
  res.status(statusCode).json(health);
});
```

---

### Nginx Health Check (프론트엔드)

```nginx
server {
    listen 80;

    # Health check endpoint
    location /health {
        access_log off;
        return 200 "OK\n";
        add_header Content-Type text/plain;
    }

    # React app
    location / {
        root /usr/share/nginx/html;
        index index.html;
        try_files $uri $uri/ /index.html;
    }
}
```

---

## 환경 변수 관리

### 1. 환경 변수 우선순위

```
1. 시스템 환경 변수 (ECS Task Definition에서 설정)
2. .env 파일
3. application.yml의 기본값
```

---

### 2. ECS Task Definition에서 설정

#### 일반 환경 변수

```json
"environment": [
  {
    "name": "SPRING_PROFILES_ACTIVE",
    "value": "prod"
  },
  {
    "name": "DB_HOST",
    "value": "mydb.cluster-abc.rds.amazonaws.com"
  }
]
```

#### Secrets Manager 사용

```json
"secrets": [
  {
    "name": "DB_PASSWORD",
    "valueFrom": "arn:aws:secretsmanager:ap-northeast-2:123456789012:secret:db-password-AbCdEf"
  },
  {
    "name": "API_KEY",
    "valueFrom": "arn:aws:secretsmanager:ap-northeast-2:123456789012:secret:api-key-XyZ123"
  }
]
```

---

### 3. Secrets Manager에 저장

```bash
# Secret 생성
aws secretsmanager create-secret \
  --name db-password \
  --secret-string "my-super-secret-password"

# Secret 조회
aws secretsmanager get-secret-value \
  --secret-id db-password

# Secret 업데이트
aws secretsmanager update-secret \
  --secret-id db-password \
  --secret-string "new-password"
```

---

### 4. 애플리케이션에서 사용

#### Spring Boot

```java
@Value("${DB_PASSWORD}")
private String dbPassword;
```

#### Node.js

```javascript
const dbPassword = process.env.DB_PASSWORD;
```

---

## 로깅 및 모니터링

### 1. CloudWatch Logs 설정

#### ECS Task Definition에서 설정

```json
"logConfiguration": {
  "logDriver": "awslogs",
  "options": {
    "awslogs-group": "/ecs/my-app-backend",
    "awslogs-region": "ap-northeast-2",
    "awslogs-stream-prefix": "ecs"
  }
}
```

---

### 2. 구조화된 로깅 (JSON)

#### Spring Boot (Logback)

```xml
<!-- logback-spring.xml -->
<configuration>
    <appender name="JSON" class="ch.qos.logback.core.ConsoleAppender">
        <encoder class="net.logstash.logback.encoder.LogstashEncoder">
            <includeContext>true</includeContext>
            <includeMdc>true</includeMdc>
            <fieldNames>
                <timestamp>timestamp</timestamp>
                <message>message</message>
                <logger>logger</logger>
                <level>level</level>
            </fieldNames>
        </encoder>
    </appender>

    <root level="INFO">
        <appender-ref ref="JSON" />
    </root>
</configuration>
```

#### Node.js (Winston)

```javascript
const winston = require('winston');

const logger = winston.createLogger({
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console()
  ]
});

// 사용
logger.info('User created', { userId: 123, username: 'alice' });
```

---

### 3. 메트릭 수집

#### Spring Boot Actuator + Micrometer

```yaml
management:
  metrics:
    export:
      cloudwatch:
        enabled: true
        namespace: MyApp
        step: 1m
```

#### Custom Metrics

```java
@Service
public class UserService {
    private final MeterRegistry meterRegistry;
    private final Counter userCreatedCounter;

    public UserService(MeterRegistry meterRegistry) {
        this.meterRegistry = meterRegistry;
        this.userCreatedCounter = Counter.builder("users.created")
            .description("Number of users created")
            .register(meterRegistry);
    }

    public User createUser(User user) {
        User created = userRepository.save(user);
        userCreatedCounter.increment();
        return created;
    }
}
```

---

## 보안 고려사항

### 1. 민감 정보 관리

```
❌ 하드코딩 금지
❌ Git에 커밋 금지
✅ AWS Secrets Manager 사용
✅ 환경 변수로 주입
```

---

### 2. HTTPS 사용

```
ALB에서 SSL/TLS 인증서 설정:
1. AWS Certificate Manager(ACM)에서 인증서 발급
2. ALB Listener에 HTTPS(443) 추가
3. HTTP(80)는 HTTPS로 리다이렉트
```

---

### 3. CORS 설정

#### Spring Boot

```java
@Configuration
public class WebConfig implements WebMvcConfigurer {
    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/api/**")
            .allowedOrigins("https://myapp.com")
            .allowedMethods("GET", "POST", "PUT", "DELETE")
            .allowedHeaders("*")
            .allowCredentials(true);
    }
}
```

#### Express.js

```javascript
const cors = require('cors');

app.use(cors({
  origin: 'https://myapp.com',
  credentials: true
}));
```

---

### 4. Security Group 설정

```hcl
# ALB Security Group (인터넷에서 접근 가능)
resource "aws_security_group" "alb" {
  ingress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

# ECS Security Group (ALB에서만 접근 가능)
resource "aws_security_group" "ecs" {
  ingress {
    from_port       = 8080
    to_port         = 8080
    protocol        = "tcp"
    security_groups = [aws_security_group.alb.id]
  }
}
```

---

### 5. IAM 최소 권한 원칙

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "ecr:GetAuthorizationToken",
        "ecr:BatchGetImage",
        "logs:CreateLogStream",
        "logs:PutLogEvents"
      ],
      "Resource": "*"
    }
  ]
}
```

---

## 발표 시 강조할 점

### 1. Health Check의 중요성
> "무중단 배포의 핵심은 Health Check입니다.
> ALB와 ECS가 자동으로 정상 작동하는 컨테이너만 트래픽을 보내도록 보장합니다."

### 2. 환경 변수 분리
> "개발, 스테이징, 프로덕션 환경을 완벽히 분리하고,
> 민감 정보는 AWS Secrets Manager로 안전하게 관리합니다."

### 3. 구조화된 로깅
> "JSON 형식의 로그를 CloudWatch에 전송하여
> 실시간 모니터링과 문제 추적이 가능합니다."

### 4. 보안
> "모든 통신은 HTTPS로 암호화하고,
> Security Group으로 네트워크를 격리하여 보안을 강화했습니다."

---

## 전체 흐름 요약

```
1. Developer가 코드 작성 및 Push
   ↓
2. GitHub Actions가 테스트 및 빌드
   ↓
3. Docker 이미지 생성 → ECR Push
   ↓
4. ECS Task Definition 업데이트
   ↓
5. Blue/Green 배포 시작
   ↓
6. Health Check 통과 확인
   ↓
7. 트래픽 점진적 전환
   ↓
8. 배포 완료 (무중단)
   ↓
9. CloudWatch로 모니터링
```

---

## 참고 자료

### AWS 공식 문서
- [ECS Developer Guide](https://docs.aws.amazon.com/ecs/)
- [ECR User Guide](https://docs.aws.amazon.com/ecr/)
- [CodeDeploy User Guide](https://docs.aws.amazon.com/codedeploy/)
- [Terraform AWS Provider](https://registry.terraform.io/providers/hashicorp/aws/latest/docs)

### 모범 사례
- [AWS Well-Architected Framework](https://aws.amazon.com/architecture/well-architected/)
- [12-Factor App](https://12factor.net/)
- [Container Security Best Practices](https://aws.amazon.com/blogs/containers/)

---

## 마무리

이제 다음을 완벽히 이해했습니다:

- ✅ Terraform으로 AWS 인프라 구축
- ✅ GitHub Actions로 CI/CD 파이프라인 구성
- ✅ Docker 이미지 빌드 및 ECR 배포
- ✅ ECS Fargate로 컨테이너 실행
- ✅ Blue/Green 무중단 배포
- ✅ Health Check 및 모니터링
- ✅ 보안 및 환경 변수 관리

**발표 준비가 완료되었습니다!**
