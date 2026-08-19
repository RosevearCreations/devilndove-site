# Build 274 Changed Files

## Creative Process lifecycle and inventory safety
- `functions/api/admin/creative-process.js` — Build 274 API; active/voided timeline state; active-only totals/evidence/material queues; audited inventory reversal helper; timeline edit, void/undo and corrected-usage actions.
- `public/js/admin-creative-process.js` — six-step lifecycle guide; concept-stage estimate guidance; timeline edit/remove UI; actual-use confirmation; planned→reviewed→posted material explanation; correct/undo controls; clearer media/evidence connection.
- `admin/creative-process/index.html` — Build 274 cache bump and clearer Creative Project Workflow naming/safety copy.
- `css/styles.css` — responsive lifecycle, correction/history, material-review and admin advanced-tool layouts.

## D1/schema
- `database_build274_creative_process_lifecycle_corrections.sql` — focused additive migration adding `entry_status`, `void_reason`, `voided_by`, `voided_at` and project/status index.
- `database_full_schema.sql` — current aggregate schema synchronized with Build 274 fields/index/ledger marker.
- `database_store_schema.sql` — store aggregate schema synchronized with Build 274 fields/index/ledger marker.
- `functions/api/_lib/fullSchemaRequirements.js` — regenerated from current full schema; schema build 274 and current FK/index/table requirements.
- `BUILD274_D1_VERIFICATION.sql` — read-only production verification, including Project 7 material/post history.

## Admin workflow consolidation
- `admin/index.html` — admin `noindex`; Media vs Creative workflow naming; Release & Go-Live Center; individual release stages moved into Advanced release tools rather than competing dashboard cards.

## Documentation authority
- `AI_HANDOFF.md`
- `PROJECT_STATUS_AND_ROADMAP.md`
- `MARKDOWN_INDEX.md`
- `AI_CONTEXT.md`
- `NEW_CHAT_STATUS.md`
- `DEVELOPMENT_ROADMAP.md`
- `KNOWN_GAPS_AND_RISKS.md`
- `CREATIVE_AUTOMATION_STUDIO.md`
- `docs/creative-asset-intelligence-platform/18_Operator_Workflow_Guide.md`
- `DATABASE_SCHEMA_REFERENCE.md`
- `RELEASE_NOTES.md`

The only mutable cross-project authorities remain `AI_HANDOFF.md` and `PROJECT_STATUS_AND_ROADMAP.md`. Compatibility and specialist documents defer to them.

## Regression evidence
- `scripts/build274_creative_process_lifecycle_test.mjs`
- `BUILD274_VALIDATION.md`
- `BUILD274_DEPLOY_CHECKLIST.md`
