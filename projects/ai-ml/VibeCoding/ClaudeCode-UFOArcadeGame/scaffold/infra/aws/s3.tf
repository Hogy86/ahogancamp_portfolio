# Holds the built static site (dist/ output). No "static website hosting"
# endpoint is enabled on purpose: CloudFront reads this bucket as a private
# origin via Origin Access Control (cloudfront.tf), which is the current
# AWS-recommended pattern. The older "S3 website endpoint + public bucket"
# approach is both less secure (world-readable bucket) and can't serve HTTPS
# directly - CloudFront is what provides TLS here.

locals {
  bucket_name = "${var.project_name}-${random_id.bucket_suffix.hex}"
}

resource "aws_s3_bucket" "site" {
  bucket = local.bucket_name

  tags = {
    Project = var.project_name
  }
}

resource "aws_s3_bucket_public_access_block" "site" {
  bucket = aws_s3_bucket.site.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_ownership_controls" "site" {
  bucket = aws_s3_bucket.site.id
  rule {
    object_ownership = "BucketOwnerEnforced"
  }
}

# Grants ONLY the specific CloudFront distribution below (matched by ARN)
# permission to read objects. The bucket has no other public or
# cross-account access - this is the S3 half of the OAC handshake described
# in cloudfront.tf.
data "aws_iam_policy_document" "site_bucket_policy" {
  statement {
    sid       = "AllowCloudFrontOAC"
    actions   = ["s3:GetObject"]
    resources = ["${aws_s3_bucket.site.arn}/*"]

    principals {
      type        = "Service"
      identifiers = ["cloudfront.amazonaws.com"]
    }

    condition {
      test     = "StringEquals"
      variable = "AWS:SourceArn"
      values   = [aws_cloudfront_distribution.site.arn]
    }
  }
}

resource "aws_s3_bucket_policy" "site" {
  bucket = aws_s3_bucket.site.id
  policy = data.aws_iam_policy_document.site_bucket_policy.json
}
