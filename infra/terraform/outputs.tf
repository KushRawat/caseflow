output "alb_dns_name" {
  description = "Public DNS name for the API load balancer."
  value       = aws_lb.api.dns_name
}

output "api_url" {
  description = "Base URL for the backend API."
  value       = "http://${aws_lb.api.dns_name}"
}

output "cloudfront_domain_name" {
  description = "CloudFront domain name serving the frontend."
  value       = aws_cloudfront_distribution.frontend.domain_name
}

output "frontend_bucket" {
  description = "S3 bucket name hosting the frontend build."
  value       = aws_s3_bucket.frontend.bucket
}

output "database_endpoint" {
  description = "RDS endpoint for manual access or migrations."
  value       = aws_db_instance.caseflow.address
}

output "ecs_cluster_name" {
  description = "Name of the ECS cluster."
  value       = aws_ecs_cluster.caseflow.name
}
