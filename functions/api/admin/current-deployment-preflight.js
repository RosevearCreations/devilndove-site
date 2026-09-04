// Release 467 Build 46 — current Deployment Preflight canonical migration projection.
// GET-only. Historical preflight diagnostics are reused read-only; schema authority is
// migrations/canonical + scripts/d1_migrate.py and is never repaired during a request.
import { getDb, jsonResponse, normalizeText } from '../_lib/adminAudit.js';
import { onRequestGet as getHistoricalDeploymentPreflight } from './_historicalDeploymentPreflight.js';

const RELEASE = 467;
const BUILD = 46;
const TITLE = 'Four-Camera Synchronization & Audio Alignment';
const AUTHORITY = 'current-development-authority.json';
const PRODUCTION = Object.freeze({
  release: 467,
  build: 32,
  state: 'PRODUCTION_GREEN',
  main_sha: '816490a9f36ffc2a730d8149549e5a2fbd609966',
  tree_sha: '2c1b4a3694779996e1bdb094be5e9e043834276e',
  pages_deploy_run: 33866964958,
});
const REQUIRED_DEVELOPMENT_PROOFS = Object.freeze([
  'System Gate',
  'Current Application Quality Proof',
  'I.T. Admin Runtime Proof',
  'Repository Branch Hygiene',
]);
const CANONICAL_MIGRATIONS = Object.freeze([
  '0001_release464_migration_authority.sql',
  '0002_release464_operational_acceptance.sql',
  '0003_release464_business_growth.sql',
  '0004_release465_storefront_quality.sql',
]);
const LEGACY_MIGRATION_CHECK_PREFIXES = Object.freeze([
  'schema_ledger_',
  'build171_',
  'build173_',
  'build174_',
  'build175_',
  'build176_',
]);
const LEGACY_MIGRATION_CHECK_CODES = new Set(['expected_schema_diff']);

const lc = (value) => normalizeText(value).toLowerCase();
const rows = (result) => Array.isArray(result?.results) ? result.results : [];

function statusSummary(checks) {
  const blockerCount = checks.filter((row) => row.status === 'fail').length;
  const warningCount = checks.filter((row) => row.status === 'warn').length;
  return {
    status: blockerCount ? 'blocked' : warningCount ? 'review' : 'ready',
    blocker_count: blockerCount,
    warning_count: warningCount,
    pass_count: checks.filter((row) => row.status === 'pass').length,
    check_count: checks.length,
  };
}

function currentCheck(status, code, label, detail, action = '', evidence = {}) {
  return { status, code, label, detail, action, evidence };
}

async function tableExists(db, tableName) {
  try {
    return Boolean(await db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name=? LIMIT 1").bind(tableName).first());
  } catch {
    return false;
  }
}

async function safeAll(db, sql) {
  try { return rows(await db.prepare(sql).all()); }
  catch { return []; }
}

async function canonicalMigrationTruth(db) {
  const nativeLedgerExists = await tableExists(db, 'd1_migrations');
  const proofTableExists = await tableExists(db, 'app_schema_migration_proofs');
  const nativeRows = nativeLedgerExists ? await safeAll(db, 'SELECT id, name, applied_at FROM d1_migrations ORDER BY id') : [];
  const proofRows = proofTableExists ? await safeAll(db, 'SELECT migration_name, migration_sha256, manifest_sha256, source_sha, environment, applied_at, verified_at FROM app_schema_migration_proofs ORDER BY schema_migration_proof_id') : [];
  const fkRows = await safeAll(db, 'PRAGMA foreign_key_check');
  const nativeNames = new Set(nativeRows.map((row) => normalizeText(row.name)));
  const proofNames = new Set(proofRows.map((row) => normalizeText(row.migration_name)));
  const migrations = CANONICAL_MIGRATIONS.map((file, index) => ({
    version: index + 1,
    file,
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
  return checks
    .filter((check) => {
      const code = normalizeText(check?.code);
      if (LEGACY_MIGRATION_CHECK_CODES.has(code)) return false;
      return !LEGACY_MIGRATION_CHECK_PREFIXES.some((prefix) => code.startsWith(prefix));
    })
    .map((check) => {
      if (check?.code === 'deployment_preflight_runs_missing') {
        return { ...check, action: 'Historical snapshot storage is unavailable. Do not create schema during a request; repair only through a new canonical migration when required.' };
      }
      if (check?.code === 'post_deploy_confirmations_missing') {
        return { ...check, action: 'Historical confirmation storage is unavailable. Do not repair schema from this page; use the canonical migration process when a real forward change is approved.' };
      }
      if (check?.code === 'core_tables_present' && check?.status === 'fail') {
        return { ...check, action: 'Fail closed. Add or apply the next canonical migration through scripts/d1_migrate.py; never replay historical build-numbered SQL.' };
      }
      return check;
    });
}

function canonicalChecks(truth, expectedSchema) {
  const missingNative = truth.migrations.filter((row) => !row.native_applied).map((row) => row.file);
  const missingProof = truth.migrations.filter((row) => !row.proof_recorded).map((row) => row.file);
  const schemaDrift = expectedSchema.filter((row) => row.status !== 'pass');
  return [
    currentCheck('pass', 'canonical_migration_authority', 'Canonical D1 migration authority', 'Forward schema authority is migrations/canonical/manifest.json with scripts/d1_migrate.py as the target-aware applicator.', 'Use Development first; Production only after exact Development acceptance.'),
    currentCheck(!truth.native_ledger_exists || missingNative.length ? 'fail' : 'pass', 'canonical_native_ledger', 'Canonical native D1 migration ledger', !truth.native_ledger_exists ? 'd1_migrations is not available.' : missingNative.length ? `Missing canonical native migration row(s): ${missingNative.join(', ')}.` : `All ${truth.expected_count} canonical migrations are recorded in d1_migrations.`, !truth.native_ledger_exists || missingNative.length ? 'Fail closed and run scripts/d1_migrate.py --target development --apply from approved source.' : '', { migrations: truth.migrations }),
    currentCheck(!truth.proof_table_exists || missingProof.length ? 'fail' : 'pass', 'canonical_checksum_proofs', 'Canonical migration checksum/source proofs', !truth.proof_table_exists ? 'app_schema_migration_proofs is not available.' : missingProof.length ? `Missing canonical proof row(s): ${missingProof.join(', ')}.` : `All ${truth.expected_count} canonical migrations have checksum/source proof rows.`, !truth.proof_table_exists || missingProof.length ? 'Fail closed and repair only through a new canonical migration or the approved migration applicator; never edit an applied migration.' : '', { migrations: truth.migrations }),
    currentCheck(truth.foreign_key_violations ? 'fail' : 'pass', 'canonical_foreign_keys', 'D1 foreign-key integrity', truth.foreign_key_violations ? `${truth.foreign_key_violations} foreign-key violation(s) were returned.` : 'PRAGMA foreign_key_check returned zero violations.', truth.foreign_key_violations ? 'Stop promotion and repair data/schema integrity before deployment.' : '', { rows: truth.foreign_key_rows }),
    currentCheck(schemaDrift.length ? 'warn' : 'pass', 'current_schema_visibility', 'Current expected application schema visibility', schemaDrift.length ? `${schemaDrift.length} application table/column group(s) need review.` : `${expectedSchema.length} current application schema groups are visible.`, schemaDrift.length ? 'Confirm the drift. If a forward schema change is required, add the next numbered canonical migration; never repair during this request.' : '', { tables: expectedSchema }),
    currentCheck('pass', 'runtime_schema_mutation_boundary', 'Request-time schema mutation boundary', 'This current Deployment Preflight endpoint is GET-only and has no schema repair capability.', ''),
  ];
}

function currentMigrationPlan() {
  return {
    canonical_authority: [
      'Treat migrations/canonical/manifest.json as the only forward D1 schema authority.',
      'Historical build-numbered migration files are provenance only and must not be replayed from Deployment Preflight.',
      'Never perform schema repair during an HTTP request; use only the approved canonical migration path.',
    ],
    development: [
      'Add a new monotonically numbered canonical migration only when a real forward schema change is required.',
      'Run scripts/d1_migrate.py --target development --apply.',
      'Verify d1_migrations, app_schema_migration_proofs, checksums, source SHA and PRAGMA foreign_key_check.',
      'Require exact merged-Development System Gate, Current Application Quality, I.T. Admin Runtime and Branch Hygiene proofs.',
    ],
    production: [
      'Do not infer Production readiness from Development alone.',
      'Promote only when explicitly authorized, using the exact fully-green Development tree.',
      'Apply the same immutable canonical migration stream to Production before dependent code when a schema change exists.',
      'Rollback readiness remains release-neutral and read-only; it does not reverse schema automatically.',
    ],
  };
}

function markdownReport(data) {
  const lines = [
    `# Release ${RELEASE} Build ${BUILD} Deployment Preflight`, '',
    `Generated: ${data.generated_at}`, '',
    '## Current authority', '',
    `- State: ${data.state}`,
    `- Status: ${data.summary?.status || 'unknown'}`,
    `- Canonical migrations: ${data.canonical_migration_truth?.native_applied_count || 0}/${data.canonical_migration_truth?.expected_count || 0}`,
    `- Canonical proof rows: ${data.canonical_migration_truth?.proof_recorded_count || 0}/${data.canonical_migration_truth?.expected_count || 0}`,
    `- Foreign-key violations: ${data.canonical_migration_truth?.foreign_key_violations || 0}`, '',
    '## Checklist', '',
  ];
  for (const check of data.checks || []) lines.push(`- **${check.status || 'unknown'}** — ${check.label || check.code}: ${normalizeText(check.detail)}`);
  lines.push('', '## Canonical migration plan', '');
  for (const [section, items] of Object.entries(data.migration_plan || {})) {
    lines.push(`### ${section.replace(/_/g, ' ')}`, '');
    for (const item of items || []) lines.push(`- ${item}`);
    lines.push('');
  }
  return `${lines.join('\n')}\n`;
}

export async function onRequestGet(context) {
  const baseUrl = new URL(context.request.url);
  const wantsMarkdown = lc(baseUrl.searchParams.get('format')) === 'markdown';
  baseUrl.searchParams.delete('format');
  const baseRequest = new Request(baseUrl.toString(), { method: 'GET', headers: context.request.headers });
  const baseResponse = await getHistoricalDeploymentPreflight({ ...context, request: baseRequest });
  if (!baseResponse.ok) return baseResponse;
  const base = await baseResponse.json().catch(() => null);
  if (!base?.ok) return jsonResponse({ ok: false, release: RELEASE, build: BUILD, error: 'Historical read-only preflight engine returned an invalid payload.' }, 503, { 'Cache-Control': 'no-store' });

  const db = getDb(context.env);
  if (!db) return jsonResponse({ ok: false, release: RELEASE, build: BUILD, error: 'Database binding is not configured.' }, 503, { 'Cache-Control': 'no-store' });

  const truth = await canonicalMigrationTruth(db);
  const expectedSchema = (Array.isArray(base.expected_schema) ? base.expected_schema : []).filter((row) => normalizeText(row.table) !== 'schema_migration_ledger');
  const checks = [...filterHistoricalChecks(base.checks || []), ...canonicalChecks(truth, expectedSchema)];
  const generated_at = new Date().toISOString();
  const data = {
    ...base,
    release: RELEASE,
    build: BUILD,
    title: TITLE,
    build_label: `Release ${RELEASE} Build ${BUILD}`,
    authority: AUTHORITY,
    state: 'CURRENT_READ_ONLY',
    generated_at,
    checks,
    summary: statusSummary(checks),
    ledger: null,
    expected_schema: expectedSchema,
    migration_plan: currentMigrationPlan(),
    canonical_migration_truth: truth,
    release_authority: {
      current_release: RELEASE,
      current_build: BUILD,
      required_development_proofs: REQUIRED_DEVELOPMENT_PROOFS,
      production: PRODUCTION,
      rollback_readiness: 'release-neutral-read-only',
      historical_feature_authority: 'release467-build37-deployment-preflight-canonical-migration.json',
    },
    truth_notes: [
      'The active Deployment Preflight is a current read-only Release 467 Build 46 projection.',
      'Release 467 Build 37 remains the historical feature authority that converged Deployment Preflight with canonical migration truth.',
      'The retained historical preflight engine supplies diagnostics only; it is not schema or release authority.',
      'Historical build-numbered SQL is provenance only. Forward D1 schema authority is migrations/canonical/manifest.json.',
      'Missing schema fails closed. No request-time schema creation or repair is available from this endpoint.',
      'Build 46 adds no canonical migration and no request-time DDL; the stream remains exactly 0001-0004.',
      'Build 45 Grey Hair Media Intelligence remains the private reviewed-input authority for Build 46.',
      'Build 46 reuses existing caip_capture_groups and caip_capture_tracks for exactly four private camera tracks plus at most one private dedicated audio track.',
      'A Build 46 synchronization group cannot become confirmed until every included non-anchor offset is explicitly reviewed and the exact-four-camera boundary passes.',
      'Build 46 does not process waveforms/media, select stories, generate scripts, publish content, mutate R2 or execute external providers.',
      'Build 47 owns AI story selection and edit planning and may consume only a confirmed Build 46 synchronization group.',
      'Builds 41-44 remain the historical Packaging safe-area, material intelligence, label composition and label production authorities.',
      'Build 40 Product Social Automation, Build 39 Product Numbering and Build 38 Accounting remain historical feature authorities with their zero-DDL boundaries intact.',
      'Production remains Build 32 until a deliberate exact-tree promotion is requested and independently proven.',
    ],
    safety: {
      mutation_capability: 'none',
      request_time_schema_mutation: false,
      d1_business_data_mutation: false,
      r2_mutation: false,
      provider_execution: false,
      provider_publication: false,
      cloudflare_access_mutation: false,
      main_mutation: false,
      production_mutation: false,
      rollback_execution: false,
      secret_values_emitted: false,
    },
  };

  if (wantsMarkdown) {
    return new Response(markdownReport(data), { status: 200, headers: { 'Content-Type': 'text/markdown; charset=utf-8', 'Cache-Control': 'no-store' } });
  }
  return jsonResponse(data, 200, { 'Cache-Control': 'no-store' });
}
