/* Build 458 — explicit, opt-in browser-local draft recovery; NEVER automatic server replay. */
export const DRAFT_MAX_AGE_MS=24*60*60*1000;
export const DRAFT_MAX_BYTES=8192;
export const DRAFT_MAX_SCOPES=10;
const PREFIX='dnd:maker-draft:458:';

export function makerDraftScope(kind,id,scenario=''){
 if(!['owner','cost'].includes(kind)||!/^[1-9]\d{0,9}$/.test(String(id)))throw Error('A real source ID is required for draft recovery.');
 if(kind==='owner'&&!['jewellery_metal','resin_clay','digital_fabrication','failed_salvage','private_therapeutic','custom_commission'].includes(scenario))throw Error('Invalid real owner trial scenario.');
 if(kind==='cost'&&scenario)throw Error('Cost drafts cannot impersonate an owner trial.');
 return PREFIX+kind+':'+String(id)+(scenario?':'+scenario:'');
}

const validPending=p=>p===null||p&&typeof p==='object'&&/^[a-zA-Z0-9_-]{16,80}$/.test(p.key)&&typeof p.fingerprint==='string'&&p.fingerprint.length>2&&p.fingerprint.length<=4096;
const validFields=f=>f&&typeof f==='object'&&!Array.isArray(f)&&Object.keys(f).length<=30&&Object.values(f).every(v=>typeof v==='boolean'||typeof v==='string'&&v.length<=1200);

export class MakerDraftStore{
 constructor(storage,key,clock=()=>Date.now(),revision=()=>crypto.randomUUID()){
  if(!key.startsWith(PREFIX))throw Error('Invalid Maker draft namespace.');
  this.storage=storage;this.key=key;this.clock=clock;this.makeRevision=revision;
 }
 read(){
  let raw;try{raw=this.storage.getItem(this.key)}catch{return null}
  if(!raw||raw.length>DRAFT_MAX_BYTES)return null;
  let draft;try{draft=JSON.parse(raw)}catch{return null}
  if(draft?.version!==1||typeof draft.revision!=='string'||!validFields(draft.fields)||!validPending(draft.pending??null)||!Number.isFinite(draft.expires_at))return null;
  if(draft.expires_at<=this.clock())return null;
  return draft;
 }
 save(fields,pending,expectedRevision=null){
  if(!validFields(fields)||!validPending(pending))throw Error('Draft has unsupported fields or pending receipt.');
  const current=this.read();
  if((current?.revision||null)!==(expectedRevision||null))throw Error('DRAFT_CONFLICT: another tab saved a different version. Restore or discard it first.');
  let count=0;
  for(let i=this.storage.length-1;i>=0;i--){const key=this.storage.key(i);if(!key?.startsWith(PREFIX))continue;
   let old=null;try{old=JSON.parse(this.storage.getItem(key))}catch{}
   if(old?.version===1&&Number.isFinite(old.expires_at)&&old.expires_at<=this.clock())this.storage.removeItem(key);
   else count++;
  }
  if(!current&&count>=DRAFT_MAX_SCOPES)throw Error('Local Maker draft limit reached (10); discard older drafts first.');
  const now=this.clock(),draft={version:1,revision:this.makeRevision(),updated_at:now,expires_at:now+DRAFT_MAX_AGE_MS,fields,pending};
  const raw=JSON.stringify(draft);
  if(new TextEncoder().encode(raw).byteLength>DRAFT_MAX_BYTES)throw Error('Draft exceeds the 8 KB browser limit.');
  this.storage.setItem(this.key,raw);
  return draft;
 }
 discard(expectedRevision=null){
  const current=this.read();
  if(current&&(current.revision!==(expectedRevision||null)))throw Error('DRAFT_CONFLICT: a newer version exists in another tab.');
  this.storage.removeItem(this.key);
 }
}

export function makerFingerprint(body){
 if(!body||typeof body!=='object')throw Error('A complete source-bound form is required.');
 const clone={...body};delete clone.request_key;
 return JSON.stringify(clone);
}
