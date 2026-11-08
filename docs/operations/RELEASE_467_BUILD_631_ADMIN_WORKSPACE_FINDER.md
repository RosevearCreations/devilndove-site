# Release 467 Build 631 — Admin Workspace Finder

## Purpose and scope

The existing Admin Home presented many destination cards without a fast way to locate a daily work area. Build 631 adds a lightweight, local-only finder above the existing operational workspace grid. It matches visible card titles and descriptions, including multi-word queries and case/accent-insensitive terms. It preserves the original order and links.

## Operator instructions

1. Open `/admin/` with an existing authorized Admin session.
2. Enter a destination, such as `Product`, `Maker` or `Finance`, in **Find a workspace**.
3. Activate a displayed card, or press **Enter** while a nonempty search is present to focus its first matching card, then press Enter again to navigate.
4. Press **Escape** or **Clear** to restore all cards. Press **/** from outside another text field to focus the finder.

The visible matching count is announced through an accessible status region. No-match queries show a plain-language hint. Search input and clear button have 44px minimum heights, labeled controls and explicit focus outlines; the existing responsive card grid and dark brand palette remain.

## Security and behavior limits

- The finder only filters already-rendered links inside `#ddBrandV3AdminWorkspaces` using their `hidden` property. It does not create destinations, alter entitlement checks or authorize Admin routes.
- No local/session storage, cookies, analytics events, automated API fetches, provider calls, database mutations or new credentials are introduced.
- The existing Seller snapshot remains an explicit, on-demand button operation with the same timeout and error path.
- Etsy, Meta and customer-facing actions are not activated.
- Keyboard `/` ignores modifiers, focused editable elements and contenteditable areas. Clearing a search never navigates.

## Performance budget review

The pre-change runtime baseline was approximately 18,412,517 bytes. After adding the UI and script, the measured runtime is 18,416,206 bytes, a net increase of 3,689 bytes. The sole budget change is `max_runtime_source_bytes`, from 18,413,000 to 18,417,000 (4,000-byte increase). The JS/CSS/HTML per-file caps, number-of-runtime-files cap, inline-data cap, and fail-closed gate are retained. This change is explicitly reviewed because the performance budget requires review for any cap increase.

## Verification

- `node --test scripts/release467_build631_admin_workspace_finder.test.mjs` — static semantics, filtering/clearing, keyboard behavior and no-network checks.
- `node --check public/js/admin-home-on-demand-v398.js` — script syntax.
- `python3 scripts/release465_performance_budget_gate.py` — unchanged file and inline-data caps with bounded source-byte growth.
- `python3 scripts/current_application_quality_gate.py` and existing required checks through protected `dev`/`main` release workflows.
- `node scripts/release467_build556_admin_interface_inventory.mjs --check` — the reviewed Admin Home source-byte count is regenerated in the existing 152-route inventory; route decisions and owner visual-acceptance statuses remain unchanged.

Admin UI browser acceptance and actual private business/provider actions are separate from passing static tests. The code does not claim they were performed.
