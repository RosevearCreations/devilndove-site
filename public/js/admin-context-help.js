// Devil n Dove shared admin contextual-help framework.
// Forward enhancement: accessible, reusable help without API, D1, R2 or provider mutation.

const DD_CONTEXT_HELP_LIBRARY = Object.freeze({
  carousel: {
    title: 'Carousel',
    body: [
      'A carousel presents a sequence of approved slides or items in one visual area.',
      'Draft or paused slides do not become public until the owning workflow publishes them. Keep alt text descriptive and preserve the page’s existing H1.'
    ]
  },
  collection: {
    title: 'Collection',
    body: [
      'A Collection groups Products for storefront discovery without creating duplicate Product or Inventory records.',
      'Collections can be curated manually or driven by approved rules such as origin, category, type or sale channel.'
    ]
  },
  explicit_membership: {
    title: 'Explicit Product membership',
    body: [
      'Explicit membership is an exception layer on top of Collection rules.',
      'Use Included to pin a Product into a Collection and Excluded to keep a Product out when the normal rule would otherwise select it.'
    ]
  },
  collage: {
    title: 'Collage preset',
    body: [
      'A Collage preset is a reusable visual arrangement of already-approved public Product imagery.',
      'It controls presentation such as layout and item count; it does not copy Product, Inventory or image authority.'
    ]
  },
  caip_handoff: {
    title: 'CAIP → Content Studio handoff',
    body: [
      'A handoff packages references to reviewed CAIP evidence so Content Studio can prepare a story or publication package.',
      'The handoff is review-first: it does not copy private source media and it does not publish anything by itself.'
    ]
  },
  reviewed_evidence: {
    title: 'Eligible reviewed evidence',
    body: [
      'Only active evidence that has passed the required review state should be eligible for a Content Studio handoff.',
      'This keeps timecodes, transcript excerpts and story evidence traceable back to their approved source.'
    ]
  },
  prepared_package: {
    title: 'Prepared package',
    body: [
      'A prepared package is a reference-only working set for Content Studio.',
      'Preparing or refreshing the package should not duplicate private media, consume Inventory, or publish to a social or storefront channel.'
    ]
  },
  tool_lifecycle: {
    title: 'Tool lifecycle',
    body: [
      'Tool lifecycle records the condition and service history of durable equipment: inspections, maintenance, repair, calibration, safety state, retirement and replacement planning.',
      'Lifecycle activity is not Inventory consumption and must not reduce Tool quantity.'
    ]
  },
  lifecycle_status: {
    title: 'Lifecycle status',
    body: [
      'Lifecycle status describes whether a durable Tool is active, under maintenance, out of service, retired or replaced.',
      'Condition describes physical state separately so a Tool can be tracked accurately without changing stock quantity.'
    ]
  },
  evidence_reference: {
    title: 'Evidence reference',
    body: [
      'An evidence reference points to the supporting record, document, image, service record or other proof used for a decision.',
      'Store a safe reference or identifier here, not passwords, API tokens, private keys or other secrets.'
    ]
  },
  product_contribution: {
    title: 'Product contribution',
    body: [
      'Product contribution shows where a Tool participates in Product creation or production history.',
      'It is provenance and planning information; it does not imply that the Tool itself was consumed.'
    ]
  },
  supply_sourcing: {
    title: 'Supply sourcing & replenishment',
    body: [
      'Supply sourcing compares real purchase options, pack pricing, lead times and replenishment targets for canonical Supply Inventory.',
      'Recommendations are advisory only. This workspace cannot place an order or change on-hand quantity.'
    ]
  },
  replenishment: {
    title: 'Replenishment target',
    body: [
      'A replenishment target helps decide when and how much Supply stock should be reviewed for purchase.',
      'It is a planning threshold, not an automatic purchase instruction and not a stock movement.'
    ]
  },
  substitution_review: {
    title: 'Substitution review',
    body: [
      'A substitution review records whether another material or source is an acceptable replacement when the preferred Supply is unavailable.',
      'Compatibility, quality, safety, cost and Product impact should be reviewed before a substitute is treated as approved.'
    ]
  },
  accounting: {
    title: 'Accounting workflow terms',
    body: [
      'General Ledger: the structured account record used to classify financial activity.',
      'Reconciliation: comparing internal records with an outside statement or source and resolving differences.',
      'Month lock: a control that prevents accidental changes to a period after its review or close.'
    ]
  },
  general_ledger: {
    title: 'General Ledger',
    body: ['The General Ledger is the central account-by-account record used to classify and summarize financial activity.']
  },
  reconciliation: {
    title: 'Reconciliation',
    body: ['Reconciliation compares Devil n Dove records with a bank, card, marketplace or other external statement and identifies differences that still need review.']
  },
  month_lock: {
    title: 'Month lock',
    body: ['A month lock protects a reviewed accounting period from accidental edits. Unlocking should be deliberate and leave appropriate evidence.']
  },
  it_platform: {
    title: 'I.T. & Platform',
    body: [
      'I.T. owns infrastructure, integration configuration references, release readiness and non-creator platform settings.',
      'Consuming modules still own their business workflows; secret values never belong in visible admin content or D1 reference metadata.'
    ]
  },
  d1_r2_readiness: {
    title: 'D1 / R2 readiness',
    body: [
      'D1 is the application database authority and R2 stores object media. Readiness checks should prove the Development bindings are reachable without changing rows or objects.',
      'A successful readiness probe is not permission to replay migrations or mutate Production.'
    ]
  },
  provider_configuration: {
    title: 'Provider configuration snapshot',
    body: [
      'Configured means the application has the expected safe reference or environment setup. Tested or accepted means a separate real provider test has produced evidence.',
      'Never treat configuration readiness as proof that Stripe, PayPal or another external transaction was accepted.'
    ]
  },
  integration_authority: {
    title: 'Integration authority',
    body: [
      'I.T. records provider/platform purpose, consuming module, environment, safe secret-reference names, callback/webhook locations, scopes and test state.',
      'Client secrets, access tokens, signing secrets, passwords and private keys must never be displayed or stored in these reference records.'
    ]
  },
  deferred_it_test: {
    title: 'Deferred I.T. test environment',
    body: [
      'Deferred I.T. acceptance work is intentionally non-blocking for unrelated Development features.',
      'It remains open until authenticated runtime, provider or private-media behavior has been tested with the required evidence; deferred does not mean passed.'
    ]
  }
});

const DD_CONTEXT_HELP_RULES = Object.freeze([
  { path: '/admin/home-carousel/', selector: '#carouselEditorHeading', help: 'carousel' },
  { path: '/admin/home-carousel/', selector: '#carouselContractHeading', help: 'carousel' },
  { path: '/admin/storefront-merchandising/', text: 'Collections', help: 'collection' },
  { path: '/admin/storefront-merchandising/', text: 'Explicit Product membership', help: 'explicit_membership' },
  { path: '/admin/storefront-merchandising/', text: 'Collage presets', help: 'collage' },
  { path: '/admin/caip-content-handoff/', text: 'CAIP → Content Studio', help: 'caip_handoff' },
  { path: '/admin/caip-content-handoff/', text: 'Eligible reviewed evidence', help: 'reviewed_evidence' },
  { path: '/admin/caip-content-handoff/', text: 'Prepared package', help: 'prepared_package' },
  { path: '/admin/tool-lifecycle/', text: 'Tool Lifecycle', help: 'tool_lifecycle' },
  { path: '/admin/tool-lifecycle/', labelControl: 'select[name="lifecycle_status"]', help: 'lifecycle_status' },
  { path: '/admin/tool-lifecycle/', text: 'Product contribution', help: 'product_contribution' },
  { path: '/admin/supply-sourcing/', text: 'Supply Sourcing & Replenishment', help: 'supply_sourcing' },
  { path: '/admin/supply-sourcing/', textIncludes: 'Replenishment', help: 'replenishment' },
  { path: '/admin/supply-sourcing/', textIncludes: 'Substitution', help: 'substitution_review' },
  { path: '/admin/accounting/', text: 'Quick accounting actions', help: 'accounting' },
  { path: '/admin/accounting/', text: 'General Ledger', help: 'general_ledger' },
  { path: '/admin/accounting/', textIncludes: 'Reconciliation', help: 'reconciliation' },
  { path: '/admin/accounting/', textIncludes: 'Month Lock', help: 'month_lock' },
  { path: '/admin/it-platform/', text: 'I.T. & Platform', help: 'it_platform' },
  { path: '/admin/it-platform/', selector: '#infraHeading', help: 'd1_r2_readiness' },
  { path: '/admin/it-platform/', selector: '#paymentsHeading', help: 'provider_configuration' },
  { path: '/admin/it-platform/', selector: '#integrationHeading', help: 'integration_authority' },
  { path: '/admin/it-platform/', selector: '#testHeading', help: 'deferred_it_test' }
]);

let openRecord = null;
let refreshQueued = false;

function normalizedPath() {
  let raw = String(window.location.pathname || '/');
  if (!raw.startsWith('/admin')) return raw;
  raw = raw.replace(/\/index\.html$/i, '/');
  return raw.endsWith('/') ? raw : `${raw}/`;
}

function slug(value) {
  return String(value || 'help').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'help';
}

function ensureStylesheet() {
  if (document.querySelector('link[data-dd-context-help-style]')) return;
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = '/css/admin-context-help.css?v=448-context-help';
  link.dataset.ddContextHelpStyle = 'true';
  document.head.appendChild(link);
}

function closeOpen({ restoreFocus = false } = {}) {
  if (!openRecord) return;
  const { trigger, panel } = openRecord;
  panel.hidden = true;
  trigger.setAttribute('aria-expanded', 'false');
  openRecord = null;
  if (restoreFocus && trigger.isConnected) trigger.focus();
}

function toggle(trigger, panel) {
  const opening = panel.hidden;
  if (openRecord && openRecord.trigger !== trigger) closeOpen();
  panel.hidden = !opening;
  trigger.setAttribute('aria-expanded', opening ? 'true' : 'false');
  openRecord = opening ? { trigger, panel } : null;
}

function createPanel(helpKey, definition, ordinal) {
  const token = `${slug(helpKey)}-${ordinal}`;
  const triggerId = `dd-context-help-trigger-${token}`;
  const panelId = `dd-context-help-panel-${token}`;
  const titleId = `dd-context-help-title-${token}`;

  document.getElementById(triggerId)?.remove();
  document.getElementById(panelId)?.remove();

  const trigger = document.createElement('button');
  trigger.type = 'button';
  trigger.className = 'dd-context-help-trigger';
  trigger.id = triggerId;
  trigger.textContent = 'ⓘ';
  trigger.setAttribute('aria-label', `Help: ${definition.title}`);
  trigger.setAttribute('aria-controls', panelId);
  trigger.setAttribute('aria-expanded', 'false');
  trigger.dataset.ddContextHelpTrigger = helpKey;

  const panel = document.createElement('aside');
  panel.className = 'dd-context-help-panel';
  panel.id = panelId;
  panel.hidden = true;
  panel.setAttribute('role', 'region');
  panel.setAttribute('aria-labelledby', titleId);
  panel.dataset.ddContextHelpPanel = helpKey;

  const header = document.createElement('div');
  header.className = 'dd-context-help-panel-head';
  const title = document.createElement('strong');
  title.id = titleId;
  title.textContent = definition.title;
  const close = document.createElement('button');
  close.type = 'button';
  close.className = 'dd-context-help-close';
  close.textContent = 'Close';
  close.setAttribute('aria-label', `Close help: ${definition.title}`);
  header.append(title, close);
  panel.appendChild(header);

  for (const paragraphText of definition.body || []) {
    const paragraph = document.createElement('p');
    paragraph.textContent = paragraphText;
    panel.appendChild(paragraph);
  }

  trigger.addEventListener('click', (event) => {
    event.stopPropagation();
    toggle(trigger, panel);
  });
  close.addEventListener('click', () => {
    if (openRecord?.trigger === trigger) closeOpen({ restoreFocus: true });
    else {
      panel.hidden = true;
      trigger.setAttribute('aria-expanded', 'false');
      trigger.focus();
    }
  });
  panel.addEventListener('click', (event) => event.stopPropagation());
  return { trigger, panel };
}

function targetForRule(rule) {
  if (rule.selector) return document.querySelector(rule.selector);
  if (rule.labelControl) return document.querySelector(rule.labelControl)?.closest('label') || null;
  const candidates = [...document.querySelectorAll('h1,h2,h3,h4,label,.small,strong')]
    .filter((el) => !el.dataset.ddContextHelpMounted);
  if (rule.text) return candidates.find((el) => String(el.textContent || '').trim() === rule.text) || null;
  if (rule.textIncludes) return candidates.find((el) => String(el.textContent || '').includes(rule.textIncludes)) || null;
  return null;
}

function mountHelp(target, helpKey, definition, ordinal) {
  if (!target || !definition || target.dataset.ddContextHelpMounted) return false;
  const { trigger, panel } = createPanel(helpKey, definition, ordinal);
  target.dataset.ddContextHelpMounted = helpKey;

  if (/^H[1-6]$/.test(target.tagName)) {
    target.append(' ', trigger);
    target.insertAdjacentElement('afterend', panel);
  } else if (target.tagName === 'LABEL') {
    const wrapper = document.createElement('div');
    wrapper.className = 'dd-context-help-field';
    target.insertAdjacentElement('beforebegin', wrapper);
    wrapper.append(target, trigger);
    wrapper.insertAdjacentElement('afterend', panel);
    panel.classList.add('dd-context-help-panel--field');
  } else {
    target.insertAdjacentElement('afterend', trigger);
    trigger.insertAdjacentElement('afterend', panel);
  }
  return true;
}

function mountDeclarative() {
  let ordinal = 1000;
  document.querySelectorAll('[data-context-help]').forEach((target) => {
    const helpKey = String(target.dataset.contextHelp || '').trim();
    if (!helpKey || target.dataset.ddContextHelpMounted) return;
    const base = DD_CONTEXT_HELP_LIBRARY[helpKey];
    const customText = String(target.dataset.contextHelpText || '').trim();
    const customTitle = String(target.dataset.contextHelpTitle || '').trim();
    const definition = base || (customText ? { title: customTitle || 'Help', body: [customText] } : null);
    if (definition) mountHelp(target, helpKey, definition, ordinal++);
  });
}

function refresh() {
  refreshQueued = false;
  if (!normalizedPath().startsWith('/admin/')) return;
  mountDeclarative();
  let ordinal = 0;
  for (const rule of DD_CONTEXT_HELP_RULES) {
    if (rule.path !== normalizedPath()) continue;
    const target = targetForRule(rule);
    const definition = DD_CONTEXT_HELP_LIBRARY[rule.help];
    if (target && definition) mountHelp(target, rule.help, definition, ordinal);
    ordinal += 1;
  }
}

function queueRefresh() {
  if (refreshQueued) return;
  refreshQueued = true;
  queueMicrotask(refresh);
}

function init() {
  if (!normalizedPath().startsWith('/admin/')) return;
  ensureStylesheet();
  refresh();
  const observer = new MutationObserver(queueRefresh);
  observer.observe(document.body, { childList: true, subtree: true });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && openRecord) closeOpen({ restoreFocus: true });
  });
  document.addEventListener('click', () => closeOpen());
}

window.DDContextHelp = Object.freeze({
  library: DD_CONTEXT_HELP_LIBRARY,
  refresh: queueRefresh
});

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
else init();
