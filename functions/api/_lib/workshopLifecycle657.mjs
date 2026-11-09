/** Build 657: source-linked, private workshop review policy. Canonical Creative
 * Projects/Events/Outputs remain the source. This ledger never posts stock,
 * changes an actual project status, certifies QA independently or publishes. */
export const STAGES=Object.freeze(['planning','preparing','making','qa_review','rework','salvage','finished_private','completed','paused']);
export const QA=Object.freeze(['not_reviewed','passed','failed','rework_required','salvage_review','not_applicable']);
export const PURPOSES=Object.freeze(['personal_learning','private_experiment','business_internal','client_commission','sale_candidate']);
export const POLICY=Object.freeze({build:657,source:'creative_work_projects',privateOwnerReview:true,
  verifiedProductionCompletion:false,independentQa:false,projectStatusMutation:false,
  productMutation:false,inventoryMutation:false,customerMessage:false,publishToMasterShell:false,
  providerCall:false,autoSaleConversion:false,ownerEstimatedProgressOnly:true,
  maximumSourceEventsInReview:40,maximumSourceOutputsInReview:40});
const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const hex64=/^[a-f0-9]{64}$/;
const fixed=['action','project_id','expected_source_revision','stage','progress_percent',
  'purpose','qa_decision','source_event_id','observed_at','review_note',
  'personally_observed','owner_confirmation','expected_version','request_key'];
function date(value){if(typeof value!=='string'||value.length!==24)return null;
 const millis=Date.parse(value);return Number.isFinite(millis)&&new Date(millis).toISOString()===value?millis:null;}
export function normalizeWorkshopReview(data,now=Date.now()){
 if(!data||typeof data!=='object'||Array.isArray(data)||Object.keys(data).length!==fixed.length||
   Object.keys(data).some(k=>!fixed.includes(k)))throw Error('Use exactly the source-linked workshop review fields.');
 if(data.action!=='record_review'||!Number.isSafeInteger(data.project_id)||data.project_id<1||data.project_id>1e9||
   !hex64.test(data.expected_source_revision)||!STAGES.includes(data.stage)||
   !PURPOSES.includes(data.purpose)||!QA.includes(data.qa_decision)||
   !Number.isInteger(data.progress_percent)||data.progress_percent<0||data.progress_percent>100||
   !Number.isSafeInteger(data.source_event_id)||data.source_event_id<0||data.source_event_id>1e10||
   !Number.isSafeInteger(data.expected_version)||data.expected_version<0||data.expected_version>1e8||
   !uuid.test(data.request_key)||data.personally_observed!==true||data.owner_confirmation!==true)
   throw Error('Invalid workshop status, scope, revision, source event or owner confirmation.');
 const observed=date(data.observed_at);
 if(observed===null||observed>now+5*60_000||now-observed>180*86400_000)
   throw Error('An actual personally observed workshop event from the last 180 days is required.');
 if(typeof data.review_note!=='string'||data.review_note.trim().length<30||data.review_note.length>480)
   throw Error('Record 30–480 characters of real job progress, QA or rework observations.');
 if((data.progress_percent>0||data.qa_decision!=='not_reviewed'||['rework','salvage','finished_private','completed'].includes(data.stage))&&
   data.source_event_id===0)throw Error('Progress, QA and terminal decisions need a real active Creative Process event.');
 if(['rework','salvage'].includes(data.stage)&&
   !['failed','rework_required','salvage_review'].includes(data.qa_decision))
   throw Error('Rework and salvage need an explicit failed or corrective QA decision.');
 if(data.qa_decision==='not_applicable'&&!['personal_learning','private_experiment'].includes(data.purpose))
   throw Error('QA not applicable is reserved for personal and private learning outcomes.');
 if(data.stage==='finished_private'&&
   (!['personal_learning','private_experiment'].includes(data.purpose)||
     !['passed','not_applicable'].includes(data.qa_decision)))
   throw Error('A private-learning finish must be private and supported by a result or lesson.');
 if(data.stage==='completed'&&data.qa_decision!=='passed')
   throw Error('Production completion requires a separately observed QA pass.');
 const isTerminal=['finished_private','completed'].includes(data.stage);
 if((data.progress_percent===100)!==isTerminal)
   throw Error('100% owner-estimated progress is reserved for a supported terminal review.');
 return {...data,review_note:data.review_note.trim(),request_key:data.request_key.toLowerCase()};
}
export function assertSourceEvent(review,events){
 if(review.source_event_id===0)return null;
 const found=events.find(e=>Number(e.creative_work_event_id)===review.source_event_id&&
   String(e.entry_status)==='active');
 if(!found)throw Error('The cited source event is absent, voided or outside the bounded current project review.');
 const type=String(found.event_type||'');
 if(review.qa_decision==='passed'&&!['result','milestone'].includes(type))
   throw Error('A QA pass requires an actual result/milestone source event.');
 if(review.qa_decision==='failed'&&!['mistake','repair','result'].includes(type))
   throw Error('A QA failure requires an actual mistake, repair or result event.');
 if(review.qa_decision==='rework_required'&&!['mistake','repair','result','process'].includes(type))
   throw Error('Rework review needs genuine mistake, repair, process or result evidence.');
 if(review.qa_decision==='salvage_review'&&!['mistake','repair','result'].includes(type))
   throw Error('Salvage needs genuine failed, repair or result evidence.');
 if(review.qa_decision==='not_applicable'&&!['result','lesson'].includes(type))
   throw Error('A private-learning outcome needs a real result or lesson event.');
 return found;
}
export function decodeJournal(row){
 if(!row)return {schema:657,version:0,receipts:[]};
 if(Number(row.is_public)!==0)throw Error('Private project review source unexpectedly public.');
 const doc=JSON.parse(row.setting_value);
 if(doc?.schema!==657||!Number.isSafeInteger(doc.version)||doc.version<1||
   !Array.isArray(doc.receipts)||doc.receipts.length>120)throw Error('Invalid workshop review source document.');
 for(const item of doc.receipts){if(!uuid.test(item.receipt_id||'')||!uuid.test(item.request_key||'')||
    !Number.isSafeInteger(item.actor_user_id)||item.actor_user_id<1||
    !STAGES.includes(item.stage)||!QA.includes(item.qa_decision)||
    item.independently_verified!==false||item.product_or_stock_changed!==false)
    throw Error('Invalid protected workshop review receipt.');}
 return doc;
}
export const currentReview=doc=>(doc.receipts||[])[0]||null;
