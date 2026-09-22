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
  online_help: { title: 'Online Help Centre', body: ['The Help Centre is the current guide for shoppers, members, creators and administrators.', 'Contextual ⓘ buttons explain the term or process beside them without changing data. Historical release evidence remains auditable separately from current instructions.'] },
  product_media: { title:'Product Media & Image Editor', body:['This workspace owns Product gallery image add, replace, order, metadata, explicit crop/resize and scoring work.', 'The Storefront shows the complete uploaded image by default. A crop happens only when you deliberately prepare a cropped replacement or derivative.'] },
  product_image_fit: { title:'Full Product image display', body:['Product cards and Product detail views use the full uploaded image by default, even when its shape is portrait or landscape.', 'Empty space around a non-square photo is intentional. It prevents the Storefront from cutting off part of the Product.'] },
  crop_resize: { title:'Crop / resize', body:['Keep original preserves the complete uploaded file. Square or landscape presets deliberately create a modified image file.', 'Use a crop only when the Product is still completely and accurately represented after the crop.'] },
  focal_point: { title:'Focal point / re-centering', body:['The focal point records the important subject position for intentional presentation or derivative work.', 'Click the selected-image preview or enter X/Y percentages, then save. Focal metadata does not silently crop the Storefront image.'] },
  image_score: { title:'Image score', body:['Image score measures technical/readiness evidence such as dimensions and required metadata.', 'A good score does not authorize automatic cropping, publication or replacement.'] },
  public_use_status: { title:'Public use status', body:['Public use controls where reviewed Product media is allowed to appear.', 'Internal review or consent-needed media should not be treated as buyer-facing approval.'] },
  today_attention: { title:'Today Needs Attention', body:['This view summarizes operational incidents that need review and now shows what failed, the affected endpoint/area, age and the owning workspace.', 'A threshold count is a signal to investigate; resolving or ignoring records should follow corrective evidence rather than bulk-clearing warnings.'] },
  recurring_incidents: { title:'Grouped recurring incidents', body:['Recurring incidents combine repeated scope/code/endpoint failures so one underlying problem is easier to identify.', 'Fix the recurring cause first, then resolve only incident records supported by that correction.'] },
  runtime_incident: { title:'Runtime incident', body:['A runtime incident records an application or provider-facing failure with scope, code, endpoint, message and review state.', 'Use the owning workspace and preserved details to diagnose the cause. Safe recheck is read-only and is offered only when an allowlisted probe exists.'] },
  incident_severity: { title:'Incident severity', body:['Critical and error indicate higher operational impact; warning and info are lower-severity signals.', 'Age can elevate attention even when the original incident severity was lower.'] },
  incident_review_status: { title:'Incident review status', body:['Open means not yet reviewed; Reviewing means active investigation; Resolved requires corrective evidence; Ignored is for a known harmless condition.', 'Do not use status changes to hide an unresolved recurring cause.'] },
  shop_by_intent: { title:'Shop by intent', body:['Intent links are discovery shortcuts over the same Product data, such as local pickup, vintage or custom gifts.', 'They do not create duplicate Products and only show labels supported by current public Product facts.'] },
  advanced_product_search: { title:'Advanced Product Search', body:['Use filters together to narrow public Products by origin, type, availability, material, process, locality and price.', 'Reset clears the current search filters without changing any Product data.'] },
  product_details: { title:'Product details', body:['This page shows the current public Product record, full Product images, price, availability and supporting facts.', 'If an image is intentionally cropped, that crop must first be created in the Product Media & Image Editor; the public page itself does not auto-crop uploads.'] },
  purchase_cart: { title:'Purchase and cart', body:['Adding an item to the cart records the intended Product and quantity for checkout.', 'Availability, pricing and fulfilment rules are confirmed again before an order is completed.'] },
  save_follow: { title:'Wishlist and back-in-stock', body:['Wishlist saves an item for later. Back-in-stock follows availability when a Product cannot currently be purchased.', 'These actions do not reserve stock.'] },
  media_studio: { title:'Media & Content Studio', body:['Media Studio manages non-Product presentation photography such as workshop, process, gallery, proof, banner and engagement images.', 'Product images remain in the Product Media editor so Product gallery authority is not mixed with site presentation media.'] },
  content_studio: { title:'Content Studio', body:['Content Studio prepares reviewed stories, captions and publication packages from approved evidence.', 'Preparing content does not publish automatically unless the owning publication workflow explicitly does so.'] },
  creative_project: { title:'Creative Project', body:['A Creative Project tracks the making process, materials, evidence and content opportunities around one piece or experiment.', 'It can feed Content Studio without changing Inventory or publishing by itself.'] },
  packaging_studio: { title:'Packaging Studio', body:['Packaging Studio prepares labels, packaging layouts and repeatable templates from approved Product/ingredient facts.', 'Preview and approval should happen before a printed or public-facing package is treated as final.'] }
});

const DD_PAGE_HELP_PROFILES = Object.freeze({
  customer_shop: { title:'Shopping help', body:[
    'Use this page to discover, compare, save or purchase currently available Devil n Dove items and services.',
    'Customer help explains what the page shows, what an action means, and what happens next. Opening help never changes an order, payment, Product, wishlist or stock.',
    'For account, order, pickup or custom-request questions, the Customer Help Centre links to the correct next step.'
  ]},
  customer_custom: { title:'Custom work help', body:[
    'Use this area to describe a custom idea, provide approved references, review a quote or proof, and follow the request through the existing Custom Work workflow.',
    'Submitting a reference is not automatic approval, production or payment. The page shows when human review, quote, proof or acknowledgement is still required.',
    'Use the Customer Help Centre for plain-language guidance and Contact when a request needs personal follow-up.'
  ]},
  customer_account: { title:'Account, order & fulfilment help', body:[
    'Use this area for your Devil n Dove account, saved items, order details, gift-card information, checkout or fulfilment steps.',
    'Help never changes payment, order status, account details or fulfilment choices. Those changes happen only through the page’s explicit controls.',
    'If a control is unavailable, check the nearby status/help text before retrying or contacting Devil n Dove.'
  ]},
  customer_discovery: { title:'Page help', body:[
    'This page explains part of Devil n Dove’s workshop, services, events, creative work or ways to connect.',
    'Photos and examples are descriptive unless the page explicitly identifies a currently available item or active offer.',
    'Use the Customer Help Centre for shopping, account, custom-request and contact guidance.'
  ]},
  creator_storefront: { title:'Storefront workspace help', body:[
    'This Creator/Admin surface supports buyer-facing presentation, discovery, media, merchandising or search quality while preserving the existing Product and Media authorities.',
    'Use explicit review/save/publish controls only after prerequisites are satisfied. Opening help performs no save, publication, Product mutation, Inventory movement or provider action.',
    'The Creator & Operations Help Centre explains ownership boundaries, common tasks, recovery paths and where work belongs.'
  ]},
  creator_workshop: { title:'Creator workspace help', body:[
    'This workspace supports workshop operations such as Creative Projects, Custom Work, tools, supplies, inventory, CAIP, Content or Packaging using the existing canonical records.',
    'Follow the page’s current prerequisites and review states; do not create duplicate records simply to move a workflow forward.',
    'Opening help is read-only. Use the Creator & Operations Help Centre for start-to-finish workflow guidance and recovery help.'
  ]},
  creator_finance: { title:'Finance workspace help', body:[
    'This workspace supports orders, payments, documents, accounting, reconciliation, close or business-health review using the existing Finance authorities.',
    'Posting, locking, payment and correction actions must remain explicit and auditable. Help never performs a financial mutation.',
    'Use the Creator & Operations Help Centre when you need the meaning of a status, prerequisite, evidence requirement or next safe action.'
  ]},
  creator_it: { title:'I.T. & administration help', body:[
    'This workspace supports access, security, diagnostics, integrations, reliability, release evidence or application administration.',
    'Configured is not the same as tested or accepted. Production and provider actions remain separately controlled and evidence-based.',
    'Opening help never changes configuration, secrets, D1/R2 data, deployment state or provider state.'
  ]},
  creator_general: { title:'Creator & operations help', body:[
    'This is an authenticated Devil n Dove operating workspace. Use the page’s explicit controls for the task named in the main heading.',
    'Help explains purpose, prerequisites, authority boundaries and next steps without changing business data.',
    'For broader workflow guidance, open the Creator & Operations Help Centre from the floating ⓘ control.'
  ]}
});

function pageHelpProfile(path) {
  if (path.startsWith('/admin/')) {
    if (/\/(?:catalog|storefront|home-carousel|public-display|local-seo|image-manifest|media-content|visual|creator-content-completeness|marketplace)/.test(path)) return DD_PAGE_HELP_PROFILES.creator_storefront;
    if (/\/(?:creative|caip|packaging|tool|inventory|supply|workshop|content|social|custom|creation|mobile-workshop)/.test(path)) return DD_PAGE_HELP_PROFILES.creator_workshop;
    if (/\/(?:finance|accounting|month-end|order|gift-card|business-health|project-profitability)/.test(path)) return DD_PAGE_HELP_PROFILES.creator_finance;
    if (/\/(?:it|release|deploy|runtime|security|user|application|operational|reliability|prelaunch|promotion|safe-deploy|startup-readiness|go-live)/.test(path)) return DD_PAGE_HELP_PROFILES.creator_it;
    return DD_PAGE_HELP_PROFILES.creator_general;
  }
  if (/^\/(?:shop|collections|gift-cards|gallery|creations|handmade-|polymer-|vintage-|laser-|custom-(?:candle|soap|gifts)|workshop-made-gifts)/.test(path)) return DD_PAGE_HELP_PROFILES.customer_shop;
  if (path.startsWith('/custom-request/')) return DD_PAGE_HELP_PROFILES.customer_custom;
  if (/^\/(?:members|member|account|cart|checkout|orders|pickup|gift-card)/.test(path)) return DD_PAGE_HELP_PROFILES.customer_account;
  return DD_PAGE_HELP_PROFILES.customer_discovery;
}

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
  { path: '/admin/help/', textIncludes: 'Help Centre', help: 'online_help' },
  { path: '/shop/', selector: '#shopIntentHeading', help: 'shop_by_intent' },
  { path: '/shop/', text: 'Advanced Product Search', help: 'advanced_product_search' },
  { path: '/shop/', text: 'Available Products', help: 'product_image_fit' },
  { path: '/shop/product/', selector: '#pageH1', help: 'product_details' },
  { path: '/shop/product/', text: 'Purchase', help: 'purchase_cart' },
  { path: '/shop/product/', text: 'Save or follow this item', help: 'save_follow' },
  { path: '/admin/catalog-media/', text: 'Product Media & Image Editor', help: 'product_media' },
  { path: '/admin/catalog-media/', labelControl: '#productMediaV164Preset', help: 'crop_resize' },
  { path: '/admin/catalog-media/', labelControl: 'input[name="focal_point_x"]', help: 'focal_point' },
  { path: '/admin/catalog-media/', text: 'Image score', help: 'image_score' },
  { path: '/admin/catalog-media/', labelControl: 'select[name="public_use_status"]', help: 'public_use_status' },
  { path: '/admin/operations/', text: 'Today Needs Attention', help: 'today_attention' },
  { path: '/admin/operations/', text: 'Grouped recurring incidents', help: 'recurring_incidents' },
  { path: '/admin/operations/', text: 'Recent incident records and safe recovery', help: 'runtime_incident' },
  { path: '/admin/media-content-studio/', textIncludes: 'Media', help: 'media_studio' },
  { path: '/admin/content-studio/', textIncludes: 'Content Studio', help: 'content_studio' },
  { path: '/admin/creative-automation/', textIncludes: 'Creative', help: 'creative_project' },
  { path: '/admin/packaging-studio/', textIncludes: 'Packaging', help: 'packaging_studio' }
]);

let openRecord = null;
let refreshTimer = 0;
let observer = null;
let observing = false;
let observerStopTimer = 0;
const AUTO_OBSERVER_MAX_MS = 8000;
const REFRESH_DEBOUNCE_MS = 180;
const OBSERVER_CONFIG = Object.freeze({ childList: true, subtree: true });
function normalizedPath() {
  let raw = String(window.location.pathname || '/');
  raw = raw.replace(/\/index\.html$/i, '/');
  return raw.endsWith('/') ? raw : `${raw}/`;
}
function slug(value) { return String(value || 'help').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'help'; }
function ensureStylesheet() {
  if (document.querySelector('link[data-dd-context-help-style]')) return;
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = '/css/admin-context-help.css?v=467b198-shared-help';
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
function ensureHelpCentreLauncher(path){
  if(document.querySelector('[data-dd-help-centre-launcher]'))return;
  const creator=path.startsWith('/admin/');
  const link=document.createElement('a');
  link.className='dd-context-help-centre';
  link.dataset.ddHelpCentreLauncher='true';
  link.href=creator?'/admin/help/':'/help/';
  link.textContent=creator?'ⓘ Creator Help':'ⓘ Customer Help';
  link.setAttribute('aria-label',creator?'Open Creator and Operations Help Centre':'Open Customer Help Centre');
  document.body.appendChild(link);
}
function ensurePageLevelHelp(path, ordinal){
  const heading=document.querySelector('main h1,.hero h1,h1');
  if(!heading || heading.dataset.ddContextHelpAttached || document.querySelector('[data-dd-page-help]')) return ordinal;
  const profile=pageHelpProfile(path);
  const title=String(heading.textContent||'').trim();
  const definition={title:title?`${profile.title}: ${title}`:profile.title,body:profile.body};
  const built=createPanel('page-help',definition,ordinal+1);
  built.trigger.dataset.ddPageHelp='true';
  built.panel.dataset.ddPageHelp='true';
  heading.insertAdjacentElement('afterend',built.trigger);
  built.trigger.insertAdjacentElement('afterend',built.panel);
  heading.dataset.ddContextHelpAttached='page-help';
  return ordinal+1;
}
function refresh() {
  ensureStylesheet();
  const path = normalizedPath();
  ensureHelpCentreLauncher(path);
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
  ordinal = ensurePageLevelHelp(path, ordinal);
function helpOwnedNode(node) {
  const el = node?.nodeType === 1 ? node : node?.parentElement;
  return Boolean(el?.closest?.('.dd-context-help-trigger,.dd-context-help-panel,.dd-context-help-field'));
}
function mutationNeedsRefresh(records) {
  return records.some((record) => {
    const changed = [...(record.addedNodes || []), ...(record.removedNodes || [])];
    if (!changed.length) return !helpOwnedNode(record.target);
    return changed.some((node) => !helpOwnedNode(node));
  });
}
function refreshSafely() {
  if (observer && observing) observer.disconnect();
  observing = false;
  try { refresh(); }
  finally {
    if (observer && document.body && observerStopTimer) {
      observer.observe(document.body, OBSERVER_CONFIG);
      observing = true;
    }
  }
}
function queueRefresh() {
  if (refreshTimer) window.clearTimeout(refreshTimer);
  refreshTimer = window.setTimeout(() => {
    refreshTimer = 0;
    refreshSafely();
  }, REFRESH_DEBOUNCE_MS);
}
function startBoundedObserver() {
  if (!document.body || typeof MutationObserver !== 'function' || observer) return;
  if (!normalizedPath().startsWith('/admin/') || window.DDAdminLeanStartup?.enabled) return;
  observer = new MutationObserver((records) => {
    if (mutationNeedsRefresh(records)) queueRefresh();
  });
  observer.observe(document.body, OBSERVER_CONFIG);
  observing = true;
  observerStopTimer = window.setTimeout(() => {
    observerStopTimer = 0;
    observer?.disconnect();
    observing = false;
  }, AUTO_OBSERVER_MAX_MS);
}
document.addEventListener('dd:admin-context-help-refresh', queueRefresh);
document.addEventListener('click', (event) => {
  if (!openRecord) return;
  if (openRecord.panel.contains(event.target) || openRecord.trigger.contains(event.target)) return;
  closeOpen();
});
document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && openRecord) closeOpen({ restoreFocus: true });
});
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    refreshSafely();
    startBoundedObserver();
  }, { once: true });
} else {
  refreshSafely();
  startBoundedObserver();
}
