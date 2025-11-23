output "s3_bucket_name" {
  description = "S3 bucket name for frontend files"
  value       = module.s3.bucket_id
}

output "s3_bucket_arn" {
  description = "S3 bucket ARN"
  value       = module.s3.bucket_arn
}

output "cloudfront_distribution_id" {
  description = "CloudFront distribution ID (for cache invalidation)"
  value       = module.cloudfront.distribution_id
}

output "cloudfront_domain_name" {
  description = "CloudFront distribution domain name"
  value       = module.cloudfront.distribution_domain_name
}

output "website_url" {
  description = "Website URL"
  value       = var.use_custom_domain ? "https://${var.domain_name}" : "https://${module.cloudfront.distribution_domain_name}"
}

# GitHub Actions에서 필요한 정보 요약
output "deployment_info" {
  description = "Deployment information for GitHub Actions"
  value = {
    s3_bucket_name          = module.s3.bucket_id
    cloudfront_distribution = module.cloudfront.distribution_id
    website_url             = var.use_custom_domain ? "https://${var.domain_name}" : "https://${module.cloudfront.distribution_domain_name}"

    # GitHub Actions 명령어 예시
    s3_sync_command         = "aws s3 sync ./dist s3://${module.s3.bucket_id} --delete"
    cf_invalidation_command = "aws cloudfront create-invalidation --distribution-id ${module.cloudfront.distribution_id} --paths '/*'"
  }
}
