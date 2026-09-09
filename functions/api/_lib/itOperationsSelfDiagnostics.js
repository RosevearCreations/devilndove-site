// Release 467 Build 86 — pure I.T. Operations & Self-Diagnostics projection.
// This module derives operator status only. It never reads secrets, contacts providers,
// mutates D1/R2, applies migrations, changes bindings, deploys, restores, or repairs.

export const RELEASE467_BUILD86 = 86;
export const IT_DIAGNOSTIC_DOMAINS = Object.freeze([
  'deployment',
  'bindings',
  'schema',
  'runtime',
  'module_authority',
  'providers',
  'release_gates',
  'backup_recovery'
]);

const text = (value) => String(value == null ? '' : value).trim();
const num = (value) => Number.isFinite(Number(value)) ? Number(value) : 0;
const bool = (value) => value === true;
const item = (key, status, label, evidence = [], correction = []) => ({
  key,
  status,
  label,
  evidence: Array.isArray(evidence) ? evidence : [String(evidence || '')].filter(Boolean),
  correction: Array.isArray(correction) ? correction : [String(correction || '')].filter(Boolean)
});

function deploymentDomain(input) {
  const environment = text(input.environment).toLowerCase() === 'production' ? 'production' : 'development';
  const expectedBranch = environment === 'production' ? 'main' : 'dev';
  const branch = text(input.deployment?.branch);
  const sha = text(input.deployment?.sha);
  const project = text(input.deployment?.pages_project);
  const branchMatches = !branch || branch === expectedBranch;
  const projectMatches = !project || project === 'devilndove-site';
  const status = !branchMatches || !projectMatches ? 'blocked' : sha ? 'green' : 'review';
  return item(
    'deployment', status, 'Deployment identity',
    [
      `environment=${environment}`,
      `expected_branch=${expectedBranch}`,
      `observed_branch=${branch || 'unreported'}`,
      `commit_sha=${sha || 'unreported'}`,
      `pages_project=${project || 'unreported'}`
    ],
    status === 'green' ? [] : [
      branchMatches ? 'Expose the current Pages commit SHA/branch to the runtime diagnostic so the deployed source can be proven.' : `Redeploy the exact accepted ${expectedBranch} SHA to the matching Cloudflare Pages environment.`,
      projectMatches ? '' : 'Restore the canonical Cloudflare Pages project binding: devilndove-site.'
    ].filter(Boolean)
  );
}

function bindingsDomain(input) {
  const bindings = input.bindings || {};
  const missing = [];
  if (!bool(bindings.d1)) missing.push('D1');
  if (!bool(bindings.product_r2)) missing.push('Product R2');
  if (!bool(bindings.caip_r2)) missing.push('CAIP R2');
  return item(
    'bindings', missing.length ? 'blocked' : 'green', 'D1 / R2 bindings',
    [`d1=${bool(bindings.d1)}`, `product_r2=${bool(bindings.product_r2)}`, `caip_r2=${bool(bindings.caip_r2)}`],
    missing.length ? [`Restore the canonical ${missing.join(', ')} binding(s) for this environment, then rerun read-only health proof before any dependent operation.`] : []
  );
}

function schemaDomain(input) {
  const schema = input.schema || {};
  const expected = num(schema.expected_migrations || 4);
  const nativeRows = num(schema.native_rows);
  const proofRows = num(schema.proof_rows);
  const fk = num(schema.foreign_key_violations);
  const modules = num(schema.app_modules);
  const missing = [];
  if (nativeRows !== expected) missing.push(`migration ledger ${nativeRows}/${expected}`);
  if (proofRows < expected) missing.push(`migration proofs ${proofRows}/${expected}`);
  if (fk !== 0) missing.push(`${fk} foreign-key violation(s)`);
  if (modules !== 5) missing.push(`module authority ${modules}/5`);
  return item(
    'schema', missing.length ? 'blocked' : 'green', 'Canonical migration / schema integrity',
    [`migrations=${nativeRows}/${expected}`, `proofs=${proofRows}/${expected}`, `foreign_key_violations=${fk}`, `app_modules=${modules}/5`, 'request_time_schema_mutation=false'],
    missing.length ? [
      'Do not repair schema from an API request. Compare the canonical migration manifest and ledger, apply only the missing append-only migration through the migration workflow, then rerun schema and foreign-key proof.',
      `Current mismatch: ${missing.join('; ')}.`
    ] : []
  );
}

function runtimeDomain(input) {
  const runtime = input.runtime || {};
  const critical = num(runtime.open_critical);
  const errors = num(runtime.open_error);
  const total = num(runtime.open_count);
  const dbReachable = runtime.database_reachable !== false;
  let status = 'green';
  if (!dbReachable || critical > 0) status = 'blocked';
  else if (errors > 0 || total > 0) status = 'review';
  return item(
    'runtime', status, 'API / browser runtime incidents',
    [`database_reachable=${dbReachable}`, `open_incidents=${total}`, `critical=${critical}`, `errors=${errors}`],
    status === 'green' ? [] : [
      !dbReachable ? 'Verify the active environment D1 binding and account context before retrying the failing API.' : 'Open Runtime Incidents, reproduce the failing route/browser action, preserve the request/error evidence, then correct the bounded owner module and rerun the exact regression proof.'
    ]
  );
}

function moduleAuthorityDomain(input) {
  const authority = input.module_authority || {};
  const enabled = num(authority.enabled_modules);
  const total = num(authority.total_modules);
  const itAllowed = bool(authority.it_user_allowed);
  const itManage = text(authority.it_access_level).toLowerCase() === 'manage';
  const rootAdmin = bool(authority.root_admin);
  let status = 'green';
  if (total !== 5 || enabled !== 5 || !itAllowed || !itManage || !rootAdmin) status = 'blocked';
  return item(
    'module_authority', status, 'Module / root administrator authority',
    [`modules=${enabled}/${total || 5}`, `it_user_allowed=${itAllowed}`, `it_access_level=${text(authority.it_access_level) || 'none'}`, `root_admin=${rootAdmin}`],
    status === 'green' ? [] : [
      'Use the Application Modules recovery surface to restore explicit I.T. manage authority for an active root administrator. Never weaken I.T. route enforcement or rely on hidden navigation as security.',
      'After correction, rerun the root-admin permission matrix and I.T. Admin Runtime Proof.'
    ]
  );
}

function providersDomain(input) {
  const providers = input.providers || {};
  const stripe = providers.stripe || {};
  const paypal = providers.paypal || {};
  const social = providers.social_oauth || {};
  const evidence = [
    `stripe_configured=${bool(stripe.configured)}`,
    `stripe_webhook=${bool(stripe.webhook_configured)}`,
    `stripe_acceptance=${text(stripe.acceptance_state) || 'HOLD_EXTERNAL'}`,
    `paypal_configured=${bool(paypal.configured)}`,
    `paypal_webhook=${bool(paypal.webhook_configured)}`,
    `paypal_acceptance=${text(paypal.acceptance_state) || 'HOLD_EXTERNAL'}`,
    `social_encryption=${bool(social.encryption_configured)}`,
    `social_selected_provider=${text(social.selected_provider) || 'none'}`,
    `social_authorization_mode=${text(social.authorization_mode) || 'closed'}`,
    `provider_publication=false`
  ];
  const configuredForSelectedSocial = !text(social.selected_provider) || bool(social.encryption_configured);
  const status = configuredForSelectedSocial ? 'hold_external' : 'review';
  return item(
    'providers', status, 'Provider setup / controlled acceptance', evidence,
    status === 'review' ? ['Configure the server-side OAuth encryption authority before beginning any selected-provider Development acceptance. Never place secret values in diagnostics or source.'] : [
      'Stripe, PayPal and real Social OAuth remain separate controlled external-acceptance activities. Configuration booleans are not acceptance evidence and do not authorize provider execution or publication.'
    ]
  );
}

function releaseGatesDomain(input) {
  const gates = input.release_gates || {};
  const sourceGreen = bool(gates.system_gate) && bool(gates.quality) && bool(gates.it_runtime) && bool(gates.hygiene);
  const previewGreen = gates.preview === undefined ? false : bool(gates.preview);
  const status = sourceGreen && previewGreen ? 'green' : 'review';
  return item(
    'release_gates', status, 'Release gates / exact-SHA evidence',
    [
      `system_gate=${bool(gates.system_gate)}`,
      `quality=${bool(gates.quality)}`,
      `it_runtime=${bool(gates.it_runtime)}`,
      `hygiene=${bool(gates.hygiene)}`,
      `preview=${previewGreen}`,
      `exact_sha=${text(gates.exact_sha) || 'runtime-not-attested'}`
    ],
    status === 'green' ? [] : [
      'Before Production promotion, require the exact Development SHA to pass System Gate, Current Application Quality, I.T. Admin Runtime, Repository Branch Hygiene, canonical Development D1/bindings proof and exact Preview smoke acceptance.'
    ]
  );
}

function backupRecoveryDomain(input) {
  const recovery = input.backup_recovery || {};
  const guideAvailable = recovery.guide_available !== false;
  const rehearsal = bool(recovery.isolated_restore_rehearsed);
  const status = guideAvailable && rehearsal ? 'green' : guideAvailable ? 'review' : 'blocked';
  return item(
    'backup_recovery', status, 'Backup / rollback / recovery readiness',
    [`runbook_available=${guideAvailable}`, `isolated_restore_rehearsed=${rehearsal}`, 'automatic_business_data_restore=false', 'schema_rollback=false'],
    status === 'green' ? [] : [
      guideAvailable ? 'Rehearse an isolated D1 restore, verify representative Product/Inventory/Order/Packaging records, verify R2 object recovery/re-linking, and prove Pages rollback without touching live business data.' : 'Restore the Operational Continuity runbook before claiming recovery readiness.',
      'Record the rehearsal evidence; never automatically reverse schema or overwrite Production business data during rollback.'
    ]
  );
}

export function deriveItOperationsSelfDiagnostics(input = {}) {
  const domains = [
    deploymentDomain(input),
    bindingsDomain(input),
    schemaDomain(input),
    runtimeDomain(input),
    moduleAuthorityDomain(input),
    providersDomain(input),
    releaseGatesDomain(input),
    backupRecoveryDomain(input)
  ];
  const technical = domains.filter((entry) => !['providers', 'backup_recovery'].includes(entry.key));
  const blockers = technical.filter((entry) => entry.status === 'blocked');
  const reviews = technical.filter((entry) => entry.status === 'review');
  const overall = blockers.length ? 'blocked' : reviews.length ? 'review' : 'green';
  const externalHolds = domains.filter((entry) => entry.status === 'hold_external' || (entry.key === 'backup_recovery' && entry.status !== 'green'));
  return {
    release: 467,
    build: RELEASE467_BUILD86,
    authority: 'it_operations_self_diagnostics_v86',
    overall_status: overall,
    technical_blocker_count: blockers.length,
    technical_review_count: reviews.length,
    external_hold_count: externalHolds.length,
    domains,
    safety: {
      read_only_projection: true,
      secret_values_emitted: false,
      request_time_schema_mutation: false,
      d1_mutation: false,
      r2_mutation: false,
      binding_mutation: false,
      deployment_execution: false,
      backup_restore_execution: false,
      provider_execution: false,
      provider_publication: false,
      automatic_repair: false,
      production_business_data_overwrite: false
    }
  };
}
