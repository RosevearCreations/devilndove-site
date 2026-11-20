// Build 734: private one-time member recovery. Neither raw tokens nor existence signals go to D1 or logs.
import { formatStoredPasswordHashFromPlaintext } from '../_lib/passwordHash.js';
const okMessage='If the details match an eligible account and email delivery is available, instructions will be sent to its registered address.';
const headers={'Content-Type':'application/json','Cache-Control':'no-store, no-cache','X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer'};
const reply=(status,obj)=>new Response(JSON.stringify(obj),{status,headers});
const email=s=>String(s||'').trim().toLowerCase();
const validEmail=s=>s.length<=254&&/^[^\s@]{1,64}@[^\s@]+\.[^\s@]+$/.test(s);
const hex=buf=>Array.from(new Uint8Array(buf)).map(v=>v.toString(16).padStart(2,'0')).join('');
const hash=async s=>hex(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(s)));
const randomToken=()=>Array.from(crypto.getRandomValues(new Uint8Array(32))).map(v=>v.toString(16).padStart(2,'0')).join('');
const sameOrigin=request=>{
 const origin=request.headers.get('Origin'),url=new URL(request.url);
 if(origin&&origin!==url.origin)return false;
 const site=request.headers.get('Sec-Fetch-Site');
 return !site||site==='same-origin'||site==='none';
};
// Client forwarding headers are attacker-controlled; the platform IP is the only quota input.
function privateIp(request){return String(request.headers.get('CF-Connecting-IP')||'unknown').slice(0,90);}
export function providerReady734(env={}){
 return Boolean(String(env.RESEND_API_KEY||'').trim()&&String(env.NOTIFICATION_FROM_EMAIL||env.RESEND_FROM_EMAIL||env.SUPPORT_FROM_EMAIL||'').trim());
}
async function sendEmail734(env,to,subject,html){
 if(!providerReady734(env))return false;
 try{
  const response=await fetch('https://api.resend.com/emails',{
   method:'POST',headers:{'Authorization':'Bearer '+String(env.RESEND_API_KEY),
    'Content-Type':'application/json'},
   body:JSON.stringify({from:String(env.NOTIFICATION_FROM_EMAIL||env.RESEND_FROM_EMAIL||env.SUPPORT_FROM_EMAIL),to:[to],subject,html}),
   signal:AbortSignal.timeout(8500)
  });
  if(!response.ok)return false;
  const data=await response.json().catch(()=>null);
  return typeof data?.id==='string'&&data.id.length>0;
 }catch{return false;}
}
async function rateProof734(db,request,action,identity){
 const identityHash=await hash('dnd734-identity:'+identity);
 const ipHash=await hash('dnd734-ip:'+privateIp(request));
 // Build 735: one original D1 write-statement gate instead of a racy SELECT+INSERT.
 // Concurrent contenders cannot both pass a stale prior count; fail closed on D1 errors.
 const result=await db.prepare(`INSERT INTO dnd_auth_recovery_attempts_734
  (attempt_id,action,identity_sha256,ip_sha256)
  SELECT ?,?,?,?
  WHERE (SELECT COUNT(*) FROM dnd_auth_recovery_attempts_734
   WHERE action=? AND identity_sha256=? AND created_at>=datetime('now','-1 hour'))<3
  AND (SELECT COUNT(*) FROM dnd_auth_recovery_attempts_734
   WHERE action=? AND ip_sha256=? AND created_at>=datetime('now','-1 hour'))<12`)
  .bind(crypto.randomUUID(),action,identityHash,ipHash,
    action,identityHash,action,ipHash).run();
 return Number(result?.meta?.changes)===1;
}
const canonicalResetLink734=(request,token)=>{
 const url=new URL(request.url);
 const host=url.hostname.toLowerCase();
 // An untrusted Host / vanity domain must never control a credential-recovery URL.
 const authorizedHost=host==='devilndove.com'||host==='www.devilndove.com'||
   host==='dev.devilndove-site.pages.dev'||/^[0-9a-f]{8}\.devilndove-site\.pages\.dev$/.test(host);
 if(url.protocol!=='https:'||!authorizedHost)return '';
 const target=new URL('/account-help/index.html?mode=reset',url.origin);
 return target.href+'#token='+token;
};
async function requestRecovery734(db,env,request,body){
 const action=body.action;
 const address=email(body.email);
 if(!validEmail(address))return reply(400,{ok:false,error:'Enter a valid email address.'});
 // Non-enumerating response, including disabled/unknown accounts and provider unavailability.
 const generic=reply(200,{ok:true,message:okMessage,delivery_unconfirmed:true});
 try{
  if(!(await rateProof734(db,request,action,address)))return generic;
  const user=await db.prepare(`SELECT user_id,email,is_active FROM users
    WHERE LOWER(email)=? LIMIT 1`).bind(address).first();
  if(!user||Number(user.is_active)!==1||!providerReady734(env))return generic;
  if(action==='account_reminder'){
   const html='<p>A Devil n Dove account reminder was requested.</p><p>The email attached to this account is <strong>'+
    address.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')+
    '</strong>.</p><p>If this was not you, ignore this message. We never send passwords.</p>';
   await sendEmail734(env,address,'Devil n Dove account email reminder',html);
   return generic;
  }
  const raw=randomToken(),digest=await hash(raw),id=crypto.randomUUID();
  await db.prepare(`INSERT INTO dnd_password_reset_tokens_734
    (reset_id,user_id,token_sha256,expires_at)
    VALUES(?,?,?,datetime('now','+30 minutes'))`)
   .bind(id,Number(user.user_id),digest).run();
  // Fragment-only bearer never enters web server URL logs/referrers and is never stored in plaintext D1.
  const link=canonicalResetLink734(request,raw);
  if(!link){
   await db.prepare(`UPDATE dnd_password_reset_tokens_734 SET consumed_at=CURRENT_TIMESTAMP,claim_id=? WHERE reset_id=? AND consumed_at IS NULL`).bind(crypto.randomUUID(),id).run();
   return generic;
  }
  const html='<p>To reset your Devil n Dove password, open this single-use link within 30 minutes:</p>'+
   '<p><a href="'+link+'">Reset password</a></p>'+
   '<p>If you did not request this, you can ignore this email. Do not share this link.</p>';
  const sent=await sendEmail734(env,address,'Reset your Devil n Dove password',html);
  if(sent){
   await db.prepare('UPDATE dnd_password_reset_tokens_734 SET sent_at=CURRENT_TIMESTAMP WHERE reset_id=? AND sent_at IS NULL')
    .bind(id).run();
  }else{
   await db.prepare(`UPDATE dnd_password_reset_tokens_734
     SET consumed_at=CURRENT_TIMESTAMP,claim_id=? WHERE reset_id=? AND consumed_at IS NULL`)
    .bind(crypto.randomUUID(),id).run();
  }
  return generic;
 }catch{return generic;}
}
async function redeem734(db,request,body){
 const token=String(body.token||'').trim().toLowerCase(),password=String(body.new_password||''),
  confirm=String(body.confirm_password||'');
 if(!/^[0-9a-f]{64}$/.test(token))return reply(400,{ok:false,error:'Reset link is invalid or expired.'});
 if(password.length<12||password.length>128||password!==confirm)
  return reply(400,{ok:false,error:'Use a matching new password of 12–128 characters.'});
 try{
  const digest=await hash(token);
  if(!(await rateProof734(db,request,'reset_redeem',digest)))
   return reply(429,{ok:false,error:'Too many attempts. Try again later.'});
  const user=await db.prepare(`SELECT u.user_id FROM dnd_password_reset_tokens_734 t
   JOIN users u ON u.user_id=t.user_id WHERE t.token_sha256=? AND
   t.consumed_at IS NULL AND t.sent_at IS NOT NULL AND t.expires_at>datetime('now')
   AND u.is_active=1 LIMIT 1`).bind(digest).first();
  if(!user)return reply(400,{ok:false,error:'Reset link is invalid or expired.'});
  const newHash=await formatStoredPasswordHashFromPlaintext(password);
  const claim=crypto.randomUUID();
  // D1 batch is atomic: one claimant updates the token, password and user sessions.
  const rows=await db.batch([
   db.prepare(`UPDATE dnd_password_reset_tokens_734
    SET consumed_at=CURRENT_TIMESTAMP,claim_id=? WHERE token_sha256=?
    AND consumed_at IS NULL AND sent_at IS NOT NULL AND expires_at>datetime('now')`)
    .bind(claim,digest),
   db.prepare(`UPDATE users SET password_hash=?,updated_at=CURRENT_TIMESTAMP
    WHERE user_id=? AND is_active=1 AND EXISTS (
      SELECT 1 FROM dnd_password_reset_tokens_734 WHERE token_sha256=? AND claim_id=?)`)
    .bind(newHash,Number(user.user_id),digest,claim),
   db.prepare(`DELETE FROM sessions WHERE user_id=? AND EXISTS (
      SELECT 1 FROM dnd_password_reset_tokens_734 WHERE token_sha256=? AND claim_id=?)`)
    .bind(Number(user.user_id),digest,claim),
   db.prepare(`UPDATE dnd_password_reset_tokens_734
    SET consumed_at=CURRENT_TIMESTAMP,claim_id=reset_id
    WHERE user_id=? AND reset_id<>(
       SELECT reset_id FROM dnd_password_reset_tokens_734 WHERE token_sha256=?)
      AND consumed_at IS NULL AND EXISTS (
       SELECT 1 FROM dnd_password_reset_tokens_734 WHERE token_sha256=? AND claim_id=?)`)
    .bind(Number(user.user_id),digest,digest,claim)
  ]);
  if(Number(rows?.[0]?.meta?.changes)!==1||Number(rows?.[1]?.meta?.changes)!==1)
   return reply(400,{ok:false,error:'Reset link is invalid or expired.'});
  return reply(200,{ok:true,message:'Password updated. All previous sessions were signed out. Please sign in using your new password.'});
 }catch{return reply(503,{ok:false,error:'Password reset could not be completed. Try again later.'});}
}
export async function onRequestPost(context){
 const {request,env}=context;
 if(!sameOrigin(request))return reply(403,{ok:false,error:'Request origin was not accepted.'});
 if(Number(request.headers.get('Content-Length')||0)>2048)
  return reply(413,{ok:false,error:'Request too large.'});
 let body;try{body=await request.json();}catch{return reply(400,{ok:false,error:'Invalid request.'});}
 if(!body||typeof body!=='object'||Array.isArray(body))return reply(400,{ok:false,error:'Invalid request.'});
 if(JSON.stringify(body).length>1800)return reply(413,{ok:false,error:'Request too large.'});
 const action=String(body.action||'');
 if(!['reset_request','account_reminder','reset_redeem'].includes(action))
  return reply(400,{ok:false,error:'Unsupported account recovery action.'});
 const db=env?.DB;
 if(!db||typeof db.prepare!=='function'||typeof db.batch!=='function')
  return reply(503,{ok:false,error:'Account recovery is temporarily unavailable.'});
 if(action==='reset_redeem')return redeem734(db,request,body);
 // Return the same generic response before any original account lookup or provider call.
 // Cloudflare waitUntil retains work without leaking registered-account existence via mail latency.
 if(typeof context.waitUntil==='function'){
  context.waitUntil(requestRecovery734(db,env,request,body).catch(()=>null));
  return reply(200,{ok:true,message:okMessage,delivery_unconfirmed:true});
 }
 // Non-Cloudflare harness only. Production always supplies Pages Functions waitUntil.
 return requestRecovery734(db,env,request,body);
}
