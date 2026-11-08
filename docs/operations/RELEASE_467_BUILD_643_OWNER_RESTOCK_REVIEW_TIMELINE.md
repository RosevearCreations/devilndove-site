# Release 467 Build 643 — Owner Restock Review Notes & Outcome Timeline

## Operator workflow

1. Open **Admin → Products**; load the private owner restock plans saved by Build 641.
2. In **Owner Restock Review Notes**, choose an existing saved plan and click **Load recent 10 reviews**. No note is read automatically; earlier Build 641 status changes have no fabricated timeline.
3. Choose an explicit review outcome: physical count, supplier or workshop review needed; follow-up scheduled; no stock change recommended; or a *separate* controlled action recommended.
4. Write a factual 8–300 character note and click **Record private review note**. The server checks the active owner session, plan version and timeline version, commits one private D1 event, and reads it back.
5. Reopen the plan in Build 641 if the owner separately wants to update its due date/status. This note timeline **does not** change that plan or adjust inventory, sales commitments, supplier/purchase records, Etsy or Meta publication.
6. Browse the most recent 10 notes or deliberately click **Load earlier reviews**. Each plan retains a bounded 50-event history; when full, new writes are blocked rather than silently deleting history.

## Evidence and security

- Private D1 `app_settings` key `site.admin.owner_restock_plans.v641.{verified_user_id}.review.{saved_plan_id}`; no migration or new secrets. Generic settings GET/POST already exclude/reject the entire reserved `v641` prefix.
- Each event stores the server timestamp, original plan-version/status/due snapshot, review outcome and note. It is a factual owner follow-up, **not** a receipt, actual stock correction, supplier confirmation or proof that a restock happened.
- A generic admin audit receives only event ID, plan ID, outcome and version metadata. **The note text is deliberately excluded** from the generic audit viewer. Audit logging failures are reported after confirmed save without suggesting another write.
- The owner cannot access another admin's private plan or review events. Stale plan/timeline versions return HTTP 409, bad inputs return 400, missing/private authority fails closed; no automatic retry or network activity on initial screen load.
- No change to external readiness, environment policy, database migration or protected release gates.
- Runtime source budget measured at **18,593,149 bytes / 1,852 files** after this feature and I.T. clarification. The existing cap is narrowly reviewed from 18,580,000/1,850 to **18,610,000/1,854** (30,000 bytes/four slots), with per-file and inline-data limits unchanged; the protected budget gate still fails closed.

## Acceptance

`node --test scripts/release467_build643_owner_restock_review_timeline.test.mjs` verifies owner access, private storage, audit metadata redaction, no stock mutation, stale-version conflicts, bounded paging/capacity, explicit UI actions and I.T. predecessor clarity. Preserve Builds 641 and 642 regressions.

See [Build 643 I.T. prerequisite review](RELEASE_467_BUILD_643_IT_TRUTH_PREREQUISITE_REVIEW.md) for historical-versus-active gate classification and branch retention decisions.
