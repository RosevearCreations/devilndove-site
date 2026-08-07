# 05 — CAIP Governance, Rights, Privacy, and Consent

## Default rule

New CAIP raw project media is private and needs review unless the operator deliberately supplies stricter/verified states. Uploading a file proves possession of bytes; it does not prove copyright, consent, claim accuracy, or permission to publish.

## Build 241 states

### Privacy

- `private`
- `internal_review`
- `public_candidate`
- `public_approved`
- `blocked`

### Consent

- `not_applicable`
- `unknown`
- `internal_only`
- `public_allowed`
- `revoked`
- `blocked`

### Rights

- `needs_review`
- `internal_only`
- `public_allowed`
- `blocked`

`public_approved` privacy requires `public_allowed` rights and either `public_allowed` or `not_applicable` consent.

## Storage privacy

Raw media in `CAIP_PRIVATE_MEDIA_BUCKET` has no public URL. A secure-review grant is an authenticated, time/view-limited internal access mechanism; it does not change the object's public status.

## Immutable originals

A completed raw object cannot be deleted/overwritten through the Build 241 intake control. If a file becomes sensitive, revoked, or blocked, downstream selection/promotion is blocked and references may be archived/superseded according to policy; destructive raw-retention tooling requires a later explicit retention/legal design.

## Public promotion

A Build 241 promotion request:

1. requires a completed private CAIP asset;
2. rejects blocked/revoked media;
3. snapshots current privacy/consent/rights state;
4. starts `needs_review`;
5. creates **no public copy and no public URL**.

A future promotion executor must re-check current governance at execution time, not rely only on the older snapshot.

## Personal information minimization

Generated R2 paths use project/file IDs instead of names. Original filenames remain metadata and may still contain personal information; operators should avoid unnecessary personal data in filenames and evidence. Never place credentials, secret tokens, unnecessary customer details, or private health information into media metadata/evidence.
