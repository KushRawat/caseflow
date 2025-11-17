# Terraform Infrastructure

This module provisions a production-ready AWS footprint for CaseFlow:

- **Networking** – dedicated VPC with public (ALB) and private (ECS/RDS) subnets across two AZs.
- **Backend** – Fargate service behind an Application Load Balancer with CloudWatch logging and health checks wired to `/api/health`.
- **Database** – encrypted PostgreSQL 15 instance with subnet + security group isolation.
- **Frontend** – versioned S3 bucket fronted by CloudFront (origin access control) for the Vite build.

## Prereqs

1. Install Terraform `>= 1.5`.
2. Configure AWS credentials (IAM user/role) with permissions for VPC, ECS, RDS, IAM, CloudFront and S3.
3. Push the backend Docker image to ECR (e.g., `123456789012.dkr.ecr.us-east-1.amazonaws.com/caseflow:latest`).

## Usage

```bash
cd infra/terraform
cp terraform.tfvars.example terraform.tfvars   # fill in secrets + image references
terraform init
terraform plan
terraform apply
```

Key variables (see `variables.tf` for the full list):

| Variable | Description |
|----------|-------------|
| `project_name` | Slug used for tagging/resource names (`caseflow`). |
| `environment` | Deployment env (`prod`, `staging`, etc.). |
| `backend_image` | ECR image for the Express API. |
| `db_username` / `db_password` | Postgres credentials (match `.env`). |
| `jwt_access_secret` / `jwt_refresh_secret` | Secrets shared with the backend. |
| `allowed_origins` | Comma-separated CORS origins (e.g., `https://caseflow.app`). |

Outputs include the ALB DNS (`alb_dns_name`), CloudFront hostname (`cloudfront_domain_name`), and RDS endpoint (`database_endpoint`). Point `VITE_API_URL` at the ALB URL when uploading the frontend build to the provisioned bucket.

Destroy with `terraform destroy` when you're done (removes all AWS resources). Never commit the generated `terraform.tfstate` files—`.terraform` is already ignored repo-wide.
