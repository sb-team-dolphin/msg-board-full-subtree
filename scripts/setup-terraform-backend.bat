@echo off
REM Terraform State Backend 설정 스크립트 (Windows)
REM S3 버킷과 DynamoDB 테이블을 생성합니다.

setlocal enabledelayedexpansion

REM 설정
if "%1"=="" (set PROJECT_NAME=myapp) else (set PROJECT_NAME=%1)
if "%2"=="" (set AWS_REGION=ap-northeast-2) else (set AWS_REGION=%2)
set BUCKET_NAME=%PROJECT_NAME%-terraform-state
set DYNAMODB_TABLE=%PROJECT_NAME%-terraform-lock

echo ============================================
echo Terraform Backend 설정
echo ============================================
echo 프로젝트: %PROJECT_NAME%
echo 리전: %AWS_REGION%
echo S3 버킷: %BUCKET_NAME%
echo DynamoDB 테이블: %DYNAMODB_TABLE%
echo ============================================

REM AWS 자격 증명 확인
echo.
echo [1/5] AWS 자격 증명 확인...
aws sts get-caller-identity >nul 2>&1
if errorlevel 1 (
    echo ❌ AWS 자격 증명이 설정되지 않았습니다.
    echo 다음 명령어로 설정하세요: aws configure
    exit /b 1
)
for /f "tokens=*" %%i in ('aws sts get-caller-identity --query Account --output text') do set ACCOUNT_ID=%%i
echo ✅ AWS 계정: %ACCOUNT_ID%

REM S3 버킷 생성
echo.
echo [2/5] S3 버킷 생성...
aws s3api head-bucket --bucket %BUCKET_NAME% >nul 2>&1
if not errorlevel 1 (
    echo ⚠️  S3 버킷이 이미 존재합니다: %BUCKET_NAME%
) else (
    aws s3api create-bucket --bucket %BUCKET_NAME% --region %AWS_REGION% --create-bucket-configuration LocationConstraint=%AWS_REGION%
    echo ✅ S3 버킷 생성 완료: %BUCKET_NAME%
)

REM S3 버킷 버전 관리 활성화
echo.
echo [3/5] S3 버킷 버전 관리 활성화...
aws s3api put-bucket-versioning --bucket %BUCKET_NAME% --versioning-configuration Status=Enabled
echo ✅ 버전 관리 활성화 완료

REM S3 버킷 암호화 설정
echo.
echo [4/5] S3 버킷 암호화 설정...
aws s3api put-bucket-encryption --bucket %BUCKET_NAME% --server-side-encryption-configuration "{\"Rules\":[{\"ApplyServerSideEncryptionByDefault\":{\"SSEAlgorithm\":\"AES256\"}}]}"
echo ✅ 암호화 설정 완료

REM DynamoDB 테이블 생성
echo.
echo [5/5] DynamoDB 테이블 생성...
aws dynamodb describe-table --table-name %DYNAMODB_TABLE% --region %AWS_REGION% >nul 2>&1
if not errorlevel 1 (
    echo ⚠️  DynamoDB 테이블이 이미 존재합니다: %DYNAMODB_TABLE%
) else (
    aws dynamodb create-table --table-name %DYNAMODB_TABLE% --attribute-definitions AttributeName=LockID,AttributeType=S --key-schema AttributeName=LockID,KeyType=HASH --billing-mode PAY_PER_REQUEST --region %AWS_REGION%
    echo ✅ DynamoDB 테이블 생성 완료: %DYNAMODB_TABLE%
)

echo.
echo ============================================
echo ✅ Terraform Backend 설정 완료!
echo ============================================
echo.
echo provider.tf에 다음을 추가하세요:
echo.
echo terraform {
echo   backend "s3" {
echo     bucket         = "%BUCKET_NAME%"
echo     key            = "backend/terraform.tfstate"
echo     region         = "%AWS_REGION%"
echo     encrypt        = true
echo     dynamodb_table = "%DYNAMODB_TABLE%"
echo   }
echo }
echo.

endlocal
