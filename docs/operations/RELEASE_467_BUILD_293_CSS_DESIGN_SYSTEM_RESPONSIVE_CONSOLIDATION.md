# Release 467 Build 293 — CSS Design-System & Responsive Consolidation

Build 293 establishes a coherent CSS contract without attempting a risky one-shot rewrite of the entire historical stylesheet.

## Canonical design system

`css/design-system-v293.css` owns shared surface, text, muted text, border, focus, spacing, radius, control-height and breakpoint tokens. It is injected on every HTML surface after legacy page CSS so newer components can converge without editing every historical page.

`css/admin-design-system-v293.css` is injected only into Admin pages. It owns Admin surface/input/table/dropdown/modal/dense-table presentation and prevents light-surface/white-text collisions.

## Specificity and duplicate-rule reduction

Build 293 removes exact duplicate top-level rules from `styles.css` and reduces unnecessary `!important` usage in the responsive and Admin ergonomics compatibility layers.

Acceptance ceilings:

- `styles.css`: <= 190 `!important`
- `current-responsive.css`: <= 49
- `admin-ergonomics-v237.css`: <= 16
- Build 293 design-system files: zero `!important`
- exact duplicate top-level rules in `styles.css`: zero

This preserves compatibility while preventing the design system itself from becoming another repair layer.

## Regression contract

The Build 293 CSS budget verifies:

- core text/muted/focus contrast >= 4.5:1
- root/application horizontal clipping remains forbidden
- wide tables retain local overflow
- dropdown/menu and modal/dialog surfaces have canonical background/text/border treatment
- dense-table/card-mode presentation remains retained
- touch targets remain at least 44px
- shared and Admin design-system layers are injected through middleware

## Boundary

Build 293 is presentation-only. No schema, D1, R2, provider, payment, Inventory, Product or publication mutation is introduced.

After Production GREEN the queue remains open.

**Next: Build 294 — CAIP Workshop Follies & Maker Story Foundation.**
