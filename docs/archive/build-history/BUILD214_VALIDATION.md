# Build 214 Validation — Flexible Creator Paths

## Purpose
Build 214 continues the project-first Creative Process Engine while preserving direct product and phone-capture workflows for products that do not have a Creative Project.

## Behaviour to verify
1. `/admin/creative-process/` can link several existing products to one project.
2. Unlink removes only the relationship; it does not delete or edit the product.
3. One linked product may be marked primary.
4. `Capture a new product for this project` opens `/admin/mobile-product/?creative_project_id=<id>`.
5. Phone capture preselects that project but still permits `No project — independent product`.
6. Opening `/admin/mobile-product/` without a query parameter defaults to an independent product.
7. Saving a phone-captured product with no selected project does not create a project link.
8. Direct `/admin/catalog/` product creation/editing continues unchanged.
9. Existing direct products can be linked later by Product ID.
10. No link action changes catalog facts, inventory, media, approval, Content Studio, CAIP, Release Board, or publishing state.

## Mobile checks
Test widths near 360, 390, 430, 768 and desktop. The optional project select, linked-product cards and action buttons must remain contained.
