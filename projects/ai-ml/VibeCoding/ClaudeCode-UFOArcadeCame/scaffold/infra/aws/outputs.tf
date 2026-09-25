output "bucket_name" {
  description = "S3 bucket holding the built site. Sync target for deploy.sh / `aws s3 sync`."
  value       = aws_s3_bucket.site.bucket
}

output "cloudfront_distribution_id" {
  description = "Pass to `aws cloudfront create-invalidation` after every deploy so edge caches pick up new files."
  value       = aws_cloudfront_distribution.site.id
}

output "cloudfront_domain_name" {
  description = "The *.cloudfront.net URL. Usable directly if domain_name was left blank."
  value       = aws_cloudfront_distribution.site.domain_name
}

output "site_url" {
  description = "The URL to actually visit."
  value       = var.domain_name != "" ? "https://${var.domain_name}" : "https://${aws_cloudfront_distribution.site.domain_name}"
}

output "route53_name_servers" {
  description = "Only set when domain_name is set AND create_hosted_zone=true. Update your domain registrar to use these nameservers so the domain actually resolves through this new Route 53 zone."
  value       = var.domain_name != "" && var.create_hosted_zone ? aws_route53_zone.site[0].name_servers : null
}
