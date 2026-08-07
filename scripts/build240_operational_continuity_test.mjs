import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';

const root=path.resolve(path.dirname(new URL(import.meta.url).pathname),'..');
const read=(name)=>fs.readFileSync(path.join(root,name),'utf8');
const migration=read('database_build240_operational_evidence_continuity.sql');
assert(!/^\s*(BEGIN(?:\s+TRANSACTION)?|COMMIT|SAVEPOINT|RELEASE(?:\s+SAVEPOINT)?|ROLLBACK)\b/im.test(migration),'Build 240 migration contains explicit transaction control.');

const expectedTables=[
  'runtime_incidents','operational_workstreams','production_evidence_cases','production_evidence_events','operation_idempotency_claims',
  'packaging_inventory_reservations','packaging_inventory_reservation_lines','packaging_formula_source_links','packaging_release_locks',
  'packaging_prepress_checks','provider_result_reconciliations','notification_delivery_attempts','mobile_evidence_drafts',
  'deployed_asset_check_results','product_media_role_requirements','customer_support_interactions','accounting_close_checklist_items',
  'controlled_batch_approvals','local_seo_observation_snapshots','public_page_audit_results','route_fallback_policies','mobile_operations_cards'
];
for(const name of expectedTables)assert(migration.includes(`CREATE TABLE IF NOT EXISTS ${name}`),`Migration is missing ${name}.`);
for(const aggregate of ['database_schema.sql','database_full_schema.sql','database_store_schema.sql']){
  const db=new DatabaseSync(':memory:');
  db.exec(read(aggregate));
  db.exec(migration);db.exec(migration);
  for(const name of expectedTables)assert.equal(db.prepare("SELECT COUNT(*) n FROM sqlite_master WHERE type='table' AND name=?").get(name).n,1,`${aggregate} missing ${name}.`);
  assert.equal(db.prepare('SELECT COUNT(*) n FROM operational_workstreams WHERE is_active=1').get().n,21,`${aggregate} must retain Build 240 workstreams plus Build 241 CAIP.`);
  assert.equal(db.prepare("SELECT COUNT(*) n FROM public_page_audit_results WHERE build_label='Build 240'").get().n,36,`${aggregate} must retain 36 Build 240 public audits.`);
  assert.equal(db.prepare('SELECT COUNT(*) n FROM startup_readiness_items WHERE is_active=1').get().n,46,`${aggregate} must retain Build 240 gates plus Build 241 CAIP.`);
  assert.equal(db.prepare("SELECT COUNT(*) n FROM schema_migration_ledger WHERE migration_key='build240_operational_evidence_continuity'").get().n,1,`${aggregate} must retain one Build 240 ledger row.`);
}

const api=read('functions/api/admin/operational-continuity.js');
assert(!api.includes('CREATE TABLE'),'Operational API must not create schema at request time.');
assert(!read('functions/api/_lib/adminAudit.js').includes('CREATE TABLE IF NOT EXISTS runtime_incidents'),'Shared runtime incident capture must not create schema at request time.');
for(const action of ['update_workstream','create_evidence_case','append_evidence_event','claim_idempotency','create_packaging_reservation','change_packaging_reservation','save_formula_link','lock_packaging_version','save_prepress_check','save_provider_result','save_notification_attempt','save_mobile_draft','save_asset_check','generate_media_roles','save_support_interaction','seed_accounting_close','create_batch_approval','save_seo_observation','import_page_audits','verify_fallback'])assert(api.includes(`${action}:`),`Operational API is missing ${action}.`);
assert.equal((read('admin/operational-continuity/index.html').match(/<h1\b/gi)||[]).length,1,'Operational Continuity page must have exactly one H1.');
assert(read('admin/operational-continuity/index.html').includes('noindex,nofollow'),'Operational Continuity page must remain noindex.');
assert(read('public/js/admin-operational-continuity.js').includes('Static twenty-one-workstream fallback') || read('admin/operational-continuity/index.html').includes('Static twenty-one-workstream fallback'),'Operational UI must retain a static degraded fallback.');
assert(read('css/styles.css').includes('Build 240: Operational Continuity'),'Operational responsive CSS is missing.');

const startupApi=read('functions/api/admin/startup-readiness.js');
const start=startupApi.indexOf('const STARTUP_ITEMS = ')+22;
const end=startupApi.indexOf('\n];',start)+2;
const items=JSON.parse(startupApi.slice(start,end));
assert.equal(items.length,46,'Current Startup API must expose 46 gates.');
assert(items.some((item)=>item.key==='operational_continuity_evidence_center'),'Build 240 Startup gate is missing.');
assert(read('STARTUP_GO_LIVE_GUIDE.md').includes('This guide contains 46 gates.'),'Startup guide count is stale.');

const audit=JSON.parse(read('data/site/build240-public-page-audit.json'));
assert.equal(audit.summary.audited_pages,36,'Expected 36 public pages in Build 240 static audit.');
assert.equal(audit.summary.failed,0,'Build 240 public audit has failures.');
assert.equal(audit.summary.warnings,0,'Build 240 public audit has warnings.');
for(const row of audit.rows)assert.equal(row.h1_count,1,`${row.page_path} must have exactly one H1.`);
const assetAudit=JSON.parse(read('data/site/build240-asset-reference-audit.json'));
assert.equal(assetAudit.missing_count,0,'Build 240 asset-reference audit found missing assets.');

for(const token of ['AI_HANDOFF.md','PROJECT_STATUS_AND_ROADMAP.md','OPERATIONAL_CONTINUITY_BUILD240.md'])assert(fs.existsSync(path.join(root,token)),`${token} is missing.`);
console.log('Build 240 operational continuity, schema, Startup, fallback and public SEO checks: PASS');
