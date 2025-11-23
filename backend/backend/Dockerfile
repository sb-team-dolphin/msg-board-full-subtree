# Multi-stage build for smaller image size

# Stage 1: Build
FROM eclipse-temurin:17-jdk-alpine AS builder
WORKDIR /app

# Maven 설치 (Alpine에서)
RUN apk add --no-cache maven

# pom.xml만 먼저 복사 (의존성 캐싱)
COPY pom.xml ./

# 의존성 다운로드
RUN mvn dependency:go-offline -B

# 소스 코드 복사
COPY src ./src

# 빌드
RUN mvn clean package -DskipTests -B

# JAR 파일 확인 및 이름 변경
RUN mv target/*.jar target/app.jar

# Stage 2: Runtime
FROM eclipse-temurin:17-jre-alpine
WORKDIR /app

# 보안을 위해 non-root user 생성
RUN addgroup -S spring && adduser -S spring -G spring
USER spring:spring

# Stage 1에서 빌드된 JAR 파일 복사
COPY --from=builder /app/target/app.jar /app/app.jar

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=60s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:8080/health || exit 1

# Port 노출
EXPOSE 8080

# 환경 변수 (기본값)
ENV SPRING_PROFILES_ACTIVE=prod

# 애플리케이션 실행
ENTRYPOINT ["java", "-jar", "/app/app.jar"]
