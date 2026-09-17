// Release 467 Build 162 — single-Product editor authority.
// Startup reads exactly one Product plus its one SEO row. Media, inventory, readiness,
// pricing evidence and other supporting systems are deliberately excluded until requested.
import { getDb, jsonResponse } from '../_lib/adminAudit.js';
import { normalizeTaxRateFraction, taxRatePercent } from './_tax-rate.js';

function json(data,status=200,headers={}){return jsonResponse(data,status,{'Cache-Control':'no-store','X-DD-D1-Read-Contract':'single-product-editor-v162',...headers});}
function adminFromContext(context){const user=context?.data?.ddModuleAccess?.user||null;return user&&String(user.role||'').toLowerCase()==='admin'?user:null;}
function text(value){return String(value||'').trim();}
function measuredRows(result){const n=Number(result?.meta?.rows_read??result?.meta?.rowsRead);return Number.isFinite(n)&&n>=0?n:null;}
function parseColors(value,fallback=''){
  let rows=[];try{const parsed=JSON.parse(String(value||'[]'));if(Array.isArray(parsed))rows=parsed;}catch{}
  const out=[];[fallback,...rows].forEach((entry)=>{const clean=text(entry);if(clean&&!out.some((row)=>row.toLowerCase()===clean.toLowerCase()))out.push(clean);});
  return out.slice(0,12);
}

export async function onRequestGet(context){
  const {request,env}=context;
  const admin=adminFromContext(context);if(!admin)return json({ok:false,error:'Administrator authorization was not established by the route guard.'},401);
  const db=getDb(env);if(!db)return json({ok:false,error:'Database binding is not configured.'},500);
  const productId=Number(new URL(request.url).searchParams.get('product_id'));
  if(!Number.isInteger(productId)||productId<=0)return json({ok:false,error:'A valid product_id is required.'},400);
  try{
    const result=await db.prepare(`
      SELECT p.*,
             ps.meta_title, ps.meta_description, ps.keywords, ps.h1_override,
             ps.canonical_url, ps.schema_type, ps.og_title, ps.og_description, ps.og_image_url
      FROM products p
      LEFT JOIN product_seo ps ON ps.product_id=p.product_id
      WHERE p.product_id=?
      LIMIT 1
    `).bind(productId).all();
    const product=(Array.isArray(result?.results)?result.results:[])[0]||null;
    if(!product)return json({ok:false,error:'Product not found.'},404);
    const rate=normalizeTaxRateFraction(product.tax_rate,product.rate_percent);
    product.tax_rate=rate;product.rate_percent=taxRatePercent(rate);
    product.color_names=parseColors(product.color_names_json,product.color_name);
    product.color_names_text=product.color_names.join(', ');
    const rowsRead=measuredRows(result);
    return json({ok:true,product,delivery:'single-product-editor-v162',d1_rows_read:rowsRead,lazy_sections:{media:true,inventory:true,readiness:true,pricing_evidence:true}},200,rowsRead==null?{}:{'X-DD-D1-Rows-Read':String(rowsRead)});
  }catch(error){
    const message=String(error?.message||'Product Editor read failed.');
    const quota=/rows read|daily|limit|quota|7500/i.test(message);
    return json({ok:false,error:quota?'D1 read capacity is temporarily unavailable. This editor will not retry automatically.':message,code:quota?'d1_read_capacity_unavailable':'product_editor_read_failed',retry_automatically:false},quota?503:500);
  }
}
