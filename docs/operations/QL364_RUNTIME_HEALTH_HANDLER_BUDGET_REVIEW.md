# QL-364 — source-owned health GET runtime budget review

The protected System Gate measured the pre-change Build 628 development
runtime at **18,357,421 bytes across 1,834 files** (PASS at the then-current
18,361,000-byte / 1,834-file limit).

QL-364 adds **one 8,344-byte** source-owned health module in
`functions/api/_lib/ql364-source-health.mjs`. The resulting measured
development baseline is **18,365,765 bytes across 1,835 files**.

The reviewed cap is now **18,366,000 bytes / 1,835 files**, allowing only
235 bytes beyond the measured development source snapshot. The mainline
baseline also fits. No per-file JS/CSS/HTML cap, inline-data cap, scan root,
file-type inclusion, source review, authorization, deployment or security
check has been relaxed.

This is a tightly measured feature-size adjustment, not a waiver for a
failing CI gate. If the source footprint grows again it must be reviewed,
measured and approved independently.

The new health handler itself is inert without verified original-owner
authority, durable nonce claims, and independent source-signer custody.

## QL-365D final compatibility adjustment

The public held discovery manifest now identifies immutable, reviewed source
revision `1f0e220b0cf7aff2dfeb650c96304d96502ede54` (Build 630 protected
production promotion) instead of the QL-333 placeholder. This revision is
historical source provenance, not the self-referential SHA of the later commit
that publishes this manifest; the final deployed commit must be independently
read back and pinned for a future QL-363 contract.

The QL-364 handler additionally rejects an original GET whose actual HTTPS
request origin differs from the signed, approved source origin or whose claimed
origin contains credentials/noncanonical components. Synthetic source-signer
tests are not production-key enrollment. No private source-signer callback,
durable one-use claim, owner signature, QL-363 source-signed contract or genuine
private GET was provisioned; runtime stays `DISCONNECTED / HOLD`.
