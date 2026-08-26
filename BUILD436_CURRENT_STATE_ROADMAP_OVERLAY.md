# Build 436 — Current Parity Roadmap Overlay

## Immediate objective

Validate the prepared Membership Build 395 rebuild execution boundary without mutating Production. Only after the Build 436 read-only/local gate is green may the exact Membership-specific token be requested.

## Ordered path

1. **Product numbers — complete/proven**
   - 45 Product identities aligned;
   - Product numbers 1084..1128;
   - sequence >=1129.

2. **Gift Card Build 384 — complete/proven**
   - dedicated backup;
   - lookup columns/indexes/lockout aligned;
   - business row boundaries preserved.

3. **Notification Build 403 — complete/proven**
   - full corrected scope aligned;
   - `notification_outbox` row boundary preserved;
   - independent postcheck PASS.

4. **Build 197 annotation index — complete/proven**
   - dedicated backup;
   - one canonical composite index applied;
   - `product_image_annotations` 70 -> 70;
   - independent postcheck PASS.

5. **Membership Build 434 — complete/proven**
   - exact three-row legacy shape;
   - bronze/silver/gold identity boundary;
   - inert preview;
   - authorization gate PASS (20/20).

6. **Membership Build 435 — complete/proven**
   - complete rows captured;
   - raw tier codes exact;
   - `name == display_title` for all three tiers;
   - source-row SHA-256 `5db4bfd5f948a33432834210fd232a1e4b222dd6400193d65c644b501ba92057`;
   - lossless canonical mapping gate PASS (20/20).

7. **Membership Build 436 rebuild authorization boundary — current**
   - run local 20-check SQL simulation;
   - rerun live complete-row proof;
   - prove zero unhandled indexes/triggers/FKs/collisions;
   - capture canonical-preview SHA-256;
   - prove IDs/required values/sequence compatible;
   - no backup;
   - no authorization inferred;
   - no Production mutation.

8. **Membership Build 395 Production rebuild — only after exact Build 436 token**
   - fresh full Production backup;
   - pre/post-backup fingerprint identity;
   - canonical shadow copy through explicit mappings;
   - in-batch assertions before swap;
   - atomic D1 file execution;
   - exact row/value/schema/constraint/sequence postchecks;
   - independent read-only postcheck.

9. **First fractional Inventory/Creative Project rebuild boundary**
   - read-only/inert evidence first;
   - identify exact INTEGER-vs-REAL drift families;
   - prove current fractional values and dependent rows;
   - no rebuild authorization inferred.

10. **Product/FK families**
    - fresh zero-orphan evidence immediately before each family;
    - separate backups and authorizations;
    - refuse any family with nonzero orphans.

11. **Accounting/default/nullability families**
    - family-specific compatibility proofs;
    - separate rollback boundaries;
    - no broad rebuild batch.

12. **Release closure**
    - rerun full semantic drift/parity;
    - preserve `search_query_terms`, `__sql_test`, and CAIP decisions;
    - browser/read-contract/provider fail-closed smoke;
    - consolidate handoff/roadmap;
    - Production promotion opens only when every approved gate is green.

## Current lock state

```text
Membership rebuild authorization              NOT RECEIVED
Fractional rebuild authorization              NOT RECEIVED
Product/FK authorization                      NOT RECEIVED
Accounting/default authorization              NOT RECEIVED
R2/provider mutation                          DISABLED
CAIP D1-only copy                             FORBIDDEN
Production promotion                          CLOSED
```
