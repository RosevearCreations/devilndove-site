// Devil n Dove canonical application-module route catalog.
// Historical module keys are translated only as a temporary D1 compatibility bridge.

export const MODULE_KEYS = Object.freeze({
  STOREFRONT: 'storefront',
  CREATORS: 'creators',
  SOCIALS: 'socials',
  FINANCIALS: 'financials',
  IT_PLATFORM: 'it-platform',
});

export const LEGACY_MODULE_KEYS = Object.freeze({
  'commerce-operations': MODULE_KEYS.STOREFRONT,
  'creative-production': MODULE_KEYS.CREATORS,
  'business-administration': MODULE_KEYS.FINANCIALS,
});

export function canonicalModuleKey(value) {
  const key = String(value || '').trim().toLowerCase();
  return LEGACY_MODULE_KEYS[key] || key;
}

const CORE_EXEMPT = Object.freeze([
  '/admin/application-modules',
  '/api/admin/app-modules',
  // Build 162: Product media is R2-only transport. It must not resolve a D1-backed
  // application-module session before serving an image.
  '/api/product-media',
]);

export const SHARED_SERVICE_CONTRACTS = Object.freeze([
  Object.freeze({
    path: '/api/admin/contracts/catalog-read',
    owner_module_key: MODULE_KEYS.STOREFRONT,
    consumer_module_keys: Object.freeze([
      MODULE_KEYS.STOREFRONT,
      MODULE_KEYS.CREATORS,
      MODULE_KEYS.SOCIALS,
      MODULE_KEYS.FINANCIALS,
    ]),
    mutation: false,
  }),
  Object.freeze({
    path: '/api/admin/contracts/inventory-read',
    owner_module_key: MODULE_KEYS.STOREFRONT,
    consumer_module_keys: Object.freeze([
      MODULE_KEYS.STOREFRONT,
      MODULE_KEYS.CREATORS,
      MODULE_KEYS.FINANCIALS,
    ]),
    mutation: false,
  }),
  Object.freeze({
    path: '/api/admin/contracts/inventory-cost',
    owner_module_key: MODULE_KEYS.STOREFRONT,
    consumer_module_keys: Object.freeze([
      MODULE_KEYS.STOREFRONT,
      MODULE_KEYS.FINANCIALS,
    ]),
    mutation: false,
  }),
  Object.freeze({
    path: '/api/admin/contracts/inventory-post',
    owner_module_key: MODULE_KEYS.STOREFRONT,
    consumer_module_keys: Object.freeze([
      MODULE_KEYS.STOREFRONT,
      MODULE_KEYS.CREATORS,
    ]),
    mutation: true,
  }),
  Object.freeze({
    path: '/api/admin/contracts/inventory-reverse',
    owner_module_key: MODULE_KEYS.STOREFRONT,
    consumer_module_keys: Object.freeze([
      MODULE_KEYS.STOREFRONT,
      MODULE_KEYS.CREATORS,
    ]),
    mutation: true,
  }),
  Object.freeze({
    path: '/api/admin/contracts/accounting-read',
    owner_module_key: MODULE_KEYS.FINANCIALS,
    consumer_module_keys: Object.freeze([
      MODULE_KEYS.FINANCIALS,
      MODULE_KEYS.STOREFRONT,
    ]),
    mutation: false,
  }),
  Object.freeze({
    path: '/api/admin/contracts/content-media',
    owner_module_key: MODULE_KEYS.CREATORS,
    consumer_module_keys: Object.freeze([
      MODULE_KEYS.CREATORS,
      MODULE_KEYS.STOREFRONT,
      MODULE_KEYS.SOCIALS,
    ]),
    mutation: false,
  }),
]);

const STOREFRONT_ADMIN_PAGES = Object.freeze([
  '/admin/storefront-acceptance',
  '/admin/physical-stock',
  '/admin/catalog',
  '/admin/catalog-media',
  '/admin/catalog-health',
  '/admin/create-product',
  '/admin/product-editor',
  '/admin/products',
  '/admin/movies',
  '/admin/mobile-product',
  '/admin/mobile-inventory',
  '/admin/site-item-inventory',
  '/admin/inventory',
  '/admin/inventory-operations',
  '/admin/operations',
  '/admin/orders',
  '/admin/customer-documents',
  '/admin/gift-cards',
  '/admin/members',
  '/admin/membership',
  '/admin/custom-request',
  '/admin/today-tasks',
  '/admin/home-carousel',
  '/admin/marketplace-exports',
  '/admin/marketplace-mapping',
  '/admin/public-display-order',
]);

const CREATOR_ADMIN_PAGES = Object.freeze([
  '/admin/project-work-orders',
  '/admin/workshop-production',
  '/admin/creative-project',
  '/admin/creative-process',
  '/admin/creative-automation',
  '/admin/creative-assets',
  '/admin/caip',
  '/admin/packaging-studio',
  '/admin/packaging',
  '/admin/media-content-studio',
  '/admin/content-studio',
  '/admin/visual-enrichment-studio',
  '/admin/image-manifest',
  '/admin/stage-photo-moderation',
]);

const SOCIAL_ADMIN_PAGES = Object.freeze([
  '/admin/social-publishing',
  '/admin/content-publications',
]);

const FINANCIAL_ADMIN_PAGES = Object.freeze([
  '/admin/commission-finance',
  '/admin/accounting',
]);

const IT_ADMIN_PAGES = Object.freeze([
  '/admin/module-acceptance',
  '/admin/it-platform',
  '/admin/application-sanity',
  '/admin/deploy-readiness',
  '/admin/deployment-preflight',
  '/admin/go-live-execution',
  '/admin/live-ops-followthrough',
  '/admin/markdown-sanity',
  '/admin/operational-continuity',
  '/admin/post-deploy-smoke-tests',
  '/admin/prelaunch',
  '/admin/promotion-control',
  '/admin/readiness',
  '/admin/release-control',
  '/admin/release-notes',
  '/admin/release-preflight',
  '/admin/safe-deploy-package',
  '/admin/startup-readiness',
  '/admin/users',
]);

// Build 398.1: these restricted Etsy operator endpoints previously fell through to
// Application Core, leaving context.data.ddModuleAccess absent. Assign the same
// Storefront module that owns Product Browser and marketplace drafts.
// Central middleware must verify a real active session and enabled module;
 // endpoints still require an explicit verified Admin role.
const ETSY_OPERATOR_ADMIN_APIS = Object.freeze([
  '/api/admin/etsy-operator-product-choices',
  '/api/admin/etsy-product-syndication',
  '/api/admin/etsy-monitoring-exceptions',
  '/api/admin/etsy-monitoring-alerts',
  '/api/admin/etsy-connection-price-outcomes',
  '/api/admin/etsy-oauth-acceptance',
  '/api/admin/etsy-shop-identity',
  '/api/admin/etsy-remote-draft-trial',
  '/api/admin/etsy-remote-draft-evidence',
  '/api/admin/etsy-draft-completion',
  '/api/admin/etsy-image-reconciliation',
  '/api/admin/etsy-draft-decision',
  '/api/admin/etsy-exception-resolution',
  '/api/admin/etsy-publication-packet',
  '/api/admin/product-distribution-406',
  '/api/admin/etsy-trial-409',
  '/api/admin/provider-draft-recovery-410',
  '/api/admin/provider-evidence-411',
  '/api/admin/provider-work-queue-412',
  '/api/admin/provider-followup-413',
  '/api/admin/provider-completion-414',
  '/api/admin/provider-closure-415',
  '/api/admin/provider-closure-packet-416',
  '/api/admin/provider-closure-approval-417',
  '/api/admin/provider-closure-history-418',
  '/api/admin/provider-reopen-decision-419',
  '/api/admin/provider-reopen-continuity-420',
  '/api/admin/provider-exception-followup-421',
  '/api/admin/provider-exception-ack-422',
  '/api/admin/provider-handoff-governance-423',
  '/api/admin/provider-handoff-acceptance-424',
  '/api/admin/provider-owner-acceptance-425',
  '/api/admin/listing-sync-408',
  '/api/admin/production-variable-audit-406',
  '/api/admin/product-channel-intent',
]);

const STOREFRONT_ADMIN_APIS = Object.freeze([
  '/api/admin/storefront-acceptance-660',
  '/api/admin/physical-stock-658',
  '/api/admin/catalog',
  '/api/admin/catalog-health',
  '/api/admin/product',
  '/api/admin/create-product',
  '/api/admin/update-product',
  '/api/admin/delete-product',
  '/api/admin/archive-product',
  '/api/admin/inventory',
  '/api/admin/site-item',
  '/api/admin/order',
  '/api/admin/member',
  '/api/admin/membership',
  '/api/admin/gift-card',
  '/api/admin/customer-document',
  '/api/admin/customer-documents',
  '/api/admin/custom-request',
  '/api/admin/today-task',
  '/api/admin/home-carousel',
  '/api/admin/marketplace',
  '/api/admin/contracts/operations-',
  '/api/admin/contracts/catalog-',
  '/api/admin/contracts/inventory-',
]);

const CREATOR_ADMIN_APIS = Object.freeze([
  '/api/admin/project-work-orders',
  '/api/admin/workshop-production-657',
  '/api/admin/creative',
  '/api/admin/caip',
  '/api/admin/packaging',
  '/api/admin/content-studio',
  '/api/admin/media-content-studio',
  '/api/admin/image-manifest',
  '/api/admin/visual-enrichment',
  '/api/admin/stage-photo',
  '/api/admin/contracts/creative-',
  '/api/admin/contracts/caip-',
  '/api/admin/contracts/packaging-',
  '/api/admin/contracts/content-',
]);

const SOCIAL_ADMIN_APIS = Object.freeze([
  '/api/admin/social',
  '/api/admin/content-publication',
]);

const FINANCIAL_ADMIN_APIS = Object.freeze([
  '/api/admin/commission-finance-661',
  '/api/admin/accounting',
  '/api/admin/payment',
  '/api/payment-providers',
]);

const IT_ADMIN_APIS = Object.freeze([
  '/api/admin/module-acceptance-656',
  '/api/admin/infrastructure-readiness',
  '/api/admin/payment-provider-testing-blockers',
  '/api/admin/payment-provider-obstacle-probe',
  '/api/admin/post-deploy-smoke-tests',
  '/api/admin/startup-readiness',
  '/api/admin/deploy',
  '/api/admin/readiness',
  '/api/admin/release',
]);

const STOREFRONT_PUBLIC_PAGES = Object.freeze([
  '/',
  '/shop',
  '/cart',
  '/checkout',
  '/product',
  '/products',
  '/custom-request',
  '/members',
]);

const SOCIAL_PUBLIC_PAGES = Object.freeze([
  '/socials',
  '/workshop-journal',
]);

const STOREFRONT_PUBLIC_APIS = Object.freeze([
  '/api/member',
  '/api/cart',
  '/api/checkout',
  '/api/product',
  '/api/products',
  '/api/custom-request',
  '/api/home-carousel',
]);

const SOCIAL_PUBLIC_APIS = Object.freeze([
  '/api/social',
]);

function cleanPath(pathname) {
  const raw = String(pathname || '/').split(/[?#]/, 1)[0] || '/';
  if (raw === '/') return '/';
  return `/${raw.replace(/^\/+|\/+$/g, '')}`;
}

function matches(path, prefix) {
  if (path === prefix || path.startsWith(`${prefix}/`)) return true;
  if (prefix.startsWith('/api/')) {
    return prefix.endsWith('-') ? path.startsWith(prefix) : path.startsWith(`${prefix}-`);
  }
  return false;
}

function matchesAny(path, prefixes) {
  return prefixes.some((prefix) => matches(path, prefix));
}

export function sharedServiceContractForPath(pathname) {
  const path = cleanPath(pathname);
  return SHARED_SERVICE_CONTRACTS.find((contract) => path === contract.path || path.startsWith(`${contract.path}/`)) || null;
}

export function moduleKeyForPath(pathname) {
  const path = cleanPath(pathname);
  if (matchesAny(path, CORE_EXEMPT)) return null;
  if (sharedServiceContractForPath(path)) return null;

  if (matchesAny(path, IT_ADMIN_PAGES) || matchesAny(path, IT_ADMIN_APIS)) return MODULE_KEYS.IT_PLATFORM;
  if (matchesAny(path, FINANCIAL_ADMIN_PAGES) || matchesAny(path, FINANCIAL_ADMIN_APIS)) return MODULE_KEYS.FINANCIALS;
  if (matchesAny(path, SOCIAL_ADMIN_PAGES) || matchesAny(path, SOCIAL_ADMIN_APIS)) return MODULE_KEYS.SOCIALS;
  if (matchesAny(path, CREATOR_ADMIN_PAGES) || matchesAny(path, CREATOR_ADMIN_APIS)) return MODULE_KEYS.CREATORS;
  if (matchesAny(path, ETSY_OPERATOR_ADMIN_APIS)) return MODULE_KEYS.STOREFRONT;
  if (matchesAny(path, STOREFRONT_ADMIN_PAGES) || matchesAny(path, STOREFRONT_ADMIN_APIS)) return MODULE_KEYS.STOREFRONT;
  if (matchesAny(path, SOCIAL_PUBLIC_PAGES) || matchesAny(path, SOCIAL_PUBLIC_APIS)) return MODULE_KEYS.SOCIALS;
  if (matchesAny(path, STOREFRONT_PUBLIC_PAGES) || matchesAny(path, STOREFRONT_PUBLIC_APIS)) return MODULE_KEYS.STOREFRONT;

  // Unclassified admin surfaces remain Application Core until deliberately assigned.
  return null;
}

export function snapshotRouteOwnership() {
  return Object.freeze({
    release: 447,
    coreExempt: CORE_EXEMPT,
    sharedServiceContracts: SHARED_SERVICE_CONTRACTS,
    storefrontAdminPages: STOREFRONT_ADMIN_PAGES,
    creatorAdminPages: CREATOR_ADMIN_PAGES,
    socialAdminPages: SOCIAL_ADMIN_PAGES,
    financialAdminPages: FINANCIAL_ADMIN_PAGES,
    itAdminPages: IT_ADMIN_PAGES,
    storefrontAdminApis: STOREFRONT_ADMIN_APIS,
    creatorAdminApis: CREATOR_ADMIN_APIS,
    socialAdminApis: SOCIAL_ADMIN_APIS,
    financialAdminApis: FINANCIAL_ADMIN_APIS,
    itAdminApis: IT_ADMIN_APIS,
    storefrontPublicPages: STOREFRONT_PUBLIC_PAGES,
    socialPublicPages: SOCIAL_PUBLIC_PAGES,
    storefrontPublicApis: STOREFRONT_PUBLIC_APIS,
    socialPublicApis: SOCIAL_PUBLIC_APIS,
  });
}

/* Build 723 — canonical READ-ONLY source catalog, not blanket enforcement of
 * historic routes. Candidate eligibility is not runtime authorization. */
export const OPERATIONAL_TIERS_723=Object.freeze([
 'T0_PUBLIC','T1_SIGNED_IN','T2_TENANT','T3_COMPANY_OPERATOR',
 'T4_INDEPENDENT_THREE_MASTER','T5_ORIGINAL_PHYSICAL_RECEIVER']);
export const CONTROL_LAYERS_723=Object.freeze([
 'identity_provenance','transport_authentication','authorization_tenant_consent',
 'data_audit_replay_fail_closed','privileged_operations_recovery']);
export const COMPLETION_AXES_723=Object.freeze([
 'design','implementation','automated_testing','integration_verification',
 'security','accessibility_device_acceptance','production_owner_acceptance']);
export const MODULE_SCOPE_723=Object.freeze([
 'customer_product_catalog','product_photo_video_drafts','unique_cards_mobile_gallery',
 'inventory_variants','cart_checkout_tax','payments_refunds','shipping_fulfillment',
 'social_consent_publication','finance_owner_custody','admin_roles_recovery',
 'seven_app_integration']);
export function sixTierSecurityInventory723(){
 const snapshot=snapshotRouteOwnership();
 const named=[
  ['storefront_admin_pages',snapshot.storefrontAdminPages,MODULE_KEYS.STOREFRONT],
  ['creator_admin_pages',snapshot.creatorAdminPages,MODULE_KEYS.CREATORS],
  ['social_admin_pages',snapshot.socialAdminPages,MODULE_KEYS.SOCIALS],
  ['financial_admin_pages',snapshot.financialAdminPages,MODULE_KEYS.FINANCIALS],
  ['it_admin_pages',snapshot.itAdminPages,MODULE_KEYS.IT_PLATFORM],
  ['storefront_admin_api_prefixes',snapshot.storefrontAdminApis,MODULE_KEYS.STOREFRONT],
  ['creator_admin_api_prefixes',snapshot.creatorAdminApis,MODULE_KEYS.CREATORS],
  ['social_admin_api_prefixes',snapshot.socialAdminApis,MODULE_KEYS.SOCIALS],
  ['financial_admin_api_prefixes',snapshot.financialAdminApis,MODULE_KEYS.FINANCIALS],
  ['it_admin_api_prefixes',snapshot.itAdminApis,MODULE_KEYS.IT_PLATFORM],
  ['storefront_public_pages',snapshot.storefrontPublicPages,MODULE_KEYS.STOREFRONT],
  ['social_public_pages',snapshot.socialPublicPages,MODULE_KEYS.SOCIALS],
  ['storefront_public_api_prefixes',snapshot.storefrontPublicApis,MODULE_KEYS.STOREFRONT],
  ['social_public_api_prefixes',snapshot.socialPublicApis,MODULE_KEYS.SOCIALS],
  ['etsy_operator_admin_api_prefixes',ETSY_OPERATOR_ADMIN_APIS,MODULE_KEYS.STOREFRONT]
 ];
 const catalog=named.map(([name,paths,module_key])=>({
  group:name,module_key,declared_entries:paths.length,examples:paths.slice(0,3),
  source:'functions/api/_lib/appModuleRoutes.js',
  verified_endpoint_count:null,all_routes_runtime_tested:false}));
 const routes=[
  '/','/shop','/cart','/admin/products','/admin/mobile-product',
  '/admin/social-publishing','/admin/accounting','/admin/it-platform',
  '/api/admin/production-variable-audit-406','/api/admin/payment-provider-testing-blockers',
  '/api/admin/product-distribution-406','/api/admin/social-post-queue',
  '/api/admin/imaginary-privileged-route','/api/admin/app-modules',
  '/api/admin/contracts/catalog-read'];
 const sample_routes=routes.map(path=>{
  const contract=sharedServiceContractForPath(path);
  const module_key=moduleKeyForPath(path);
  return {path,source_module_key:module_key||null,
   shared_contract:contract?.path||null,
   classification:contract?'SHARED_SERVICE_CONTRACT_SEPARATE_CHECK':
    module_key?'MODULE_CATALOG_ROUTE_MATCH':
    'UNCLASSIFIED_OR_EXEMPT_REQUIRES_INDIVIDUAL_REVIEW'};
 });
 return {build:723,source:'EXISTING_CANONICAL_MODULE_ROUTE_CATALOG',
  topology_id:'rosevear-master-shell-seven-apps.v1',
  layers:[...CONTROL_LAYERS_723],tiers:[...OPERATIONAL_TIERS_723],
  shared_service_contracts:snapshot.sharedServiceContracts.map(c=>({
   path:c.path,owner_module_key:c.owner_module_key,
   consumers:[...c.consumer_module_keys],mutation:c.mutation,
   owner_authorization_assumed:false})),
  route_catalog:catalog,route_examples:sample_routes,
  catalogued_declaration_count:catalog.reduce((n,g)=>n+g.declared_entries,0),
  complete_deployed_endpoint_inventory:false,all_tiers_enforced_globally:false,
  module_middleware_source:'functions/_middleware.js',
  verified_admin_source:'functions/api/_lib/verifiedAdmin398.mjs',
  original_host_t5_witness:'UNKNOWN_HOLD',
  signed_three_master_transport:'NOT_VERIFIED',
  authority_transfer:false,cross_app_connected:false,receiver_activated:false};
}
/* Fail closed pure tier/capability candidate matrix. All historic endpoints
 * continue using their own genuine runtime middleware and original source locks;
 * this policy NEVER grants an access token, payment, transport or receiver ON. */
export function assessTierCandidate723(p={}){
 const tier=String(p.tier||''),cap=String(p.capability||'');
 const min={public_catalog_read:0,own_account_read:1,tenant_order_read:2,
  operator_product_review:3,operator_media_draft_review:3,
  operator_finance_evidence_review:3,master_readonly_governance:4,
  physical_receiver_activation:5};
 const target=Object.hasOwn(min,cap)?min[cap]:null;
 const level=OPERATIONAL_TIERS_723.indexOf(tier);
 const reasons=[];
 if(target===null||level<0)reasons.push('UNKNOWN_TIER_OR_CAPABILITY');
 else if(level<target)reasons.push('INSUFFICIENT_TIER');
 if(target!==0&&(p.identity_verified!==true||p.account_active!==true))
  reasons.push('ACTIVE_VERIFIED_IDENTITY_REQUIRED');
 if(target===1&&p.self_resource_verified!==true)reasons.push('SELF_OWNERSHIP_REQUIRED');
 if(target===2&&!(typeof p.tenant_id==='string'&&p.tenant_id.length>0&&
  p.tenant_id===p.resource_tenant_id&&p.tenant_membership_verified===true))
  reasons.push('TENANT_RESOURCE_AND_MEMBERSHIP_REQUIRED');
 if(target===3){
  if(p.admin_role_verified!==true||p.company_operator_grant!==true)
   reasons.push('ACTIVE_COMPANY_OPERATOR_REQUIRED');
  const module=cap==='operator_finance_evidence_review'?MODULE_KEYS.FINANCIALS:
   cap==='operator_media_draft_review'?MODULE_KEYS.CREATORS:MODULE_KEYS.STOREFRONT;
  if(p.module_key!==module||p.module_permission_verified!==true)
   reasons.push('EXACT_MODULE_GRANT_REQUIRED');
  if(p.company_id===undefined||!p.company_id||p.company_id!==p.resource_company_id)
   reasons.push('EXACT_COMPANY_BOUNDARY_REQUIRED');
  if(cap==='operator_media_draft_review'&&p.source_media_consent_verified!==true)
   reasons.push('SOURCE_MEDIA_CONSENT_REQUIRED');
 }
 if(target===4)reasons.push('INDEPENDENT_THREE_MASTER_SIGNED_TRANSPORT_NOT_VERIFIED');
 if(target===5)reasons.push('ORIGINAL_PHYSICAL_RECEIVER_OWNER_CEREMONY_NOT_VERIFIED');
 const candidate=reasons.length===0;
 return {build:723,tier,capability:cap,
  decision:candidate?'CANDIDATE_ONLY_SEPARATE_ORIGINAL_RUNTIME_AUTH_REQUIRED':
   'HOLD_'+reasons[0],reasons,provisional_tier_eligible:candidate,
  runtime_access_granted:false,provider_write_performed:false,
  financial_books_closed:false,receiver_activated:false,
  independent_master_permission_fabricated:false};
}
/* No denominator is silently approved; no unknown 0% or +10-point claim. */
export function sevenAxisCompletionBaseline723(approved=null){
 const axes=[...COMPLETION_AXES_723],scopes=[...MODULE_SCOPE_723];
 const proposed_checks=axes.map(axis=>({
  axis,proposed_scope_count:scopes.length,
  scopes:scopes.map(scope=>({scope,check_id:'DND723_'+axis+'_'+scope,
   proposed_state:'PENDING_OWNER_DEFINITION_AND_ORIGINAL_EVIDENCE'})),
  owner_approved_denominator:null,original_verified_numerator:null,
  verified_percent:null,target_10pp_percent:null,
  verification_status:'UNMEASURED_PENDING_OWNER_APPROVAL'}));
 const validApproval=approved&&typeof approved==='object'&&
  approved.original_source_verified===true&&approved.explicit_owner_approval===true&&
  /^[a-f0-9]{40}$/.test(String(approved.production_sha||''))&&
  Array.isArray(approved.axes)&&approved.axes.length===axes.length&&
  axes.every((axis,i)=>{
   const a=approved.axes[i];
   return a?.axis===axis&&Number.isSafeInteger(a.denominator)&&
    a.denominator>=1&&a.denominator<=scopes.length&&
    Number.isSafeInteger(a.verified_passes)&&a.verified_passes>=0&&
    a.verified_passes<=a.denominator&&a.original_evidence_verified===true;
  });
 if(!validApproval)return {build:723,topology_id:'rosevear-master-shell-seven-apps.v1',
  source:'PROPOSED_APP_ACCEPTANCE_CHECKS_NOT_OWNER_APPROVED',
  axes:proposed_checks,scope_count:scopes.length,
  axis_count:axes.length,proposed_check_count:scopes.length*axes.length,
  verified_baseline_count:null,percentage_point_gain_verified:false,
  application_completion_percent:null,original_signed_owner_approval:false,
  cross_app_connected:false,finance_closed:false};
 const measured=proposed_checks.map((entry,i)=>{
  const a=approved.axes[i],percent=100*a.verified_passes/a.denominator;
  return {...entry,owner_approved_denominator:a.denominator,
   original_verified_numerator:a.verified_passes,
   verified_percent:percent,target_10pp_percent:Math.min(100,percent+10),
   verification_status:'SOURCE_VERIFIED_OWNER_APPROVED_BASELINE'};
 });
 return {build:723,topology_id:'rosevear-master-shell-seven-apps.v1',
  source:'EXTERNALLY_VERIFIED_OWNER_APPROVED_BASELINE_CONTRACT',
  axes:measured,scope_count:scopes.length,axis_count:axes.length,
  proposed_check_count:scopes.length*axes.length,
  verified_baseline_count:axes.length,
  percentage_point_gain_verified:false,application_completion_percent:null,
  original_signed_owner_approval:true,cross_app_connected:false,
  finance_closed:false};
}
