variable "project_name" {
  description = "Project slug used for tagging and resource naming."
  type        = string
}

variable "environment" {
  description = "Deployment environment (e.g., prod, staging)."
  type        = string
  default     = "prod"
}

variable "aws_region" {
  description = "AWS region to deploy resources."
  type        = string
  default     = "us-east-1"
}

variable "availability_zones" {
  description = "Optional list of AZs to use. Leave empty to auto-select two AZs."
  type        = list(string)
  default     = []
}

variable "vpc_cidr" {
  description = "CIDR block for the CaseFlow VPC."
  type        = string
  default     = "10.20.0.0/16"
}

variable "db_instance_class" {
  description = "RDS instance type for Postgres."
  type        = string
  default     = "db.t4g.micro"
}

variable "db_storage_gb" {
  description = "Initial storage for the database (GB)."
  type        = number
  default     = 20
}

variable "db_max_storage_gb" {
  description = "Maximum autoscaling storage for the database (GB)."
  type        = number
  default     = 100
}

variable "db_username" {
  description = "Database username."
  type        = string
  sensitive   = true
}

variable "db_password" {
  description = "Database password."
  type        = string
  sensitive   = true
}

variable "backend_image" {
  description = "Fully-qualified backend container image (ECR URL)."
  type        = string
}

variable "backend_cpu" {
  description = "Fargate CPU units (256, 512, 1024, ...)."
  type        = number
  default     = 512
}

variable "backend_memory" {
  description = "Fargate memory (in MiB)."
  type        = number
  default     = 1024
}

variable "backend_desired_count" {
  description = "Number of backend tasks to run."
  type        = number
  default     = 2
}

variable "jwt_access_secret" {
  description = "JWT access token secret."
  type        = string
  sensitive   = true
}

variable "jwt_refresh_secret" {
  description = "JWT refresh token secret."
  type        = string
  sensitive   = true
}

variable "access_token_ttl" {
  description = "Access token TTL (e.g., 15m)."
  type        = string
  default     = "15m"
}

variable "refresh_token_ttl" {
  description = "Refresh token TTL (e.g., 7d)."
  type        = string
  default     = "7d"
}

variable "allowed_origins" {
  description = "Comma-separated list of allowed CORS origins."
  type        = string
  default     = "*"
}

variable "sentry_dsn" {
  description = "Optional Sentry DSN."
  type        = string
  default     = ""
}

variable "frontend_bucket_name" {
  description = "Optional name for the frontend bucket. Defaults to <project>-<env>-frontend."
  type        = string
  default     = ""
}

variable "log_retention_days" {
  description = "CloudWatch log retention in days."
  type        = number
  default     = 30
}

variable "tags" {
  description = "Additional resource tags."
  type        = map(string)
  default     = {}
}
