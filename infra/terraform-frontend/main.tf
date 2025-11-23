# S3 Module
module "s3" {
  source = "./modules/s3"

  project_name = var.project_name
  environment  = var.environment
}

# ACM Module (선택적 - 커스텀 도메인 사용 시)
module "acm" {
  count  = var.use_custom_domain ? 1 : 0
  source = "./modules/acm"

  providers = {
    aws = aws.us_east_1
  }

  domain_name     = var.domain_name
  route53_zone_id = var.route53_zone_id
}

# CloudFront Module
module "cloudfront" {
  source = "./modules/cloudfront"

  project_name        = var.project_name
  environment         = var.environment
  s3_bucket_id        = module.s3.bucket_id
  s3_bucket_arn       = module.s3.bucket_arn
  s3_bucket_domain    = module.s3.bucket_regional_domain_name
  price_class         = var.price_class
  use_custom_domain   = var.use_custom_domain
  domain_name         = var.domain_name
  acm_certificate_arn = var.use_custom_domain ? module.acm[0].certificate_arn : ""

  depends_on = [module.s3]
}

# Route53 Record (선택적 - 커스텀 도메인 사용 시)
resource "aws_route53_record" "frontend" {
  count   = var.use_custom_domain ? 1 : 0
  zone_id = var.route53_zone_id
  name    = var.domain_name
  type    = "A"

  alias {
    name                   = module.cloudfront.distribution_domain_name
    zone_id                = module.cloudfront.distribution_hosted_zone_id
    evaluate_target_health = false
  }
}
