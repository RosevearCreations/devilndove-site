# Release 467 Build 236 — Save Confidence, Unsaved-Work Protection & Safe Batch Review

Build 236 starts from exact Build 235 Development and Production GREEN evidence.

## Scope
- Shared Admin language is standardized to **Saved**, **Unsaved changes**, **Saving…**, **Save failed**, and **Stale data**.
- Eligible editing forms receive browser unsaved-change protection.
- Recovery remains explicit: the shared layer can focus the current form for review, but it never resubmits, retries, or calls a business API by itself.
- Existing workspaces may emit `dd:save-started`, `dd:save-succeeded`, `dd:save-failed`, and `dd:save-stale` events or call `DDAdminSaveConfidenceV236` to report authoritative outcomes.
- Safe batch review is opt-in only. A workspace must mark its existing item-level selection container with `data-dd-safe-batch-review="1"` and identify selected checkboxes with `data-item-id`. Build 236 summarizes the selection for review and executes no batch mutation.

## Safety boundary
No automatic Product publication, Inventory movement, Finance posting, provider action, automatic retry, D1/R2 business mutation, schema change, or request-time DDL is added.

## Evidence boundary
The Build 236 candidate may describe Build 235 as the exact verified predecessor, but it may not self-claim final Build 236 proof. Exact final Development proof is external and must precede promotion of the identical tree to protected `main`.
