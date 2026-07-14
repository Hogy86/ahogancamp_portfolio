# The CDN in front of the S3 bucket: serves HTTPS, caches at edge locations
# worldwide, and enforces the same security headers deploy/nginx/nginx.conf
# sets today (security-review-v2.md carry-forward item 2) - except here
# they're applied at the edge, with no origin server running (and therefore
# nothing to pay for while idle).

# Modern, recommended way for CloudFront to read a private S3 bucket.
# Replaces the older, now-deprecated "Origin Access Identity" (OAI) pattern.
resource "aws_cloudfront_origin_access_control" "site" {
  name                              = "${var.project_name}-oac"
  origin_access_control_origin_type = "s3"
  signing_behavior                  = "always"
  signing_protocol                  = "sigv4"
}

resource "aws_cloudfront_response_headers_policy" "security_headers" {
  name = "${var.project_name}-security-headers"

  security_headers_config {
    content_security_policy {
      override                = true
      content_security_policy = "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self'; font-src 'self'; connect-src 'self'; object-src 'none'; base-uri 'none'; frame-ancestors 'none'; form-action 'none'"
    }
    content_type_options {
      override = true
    }
    referrer_policy {
      override        = true
      referrer_policy = "no-referrer"
    }
    frame_options {
      override     = true
      frame_option = "DENY"
    }
    # Not present in the original nginx config (which didn't terminate TLS
    # itself - see deployment-notes.md). CloudFront IS the TLS termination
    # point here, so HSTS is a genuine, free hardening addition on top of
    # parity with the container deployment, not a behavior change.
    strict_transport_security {
      override                   = true
      access_control_max_age_sec = 63072000
      include_subdomains         = true
      preload                    = true
    }
  }

  custom_headers_config {
    items {
      header   = "Permissions-Policy"
      value    = "geolocation=(), microphone=(), camera=()"
      override = true
    }
  }
}

data "aws_cloudfront_cache_policy" "caching_optimized" {
  name = "Managed-CachingOptimized"
}

resource "aws_cloudfront_distribution" "site" {
  enabled             = true
  is_ipv6_enabled     = true
  default_root_object = "index.html"
  price_class         = var.price_class
  aliases             = var.domain_name != "" ? [var.domain_name] : []

  origin {
    domain_name              = aws_s3_bucket.site.bucket_regional_domain_name
    origin_id                = "s3-origin"
    origin_access_control_id = aws_cloudfront_origin_access_control.site.id
  }

  default_cache_behavior {
    allowed_methods             = ["GET", "HEAD", "OPTIONS"]
    cached_methods               = ["GET", "HEAD"]
    target_origin_id             = "s3-origin"
    viewer_protocol_policy       = "redirect-to-https"
    compress                     = true
    cache_policy_id               = data.aws_cloudfront_cache_policy.caching_optimized.id
    response_headers_policy_id    = aws_cloudfront_response_headers_policy.security_headers.id
  }

  # Matches the existing nginx `try_files ... /index.html` fallback
  # (smoke-test-results.md): a missing route serves index.html at 200
  # instead of a bare CloudFront error page. Missing hashed asset files (a
  # genuinely broken build) are unaffected, since those are exact object
  # lookups the S3 origin already resolves correctly.
  custom_error_response {
    error_code        = 403
    response_code      = 200
    response_page_path = "/index.html"
  }
  custom_error_response {
    error_code        = 404
    response_code      = 200
    response_page_path = "/index.html"
  }

  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }

  viewer_certificate {
    cloudfront_default_certificate = var.domain_name == "" ? true : null
    acm_certificate_arn            = var.domain_name != "" ? aws_acm_certificate_validation.site[0].certificate_arn : null
    ssl_support_method             = var.domain_name != "" ? "sni-only" : null
    minimum_protocol_version       = var.domain_name != "" ? "TLSv1.2_2021" : null
  }

  tags = {
    Project = var.project_name
  }
}
