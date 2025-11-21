terraform {
  required_version = ">= 1.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

# 기본 리전 (S3)
provider "aws" {
  region = var.aws_region
}

# CloudFront용 ACM 인증서는 반드시 us-east-1에 있어야 함
provider "aws" {
  alias  = "us_east_1"
  region = "us-east-1"
}
