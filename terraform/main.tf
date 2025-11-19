# Data sources
data "aws_availability_zones" "available" {
  state = "available"
}

# VPC Module
module "vpc" {
  source = "./modules/vpc"

  project_name       = var.project_name
  environment        = var.environment
  vpc_cidr           = var.vpc_cidr
  availability_zones = var.availability_zones
}

# IAM Module
module "iam" {
  source = "./modules/iam"

  project_name = var.project_name
  environment  = var.environment
}

# ECR Module
module "ecr" {
  source = "./modules/ecr"

  project_name = var.project_name
  environment  = var.environment
}

# ALB Module
module "alb" {
  source = "./modules/alb"

  project_name       = var.project_name
  environment        = var.environment
  vpc_id             = module.vpc.vpc_id
  public_subnet_ids  = module.vpc.public_subnet_ids
  backend_port       = var.backend_container_port
  frontend_port      = var.frontend_container_port
}

# ECS Module
module "ecs" {
  source = "./modules/ecs"

  project_name              = var.project_name
  environment               = var.environment
  vpc_id                    = module.vpc.vpc_id
  private_subnet_ids        = module.vpc.private_subnet_ids

  # IAM Roles
  task_execution_role_arn   = module.iam.ecs_task_execution_role_arn
  task_role_arn             = module.iam.ecs_task_role_arn

  # ECR
  backend_ecr_url           = module.ecr.backend_repository_url
  frontend_ecr_url          = module.ecr.frontend_repository_url

  # ALB
  backend_target_group_arn  = module.alb.backend_target_group_arn
  frontend_target_group_arn = module.alb.frontend_target_group_arn
  alb_security_group_id     = module.alb.alb_security_group_id

  # ECS Configuration
  backend_cpu               = var.ecs_backend_cpu
  backend_memory            = var.ecs_backend_memory
  frontend_cpu              = var.ecs_frontend_cpu
  frontend_memory           = var.ecs_frontend_memory
  backend_desired_count     = var.backend_desired_count
  frontend_desired_count    = var.frontend_desired_count
  backend_container_port    = var.backend_container_port
  frontend_container_port   = var.frontend_container_port

  # Auto Scaling
  backend_min_capacity      = var.backend_min_capacity
  backend_max_capacity      = var.backend_max_capacity
  frontend_min_capacity     = var.frontend_min_capacity
  frontend_max_capacity     = var.frontend_max_capacity
  cpu_target_value          = var.cpu_target_value
  memory_target_value       = var.memory_target_value

  depends_on = [module.alb]
}

# CloudWatch Log Groups
resource "aws_cloudwatch_log_group" "backend" {
  name              = "/ecs/${var.project_name}-backend"
  retention_in_days = 7

  tags = {
    Name = "${var.project_name}-backend-logs"
  }
}

resource "aws_cloudwatch_log_group" "frontend" {
  name              = "/ecs/${var.project_name}-frontend"
  retention_in_days = 7

  tags = {
    Name = "${var.project_name}-frontend-logs"
  }
}
