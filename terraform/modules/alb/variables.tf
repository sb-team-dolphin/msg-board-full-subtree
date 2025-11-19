variable "project_name" {
  description = "Project name"
  type        = string
}

variable "environment" {
  description = "Environment"
  type        = string
}

variable "vpc_id" {
  description = "VPC ID"
  type        = string
}

variable "public_subnet_ids" {
  description = "Public Subnet IDs"
  type        = list(string)
}

variable "backend_port" {
  description = "Backend container port"
  type        = number
  default     = 8080
}

variable "frontend_port" {
  description = "Frontend container port"
  type        = number
  default     = 80
}
