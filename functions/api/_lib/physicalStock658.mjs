/** Build 658: private two-person physical-count review, not a stock-write authority. */
export const POLICY=Object.freeze({build:658,source:'site_item_inventory+site_inventory_base_balances',
  countUnit:'base',privateJournal:true,independentSecondAdminRequired:true,
  automaticStockCorrection:false,automaticLotCorrection:false,productStockMutation:false,
  masterShellPublication:false,officialInventoryCompletion:false});
const uuid=/^[a-f0-9]{8}-[a-f0-9]{4}-[1-8][a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i;
const hash=/^[a-f0-9]{64}$/;
const countFields=['action','item_id','expected_source_revision','expected_version','request_key',
  'counted_base_quantity','observed_at','observed_location','lot_id','note','personally_counted','owner_confirmation'];
const reviewFields=['action','item_id','expected_source_revision','expected_version','request_key',
  'count_receipt_id','decision','note','independent_review','owner_confirmation'];
function exact(body,fields){if(!body||typeof body!=='object'||Array.isArray(body)||
    Object.keys(body).length!==fields.length||Object.keys(body).some(k=>!fields.includes(k)))
  throw Error('Exact authorized physical stock review fields required.');}
function common(body){if(!Number.isSafeInteger(body.item_id)||body.item_id<1||body.item_id>1e9||
  !hash.test(body.expected_source_revision)||!Number.isSafeInteger(body.expected_version)||
  body.expected_version<0||body.expected_version>1e8||!uuid.test(body.request_key)||
  body.owner_confirmation!==true)throw Error('Invalid item, source revision, journal version or owner approval.');
 if(typeof body.note!=='string'||body.note.trim().length<24||body.note.length>480)
   throw Error('Supply a factual 24–480 character observation or review note.');
 return {...body,note:body.note.trim(),request_key:body.request_key.toLowerCase()};}
export function normalizeCount(body,now=Date.now()){
 exact(body,countFields);if(body.action!=='record_count'||body.personally_counted!==true||
  typeof body.counted_base_quantity!=='number'||!Number.isFinite(body.counted_base_quantity)||
  body.counted_base_quantity<0||body.counted_base_quantity>1e9||
  Math.round(body.counted_base_quantity*10000)/10000!==body.counted_base_quantity||
  !Number.isSafeInteger(body.lot_id)||body.lot_id<0||body.lot_id>1e10||
  typeof body.observed_location!=='string'||body.observed_location.trim().length<3||
  body.observed_location.length>160)throw Error('Actual count, observed location, base-unit precision and lot scope required.');
 const ms=Date.parse(body.observed_at);
 if(typeof body.observed_at!=='string'||!Number.isFinite(ms)||
    new Date(ms).toISOString()!==body.observed_at||ms>now+5*60000||now-ms>7*86400000)
    throw Error('Physical counts must be genuinely observed during the last seven days.');
 return {...common(body),observed_location:body.observed_location.trim()};
}
export function normalizeReview(body){
 exact(body,reviewFields);if(body.action!=='review_count'||!uuid.test(body.count_receipt_id)||
  !['approve','hold','recount'].includes(body.decision)||body.independent_review!==true)
  throw Error('Independent second-Admin decision and source count receipt required.');
 return common(body);
}
export function decodeJournal(row){
 if(!row)return {schema:658,version:0,receipts:[]};
 if(Number(row.is_public)!==0)throw Error('Inventory count journal is unexpectedly public.');
 const doc=JSON.parse(row.setting_value);
 if(doc?.schema!==658||!Number.isSafeInteger(doc.version)||doc.version<1||
   !Array.isArray(doc.receipts)||doc.receipts.length>70)throw Error('Invalid protected inventory review journal.');
 for(const entry of doc.receipts){if(!uuid.test(entry.receipt_id||'')||!uuid.test(entry.request_key||'')||
    !Number.isSafeInteger(entry.actor_user_id)||entry.actor_user_id<1||
    !['record_count','review_count'].includes(entry.action)||entry.inventory_modified!==false||
    entry.external_verified!==false)throw Error('Invalid private count receipt.');}
 return doc;
}
export function latestPair(doc){
 const count=doc.receipts.find(r=>r.action==='record_count')||null;
 const review=count?doc.receipts.find(r=>r.action==='review_count'&&r.count_receipt_id===count.receipt_id)||null:null;
 return {count,review};
}
