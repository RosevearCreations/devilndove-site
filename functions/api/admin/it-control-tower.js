import { getAdminUserFromRequest, getDb, jsonResponse } from '../_lib/adminAudit.js';

const RELEASE = 467;
const BUILD = 1;
const EXPECTED = Object.freeze({
  pages_project: 'devilndove-site',
  development_d1_name: 'devilndove-dev',
  development_d1_id: 'dbc1615b-dcbe-4951-973b-b47c99c73bfa',
  product_r2: 'devilndove-toolshed-images-dev',
  caip_r2: 'devilndove-caip-media-dev',
  canonical_migrations: 4,
  application_modules: 5,
  minimum_tables: 583,
});

const SECRET_KEYS = Object.freeze([
  'STRIPE_PUBLISHABLE_KEY',
  'STRIPE_SECRET_KEY',
  'STRIPE_WEBHOOK_SECRET',
  'PAYPAL_CLIENT_ID',
  'PAYPAL_SECRET',
  'PAYPAL_WEBHOOK_ID',
]);

const rows = (value) => Array.isArray(value?.results) ? value.results : [];
const text = (value) => String(value ?? '').trim();
const integer = (value) => Number.isFinite(Number(value)) ? Math.trunc(Number(value)) : 0;
const json = (data, status = 200) => jsonResponse({ release: RELEASE, build: BUILD, ...data }, status, { 'Cache-Control': 'no-store' });

function state(level, code, label, detail, correction, href = '/admin/it/') {
  return { state: level, code, label, detail, correction, href };
}

async function safeFirst(db, sql, bindings = []) {
  try { return await db.prepare(sql).bind(...bindings).first(); }
  catch { return null; }
}

async function safeAll(db, sql, bindings = []) {
  try { return rows(await db.prepare(sql).bind(...bindings).all()); }
  catch { return []; }
}

function secretDescriptor(env, key) {
  const value = env?.[key];
  return {
    key,
    present: typeof value === 'string' && value.trim().length > 0,
    type: typeof value === 'string' && value.trim().length > 0 ? 'secret_reference_present' : 'missing',
    value_emitted: false,
  };
}

function shaFromEnv(env) {
  const candidates = [env?.CF_PAGES_COMMIT_SHA, env?.COMMIT_SHA, env?.GITHUB_SHA];
  return candidates.map(text).find((value) => /^[0-9a-f]{40}$/i.test(value)) || null;
}

function scoreSubsystems(subsystems) {
  const values = Object.values(subsystems);
  const points = values.reduce((sum, item) => sum + (item.state === 'green' ? 100 : item.state === 'amber' ? 50 : 0), 0);
  const score = values.length ? Math.round(points / values.length) : 0;
  const red = values.filter((item) => item.state === 'red').length;
  const amber = values.filter((item) => item.state === 'amber').length;
  const overall = red ? 'red' : amber ? 'amber' : 'green';
  return { score, overall, green: values.length - red - amber, amber, red, subsystem_count: values.length };
}

async function databaseAuthority(db) {
  if (!db) {
    return {
      state: 'red',
      metrics: {},
      findings: [state('red', 'd1_binding_missing', 'Development D1 binding missing', 'The DB binding is unavailable.', 'Restore the canonical Development DB binding before runtime work.', '/admin/deployment-preflight/')],
    };
  }
  const metrics = await safeFirst(db, `
    SELECT
      (SELECT COUNT(*) FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%') AS tables,
      (SELECT COUNT(*) FROM sqlite_master WHERE type='table' AND name='app_modules') AS app_modules_table,
      (SELECT COUNT(*) FROM app_modules) AS application_modules,
      (SELECT COUNT(*) FROM d1_migrations WHERE name IN ('0001_release464_migration_authority.sql','0002_release464_operational_acceptance.sql','0003_release464_business_growth.sql','0004_release465_storefront_quality.sql')) AS canonical_migrations,
      (SELECT COUNT(*) FROM app_schema_migration_proofs WHERE migration_name IN ('0001_release464_migration_authority.sql','0002_release464_operational_acceptance.sql','0003_release464_business_growth.sql','0004_release465_storefront_quality.sql') AND environment='development') AS migration_proofs
  `);
  const fkRows = await safeAll(db, 'PRAGMA foreign_key_check');
  const facts = {
    tables: integer(metrics?.tables),
    application_modules: integer(metrics?.application_modules),
    canonical_migrations: integer(metrics?.canonical_migrations),
    migration_proofs: integer(metrics?.migration_proofs),
    foreign_key_violations: fkRows.length,
  };
  const findings = [];
  if (facts.tables < EXPECTED.minimum_tables) findings.push(state('red', 'd1_table_count_drift', 'D1 table count drift', `${facts.tables} tables are visible; expected at least ${EXPECTED.minimum_tables}.`, 'Run canonical Development migration/readiness proof before continuing.', '/admin/deployment-preflight/'));
  if (facts.application_modules !== EXPECTED.application_modules) findings.push(state('red', 'module_authority_drift', 'Application module authority drift', `${facts.application_modules} modules are present; expected ${EXPECTED.application_modules}.`, 'Inspect Application Modules and restore the canonical module authority.', '/admin/application-modules/'));
  if (facts.canonical_migrations !== EXPECTED.canonical_migrations || facts.migration_proofs !== EXPECTED.canonical_migrations) findings.push(state('red', 'migration_proof_drift', 'Canonical migration proof drift', `${facts.canonical_migrations}/${EXPECTED.canonical_migrations} migrations and ${facts.migration_proofs}/${EXPECTED.canonical_migrations} proofs are present.`, 'Run the canonical D1 applicator/proof on Development.', '/admin/deployment-preflight/'));
  if (facts.foreign_key_violations) findings.push(state('red', 'foreign_key_violation', 'D1 foreign-key violations', `${facts.foreign_key_violations} foreign-key violation(s) were found.`, 'Stop release work and repair the Development relational integrity issue.', '/admin/application-sanity/'));
  if (!findings.length) findings.push(state('green', 'd1_canonical', 'Development D1 canonical', `${facts.tables} tables, ${facts.application_modules} modules, ${facts.canonical_migrations}/${EXPECTED.canonical_migrations} migrations, ${facts.migration_proofs}/${EXPECTED.canonical_migrations} proofs and no FK violations.`, 'No action required.'));
  return { state: findings.some((item) => item.state === 'red') ? 'red' : 'green', metrics: facts, findings };
}

async function externalAuthority(db) {
  if (!db) return { state: 'red', accepted: false, findings: [state('red', 'external_db_unavailable', 'External evidence unavailable', 'D1 is unavailable, so acceptance evidence cannot be read.', 'Restore Development D1 first.')] };
  const providerRows = await safeAll(db, `
    SELECT provider_key,
           SUM(CASE WHEN required_for_activation=1 THEN 1 ELSE 0 END) AS required_count,
           SUM(CASE WHEN required_for_activation=1 AND check_state='passed' THEN 1 ELSE 0 END) AS passed_count
    FROM it_provider_readiness_checks
    WHERE environment='development' AND provider_key IN ('stripe','paypal')
    GROUP BY provider_key
  `);
  const refunds = await safeAll(db, `
    SELECT LOWER(COALESCE(provider,'')) AS provider, COUNT(*) AS accepted_count
    FROM payment_refunds
    WHERE LOWER(COALESCE(provider_sync_status,''))='succeeded'
      AND provider_refund_id IS NOT NULL AND TRIM(provider_refund_id)<>''
      AND LOWER(COALESCE(refund_status,'')) IN ('submitted','succeeded')
    GROUP BY LOWER(COALESCE(provider,''))
  `);
  const byProvider = (provider) => {
    const ledger = providerRows.find((row) => text(row.provider_key) === provider) || {};
    const refund = refunds.find((row) => text(row.provider) === provider) || {};
    const required = integer(ledger.required_count);
    const passed = integer(ledger.passed_count);
    const synchronizedRefunds = integer(refund.accepted_count);
    return { required, passed, synchronized_refunds: synchronizedRefunds, accepted: required > 0 && passed === required && synchronizedRefunds > 0 };
  };
  const stripe = byProvider('stripe');
  const paypal = byProvider('paypal');
  const caipRows = await safeAll(db, `SELECT outcome,details_json FROM creative_asset_access_audit WHERE event_type='review_proxy_served' ORDER BY creative_asset_access_audit_id DESC LIMIT 50`);
  const caipAccepted = caipRows.some((row) => {
    if (text(row.outcome) !== 'served') return false;
    try {
      const details = JSON.parse(text(row.details_json) || '{}');
      return details.ranged_streaming === true && details.no_copy === true && details.no_cache === true;
    } catch { return false; }
  });
  const providerSelection = await safeFirst(db, `SELECT COUNT(*) AS selected FROM provider_setup_authorities WHERE provider_key IN ('etsy','pinterest','meta','tiktok','youtube','x') AND enabled=1`);
  const connectionCount = await safeFirst(db, `SELECT COUNT(*) AS connected FROM oauth_provider_connections WHERE provider_key IN ('etsy','pinterest','meta','tiktok','youtube','x') AND connection_status IN ('connected','refresh_required') AND remote_subject_id IS NOT NULL AND TRIM(remote_subject_id)<>''`);
  const securityCount = await safeFirst(db, `SELECT COUNT(*) AS security_events FROM oauth_security_events WHERE provider_key IN ('etsy','pinterest','meta','tiktok','youtube','x')`);
  const selected = integer(providerSelection?.selected);
  const connected = integer(connectionCount?.connected);
  const securityEvents = integer(securityCount?.security_events);
  const socialAccepted = selected > 0 && connected >= selected && securityEvents > 0;
  const accepted = caipAccepted && stripe.accepted && paypal.accepted && socialAccepted;
  const findings = [];
  findings.push(state(caipAccepted ? 'green' : 'amber', 'caip_external_evidence', 'CAIP private-media acceptance', caipAccepted ? 'Qualifying authenticated ranged-streaming evidence is present.' : 'Qualifying authenticated ranged-streaming evidence is still pending.', 'Run the controlled CAIP Development browser/range acceptance.', '/admin/release-control/external-commercial-readiness/'));
  findings.push(state(stripe.accepted ? 'green' : 'amber', 'stripe_external_evidence', 'Stripe Development acceptance', `${stripe.passed}/${stripe.required} readiness checks passed; ${stripe.synchronized_refunds} synchronized refund(s).`, 'Complete Stripe test checkout, signed webhook/replay and provider-synchronized refund.', '/admin/release-control/external-commercial-readiness/'));
  findings.push(state(paypal.accepted ? 'green' : 'amber', 'paypal_external_evidence', 'PayPal sandbox acceptance', `${paypal.passed}/${paypal.required} readiness checks passed; ${paypal.synchronized_refunds} synchronized refund(s).`, 'Complete PayPal sandbox approval/capture, verified webhook/replay and synchronized refund.', '/admin/release-control/external-commercial-readiness/'));
  findings.push(state(socialAccepted ? 'green' : 'amber', 'social_external_evidence', 'Social/OAuth controlled acceptance', `${selected} selected provider(s), ${connected} connected intended account(s), ${securityEvents} security event(s).`, 'Complete at least one controlled Development OAuth lifecycle with publication disabled.', '/admin/release-control/external-commercial-readiness/'));
  findings.push(state('amber', 'github_native_ruleset_external', 'Native GitHub ruleset', 'Repository-native branch protection remains an externally managed setting unless separately proven.', 'Apply/verify native GitHub rulesets for dev and main.', '/admin/release-control/'));
  return { state: accepted ? 'amber' : 'amber', accepted, stripe, paypal, caip_accepted: caipAccepted, social: { selected, connected, security_events: securityEvents, accepted: socialAccepted }, findings };
}

export async function onRequestGet({ request, env }) {
  const admin = await getAdminUserFromRequest(request, env);
  if (!admin) return json({ ok: false, error: 'Admin access required.' }, 401);
  const db = getDb(env);
  const database = await databaseAuthority(db);

  const secretReferences = SECRET_KEYS.map((key) => secretDescriptor(env, key));
  const secretReady = secretReferences.every((row) => row.present);
  const storagePresent = Boolean(env?.PRODUCT_MEDIA_BUCKET) && Boolean(env?.CAIP_PRIVATE_MEDIA_BUCKET);
  const dndEnvironment = text(env?.DND_ENVIRONMENT);
  const paypalEnvironment = text(env?.PAYPAL_ENV).toLowerCase();
  const executionMode = text(env?.PAYMENT_PROVIDER_EXECUTION_MODE);
  const mutationSwitch = text(env?.PAYMENT_PROVIDER_MUTATIONS_ENABLED);
  const runtimeSha = shaFromEnv(env);
  const host = (() => { try { return new URL(request.url).host; } catch { return ''; } })();

  const storage = {
    state: storagePresent ? 'amber' : 'red',
    findings: [storagePresent
      ? state('amber', 'r2_identity_control_plane_proof', 'Development R2 bindings present', 'Both required R2 bindings are present at runtime. Exact bucket identity is intentionally not inferred from opaque binding objects and remains a System Gate/control-plane proof.', 'Use the canonical System Gate binding proof for exact bucket-name verification.', '/admin/deployment-preflight/')
      : state('red', 'r2_binding_missing', 'Development R2 binding missing', 'One or both required R2 bindings are unavailable.', 'Restore PRODUCT_MEDIA_BUCKET and CAIP_PRIVATE_MEDIA_BUCKET to the canonical Development buckets.', '/admin/deployment-preflight/')],
  };

  const configProblems = [];
  if (dndEnvironment !== 'development') configProblems.push(state('red', 'environment_not_development', 'Development environment marker drift', `DND_ENVIRONMENT is ${dndEnvironment ? 'set to a non-development value' : 'missing'}.`, 'Restore DND_ENVIRONMENT=development in Preview.', '/admin/it-integrations/'));
  if (!secretReady) configProblems.push(state('red', 'provider_secret_reference_missing', 'Provider secret reference missing', `${secretReferences.filter((row) => row.present).length}/${SECRET_KEYS.length} required Stripe/PayPal references are present.`, 'Restore the missing Preview secret reference; do not expose secret values.', '/admin/it-integrations/'));
  if (paypalEnvironment !== 'sandbox') configProblems.push(state('red', 'paypal_not_sandbox', 'PayPal sandbox boundary drift', 'PAYPAL_ENV is not explicitly sandbox.', 'Set PAYPAL_ENV=sandbox in Preview.', '/admin/it-integrations/'));
  if (executionMode !== 'development-explicit') configProblems.push(state('amber', 'provider_execution_switch_closed', 'Provider acceptance execution switch closed', 'The bounded Development provider execution mode is closed.', 'Open it only for deliberate Development provider acceptance, then close it again.', '/admin/release-control/external-commercial-readiness/'));
  if (mutationSwitch !== '1') configProblems.push(state('amber', 'provider_mutation_switch_closed', 'Provider acceptance mutation switch closed', 'The guarded Development refund mutation switch is closed.', 'Open it only during deliberate sandbox/test refund acceptance.', '/admin/release-control/external-commercial-readiness/'));
  if (!configProblems.length) configProblems.push(state('green', 'development_configuration_ready', 'Development provider configuration ready', 'Development marker, six secret references, PayPal sandbox boundary and bounded acceptance controls are present.', 'Close bounded execution controls immediately after external acceptance is complete.', '/admin/release-control/external-commercial-readiness/'));
  const configuration = { state: configProblems.some((item) => item.state === 'red') ? 'red' : configProblems.some((item) => item.state === 'amber') ? 'amber' : 'green', findings: configProblems };

  const ancestry = runtimeSha
    ? { state: 'green', runtime_source_sha: runtimeSha, deployment_host: host, exact_sha_available: true, findings: [state('green', 'runtime_exact_sha_available', 'Exact deployed source SHA available', `Runtime reports ${runtimeSha}.`, 'Cross-check this SHA against the canonical System Gate artifact before promotion.', '/admin/release-control/')] }
    : { state: 'amber', runtime_source_sha: null, deployment_host: host, exact_sha_available: false, findings: [state('amber', 'runtime_exact_sha_unavailable', 'Runtime exact-SHA evidence unavailable', 'This runtime does not expose a trusted 40-character commit SHA. Build 467 will not infer one from the hostname or release number.', 'Use the canonical System Gate exact-SHA deployment artifact for ancestry proof.', '/admin/release-control/')] };

  const external = await externalAuthority(db);
  const providerConfiguration = {
    state: secretReady && paypalEnvironment === 'sandbox' ? 'green' : 'red',
    secret_references: secretReferences,
    secret_values_emitted: false,
    findings: [secretReady && paypalEnvironment === 'sandbox'
      ? state('green', 'provider_references_ready', 'Stripe/PayPal references ready', 'All six provider references are present and PayPal is pinned to sandbox. No secret values are emitted.', 'Configuration is readiness only; complete real external acceptance evidence.', '/admin/release-control/external-commercial-readiness/')
      : state('red', 'provider_configuration_drift', 'Provider configuration incomplete', 'Required provider references or PayPal sandbox boundary are incomplete.', 'Repair Preview configuration before provider acceptance.', '/admin/it-integrations/')],
  };

  const subsystems = { database, storage, configuration, provider_configuration: providerConfiguration, external_acceptance: external, deployment_ancestry: ancestry };
  const readiness = scoreSubsystems(subsystems);
  const launchState = readiness.overall === 'green' && external.accepted ? 'READY_FOR_SEPARATE_PROMOTION_REVIEW' : 'HOLD_EXTERNAL_ACCEPTANCE';

  return json({
    ok: true,
    authority: 'release467-it-readiness-control-tower',
    environment: 'development',
    schema_change_required: false,
    request_time_schema_mutation: false,
    production_mutation: false,
    production_provider_execution: false,
    expected_authority: EXPECTED,
    readiness: { ...readiness, launch_state: launchState },
    subsystems,
    sanitized_configuration: {
      dnd_environment_is_development: dndEnvironment === 'development',
      paypal_environment_is_sandbox: paypalEnvironment === 'sandbox',
      payment_execution_switch_open: executionMode === 'development-explicit',
      payment_mutation_switch_open: mutationSwitch === '1',
      product_r2_binding_present: Boolean(env?.PRODUCT_MEDIA_BUCKET),
      caip_r2_binding_present: Boolean(env?.CAIP_PRIVATE_MEDIA_BUCKET),
      secret_references: secretReferences,
      secret_values_emitted: false,
    },
    drift_policy: 'Runtime binding presence is never promoted to exact control-plane identity. Exact D1/R2 names, Pages project and deployed SHA remain canonical System Gate/control-plane evidence.',
    generated_at: new Date().toISOString(),
  });
}
