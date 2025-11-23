# msg-board Frontend

피드백 보드 프론트엔드 애플리케이션

## 아키텍처
- **호스팅**: AWS CloudFront + S3
- **배포**: GitHub Actions (자동)
- **스타일**: Tailwind CSS (CDN)
- **JavaScript**: Vanilla JS

## 배포 방식
- `main` 브랜치에 push → 자동으로 CloudFront + S3 배포
- CloudFront 캐시 무효화 자동 실행 (1-3분 소요)

## 로컬 개발

### 1. 간단한 HTTP 서버 실행
```bash
# Python 3
python -m http.server 8000

# Node.js
npx serve .

# PHP
php -S localhost:8000
```

### 2. 브라우저에서 확인
http://localhost:8000

## 프로젝트 구조
```
simple-api-frontend/
├── index.html          # 메인 HTML
├── css/
│   └── style.css       # 커스텀 스타일
├── js/
│   └── app.js          # 메인 JavaScript
├── .github/
│   └── workflows/
│       └── deploy-cloudfront.yml  # 배포 워크플로우
└── README.md
```

## 백엔드 API 연동
백엔드 레포: 

## 배포 확인
GitHub Actions:

## 환경 변수 (GitHub Secrets)
- `AWS_ACCESS_KEY_ID` - AWS 액세스 키
- `AWS_SECRET_ACCESS_KEY` - AWS 시크릿 키
