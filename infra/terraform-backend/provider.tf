terraform {
  required_version = ">= 1.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }

  # Terraform State를 S3에 저장 (팀 협업 시)
  # 처음 실행 전에 S3 버킷과 DynamoDB 테이블을 먼저 생성해야 함
  # 초기 테스트는 로컬 State 사용 (아래 backend 블록 주석 처리)

  # backend "s3" {
  #   bucket         = "myapp-terraform-state"  # 실제 버킷 이름으로 변경
  #   key            = "prod/terraform.tfstate"
  #   region         = "ap-northeast-2"
  #   encrypt        = true
  #   dynamodb_table = "terraform-lock"
  # }
}

provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Project     = var.project_name
      Environment = var.environment
      ManagedBy   = "Terraform"
    }
  }
}
