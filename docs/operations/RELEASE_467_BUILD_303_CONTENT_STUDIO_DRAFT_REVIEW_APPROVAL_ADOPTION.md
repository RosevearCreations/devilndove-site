# Release 467 Build 303 — Content Studio Draft Review & Approval Adoption

Build 303 starts from exact Build 302 Development and Production GREEN.

The target remains real Creative Process project **7 — Under the Sea**. Build 302 selected three factual, text-only timeline evidence rows while preserving CAIP privacy and public-use separation.

Build 303 reuses the existing single Content Studio package. The first phase is **read-only Development discovery** of every existing factual-template deliverable, its copy, review status and lock state. No package is created, no copy is refreshed, no approval is written and no publication/social/provider action is allowed during discovery.

The existing Content Studio architecture is the authority:
- refresh is explicit only through `refresh_copy=1`;
- locked copy is preserved during refresh;
- deliverable approval is recorded separately from publication;
- package identity remains unique on the existing Creative Project source.

After the draft text is reviewed, only evidence-supported drafts may receive a human approval outcome. Drafts that still depend on unavailable or non-public media remain review-required. Build 304 remains the publication/social acceptance boundary.

Next after Build 303 Production GREEN: **Build 304 — Workshop Journal & Social Review-First Publication Acceptance**.

## Measured draft review

The exact Development discovery at `fe855929497d473c2dc68f4df4b94206f9ae4651` read 157 D1 rows and found one package (ID 22), 19 factual-template drafts, zero locked or approved drafts, zero CAIP/private media, and zero publication/social rows.

Human review found that the generated video/social/gallery/thumbnail/caption drafts either depend on reviewed public-use media that does not exist yet or use “result/reviewed” wording that is not supported by the current record. Those 17 drafts therefore receive `changes_requested`.

The two text-only drafts — `seo-assets` and `blog-article` — are corrected directly to the selected planning/material evidence, approved as **copy only**, and locked. Their approval does not approve media, public release, publication, or provider execution.
