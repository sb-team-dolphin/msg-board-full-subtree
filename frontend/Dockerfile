# Multi-stage build for optimized production image

# Stage 1: Build
FROM node:18-alpine AS builder
WORKDIR /app

# 의존성 파일 복사 (캐싱 최적화)
COPY package.json ./

# 의존성 설치 (npm ci 대신 npm install 사용)
RUN npm install --production=false

# 소스 코드 복사
COPY public/ ./public
COPY src/ ./src

# 환경 변수 설정 (빌드 시)
ARG REACT_APP_API_URL
ENV REACT_APP_API_URL=${REACT_APP_API_URL}

# 프로덕션 빌드
RUN npm run build

# Stage 2: Production (Nginx)
FROM nginx:alpine

# Nginx 설정 파일 복사
COPY nginx.conf /etc/nginx/conf.d/default.conf

# 빌드된 정적 파일 복사
COPY --from=builder /app/build /usr/share/nginx/html

# Health check 파일 생성
RUN echo "OK" > /usr/share/nginx/html/health

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:80/health || exit 1

# Port 노출
EXPOSE 80

# Nginx 실행
CMD ["nginx", "-g", "daemon off;"]
