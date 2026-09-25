variable "project_name" {
  description = "Short name used to prefix/tag all resources."
  type        = string
  default     = "vanguard-vs-sentinels"
}

variable "aws_region" {
  description = "Primary AWS region for the S3 bucket. CloudFront itself is a global service; ACM certificates used by CloudFront must always live in us-east-1 regardless of this value (handled separately via a provider alias)."
  type        = string
  default     = "us-east-1"
}

variable "domain_name" {
  description = "Optional custom domain (e.g. \"game.example.com\"). Leave as \"\" to use the free auto-generated *.cloudfront.net URL and skip all ACM/Route 53 resources entirely - the cheapest option."
  type        = string
  default     = ""
}

variable "create_hosted_zone" {
  description = "Only used when domain_name is set. true = Terraform creates a brand-new Route 53 hosted zone for the domain (point your registrar's nameservers at the output `route53_name_servers` after apply). false = domain_name already has a hosted zone in this AWS account (e.g. already registered through Route 53); Terraform looks it up instead of creating a new one."
  type        = bool
  default     = true
}

variable "price_class" {
  description = "CloudFront price class. PriceClass_100 = North America + Europe edge locations only (cheapest, plenty for a personal site). PriceClass_200 adds Asia/Africa/South America. PriceClass_All = every edge location worldwide (most expensive, not needed here)."
  type        = string
  default     = "PriceClass_100"
}
