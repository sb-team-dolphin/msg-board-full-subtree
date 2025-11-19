output "backend_repository_url" {
  description = "Backend ECR Repository URL"
  value       = aws_ecr_repository.backend.repository_url
}

output "backend_repository_arn" {
  description = "Backend ECR Repository ARN"
  value       = aws_ecr_repository.backend.arn
}

output "frontend_repository_url" {
  description = "Frontend ECR Repository URL"
  value       = aws_ecr_repository.frontend.repository_url
}

output "frontend_repository_arn" {
  description = "Frontend ECR Repository ARN"
  value       = aws_ecr_repository.frontend.arn
}
