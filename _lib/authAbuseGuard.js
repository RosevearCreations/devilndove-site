// Release 467 Build 246 — bounded authentication abuse resistance.
// Uses Cloudflare Cache API as an ephemeral counter store; no D1/R2 writes and no secret values.
function text(value){return String(value||'').trim();}
async function digest(value){
  const bytes=new TextEncoder().encode(String(value||''));
  const hash=await crypto.subtle.digest('SHA-256',bytes);
  return [...new Uint8Array(hash)].slice(0,16).map(v=>v.toString(16).padStart(2,'0')).join('');
}
function clientIp(request){
  return text(request.headers.get('CF-Connecting-IP')||request.headers.get('X-Forwarded-For')?.split(',')[0]||'unknown');
}
export async function consumeAbuseBudget({request,scope,identity='',limit=8,windowSeconds=900}){
  const normalizedScope=text(scope).toLowerCase().replace(/[^a-z0-9_-]/g,'_')||'auth';
  const fingerprint=await digest(`${normalizedScope}|${clientIp(request)}|${text(identity).toLowerCase()}`);
  const cache=globalThis.caches?.default;
  if(!cache||typeof cache.match!=='function'||typeof cache.put!=='function'){
    return {allowed:true,remaining:Number(limit),retry_after:0,mode:'cache_unavailable_fail_open',fingerprint_exposed:false};
  }
  const key=new Request(`https://security-budget.devilndove.invalid/${normalizedScope}/${fingerprint}`,{method:'GET'});
  const now=Math.floor(Date.now()/1000);
  let record={count:0,reset_at:now+Number(windowSeconds)};
  try{
    const hit=await cache.match(key);
    if(hit){
      const parsed=await hit.json().catch(()=>null);
      if(parsed&&Number(parsed.reset_at)>now)record={count:Number(parsed.count||0),reset_at:Number(parsed.reset_at)};
    }
    record.count+=1;
    const ttl=Math.max(1,record.reset_at-now);
    await cache.put(key,new Response(JSON.stringify(record),{headers:{'Content-Type':'application/json','Cache-Control':`max-age=${ttl}`}}));
    const allowed=record.count<=Number(limit);
    return {allowed,remaining:Math.max(0,Number(limit)-record.count),retry_after:allowed?0:ttl,mode:'cloudflare_cache',fingerprint_exposed:false};
  }catch{
    return {allowed:true,remaining:Number(limit),retry_after:0,mode:'cache_error_fail_open',fingerprint_exposed:false};
  }
}
export function rateLimitedResponse(result,message='Too many attempts. Please wait and try again.'){
  const retry=Math.max(1,Number(result?.retry_after||60));
  return new Response(JSON.stringify({ok:false,error:message,code:'AUTH_RATE_LIMITED',retry_after_seconds:retry}),{
    status:429,
    headers:{'Content-Type':'application/json','Cache-Control':'no-store','Retry-After':String(retry),'X-Content-Type-Options':'nosniff'}
  });
}
export const BUILD246_ABUSE_POLICY=Object.freeze({
  login:{limit:8,window_seconds:900},
  password_change:{limit:6,window_seconds:900},
  admin_password_reset:{limit:6,window_seconds:900},
  account_recovery:{contact_email_per_hour:3,ip_per_hour:6},
  storage:'ephemeral_cloudflare_cache_plus_existing_bounded_recovery_rows',
  logs_secrets:false
});
