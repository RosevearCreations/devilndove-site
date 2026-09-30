// Release 467 Build 305 — read-only buyer discovery/search measurement.
import { getAdminUserFromRequest, getDb, jsonResponse } from '../_lib/adminAudit.js';
import { merchantCoverage } from '../_lib/merchantSearchDistribution.js';
import { loadDynamicSitemapEntries, loadPublishedStorySeo } from '../_lib/publicSearchSeo.js';

const clean=(v,n=0)=>{const s=String(v??'').trim();return n?s.slice(0,n):s;};
const rows=(r)=>Array.isArray(r?.results)?r.results:[];
function indexNowReadiness(env={}){
  const key=clean(env.INDEXNOW_KEY,128),keyLocation=clean(env.INDEXNOW_KEY_LOCATION,600);
  const endpoint=clean(env.INDEXNOW_ENDPOINT,600)||'https://api.indexnow.org/indexnow';
  let endpointHost='';try{endpointHost=new URL(endpoint).hostname;}catch{}
  return {key_configured:Boolean(key),key_location_configured:Boolean(keyLocation),endpoint_host:endpointHost,ready:Boolean(key&&keyLocation),automatic_submission:false,explicit_confirmation_required:'SUBMIT INDEXNOW',provider_execution:false};
}
export async function onRequestGet(context){
  const user=await getAdminUserFromRequest(context.request,context.env);
  if(!user)return jsonResponse({ok:false,error:'Admin access required.'},401,{'Cache-Control':'no-store'});
  const db=getDb(context.env);if(!db)return jsonResponse({ok:false,error:'Database binding is not configured.'},500,{'Cache-Control':'no-store'});
  const story=await db.prepare(`SELECT pub.content_publication_id,pub.publication_slug,pub.canonical_path,pub.title,pub.published_at,pub.updated_at,cp.source_type,cp.source_id,COALESCE(cp.product_id,0) product_id
    FROM content_publications pub JOIN content_projects cp ON cp.content_project_id=pub.content_project_id
    WHERE pub.publication_key='content-project-22-workshop_journal' AND pub.destination='workshop_journal' AND pub.content_status='published' LIMIT 1`).first().catch(()=>null);
  const telemetry=await db.prepare(`SELECT
    COUNT(*) FILTER (WHERE event_type='page_view' AND path='/workshop-journal/story/' AND instr(COALESCE(query_string,''),'under-the-sea-workshop-story-22')>0) story_views,
    COUNT(*) FILTER (WHERE event_type='page_view' AND path='/workshop-journal/') journal_index_views,
    COUNT(*) FILTER (WHERE event_type='page_view' AND path='/shop/product/') product_detail_views,
    COUNT(*) FILTER (WHERE event_type='page_view') total_page_views,
    COUNT(DISTINCT site_visitor_id) FILTER (WHERE event_type='page_view') unique_visitors,
    MAX(created_at) latest_page_view_at FROM site_page_views WHERE datetime(created_at)>=datetime('now','-28 days')`).first().catch(()=>null);
  const search=await db.prepare(`SELECT COUNT(*) row_count,COALESCE(SUM(clicks),0) clicks,COALESCE(SUM(impressions),0) impressions,COALESCE(MAX(report_date),'') latest_report_date,
    COUNT(*) FILTER (WHERE instr(lower(page_url),'under-the-sea-workshop-story-22')>0) story_rows,
    COALESCE(SUM(CASE WHEN instr(lower(page_url),'under-the-sea-workshop-story-22')>0 THEN clicks ELSE 0 END),0) story_clicks,
    COALESCE(SUM(CASE WHEN instr(lower(page_url),'under-the-sea-workshop-story-22')>0 THEN impressions ELSE 0 END),0) story_impressions,
    COUNT(*) FILTER (WHERE instr(lower(page_url),'/shop/product/')>0) product_rows
    FROM search_console_page_queries WHERE date(COALESCE(report_date,created_at))>=date('now','-28 days')`).first().catch(()=>null);
  const [merchant,sitemap,storySeo]=await Promise.all([merchantCoverage(db,context.env),loadDynamicSitemapEntries(db),loadPublishedStorySeo(db,'under-the-sea-workshop-story-22')]);
  const projectOperations=await db.prepare("SELECT COUNT(*) count FROM creative_project_operations WHERE creative_work_project_id=7 AND COALESCE(plan_status,'planned')<>'retired'").first().catch(()=>({count:0}));
  const sitemapStory=sitemap.some((x)=>x.kind==='story'&&String(x.loc||'').includes('under-the-sea-workshop-story-22'));
  return jsonResponse({ok:true,release:467,build:305,title:'Buyer Discovery & Search Measurement Activation',window_days:28,read_only:true,
    story:{published:Boolean(story),...story,page_views:Number(telemetry?.story_views||0),sitemap_visible:sitemapStory,discovery_links:Array.isArray(storySeo?.discovery_links)?storySeo.discovery_links:[]},
    telemetry:{story_views:Number(telemetry?.story_views||0),journal_index_views:Number(telemetry?.journal_index_views||0),product_detail_views:Number(telemetry?.product_detail_views||0),total_page_views:Number(telemetry?.total_page_views||0),unique_visitors:Number(telemetry?.unique_visitors||0),latest_page_view_at:clean(telemetry?.latest_page_view_at,80)},
    search_console:{row_count:Number(search?.row_count||0),clicks:Number(search?.clicks||0),impressions:Number(search?.impressions||0),latest_report_date:clean(search?.latest_report_date,80),story_rows:Number(search?.story_rows||0),story_clicks:Number(search?.story_clicks||0),story_impressions:Number(search?.story_impressions||0),product_rows:Number(search?.product_rows||0),staging_authority:'/api/admin/search-console-import'},
    merchant:{summary:merchant.summary,configuration:merchant.config},
    sitemap:{eligible_url_count:sitemap.length,product_count:sitemap.filter((x)=>x.kind==='product').length,story_count:sitemap.filter((x)=>x.kind==='story').length,under_the_sea_visible:sitemapStory},
    internal_discovery:{project_operations:Number(projectOperations?.count||0),factual_related_links:Array.isArray(storySeo?.discovery_links)?storySeo.discovery_links:[],invented_links:false},
    indexnow:indexNowReadiness(context.env),
    boundaries:{provider_execution:false,provider_publication:false,indexnow_submission:false,automatic_publication:false,private_media_query:false,production_d1_contact:false}
  },200,{'Cache-Control':'no-store'});
}
