// Release 467 Build 61 — read-only same-origin public R2 media authority.
// Product, Movie and approved brand-media UIs route public URLs through the environment-bound
// PRODUCT_MEDIA_BUCKET. Build 160 adds an explicit Admin-only recovery contract for stale
// Product keys: missing Admin images return a neutral SVG placeholder with HTTP 200 so the
// Products workspace never emits a second-wave 404 storm. Public media semantics remain unchanged.
// This route never lists or mutates R2.

const PUBLIC_PREFIXES=['products/','movies/','brand/','Itemsforsale/','itemsforsale/','Toolshed/','Tools/','Supplies/','toolshed/','tools/','supplies/'];
const LEGACY_PUBLIC_HOSTS=new Set(['assets.devilndove.com','pub-f8137eb938da486a9f24410ccf49087c.r2.dev']);

function json(data,status=200){return new Response(JSON.stringify(data),{status,headers:{'Content-Type':'application/json','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});}
function cleanKey(value){
  let key=String(value||'').trim();
  if(!key)return '';
  try{key=decodeURIComponent(key);}catch{}
  key=key.replace(/^\/+/, '');
  if(key.length>1024||key.includes('\\')||key.split('/').some((part)=>part==='..'||part==='.'||!part))return '';
  if(/[\u0000-\u001f\u007f]/.test(key))return '';
  if(!PUBLIC_PREFIXES.some(prefix=>key.startsWith(prefix)))return '';
  return key;
}
function keyFromRequest(request){
  const url=new URL(request.url);
  const direct=cleanKey(url.searchParams.get('key'));
  if(direct)return direct;
  const src=String(url.searchParams.get('src')||'').trim();
  if(!src)return '';
  try{
    const parsed=new URL(src);
    if(parsed.protocol!=='https:'||!LEGACY_PUBLIC_HOSTS.has(parsed.hostname.toLowerCase()))return '';
    return cleanKey(parsed.pathname);
  }catch{return '';}
}
function keyCandidates(key){
  const out=[key];
  const lower=key.toLowerCase();
  if(lower.startsWith('itemsforsale/')){
    const tail=key.slice(key.indexOf('/')+1);
    out.push(`Itemsforsale/${tail}`,`itemsforsale/${tail}`);
  }
  if(lower.startsWith('toolshed/')){
    const tail=key.slice(key.indexOf('/')+1);out.push(`Toolshed/${tail}`,`toolshed/${tail}`);
  }
  if(lower.startsWith('tools/')){
    const tail=key.slice(key.indexOf('/')+1);out.push(`Tools/${tail}`,`tools/${tail}`);
  }
  if(lower.startsWith('supplies/')){
    const tail=key.slice(key.indexOf('/')+1);out.push(`Supplies/${tail}`,`supplies/${tail}`);
  }
  return [...new Set(out)];
}
function inferredType(key){
  const ext=String(key.split('.').pop()||'').toLowerCase();
  return ({jpg:'image/jpeg',jpeg:'image/jpeg',png:'image/png',webp:'image/webp',gif:'image/gif',avif:'image/avif',svg:'image/svg+xml',mp4:'video/mp4',webm:'video/webm'})[ext]||'application/octet-stream';
}
function bucketFromEnv(env){return env.PRODUCT_MEDIA_BUCKET||env.MEDIA_BUCKET||env.R2_PRODUCT_MEDIA||null;}
function adminRecoveryRequested(request,key){
  if(!String(key||'').startsWith('products/'))return false;
  try{return new URL(request.url).searchParams.get('admin_recovery')==='1';}catch{return false;}
}
function adminRecoveryPlaceholder(key){
  const svg=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600" role="img" aria-label="Product image unavailable"><rect width="800" height="600" fill="#f3f4f6"/><g fill="#6b7280" font-family="Arial,sans-serif" text-anchor="middle"><text x="400" y="285" font-size="34">Product image unavailable</text><text x="400" y="335" font-size="22">Original media is being recovered</text></g></svg>`;
  return new Response(svg,{status:200,headers:{
    'Content-Type':'image/svg+xml; charset=utf-8',
    'Cache-Control':'no-store',
    'X-Content-Type-Options':'nosniff',
    'Cross-Origin-Resource-Policy':'same-site',
    'X-DD-Media-Recovery':'admin-placeholder',
    'X-DD-Media-Key':String(key||'')
  }});
}

export async function onRequestGet({request,env}){
  const key=keyFromRequest(request);
  if(!key)return json({ok:false,code:'INVALID_PUBLIC_MEDIA_KEY',error:'A valid public media key is required.'},400);
  const adminRecovery=adminRecoveryRequested(request,key);
  const bucket=bucketFromEnv(env);
  if(!bucket||typeof bucket.get!=='function')return json({ok:false,code:'PRODUCT_MEDIA_BUCKET_UNAVAILABLE',error:'Public media storage is not configured.'},503);
  try{
    let object=null;let resolvedKey='';
    for(const candidate of keyCandidates(key)){
      object=await bucket.get(candidate);
      if(object){resolvedKey=candidate;break;}
    }
    if(!object){
      if(adminRecovery)return adminRecoveryPlaceholder(key);
      return json({ok:false,code:'PUBLIC_MEDIA_NOT_FOUND',error:'Public media was not found.',requested_key:key},404);
    }
    const headers=new Headers();
    if(typeof object.writeHttpMetadata==='function')object.writeHttpMetadata(headers);
    if(!headers.get('Content-Type'))headers.set('Content-Type',inferredType(resolvedKey||key));
    headers.set('Cache-Control','public, max-age=86400, stale-while-revalidate=604800');
    headers.set('X-Content-Type-Options','nosniff');
    headers.set('Cross-Origin-Resource-Policy','same-site');
    headers.set('X-DD-Media-Key',resolvedKey||key);
    if(object.httpEtag)headers.set('ETag',object.httpEtag);
    return new Response(object.body,{status:200,headers});
  }catch(error){
    return json({ok:false,code:'PUBLIC_MEDIA_READ_FAILED',error:'Public media could not be read.',detail:String(error?.message||'').slice(0,200)},500);
  }
}