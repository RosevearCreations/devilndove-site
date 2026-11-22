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
// Build 162
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
  '/admin/dovlin-readiness',
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
  '/admin/account-help-review',
]);
// Build 398
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
  '/api/admin/after-sale-746',
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
  '/api/admin/dovlin-readiness-744',
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
  '/api/admin/privacy-retry-audit-741',
  '/api/admin/privacy-sender-ceremony-740',
  '/api/admin/account-help-review-738',
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
/* Explicit cross-app credentials are never accepted by legacy owner routes.
 * Existing local browser/product workflows remain unchanged. */
export function denyUnenrolledDelegatedAdmin725(request,body=null){
 const h=request?.headers;
 return Boolean(h?.has?.('x-rosevear-delegated-capability')||
  h?.has?.('x-rosevear-sync-protocol')||
  (body&&typeof body==='object'&&(Object.hasOwn(body,'delegated_capability')||
    Object.hasOwn(body,'cross_app_authority'))));
}
// Devil n Dove Build 727 — original-app DLP, consent and encrypted evidence primitives.
const text = (v) => String(v ?? '').trim();
const scope = (v) => text(v).toLowerCase();
const SHA256 = /^[a-f0-9]{64}$/i;
const SENSITIVE_KEY = /(?:^|_)(?:customer|client|card|cvv|cvc|pan|payment|billing|email|phone|address|postal|token|secret|password|private|raw|file|media_url|image_url|full_name)(?:_|$)/i;
const EMAIL = /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i;
const SECRET = /\b(?:sk_live_|rk_live_|whsec_|Bearer\s+[A-Za-z0-9._~-]{10,}|access[_-]?token\s*[=:])\S*/i;
const PHONE = /(?:\+?1[\s.-]?)?\(?[2-9]\d{2}\)?[\s.-]?[2-9]\d{2}[\s.-]?\d{4}\b/;
function luhn(candidate) {
  const digits = candidate.replace(/\D/g,'');
  if(digits.length < 13 || digits.length > 19 || /^(\d)\1+$/.test(digits)) return false;
  let sum=0,flip=false;
  for(let i=digits.length-1;i>=0;i--){let d=+digits[i];if(flip){d*=2;if(d>9)d-=9;}sum+=d;flip=!flip;}
  return sum%10===0;
}
export function inspectOutboundText727(value) {
  const content = text(value).slice(0,20000);
  const codes = [];
  if(EMAIL.test(content))codes.push('EMAIL');
  if(SECRET.test(content))codes.push('PAYMENT_SECRET_OR_BEARER');
  if(PHONE.test(content))codes.push('PHONE');
  const numeric = content.match(/(?:\d[ -]?){13,19}/g) || [];
  if(numeric.some(luhn))codes.push('PAYMENT_CARD');
  return {clear:codes.length===0,findings:codes,raw_value_exposed:false};
}
export function inspectOutboundEnvelope727(payload) {
  const findings=new Set();
  let count=0;
  const visit=(item,depth=0)=>{
    if(depth>6 || ++count>250){findings.add('OVERSIZED_OR_DEEP_ENVELOPE');return;}
    if(Array.isArray(item)){for(const v of item)visit(v,depth+1);return;}
    if(item && typeof item==='object'){
      for(const [key,val] of Object.entries(item)){
        if(SENSITIVE_KEY.test(key))findings.add('PRIVATE_FIELD');
        visit(val,depth+1);
      }
    } else if(typeof item==='string'){
      for(const f of inspectOutboundText727(item).findings)findings.add(f);
    }
  };
  visit(payload);
  return {allowed:findings.size===0,findings:[...findings],raw_value_exposed:false};
}
export function clampConsentFlags727(status,kind,publicRequested,socialRequested,expiresAt,now=Date.now()){
  const state=scope(status),use=scope(kind);
  const granted=['granted','approved','not_required'].includes(state);
  const expires=text(expiresAt);
  const fresh=!expires || (Number.isFinite(Date.parse(expires)) && Date.parse(expires)>now);
  const publicScope=['product_page','website_gallery','all_public'].includes(use);
  const socialScope=['social_post','all_public'].includes(use);
  return {
    public_use_allowed:granted&&fresh&&publicScope&&publicRequested?1:0,
    social_use_allowed:granted&&fresh&&socialScope&&socialRequested?1:0
  };
}
export function consentIsLive727(record,usage='social',now=Date.now()){
  if(!record || !['granted','approved'].includes(scope(record.consent_status)))return false;
  if(record.expires_at){
    const expiry=Date.parse(record.expires_at);
    if(!Number.isFinite(expiry)||expiry<=now)return false;
  }
  const kind=scope(record.consent_scope);
  if(usage==='social')return Number(record.social_use_allowed)===1&&['social_post','all_public'].includes(kind);
  if(usage==='public')return Number(record.public_use_allowed)===1&&['product_page','website_gallery','all_public'].includes(kind);
  return false;
}
export function evaluateMediaPublication727(row={},records=[],urls=[],now=Date.now()){
  const sourceType=scope(row.source_type),sourceId=text(row.source_id);
  const customer=Number(row.customer_media_present||0)===1;
  const scoped=/customer|client|job|custom.request|caip_project/i.test(sourceType);
  const requires=customer||scoped||Number(row.media_consent_required||0)===1;
  if(!requires)return {allowed:true,code:'NO_CONSENT_MATERIAL_DECLARED',checked_urls:0};
  const sameSource=(r)=>sourceType&&sourceId&&scope(r.source_type)===sourceType&&text(r.source_id)===sourceId;
  const match=(r,url)=>sameSource(r) && (!url||text(r.media_url)===url);
  const links=Array.isArray(urls)?urls.filter(v=>typeof v==='string'&&v.trim()).slice(0,24):[];
  if(!sourceType||!sourceId)return {allowed:false,code:'HOLD_MISSING_SOURCE_IDENTITY',checked_urls:links.length};
  if(records.some(r=>sameSource(r)&&['revoked','blocked'].includes(scope(r.consent_status))))
    return {allowed:false,code:'HOLD_WITHDRAWN_OR_BLOCKED_CONSENT',checked_urls:links.length};
  if(links.length){
    if(links.some(url=>!records.some(r=>match(r,url)&&consentIsLive727(r,'social',now))))
      return {allowed:false,code:'HOLD_EXACT_MEDIA_CONSENT',checked_urls:links.length};
  } else if(!records.some(r=>sameSource(r)&&consentIsLive727(r,'social',now))){
    return {allowed:false,code:'HOLD_SOURCE_CONSENT',checked_urls:0};
  }
  return {allowed:true,code:'ORIGINAL_SCOPED_CONSENT_VERIFIED',checked_urls:links.length};
}
export function assessRetention727(evidence={},now=Date.now()){
  if(evidence.legal_hold===true)return {status:'HOLD_LEGAL_HOLD',auto_delete:false};
  const days=Number(evidence.retention_days),created=Date.parse(text(evidence.created_at));
  if(!Number.isInteger(days)||days<1||days>3650||!Number.isFinite(created)||created>now)
    return {status:'HOLD_INVALID_RETENTION_EVIDENCE',auto_delete:false};
  if(created+days*86400000>now)return {status:'HOLD_WITHIN_RETENTION',auto_delete:false};
  if(evidence.archive_hash_verified!==true||!SHA256.test(text(evidence.archive_sha256)))
    return {status:'HOLD_NO_VERIFIED_ARCHIVE',auto_delete:false};
  if(evidence.owner_approved!==true)return {status:'HOLD_OWNER_APPROVAL',auto_delete:false};
  return {status:'CANDIDATE_SUPERVISED_PURGE',auto_delete:false};
}
export function consentWithdrawalHandoff727(record){
  return {build:727,consent_key_present:!!record?.consent_key,
    original_source_status:'REVOKED_LOCAL',
    public_use_allowed:false,social_use_allowed:false,
    local_queue_review:'REQUIRED',external_publication_recall:'HOLD_OPERATOR_HANDOFF',
    remote_peer_delivery:'NOT_SENT',deletion_execution:'NOT_PERFORMED',
    original_host_receiver_activation:false};
}
export async function encryptEvidence727(payload,keyBase64,context){
  const keyText=text(keyBase64);
  if(!keyText||!context||!text(context.tenant_id)||!text(context.purpose))
    throw new Error('HOLD_ENCRYPTION_KEY_OR_AAD_MISSING');
  if(typeof payload!=='object'||payload===null)
    throw new Error('HOLD_INVALID_EVIDENCE');
  const plain=JSON.stringify(payload);
  if(plain.length>4096)throw new Error('HOLD_EVIDENCE_TOO_LARGE');
  let raw;try{raw=Uint8Array.from(atob(keyText),c=>c.charCodeAt(0));}catch{throw new Error('HOLD_INVALID_ENCRYPTION_KEY');}
  if(raw.length!==32)throw new Error('HOLD_INVALID_ENCRYPTION_KEY');
  const key=await crypto.subtle.importKey('raw',raw,'AES-GCM',false,['encrypt']);
  const iv=crypto.getRandomValues(new Uint8Array(12));
  const aad=new TextEncoder().encode('dnd727:'+text(context.tenant_id)+':'+text(context.purpose));
  const ciphertext=new Uint8Array(await crypto.subtle.encrypt({name:'AES-GCM',iv,additionalData:aad},key,new TextEncoder().encode(plain)));
  const b64url=(bytes)=>btoa(Array.from(bytes,b=>String.fromCharCode(b)).join('')).replace(/\+/g,'-').replace(/\//g,'_').replace(/=/g,'');
  return {v:1,algorithm:'AES-256-GCM',iv:b64url(iv),ciphertext:b64url(ciphertext),
    plaintext_returned:false,stored:false,delivered:false,tenant_bound:true};
}
export const BUILD727_DATA_PROTECTION=Object.freeze({
  build:727,application:'devilndove',local_only:true,protocol:'1.1',
  encrypt_requires_provisioned_secret:true,automatic_deletion_enabled:false,
  external_consent_withdrawal_delivery_enabled:false,unconfigured_treated_as_green:false
});

/* Build 728. Encryption keys are Cloudflare secrets, never response or D1 values. */
const hex728=bytes=>Array.from(bytes,b=>b.toString(16).padStart(2,'0')).join('');
const enc728=value=>new TextEncoder().encode(String(value));
export const digest728=async value=>hex728(new Uint8Array(await crypto.subtle.digest('SHA-256',typeof value==='string'?enc728(value):value)));
export const b64url728=bytes=>btoa(Array.from(bytes,b=>String.fromCharCode(b)).join('')).replace(/\+/g,'-').replace(/\//g,'_').replace(/=/g,'');
export function bytes728(value){
 if(typeof value!=='string'||!/^[A-Za-z0-9_-]+={0,2}$/.test(value)||value.length>8192)throw Error('HOLD_INVALID_BASE64URL');
 const norm=value.replace(/-/g,'+').replace(/_/g,'/');
 return Uint8Array.from(atob(norm+'='.repeat((4-norm.length%4)%4)),c=>c.charCodeAt(0));
}
export function resolveKeyring728(env={}){
 const activeId=String(env.DND728_ACTIVE_KEY_ID||'');
 const olderId=String(env.DND728_PREVIOUS_KEY_ID||'');
 const good=/^[a-zA-Z0-9_-]{6,64}$/;
 const keys=new Map();
 for(const [id,value] of [[activeId,env.DND728_ACTIVE_KEY_B64URL],[olderId,env.DND728_PREVIOUS_KEY_B64URL]]){
  if(!id&&!value)continue;
  if(!good.test(id)||typeof value!=='string')return {ready:false,reason:'HOLD_INVALID_KEYRING',keys:new Map(),active_id:null};
  try {const k=bytes728(value);if(k.length!==32||keys.has(id))throw Error();keys.set(id,k);}
  catch {return {ready:false,reason:'HOLD_INVALID_KEYRING',keys:new Map(),active_id:null};}
 }
 return {ready:good.test(activeId)&&keys.has(activeId),reason:keys.has(activeId)?'READY':'HOLD_NO_ACTIVE_ENCRYPTION_KEY',
  active_id:keys.has(activeId)?activeId:null,keys};
}
const aad728=(id,tenant,purpose,version,kid)=>enc728(['dnd','728',id,tenant,purpose,version,kid].join(':'));
export async function vaultEncrypt728(payload,key,kid,tenant,purpose,id,version=1){
 if(!(key instanceof Uint8Array)||key.length!==32||!/^[-a-zA-Z0-9]{6,64}$/.test(kid)||
  !/^[a-f0-9]{64}$/.test(tenant)||!['consent_withdrawal','security_evidence','retention_review'].includes(purpose)||
  !/^[0-9a-f-]{36}$/.test(id)||!Number.isSafeInteger(version)||version<1)throw Error('HOLD_ENCRYPTION_SCOPE');
 const plain=JSON.stringify(payload);
 if(!payload||typeof payload!=='object'||Array.isArray(payload)||plain.length>4096||plain.length<2)
  throw Error('HOLD_PLAINTEXT_SIZE');
 const iv=crypto.getRandomValues(new Uint8Array(12));
 const wk=await crypto.subtle.importKey('raw',key,'AES-GCM',false,['encrypt']);
 const encrypted=new Uint8Array(await crypto.subtle.encrypt({name:'AES-GCM',iv,additionalData:aad728(id,tenant,purpose,version,kid)},wk,enc728(plain)));
 return {key_id:kid,version,iv_b64url:b64url728(iv),ciphertext_b64url:b64url728(encrypted),
  ciphertext_sha256:await digest728(encrypted),plaintext_returned:false};
}
export async function vaultDecryptForRotation728(record,key,tenant,purpose,id){
 if(!(key instanceof Uint8Array)||key.length!==32||!record||!/^\d+$/.test(String(record.version)))throw Error('HOLD_ROTATION_KEY');
 const bytes=bytes728(record.ciphertext_b64url),iv=bytes728(record.iv_b64url);
 if(iv.length!==12||!((await digest728(bytes))===record.ciphertext_sha256))throw Error('HOLD_CIPHERTEXT_INTEGRITY');
 const wk=await crypto.subtle.importKey('raw',key,'AES-GCM',false,['decrypt']);
 const plain=await crypto.subtle.decrypt({name:'AES-GCM',iv,additionalData:aad728(id,tenant,purpose,Number(record.version),record.key_id)},wk,bytes);
 return JSON.parse(new TextDecoder().decode(plain));
}
export async function hmacScope728(keyBase64,value){
 const key=bytes728(keyBase64);if(key.length!==32)throw Error('HOLD_WITHDRAWAL_HMAC_KEY');
 const wk=await crypto.subtle.importKey('raw',key,{name:'HMAC',hash:'SHA-256'},false,['sign']);
 return hex728(new Uint8Array(await crypto.subtle.sign('HMAC',wk,enc728(value))));
}
export function retentionEligibility728(v,review=null,latest=null,now=Date.now()){
 if(!v||!latest)return 'HOLD_EVIDENCE_MISSING';
 if(Number(v.legal_hold)!==0)return 'HOLD_LEGAL_HOLD';
 const created=Date.parse(v.created_at+'Z'),days=Number(v.retention_days);
 if(!Number.isFinite(created)||!Number.isSafeInteger(days)||days<1||days>3650||created+days*86400000>now)
  return 'HOLD_RETENTION_NOT_ELAPSED';
 if(review&&(review.source_ciphertext_sha256!==latest.ciphertext_sha256))
  return 'HOLD_CIPHER_VERSION_DRIFT';
 return 'ELIGIBLE_FOR_INDEPENDENT_REVIEW';
}
export async function verifyLiveWithdrawalAck728(body,event,publicKey,now=Date.now()){
 const a=body?.ack,s=body?.signature;
 const fail={verified:false,status:'HOLD_UNVERIFIED_SIGNED_PEER_ACK'};
 if(!a||typeof s!=='string'||!event)return fail;
 const keys=['schema_id','event_id','target_app','request_nonce','scope_hmac_sha256','outcome','issued_at','expires_at'];
 if(Object.keys(a).sort().join('|')!==[...keys].sort().join('|')||
  a.schema_id!=='rosevear.dnd.consent.withdrawal.ack.v1'||
  a.event_id!==event.event_id||a.target_app!==event.target_app||
  a.request_nonce!==event.request_nonce||a.scope_hmac_sha256!==event.scope_hmac_sha256||
  a.outcome!=='RECEIVED')return fail;
 const issued=Date.parse(a.issued_at),expiry=Date.parse(a.expires_at);
 if(!Number.isFinite(issued)||!Number.isFinite(expiry)||issued>now+30000||now-issued>300000||expiry<=now||expiry-issued>300000)return fail;
 try{
  const pk=bytes728(publicKey),sig=bytes728(s);
  if(pk.length!==32||sig.length!==64)return fail;
  const wk=await crypto.subtle.importKey('raw',pk,{name:'Ed25519'},false,['verify']);
  if(!await crypto.subtle.verify({name:'Ed25519'},wk,sig,enc728(JSON.stringify(Object.fromEntries(keys.map(k=>[k,a[k]]))))))return fail;
  return {verified:true,status:'LIVE_SIGNED_RECEIPT_VERIFIED',receipt_sha256:await digest728(JSON.stringify(a)),
   original_data_deleted:false,original_host_receiver_activated:false};
 }catch{return fail;}
}
export const BUILD728_POLICY=Object.freeze({build:728,protocol:'1.1',legacy_1_0_health_preserved:true,
 local_source_only_default:true,no_lockstep_release:true,plaintext_to_other_apps:false,
 automated_purge:false,unconfigured_transport:'HOLD',require_distinct_retention_actors:3});


/* Build 729: only an original live pinned Ed25519 response can prove peer possession. */
export const BUILD729_PEERS=Object.freeze(['ai-data-platform','rosevear-ai-hub','rosevear-comms-hub']);
export function peerConfig729(env={},app){
 if(!BUILD729_PEERS.includes(app))return {ready:false,reason:'HOLD_UNKNOWN_PEER'};
 const prefix='DND728_PEER_'+app.replace(/-/g,'_').toUpperCase()+'_';
 const raw=String(env[prefix+'URL']||''),receipt=String(env[prefix+'ENROLLMENT_RECEIPT']||'');
 try{
  const url=new URL(raw),public_key=String(env[prefix+'PUBLIC_KEY_B64URL']||'');
  const hmac_key=String(env[prefix+'HMAC_KEY_B64URL']||'');
  if(url.protocol!=='https:'||url.username||url.password||url.port||url.search||url.hash||
     !/^[a-z0-9.-]+\.[a-z]{2,}$/i.test(url.hostname)||
     /^(localhost|127\.|10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.|169\.254\.|0\.|.*\.local$)/i.test(url.hostname)||
     bytes728(public_key).length!==32||bytes728(hmac_key).length!==32||
     !/^[A-Za-z0-9._:-]{16,128}$/.test(receipt))
   return {ready:false,reason:'HOLD_MISSING_OR_INVALID_ORIGINAL_PEER_ENROLLMENT'};
  return {ready:true,url:url.href,public_key,hmac_key,receipt};
 }catch{return {ready:false,reason:'HOLD_MISSING_OR_INVALID_ORIGINAL_PEER_ENROLLMENT'};}
}
export async function verifyPeerChallenge729(body,challenge,pinnedKey,now=Date.now()){
 const fail={verified:false,status:'HOLD_UNVERIFIED_PEER_ENROLLMENT'};
 const ack=body?.ack,signature=body?.signature;
 const keys=['schema_id','peer_app','challenge_nonce','challenge_sha256','outcome','issued_at','expires_at'];
 if(!ack||typeof signature!=='string'||!challenge||
    Object.keys(ack).sort().join('|')!==[...keys].sort().join('|')||
    ack.schema_id!=='rosevear.dnd.peer.enrollment.ack.v1'||
    ack.peer_app!==challenge.to_app||ack.challenge_nonce!==challenge.nonce||
    ack.challenge_sha256!==await digest728(JSON.stringify(challenge))||
    ack.outcome!=='ENROLLED')return fail;
 const issued=Date.parse(ack.issued_at),expires=Date.parse(ack.expires_at);
 if(!Number.isFinite(issued)||!Number.isFinite(expires)||
    issued>now+30000||now-issued>180000||expires<=now||expires-issued>180000)return fail;
 try{
  const pk=bytes728(pinnedKey),sig=bytes728(signature);
  if(pk.length!==32||sig.length!==64)return fail;
  const key=await crypto.subtle.importKey('raw',pk,{name:'Ed25519'},false,['verify']);
  if(!await crypto.subtle.verify({name:'Ed25519'},key,sig,
    enc728(JSON.stringify(Object.fromEntries(keys.map(k=>[k,ack[k]]))))))return fail;
  return {verified:true,status:'LIVE_PEER_POSSESSION_VERIFIED',
   receipt_sha256:await digest728(JSON.stringify(ack))};
 }catch{return fail;}
}
