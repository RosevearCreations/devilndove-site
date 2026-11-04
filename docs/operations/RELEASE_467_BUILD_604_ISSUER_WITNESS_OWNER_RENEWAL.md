# Devil n Dove — Build 604: original issuer confirmations, witness disposition and owner renewal

## Exact original source and release boundary

Admin Channel Trials section 29 replays and compares the exact Build 603 source chain before recording new browser-local notes. The release preserves the QL-333 source-owned integration manifest and QL-334 Comms Hub navigation already in the current `dev` tree. These controls do not make an unauthenticated source trustworthy or grant an Etsy/Meta trial.

## Operator review

1. Recompute Admin Channel Trials sections 5–28, then open section 29. Select an unresolved exact case and exception. Confirm the channel, shop/account, Product/SKU and proposed trial action.
2. For **original issuer confirmation**, record only a reference to the claimed original receipt and original issuer, a separately checkable authority locator and matching document digest. Record the date of the request/reported response. `REPORTED_CONFIRMATION` remains explicitly unverified; a substituted issuer, duplicate receipt, conflicting digest or self-referential authority is flagged.
3. For **independent witness exception disposition**, record a distinct reviewer and witness identity, a separate checkable original authority and disposition receipt, contact/response times, and unresolved/escalated/disputed/reported-resolution state. Claimed closure, duplicate receipts and non-independent parties remain open until separately confirmed.
4. For **exact owner renewal**, retain the original signer and sign-off receipt, exact shop/Product/action and original expiry; record the new signed renewal receipt claim, renewal request/signature and expiration timestamps. Old-signoff reuse, rewritten original expiry, wrong scope and signer changes are flagged. Missing, expired, within-72-hour, future and not-yet-effective renewal states are informative only, never proof of authorization.
5. Explain remaining evidence gaps, set a follow-up due time, acknowledge HOLD and save locally. Prepare an **unsigned original-source handoff** for independent external authentication and a separately obtained exact owner decision.

## Verification and authority

- Build 604 deterministic tests validate issuer receipt substitutions, duplicated cross-case receipts, witness independence/disposition, exact owner renewal clock and scope, forged approval rejection, chronology, local-only runtime boundaries and exact deploy marker.
- Inherited Build 603 source replay remains mandatory on the browser entrypoint; the Build 604 pure review is separately tested without repeating the computationally expensive entire historical fixture chain.
- Protected `dev` gates require System Gate, Current Application Quality, I.T. Admin Runtime Proof and Branch Hygiene success on the exact head. Production Pages Deploy and the independent Cloudflare resource-integrity proof must pass for `main` code-production GREEN.

**Production GREEN applies to code and static resource integrity only.** Original issuer confirmation, independent witness closure, exact renewed owner signature, any Comms Hub external peer signer, provider reads/writes, OAuth, Etsy draft/image mutations, Meta publishing, unknown-outcome retries and D1 operations remain HOLD until separately authenticated and authorized.
