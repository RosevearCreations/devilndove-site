import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {MODULE_KEYS,moduleKeyForPath,sharedServiceContractForPath,
 OPERATIONAL_TIERS_723,CONTROL_LAYERS_723,COMPLETION_AXES_723,
 MODULE_SCOPE_723,sixTierSecurityInventory723,assessTierCandidate723,
 sevenAxisCompletionBaseline723} from '../functions/api/_lib/appModuleRoutes.js';
import {onRequestGet} from '../functions/api/admin/production-variable-audit-406.js';
const inventory=sixTierSecurityInventory723();
assert.equal(inventory.build,723);
assert.equal(inventory.tiers.length,6);
assert.equal(inventory.layers.length,5);
assert.equal(inventory.route_catalog.length,15);
assert.ok(inventory.catalogued_declaration_count>100);
assert.equal(inventory.complete_deployed_endpoint_inventory,false);
assert.equal(inventory.all_tiers_enforced_globally,false);
assert.equal(inventory.authority_transfer,false);
assert.equal(inventory.cross_app_connected,false);
assert.equal(inventory.receiver_activated,false);
assert.equal(inventory.signed_three_master_transport,'NOT_VERIFIED');
assert.equal(inventory.original_host_t5_witness,'UNKNOWN_HOLD');
assert.deepEqual(inventory.tiers,OPERATIONAL_TIERS_723);
assert.deepEqual(inventory.layers,CONTROL_LAYERS_723);
assert.equal(moduleKeyForPath('/admin/products'),MODULE_KEYS.STOREFRONT);
assert.equal(moduleKeyForPath('/admin/mobile-product'),MODULE_KEYS.STOREFRONT);
assert.equal(moduleKeyForPath('/admin/social-publishing'),MODULE_KEYS.SOCIALS);
assert.equal(moduleKeyForPath('/admin/accounting'),MODULE_KEYS.FINANCIALS);
assert.equal(moduleKeyForPath('/api/admin/production-variable-audit-406'),MODULE_KEYS.STOREFRONT);
assert.equal(moduleKeyForPath('/api/admin/imaginary-privileged-route'),null);
assert.equal(moduleKeyForPath('/api/admin/app-modules'),null);
assert.equal(sharedServiceContractForPath('/api/admin/contracts/catalog-read')?.mutation,false);
assert.equal(sharedServiceContractForPath('/api/admin/contracts/inventory-post')?.mutation,true);
const unclassified=inventory.route_examples.find(x=>x.path==='/api/admin/imaginary-privileged-route');
assert.ok(unclassified.classification.startsWith('UNCLASSIFIED'));
const allow=(tier,capability,other={})=>assessTierCandidate723({tier,capability,...other});
let p=allow('T0_PUBLIC','public_catalog_read');
assert.equal(p.provisional_tier_eligible,true);
assert.equal(p.runtime_access_granted,false);
assert.equal(allow('T0_PUBLIC','own_account_read').provisional_tier_eligible,false);
assert.equal(allow('T1_SIGNED_IN','own_account_read',{identity_verified:true,account_active:true,self_resource_verified:true}).provisional_tier_eligible,true);
assert.equal(allow('T1_SIGNED_IN','own_account_read',{identity_verified:true,account_active:false,self_resource_verified:true}).provisional_tier_eligible,false);
assert.equal(allow('T1_SIGNED_IN','own_account_read',{identity_verified:true,account_active:true,self_resource_verified:false}).provisional_tier_eligible,false);
const tenant={identity_verified:true,account_active:true,tenant_id:'tenantA',resource_tenant_id:'tenantA',tenant_membership_verified:true};
assert.equal(allow('T2_TENANT','tenant_order_read',tenant).provisional_tier_eligible,true);
assert.equal(allow('T2_TENANT','tenant_order_read',{...tenant,resource_tenant_id:'tenantB'}).provisional_tier_eligible,false);
assert.equal(allow('T2_TENANT','tenant_order_read',{...tenant,tenant_membership_verified:false}).provisional_tier_eligible,false);
const admin={identity_verified:true,account_active:true,admin_role_verified:true,
 company_operator_grant:true,module_key:'storefront',module_permission_verified:true,
 company_id:'companyA',resource_company_id:'companyA'};
assert.equal(allow('T3_COMPANY_OPERATOR','operator_product_review',admin).provisional_tier_eligible,true);
assert.equal(allow('T3_COMPANY_OPERATOR','operator_product_review',{...admin,module_key:'socials'}).provisional_tier_eligible,false);
assert.equal(allow('T3_COMPANY_OPERATOR','operator_product_review',{...admin,company_id:'companyB'}).provisional_tier_eligible,false);
assert.equal(allow('T3_COMPANY_OPERATOR','operator_product_review',{...admin,admin_role_verified:false}).provisional_tier_eligible,false);
assert.equal(allow('T3_COMPANY_OPERATOR','operator_media_draft_review',{...admin,module_key:'creators'}).provisional_tier_eligible,false);
assert.equal(allow('T3_COMPANY_OPERATOR','operator_media_draft_review',{...admin,module_key:'creators',source_media_consent_verified:true}).provisional_tier_eligible,true);
assert.equal(allow('T3_COMPANY_OPERATOR','operator_finance_evidence_review',{...admin,module_key:'financials'}).provisional_tier_eligible,true);
for(const cap of ['master_readonly_governance','physical_receiver_activation']){
 const req={...admin,identity_verified:true,account_active:true,
  independent_master_signatures:true,original_physical_receiver_approved:true};
 const r=allow('T5_ORIGINAL_PHYSICAL_RECEIVER',cap,req);
 assert.equal(r.provisional_tier_eligible,false);
 assert.equal(r.runtime_access_granted,false);
 assert.equal(r.receiver_activated,false);
 assert.equal(r.financial_books_closed,false);
}
assert.equal(allow('T5_ORIGINAL_PHYSICAL_RECEIVER','unknown_owner_action',admin).provisional_tier_eligible,false);
assert.equal(allow('T3_COMPANY_OPERATOR','physical_receiver_activation',admin).provisional_tier_eligible,false);
const b=sevenAxisCompletionBaseline723();
assert.equal(b.build,723);
assert.deepEqual(b.axes.map(a=>a.axis),COMPLETION_AXES_723);
assert.equal(b.scope_count,MODULE_SCOPE_723.length);
assert.equal(b.proposed_check_count,MODULE_SCOPE_723.length*COMPLETION_AXES_723.length);
assert.equal(b.verified_baseline_count,null);
assert.equal(b.application_completion_percent,null);
assert.equal(b.percentage_point_gain_verified,false);
assert.equal(b.original_signed_owner_approval,false);
for(const a of b.axes){
 assert.equal(a.owner_approved_denominator,null);
 assert.equal(a.original_verified_numerator,null);
 assert.equal(a.verified_percent,null);
 assert.equal(a.target_10pp_percent,null);
 assert.equal(a.scopes.length,MODULE_SCOPE_723.length);
 assert.equal(a.verification_status,'UNMEASURED_PENDING_OWNER_APPROVAL');
}
const forged=sevenAxisCompletionBaseline723({explicit_owner_approval:true,original_source_verified:true,
 production_sha:'a'.repeat(40),axes:COMPLETION_AXES_723.map(axis=>({
 axis,denominator:11,verified_passes:11,original_evidence_verified:true
}))});
assert.equal(forged.original_signed_owner_approval,false,'Untrusted boolean provenance must not establish evidence');
assert.equal(forged.verified_baseline_count,null);
const auth={request:new Request('https://devilndove.com/api/admin/production-variable-audit-406?review=723'),
 env:{SESSION_SECRET:'sensitive-hidden-value-723'},
 data:{ddModuleAccess:{allowed:true,user:{role:'admin',is_active:1,user_id:72}}}};
const response=await onRequestGet(auth);assert.equal(response.status,200);
assert.equal(response.headers.get('Cache-Control'),'no-store');
const out=await response.json();
assert.equal(out.review723.inventory.build,723);
assert.equal(out.review723.completion.build,723);
assert.equal(out.review723.owner_10pp_gain_verified,false);
assert.equal(out.review723.seven_app_runtime_connected,false);
assert.equal(out.review723.original_t5_ceremony_authorized,false);
assert.ok(!JSON.stringify(out).includes('sensitive-hidden-value-723'));
assert.equal((await onRequestGet({...auth,data:{ddModuleAccess:{allowed:true,user:{role:'customer',is_active:1,user_id:72}}}})).status,401);
assert.equal((await onRequestGet({...auth,data:{}})).status,401);
const html=readFileSync(new URL('../admin/it-integrations/index.html',import.meta.url),'utf8');
const client=readFileSync(new URL('../public/js/admin-production-variable-audit-v406.js',import.meta.url),'utf8');
const api=readFileSync(new URL('../functions/api/admin/production-variable-audit-406.js',import.meta.url),'utf8');
assert.ok(html.includes('dd723-trust-baseline')&&html.includes('/public/js/admin-production-variable-audit-v406.js?v='));
assert.ok(client.includes('dd723Inspect')&&client.includes('review=723'));
assert.ok(api.includes('verifiedAdminFromModule(c)'));
assert.ok(api.includes('sevenAxisCompletionBaseline723()'));
console.log('Build 723 six-tier zero-trust source mapping, role/tenant/consent negative & 77-axis-scope UNKNOWN denominator: PASS');
