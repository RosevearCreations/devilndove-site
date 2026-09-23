// Release 467 Build 244 — CSRF / Origin Protection for Mutating Routes.
// Browser-origin state changes must prove same-origin. Provider callbacks remain on their own
// signature-validation paths and non-browser bearer/cookie automation remains compatible.
const READ_METHODS = new Set(['GET','HEAD','OPTIONS']);
const PROVIDER_CALLBACK_EXEMPTIONS = new Set([
  '/api/stripe-webhook',
  '/api/paypal-webhook',
  '/api/social/meta/data-deletion'
]);

function text(value){ return String(value || '').trim(); }
function bearer(request){
  const value=text(request.headers.get('Authorization'));
  return /^Bearer\s+\S+/i.test(value);
}
function providerCallback(pathname){
  return PROVIDER_CALLBACK_EXEMPTIONS.has(String(pathname || '').replace(/\/$/,''));
}
function denial(reason, requestOrigin, suppliedOrigin=''){
  return new Response(JSON.stringify({
    ok:false,
    error:'Cross-origin browser mutation rejected.',
    code:'csrf_origin_rejected',
    reason,
    expected_origin:requestOrigin,
    supplied_origin:suppliedOrigin || null,
    release:467,
    build:244
  }),{
    status:403,
    headers:{
      'Content-Type':'application/json; charset=utf-8',
      'Cache-Control':'no-store',
      'X-Content-Type-Options':'nosniff',
      'Referrer-Policy':'strict-origin-when-cross-origin',
      'X-DND-CSRF-Guard':'467b244'
    }
  });
}

export function evaluateMutationOrigin(request){
  const method=text(request.method || 'GET').toUpperCase();
  const url=new URL(request.url);
  const pathname=url.pathname;
  if(!pathname.startsWith('/api/') || READ_METHODS.has(method)){
    return {allowed:true,mode:'read_or_non_api'};
  }
  if(providerCallback(pathname)){
    return {allowed:true,mode:'provider_signature_path'};
  }
  // Explicit Bearer remains the compatibility lane for non-browser automation.
  if(bearer(request)){
    return {allowed:true,mode:'bearer_automation'};
  }

  const origin=text(request.headers.get('Origin'));
  if(origin){
    if(origin === url.origin) return {allowed:true,mode:'same_origin_header'};
    return {allowed:false,response:denial('origin_mismatch',url.origin,origin)};
  }

  const referer=text(request.headers.get('Referer'));
  if(referer){
    try{
      const refOrigin=new URL(referer).origin;
      if(refOrigin === url.origin) return {allowed:true,mode:'same_origin_referer'};
      return {allowed:false,response:denial('referer_origin_mismatch',url.origin,refOrigin)};
    }catch{
      return {allowed:false,response:denial('invalid_referer',url.origin,referer)};
    }
  }

  const fetchSite=text(request.headers.get('Sec-Fetch-Site')).toLowerCase();
  if(fetchSite){
    if(fetchSite === 'same-origin') return {allowed:true,mode:'same_origin_fetch_metadata'};
    if(fetchSite === 'cross-site' || fetchSite === 'same-site'){
      return {allowed:false,response:denial('fetch_metadata_not_same_origin',url.origin,fetchSite)};
    }
  }

  // Headerless requests are treated as API/automation compatibility. Browsers making
  // state-changing fetch/form requests send Origin and/or Fetch Metadata in supported clients.
  return {allowed:true,mode:'headerless_api_compatibility'};
}

export function protectMutationOrigin(request){
  const result=evaluateMutationOrigin(request);
  return result.allowed ? null : result.response;
}

export const BUILD244_ORIGIN_POLICY=Object.freeze({
  release:467,
  build:244,
  state_changing_methods:['POST','PUT','PATCH','DELETE'],
  browser_requirement:'same-origin',
  bearer_automation_compatible:true,
  headerless_api_compatible:true,
  provider_callbacks:[...PROVIDER_CALLBACK_EXEMPTIONS],
  provider_callbacks_use_separate_signature_validation:true
});
