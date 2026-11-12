// Build 684: only externally controlled signing keys and a pinned, authenticated receiver are trusted.
export function claim684(kind,c){
 if(kind==='enrollment')return {v:1,purpose:'devilndove_finance_signer_runtime_684',source:'devilndove',
 queue_id:c.queue_id,campaign:c.campaign,source_revision:c.source_revision,fingerprint_sha256:c.fingerprint_sha256,
 source_signer_receipt_id:c.source_signer_receipt_id,signer_id:c.signer_id,nonce:c.nonce,issued_at:c.issued_at};
 if(kind==='acceptance')return {v:1,purpose:'ai_data_finance_master_acceptance_684',source:'devilndove',
 queue_id:c.queue_id,campaign:c.campaign,source_revision:c.source_revision,fingerprint_sha256:c.fingerprint_sha256,
 source_signer_receipt_id:c.source_signer_receipt_id,enrollment_receipt_id:c.enrollment_receipt_id,
 master_signed_receipt_id:c.master_signed_receipt_id,master_revision:c.master_revision,
 receiver_receipt_id:c.receiver_receipt_id,request_nonce:c.request_nonce,decision:'accepted',issued_at:c.issued_at};
 throw Error('Unknown financial evidence claim');
}
export const nonce684=x=>typeof x==='string'&&/^[A-Za-z0-9_-]{16,100}$/.test(x);
export const fresh684=(x,max=300000,now=Date.now())=>typeof x==='string'&&
 /^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d(?:\.\d{3})?Z$/.test(x)&&Number.isFinite(Date.parse(x))&&
 now-Date.parse(x)>=-300000&&now-Date.parse(x)<=max;
const decode684=s=>Uint8Array.from(atob(s.replace(/-/g,'+').replace(/_/g,'/')),c=>c.charCodeAt(0));
export async function verify684(key,claim,signature){
 if(typeof key!=='string'||typeof signature!=='string'||!key||!signature)return false;
 try{
 const pub=decode684(key),sig=decode684(signature);if(pub.length!==32||sig.length!==64)return false;
 const k=await crypto.subtle.importKey('raw',pub,'Ed25519',false,['verify']);
 return !!await crypto.subtle.verify('Ed25519',k,sig,new TextEncoder().encode(JSON.stringify(claim)));
 }catch{return false;}
}
export function same684(a,b){return a?.queue_id===b?.queue_id&&a?.campaign===b?.campaign&&
 a?.source_revision===b?.source_revision&&a?.fingerprint_sha256===b?.fingerprint_sha256&&
 a?.source_signer_receipt_id===b?.source_signer_receipt_id;}
export function endpoint684(env){
 const urlText=env?.FINANCIAL_MASTER_ACCEPTANCE_URL_684,origin=env?.FINANCIAL_MASTER_ACCEPTANCE_ORIGIN_684,
 token=env?.FINANCIAL_MASTER_ACCEPTANCE_TOKEN_684;
 if(typeof urlText!=='string'||typeof origin!=='string'||typeof token!=='string'||
 !/^[A-Za-z0-9_.~+/-]{24,4096}$/.test(token))return null;
 try{const url=new URL(urlText),pin=new URL(origin);
 if(url.protocol!=='https:'||pin.protocol!=='https:'||url.origin!==pin.origin||
 pin.pathname!=='/'||pin.search||pin.hash||url.username||url.password||url.hash||
 !/^\/[A-Za-z0-9_./-]{1,240}$/.test(url.pathname))return null;
 return {url:url.href,token};}catch{return null;}
}
export async function lookup684(env,identity,fetchImpl=fetch){
 const server=endpoint684(env);if(!server)throw Error('Pinned authenticated Master receiver not enrolled. HOLD.');
 const request_nonce=crypto.randomUUID()+'-'+crypto.randomUUID();
 const response=await fetchImpl(server.url,{method:'GET',redirect:'error',cache:'no-store',headers:{
 'Authorization':'Bearer '+server.token,'Accept':'application/json','X-Finance-Queue-Id':String(identity.queue_id),
 'X-Finance-Fingerprint':identity.fingerprint_sha256,
 'X-Finance-Source-Receipt':String(identity.source_signer_receipt_id),
 'X-Finance-Master-Receipt':String(identity.master_signed_receipt_id),
 'X-Finance-Request-Nonce':request_nonce}});
 if(!response?.ok||response.status!==200||!(response.headers?.get('content-type')||'').toLowerCase().includes('application/json'))
 throw Error('Independent Master receiver did not return authenticated JSON acceptance. HOLD.');
 if(Number(response.headers.get('content-length')||0)>16384)throw Error('Master receipt evidence too large. HOLD.');
 const raw=await response.text();if(raw.length>16384)throw Error('Master receipt exceeded evidence limit. HOLD.');
 let evidence;try{evidence=JSON.parse(raw)}catch{throw Error('Malformed independent Master receipt. HOLD.')}
 const c=evidence?.claim;
 if(!c||c.request_nonce!==request_nonce||c.decision!=='accepted'||!same684(c,identity)||
 c.enrollment_receipt_id!==identity.enrollment_receipt_id||
 c.master_signed_receipt_id!==identity.master_signed_receipt_id||
 c.master_revision!==identity.master_revision||typeof c.receiver_receipt_id!=='string'||
 !/^[A-Za-z0-9_.:-]{10,120}$/.test(c.receiver_receipt_id)||!fresh684(c.issued_at)||
 !await verify684(env.AI_DATA_MASTER_ACK_PUBLIC_KEY,claim684('acceptance',c),evidence.signature))
 throw Error('Independent Master acceptance signature, nonce, receipt or freshness mismatch. HOLD.');
 return {claim:claim684('acceptance',c),signature:evidence.signature,checked_at:new Date().toISOString()};
}
