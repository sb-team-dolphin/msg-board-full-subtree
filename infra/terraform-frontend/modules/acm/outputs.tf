output "certificate_arn" {
  description = "ACM certificate ARN"
  value       = aws_acm_certificate_validation.frontend.certificate_arn
}
