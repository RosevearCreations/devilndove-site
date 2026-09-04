# Devil n Dove — Markdown / Authority Index

## Current authority — Release 467 Build 40

Build 40 — Product Social Automation Runtime-DDL Elimination & Baseline Schema Convergence is Development GREEN.

Accepted Build 40 implementation: `addcb5533d3a53465bb9d4ae8398952b8836ccc4` / tree `92b80e37385186343d20aae9c4453d9db3f94ca1`.
Implementation runs: System Gate `33887320361`, Current Application Quality `33887320336`, I.T. Admin Runtime Proof `33887320333`, Repository Branch Hygiene `33887320328` — all SUCCESS.

Accepted Build 40 authority closure: `110ee6b7766db28ed4b4439215e0d176d140edac` / tree `8fefdacb6d37c760e0ee2b0c9951dac57fa1115c`.
Closure runs: System Gate `33889320098`, Current Application Quality `33889320029`, I.T. Admin Runtime Proof `33889319976`, Repository Branch Hygiene `33889319809` — all SUCCESS.

Build 32 remains Production GREEN at `main` `816490a9f36ffc2a730d8149549e5a2fbd609966`, tree `2c1b4a3694779996e1bdb094be5e9e043834276e`, Production Pages Deploy `33866964958` SUCCESS.

Read current authority in this order:
1. `current-development-authority.json`
2. `release467-build40-product-social-automation-runtime-ddl-elimination.json`
3. `release467-build32-help-search-responsive-convergence.json`
4. `release467-build39-product-numbering-runtime-ddl-elimination.json` as historical Product Numbering feature authority
5. `release467-build38-accounting-core-runtime-ddl-elimination.json` as historical Accounting feature authority
6. `release467-build37-deployment-preflight-canonical-migration.json` as historical Deployment Preflight feature authority
7. `release467-build36-current-reliability-operational-health.json` as historical Reliability feature authority
8. `AI_HANDOFF.md`
9. `PROJECT_STATUS_AND_ROADMAP.md`
10. `SANITY_HEALTH_CHECK.md`
11. retained Build 35 and earlier authorities as historical evidence only.

Build 40 removes request-time DDL from Product Social Automation while preserving settings-row and review-first queue business writes. The proven `product_social_automation_settings` and `social_post_queue` baselines are asserted read-only before DML proceeds, and schema drift fails closed with `product_social_automation_schema_not_ready`.

Runtime schema residue is ratcheted to ceilings of 58 files / 522 DDL statements / 2 delegated or shared helpers with zero raw D1 bypasses carrying DDL. Build 38 Accounting and Build 39 Product Numbering also remain zero-DDL. Canonical migrations remain exactly `0001`–`0004`.

Current Application Quality guards Product Social, Product Numbering and Accounting schema authority together with Deployment Preflight, Reliability, I.T. truth, Production promotion provenance and the other current application quality boundaries. I.T., Deployment Preflight and Reliability are synchronized to Build 40 read-only current truth while their feature authorities remain explicit historical evidence. Deployment Preflight's current-build invariant is release-neutral and cannot lag Development.

After this documentation-only descendant is merged and independently passes push-triggered System Gate, Current Application Quality, I.T. Admin Runtime Proof and Repository Branch Hygiene, start **Build 41 — Unified Interface & Label Fit Foundation** from that exact `dev` head. Build 41 covers the first three approved roadmap items: cross-device interface acceptance at 360/390/768/1024/1280/1440+, responsive Packaging Studio composition, and hard printable-label safe-area boundaries.

Build 32 remains Production until a deliberate exact-tree Production promotion is explicitly requested and independently proven. External Stripe, PayPal, CAIP private-media, social OAuth and Cloudflare Access lanes remain HOLD absent fresh acceptance evidence.
