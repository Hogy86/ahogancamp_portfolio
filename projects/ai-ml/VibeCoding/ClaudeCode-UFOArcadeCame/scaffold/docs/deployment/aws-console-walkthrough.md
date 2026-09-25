# AWS Console Walkthrough — Deploying Vanguard vs. Sentinels

This walks through building the exact same infrastructure as
[`infra/aws/`](../../infra/aws/)'s Terraform module, by hand, in the AWS
Console — so you can see what each resource actually is before (or instead
of) running `terraform apply`. Each section names the matching Terraform
resource in *italics* so you can cross-reference.

**Architecture in one sentence:** the built game is a folder of static files
(HTML/CSS/JS, ~30KB total) sitting in a private S3 bucket, served to the
world through CloudFront (a CDN that also terminates HTTPS and adds security
headers) — there is no server running anywhere, which is what keeps this
essentially free.

**Estimated cost:** ~$0/month without a custom domain. ~$0.50/month +
~$12/year for a domain if you add one. Compare to running the existing
Docker container on something like AWS App Runner or ECS Fargate, which bills
for compute time continuously (roughly $10–30+/month minimum) even though
this app is 100% static and doesn't need a running server at all.

---

## Prerequisite: build the game locally

Before uploading anything, produce the files you're going to upload:

```bash
npm run build
```

This creates a `dist/` folder — that's what gets uploaded to S3 in the steps
below.

---

## Step 1 — Create the S3 bucket

*(Terraform: `aws_s3_bucket.site`, `aws_s3_bucket_public_access_block.site`,
`aws_s3_bucket_ownership_controls.site`)*

1. Console → **S3** → **Create bucket**.
2. **Bucket name**: must be globally unique across *all* AWS accounts, not
   just yours (e.g. `vanguard-vs-sentinels-yourname-2026`).
3. **Region**: pick one close to you — it barely matters for latency since
   CloudFront (step 4) will cache the content at edge locations worldwide
   regardless.
4. **Object Ownership**: leave as **ACLs disabled (recommended)** — this is
   `BucketOwnerEnforced` in Terraform terms.
5. **Block Public Access settings**: leave **all four boxes checked** (block
   all public access). This bucket should never be directly reachable — only
   CloudFront will be allowed to read from it, via a policy you'll add in
   step 4.
6. Leave everything else at its default. **Do not** enable "Static website
   hosting" under bucket **Properties** — that's the older, less secure
   pattern (a fully public bucket serving plain HTTP); this walkthrough uses
   the modern private-bucket-plus-CDN approach instead.
7. Create the bucket, then upload the contents of your local `dist/` folder
   into it (drag-and-drop in the console works fine for a one-off; for
   repeated deploys you'll want the AWS CLI — see `infra/aws/deploy.sh` for a
   ready-made script once you're on Terraform).

At this point the bucket exists but is **completely unreachable from the
internet** — that's intentional. Steps 2–4 build the pieces that expose it
safely through CloudFront.

---

## Step 2 — (Optional) Request a TLS certificate for a custom domain

*(Terraform: `aws_acm_certificate.site`, `aws_acm_certificate_validation.site`)*

**Skip this step and step 3 entirely if you're fine with the free
`*.cloudfront.net` URL** — CloudFront provides its own certificate for that
automatically, at no cost and with nothing to configure. Only do this if you
want a custom domain like `yourgame.com`.

1. Console → **Certificate Manager (ACM)**. **Important: switch your region
   selector (top-right) to `us-east-1` / N. Virginia first** — CloudFront
   only accepts certificates issued in that specific region, regardless of
   where your S3 bucket lives.
2. **Request a certificate** → **Request a public certificate**.
3. **Fully qualified domain name**: your domain (e.g. `yourgame.com`). Add
   `www.yourgame.com` too as an additional name if you want both to work.
4. **Validation method**: **DNS validation** (the standard, automatic
   option).
5. Request it. ACM will show you one or more CNAME records you need to add
   to your domain's DNS to *prove* you own it — this is exactly what step 3's
   Route 53 records do automatically if you're using Route 53 for DNS. Once
   the record is visible to ACM, the certificate status flips from "Pending
   validation" to "Issued" — usually within a few minutes.

---

## Step 3 — (Optional) Set up DNS with Route 53

*(Terraform: `aws_route53_zone.site`, `aws_route53_record.cert_validation`,
`aws_route53_record.site_a`, `aws_route53_record.site_aaaa`)*

Skip this if you're using the free CloudFront URL.

1. Console → **Route 53** → **Hosted zones** → **Create hosted zone**.
2. **Domain name**: your domain.
3. **Type**: Public hosted zone.
4. Create it. Route 53 shows you a set of **4 nameservers** (NS records) —
   **copy these**. Go to whichever registrar you bought the domain from
   (GoDaddy, Namecheap, Route 53 itself, etc.) and update the domain's
   nameservers to these 4 values. This is the step that actually makes the
   internet start asking *your* Route 53 zone how to resolve the domain,
   instead of the registrar's default. Propagation can take minutes to (in
   rare cases) up to 48 hours.
5. Back in the hosted zone, add the DNS validation CNAME record ACM showed
   you in step 2 (if you haven't already — Route 53 often offers a
   one-click "Create record in Route 53" button directly from the ACM
   console, which does this for you).
6. **Don't create the A/AAAA record pointing at CloudFront yet** — you need
   the CloudFront distribution's domain name first, which doesn't exist
   until step 4. You'll come back to this hosted zone afterward.

---

## Step 4 — Create the CloudFront distribution

*(Terraform: `aws_cloudfront_origin_access_control.site`,
`aws_cloudfront_response_headers_policy.security_headers`,
`aws_cloudfront_distribution.site`)*

This is the main piece: the CDN that actually serves the game to visitors,
over HTTPS, from edge locations near them.

1. Console → **CloudFront** → **Create distribution**.
2. **Origin domain**: select your S3 bucket from the dropdown (search for the
   bucket name from step 1). Note: pick the bucket itself, not an "S3
   website endpoint" option if one appears — you want the private-bucket
   path.
3. **Origin access control settings**: choose **Origin access control
   settings (recommended)**, then **Create control setting** → accept the
   defaults (Sign requests, SigV4). This is what lets CloudFront read the
   *private* bucket while everyone else is still blocked. After creating the
   distribution, CloudFront will show you an exact bucket policy to paste
   into the S3 bucket's **Permissions → Bucket policy** tab — do that step;
   without it CloudFront gets "Access Denied" trying to read your files.
4. **Viewer protocol policy**: **Redirect HTTP to HTTPS**.
5. **Allowed HTTP methods**: **GET, HEAD** (this is a read-only static site —
   no need for POST/PUT/DELETE).
6. **Cache policy**: **CachingOptimized** (an AWS-managed policy — good
   default caching behavior for static assets, no need to build a custom
   one).
7. **Response headers policy**: click **Create response headers policy** (in
   a new tab, or come back after) and configure:
   - **Content Security Policy**: enabled, value:
     ```
     default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self'; font-src 'self'; connect-src 'self'; object-src 'none'; base-uri 'none'; frame-ancestors 'none'; form-action 'none'
     ```
   - **X-Content-Type-Options**: enabled (adds `nosniff`)
   - **Referrer Policy**: enabled, value `no-referrer`
   - **X-Frame-Options**: enabled, value `DENY`
   - **Strict-Transport-Security**: enabled, max-age `63072000`, include
     subdomains, preload (this is new compared to the Docker/nginx setup —
     nginx never terminated HTTPS itself, but CloudFront does here, so HSTS
     is a free, meaningful addition)
   - Under **Custom headers**, add one: header name `Permissions-Policy`,
     value `geolocation=(), microphone=(), camera=()`
   - Save it, then select it back on the distribution's cache behavior.
   - These exactly match what `deploy/nginx/nginx.conf` sets today — same
     protection, enforced at the CDN edge instead of by a running server.
8. **Web Application Firewall (WAF)**: leave disabled (**Do not enable
   security protections**) — WAF is a paid add-on and unnecessary for a
   personal static site.
9. **Price class**: **Use North America and Europe only** (the cheapest
   option, plenty for personal-scale traffic). The other options add more
   edge locations worldwide at higher cost.
10. **Alternate domain name (CNAME)** — *only if using a custom domain*:
    enter your domain here, and under **Custom SSL certificate** select the
    certificate you issued in step 2.
11. **Default root object**: `index.html`.
12. **Custom error responses** (add two, under the distribution's **Error
    pages** tab after creation, or during creation if the wizard offers it):
    - Error code `403` → Response page path `/index.html`, HTTP response
      code `200`.
    - Error code `404` → Response page path `/index.html`, HTTP response
      code `200`.
    - This mirrors the existing `try_files ... /index.html` fallback nginx
      already does — a mistyped or unmatched path still serves the game
      instead of a bare error page.
13. Create the distribution. It takes a few minutes to deploy globally
    (status will show "Deploying" then "Enabled").
14. **Go back to S3** (per step 3's note) and paste the bucket policy
    CloudFront generated for you, under the bucket's **Permissions** tab.

Once enabled, CloudFront gives you a domain name like
`d111111abcdef8.cloudfront.net` — **that URL already works right now** if
you didn't set up a custom domain. Visit it to confirm the game loads.

---

## Step 5 — (Optional) Point your custom domain at CloudFront

*(Terraform: `aws_route53_record.site_a`, `aws_route53_record.site_aaaa`)*

Skip if using the free CloudFront URL.

1. Back in **Route 53** → your hosted zone from step 3.
2. **Create record**.
3. Leave **Record name** blank (for the bare domain) or enter `www` (for a
   `www.` subdomain).
4. **Record type**: `A`.
5. Toggle **Alias**: on.
6. **Route traffic to**: **Alias to CloudFront distribution**, then select
   your distribution from step 4.
7. Save. Repeat the same record with type `AAAA` for IPv6 (same alias
   target) — this is optional but matches modern best practice.
8. Give DNS a few minutes to propagate, then visit `https://yourdomain.com`.

---

## Verifying it all works

- Visit the site URL (CloudFront domain or your custom domain) — the game
  should load exactly as it does locally.
- Open browser dev tools → **Network** tab → reload → click the main
  document request → **Headers**. Confirm `content-security-policy`,
  `x-content-type-options`, `referrer-policy`, `x-frame-options`, and
  `strict-transport-security` are all present, matching what
  `docs/security/security-review-v2-update.md` requires.
- Try a nonexistent path (e.g. `https://yourdomain.com/nonsense`) — should
  still load the game (the custom error response from step 4.12), not a
  blank CloudFront error page.

## Publishing updates later

Every time you rebuild the game (`npm run build`), re-upload the new
`dist/` contents to the S3 bucket (replacing the old files), then create a
CloudFront **invalidation** for `/index.html` (Console → your distribution →
**Invalidations** tab → **Create invalidation** → path `/index.html`) so
visitors immediately get the new build instead of a cached old one. The
hashed JS/CSS files don't need invalidating — they get new filenames on every
build, so old cached copies just become unreferenced and harmless.

`infra/aws/deploy.sh` automates this exact sequence (build → sync → invalidate)
once you're using the Terraform module instead of doing it by hand.

## Tearing it down

If you want to remove everything: delete the CloudFront distribution first
(must be **disabled** before it can be deleted — this takes a few minutes to
propagate), then the S3 bucket (empty it first), then the ACM certificate and
Route 53 hosted zone if you created those. Doing this via `terraform destroy`
(see `infra/aws/README.md`) handles the ordering for you automatically.
