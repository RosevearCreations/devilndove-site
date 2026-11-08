// Release 467 Build 162 — bounded Product browser projection.
// One Product-table page read only. No joins, correlated subqueries, readiness scans,
// media-table reads, R2 access or background refresh contract.
import { getDb, jsonResponse } from '../_lib/adminAudit.js';

const MAX_LIMIT=50;
// Build 635: ordered keyset pages retain one bounded Products-table query.
// These are fixed SQL fragments; user choices and cursor values are bound data.
const SORTS={
  newest:{order:'product_id DESC'},
  name:{order:'name COLLATE NOCASE ASC, product_id DESC',key:'name COLLATE NOCASE',compare:'>'},
  price:{order:'price_cents ASC, product_id DESC',key:'price_cents',compare:'>'},
  updated:{order:"COALESCE(updated_at,'') DESC, product_id DESC",key:"COALESCE(updated_at,'')",compare:'<'}
};
function json(data,status=200,headers={}){return jsonResponse(data,status,{'Cache-Control':'no-store','X-DD-D1-Read-Contract':'product-browser-v162',...headers});}
function cleanText(value,max=160){return String(value||'').trim().slice(0,max);}
function clampLimit(value){if(value==null||String(value).trim()==='')return 40;const n=Number(value);return Number.isInteger(n)?Math.max(1,Math.min(MAX_LIMIT,n)):40;}
function adminFromContext(context){const user=context?.data?.ddModuleAccess?.user||null;return user&&String(user.role||'').toLowerCase()==='admin'?user:null;}
function measuredRows(result){const n=Number(result?.meta?.rows_read??result?.meta?.rowsRead);return Number.isFinite(n)&&n>=0?n:null;}
function parseCursor635(raw,sort){
  if(!raw)return null;
  if(sort==='newest'){
    const id=Number(raw);if(!Number.isSafeInteger(id)||id<=0)throw new Error('invalid_cursor');
    return {id};
  }
  if(raw.length>500)throw new Error('invalid_cursor');
  let parsed;try{parsed=JSON.parse(raw);}catch{throw new Error('invalid_cursor');}
  if(!parsed||parsed.sort!==sort||!Number.isSafeInteger(parsed.id)||parsed.id<=0)throw new Error('invalid_cursor');
  if(sort==='price'){
    if(!Number.isSafeInteger(parsed.key)||parsed.key<0)throw new Error('invalid_cursor');
  }else if(typeof parsed.key!=='string'||parsed.key.length>200)throw new Error('invalid_cursor');
  return parsed;
}
function rowKey635(row,sort){return sort==='name'?String(row.name||''):
  sort==='price'?Number(row.price_cents||0):String(row.updated_at||'');}

export async function onRequestGet(context){
  const {request,env}=context;
  const admin=adminFromContext(context);
  if(!admin)return json({ok:false,error:'Administrator authorization was not established by the route guard.'},401);
  const db=getDb(env);if(!db)return json({ok:false,error:'Database binding is not configured.'},500);
  const url=new URL(request.url);
  const limit=clampLimit(url.searchParams.get('limit'));
  const sort=String(url.searchParams.get('sort')||'newest').trim();
  const photoFilter=String(url.searchParams.get('photos')||'all').trim();
  const category=cleanText(url.searchParams.get('category'),80);
  if(!Object.hasOwn(SORTS,sort)||!['all','featured-missing'].includes(photoFilter))
    return json({ok:false,error:'Unsupported Product sort or image filter.',code:'invalid_browser_filter'},400);
  let cursor;try{cursor=parseCursor635(String(url.searchParams.get('cursor')||''),sort);}
  catch{return json({ok:false,error:'Product page position is invalid for this sort. Start a new search.',code:'invalid_cursor'},400);}
  const q=cleanText(url.searchParams.get('q'),100);
  const clauses=[];const binds=[];
  if(cursor){
    if(sort==='newest'){clauses.push('product_id < ?');binds.push(cursor.id);}
    else{const {key,compare}=SORTS[sort];
      clauses.push(`(${key} ${compare} ? OR (${key} = ? AND product_id < ?))`);
      binds.push(cursor.key,cursor.key,cursor.id);
    }
  }
  if(category){clauses.push('product_category = ? COLLATE NOCASE');binds.push(category);}
  if(photoFilter==='featured-missing')clauses.push("TRIM(COALESCE(featured_image_url,'')) = ''");
  if(q){
    const numericId=Number(q);
    if(Number.isInteger(numericId)&&numericId>0){clauses.push('(product_id = ? OR product_number = ?)');binds.push(numericId,numericId);}
    else{
      const prefix=`${q.replace(/[%_]/g,'')}%`;
      clauses.push('(name LIKE ? COLLATE NOCASE OR sku LIKE ? COLLATE NOCASE OR slug LIKE ? COLLATE NOCASE OR product_category LIKE ? COLLATE NOCASE)');
      binds.push(prefix,prefix,prefix,prefix);
    }
  }
  const where=clauses.length?`WHERE ${clauses.join(' AND ')}`:'';
  const orderSql=sort==='newest'?'ORDER BY product_id DESC':`ORDER BY ${SORTS[sort].order}`;
  const sql=`SELECT product_id, product_number, sku, name, slug, product_category, product_type, status, review_status, price_cents, currency, inventory_tracking, inventory_quantity, featured_image_url, updated_at FROM products ${where} ${orderSql} LIMIT ?`;
  binds.push(limit+1);
  try{
    const result=await db.prepare(sql).bind(...binds).all();
    const rows=Array.isArray(result?.results)?result.results:[];
    const hasMore=rows.length>limit;
    const products=rows.slice(0,limit).map((row)=>({...row,product_id:Number(row.product_id||0),product_number:row.product_number==null?null:Number(row.product_number),price_cents:Number(row.price_cents||0),inventory_quantity:Number(row.inventory_quantity||0),inventory_tracking:Number(row.inventory_tracking||0)}));
    const last=products[products.length-1];
    const nextCursor=hasMore&&last?(sort==='newest'?Number(last.product_id||0):
      JSON.stringify({sort,key:rowKey635(last,sort),id:Number(last.product_id||0)})):null;
    const rowsRead=measuredRows(result);
    return json({ok:true,products,next_cursor:nextCursor,has_more:hasMore,limit,query:q||null,sort,category:category||null,photos:photoFilter,delivery:'product-browser-v162',read_policy:'single_products_page_query',d1_rows_read:rowsRead},200,rowsRead==null?{}:{'X-DD-D1-Rows-Read':String(rowsRead)});
  }catch(error){
    const message=String(error?.message||'Product browser read failed.');
    const quota=/rows read|daily|limit|quota|7500/i.test(message);
    return json({ok:false,error:quota?'D1 read capacity is temporarily unavailable. Product Browser will not retry automatically.':message,code:quota?'d1_read_capacity_unavailable':'product_browser_failed',retry_automatically:false},quota?503:500);
  }
}
