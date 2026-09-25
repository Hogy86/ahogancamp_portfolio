provider "aws" {
  region = var.aws_region
}

# CloudFront requires any ACM certificate it uses to be requested in
# us-east-1, no matter which region everything else runs in. This alias
# exists purely so acm.tf can target that region explicitly.
provider "aws" {
  alias  = "us_east_1"
  region = "us-east-1"
}

# S3 bucket names are globally unique across ALL AWS accounts, not just
# yours - this suffix avoids a naming collision with someone else's bucket.
resource "random_id" "bucket_suffix" {
  byte_length = 4
}
