import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {reconcileSignedMediaRecurrence713} from '../functions/api/admin/_cameraField702.mjs';
import {assessFinance713} from '../functions/api/admin/social-post-queue.js';

const now=Date.now(),h=3600000,iso=hours=>new Date(now+hours*h).toISOString();
const signoff={admin_action_audit_id:800,data:{r2_key:'products/original/signed.jpg',verified_r2_bytes:3072}},
 recurrence={admin_action_audit_id:900},resolution={admin_action_audit_id:930},
 stability={admin_action_audit_id:950,created_at:iso(-100)},
 audit={stable:true,status:'SIGNED_LINKED_MEDIA_SOURCE_STABLE_ON_DEMAND_707'},
 horizon={admin_action_audit_id:980,created_at:iso(-25),data:{
  build:712,source_recheck:'independent_server_d1_r2_head_on_demand',
  original_711_stability_receipt_id:950,original_710_resolution_receipt_id:930,
  original_709_recurrence_receipt_id:900,original_706_signoff_receipt_id:800,
  original_signed_r2_key:signoff.data.r2_key,original_signed_r2_bytes:3072,
  observed_current_r2_key:signoff.data.r2_key,observed_current_r2_bytes:3072,
  observed_stability_horizon_hours:75,
  observed_horizon_status:'ORIGINAL_SIGNED_MEDIA_HORIZON_72H_RECHECK_DUE_712',
  rechecked_source_status:audit.status,automatic_media_repair:false,
  continuous_monitoring_enabled:false,independent_physical_phone_witness:false,
  unrecorded_uploads_closed:false,publication_performed:false}},
 later={admin_action_audit_id:990,data:{owner_re_attested:true,issued_at:iso(-1)}};
const media=(row=horizon,latest=later,source=audit)=>
 reconcileSignedMediaRecurrence713(row,stability,resolution,recurrence,signoff,latest,source,now);
assert.equal(media().source_stable,true);
assert.match(media().status,/RECONCILED/);
assert.equal(media().continuous_monitoring_enabled,false);
assert.match(media(null).status,/HOLD/);
assert.match(media({...horizon,created_at:iso(-102)}).status,/HOLD/);
assert.match(media({...horizon,data:{...horizon.data,observed_stability_horizon_hours:74}}).status,/HOLD/);
assert.match(media(horizon,{...later,admin_action_audit_id:970}).status,/HOLD/);
assert.match(media(horizon,{...later,data:{...later.data,issued_at:iso(-26)}}).status,/HOLD/);
assert.match(media(horizon,later,{stable:false,status:'HOLD_707_SIGNED_MEDIA_D1_R2_DRIFT'}).status,/HOLD/);

const base={history_complete:true,ninth_signer_configured:true,ninth_signer_id:'original-ed25519-ninth'},
 original={review_706_receipt_id:80,renewal_receipt_id_711:110,
 original_711_renewal_recorded_at:iso(-52),source_stable_712:true,
 retention_manifest_sha256:'a'.repeat(64),provenance_710_digest_sha256:'b'.repeat(64),
 renewal_manifest_sha256_711:'c'.repeat(64),
 custody_followup_evidence_recorded_712:true,custody_followup_evidence_receipt_id_712:130},
 receipt={receipt_id:130,verified:true,original_711_renewal_receipt_id:110,recorded_at:iso(-25)},
 prior={history_complete:true,independent_original_ninth_signature_rechecked:true,
 new_independent_signature_generated:false,bookkeeping_closed:false,
 campaign_queue_id:7,items:[original],evidence_receipts:[receipt],
 invalid_count:0,renewed_source_drift_count:0};
const check=(p=prior,b=base)=>assessFinance713(p,b,now);
assert.equal(check().history_complete,true);
assert.equal(check().outcome_evidence_rechecked,1);
assert.equal(check().items[0].books_closed,false);
assert.equal(check().independent_external_reply_verified,false);
assert.equal(check({...prior,evidence_receipts:[]}).history_complete,false);
assert.equal(check({...prior,evidence_receipts:[receipt,receipt]}).history_complete,false);
assert.equal(check({...prior,evidence_receipts:[{...receipt,recorded_at:iso(4)}]}).history_complete,false);
assert.equal(check({...prior,items:[{...original,source_stable_712:false}]}).history_complete,false);
assert.equal(check(prior,{...base,ninth_signer_configured:false}).history_complete,false);
assert.equal(check({...prior,items:[{...original,original_711_renewal_recorded_at:iso(2)}]}).history_complete,false);
assert.equal(check({...prior,bookkeeping_closed:true}).history_complete,false);
const awaiting=check({...prior,items:[{...original,custody_followup_evidence_recorded_712:false,
 custody_followup_evidence_receipt_id_712:null}],evidence_receipts:[]});
assert.equal(awaiting.outstanding_custody_followups,1);
assert.match(awaiting.items[0].status,/FOLLOWUP_DUE/);

const files=['functions/api/admin/mobile-create-product.js','functions/api/admin/_cameraField702.mjs',
'functions/api/admin/social-post-queue.js','public/js/admin-mobile-product-augment.js',
'public/js/admin-social-platform-preflight.js','admin/mobile-product/index.html','admin/social-publishing/index.html'];
const source=Object.fromEntries(files.map(f=>[f,readFileSync(new URL('../'+f,import.meta.url),'utf8')]));
assert.match(source[files[0]],/camera713_inspect/);
assert.match(source[files[2]],/financial713:await finance713/);
assert.match(source[files[2]],/params.get\('export'\)==='financial713'/);
assert.match(source[files[3]],/dd713MediaRefresh/);
assert.match(source[files[4]],/dd713FinanceExport/);
assert.match(source[files[5]],/dd713MediaRecurrence/);
assert.match(source[files[6]],/dd713-finance/);
for(const value of Object.values(source))assert.doesNotMatch(value,/backgroundWatcher713|autoCloseBooks713/);
console.log('Build 713 original multi-horizon, custody and ninth-authority negative regression: PASS');
