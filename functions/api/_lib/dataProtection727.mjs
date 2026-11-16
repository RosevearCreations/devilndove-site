// Devil n Dove Build 727 — original-app DLP, consent and encrypted evidence primitives.
// No cross-app sender, automatic deletion, external recall or cryptographic key is enabled by this file.
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
// AES-256-GCM only when an independently provisioned 32-byte key is supplied.
// Ciphertext is never written to any database automatically; caller must provide protected storage.
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
