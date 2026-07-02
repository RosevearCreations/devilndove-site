# 07 — Content Orchestration and Release Integration

## Current handoff boundaries

| System | What it owns | CAIP relationship |
|---|---|---|
| Product/catalog | Listings, price, inventory, product facts, featured media | CAIP reads source facts; never auto-writes them |
| Content Studio | Source archive choices and channel deliverable plans | CAIP mirrors references and returns evidence/candidates for review |
| Content Release Board | Workshop Journal/gallery drafts and public publish/unpublish | CAIP does not publish or bypass release checks |
| Social Queue | Platform-specific review queue | CAIP does not enqueue or post directly |
| Future renderer | Render job execution and output verification | CAIP prepares only reviewed inputs/lineage |

## Release readiness rules

CAIP may help an editor find a candidate, but Content Release Board still requires its own truthful visible copy, public-cleared media, alt text, source deliverable approval, stable slug, and explicit publish action.

Google’s current guidance requires image data and structured data to correspond to the actual page and use crawlable, relevant media URLs. CAIP therefore keeps output candidates separate from a claimed public page; it does not add markup or route URLs by itself.

## Future channel-pack generator

The desired channel generator receives an **approved export package**, not raw CAIP suggestions:

```text
CAIP asset/evidence review
  → Content Studio deliverable approval
  → render/provider output verification
  → destination metadata validation
  → owner preview/approval
  → Release Board or channel-specific publish action
```

A future package can support the desired 1 YouTube / 3 Facebook / 5 Reels / 5 TikToks plus gallery, GBP, SEO, blog, thumbnail, and captions. It must preserve per-channel output IDs, provider job lineage, preview evidence, policy/disclosure requirements, and publish/unpublish/error state.

## SEO constraints

- Never create thin or duplicate content merely because CAIP has a story segment.
- Use approved final media URLs consistently across public pages; do not use signed/private/temporary URLs in public schema.
- Descriptive alt text must reflect the actual shown asset, not generic keyword stuffing.
- Mobile and desktop need equivalent substantive content and image information.
- Structured data must describe visible content, not a future/hidden CAIP candidate.
