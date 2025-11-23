output "backend_repository_url" {
  description = "Backend ECR Repository URL"
  value       = aws_ecr_repository.backend.repository_url
}

output "backend_repository_arn" {
  description = "Backend ECR Repository ARN"
  value       = aws_ecr_repository.backend.arn
}
