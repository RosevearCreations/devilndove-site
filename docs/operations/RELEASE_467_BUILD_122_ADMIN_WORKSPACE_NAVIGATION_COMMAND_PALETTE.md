# Release 467 Build 122 — Admin Workspace Navigation & Command Palette

## Goal

Make movement across the Devil n Dove admin application faster and more consistent without adding another navigation database or saved user state.

## Verified starting point

Build 121 is externally closed and Production GREEN at SHA `31492144ecbd2f8c353426531ea301c70aedf8f3` / tree `078d5ba5c71ee160861e0a31bcca640bb89a3cdc`.

- System Gate `34709444214`
- Current Application Quality `34709444221`
- I.T. Admin Runtime `34709444258`
- Repository Branch Hygiene `34709444255`
- Production Pages Deploy `34709526481`
- Production Live Resource Integrity `34709571023`

## Design

The existing `data/admin-navigation-modules.json` remains the only current operational navigation manifest. Build 122 adds a client-only layer that renders the four business workspaces plus Admin Home, highlights the current workspace, and exposes a command palette through a visible Jump button and `Ctrl/Cmd+K`.

The command palette searches manifest workspace, section and tool labels. Arrow Up/Down changes selection, Enter opens, Escape closes, and dialog/listbox ARIA semantics preserve keyboard and assistive-technology usability. If the manifest read fails, the four workspace homes remain available as a bounded fallback.

The shared Admin auth/UI bootstrap loads the launcher on admin routes so older admin screens receive the same navigation without rewriting each page.

## Safety boundary

- Manifest access: GET-only.
- Local/session storage: none.
- Navigation/search history persistence: none.
- Preference persistence: none.
- Server persistence: none.
- Accounting posting or period close: none.
- Inventory, Creative or price mutation: none.
- Provider execution/publication: none.
- D1 business-data, R2 or binding mutation: none.
- Schema change: none.
- Canonical migrations remain exactly `0001`–`0004`.

## Closure rule

Build 122 remains a candidate in source. Its later exact-head Development and Production proofs are external evidence and must be ingested by Build 123 rather than self-recorded by Build 122.
