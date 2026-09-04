// Release 467 Build 50 — current Deployment Preflight canonical migration projection.
// GET-only. Historical diagnostics are reused read-only; forward schema authority remains canonical.
import { getDb, jsonResponse, normalizeText } from '../_lib/adminAudit.js';
import { onRequestGet as getHistoricalDeploymentPreflight } from './_historicalDeploymentPreflight.js';

const RELEASE = 467;
const BUILD = 50;
const TITLE = 'Reviewed CAIP to Content Studio Handoff';
const AUTHORITY = 'current-development-authority.json';
const ACCEPTED_DEVELOPMENT = Object.freeze({
  release: 467, build: 50, title: TITLE,
  accepted_dev_sha: 'dddd7c9423132dd22b179348a5644362f7b9f46c',
  accepted_dev_tree_sha: '1d5d4859c55fae404a79eb8cef85e1e0d3f30826',
  system_gate_run: 33930359847,
  current_application_quality_run: 33930359835,
  it_admin_runtime_proof_run: 33930359865,
  branch_hygiene_run: 33930359956,
  exact_preview_deployment: true,
  role: 'IMPLEMENTATION_ACCEPTANCE',
});
const VERIFIED_DEVELOPMENT = Object.freeze({
  release: 467, build: 49, title: 'Current Authority Convergence & Restart Integrity',
  dev_sha: '28307cd8939329db05dab61c336d0c7a49f8759e',
  tree_sha: '0120c5ca4ccaabb00f3f4ef6f685ae0f8fabcaf7',
  system_gate_run: 33929301077,
  current_application_quality_run: 33929301018,
  it_admin_runtime_proof_run: 33929301051,
  branch_hygiene_run: 33929300999,
  proof_state: 'EXACT_BRANCH_HEAD_FOUR_PROOF_GREEN',
  exact_preview_deployment: true,
});
const PRODUCTION = Object.freeze({
  release: 467, build: 32, state: 'PRODUCTION_GREEN',
  main_sha: '816490a9f36ffc2a730d8149549e5a2fbd609966',
  tree_sha: '2c1b4a3694779996e1bdb094be5e9e043834276e',
  pages_deploy_run: 33866964958,
});
const REQUIRED_DEVELOPMENT_PROOFS = Object.freeze(['System Gate','Current Application Quality Proof','I.T. Admin Runtime Proof','Repository Branch Hygiene']);
const CANONICAL_MIGRATIONS = Object.freeze([
  '0001_release464_migration_authority.sql',
  '0002_release464_operational_acceptance.sql',
  '0003_release464_business_growth.sql',
  '0004_release465_storefront_quality.sql',
]);
const LEGACY_PREFIXES = Object.freeze(['schema_ledger_','build171_','build173_','build174_','build175_','build176_']);
const lc = (value) => normalizeText(value).toLowerCase();
const rows = (result) => Array.isArray(result?.results) ? result.results : [];
const currentCheck = (status, code, label, detail, action = '', evidence = {}) => ({ status, code, label, detail, action, evidence });

async function tableExists(db, name) {
  try { return Boolean(await db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name=? LIMIT 1").bind(name).first()); }
  catch { return false; }
}
async function safeAll(db, sql) {
  try { return rows(await db.prepare(sql).all()); }
  catch { return []; }
}
async function canonicalMigrationTruth(db) {
  const nativeLedgerExists = await tableExists(db, 'd1_migrations');
  const proofTableExists = await tableExists(db, 'app_schema_migration_proofs');
  const nativeRows = nativeLedgerExists ? await safeAll(db, 'SELECT id,name,applied_at FROM d1_migrations ORDER BY id') : [];
  const proofRows = proofTableExists ? await safeAll(db, 'SELECT migration_name,migration_sha256,manifest_sha256,source_sha,environment,applied_at,verified_at FROM app_schema_migration_proofs ORDER BY schema_migration_proof_id') : [];
  const fkRows = await safeAll(db, 'PRAGMA foreign_key_check');
  const nativeNames = new Set(nativeRows.map((row) => normalizeText(row.name)));
  const proofNames = new Set(proofRows.map((row) => normalizeText(row.migration_name)));
  const migrations = CANONICAL_MIGRATIONS.map((file, index) => ({
    version: index + 1, file,
    native_applied: nativeNames.has(file),
    proof_recorded: proofNames.has(file),
    native_row: nativeRows.find((row) => normalizeText(row.name) === file) || null,
    proof_row: proofRows.find((row) => normalizeText(row.migration_name) === file) || null,
  }));
  return {
    stream: 'devilndove-canonical-forward',
    manifest_path: 'migrations/canonical/manifest.json',
    applicator: 'scripts/d1_migrate.py',
    native_ledger: 'd1_migrations',
    proof_table: 'app_schema_migration_proofs',
    expected_count: CANONICAL_MIGRATIONS.length,
    native_ledger_exists: nativeLedgerExists,
    proof_table_exists: proofTableExists,
    migrations,
    native_applied_count: migrations.filter((row) => row.native_applied).length,
    proof_recorded_count: migrations.filter((row) => row.proof_recorded).length,
    foreign_key_violations: fkRows.length,
    foreign_key_rows: fkRows.slice(0, 20),
  };
}
function filterHistoricalChecks(checks = []) {
  return checks.filter((check) => {
    const code = normalizeText(check?.code);
    if (code === 'expected_schema_diff') return false;
    return !LEGACY_PREFIXES.some((prefix) => code.startsWith(prefix));
  }).map((check) => {
    if (check?.code === 'deployment_preflight_runs_missing' || check?.code === 'post_deploy_confirmations_missing') {
      return { ...check, action: 'Historical snapshot storage is unavailable. Keep this request read-only and use the canonical migration path only for a real forward change.' };
    }
    if (check?.code === 'core_tables_present' && check?.status === 'fail') {
      return { ...check, action: 'Fail closed. Use scripts/d1_migrate.py only after an approved forward migration exists.' };
    }
    return check;
  });
}
function canonicalChecks(truth, expectedSchema) {
  const missingNative = truth.migrations.filter((row) => !row.native_applied).map((row) => row.file);
  const missingProof = truth.migrations.filter((row) => !row.proof_recorded).map((row) => row.file);
  const schemaDrift = expectedSchema.filter((row) => row.status !== 'pass');
  return [
    currentCheck('pass','canonical_migration_authority','Canonical D1 migration authority','Forward schema authority is migrations/canonical/manifest.json with scripts/d1_migrate.py as the target-aware applicator.'),
    currentCheck(!truth.native_ledger_exists || missingNative.length ? 'fail' : 'pass','canonical_native_ledger','Canonical native D1 migration ledger',!truth.native_ledger_exists ? 'd1_migrations is unavailable.' : missingNative.length ? `Missing canonical native migration row(s): ${missingNative.join(', ')}.` : `All ${truth.expected_count} canonical migrations are recorded.`),
    currentCheck(!truth.proof_table_exists || missingProof.length ? 'fail' : 'pass','canonical_checksum_proofs','Canonical migration checksum/source proofs',!truth.proof_table_exists ? 'app_schema_migration_proofs is unavailable.' : missingProof.length ? `Missing canonical proof row(s): ${missingProof.join(', ')}.` : `All ${truth.expected_count} canonical migrations have proof rows.`),
    currentCheck(truth.foreign_key_violations ? 'fail' : 'pass','canonical_foreign_keys','D1 foreign-key integrity',truth.foreign_key_violations ? `${truth.foreign_key_violations} foreign-key violation(s) returned.` : 'PRAGMA foreign_key_check returned zero violations.','',{ rows: truth.foreign_key_rows }),
    currentCheck(schemaDrift.length ? 'warn' : 'pass','current_schema_visibility','Current expected application schema visibility',schemaDrift.length ? `${schemaDrift.length} application schema group(s) need review.` : `${expectedSchema.length} current application schema groups are visible.`),
    currentCheck('pass','runtime_schema_mutation_boundary','Request-time schema mutation boundary','This current Deployment Preflight endpoint is GET-only and has no schema repair capability.'),
    currentCheck('pass','restart_integrity_checkpoint','Restart integrity checkpoint',`Last fully verified Development is Build ${VERIFIED_DEVELOPMENT.build} at ${VERIFIED_DEVELOPMENT.dev_sha}; Build ${ACCEPTED_DEVELOPMENT.build} implementation acceptance is ${ACCEPTED_DEVELOPMENT.accepted_dev_sha}.`,'Verify the exact Build 50 closure merged dev head externally before it becomes the next restart checkpoint.',{ accepted: ACCEPTED_DEVELOPMENT, verified: VERIFIED_DEVELOPMENT }),
  ];
}
function statusSummary(checks) {
  const blockerCount = checks.filter((row) => row.status === 'fail').length;
  const warningCount = checks.filter((row) => row.status === 'warn').length;
  return { status: blockerCount ? 'blocked' : warningCount ? 'review' : 'ready', blocker_count: blockerCount, warning_count: warningCount, pass_count: checks.filter((row) => row.status === 'pass').length, check_count: checks.length };
}
function migrationPlan() {
  return {
    canonical_authority: ['Treat migrations/canonical/manifest.json as the only forward D1 schema authority.','Historical build-numbered SQL is provenance only.','Keep this endpoint read-only.'],
    development: ['Use scripts/d1_migrate.py --target development --apply only when a real forward migration is approved.','Verify d1_migrations, app_schema_migration_proofs and PRAGMA foreign_key_check.','Require the exact Development four-proof set.'],
    production: ['Production remains separate from Development acceptance.','Promote only an explicitly approved exact fully-green Development tree.','Apply immutable canonical migrations before dependent Production code when a future schema change exists.'],
  };
}
function markdownReport(data) {
  const lines = [`# Release ${RELEASE} Build ${BUILD} Deployment Preflight`,'',`Generated: ${data.generated_at}`,'',`- State: ${data.state}`,`- Status: ${data.summary?.status || 'unknown'}`,`- Accepted implementation: ${ACCEPTED_DEVELOPMENT.accepted_dev_sha}`,`- Last fully verified Development: ${VERIFIED_DEVELOPMENT.dev_sha}`,`- Canonical migrations: ${data.canonical_migration_truth?.native_applied_count || 0}/${CANONICAL_MIGRATIONS.length}`,'','## Checks'];
  for (const check of data.checks || []) lines.push(`- **${check.status}** — ${check.label}: ${normalizeText(check.detail)}`);
  return `${lines.join('\n')}\n`;
}

export async function onRequestGet(context) {
  const url = new URL(context.request.url);
  const wantsMarkdown = lc(url.searchParams.get('format')) === 'markdown';
  url.searchParams.delete('format');
  const historicalResponse = await getHistoricalDeploymentPreflight({ ...context, request: new Request(url.toString(), { method: 'GET', headers: context.request.headers }) });
  if (!historicalResponse.ok) return historicalResponse;
  const historical = await historicalResponse.json().catch(() => null);
  if (!historical?.ok) return jsonResponse({ ok: false, release: RELEASE, build: BUILD, error: 'Historical read-only preflight engine returned an invalid payload.' }, 503, { 'Cache-Control': 'no-store' });
  const db = getDb(context.env);
  if (!db) return jsonResponse({ ok: false, release: RELEASE, build: BUILD, error: 'Database binding is not configured.' }, 503, { 'Cache-Control': 'no-store' });
  const truth = await canonicalMigrationTruth(db);
  const expectedSchema = (Array.isArray(historical.expected_schema) ? historical.expected_schema : []).filter((row) => normalizeText(row.table) !== 'schema_migration_ledger');
  const checks = [...filterHistoricalChecks(historical.checks || []), ...canonicalChecks(truth, expectedSchema)];
  const data = {
    ...historical,
    ok: true,
    release: RELEASE,
    build: BUILD,
    title: TITLE,
    build_label: `Release ${RELEASE} Build ${BUILD}`,
    authority: AUTHORITY,
    state: 'CURRENT_READ_ONLY',
    generated_at: new Date().toISOString(),
    checks,
    summary: statusSummary(checks),
    ledger: null,
    expected_schema: expectedSchema,
    migration_plan: migrationPlan(),
    canonical_migration_truth: truth,
    release_authority: {
      current_release: RELEASE,
      current_build: BUILD,
      required_development_proofs: REQUIRED_DEVELOPMENT_PROOFS,
      accepted_development_checkpoint: ACCEPTED_DEVELOPMENT,
      verified_development_checkpoint: VERIFIED_DEVELOPMENT,
      restart_integrity_protocol: 'EXTERNAL_EXACT_BRANCH_HEAD_FOUR_PROOF_V1',
      implementation_acceptance_is_distinct_from_final_closure: true,
      closure_candidate_requires_external_exact_head_proof: true,
      production: PRODUCTION,
      rollback_readiness: 'release-neutral-read-only',
      historical_feature_authority: 'release467-build37-deployment-preflight-canonical-migration.json',
    },
    truth_notes: [
      'The active Deployment Preflight is the current read-only Release 467 Build 50 projection.',
      'Build 50 implementation acceptance is dddd7c9423132dd22b179348a5644362f7b9f46c / 1d5d4859c55fae404a79eb8cef85e1e0d3f30826 with System 33930359847, Quality 33930359835, I.T. 33930359865 and Hygiene 33930359956 successful plus exact Preview acceptance.',
      'Build 49 is the last fully verified restart checkpoint at 28307cd8939329db05dab61c336d0c7a49f8759e / 0120c5ca4ccaabb00f3f4ef6f685ae0f8fabcaf7 with System 33929301077, Quality 33929301018, I.T. 33929301051 and Hygiene 33929300999.',
      'Build 50 reuses the existing Content Studio authority and adds no canonical migration or request-time schema mutation.',
      'Rendering, provider execution, publication, social queueing, R2 mutation, main mutation and Production promotion remain closed.',
      'Build 32 remains the current Production baseline and external HOLD lanes remain separate.',
    ],
    safety: {
      mutation_capability: 'none',
      request_time_schema_mutation: false,
      d1_business_data_mutation: false,
      r2_mutation: false,
      provider_execution: false,
      provider_publication: false,
      main_mutation: false,
      production_mutation: false,
      secret_values_emitted: false,
    },
  };
  if (wantsMarkdown) return new Response(markdownReport(data), { status: 200, headers: { 'Content-Type': 'text/markdown; charset=utf-8', 'Cache-Control': 'no-store' } });
  return jsonResponse(data, 200, { 'Cache-Control': 'no-store' });
}
