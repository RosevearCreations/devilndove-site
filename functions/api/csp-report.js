// Build 526: browser CSP report collector. No database writes, user identifiers,
// full URLs, request bodies, query strings or credentials are logged.
const response=(status=204)=>new Response(null,{status,headers:{'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});
const safe=x=>String(x||'').replace(/[^a-z0-9_-]/gi,'').slice(0,48);

export async function onRequestPost({request}){
  const declared=Number(request.headers.get('Content-Length')||0);
  if(Number.isFinite(declared)&&declared>8192)return response(413);
  let raw='';try{raw=await request.text();}catch{return response(400);}
  if(raw.length>8192)return response(413);
  let decoded;try{decoded=JSON.parse(raw);}catch{return response(400);}
  const entries=Array.isArray(decoded)?decoded.slice(0,3):[decoded];
  for(const entry of entries){
    const report=entry?.['csp-report']||entry?.body||{};
    const directive=safe(report['effective-directive']||report.effectiveDirective||report['violated-directive']);
    if(directive)console.warn('dd-csp-report',{directive,disposition:safe(report.disposition),type:'report-only'});
  }
  return response();
}
