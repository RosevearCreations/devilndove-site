# Devil n Dove — Release 467 Build 665 owner channel readiness guide

**Source:** `devilndove`, `RosevearCreations/devilndove-site`, an independently operated owned-business shell. AI Data Platform is the master monitoring plane; Rosevear Comms Hub is the master communications plane. Neither plane is authorized to assume Devil n Dove's original marketplace, customer, media, advertising, or financial authority.

**Scope of this release:** an auditable **local source-code readiness assessment**, not an external-provider connection, commercial launch, remote post, paid advertising activation, OAuth enrollment, or independently verified channel receipt. Run `node scripts/release467_build665_channel_readiness.mjs --check` to inspect the structured source audit in `RELEASE_467_BUILD_665_CHANNEL_READINESS.json`. A passing CI result proves only that the recorded HOLD boundaries match the local source controls.

| Channel | Original implementation available for review | Acceptance result |
| --- | --- | --- |
| Etsy | Original Admin Etsy OAuth acceptance and previous listing draft workflows | **PAUSED BY OWNER / HOLD**. Do not restart draft writes, shop authorization or publish without a separate decision. Historic acceptance is not a fresh provider receipt. |
| Meta Facebook Page and Instagram Business | Admin Meta readiness GET, one-provider OAuth acceptance, social queue and privacy guard | **HOLD**. Requires exact original Page/account ownership, issuer/witness/consent and a fresh independent provider-side result. No Graph post or upload. |
| Pinterest, X, TikTok, YouTube | Local social intent/preflight and/or review-first queue | **HOLD**. Draft/preflight and presence of keys are not authorization, API execution or a tested account binding. |
| Advertising, boosting and campaign spend | No accepted original paid-ad account/budget/charge mandate in this release | **NOT IMPLEMENTED / HOLD**. No ad creation, promotion, spend, budget allocation or payment credential transmission. |

## Existing screens and original source boundaries

- The [Social Publishing owner screen](/admin/social-publishing/) provides browser-only previews, local readiness/read-only OAuth acceptance, social queue and media privacy checks. A platform label or `api_ready` configuration field **cannot** establish a signed external provider receipt or current human publication approval.
- The existing `functions/api/_lib/socialPublishContracts.js` is local planning only and expressly does not contact any provider. The Meta readiness endpoint is GET-only. The social queue and privacy guard have their own older workflows; Build 665 does **not** silently replace, enable, or expand their existing write authority.
- Tracking pixels and consent to measurement are **not** consent to show customer likeness, filming, product/media rights, social posts, or advertisements. Private and therapeutic project content should remain private unless specifically released by its owners and any affected people.
- The Master Shell source manifest/handler remains a separate **DISCONNECTED/HOLD** handshake until original signer, approved audience, nonce/receipt replay and source-side verification are completed. A green deployed build or this JSON audit must not change that status.

## Owner-supervised acceptance, one provider at a time

1. **Choose and unpause one channel explicitly.** Etsy remains paused unless we specifically authorize reopening it. Do not activate every platform together.
2. Verify the original account/shop/Page or channel ID using the provider's own authenticated admin screen, with the legitimate owner present. Keep tokens, passwords and personal identifiers out of tickets, logs and chat.
3. Confirm the real account issuer, independent witness where required, allowed scopes, content/image rights, customer consent, account retention and intended audience. Record a private evidence reference and exact source/release revision, never a fabricated signed receipt.
4. Start with a local preview or an isolated provider sandbox if supported. Require the original reviewer to approve one specific draft and chosen destination. Do not perform a real post, listing write, broadcast or payment as part of this readiness build.
5. For paid advertising separately authorize the actual advertiser, business/payment account, maximum budget, placement, start/end, tax treatment, campaign owner and explicit spend switch. This release leaves the switch closed.
6. Independently compare the provider's resulting audit/receipt with the local original record, and have an authorized owner sign off. If anything is stale, ambiguous or missing, stay **HOLD**. Only then consider a separate executable release.

## Test and reporting vocabulary

`node --test scripts/release467_build665_channel_readiness.test.mjs` checks the local evidence map, paused Etsy, authorization refusal, Meta/media privacy, advertising budget denial, source path safety, and Master Shell truth. It makes no provider request and posts nothing.

- **Source code:** assessable and protected by CI; **not** an externally accepted provider account.
- **Provider connection:** HOLD, no fresh original provider receipt supplied here.
- **Advertising:** NOT IMPLEMENTED/HOLD, spend disabled.
- **Etsy:** PAUSED BY OWNER/HOLD.
- **Master Shell:** DISCONNECTED/HOLD, not secretly promoted to CONNECTED.
- **Production GREEN:** only means the release is deployed and its required checks succeeded, not that this external work has been approved.

**Next proposed Build 666:** AI Data Platform V1 Source Reporting, Evidence Freshness & Integration Receipts. Original shared contract, signer, audience, retention, version and replay acceptance remain owner-gated; a safe read-only build can proceed without inventing trust.
