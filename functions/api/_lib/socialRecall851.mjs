// Build 851 — Devil n Dove original-device provider recovery and Master receiver proof.
// Independent signatures are checked server-side; never treat browser assertions as authority.
export const CONTRACT_851='devilndove.ai-data.social-recall.pilot.v851';
const FIELDS_DEVICE=['version','kind','source','revision','queue_id','platform','external_post_id','action','http_status','device_id','verifier_id','observed_at','nonce'];
const FIELDS_ACK=['version','kind','source','revision','queue_id','contract','consumer','receiver_id','device_nonce','decision','verifier_id','observed_at','nonce'];
const channels=new Set(['facebook','instagram','pinterest','x']);
const id=v=>Number.isSafeInteger(Number(v))&&Number(v)>0?Number(v):0;
const safe=v=>typeof v==='string'&&/^[a-zA-Z0-9_.@:-]{5,100}$/.test(v);
const date=v=>{const n=Date.parse(v||'');return Number.isFinite(n)?n:NaN;};
function decode(s,length){if(typeof s!=='string'||!/^[A-Za-z0-9_-]+$/.test(s))return null;try{const t=s.replace(/-/g,'+').replace(/_/g,'/')+'='.repeat((4-s.length%4)%4);const x=Uint8Array.from(atob(t),c=>c.charCodeAt(0));return x.length===length?x:null;}catch{return null;}}
const digest=async data=>[...new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(data)))].map(x=>x.toString(16).padStart(2,'0')).join('');
function canonical(record,fields,prefix){if(!record||typeof record!=='object'||Array.isArray(record)||Object.keys(record).length!==fields.length||fields.some(f=>record[f]===undefined||record[f]===null)||Object.keys(record).some(k=>!fields.includes(k)))throw Error('Exact signed receipt field set required.');return prefix+'\n'+JSON.stringify(fields.map(f=>record[f]));}
async function signature(envKey,signature,record,fields,prefix){
 const pin=decode(envKey,32),sig=decode(signature,64);
 if(!pin||!sig)return {ok:false,reason:'Independent public-key enrollment or signature missing.'};
 let bytes;try{bytes=canonical(record,fields,prefix);}catch{return {ok:false,reason:'Receipt schema mismatch.'};}
 try{const key=await crypto.subtle.importKey('raw',pin,{name:'Ed25519'},false,['verify']);if(!await crypto.subtle.verify('Ed25519',key,sig,new TextEncoder().encode(bytes)))return {ok:false,reason:'Detached independent signature invalid.'};return {ok:true,sha256:await digest(bytes)};}catch{return {ok:false,reason:'Cryptographic verifier unavailable.'};}
}
const freshness=(value,now)=>Number.isFinite(date(value))&&date(value)<=now+300000&&now-date(value)<=600000;
export async function verifyDeviceWitness851(env,record,signature,{queueId,platform,externalId,ownerEmail,now=Date.now()}={}){
 if(record?.version!==1||record?.kind!=='original_device_provider_removal_witness'||record?.source!=='devilndove'||record?.revision!==env?.CF_PAGES_COMMIT_SHA||!/^[a-f0-9]{40}$/.test(record?.revision||'')||record?.queue_id!==queueId||!id(queueId)||record?.platform!==platform||!channels.has(platform)||record?.external_post_id!==externalId||!safe(externalId)||record?.action!=='provider_delete_acknowledged'||![200,204].includes(record?.http_status)||!safe(record?.device_id)||!safe(record?.verifier_id)||!safe(record?.nonce)||record.verifier_id.toLowerCase()===String(ownerEmail||'').toLowerCase()||!freshness(record?.observed_at,now))return {ok:false,reason:'Original device, provider response, separate verifier, exact live post or freshness not proven.'};
 return signature851(env?.DND_851_DEVICE_WITNESS_PUBLIC_KEY,signature,record,FIELDS_DEVICE,'DND-851-DEVICE-PROVIDER-WITNESS-V1');
}
export async function verifyMasterAck851(env,record,signature,{queueId,deviceNonce,ownerEmail,now=Date.now()}={}){
 if(record?.version!==1||record?.kind!=='master_receiver_runtime_ack'||record?.source!=='devilndove'||record?.revision!==env?.CF_PAGES_COMMIT_SHA||!/^[a-f0-9]{40}$/.test(record?.revision||'')||record?.queue_id!==queueId||!id(queueId)||record?.contract!==CONTRACT_851||record?.consumer!=='ai-data-platform'||!safe(record?.receiver_id)||record?.device_nonce!==deviceNonce||!safe(record?.device_nonce)||record?.decision!=='scoped_pilot_accepted'||!safe(record?.verifier_id)||!safe(record?.nonce)||record.nonce===deviceNonce||record.verifier_id.toLowerCase()===String(ownerEmail||'').toLowerCase()||!freshness(record?.observed_at,now))return {ok:false,reason:'Exact independent Master receiver runtime ACK and current source custody are required.'};
 return signature851(env?.DND_851_MASTER_RECEIVER_PUBLIC_KEY,signature,record,FIELDS_ACK,'DND-851-AIDATA-RUNTIME-ACK-V1');
}
async function signature851(...args){return signature(...args);}
export function consentGate851(consents=[],platforms=[]){
 const blockers=[];
 if(!Array.isArray(consents)||!consents.length||consents.length>=100)blockers.push('CURRENT_ORIGINAL_MEDIA_CONSENT_EVIDENCE_MISSING');
 if(!Array.isArray(platforms)||!platforms.length||platforms.length>4||new Set(platforms).size!==platforms.length||platforms.some(x=>!channels.has(x)))blockers.push('INVALID_OR_INCOMPLETE_PLATFORM_MANIFEST');
 if(Array.isArray(consents)&&consents.some(c=>!['revoked','blocked'].includes(c.consent_status)||Number(c.public_use_allowed)!==0||Number(c.social_use_allowed)!==0))blockers.push('CONSENT_NOT_REVOKED_OR_PERMISSION_RESTORED');
 return {ok:!blockers.length,blockers};
}
export function scopedClosure851({consent,platforms=[],deviceReceipts=[],ackReceipt,laterLiveReceipts=[],expectedRevision,windowComplete=true,now=Date.now()}={}){
 const blockers=[...(consent?.blockers||[])];
 if(!windowComplete)blockers.push('SOURCE_EVIDENCE_WINDOW_INCOMPLETE');
 if(!/^[a-f0-9]{40}$/.test(expectedRevision||'')||deviceReceipts.some(r=>r.revision!==expectedRevision)||ackReceipt?.revision!==expectedRevision)blockers.push('EXACT_CURRENT_SOURCE_REVISION_MISMATCH');
 if(!consent?.ok)blockers.push('CONSENT_GATE_HOLD');
 if(deviceReceipts.some(r=>!freshness(r.observed_at,now)))blockers.push('DEVICE_WITNESS_OBSERVATION_STALE_OR_MISSING');
 if(!Array.isArray(laterLiveReceipts)||laterLiveReceipts.some(l=>deviceReceipts.some(d=>d.platform===l.platform_key&&Number.isFinite(date(l.attempted_at))&&date(l.attempted_at)>date(d.observed_at))))blockers.push('LATER_PROVIDER_LIVE_AFTER_REMOVAL_REOPEN_HOLD');
 if(deviceReceipts.length<platforms.length||platforms.some(p=>!deviceReceipts.some(r=>r.platform===p&&r.kind==='device_witness'&&r.signed_verified===1)))blockers.push('INDEPENDENT_REMOVAL_WITNESS_MISSING');
 if(!ackReceipt||ackReceipt.kind!=='receiver_ack'||ackReceipt.signed_verified!==1)blockers.push('DURABLE_INDEPENDENT_MASTER_ACK_MISSING');
 if(ackReceipt&&(!deviceReceipts.some(r=>r.nonce===ackReceipt.device_nonce)||!freshness(ackReceipt.observed_at,now)))blockers.push('MASTER_ACK_DEVICE_LINK_OR_FRESHNESS_INVALID');
 return {decision:blockers.length?'HOLD':'SCOPED_LOCAL_CLOSURE_ALLOWED',blockers:[...new Set(blockers)],all_public_mirrors_removed:false,provider_mutation_performed:false,master_connection:'HOLD'};
}
