#!/usr/bin/env bash
# Builds the game and syncs it to S3 + invalidates the CloudFront cache.
# Run `terraform apply` in this directory at least once before using this
# script - it reads the bucket name and distribution ID from Terraform state.
set -euo pipefail

cd "$(dirname "$0")"

BUCKET=$(terraform output -raw bucket_name)
DISTRIBUTION_ID=$(terraform output -raw cloudfront_distribution_id)

echo "==> Building the game"
(cd ../.. && npm run build)

echo "==> Syncing dist/ to s3://$BUCKET"
# Hashed JS/CSS/asset filenames change on every build, so they're safe to
# cache for a year. index.html is NOT hashed and references those filenames,
# so it must never be served stale - excluded from the long-cache sync below
# and uploaded separately with no-cache.
aws s3 sync ../../dist "s3://$BUCKET" \
  --delete \
  --cache-control "public, max-age=31536000, immutable" \
  --exclude "index.html"

aws s3 cp ../../dist/index.html "s3://$BUCKET/index.html" \
  --cache-control "no-cache, must-revalidate"

echo "==> Invalidating CloudFront cache for index.html"
aws cloudfront create-invalidation \
  --distribution-id "$DISTRIBUTION_ID" \
  --paths "/index.html" \
  --query "Invalidation.Id" \
  --output text

echo "==> Done. Site: $(terraform output -raw site_url)"
