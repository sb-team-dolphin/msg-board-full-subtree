variable "aws_region" {
  description = "AWS Region for S3 bucket"
  type        = string
  default     = "ap-northeast-2"
}

variable "project_name" {
  description = "Project name"
  type        = string
  default     = "myapp"
}

variable "environment" {
  description = "Environment (dev, staging, prod)"
  type        = string
  default     = "prod"
}

variable "domain_name" {
  description = "Domain name for the frontend (e.g., www.example.com)"
  type        = string
  default     = ""
}

variable "use_custom_domain" {
  description = "Whether to use custom domain with ACM certificate"
  type        = bool
  default     = false
}

variable "route53_zone_id" {
  description = "Route53 Hosted Zone ID (required if use_custom_domain is true)"
  type        = string
  default     = ""
}

variable "price_class" {
  description = "CloudFront price class"
  type        = string
  default     = "PriceClass_100"  # 북미, 유럽만 (비용 절감)
}
