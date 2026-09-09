# Release 467 Build 84 — Creators / CAIP Workflow

## Starting checkpoint

Build 84 starts from the fully promoted Build 83 Labeling & Packaging Studio checkpoint:

- `dev` = `main` = `79592977b449fe2eec917541a9df7b35083d311b`
- Build 83 exact-SHA checks: nine of nine successful
- Production Pages Deploy: GREEN
- Production Live Resource Integrity Proof: GREEN
- Canonical D1 migrations: `0001`–`0004`

## Purpose

Build 84 converges the existing Creator authorities into one selected-project journey without replacing them:

1. Creative Project
2. Evidence, rights & CAIP
3. Materials & Inventory evidence
4. Cost basis
5. Product bridge — optional; productless projects remain valid
6. Content Studio handoff
7. Social/channel assets — human-approved drafts only
8. Profitability

The existing seven-stage Creative Automation workflow remains the human review/audit authority. Build 84 is an additional read-only Release 467 projection that makes the roadmap sequence visible without creating a second set of business facts.

## Existing owners preserved

- Creative Process owns project facts, timeline, material review, cost assumptions and project profitability facts.
- Inventory owns actual stock consumption, corrections, posting and reversal.
- CAIP owns source-media references, evidence, rights/privacy review and private/raw media governance.
- Catalog/Product owns Product identity and mutation.
- Content Studio owns content packages, deliverables and channel drafts.
- Finance remains read intelligence for profitability/accounting context; accounting posting remains with Accounting.
- Build 85 owns selected-provider OAuth acceptance and provider/publication execution.

## Private/raw media boundary

Build 84 never deletes, overwrites, moves or auto-promotes private/raw CAIP media. A source file remaining internal is not a workflow failure. Only reviewed evidence references and governance facts are projected here.

## Productless projects

A Creative Project does not need a sellable Product. Education, research, archive, experiment, social-only and other content-only work may show the Product bridge as **Not applicable** while continuing through Content Studio and profitability review.

## D1/read-budget boundary

Build 84 adds one bounded selected-project GET projection at `/api/admin/creator-workflow?project_id=...`. It does not rescan the full Creator project collection. The browser waits for the existing Creative Automation selection and reloads only when the selected project changes or the operator explicitly chooses Refresh.

## No automatic execution

Build 84 performs none of the following:

- request-time schema DDL;
- D1/R2 mutation;
- raw-media deletion or public promotion;
- Inventory posting/reversal;
- Product mutation;
- Content Studio mutation;
- accounting posting;
- automatic relationship creation;
- OAuth/provider calls;
- publication or social queue execution.

## Verification contract

The Build 84 gate proves:

- the eight-stage pure projection and productless-project behavior;
- bounded GET-only D1 projection;
- no POST/write/provider/publication/raw-media lane;
- responsive Creator journey UI;
- preserved Creative Automation / private raw media documentation;
- canonical migrations remain exactly `0001`–`0004`;
- Build 83 remains GREEN through the carried regression contract;
- the current System Gate chains Build 84.

## Next planned work

**Build 85 — Socials & OAuth Acceptance**

Complete controlled selected-provider OAuth, intended-account/security evidence, draft publication queues and explicit human approval. Provider/publication execution remains fail-closed until that acceptance lane is deliberately proven.
