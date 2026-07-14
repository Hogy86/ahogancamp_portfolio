# AWS deployment (Terraform) — Vanguard vs. Sentinels

Deploys the game as a static site on S3 + CloudFront instead of running the
Docker container in the cloud. See the architecture rationale and cost
comparison in [`docs/deployment/aws-console-walkthrough.md`](../../docs/deployment/aws-console-walkthrough.md)
(that doc also walks through creating the same resources by hand in the AWS
Console, if you want to see what Terraform is doing under the hood first).

**Cost:** ~$0/month with the default (no custom domain) config — CloudFront's
free tier (1TB/month transfer, 10M requests/month) comfortably covers a
personal-scale site. Adding a custom domain costs $0.50/month (Route 53
hosted zone) plus ~$12/year for domain registration if you don't already own
one.

## Prerequisites

1. An AWS account and an IAM user/role with credentials configured locally
   (`aws configure`, or an SSO profile — anything the AWS CLI and Terraform's
   AWS provider can pick up).
2. [Terraform](https://developer.hashicorp.com/terraform/install) >= 1.5.
3. The [AWS CLI](https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html)
   (used by `deploy.sh` to upload the built site — Terraform itself doesn't
   need it).
4. Node.js (already required by the rest of this repo) to run `npm run build`.

## First-time setup

```bash
cd infra/aws
cp terraform.tfvars.example terraform.tfvars   # edit if you want a custom domain
terraform init
terraform plan     # review what it's about to create
terraform apply    # type "yes" to confirm
```

This provisions the S3 bucket, CloudFront distribution, response headers
policy, and (if `domain_name` is set) the ACM certificate and Route 53
records. It does **not** upload the game itself yet — that's `deploy.sh`.

## Deploying the game (every time you want to publish a change)

```bash
./deploy.sh
```

This builds the app, syncs `dist/` to the S3 bucket, and invalidates the
CloudFront cache so the new build is visible immediately instead of waiting
for the old cached version to expire.

## Adding a custom domain later

1. Edit `terraform.tfvars`, set `domain_name = "yourdomain.com"`.
2. `terraform apply` again.
3. If `create_hosted_zone = true` (the default), Terraform just created a new
   Route 53 hosted zone. Run `terraform output route53_name_servers` and
   update your domain registrar's nameserver settings to match — this is the
   step that actually makes the domain point at AWS. DNS propagation can take
   anywhere from a few minutes to ~48 hours depending on your registrar.
4. If the domain already has a hosted zone in this AWS account, set
   `create_hosted_zone = false` instead and Terraform will use the existing
   zone rather than creating a conflicting second one.

## Tearing it down

```bash
terraform destroy
```

Removes every resource this module created. S3 bucket contents are deleted
along with the bucket, so nothing lingers billing you after teardown (aside
from the domain registration itself, if you registered one — that's separate
from this Terraform module and not something `destroy` touches).

## Notes

- **State is local** (`terraform.tfstate` in this directory, gitignored). Fine
  for a single person managing this alone. If you ever collaborate with
  someone else on the infra, move to a remote backend (e.g. an S3 bucket +
  DynamoDB lock table) so you don't overwrite each other's state — not set up
  here to keep this simple and free.
- **No compute is provisioned.** There's no EC2 instance, container, or
  Lambda function running anything — S3 stores the files, CloudFront serves
  them from edge locations. This is what keeps the cost near-zero regardless
  of how it compares to running the existing `Dockerfile`/`docker-compose.yml`
  in something like ECS Fargate or App Runner (both bill for compute time
  even when idle).
- **The Docker setup in the repo root is unaffected** — it's still the right
  tool for local development and previewing changes; this Terraform module is
  specifically for the production deployment.
