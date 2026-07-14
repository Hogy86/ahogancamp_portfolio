# All resources in this file are skipped entirely when domain_name is "" -
# the free *.cloudfront.net URL needs no DNS management at all.

resource "aws_route53_zone" "site" {
  count = var.domain_name != "" && var.create_hosted_zone ? 1 : 0
  name  = var.domain_name

  tags = {
    Project = var.project_name
  }
}

data "aws_route53_zone" "existing" {
  count = var.domain_name != "" && !var.create_hosted_zone ? 1 : 0
  name  = var.domain_name
}

locals {
  zone_id = var.domain_name == "" ? "" : (
    var.create_hosted_zone ? aws_route53_zone.site[0].zone_id : data.aws_route53_zone.existing[0].zone_id
  )
}

# Points the bare domain at the CloudFront distribution. Uses an "alias"
# record (Route 53-specific) rather than a plain CNAME, which is what lets
# this work even at the zone apex (e.g. "example.com", not just
# "www.example.com").
resource "aws_route53_record" "site_a" {
  count   = var.domain_name != "" ? 1 : 0
  zone_id = local.zone_id
  name    = var.domain_name
  type    = "A"

  alias {
    name                   = aws_cloudfront_distribution.site.domain_name
    zone_id                = aws_cloudfront_distribution.site.hosted_zone_id
    evaluate_target_health = false
  }
}

resource "aws_route53_record" "site_aaaa" {
  count   = var.domain_name != "" ? 1 : 0
  zone_id = local.zone_id
  name    = var.domain_name
  type    = "AAAA"

  alias {
    name                   = aws_cloudfront_distribution.site.domain_name
    zone_id                = aws_cloudfront_distribution.site.hosted_zone_id
    evaluate_target_health = false
  }
}
