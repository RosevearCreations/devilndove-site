// Release 467 Build 298 — admin Merchant/Search distribution diagnostics and explicit IndexNow submission.
import { auditAdminAction, getAdminUserFromRequest, getDb, jsonResponse, normalizeText } from '../_lib/adminAudit.js';
import { merchantCoverage } from '../_lib/merchantSearchDistribution.js';
import { loadDynamicSitemapEntries } from '../_lib/publicSearchSeo.js';

const ORIGIN='https://devilndove.com';
const json=(data,status=200)=>jsonResponse(data,status,{'Cache-Control':'no-store'});
const clean=(v,n=500)=>normalizeText(v).slice(0,n);
const truthy=(v)=>['1','true','yes','on'].includes(clean(v).toLowerCase());
function validIndexNowUrl(value){
  try{
    const u=new URL(clean(value));
    if(u.protocol!=='https:'||u.hostname!=='devilndove.com')return '';
    const product=u.pathname==='/shop/product/'&&Boolean(u.searchParams.get('slug'));
    const story=u.pathname==='/workshop-journal/story/'&&Boolean(u.searchParams.get('story'));
    if(!product&&!story)return '';
    u.hash='';return u.toString();
  }catch{return '';}
}
async function searchConsoleSummary(db){
  if(!db)return {available:false,row_count:0,clicks:0,impressions:0,last_report_date:''};
  const row=await db.prepare("SELECT COUNT(*) row_count,COALESCE(SUM(clicks),0) clicks,COALESCE(SUM(impressions),0) impressions,MAX(report_date) last_report_date FROM search_console_page_queries").first().catch(()=>null);
  if(!row)return {available:false,row_count:0,clicks:0,impressions:0,last_report_date:''};
  return {available:true,row_count:Number(row.row_count||0),clicks:Number(row.clicks||0),impressions:Number(row.impressions||0),last_report_date:clean(row.last_report_date,80)};
}
function indexNowConfig(env={}){
  const key=clean(env.INDEXNOW_KEY,128);
  const keyLocation=clean(env.INDEXNOW_KEY_LOCATION,600);
  const endpoint=clean(env.INDEXNOW_ENDPOINT,600)||'https://api.indexnow.org/indexnow';
  return {key_configured:Boolean(key),key_location_configured:Boolean(keyLocation),endpoint_host:(()=>{try{return new URL(endpoint).hostname;}catch{return '';}})(),ready:Boolean(key&&keyLocation),automatic_submission:false,explicit_confirmation_required:'SUBMIT INDEXNOW'};
}
async function eligibleUrls(db){
  const entries=await loadDynamicSitemapEntries(db);
  return [...new Set(entries.map((row)=>validIndexNowUrl(row.loc)).filter(Boolean))].slice(0,10000);
}
export async function onRequestGet(context){
  const user=await getAdminUserFromRequest(context.request,context.env);if(!user)return json({ok:false,error:'Admin access required.'},401);
  const db=getDb(context.env);if(!db)return json({ok:false,error:'Database binding is not configured.'},500);
  const [merchant,gsc,urls]=await Promise.all([merchantCoverage(db,context.env),searchConsoleSummary(db),eligibleUrls(db)]);
  return json({ok:true,release:467,build:298,provider_execution:false,automatic_external_publication:false,
    merchant:{feed_url:ORIGIN+'/api/merchant-feed',json_preview_url:ORIGIN+'/api/merchant-feed?format=json',tsv_url:ORIGIN+'/api/merchant-feed?format=tsv',summary:merchant.summary,configuration:merchant.config,blocked_preview:merchant.blocked.slice(0,40).map((p)=>({product_id:p.product_id,title:p.title,blockers:p.blockers}))},
    search_console:gsc,indexnow:{...indexNowConfig(context.env),eligible_url_count:urls.length,eligible_urls:urls.slice(0,100)}
  });
}
export async function onRequestPost(context){
  const user=await getAdminUserFromRequest(context.request,context.env);if(!user)return json({ok:false,error:'Admin access required.'},401);
  const db=getDb(context.env);if(!db)return json({ok:false,error:'Database binding is not configured.'},500);
  let body={};try{body=await context.request.json();}catch{return json({ok:false,error:'Invalid JSON body.'},400);}
  const action=clean(body.action,80);
  if(action!=='submit_indexnow')return json({ok:false,error:'Supported action: submit_indexnow.'},400);
  if(clean(body.confirm,80)!=='SUBMIT INDEXNOW')return json({ok:false,error:'Explicit owner confirmation is required. Type SUBMIT INDEXNOW.'},409);
  const cfg=indexNowConfig(context.env);
  const key=clean(context.env.INDEXNOW_KEY,128),keyLocation=clean(context.env.INDEXNOW_KEY_LOCATION,600),endpoint=clean(context.env.INDEXNOW_ENDPOINT,600)||'https://api.indexnow.org/indexnow';
  if(!cfg.ready)return json({ok:false,error:'IndexNow is not configured. Set INDEXNOW_KEY and INDEXNOW_KEY_LOCATION first.',indexnow:cfg},409);
  let urls=[];
  if(Array.isArray(body.urls)&&body.urls.length)urls=[...new Set(body.urls.map(validIndexNowUrl).filter(Boolean))].slice(0,10000);
  else urls=await eligibleUrls(db);
  if(!urls.length)return json({ok:false,error:'No eligible Product or reviewed story URLs were supplied.'},409);
  const payload={host:'devilndove.com',key,keyLocation,urlList:urls};
  let response,text='';
  try{
    response=await fetch(endpoint,{method:'POST',headers:{'Content-Type':'application/json; charset=utf-8'},body:JSON.stringify(payload)});
    text=await response.text().catch(()=>'');
  }catch(error){
    await auditAdminAction(context.env,context.request,user,{action_type:'indexnow_submit_failed',target_type:'search_distribution',target_key:'build298',details:{url_count:urls.length,error:clean(error?.message,240),endpoint_host:cfg.endpoint_host}});
    return json({ok:false,error:'IndexNow submission could not reach the configured endpoint.',detail:clean(error?.message,240),provider_execution:true,explicit_owner_authorization:true},502);
  }
  await auditAdminAction(context.env,context.request,user,{action_type:'indexnow_submit',target_type:'search_distribution',target_key:'build298',details:{url_count:urls.length,http_status:response.status,endpoint_host:cfg.endpoint_host,explicit_owner_authorization:true}});
  return json({ok:response.ok,release:467,build:298,message:response.ok?'IndexNow submission was accepted by the configured endpoint.':'IndexNow returned a non-success response.',http_status:response.status,url_count:urls.length,response_excerpt:clean(text,500),provider_execution:true,explicit_owner_authorization:true,automatic_submission:false},response.ok?200:502);
}
