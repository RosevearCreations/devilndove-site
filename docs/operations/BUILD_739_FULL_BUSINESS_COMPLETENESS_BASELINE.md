# Devil n Dove — Full Business Capability Source of Truth (Build 739 reassessment)

**Audit date:** 2026-11-19. **Owner scope:** entire Devil n Dove retail, maker and support business, not only what is currently implemented in GitHub. **Previous Build738 baseline:** 26-axis equal-weighted implementation maturity 61.6%; this **was not a full business completion assessment**.

## Corrected 53-axis full-business completion baseline — estimated 41.0%

| Business capability pillar | Weight | Assessed completion | Key open operational proof |
|---|---:|---:|---|
| Customer & Storefront | 20% | 46.4% | customer purchase, mobile acceptance, product-interest analytics, customer review publication |
| Commerce & Finance | 22% | 34.6% | original processor capture/refund/chargeback, invoice+ledger+bank, payroll and Canadian taxes |
| Creator, CAIP & Inventory | 18% | 57.4% | real CAIP end-to-end workflow, workshop materials/tool receipt, video publication with rights |
| Local Sales & Fulfilment | 13% | 23.7% | standalone pickup slot, pop-up stand POS, inventory/cash close, events, rentals, location specials |
| Security, Support & I.T. | 19% | 43.2% | MFA, ASVS verification, incident/complaint SLA, actual host reboot, isolated restore, traffic/APM |
| Marketing & Integrations | 8% | 30.5% | original signed three-Master receivers, provider posting/tagging, consent-based campaigns |
| **Weighted overall** | **100%** | **41.0%** | **Source and test evidence is not operational acceptance.** |

This is a **judgemental planning estimate** with material uncertainty. It cannot be gamed by counting new files or increasing a percentage 5–10 points merely because another build number shipped. A consolidated build should aim for **5–10 percentage points in the actual targeted feature family** with original acceptance, not necessarily +5–10 across the entire company.

## Product scope that must be covered for 100%
1. **Robust security & response**: OWASP ASVS 5.0 control inventory, MFA/least privilege, encrypted and properly retained customer/media/payment records, rate/abuse protections, original signed audit, suspicious-traffic response, safe locked-out account help, backup isolated restore and witnessed host recovery.
2. **Online retail**: customer experience PC/tablet/mobile, discovery, saved cart, original payment, refunds and chargebacks, shipping/returns, pickup, product interests, customer complaints, consumer accessibility and actual customer acceptance.
3. **Real finance**: one immutable provider event through orders/invoices/refunds/general ledger/taxes/costs/analytics; no duplicate captures/refunds; signed provider and bank settlement verification.
4. **Maker/CAIP**: capture project photos/video and original rights, trace supply/tool usage, drafts, stories, review/approval, publish only consented content, relate to products/cost/suppliers, measure outcomes.
5. **Supplier Tools & Supplies review**: real received-for-review VEVOR.ca or other equipment, sample/receipt/custody, manufacturer vs supplier, workshop test/review, brand relationship disclosure, owned YouTube/Facebook/Instagram video card and moderated publication; no invented affiliations.
6. **Local commerce**: customer pickup appointments, standalone market/stand POS (card/cash/offline), event/rental self-service, location-specific inventory/prices/taxes, owner-configured remote specials and registered travel/market availability.
7. **Local application I.T. support**: complaint/repair queue, locks, performance, 5xx/uptime, traffic/real-user observations, alerts, fleet/device role control, service restart/reboot observations, incident timelines and measurable resolution.
8. **Three Masters + four product shells**: AI Data Platform, Comms Hub, AI Hub and Devil n Dove/Rosie/YW/iCamp read-only aggregate communication, independent signer enrollment, original receiver ACK and cross-app Sysop monitoring; no raw PII, arbitrary remote reboot or synthetic CONNECTED.

## Build 739 exact feature scope / limits
- Existing original verified Admin-only D1 / peer-config check extended as a **source-only three-Master independent-evidence review**, with physical source/receiver ownership and original host telemetry remaining HOLD until real receipts.
- Existing Vendor Review inventory record and `external_review_url` now supports click-to-load, strict HTTPS allowlist video cards inside the **Admin-only review panel**. CSP is minimally allowlisted for YouTube privacy enhanced, Instagram and Facebook. **Public product video widgets, provider tagging, sponsorship accounts and live publishing remain outstanding.**
- Build 739 is not a new D1 schema migration, external receiver installer, signed sender, payment engine, rental system, POS or automatic social advertising activation.

## Release and governance
Source changes proceed PR → exact green dev System/Quality/I.T./Hygiene and Preview → protected exact-tree main → Production Pages + independent live-resource proof + disabled Worker/cron. **Do not report Production GREEN before all succeed.** Store original main SHA/run IDs in the release record.

## Reference and owner operator action
- [Build 739 source PR](https://github.com/RosevearCreations/devilndove-site/pull/979)
- [Cross-repo original Sysop/three-Master issue](https://github.com/RosevearCreations/devilndove-site/issues/978)
- [Build 739 detailed source note](BUILD_739_ORIGINAL_PEER_AND_SUPPLIER_VIDEO_REVIEW.md)
- [VEVOR Canada](https://www.vevor.ca/)
- [OWASP ASVS](https://asvs.owasp.org/)
- [Canadian influencer disclosures](https://competition-bureau.canada.ca/en/deceptive-marketing-practices/types-deceptive-marketing-practices/influencer-marketing-and-competition-act)
