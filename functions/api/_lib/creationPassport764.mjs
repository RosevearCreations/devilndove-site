// Foundation only. No public route or issuance is enabled.
const clean=(v,n)=>typeof v==='string'?v.trim().slice(0,n):'';
const hex=b=>Array.from(b,x=>x.toString(16).padStart(2,'0')).join('');
export function makeCareTransferToken(){return hex(crypto.getRandomValues(new Uint8Array(32)));}
export async function hashCareTransferToken(token){
 if(typeof token!=='string'||!/^[a-f0-9]{64}$/.test(token))throw Error('INVALID_TRANSFER_TOKEN');
 return hex(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(token))));
}
export function publicPassport(record){
 if(!record||record.published!==true||record.quality_decision!=='approved_for_sale'||record.physical_verified!==true)return null;
 const serial=clean(record.serial_code,90);if(!serial)return null;
 return Object.freeze({serial_code:serial,title:clean(record.public_title,120),edition:clean(record.public_edition,90),finish:clean(record.public_finish,180),care:clean(record.public_care,1800)});
}
// Preliminary validation only; persistent transfer MUST atomically consume
// the unexpired token hash and current owner version in one transaction.
export function transferEligible(r,now){
 return Boolean(r&&r.revoked===false&&r.consumed===false&&Number.isFinite(r.expires_ms)&&Number.isFinite(now)&&r.expires_ms>now&&Number.isSafeInteger(r.owner_version)&&r.owner_version>=1);
}
