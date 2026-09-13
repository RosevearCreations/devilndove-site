# Devil n Dove — Sanity Health Check

## Current release truth

Current candidate: **Release 467 Build 132 — Admin Navigation Context Dock & Responsive Collapse**.

Last fully verified Development + Production checkpoint is Build 131:

- SHA `ba0d027f299678479d1d28abd74ca85ea63c5efd`
- tree `057aa04505e4501516f87350556c3e13f89f986d`
- System Gate `34730852000`
- Current Application Quality `34730852014`
- I.T. Admin Runtime `34730851994`
- Repository Branch Hygiene `34730852019`
- Production Pages Deploy `34730958494`
- Production Live Resource Integrity `34731002747`

Result: **Build 131 six-proof closure is ingested by Build 132.**

## Build 132 checks

- Scope: Admin routes only.
- Existing Related tools, Section position and Section map remain the navigation-content authorities.
- Dock: one accessible responsive `details` region when two or more context components exist.
- Desktop: expanded by default.
- Small screens: compact by default at 760px and below.
- User toggle: ephemeral only; no localStorage/sessionStorage or server preference is added.
- Late context-card arrival: adopted client-side through events/DOM observation.
- Fewer than two components: fail closed and leave the existing cards untouched.
- No new navigation target or manifest.
- No write request is added.
- Canonical migrations remain exactly `0001`–`0004`.
- Existing commerce and external-acceptance boundaries are unchanged.

## Restart integrity

Build 132 remains a closure candidate until its exact `dev` head receives the required external proof. Its later proof must be ingested by Build 133, not self-written into Build 132.
