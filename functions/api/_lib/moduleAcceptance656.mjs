/** Build 656 source-owned evidence checkpoints. Owner review is not independent
 * validation, an approved master denominator, or a live Master Shell event. */
const deviceRoles=['customer','worker','admin'];
const devices=['desktop','tablet','mobile'];
const journeys={
  customer:[['browse','Browse a Product and understand its actual information'],['checkout','Complete an authorized Canada-only checkout/return walkthrough']],
  worker:[['work','Find the assigned workshop task and its true source status'],['handoff','Record or review the actual work handoff without unauthorized stock changes']],
  admin:[['operate','Perform an owner-authorized module task and verify its saved state'],['recover','Navigate, inspect error states and recover after a failed or stale read']]
};
const business=[
 ['project-tracking','projects','Track one genuine creative project from intake through outcome'],
 ['job-preparation','work-orders','Confirm preparation, scheduling and workshop evidence'],
 ['inventory','stock','Reconcile a real source inventory count and commitment'],
 ['supplies','purchase','Verify a real supply requirement and source receipt'],
 ['tools','maintenance','Inspect shared equipment status and maintenance evidence'],
 ['end-products','catalogue','Verify an actual Product, rights, media and finished QA'],
 ['customer-requests','commission','Trace a real consented commission or customer request'],
 ['invoicing','invoice','Reconcile invoice/receipt facts without inventing an issued invoice'],
 ['accounting','ledger','Match business records to a source-backed ledger entry'],
 ['taxation','hst','Check actual Canadian tax classification and held filing authority'],
 ['payroll','payroll','Confirm real staffing and payroll prerequisites before claiming readiness'],
 ['job-finances','margin','Check actual labour, materials and project cost evidence'],
 ['storefront','purchase','Review real store-to-order source continuity'],
 ['shipping','fulfillment','Review real shipping/return requirements and carrier acceptance'],
 ['security','roles','Verify one genuine role/tenant denial and authorization decision'],
 ['it-dashboard','status','Review exact release, server and external status evidence'],
 ['social-integration','consent','Inspect real account consent and hold on unapproved publication'],
 ['advertising','campaign','Review genuine campaign/ROI evidence, not estimated reach'],
 ['rosevear-integration','source','Check source-only manifest and original Comms trust HOLD'],
 ['production-qa','rework','Review a genuine maker QA, failure/rework or salvage record']
];
export const REQUIREMENTS=Object.freeze([
 ...deviceRoles.flatMap(role=>devices.flatMap(device=>journeys[role].map(([step,label])=>Object.freeze({
   id:`${role}.${device}.${step}`,module:`${role}-experience`,role,device,label,
   weight:1,definitionStatus:'PROPOSED_NOT_OWNER_RATIFIED'})))),
 ...business.map(([module,step,label])=>Object.freeze({id:`${module}.${step}`,
   module,role:'owner',device:'cross-device',label,weight:1,
   definitionStatus:'PROPOSED_NOT_OWNER_RATIFIED'}))
]);
export const POLICY=Object.freeze({schema:656,source:'devilndove',
  sourceOwned:true,ownerAttestationOnly:true,independentVerification:false,
  approvedModuleDenominators:false,publishToMasterShell:false,
  customerMessages:false,providerActions:false,inventoryMutation:false,
  moduleCompletionPercent:null,actualFieldAcceptanceRequired:true});
const IDS=new Map(REQUIREMENTS.map(r=>[r.id,r]));
const decisionSet=new Set(['hold','accepted','rejected']);
const iso=value=>{
  if(typeof value!=='string'||value.length!==24)return null;
  const n=Date.parse(value);return Number.isFinite(n)&&new Date(n).toISOString()===value?n:null;
};
const safeRef=value=>typeof value==='string'&&value.length>=12&&value.length<=240&&
  (/^urn:rosevear:evidence:[A-Za-z0-9._:-]{10,190}$/.test(value)||
    /^(docs|admin|public|functions)\/[A-Za-z0-9_./-]{9,228}$/.test(value)&&
      !value.includes('..')&&!value.includes('//'));
const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
export function normalizeReview(body,now=Date.now()){
 if(!body||typeof body!=='object'||Array.isArray(body))throw Error('Exact owner review required.');
 const allowed=['action','requirement_id','decision','observed_at','device_description',
   'evidence_reference','review_note','personally_observed','owner_confirmation',
   'expected_version','request_key'];
 if(Object.keys(body).length!==allowed.length||Object.keys(body).some(k=>!allowed.includes(k)))
   throw Error('Unexpected or missing owner review fields.');
 const req=IDS.get(body.requirement_id);
 if(!req||body.action!=='record_review'||!decisionSet.has(body.decision)||
   !Number.isSafeInteger(body.expected_version)||body.expected_version<0||body.expected_version>1e8||
   !uuid.test(body.request_key)||body.owner_confirmation!==true)
   throw Error('Unknown requirement, version or owner confirmation.');
 const observation=iso(body.observed_at);
 if(body.observed_at!==''&&!observation)throw Error('Observation date must be a real ISO timestamp or blank for HOLD/rejection.');
 if(body.decision==='accepted'&&(!observation||observation>now+5*60_000||
   now-observation>180*24*60*60_000||body.personally_observed!==true||!safeRef(body.evidence_reference)))
   throw Error('Acceptance needs personally observed recent evidence and an exact source reference.');
 if(body.decision!=='accepted'&&body.personally_observed!==false&&body.personally_observed!==true)
   throw Error('Observation must be explicit.');
 if(body.decision!=='accepted'&&body.evidence_reference!==''&&!safeRef(body.evidence_reference))
   throw Error('Invalid optional source reference.');
 if(typeof body.review_note!=='string'||body.review_note.trim().length<20||body.review_note.length>360)
   throw Error('Add a factual 20–360-character observation or HOLD reason.');
 if(typeof body.device_description!=='string'||body.device_description.length>120||
   (req.device!=='cross-device'&&body.device_description.trim().length<6))
   throw Error('Identify the actual device and browser for a role/device checkpoint.');
 if(observation&&observation>now+5*60_000)throw Error('Future-dated observation is not evidence.');
 return {requirement_id:req.id,decision:body.decision,observed_at:body.observed_at,
   device_description:body.device_description.trim(),evidence_reference:body.evidence_reference,
   review_note:body.review_note.trim(),personally_observed:body.personally_observed,
   expected_version:body.expected_version,request_key:body.request_key.toLowerCase()};
}
export function decodeOwnerRecord(row){
 if(!row)return {schema:656,version:0,receipts:[]};
 if(Number(row.is_public)!==0)throw Error('Owner evidence storage must be private.');
 const doc=JSON.parse(row.setting_value);
 if(doc?.schema!==656||!Number.isSafeInteger(doc.version)||doc.version<1||
   !Array.isArray(doc.receipts)||doc.receipts.length>160)throw Error('Invalid private owner evidence document.');
 for(const receipt of doc.receipts){
   if(!IDS.has(receipt.requirement_id)||!decisionSet.has(receipt.decision)||!uuid.test(receipt.receipt_id||'')||
     !uuid.test(receipt.request_key||'')||!Number.isSafeInteger(receipt.actor_user_id)||
     receipt.actor_user_id<1||receipt.independently_verified!==false)throw Error('Invalid saved owner receipt.');
 }
 return doc;
}
export function summarizeOwnerReviews(doc){
 const latest=new Map();
 for(const receipt of doc.receipts||[]){if(!latest.has(receipt.requirement_id))latest.set(receipt.requirement_id,receipt);}
 const groups=[...new Set(REQUIREMENTS.map(r=>r.module))].sort().map(module=>{
   const reqs=REQUIREMENTS.filter(r=>r.module===module);
   const accepted=reqs.filter(r=>latest.get(r.id)?.decision==='accepted').length;
   const held=reqs.filter(r=>latest.get(r.id)?.decision==='hold').length;
   const rejected=reqs.filter(r=>latest.get(r.id)?.decision==='rejected').length;
   return {module,checkpoints:reqs.length,owner_attested:accepted,held,rejected,
     unreviewed:reqs.length-accepted-held-rejected,
     owner_attested_review_coverage_pct:Math.round(100*accepted/reqs.length),
     independently_verified_completion_percent:null,scope_approved:false};
 });
 return {source:'devilndove',total_checkpoints:REQUIREMENTS.length,
   owner_accepted:groups.reduce((sum,g)=>sum+g.owner_attested,0),
   independent_verified:0,master_completion_percent:null,modules:groups,
   warning:'Owner-attested checkpoint coverage only. Not independently verified completion or a Master Shell percentage.'};
}
