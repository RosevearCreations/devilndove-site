// Build 59 — read-only same-origin fallback for public Product media stored in R2.
// This endpoint never lists or mutates R2. It serves only validated products/* keys.

function json(data,status=200){return new Response(JSON.stringify(data),{status,headers:{'Content-Type':'application/json','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});}
function cleanKey(value){
  let key=String(value||'').trim();
  if(!key)return '';
  try{key=decodeURIComponent(key);}catch{}
  key=key.replace(/^\/+/, '');
  if(!key.startsWith('products/'))return '';
  if(key.length>1024||key.includes('\\')||key.split('/').some((part)=>part==='..'||part==='.'||!part))return '';
  if(/[\u0000-\u001f\u007f]/.test(key))return '';
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
    if(parsed.protocol!=='https:'||parsed.hostname.toLowerCase()!=='assets.devilndove.com')return '';
    return cleanKey(parsed.pathname);
  }catch{return '';}
}
function inferredType(key){
  const ext=String(key.split('.').pop()||'').toLowerCase();
  return ({jpg:'image/jpeg',jpeg:'image/jpeg',png:'image/png',webp:'image/webp',gif:'image/gif',avif:'image/avif',svg:'image/svg+xml'})[ext]||'application/octet-stream';
}
function bucketFromEnv(env){return env.PRODUCT_MEDIA_BUCKET||env.MEDIA_BUCKET||env.R2_PRODUCT_MEDIA||null;}

export async function onRequestGet({request,env}){
  const key=keyFromRequest(request);
  if(!key)return json({ok:false,code:'INVALID_PRODUCT_MEDIA_KEY',error:'A valid products/* media key is required.'},400);
  const bucket=bucketFromEnv(env);
  if(!bucket||typeof bucket.get!=='function')return json({ok:false,code:'PRODUCT_MEDIA_BUCKET_UNAVAILABLE',error:'Product media storage is not configured.'},503);
  try{
    const object=await bucket.get(key);
    if(!object)return json({ok:false,code:'PRODUCT_MEDIA_NOT_FOUND',error:'Product media was not found.'},404);
    const headers=new Headers();
    if(typeof object.writeHttpMetadata==='function')object.writeHttpMetadata(headers);
    if(!headers.get('Content-Type'))headers.set('Content-Type',inferredType(key));
    headers.set('Cache-Control','public, max-age=86400, stale-while-revalidate=604800');
    headers.set('X-Content-Type-Options','nosniff');
    headers.set('Cross-Origin-Resource-Policy','same-site');
    if(object.httpEtag)headers.set('ETag',object.httpEtag);
    return new Response(object.body,{status:200,headers});
  }catch(error){
    return json({ok:false,code:'PRODUCT_MEDIA_READ_FAILED',error:'Product media could not be read.',detail:String(error?.message||'').slice(0,200)},500);
  }
}
