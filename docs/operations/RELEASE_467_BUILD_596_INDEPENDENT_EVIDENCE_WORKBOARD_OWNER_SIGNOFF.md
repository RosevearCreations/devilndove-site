# Devil n Dove Build 596 — independent evidence review workboard and unsigned owner packet

## Owner procedure

1. Open **Admin → Channel Trials**. Recompute the source-pinned sections 5–20
   in sequence, then refresh section 21. Changed or missing upstream data fails
   closed rather than displaying an apparently verified historical queue.
2. Use the **All / Owner / Provider / Conflicts / Overdue / Duplicate digest**
   filters and search to triage source or custody exceptions. The priority labels
   are local review guidance, not provider authentication or risk acceptance.
3. Investigate reused SHA-256 document fingerprints against original issuer,
   account, response and custody evidence independently. Reused hashes are
   unresolved conflicts, even when two manually entered references match.
4. Select an exact case, record a proposed next action, independently assign a
   separate reviewer and witness, and a due date. The worksheet rejects
   reviewer/witness identity conflicts and keeps original source gaps open.
5. For an owner case, select **Prepare unsigned exact owner sign-off request**.
   Copy the source-pinned account/Product/SKU/action packet to the separately
   authorized owner decision process. The packet explicitly says unsigned,
   unapproved and NOT authenticated. Do not treat it as owner permission.
6. Copy the local review queue for independent follow-up. No UI button sends
   data to a provider, sends a message, or writes to a shared database.

## Scope and limitations

- Local browser inputs and document fingerprints cannot independently establish
  the true provider origin or validate a signed owner authorization. All
  provider trials, OAuth exchanges, unknown-outcome retries, Etsy drafts/images,
  Meta posts, D1/R2 mutations and exception closures remain **HOLD**.
- Production GREEN is only the static application release result. A real trial
  requires authenticated original provider evidence and a separately signed,
  exact account/Product/action owner authorization.
- The workboard is local to the current browser. Its copied JSON is an
  unresolved review packet, not a portable or authoritative approval record.

## Evidence

- `public/js/admin-channel-review-workboard-596.mjs`
- `scripts/release467_build596_review_workboard.test.mjs`
- `.github/workflows/current-application-quality.yml`
- `.github/workflows/production-pages-deploy-current.yml`
