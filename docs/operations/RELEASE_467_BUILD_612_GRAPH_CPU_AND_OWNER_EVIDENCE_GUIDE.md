# Devil n Dove — Build 612: Source-Replay Graph Profiling, CPU Guardrails & Owner Evidence Completion Guide

## Why Build 612 exists

Build 611's [protected Current Application Quality run #42035371576](https://github.com/RosevearCreations/devilndove-site/actions/runs/42035371576) took **83 seconds**, of which the verified exact 14-suite source-replay batch took **5.87 seconds**. Before source-safe same-invocation reuse, the Build 610 batch took **133 seconds**. Further changes must be driven by measured performance rather than deleting tests or weakening the source chain.

Build 612 adds an auditable static dependency graph across the **eight source-replay stages (595–602)** and the import graph of **14 mandatory tests (595–608)**. It checks every source stage's prior function and same-invocation verified-result guard, checks the test import graph for cycles, and combines the exact files' measured elapsed times into a read-only CI artifact. It explicitly distinguishes **static source dependencies** and **wall-time/concurrency heuristics** from actual CPU sampling or provider authentication; it does not invent processor utilization or external approvals.

The existing Build 610 runner remains the single protected execution of all 14 evidence test files. It now uses `os.availableParallelism()` to reserve one execution slot when possible, while never exceeding the previous **3 worker** cap. The **240-second per-file** and **420-second batch** hard limits remain fail-closed. Concurrent oversubscription, missing source replay, forged/missing/duplicate test files, ungrounded timing, missing source scripts or altered hard limits fail the Build 612 profile. One-minute host load is reported as a **heuristic warning**, not claimed proof of individual process CPU usage.

Measured results are written to `artifacts/build612-source-graph-cpu-guard.json` and retained in the existing Quality artifact; no new per-push Actions workflow and no new runtime asset are added.

## The separate external authorization HOLDs: owner-completion process

The HOLDs in Channel Trials are deliberately **application-specific internal approval safeguards**, not a claim that Etsy or Meta automatically demands this particular paperwork. They must not be confused with deployment success or validated OAuth connection.

1. In **[Devil n Dove → Admin → Channel Trials](https://devilndove.com/admin/channel-trials/)**, refresh source sections **5–32**, including original provider exceptions and the Build 607 outcome, before refreshing section **33 (Build 608)**. Confirm the exact **channel, shop/account, product/SKU, action and still-open exception**; do not reuse another SKU's consent.
2. **Original issuer**: Obtain the response directly from the provider's *official* account, support correspondence, audit/API reference or provider portal. Keep the original response/receipt ID, timestamp, issuer/account identity and a SHA-256 digest of a preserved copy. Confirm the purported issuer via a trusted **separate official channel**, not only the receipt's own assertions or a screenshot. No access token or secret belongs in the evidence notes.
3. **Independent reviewer and witness**: Have a distinct authorized reviewer validate the provider's original reference and any conflicting chain/custody facts, and a distinct witness document the verification independently. Record real reviewer/witness names/roles, source references, what was checked, outcome and time. A self-confirmation by the same issuer or owner does not count as independent.
4. **Exact signed owner decision**: The authorized shop owner explicitly decides **approve or decline** a *particular account + product/SKU + action* (e.g. **create an Etsy draft, NOT publish**). Preserve dated signature, scope, expiration if applicable, original signed receipt/file reference and separate witness. Do not infer consent from a general conversation, a deployment request, an old expired sign-off or a draft request.
5. Document **all conflicting or unresolved items, response due date and next reviewer** in the Channel Trials section 33 fields. Confirm the unverified-only acknowledgement and export the **unsigned evidence handoff** for secure independent review. Keep original files and personal signatures in an access-controlled evidence store; Channel Trials currently keeps *browser-local notes*, not an authenticated evidence vault.

### What is possible today versus the missing technical step

Builds 595–608 validate **structure, source continuity, local SHA-256 comparisons, scope, expiry and conflicting witness references**. They deliberately set provider/issuer authentication, independent conflict closure and owner authorization outputs to **false/zero**. Therefore **typing plausible evidence into Channel Trials does not release the HOLD**. The present Admin workflow cannot itself prove original provider identity, verify a real signature, validate independent witness authority or authorize an Etsy/Meta API call.

Completing those HOLDs requires a **separately reviewed product build** implementing trusted provider-side receipt readback or human-reviewed original proof, independently authenticated witness attestation, exact signed owner authorization, a protected append-only decision/consent register, expiry/revocation and a tested authorization boundary. The owner must knowingly authorize each permitted provider action; never automatically promote a claimed or locally entered proof. Until then all provider publishing, Etsy/Meta trial operations and sensitive production database actions stay **HOLD**.

**Suggested next Build 613:** Trusted External Issuer Evidence Intake, Independent Witness Authentication & Scoped Owner Consent Decision Workbench (review-first, with real human approval and no automatic provider writes).

## Promotion acceptance

Keep four exact-head Development proofs (System Gate/Preview, Current Application Quality, I.T. Admin Runtime, Repository Branch Hygiene), the original Build 609 historical bundle, Build 610 timing/queue telemetry, Build 611 fixture tamper tests, and 14 original source suites. Enforce the unchanged application performance budget. After green protected `dev`, merge only the same tree to `main`, check the Build **612** `release-version.json` on the custom domain and Cloudflare production smoke, and require the separately triggered Live Resource Integrity proof with zero-D1 reads/mutations. QL-336 and PR #377 must not be overwritten or misrepresented as approved.
