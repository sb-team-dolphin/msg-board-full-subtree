output "s3_bucket_name" {
  description = "S3 bucket name for Terraform state"
  value       = aws_s3_bucket.terraform_state.id
}

output "s3_bucket_arn" {
  description = "S3 bucket ARN"
  value       = aws_s3_bucket.terraform_state.arn
}

output "dynamodb_table_name" {
  description = "DynamoDB table name for state locking"
  value       = aws_dynamodb_table.terraform_lock.name
}

output "backend_config" {
  description = "Backend configuration to add to provider.tf"
  value       = <<-EOT

    # 아래 설정을 terraform-backend/provider.tf 또는 terraform-frontend/provider.tf에 추가하세요:

    terraform {
      backend "s3" {
        bucket         = "${aws_s3_bucket.terraform_state.id}"
        key            = "backend/terraform.tfstate"  # frontend는 "frontend/terraform.tfstate"
        region         = "${var.aws_region}"
        encrypt        = true
        dynamodb_table = "${aws_dynamodb_table.terraform_lock.name}"
      }
    }

  EOT
}
