# Devil n Dove Build 467 — Admin Shell, Standard/Purple Theme & Contextual ⓘ Help Audit

**Scope:** A small, additive, static Admin utility shell and accessible contextual Help for the Admin Dashboard and five active Maker screens. The original authentication, module routes, source APIs, historical migrations and safe-startup boundaries remain the authorities. [Admin Dashboard](/admin/), [Maker Workbench](/admin/maker-workbench/), [Owner Trials](/admin/maker-owner-trials/), [Pilot Closure](/admin/maker-pilot-closure/), [Real Trial Debrief](/admin/maker-trial-debrief/) and [Canadian Product Safety Review](/admin/maker-product-safety/).

## Operator use

1. Open any of the six supported private Admin screens. The supplementary toolbar offers Dashboard, Maker Workbench, Products, Inventory, Orders and Owner Trials links to their **original** modules; existing navigation remains intact.
2. Choose **Standard — current styling** (default) to keep the existing theme, or **Purple — plum, bronze and gold**. The selected appearance is a non-sensitive browser-only localStorage preference; if storage is blocked it still works in the current tab. No theme choice writes D1/R2, Product, Inventory, Accounting or Customer data.
3. Open the top **ⓘ Help** disclosure for the page's source authority and review boundary. Existing card disclosures remain visible. For cards without their own direct Help disclosure, a native keyboard-operable details Help is appended where structural content permits it.
4. The Admin home workspace cards remain direct, working links. Each gets a visible circled **ⓘ** and screen-reader help text without placing an invalid clickable button inside a link or changing its destination. User action still happens only in the original module.
5. Help and appearance can be navigated by keyboard, with 44 px controls, visible focus rings, contrast provisions, reduced-motion support, narrow-screen wrapping and forced-colour support.

## Safety and release boundaries

- Builds 398/368 lean Admin home remains intact, including all intentionally inert historical observer scripts. No new network, background API polling, D1 reads, payment/refund, provider action, inventory movement, product publication or schema migration.
- No automatic card-level save, Help-data telemetry, external library, paid theme service or customer profile storage.
- Existing default theme is named **Standard**. The additional **Purple** palette is explicitly selectable; it is not an automatic brand or storefront change.
- Keep Canada-first/CAD commerce, U.S. shipping suspension, private maker therapy, genuine owner/source approval, and free-tier constraints.
- A source-based technical check does **not** replace actual owner testing. **HOLD real browser acceptance:** verify the Dashboard, login, Maker/Products/Inventory navigation, desktop 1280+, laptop 1024, tablet 768, 390/360 mobile, keyboard/Tab/Enter/Space, actual contrast in Firefox and Chrome, browser zoom 200%, dark/forced-colours and persistence after sign-in/out. Capture screenshots of any remaining blank or unformatted Admin surface and do not mark it repaired without a real human review.
- Only these six Admin screens opt in for Build 467. Expansion to all legacy Admin modules, a live visual bug fix or back-end theme persistence requires a separately reviewed build.

## Quality gate

Run the following commands:

    node --check public/js/admin-shell-policy-467.mjs
    node --check public/js/admin-shell-467.js
    node --test scripts/release467_build467_admin_shell.test.mjs scripts/release467_build466_maker_real_debrief.test.mjs scripts/release467_build457_maker_workbench.test.mjs
    python scripts/current_application_quality_gate.py

Tests use synthetic fixtures, static routing and DOM-code invariants; none represent real owner/safety acceptance. The protected release still needs exact-source dev/main GitHub checks, Cloudflare Pages deployment and a subsequent independent live zero-D1 proof.
