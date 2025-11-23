output "backend_app_name" {
  description = "Backend CodeDeploy Application Name"
  value       = aws_codedeploy_app.backend.name
}

output "backend_deployment_group_name" {
  description = "Backend CodeDeploy Deployment Group Name"
  value       = aws_codedeploy_deployment_group.backend.deployment_group_name
}
