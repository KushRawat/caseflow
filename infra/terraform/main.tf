terraform {
  required_version = ">= 1.5.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = var.aws_region
}

data "aws_caller_identity" "current" {}

data "aws_availability_zones" "available" {
  state = "available"
}

locals {
  azs = length(var.availability_zones) > 0 ? var.availability_zones : slice(data.aws_availability_zones.available.names, 0, 2)
  project_name = var.project_name
  env = var.environment
  name_prefix = "${local.project_name}-${local.env}"
  tags = merge(
    var.tags,
    {
      Project     = local.project_name
      Environment = local.env
      ManagedBy   = "terraform"
    }
  )
  public_subnets = [for idx, _ in local.azs : cidrsubnet(var.vpc_cidr, 4, idx)]
  private_subnets = [for idx, _ in local.azs : cidrsubnet(var.vpc_cidr, 4, idx + 4)]
  database_name = replace(local.project_name, "-", "_")
  database_url = "postgresql://${var.db_username}:${var.db_password}@${aws_db_instance.caseflow.address}:5432/${local.database_name}?schema=public"
  frontend_bucket_name = lower(var.frontend_bucket_name != "" ? var.frontend_bucket_name : "${local.name_prefix}-frontend")
  short_prefix = substr(local.name_prefix, 0, 20)
}

module "vpc" {
  source  = "terraform-aws-modules/vpc/aws"
  version = "5.1.2"

  name = local.name_prefix
  cidr = var.vpc_cidr

  azs             = local.azs
  public_subnets  = local.public_subnets
  private_subnets = local.private_subnets

  enable_nat_gateway   = true
  single_nat_gateway   = true
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = local.tags
}

resource "aws_security_group" "alb" {
  name        = "${local.name_prefix}-alb-sg"
  description = "Allow web traffic to ALB"
  vpc_id      = module.vpc.vpc_id

  ingress {
    description = "HTTP"
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    description = "HTTPS"
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = local.tags
}

resource "aws_security_group" "ecs" {
  name        = "${local.name_prefix}-ecs-sg"
  description = "Allow traffic from ALB and to RDS"
  vpc_id      = module.vpc.vpc_id

  ingress {
    description                 = "Allow traffic from ALB"
    from_port                   = 4000
    to_port                     = 4000
    protocol                    = "tcp"
    security_groups             = [aws_security_group.alb.id]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = local.tags
}

resource "aws_security_group" "rds" {
  name        = "${local.name_prefix}-rds-sg"
  description = "Allow Postgres from ECS"
  vpc_id      = module.vpc.vpc_id

  ingress {
    description      = "Postgres"
    from_port        = 5432
    to_port          = 5432
    protocol         = "tcp"
    security_groups  = [aws_security_group.ecs.id]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = local.tags
}

resource "aws_db_subnet_group" "caseflow" {
  name       = "${local.name_prefix}-db-subnets"
  subnet_ids = module.vpc.private_subnets
  tags       = local.tags
}

resource "aws_db_instance" "caseflow" {
  identifier              = "${local.name_prefix}-db"
  engine                  = "postgres"
  engine_version          = "15.4"
  instance_class          = var.db_instance_class
  allocated_storage       = var.db_storage_gb
  max_allocated_storage   = var.db_max_storage_gb
  db_name                 = local.database_name
  username                = var.db_username
  password                = var.db_password
  port                    = 5432
  skip_final_snapshot     = true
  publicly_accessible     = false
  multi_az                = false
  storage_encrypted       = true
  deletion_protection     = false
  backup_retention_period = 7
  vpc_security_group_ids  = [aws_security_group.rds.id]
  db_subnet_group_name    = aws_db_subnet_group.caseflow.name

  tags = local.tags
}

resource "aws_ecs_cluster" "caseflow" {
  name = "${local.name_prefix}-cluster"

  setting {
    name  = "containerInsights"
    value = "enabled"
  }

  tags = local.tags
}

resource "aws_cloudwatch_log_group" "backend" {
  name              = "/caseflow/${local.env}/backend"
  retention_in_days = var.log_retention_days
  tags              = local.tags
}

resource "aws_iam_role" "ecs_task_execution" {
  name = "${local.name_prefix}-ecs-task-exec"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Principal = {
          Service = "ecs-tasks.amazonaws.com"
        }
        Effect = "Allow"
      }
    ]
  })

  tags = local.tags
}

resource "aws_iam_role_policy_attachment" "ecs_task_execution_policy" {
  role       = aws_iam_role.ecs_task_execution.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy"
}

resource "aws_lb" "api" {
  name               = "${local.short_prefix}-alb"
  load_balancer_type = "application"
  security_groups    = [aws_security_group.alb.id]
  subnets            = module.vpc.public_subnets
  idle_timeout       = 60
  tags               = local.tags
}

resource "aws_lb_target_group" "api" {
  name        = "${local.short_prefix}-tg"
  port        = 4000
  protocol    = "HTTP"
  target_type = "ip"
  vpc_id      = module.vpc.vpc_id

  health_check {
    path                = "/api/health"
    healthy_threshold   = 2
    unhealthy_threshold = 2
    timeout             = 5
    interval            = 30
    matcher             = "200-399"
  }

  tags = local.tags
}

resource "aws_lb_listener" "http" {
  load_balancer_arn = aws_lb.api.arn
  port              = 80
  protocol          = "HTTP"

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.api.arn
  }
}

resource "aws_ecs_task_definition" "backend" {
  family                   = "${local.name_prefix}-task"
  network_mode             = "awsvpc"
  cpu                      = tostring(var.backend_cpu)
  memory                   = tostring(var.backend_memory)
  requires_compatibilities = ["FARGATE"]
  execution_role_arn       = aws_iam_role.ecs_task_execution.arn

  container_definitions = jsonencode([
    {
      name      = "caseflow-backend"
      image     = var.backend_image
      essential = true
      portMappings = [
        {
          containerPort = 4000
          hostPort      = 4000
          protocol      = "tcp"
        }
      ]
      environment = [
        { name = "PORT", value = "4000" },
        { name = "NODE_ENV", value = local.env },
        { name = "DATABASE_URL", value = local.database_url },
        { name = "JWT_ACCESS_SECRET", value = var.jwt_access_secret },
        { name = "JWT_REFRESH_SECRET", value = var.jwt_refresh_secret },
        { name = "ACCESS_TOKEN_TTL", value = var.access_token_ttl },
        { name = "REFRESH_TOKEN_TTL", value = var.refresh_token_ttl },
        { name = "ALLOWED_ORIGINS", value = var.allowed_origins },
        { name = "SENTRY_DSN", value = var.sentry_dsn }
      ]
      logConfiguration = {
        logDriver = "awslogs"
        options = {
          awslogs-group         = aws_cloudwatch_log_group.backend.name
          awslogs-region        = var.aws_region
          awslogs-stream-prefix = "caseflow"
        }
      }
    }
  ])

  tags = local.tags
}

resource "aws_ecs_service" "backend" {
  name            = "${local.name_prefix}-service"
  cluster         = aws_ecs_cluster.caseflow.id
  desired_count   = var.backend_desired_count
  launch_type     = "FARGATE"
  task_definition = aws_ecs_task_definition.backend.arn

  network_configuration {
    assign_public_ip = false
    security_groups  = [aws_security_group.ecs.id]
    subnets          = module.vpc.private_subnets
  }

  load_balancer {
    target_group_arn = aws_lb_target_group.api.arn
    container_name   = "caseflow-backend"
    container_port   = 4000
  }

  deployment_minimum_healthy_percent = 50
  deployment_maximum_percent         = 200

  depends_on = [aws_lb_listener.http]
  tags       = local.tags
}

resource "aws_s3_bucket" "frontend" {
  bucket = local.frontend_bucket_name

  tags = local.tags
}

resource "aws_s3_bucket_ownership_controls" "frontend" {
  bucket = aws_s3_bucket.frontend.id

  rule {
    object_ownership = "BucketOwnerEnforced"
  }
}

resource "aws_s3_bucket_public_access_block" "frontend" {
  bucket                  = aws_s3_bucket.frontend.id
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_versioning" "frontend" {
  bucket = aws_s3_bucket.frontend.id

  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_cloudfront_origin_access_control" "frontend" {
  name                              = "${local.name_prefix}-oac"
  description                       = "Access control for CaseFlow frontend bucket"
  origin_access_control_origin_type = "s3"
  signing_behavior                  = "always"
  signing_protocol                  = "sigv4"
}

resource "aws_cloudfront_distribution" "frontend" {
  enabled             = true
  comment             = "CaseFlow frontend"
  default_root_object = "index.html"

  origin {
    domain_name              = aws_s3_bucket.frontend.bucket_regional_domain_name
    origin_id                = "caseflow-frontend"
    origin_access_control_id = aws_cloudfront_origin_access_control.frontend.id
  }

  default_cache_behavior {
    allowed_methods  = ["GET", "HEAD", "OPTIONS"]
    cached_methods   = ["GET", "HEAD"]
    target_origin_id = "caseflow-frontend"

    viewer_protocol_policy = "redirect-to-https"
    compress               = true

    forwarded_values {
      query_string = true
      cookies {
        forward = "none"
      }
    }
  }

  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }

  viewer_certificate {
    cloudfront_default_certificate = true
  }

  price_class = "PriceClass_100"
  tags        = local.tags
}

data "aws_iam_policy_document" "frontend_bucket" {
  statement {
    sid    = "AllowCloudFrontService"
    effect = "Allow"

    principals {
      type        = "Service"
      identifiers = ["cloudfront.amazonaws.com"]
    }

    actions   = ["s3:GetObject"]
    resources = ["${aws_s3_bucket.frontend.arn}/*"]

    condition {
      test     = "StringEquals"
      variable = "AWS:SourceArn"
      values   = [aws_cloudfront_distribution.frontend.arn]
    }
  }
}

resource "aws_s3_bucket_policy" "frontend" {
  bucket = aws_s3_bucket.frontend.id
  policy = data.aws_iam_policy_document.frontend_bucket.json
}
