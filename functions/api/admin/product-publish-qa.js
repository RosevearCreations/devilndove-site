// Release 467 Build 169 — explicit low-read Product QA for the dedicated Product Editor.
// GET is read-only: no request-time DDL and no automatic QA-history write.
import { getDb, jsonResponse, normalizeText } from '../_lib/adminAudit.js';

function json(data,status=200,headers={}){return jsonResponse(data,status,{'Cache-Control':'no-store','X-DD-D1-Read-Contract':'product-qa-v169-explicit',...headers});}
function adminFromContext(context){const user=context?.data?.ddModuleAccess?.user||null;return user&&String(user.role||'').toLowerCase()==='admin'?user:null;}
function rows(result){return Array.isArray(result?.results)?result.results:[];}
function measuredRows(result){const n=Number(result?.meta?.rows_read??result?.meta?.rowsRead);return Number.isFinite(n)&&n>=0?n:0;}
function clean(value){return String(value||'').trim();}

function fixTarget(productId,code){
  const key=String(code||'').toLowerCase();
  if(['gallery','mini_gallery','missing_featured_image','missing_image_alt'].includes(key))return {kind:'media',label:'Open Image Editor',url:`/admin/catalog-media/?product_id=${encodeURIComponent(productId)}`};
  if(['seo_title','seo_meta','missing_meta_title','missing_meta_description'].includes(key))return {kind:'editor',label:'Fix SEO',tab:'seo',field:key.includes('title')?'meta_title':'meta_description'};
  if(['cart_basics','missing_price'].includes(key))return {kind:'editor',label:'Fix pricing',tab:'pricing',field:'price'};
  if(['product_active','review_published','missing_review_status','missing_status'].includes(key))return {kind:'editor',label:'Fix status',tab:'basics',field:key.includes('review')?'review_status':'status'};
  if(['product_detail_json','missing_slug'].includes(key))return {kind:'editor',label:'Fix slug',tab:'basics',field:'slug'};
  return {kind:'editor',label:'Fix Product',tab:'basics',field:'name'};
}
function mappedCheck(productId,check){
  const target=fixTarget(productId,check.code);
  const fixUrl=target.kind==='media'?target.url:`/admin/product-editor/?product_id=${encodeURIComponent(productId)}&tab=${encodeURIComponent(target.tab)}&focus=${encodeURIComponent(target.field)}`;
  return {...check,fix_target:target,fix_url:fixUrl};
}

async function runChecks(db,productId){
  const productResult=await db.prepare(`
    SELECT p.product_id,p.name,p.slug,p.status,p.review_status,p.price_cents,p.featured_image_url,
           ps.meta_title,ps.meta_description
    FROM products p
    LEFT JOIN product_seo ps ON ps.product_id=p.product_id
    WHERE p.product_id=?
    LIMIT 1
  `).bind(productId).all();
  const product=rows(productResult)[0]||null;
  if(!product){const error=new Error('Product not found.');error.status=404;throw error;}

  // Two rows are sufficient for both "has an image" and "mini-gallery has >1" checks.
  let imageResult={results:[],meta:{rows_read:0}};
  try{imageResult=await db.prepare(`SELECT image_url,alt_text,sort_order FROM product_images WHERE product_id=? ORDER BY COALESCE(sort_order,0) ASC,product_image_id ASC LIMIT 2`).bind(productId).all();}catch{}
  const imageRows=rows(imageResult);
  const hasFeatured=!!normalizeText(product.featured_image_url);
  const checks=[
    {code:'product_active',ok:String(product.status||'').toLowerCase()==='active',label:'Storefront status',help:'Product status must be active for storefront visibility.'},
    {code:'review_published',ok:['published','approved'].includes(String(product.review_status||'').toLowerCase()),label:'Review status',help:'Review status should be approved or published.'},
    {code:'product_detail_json',ok:!!normalizeText(product.slug),label:'Product slug',help:'Product detail JSON needs a slug.'},
    {code:'gallery',ok:imageRows.length>=1||hasFeatured,label:'Product image',help:'At least one Product image should render.'},
    {code:'cart_basics',ok:Number(product.price_cents||0)>=0&&!!normalizeText(product.name),label:'Cart basics',help:'Cart needs a Product name and a valid price.'},
    {code:'seo_title',ok:!!normalizeText(product.meta_title),label:'SEO title',help:'SEO title is missing.'},
    {code:'seo_meta',ok:!!normalizeText(product.meta_description),label:'SEO description',help:'SEO meta description is missing.'},
    {code:'structured_data',ok:!!normalizeText(product.name)&&Number(product.price_cents||0)>=0,label:'Structured data basics',help:'Product structured data needs name and price.'},
    {code:'mini_gallery',ok:imageRows.length>1||hasFeatured,label:'Mini-gallery',help:'A featured image satisfies the minimum; add a second gallery image when useful.'}
  ].map((check)=>mappedCheck(productId,check));
  return {product,images:imageRows,checks,passed:checks.filter((row)=>row.ok).length,failed:checks.filter((row)=>!row.ok).length,d1RowsRead:measuredRows(productResult)+measuredRows(imageResult)};
}

export async function onRequestGet(context){
  const admin=adminFromContext(context);if(!admin)return json({ok:false,error:'Administrator authorization was not established by the route guard.'},401);
  const db=getDb(context.env);if(!db)return json({ok:false,error:'Database binding is missing.'},500);
  const url=new URL(context.request.url);const productId=Number(url.searchParams.get('product_id')||0);const historyOnly=url.searchParams.get('history')==='1';
  try{
    if(historyOnly){
      if(!Number.isInteger(productId)||productId<=0)return json({ok:false,error:'A valid product_id is required for QA history.'},400);
      let result={results:[],meta:{rows_read:0}};try{result=await db.prepare(`SELECT product_publish_qa_result_id,product_id,product_slug,qa_status,passed_count,failed_count,checks_json,created_at FROM product_publish_qa_results WHERE product_id=? ORDER BY datetime(created_at) DESC LIMIT 8`).bind(productId).all();}catch{}
      const read=measuredRows(result);return json({ok:true,history:rows(result),product_id:productId,delivery:'product-qa-history-v169-read-only',d1_rows_read:read,persisted_by_this_request:false},200,{'X-DD-D1-Rows-Read':String(read)});
    }
    if(!Number.isInteger(productId)||productId<=0)return json({ok:false,error:'A valid product_id is required. Build 169 no longer performs catalog-wide QA reads from this endpoint.'},400);
    const result=await runChecks(db,productId);const status=result.failed===0?'passed':'failed';
    return json({ok:true,product_id:productId,product_slug:clean(result.product.slug),checks:result.checks,passed:result.passed,failed:result.failed,qa_status:status,images:result.images,delivery:'product-qa-v169-explicit-read-only',persisted:false,retry_automatically:false,d1_rows_read:result.d1RowsRead},200,{'X-DD-D1-Rows-Read':String(result.d1RowsRead)});
  }catch(error){
    const message=String(error?.message||'Product QA read failed.');const quota=/rows read|daily|limit|quota|7500/i.test(message);const status=Number(error?.status||0)|| (quota?503:500);
    return json({ok:false,error:quota?'D1 read capacity is temporarily unavailable. Product QA will not retry automatically.':message,code:quota?'d1_read_capacity_unavailable':'product_qa_read_failed',retry_automatically:false},status);
  }
}
