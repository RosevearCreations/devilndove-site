// Release 467 Build 213 — customer-safe immutable Packaging proof artifact.
// Reads only the Packaging saved version referenced by the active private proof token.
// No CAIP/private-media access and no mutation.
const clean=(v,n=200)=>String(v??'').trim().slice(0,n);
function response(text,status=200,headers={}){return new Response(text,{status,headers:{'Cache-Control':'no-store','X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer',...headers}});}

export async function onRequestGet(context){
  const db=context.env.DB||context.env.DD_DB;
  if(!db)return response('Database binding is not configured.',500,{'Content-Type':'text/plain; charset=utf-8'});
  const token=clean(new URL(context.request.url).searchParams.get('token'),180);
  if(!token||!token.startsWith('proof_'))return response('Invalid proof token.',400,{'Content-Type':'text/plain; charset=utf-8'});
  const row=await db.prepare(`SELECT p.proof_status,p.expires_at,p.packaging_project_id,p.packaging_project_version_id,
      v.svg_markup,v.version_number,v.version_label
    FROM custom_request_proof_versions p
    JOIN packaging_project_versions v ON v.packaging_project_version_id=p.packaging_project_version_id
      AND v.packaging_project_id=p.packaging_project_id
    WHERE p.proof_token=? AND p.source_kind='packaging_version' LIMIT 1`).bind(token).first().catch(()=>null);
  if(!row||['draft','superseded','expired'].includes(String(row.proof_status||'')))return response('Proof artifact unavailable.',404,{'Content-Type':'text/plain; charset=utf-8'});
  if(row.expires_at&&new Date(row.expires_at).getTime()<Date.now())return response('Proof artifact expired.',404,{'Content-Type':'text/plain; charset=utf-8'});
  const svg=String(row.svg_markup||'').trim();
  if(!svg)return response('Proof artifact unavailable.',404,{'Content-Type':'text/plain; charset=utf-8'});
  return response(svg,200,{
    'Content-Type':'image/svg+xml; charset=utf-8',
    'Content-Disposition':`inline; filename="devilndove-proof-v${Number(row.version_number||0)}.svg"`,
    'Content-Security-Policy':"default-src 'none'; img-src data: https:; style-src 'unsafe-inline'; font-src data:; script-src 'none'; object-src 'none'; frame-ancestors 'self'",
  });
}
