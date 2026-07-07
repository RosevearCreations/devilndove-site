# Build 210 Validation — Social Publishing Workspace & Product Draft Automation

## Scope

Build 210 adds a dedicated Social Publishing admin workspace plus an optional, review-first trigger that generates one social draft from an eligible product. It does not auto-publish or expose credentials.

## Before deployment

1. Confirm the archive is flattened:
   ```text
   index.html
   _routes.json
   wrangler.toml
   functions/
   ```
   must be at the archive root.

2. In Cloudflare Pages, keep the existing D1 binding named:
   ```text
   DB
   ```

3. Apply this optional additive migration in the correct D1 database:
   ```text
   database_build210_social_publishing_product_automation.sql
   ```

   It creates the settings table but leaves automation disabled. Do not paste access tokens into D1.

## Platform credential setup

Use **Cloudflare Pages → Settings → Variables and Secrets** and choose encrypted secrets:

```text
FACEBOOK_PAGE_ID
FACEBOOK_PAGE_ACCESS_TOKEN
INSTAGRAM_USER_ID
INSTAGRAM_ACCESS_TOKEN
META_GRAPH_API_VERSION       # optional; defaults to v25.0
X_USER_ACCESS_TOKEN
PINTEREST_ACCESS_TOKEN
PINTEREST_BOARD_ID
```

Do not configure TikTok or YouTube for direct publishing until their dedicated OAuth/upload work exists.

## Admin workspace test

1. Sign in as admin.
2. Open:
   ```text
   /admin/social-publishing/
   ```
3. Verify:
   - no secret values are shown;
   - the connection cards show only variable names;
   - automatic product social drafts starts disabled;
   - the Social Posting Queue and Social Media Privacy Guard load;
   - the page has no horizontal overflow at phone width.

## Product trigger test

Use a non-sensitive test product. Do not use customer media, family photos, addresses, personal notes, or copyrighted third-party content.

1. In `/admin/social-publishing/`, enable **Create a social draft when a product becomes eligible**.
2. Keep:
   - Require Active/Published = on
   - Require usable product image = on
   - Trigger = Approved or Published
3. Create a product or update an existing product so it is:
   - `status = active` or `published`
   - `review_status = approved` or `published`
   - has a usable HTTPS product image
4. Reload `/admin/social-publishing/` or `/admin/operations/`.
5. Confirm exactly one queue item is created with:
   ```text
   source_type = product
   source_id = the product id
   approval_status = needs_review
   post_status = draft
   privacy_status = needs_review
   approved_for_public_post = 0
   api_publish_mode = review_first
   ```
6. Save the product again. Confirm no second active queue item is created.
7. Confirm the product’s facts, featured media, Content Studio, CAIP, Release Preflight, and Release Board status were not changed.

## Privacy/dry-run test

1. Open the Social Media Privacy Guard for the generated draft.
2. Complete/record the required review.
3. Adjust the caption, platforms, and UTM values if needed.
4. Use **Dry run**.
5. Confirm the payload preview is recorded but no platform API request was sent.
6. Only after review and approval, test one configured platform with one low-risk post.
7. Verify the platform attempt record, public post URL (when returned), and UTM session/visit data.

## Connection tests

- Facebook Page: use one product photo or link test after Page token setup.
- Instagram: use one public HTTPS single image only.
- Pinterest: use one public HTTPS product image and a correct product link.
- X: use a concise text/link post only.
- TikTok/YouTube: confirm manual preparation only; no Direct Post/upload attempt should occur.

## Regression checks

```bash
find functions public -name '*.js' -print0 | xargs -0 -n1 node --check
```

Then verify:

- one H1 or fewer on each HTML page;
- social publishing page has no public indexing;
- social secret names do not appear in public API responses;
- social queue remains review-first;
- no `auto_publish` setting/action exists;
- login remains unchanged and is still evidence-first.
