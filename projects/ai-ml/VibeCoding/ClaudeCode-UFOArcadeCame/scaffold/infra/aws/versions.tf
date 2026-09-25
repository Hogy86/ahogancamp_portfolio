# Pinned provider versions for reproducible applies. Local state is used
# (no S3/DynamoDB backend) - appropriate for a single-person personal project;
# see README.md if you later want remote state.

terraform {
  required_version = ">= 1.5.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    random = {
      source  = "hashicorp/random"
      version = "~> 3.6"
    }
  }
}
