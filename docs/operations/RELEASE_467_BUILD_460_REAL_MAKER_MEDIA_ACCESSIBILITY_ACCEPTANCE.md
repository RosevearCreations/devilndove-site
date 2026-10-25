# Devil n Dove Build 460 — Real Maker Media & Accessibility Acceptance

**Private Admin route:** `/admin/maker-media-acceptance/`, linked from Maker Workbench and Maker Photography & Stories.

This is a **read-only source-linked audit and hands-on owner test plan**. There are no new migrations, data tables, R2 reads/copies, image downloads, public previews, customer records, social posts, provider calls or Product/rights/release writes. The page consumes the existing authenticated Build 452 `GET /api/admin/maker-media-stories` with same-origin credentials and no-store caching, retaining original Creative Project, Maker Story and frame IDs. Backend canonical media/consent enforcement remains in migration 0047 and the owning modules. An unauthorized or missing-migration response is displayed as HOLD, never treated as empty approval.

## Real maker walkthrough

1. Sign in as Admin. Choose one **actual** jewellery, resin, fabrication, failed attempt, or private learning Creative Project. To select a saved source by ID, use Build 459 Maker Evidence Finder first. If there is no original Maker Story, create it in the existing Maker Photography & Stories module with actual source media; do not invent assets.
2. Choose a story revision. Inspect the bounded original frames and source identities. The page reports textual caption/accessible-description gaps, missing/multiple principal selections, a private/public-intent mismatch, absent/unreturned exact consent, expired or nonmatching consent URL, and missing media source hints. An R2 private source without a public URL is **not** considered missing or approved; open the authorized Media Studio.
3. Open each **actual** source in Creative Process, Product Editor, Maker Photography & Stories or Media Studio. Review image/video quality, intrinsic pixel dimensions, displayed size/crop/orientation, expected principal image, factual caption and alternative description. Source records contain no verified width/height measurement; do not fill in imaginary dimensions.
4. For public candidates, inspect current project privacy/rights, actual owner/person/customer releases, exact consent URL, allowed destination and expiry. A database status is not sufficient proof of a signed or legally appropriate release. Internal therapeutic work can remain private with no requirement to approve public use. For video, verify actual captions/subtitles or a transcript; a storyboard caption alone does not meet that need.
5. Use real devices to tab through the page and originating media modules, verify labels/focus, zoom/reflow at 200%, readable contrast, reduced-motion preference and touch target/scroll behavior. The screen's eight checklist ticks are temporary and reset after every source refresh; they do **not** save, certify or authorize anything.
6. Create a new immutable Maker Story revision for factual/caption/source corrections. Record genuine observations as a separate Build 456 Owner Maker Trials `media_rights` or `privacy_control` checkpoint, choosing the relevant real `media_story` or `event` source. Use **HOLD** when evidence, dimensions, consent or testing is absent. Editorial `approved_candidate` is still not a live publication. Publication, product safety, Canada-only shipping, Etsy and customer approval remain separate gates.

## Technical regression

```text
node --check public/js/maker-media-acceptance-policy-460.mjs
node --check public/js/admin-maker-media-acceptance-460.js
node --check public/js/admin-maker-workbench-457.js
node --test scripts/release467_build460_maker_media_accessibility.test.mjs scripts/release467_build457_maker_workbench.test.mjs
python scripts/current_application_quality_gate.py
```

Synthetic tests prove conservative HOLD behavior for absent media stories, mismatched/expired consents, private R2 sources, videos, text gaps, responsive/focus/semantic UI, no client writes/storage and exact Workbench routing. These tests are **not** real maker photo or owner accessibility acceptance. Build 460 technical GREEN requires all CI, dev Preview, exact-tree protected `main` and independent Production resource integrity proof. A real signed owner walkthrough remains HOLD until our original photos and permission evidence are supplied and verified.

**Next proposed Build 461:** authenticated Etsy unpublished-draft owner acceptance and Meta manual-provider boundary. No Etsy/Meta write is permitted by this audit.
