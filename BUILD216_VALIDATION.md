# Build 216 Validation — Reviewed Inventory and CAIP Evidence

## Scope
- Explicit, idempotent project-material inventory posting after approval.
- Inventory movement audit trail and before/after quantities.
- Selected Creative Project evidence mirrored into CAIP as internal, `needs_review` evidence.
- Reusable project cost-template records.
- Responsive Creator workspace controls.

## Safety
- Loading the page performs no stock deduction.
- Saving a material review performs no stock deduction.
- Inventory posting requires an approved review, selected active inventory item, whole stock quantity, confirmation, sufficient on-hand stock, and no prior posting.
- CAIP evidence remains internal and review-required; it does not create public claims or publication approval.
- Products may remain independent of Creative Projects.

## Deployment tests
1. Open `/admin/creative-process/` and load a project with a material timeline entry.
2. Save the material as Pending and confirm the Post button is disabled.
3. Approve the material, select an inventory item, enter one stock unit, and post after confirmation.
4. Verify on-hand inventory decreases once and a `consume` movement appears.
5. Retry the same material and confirm duplicate posting is blocked.
6. Create a reviewed Content Studio handoff, select lesson/process evidence, then mirror to CAIP.
7. Verify CAIP evidence is `internal`, `source_record`, and `needs_review`.
8. Test at 360, 390, 430, 768 and desktop widths.
