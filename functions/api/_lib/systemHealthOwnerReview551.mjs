/* Build 551: exact, owner-scoped receipt attestation helpers. No provider writes. */
const PATHS=new Set(['/','/shop/','/admin/','/admin/product-editor/?product_id=54','/admin/system-operations/']);
const STATUSES=new Set(['200','301','302','400','401','403','404','429','500','502','503','504','524','TIMEOUT','NETWORK ERROR']);
const VIEW_KEY=/^system-health-preset-\d+-[a-z0-9-]{1,45}$/;

export function ownerReviewReceipt(input,history,presets){
  if(!input||typeof input!=='object'||Array.isArray(input))return null;
  if(input.kind==='history'){
    const {path,at,status,ms}=input;
    if(!PATHS.has(path)||typeof at!=='string'||at.length>40||!Number.isFinite(Date.parse(at))||!STATUSES.has(status)||!Number.isInteger(ms)||ms<0||ms>60000)return null;
    const normalized={kind:'history',path,at:new Date(at).toISOString(),status,ms};
    return (Array.isArray(history)?history:[]).some(row=>row.path===normalized.path&&row.at===normalized.at&&row.status===status&&row.ms===ms)?normalized:null;
  }
  if(input.kind==='view'){
    const {key,label,updated_at}=input;
    if(typeof key!=='string'||!VIEW_KEY.test(key)||typeof label!=='string'||!label||label.length>55||typeof updated_at!=='string'||!updated_at||updated_at.length>40)return null;
    return (Array.isArray(presets)?presets:[]).some(row=>row.view_key===key&&row.view_label===label&&row.updated_at===updated_at)?{kind:'view',key,label,updated_at}:null;
  }
  return null;
}

export function compactOwnerReviews(existing,review){
  const rows=Array.isArray(existing)?existing.filter(item=>item&&typeof item==='object'&&item.receipt&&typeof item.reviewed_at==='string').slice(0,12):[];
  const identity=JSON.stringify(review.receipt);
  const previous=rows.find(item=>JSON.stringify(item.receipt)===identity);
  if(previous)return {rows,review:previous,already_recorded:true};
  if(rows.length>=12)return {rows,review:null,already_recorded:false,full:true};
  return {rows:[review,...rows],review,already_recorded:false,full:false};
}
