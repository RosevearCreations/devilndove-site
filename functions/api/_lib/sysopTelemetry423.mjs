export const SYSOP_TELEMETRY_PATH='/internal/rosevear/sysop/telemetry/v1';
export const SYSOP_TELEMETRY_SCHEMA='rosevear.sysop.statistics.v1';
const encoder=new TextEncoder();
const canonical=v=>Array.isArray(v)?'['+v.map(canonical).join(',')+']':v&&typeof v==='object'?'{'+Object.keys(v).sort().map(k=>JSON.stringify(k)+':'+canonical(v[k])).join(',')+'}':JSON.stringify(v);
const hex=bytes=>Array.from(bytes,b=>b.toString(16).padStart(2,'0')).join('');
function pemBytes(pem){const value=String(pem||'').replace(/-----BEGIN PRIVATE KEY-----|-----END PRIVATE KEY-----|\s+/g,'');if(!value)return null;const bin=atob(value);return Uint8Array.from(bin,c=>c.charCodeAt(0));}
function equal(a,b){if(typeof a!=='string'||typeof b!=='string'||a.length!==b.length)return false;let n=0;for(let i=0;i<a.length;i++)n|=a.charCodeAt(i)^b.charCodeAt(i);return n===0;}
const response=(body,status=200)=>new Response(JSON.stringify(body),{status,headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer','Access-Control-Allow-Origin':'none'}});
export async function handleBuild423Telemetry({request,env={},nowMs=Date.now()}){
 const url=new URL(request.url);if(request.method!=='GET')return response({state:'DENY_METHOD',connected:false,authorizesAction:false},405);
 if(url.pathname!==SYSOP_TELEMETRY_PATH||url.search||url.hash)return response({state:'DENY_SCOPE',connected:false,authorizesAction:false},404);
 const token=env.ROSEVEAR_SYSOP_TELEMETRY_READ_TOKEN,pem=env.ROSEVEAR_SYSOP_TELEMETRY_PRIVATE_KEY_PEM;
 const commit=env.ROSEVEAR_SYSOP_TELEMETRY_SOURCE_COMMIT||env.CF_PAGES_COMMIT_SHA||'';
 if(!token||!pem||!/^[a-f0-9]{40}$/.test(commit))return response({state:'NOT_ENROLLED',connected:false,authorizesAction:false},503);
 if(!equal(request.headers.get('x-rosevear-telemetry-token')||'',token))return response({state:'NOT_AUTHORIZED',connected:false,authorizesAction:false},401);
 try{
  const bytes=pemBytes(pem);if(!bytes)throw Error('key');
  const key=await crypto.subtle.importKey('pkcs8',bytes,{name:'Ed25519'},false,['sign']);
  const nonce=new Uint8Array(16);crypto.getRandomValues(nonce);
  const payload={schema:SYSOP_TELEMETRY_SCHEMA,protocolVersion:'1.1',appId:'devilndove',sourceCommit:commit,eventId:crypto.randomUUID().replaceAll('-',''),nonce:hex(nonce),issuedAtMs:nowMs,expiresAtMs:nowMs+60000,state:'UNKNOWN',metricsWindowSeconds:60,
   metrics:{requests:null,serverErrors:null,jobsCompleted:null,jobsFailed:null,queueDepth:null,latencyP95Ms:null,activeSessions:null},
   sysop:{eventKind:'HEARTBEAT',observedAtMs:nowMs,processUptimeSec:null,restartCount:null,lastRestartAtMs:null,bootTimeMs:null,rebootIsIndependentlyWitnessed:false},
   dataClass:'NON_SENSITIVE_AGGREGATE',tenantId:null,authorizesAction:false};
  const signature=hex(new Uint8Array(await crypto.subtle.sign('Ed25519',key,encoder.encode(canonical(payload)))));
  return response({payload,signature});
 }catch{return response({state:'HOLD_SIGNER_UNAVAILABLE',connected:false,authorizesAction:false},503);}
}
