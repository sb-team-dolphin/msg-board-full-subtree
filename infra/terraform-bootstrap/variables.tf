variable "aws_region" {
  description = "AWS Region"
  type        = string
  default     = "ap-northeast-2"
}

variable "project_name" {
  description = "Project name (used for S3 bucket and DynamoDB table naming)"
  type        = string
  default     = "myapp"
}
