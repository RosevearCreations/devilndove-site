# Release 467 Build 382 — Customer Requests, Quotes & Commission Lifecycle

**Operator:** https://devilndove.com/admin/commission-workbench/  
**Customer read:** authenticated-by-existing-private-link `/api/commission-progress?token=order_...` and the `commission_progress` field in the existing `/api/custom-request-order` response. These are private token-controlled only; never share publicly.

## Canonical authority model
- `custom_requests` continues to own customer inquiries, contact details and acceptance status; original Custom Requests Admin owns intake.
- `custom_request_quote_drafts`, `custom_request_quote_revisions`, `custom_request_quote_line_items`, quote-sharing flows and cost/margin guards remain the sole quote authorities. **Do not make parallel quote prices.**
- `custom_request_payment_request_drafts` remain deposit/payment *request drafts*; not proof of actual payment. Only existing checkout/payment/Finance sources may substantiate deposits.
- `custom_request_proof_versions` holds customer proof responses; only existing status `approved` is real customer approval. An internal review cannot forge it.
- `custom_request_job_drafts`, `creative_project_manufacturing_lifecycles` and `creative_work_projects` own job and production routing; this build merely records an operator's handoff decision after accepting the request or receiving approved proof.
- Migration `0034_release467_commission_customer_lifecycle.sql` installs `custom_request_commission_events`: immutable and request-linked internal review notes, source IDs, explicit customer-safe progress approval, unique idempotent request keys and hard SQL cross-request reference constraints.

## Public progress gates
Staff can approve a safe public stage/message **only if** there is an active existing token-protected order-status link for the same Custom Request. For production-in-progress/quality-review updates, linked source manufacturing work-order time/milestone or production cost evidence must exist. The public endpoint validates the existing private `order_` token and active link/real order, then responds solely with stage, reviewed message and approved time; it does not disclose private notes, money, customer identity or private media. The current private order-status response also includes this filtered `commission_progress` field.

## Workflow and acceptance
1. Review the real intake; record `intake_review` only with factual operator notes.
2. Create/update actual quote and revision drafts **in Custom Requests**. Link those IDs to `quote_review` and `revision_review` events. Customer approval of a quote or proof is not implied.
3. Prepare actual deposit request in the existing commerce authority; link a `deposit_request_review`. No claim of settlement.
4. For customer proof approvals, choose a truly approved `custom_request_proof_version_id`. For handoff, select the source job draft plus an accepted request or approved proof. Never change the actual manufacturing state from this workbench.
5. After the original order/status link exists, review a short customer-safe message and `progress_stage`; share only through that existing private order link.
6. Test two distinct requests: wrong quote/revision/deposit/job/project references must be rejected even with direct SQL. Verify duplicate submit and mutation/delete of event history fail; unapproved progress has no public output.

Read limits: last 100 requests, selected request's last 20 revisions, 20 payment drafts, 20 proof versions and 100 evidence events. The UI indicates incomplete history. No automatic customer messaging, payment, product listing, provider publication, stock posting or private CAIP-media release.

**Validation:** `python scripts/release467_build382_gate.py`, source-gate, quality, I.T. runtime, branch hygiene, Development-first D1 0034 migration/preview, exact tree promotion, Production D1 and Pages/live integrity. Preserve source-ledger history on rollback. **Next queued: Build 383 — Cross-Project Accounting, Revenue & Profitability.**
