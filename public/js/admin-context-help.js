// Devil n Dove shared admin contextual-help framework.
// Current, release-neutral help. Explanatory only: no API, D1, R2 or provider mutation.

const DD_CONTEXT_HELP_LIBRARY = Object.freeze({
  carousel: { title: 'Carousel', body: ['A carousel presents approved slides or items in one visual area.', 'Draft or paused slides do not become public until the owning workflow publishes them. Keep alt text descriptive and preserve the page’s single primary heading.'] },
  collection: { title: 'Collection', body: ['A Collection groups Products for storefront discovery without creating duplicate Product or Inventory records.', 'Collections can be curated manually or driven by approved rules such as origin, category, type or sale channel.'] },
  explicit_membership: { title: 'Explicit Product membership', body: ['Explicit membership is an exception layer on top of Collection rules.', 'Use Included to pin a Product into a Collection and Excluded to keep it out when the normal rule would otherwise select it.'] },
  collage: { title: 'Collage preset', body: ['A Collage preset is a reusable visual arrangement of already-approved public Product imagery.', 'It controls presentation; it does not copy Product, Inventory or image authority.'] },
  caip_handoff: { title: 'CAIP → Content Studio handoff', body: ['A handoff packages references to reviewed CAIP evidence so Content Studio can prepare a story or publication package.', 'The handoff is review-first: it does not copy private source media and it does not publish anything by itself.'] },
  reviewed_evidence: { title: 'Eligible reviewed evidence', body: ['Only active evidence that has passed the required review state should be eligible for a Content Studio handoff.', 'Timecodes, transcript excerpts and story evidence stay traceable to the approved source.'] },
  prepared_package: { title: 'Prepared package', body: ['A prepared package is a reference-only working set for Content Studio.', 'Preparing or refreshing it does not duplicate private media, consume Inventory, or publish to a social or storefront channel.'] },
  tool_lifecycle: { title: 'Tool lifecycle', body: ['Tool lifecycle records condition and service history for durable equipment: inspections, maintenance, repair, calibration, safety state, retirement and replacement planning.', 'Lifecycle activity is not Inventory consumption and must not reduce Tool quantity.'] },
  lifecycle_status: { title: 'Lifecycle status', body: ['Lifecycle status describes whether a durable Tool is active, under maintenance, out of service, retired or replaced.', 'Condition describes physical state separately.'] },
  evidence_reference: { title: 'Evidence reference', body: ['An evidence reference points to the supporting record, document, image, service record or other proof used for a decision.', 'Store a safe reference or identifier here, never passwords, API tokens, private keys or other secrets.'] },
  product_contribution: { title: 'Product contribution', body: ['Product contribution shows where a Tool participates in Product creation or production history.', 'It is provenance and planning information; it does not imply that the Tool itself was consumed.'] },
  supply_sourcing: { title: 'Supply sourcing & replenishment', body: ['Supply sourcing compares real purchase options, pack pricing, lead times and replenishment targets for canonical Supply Inventory.', 'Recommendations are advisory only; this workspace cannot place an order or change on-hand quantity.'] },
  replenishment: { title: 'Replenishment target', body: ['A replenishment target helps decide when and how much Supply stock should be reviewed for purchase.', 'It is a planning threshold, not an automatic purchase instruction or stock movement.'] },
  substitution_review: { title: 'Substitution review', body: ['A substitution review records whether another material or source is an acceptable replacement when the preferred Supply is unavailable.', 'Compatibility, quality, safety, cost and Product impact should be reviewed before approval.'] },
  accounting: { title: 'Accounting workflow terms', body: ['General Ledger: the structured account record used to classify financial activity.', 'Reconciliation: comparing internal records with an outside statement and resolving differences.', 'Month lock: a control that prevents accidental changes after review or close.'] },
  general_ledger: { title: 'General Ledger', body: ['The General Ledger is the central account-by-account record used to classify and summarize financial activity.'] },
  reconciliation: { title: 'Reconciliation', body: ['Reconciliation compares Devil n Dove records with a bank, card, marketplace or other external statement and identifies differences that still need review.'] },
  month_lock: { title: 'Month lock', body: ['A month lock protects a reviewed accounting period from accidental edits. Unlocking should be deliberate and leave appropriate evidence.'] },
  it_platform: { title: 'I.T. & Platform', body: ['I.T. owns infrastructure, integration configuration references, release readiness and non-creator platform settings.', 'Consuming modules still own their business workflows; secret values never belong in visible admin content or D1 reference metadata.'] },
  d1_r2_readiness: { title: 'D1 / R2 readiness', body: ['D1 is the application database authority and R2 stores object media. Readiness checks prove the intended bindings are reachable without changing business records.', 'A successful readiness probe is not permission to replay migrations or mutate Production.'] },
  provider_configuration: { title: 'Provider configuration', body: ['Configured means expected safe environment/reference setup exists. Tested or accepted means a separate real provider test produced evidence.', 'Never treat configuration readiness as proof that Stripe, PayPal or another external transaction was accepted.'] },
  integration_authority: { title: 'Integration authority', body: ['I.T. records provider purpose, consuming module, environment, safe secret-reference names, callback/webhook locations, scopes and test state.', 'Client secrets, tokens, signing secrets, passwords and private keys must never be displayed or stored in reference records.'] },
  deferred_it_test: { title: 'External HOLD state', body: ['A HOLD state is intentionally not passed. It remains open until the required provider, private-media, OAuth or Access acceptance produces current evidence.', 'Unrelated Development work can continue when the hold is explicitly non-blocking.'] },
  password_security: { title: 'Password security', body: ['Stored passwords are one-way hashes and cannot be displayed. An eye control reveals only a password currently typed or generated in an input.', 'Administrator resets do not require the old password. Clearing the target user’s other sessions is the safe default.'] },
  seo_search: { title: 'Search-engine quality', body: ['Every indexable public page must expose one primary H1, a useful title and description, and a clean canonical URL.', 'Internal search, admin/account surfaces and empty templates should not compete with real public content in search results.'] },
  responsive_layout: { title: 'Responsive layout', body: ['Important content must remain equivalent on phone and desktop.', 'Navigation, grids, media, forms and tables should fit their container at phone, tablet, PC/app and wide-web widths without page-level horizontal overflow.'] },
  release_promotion: { title: 'Release promotion', body: ['Application changes are proven in Development first. Only the exact green Development tree is eligible for main.', 'Production then independently proves database convergence, bindings, exact deployment and public smoke acceptance. Main-only application patches are not allowed.'] },
  online_help: { title: 'Online Help Centre', body: ['The Help Centre is the current operator guide for security, search quality, responsive layout, releases and integrations.', 'Historical release/build evidence remains auditable in source history but is not presented as current instruction.'] }
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
  { path: '/admin/it-platform/', selector: '#testHeading', help: 'deferred_it_test' },
  { path: '/admin/users/', textIncludes: 'Password', help: 'password_security' },
  { path: '/admin/local-seo-review/', textIncludes: 'SEO', help: 'seo_search' },
  { path: '/admin/visual-polish/', textIncludes: 'Mobile', help: 'responsive_layout' },
  { path: '/admin/deploy-readiness/', textIncludes: 'Promote', help: 'release_promotion' },
  { path: '/admin/promotion-control/', textIncludes: 'Promotion', help: 'release_promotion' },
  { path: '/admin/help/', textIncludes: 'Help Centre', help: 'online_help' }
]);

let openRecord = null;
let refreshQueued = false;
function normalizedPath() {
  let raw = String(window.location.pathname || '/');
  if (!raw.startsWith('/admin')) return raw;
  raw = raw.replace(/\/index\.html$/i, '/');
  return raw.endsWith('/') ? raw : `${raw}/`;
}
function slug(value) { return String(value || 'help').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'help'; }
function ensureStylesheet() {
  if (document.querySelector('link[data-dd-context-help-style]')) return;
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = '/css/admin-context-help.css?v=current';
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
  trigger.addEventListener('click', (event) => { event.stopPropagation(); toggle(trigger, panel); });
  close.addEventListener('click', () => {
    if (openRecord?.trigger === trigger) closeOpen({ restoreFocus: true });
    else { panel.hidden = true; trigger.setAttribute('aria-expanded', 'false'); }
  });
  return { trigger, panel };
}
function textTarget(rule) {
  const candidates = [...document.querySelectorAll('h1,h2,h3,h4,label,legend,summary,strong,span,p')];
  if (rule.text) return candidates.find((el) => el.textContent.trim() === rule.text) || null;
  if (rule.textIncludes) return candidates.find((el) => el.textContent.includes(rule.textIncludes)) || null;
  return null;
}
function resolveTarget(rule) {
  if (rule.selector) return document.querySelector(rule.selector);
  if (rule.labelControl) {
    const control = document.querySelector(rule.labelControl);
    if (!control) return null;
    return control.closest('label') || document.querySelector(`label[for="${control.id}"]`) || control.parentElement;
  }
  return textTarget(rule);
}
function localDefinition(target, key) {
  const title = target?.dataset?.contextHelpTitle || key.replace(/[_-]+/g, ' ');
  const body = target?.dataset?.contextHelpText;
  return body ? { title, body: [body] } : null;
}
function attach(target, helpKey, definition, ordinal) {
  if (!target || target.dataset.ddContextHelpAttached === helpKey) return;
  const built = createPanel(helpKey, definition, ordinal);
  const isField = target.matches?.('label') || Boolean(target.querySelector?.('input,select,textarea'));
  if (isField) {
    const wrapper = document.createElement('span');
    wrapper.className = 'dd-context-help-field';
    target.parentNode?.insertBefore(wrapper, target);
    wrapper.append(target, built.trigger);
    built.panel.classList.add('dd-context-help-panel--field');
    wrapper.parentNode?.insertBefore(built.panel, wrapper.nextSibling);
  } else {
    target.insertAdjacentElement('afterend', built.trigger);
    built.trigger.insertAdjacentElement('afterend', built.panel);
  }
  target.dataset.ddContextHelpAttached = helpKey;
}
function refresh() {
  ensureStylesheet();
  const path = normalizedPath();
  let ordinal = 0;
  for (const rule of DD_CONTEXT_HELP_RULES) {
    if (rule.path !== path) continue;
    const target = resolveTarget(rule);
    const definition = DD_CONTEXT_HELP_LIBRARY[rule.help];
    if (target && definition) attach(target, rule.help, definition, ++ordinal);
  }
  document.querySelectorAll('[data-context-help]').forEach((target) => {
    const key = target.dataset.contextHelp || 'local-help';
    const definition = DD_CONTEXT_HELP_LIBRARY[key] || localDefinition(target, key);
    if (definition) attach(target, key, definition, ++ordinal);
  });
}
function queueRefresh() {
  if (refreshQueued) return;
  refreshQueued = true;
  queueMicrotask(() => { refreshQueued = false; refresh(); });
}
document.addEventListener('click', (event) => {
  if (!openRecord) return;
  if (openRecord.panel.contains(event.target) || openRecord.trigger.contains(event.target)) return;
  closeOpen();
});
document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && openRecord) closeOpen({ restoreFocus: true });
});
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', refresh, { once: true });
else refresh();
const observer = new MutationObserver(queueRefresh);
const observe = () => document.body && observer.observe(document.body, { childList: true, subtree: true });
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', observe, { once: true });
else observe();
