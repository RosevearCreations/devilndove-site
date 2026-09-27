# Release 467 Build 281 — Standalone / Social Project Operator Acceptance

## Purpose

Build 281 converts the Build 271 standalone/social CAIP source contract into fresh operator evidence. The acceptance path uses one **existing**, non-archived Creative Process project with no Product and the normal authenticated CAIP operator API on the exact Development deployment.

The test does not fabricate a Creative Process record, Product, Content Studio package, provider publication, public promotion or media object.

## Exact predecessor

Build 280 **Private-Media Reconciliation & Recovery Outcome Review** is the exact verified predecessor after repository hygiene cleanup.

- Development SHA: `c8033413b5ff85865caecee2f3b2a88558b80b03`
- Production main SHA: `94e46cae035769ba61de379add1f7c1a6a1c21f0`
- shared tree: `c0f690478f6fdbd3748f8ecadc365abb2e0d1c06`
- Development proofs: System `36353058900`, Quality `36353058904`, I.T. `36353058892`, Hygiene `36353058965`, Build 280 `36353058905`
- Production proofs: Pages `36353256814`, Live Resources `36353294130`, Product Browser `36353294143`, Product Route `36353294081`, Build 280 `36353256919`

## Live operator acceptance

The Development-only workflow waits for the exact Build 281 System Gate deployment, obtains that exact Preview URL from the System Gate artifact, and then:

1. resolves an existing active Development administrator session without creating a synthetic operator;
2. selects one existing non-archived `creative_work_projects` row whose `product_id` is NULL;
3. calls `POST /api/admin/creative-assets` with `action=open_creative_work_project`;
4. requires the returned CAIP project to retain `source_type=creative_work_project` and the same source identity;
5. requires exactly one `creative_projects` mapping for that source;
6. requires Product identity to remain NULL and `product_created=false`;
7. requires `content_project_created=false` and preserves any pre-existing Content Studio link unchanged;
8. requires the corresponding `standalone_project_opened` or `standalone_project_refreshed` event to state that private media was unchanged;
9. requires the CAIP policy to retain `no_auto_publish=true` and explicit release approval;
10. retains only sanitized hashes, counts and booleans in the acceptance artifact.

If no real productless Creative Process record or active administrator session exists, the acceptance fails closed instead of fabricating evidence.

## Authority separation

- Creative Process remains the project identity authority.
- CAIP owns private media, evidence/story review and derivative planning.
- Content Studio remains a separate reviewed package authority.
- Products remain optional and are not fabricated.
- Release Board/provider adapters remain the only publication boundary.
- Build 281 invokes no provider execution/publication or public promotion endpoint.

## Production boundary

The live operator mutation is **Development-only**. Production receives the identical already-accepted code tree and runs no Build 281 operator mutation. Production D1 business data, R2, provider, publication, Inventory, Finance, payment and refund mutation remain closed.

## Closure target

`STANDALONE_SOCIAL_PROJECT_OPERATOR_ACCEPTED_REAL_EVIDENCE`

## Next bounded release

The future queue **has not run out**.

Next: **Build 282 — Content Studio Bridge Operator Acceptance**.
