output "cluster_id" {
  description = "ECS Cluster ID"
  value       = aws_ecs_cluster.main.id
}

output "cluster_name" {
  description = "ECS Cluster Name"
  value       = aws_ecs_cluster.main.name
}

output "cluster_arn" {
  description = "ECS Cluster ARN"
  value       = aws_ecs_cluster.main.arn
}

output "backend_service_name" {
  description = "Backend Service Name"
  value       = aws_ecs_service.backend.name
}

output "backend_service_arn" {
  description = "Backend Service ARN"
  value       = aws_ecs_service.backend.id
}

output "backend_task_definition_family" {
  description = "Backend Task Definition Family"
  value       = aws_ecs_task_definition.backend.family
}

output "backend_task_definition_arn" {
  description = "Backend Task Definition ARN"
  value       = aws_ecs_task_definition.backend.arn
}
