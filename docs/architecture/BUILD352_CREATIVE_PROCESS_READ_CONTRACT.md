# Build 352 — Creative Process Read Contract

Build 352 formalizes the existing Creative Process GET as the Creative-owned `creative-process-read` contract at `/api/admin/contracts/creative-process-read`.

The contract is GET-only. It delegates to the retained Creative Process read implementation, reports `request_time_schema_mutation=false`, and explicitly reports `mutation_ownership_moved=false`.

The retained Creative Process compatibility GET is read-only. Existing POST actions remain on `/api/admin/creative-process`; reviewed inventory posting and reversal continue through Inventory-owned `inventory-post` and `inventory-reverse` authorities.

Build 352 therefore establishes read ownership without moving project-edit, timeline, CAIP/content handoff, profitability, or inventory-use mutation authority.
