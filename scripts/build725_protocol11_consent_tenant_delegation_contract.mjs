import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {INDEPENDENT_SYNC_725,negotiateIndependentSync725,
 assessConsentTenantCapability725,independentReleaseStatus725,
 denyUnenrolledDelegatedAdmin725} from '../functions/api/_lib/appModuleRoutes.js';
import {onRequestGet} from '../functions/api/admin/production-variable-audit-406.js';

const now=Date.UTC(2026,10,15,21,30,0),iso=v=>new Date(v).toISOString();
const peer=(minor=1)=>({protocol:{major:1,minor},available:true,
 app_id:'ai-data-platform',topology_id:'rosevear-master-shell-seven-apps.v1'});
assert.equal(INDEPENDENT_SYNC_725.local.major,1);
assert.equal(INDEPENDENT_SYNC_725.local.minor,1);
assert.equal(negotiateIndependentSync725(peer(0),'health.read').usable_for_capability,true);
assert.equal(negotiateIndependentSync725(peer(0),'capabilities.read').usable_for_capability,true);
assert.equal(negotiateIndependentSync725(peer(0),'storefront.product.read').usable_for_capability,false);
assert.equal(negotiateIndependentSync725(peer(0),'media.draft.read').compatibility,'HOLD_CAPABILITY_REQUIRES_PROTOCOL_1_1');
assert.equal(negotiateIndependentSync725(peer(1),'media.draft.read').usable_for_capability,true);
assert.equal(negotiateIndependentSync725(peer(2),'media.draft.read').usable_for_capability,true);
assert.equal(negotiateIndependentSync725({...peer(),protocol:{major:2,minor:0}},'health.read').usable_for_capability,false);
assert.equal(negotiateIndependentSync725({...peer(),available:false},'health.read').compatibility,'HOLD_PEER_UNAVAILABLE');
assert.equal(negotiateIndependentSync725({...peer(),app_id:'untrusted-peer'},'health.read').usable_for_capability,false);
assert.equal(negotiateIndependentSync725({...peer(),topology_id:'other'},'health.read').usable_for_capability,false);
assert.equal(negotiateIndependentSync725(peer(),'owner.receiver.on').compatibility,'HOLD_UNKNOWN_CAPABILITY');
for(const c of ['health.read','media.draft.read','owner.receiver.on']){
 const negotiation=negotiateIndependentSync725({...peer(),available:false},c);
 assert.equal(negotiation.local_operations_continue,true);
 assert.equal(negotiation.lockstep_release_required,false);
 assert.equal(negotiation.peer_runtime_connected,false);
}
const shared={mode:'LOCAL',company_id:'devilndove',tenant_id:'tenant-01',
 workspace_id:'workshop-01',resource:{company_id:'devilndove',
 tenant_id:'tenant-01',workspace_id:'workshop-01',
 resource_id:'product-123',source_revision:'rev-123',source_verified:true,
 subject_id:'customer-01'},
 actor:{tier:'T3_COMPANY_OPERATOR',identity_verified:true,account_active:true,
 company_id:'devilndove',tenant_id:'tenant-01',workspace_id:'workshop-01',
 company_operator_grant:true,module_permission_verified:true,module_key:'creators'}};
const consent={consent_id:'original-consent-725',original_source_verified:true,
 company_id:'devilndove',tenant_id:'tenant-01',workspace_id:'workshop-01',
 subject_id:'customer-01',purpose:'maker_media_review',capabilities:['media.draft.read','media.draft.review'],
 withdrawn:false,revoked:false,issued_at:iso(now-60000),expires_at:iso(now+3600000)};
const media={...shared,capability:'media.draft.read',consent};
const local=assessConsentTenantCapability725(media,now);
assert.equal(local.candidate_only,true);
assert.equal(local.private_data_returned,false);
assert.equal(local.cross_app_capability_accepted,false);
assert.equal(local.provider_write,false);
assert.equal(local.receiver_activated,false);
for(const mutation of [
 {resource:{...media.resource,tenant_id:'tenant-other'}},
 {resource:{...media.resource,workspace_id:'workshop-other'}},
 {resource:{...media.resource,company_id:'other-company'}},
 {resource:{...media.resource,source_verified:false}},
 {resource:{...media.resource,subject_id:'other-subject'}},
 {actor:{...media.actor,tenant_id:'other-tenant'}},
 {actor:{...media.actor,workspace_id:'other-workspace'}},
 {actor:{...media.actor,identity_verified:false}},
 {actor:{...media.actor,account_active:false}},
 {actor:{...media.actor,company_operator_grant:false}},
 {actor:{...media.actor,module_permission_verified:false}},
 {actor:{...media.actor,module_key:'storefront'}},
 {consent:{...consent,withdrawn:true}},
 {consent:{...consent,revoked:true}},
 {consent:{...consent,original_source_verified:false}},
 {consent:{...consent,purpose:'public_advertising'}},
 {consent:{...consent,expires_at:iso(now-1)}},
 {consent:{...consent,issued_at:iso(now+5000)}},
 {consent:{...consent,subject_id:'other-subject'}},
 {consent:{...consent,workspace_id:'other-workspace'}},
 {consent:{...consent,tenant_id:'other-tenant'}},
 {consent:{...consent,capabilities:['media.draft.review']}},
 {consent:{...consent,capabilities:['media.draft.read','wildcard.*']}}
]){
 const assessed=assessConsentTenantCapability725({...media,...mutation},now);
 assert.equal(assessed.candidate_only,false,'MUST reject '+JSON.stringify(mutation));
 assert.equal(assessed.local_operations_blocked,false);
}
const publication=assessConsentTenantCapability725({...media,capability:'media.draft.review',
 original_owner_write_authorization:true},now);
assert.equal(publication.candidate_only,true);
assert.equal(publication.media_published,false);
assert.equal(assessConsentTenantCapability725({...media,capability:'media.draft.review'},now).candidate_only,false);
const validDelegation={grant_id:'grant-725-test',original_source_verified:true,revoked:false,
 source_app:'devilndove',audience:'ai-data-platform',capability:'media.draft.read',
 company_id:'devilndove',tenant_id:'tenant-01',workspace_id:'workshop-01',
 consent_id:consent.consent_id,parent_grant_id:null,subdelegation_allowed:false,
 authority_transfer:false,t5_allowed:false,owner_gated_write_allowed:false,
 issued_at:iso(now-300000),expires_at:iso(now+86400000-300000)};
const remote={...media,mode:'CROSS_APP',peer:peer(),delegation:validDelegation};
const accepted=assessConsentTenantCapability725(remote,now);
assert.equal(accepted.candidate_only,true);
assert.equal(accepted.cross_app_capability_accepted,false);
assert.equal(accepted.protocol.usable_for_capability,true);
assert.equal(accepted.protocol.peer_runtime_connected,false);
for(const altered of [
 {peer:peer(0)},{peer:{...peer(),available:false}},
 {delegation:{...validDelegation,revoked:true}},
 {delegation:{...validDelegation,original_source_verified:false}},
 {delegation:{...validDelegation,capability:'media.draft.review'}},
 {delegation:{...validDelegation,audience:'rosiedazzlers'}},
 {delegation:{...validDelegation,tenant_id:'other-tenant'}},
 {delegation:{...validDelegation,workspace_id:'other-workspace'}},
 {delegation:{...validDelegation,company_id:'other-company'}},
 {delegation:{...validDelegation,consent_id:'other-consent'}},
 {delegation:{...validDelegation,parent_grant_id:'prior-grant'}},
 {delegation:{...validDelegation,subdelegation_allowed:true}},
 {delegation:{...validDelegation,authority_transfer:true}},
 {delegation:{...validDelegation,t5_allowed:true}},
 {delegation:{...validDelegation,owner_gated_write_allowed:true}},
 {delegation:{...validDelegation,expires_at:iso(now+86400001)}},
 {delegation:{...validDelegation,issued_at:iso(now+5000)}},
 {delegation:{...validDelegation,expires_at:iso(now-1)}}
]){
 const assessed=assessConsentTenantCapability725({...remote,...altered},now);
 assert.equal(assessed.candidate_only,false,'MUST deny '+JSON.stringify(altered));
 assert.equal(assessed.local_operations_blocked,false);
 assert.equal(assessed.receiver_activated,false);
}
const crossWrite=assessConsentTenantCapability725({
 ...remote,capability:'media.draft.review',original_owner_write_authorization:true,
 delegation:{...validDelegation,capability:'media.draft.review'}},now);
assert.equal(crossWrite.candidate_only,false);
assert.equal(crossWrite.media_published,false);
const localWithoutPeer=assessConsentTenantCapability725({...media,peer:{...peer(),available:false}},now);
assert.equal(localWithoutPeer.candidate_only,true);
const publicProduct={...shared,capability:'storefront.product.read',actor:{
 ...shared.actor,tier:'T0_PUBLIC',identity_verified:false,account_active:false}};
assert.equal(assessConsentTenantCapability725(publicProduct,now).candidate_only,true);
assert.equal(assessConsentTenantCapability725({...publicProduct,capability:'storefront.product.unknown'},now).candidate_only,false);
assert.equal(assessConsentTenantCapability725({...media,actor:{...media.actor,tier:'T5_ORIGINAL_PHYSICAL_RECEIVER'}},now).candidate_only,false);
const request=(headers={})=>new Request('https://devilndove.com/api/admin/product-distribution-406',{headers});
assert.equal(denyUnenrolledDelegatedAdmin725(request()),false);
assert.equal(denyUnenrolledDelegatedAdmin725(request({'x-rosevear-delegated-capability':'media.draft.read'})),true);
assert.equal(denyUnenrolledDelegatedAdmin725(request({'x-rosevear-sync-protocol':'1.1'})),true);
assert.equal(denyUnenrolledDelegatedAdmin725(request(),{delegated_capability:{}}),true);
assert.equal(denyUnenrolledDelegatedAdmin725(request(),{cross_app_authority:false}),true);
const status=independentReleaseStatus725();
assert.equal(status.local_protocol,'1.1');
assert.equal(status.backward_compatible_with,'1.0');
assert.equal(status.cross_app_connected,false);
assert.equal(status.runtime_peer_handshake_verified,false);
assert.equal(status.local_additive_release_allowed,true);
assert.equal(status.owner_completion_percent_verified,null);
const register=JSON.parse(readFileSync(new URL('../.github/rosevear-independent-sync-725.v1.json',import.meta.url),'utf8'));
assert.equal(register.protocol.major,1);
assert.equal(register.protocol.minor,1);
assert.equal(register.protocol.backwardCompatibleWith,'1.0');
assert.equal(register.protocol.lockstepReleaseRequired,false);
assert.equal(register.releaseCoordination.vercelDeploymentTriggeredByThisBuild,false);
assert.equal(register.transport.directPeerD1OrR2Writes,false);
assert.equal(register.delegation.t5Delegable,false);
const mobile=readFileSync(new URL('../functions/api/admin/mobile-create-product.js',import.meta.url),'utf8');
const distribution=readFileSync(new URL('../functions/api/admin/product-distribution-406.js',import.meta.url),'utf8');
const html=readFileSync(new URL('../admin/it-integrations/index.html',import.meta.url),'utf8');
const client=readFileSync(new URL('../public/js/admin-production-variable-audit-v406.js',import.meta.url),'utf8');
assert.ok(mobile.includes('denyUnenrolledDelegatedAdmin725(request)'));
assert.ok(distribution.includes('denyUnenrolledDelegatedAdmin725(c.request,body)'));
assert.ok(distribution.includes('denyUnenrolledDelegatedAdmin725(c.request)'));
assert.ok(html.includes('dd725-independent-sync'));
assert.ok(client.includes('review=725'));
const ctx={request:new Request('https://devilndove.com/api/admin/production-variable-audit-406?review=725'),
 env:{SESSION_SECRET:'hidden-sensitive-secret-725'},
 data:{ddModuleAccess:{allowed:true,user:{role:'admin',is_active:1,user_id:42}}}};
const response=await onRequestGet(ctx),body=await response.json();
assert.equal(response.status,200);
assert.equal(response.headers.get('Cache-Control'),'no-store');
assert.equal(body.review725.compatibility.build,725);
assert.equal(body.review725.legacy_peer_1_0.usable_for_capability,true);
assert.equal(body.review725.legacy_peer_new_capability.usable_for_capability,false);
assert.equal(body.review725.unavailable_peer.local_operations_continue,true);
assert.equal(body.review725.cross_tenant_negative.candidate_only,false);
assert.equal(body.review725.vercel_blocked_peer_deployed_by_this_application,false);
assert.ok(!JSON.stringify(body).includes('hidden-sensitive-secret-725'));
assert.equal((await onRequestGet({...ctx,data:{}})).status,401);
assert.equal((await onRequestGet({...ctx,data:{ddModuleAccess:{allowed:true,user:{role:'customer',is_active:1,user_id:42}}}})).status,401);
console.log('Build 725: local 1.1 ↔ legacy 1.0, held peers, exact tenant/consent/delegation and real Admin route denial: PASS');
