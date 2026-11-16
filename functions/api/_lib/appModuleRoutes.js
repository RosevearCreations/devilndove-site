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
export function sevenAxisCompletionBaseline723(){
 const axes=[...COMPLETION_AXES_723],scopes=[...MODULE_SCOPE_723];
 const proposed_checks=axes.map(axis=>({
  axis,proposed_scope_count:scopes.length,
  scopes:scopes.map(scope=>({scope,check_id:'DND723_'+axis+'_'+scope,
   proposed_state:'PENDING_OWNER_DEFINITION_AND_ORIGINAL_EVIDENCE'})),
  owner_approved_denominator:null,original_verified_numerator:null,
  verified_percent:null,target_10pp_percent:null,
  verification_status:'UNMEASURED_PENDING_OWNER_APPROVAL'}));
 return {build:723,topology_id:'rosevear-master-shell-seven-apps.v1',
  source:'PROPOSED_APP_ACCEPTANCE_CHECKS_NOT_OWNER_APPROVED',
  axes:proposed_checks,scope_count:scopes.length,
  axis_count:axes.length,proposed_check_count:scopes.length*axes.length,
  verified_baseline_count:null,percentage_point_gain_verified:false,
  application_completion_percent:null,original_signed_owner_approval:false,
  cross_app_connected:false,finance_closed:false};
}

/* Build 725: additive protocol 1.1 source-only policy; legacy 1.0 endpoints
 * remain unchanged. Pure candidates NEVER replace real application session,
 * D1/R2 source ownership or a witnessed cross-app signed transport. */
export const INDEPENDENT_SYNC_725=Object.freeze({
 topology_id:'rosevear-master-shell-seven-apps.v1',
 local:{major:1,minor:1},compatible_legacy:{major:1,minor:0},
 independent_additive_release:true,lockstep_release_required:false,
 raw_secrets_synchronized:false,direct_peer_database_sync:false
});
const CAPS_725=Object.freeze({
 'health.read':{min:0,peer_minor:0,local_only:false,personal:false,write:false},
 'capabilities.read':{min:0,peer_minor:0,local_only:false,personal:false,write:false},
 'storefront.product.read':{min:0,peer_minor:1,local_only:false,personal:false,write:false},
 'storefront.product.private_read':{min:2,peer_minor:1,local_only:false,personal:true,write:false},
 'storefront.inventory.read':{min:3,peer_minor:1,local_only:false,personal:false,write:false},
 'media.draft.read':{min:3,peer_minor:1,local_only:false,personal:true,write:false},
 'media.draft.review':{min:3,peer_minor:1,local_only:true,personal:true,write:true},
 'storefront.product.publish':{min:3,peer_minor:1,local_only:true,personal:false,write:true}
});
const id725=x=>typeof x==='string'&&/^[A-Za-z0-9][A-Za-z0-9._:-]{0,99}$/.test(x);
const allowedPeer725=new Set(['ai-data-platform','rosevear-ai-hub','rosevear-comms-hub','icamp','yw','rosiedazzlers']);
const localTier725=tier=>OPERATIONAL_TIERS_723.indexOf(tier);
const iso725=x=>typeof x==='string'&&Number.isFinite(Date.parse(x))&&new Date(Date.parse(x)).toISOString()===x;
const policyHold725=(code,peer)=>({build:725,status:'HOLD_'+code,
 candidate_only:false,protocol:peer||null,cross_app_capability_accepted:false,
 local_operations_blocked:false,shared_authority_created:false,
 private_data_returned:false,provider_write:false,media_published:false,
 receiver_activated:false,financial_books_closed:false});
export function negotiateIndependentSync725(peer,capability){
 const c=CAPS_725[capability];
 const major=peer?.protocol?.major,minor=peer?.protocol?.minor;
 const result={build:725,local_protocol:'1.1',peer_protocol:
  Number.isInteger(major)&&Number.isInteger(minor)?major+'.'+minor:null,
  compatibility:'HOLD_MISSING_OR_UNKNOWN_PEER_VERSION',
  usable_for_capability:false,local_operations_continue:true,
  lockstep_release_required:false,peer_runtime_connected:false,
  authority_transfer:false};
 if(!c)return {...result,compatibility:'HOLD_UNKNOWN_CAPABILITY'};
 if(!peer?.available)return {...result,compatibility:'HOLD_PEER_UNAVAILABLE'};
 if(!Number.isInteger(major)||!Number.isInteger(minor)||major!==1||minor<0)
  return {...result,compatibility:'HOLD_INCOMPATIBLE_MAJOR_OR_VERSION'};
 if(!id725(peer.app_id)||!allowedPeer725.has(peer.app_id)||
  peer.topology_id!==INDEPENDENT_SYNC_725.topology_id)
  return {...result,compatibility:'HOLD_UNKNOWN_PEER_OR_TOPOLOGY'};
 if(minor<c.peer_minor)return {...result,compatibility:'HOLD_CAPABILITY_REQUIRES_PROTOCOL_1_1'};
 // Higher minor is additive within major 1. A breaking change must use major 2.
 return {...result,compatibility:minor===0?'LEGACY_1_0_CONTRACT_COMPATIBLE':
   'PROTOCOL_1_1_ADDITIVE_COMPATIBLE',
  usable_for_capability:true};
}
/* Candidate policy consumes source-verified evidence from the original owner;
 * it is NOT itself a public authority-enrollment endpoint or a signed ACK. */
export function assessConsentTenantCapability725(input={},now=Date.now()){
 const cap=String(input.capability||''),c=CAPS_725[cap];
 const mode=input.mode,peer=mode==='CROSS_APP'?
  negotiateIndependentSync725(input.peer,cap):null;
 const deny=code=>policyHold725(code,peer);
 if(!c||!['LOCAL','CROSS_APP'].includes(mode))return deny('UNKNOWN_CAPABILITY_OR_MODE');
 if(mode==='CROSS_APP'){
  if(!peer?.usable_for_capability)return deny('PEER_UNAVAILABLE_OR_INCOMPATIBLE');
  if(c.local_only||c.write)return deny('CROSS_APP_WRITE_OR_LOCAL_ONLY_CAPABILITY');
 }
 const tier=localTier725(input.actor?.tier);
 if(tier<0||tier<c.min||tier>=4)return deny('INVALID_OR_ELEVATED_ACTOR_TIER');
 if(c.min>0&&(input.actor?.identity_verified!==true||input.actor?.account_active!==true))
  return deny('ACTIVE_SOURCE_IDENTITY_REQUIRED');
 if(!id725(input.company_id)||!id725(input.actor?.company_id)||
  input.company_id!==input.actor.company_id||
  !id725(input.resource?.company_id)||
  input.resource.company_id!==input.company_id)
  return deny('COMPANY_BOUNDARY');
 if(!id725(input.tenant_id)||!id725(input.workspace_id)||
  input.actor?.tenant_id!==input.tenant_id||input.actor?.workspace_id!==input.workspace_id||
  input.resource?.tenant_id!==input.tenant_id||
  input.resource?.workspace_id!==input.workspace_id)
  return deny('TENANT_OR_WORKSPACE_ISOLATION');
 if(input.resource?.source_verified!==true||!id725(input.resource?.resource_id)||
   !id725(input.resource?.source_revision))
  return deny('ORIGINAL_RESOURCE_OWNERSHIP_UNVERIFIED');
 if(c.min>=3&&(input.actor?.company_operator_grant!==true||
   input.actor?.module_permission_verified!==true||
   input.actor?.module_key!==(cap.startsWith('media.')?'creators':'storefront')))
  return deny('EXACT_COMPANY_MODULE_GRANT');
 if(c.write&&input.original_owner_write_authorization!==true)
  return deny('ORIGINAL_OWNER_WRITE_AUTHORIZATION_REQUIRED');
 if(c.personal){
  const consent=input.consent,issued=Date.parse(consent?.issued_at),expires=Date.parse(consent?.expires_at);
  if(consent?.original_source_verified!==true||!id725(consent?.consent_id)||
   consent?.withdrawn===true||consent?.revoked===true||
   consent?.subject_id!==input.resource?.subject_id||
   consent?.company_id!==input.company_id||consent?.tenant_id!==input.tenant_id||
   consent?.workspace_id!==input.workspace_id||
   consent?.purpose!==(cap.startsWith('media.')?'maker_media_review':'private_storefront_read')||
   !Array.isArray(consent?.capabilities)||!consent.capabilities.includes(cap)||
   consent.capabilities.some(v=>!Object.hasOwn(CAPS_725,v))||
   !iso725(consent.issued_at)||!iso725(consent.expires_at)||
   !Number.isFinite(issued)||issued>now||expires<=now||expires-issued>86400000)
   return deny('ORIGINAL_PURPOSE_PINNED_CONSENT_MISSING_WITHDRAWN_OR_EXPIRED');
 }
 if(mode==='CROSS_APP'){
  const d=input.delegation;
  const issued=Date.parse(d?.issued_at),expires=Date.parse(d?.expires_at);
  if(d?.original_source_verified!==true||d?.revoked===true||
   !id725(d?.grant_id)||d.capability!==cap||
   d.audience!==input.peer.app_id||d.source_app!=='devilndove'||
   d.company_id!==input.company_id||d.tenant_id!==input.tenant_id||
   d.workspace_id!==input.workspace_id||
   d.consent_id!==(c.personal?input.consent?.consent_id:null)||
   d.parent_grant_id!==null||d.subdelegation_allowed!==false||
   d.authority_transfer!==false||d.t5_allowed!==false||
   d.owner_gated_write_allowed!==false||
   !iso725(d.issued_at)||!iso725(d.expires_at)||
   !Number.isFinite(issued)||issued>now||expires<=now||expires-issued>86400000)
   return deny('DELEGATION_SCOPE_REVOCATION_OR_EXPIRY');
 }
 return {build:725,status:'CANDIDATE_SOURCE_SCOPE_MATCH_RUNTIME_AUTH_REQUIRED',
  candidate_only:true,protocol:peer,source_scoped_capability:cap,
  cross_app_capability_accepted:false,local_operations_blocked:false,
  shared_authority_created:false,private_data_returned:false,
  provider_write:false,media_published:false,receiver_activated:false,
  financial_books_closed:false};
}
export function independentReleaseStatus725(){
 return {build:725,topology_id:INDEPENDENT_SYNC_725.topology_id,
  local_protocol:'1.1',backward_compatible_with:'1.0',
  lockstep_release_required:false,local_additive_release_allowed:true,
  old_peer_readonly_health_capability_supported:true,
  new_delegated_capabilities_require_1_1:true,
  consent_tenant_and_workspace_fail_closed:true,
  personal_data_needs_original_purpose_consent:true,
  delegated_capability_max_hours:24,subdelegation_allowed:false,
  t5_delegable:false,authority_transfer:false,
  raw_secret_synchronization:false,peer_database_sync:false,
  unavailable_peer_blocks_only_dependent_capability:true,
  old_protocol_1_0_routes_unchanged:true,
  runtime_peer_handshake_verified:false,cross_app_connected:false,
  owner_completion_percent_verified:null};
}
