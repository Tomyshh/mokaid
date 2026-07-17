# AWS Infrastructure

Everything is managed by Terraform (`infra/terraform`). One `stack` composition module instantiated for production.

## Resource inventory (prod)

| Service | Resources | Notes |
|---|---|---|
| VPC | 1 VPC, 2 public + 2 private subnets, IGW, NAT | single NAT (cost-optimized) |
| ALB | 1 ALB + target groups | WebSocket-ready (120s idle, sticky sessions), HTTPS when cert provided |
| ECS | 1 Fargate cluster, `api` + `ai-worker` + `web` services | Container Insights, CPU target-tracking autoscaling |
| ECR | `mokaid-api`, `mokaid-ai-worker`, `mokaid-web` | immutable tags, scan-on-push, keep last 20 |
| RDS | PostgreSQL 16 | private, SSE-KMS, gp3 autoscaling, PI enabled |
| S3 | 6 buckets: `app`, `assets-3d`, `files`, `uploads`, `exports`, `backups` | BPA on, SSE-KMS, versioning, lifecycle rules, CORS on upload buckets |
| CloudFront | optional | SPA origin + `/assets3d/*` origin, OAC, SPA 403/404→index.html |
| Cognito | User Pool + web client + hosted domain | SRP auth, 12+ char passwords, advanced security AUDIT |
| SQS | `ai-runs` + DLQ | 15 min visibility, long polling, redrive after 3 |
| Secrets | Secrets Manager + SSM params | placeholders created, values set out-of-band |
| Monitoring | SNS topic, alarms, monthly budget | CPU/memory/DB CPU |

## Production sizing (current)

| | prod |
|---|---|
| API | 0.25 vCPU / 512 MB ×1 (max 2) |
| Worker | 0.25 / 512 MB |
| Web | 0.25 / 512 MB ×1 (max 2) |
| RDS | db.t4g.micro |
| NAT | 1 shared |
| Budget alert | $100/mo |
| VPC CIDR | 10.10.0.0/16 |

## IAM model

- Each ECS service has a **dedicated task role**:
  - API: S3 files/uploads/exports RW, SQS `SendMessage`, Cognito admin reads.
  - Worker: SQS consume, S3 files RW.
- Execution roles can only pull images and read their own secrets.
- No wildcard resources on data-plane policies.

## State & conventions

- Remote state: S3 `mokaid-terraform-state` (versioned, KMS) + DynamoDB `mokaid-terraform-locks`.
- Mandatory tags on everything: `Project=mokaid`, `Owner=Yapio`, `ManagedBy=Terraform`, `Environment=prod`.
- Buckets are suffixed with the account ID to guarantee global uniqueness.
