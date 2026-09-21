// Release 467 Build 223 — Capability Case Studies, Workshop Journal & Search Richness.
// Public read-only projection over already-published Content Release records.
// Never exposes private/raw CAIP records and never publishes, edits, copies or promotes media/content.
import { getDb, jsonResponse } from './_lib/adminAudit.js';
import { publicContentPublications } from './_lib/contentPublications.js';

const BUILD=223;
const rows=(r)=>Array.isArray(r?.results)?r.results:[];
const text=(v,n=0)=>{const s=String(v??'').trim();return n>0?s.slice(0,n):s;};
const id=(v)=>{const n=Number(v||0);return Number.isInteger(n)&&n>0?n:0;};
const json=(data,status=200)=>jsonResponse({release:467,build:BUILD,...data},status,{'Cache-Control':status===200?'public, max-age=300, stale-while-revalidate=900':'no-store','X-Content-Type-Options':'nosniff'});
const list=(value)=>{try{const x=JSON.parse(String(value||'[]'));return Array.isArray(x)?x.map(v=>text(v,120)).filter(Boolean):[];}catch{return[];}};

async function tableExists(db,name){
  return Boolean(await db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name=? LIMIT 1").bind(name).first().catch(()=>null));
}
function classify(item,ctx){
  const processKeys=[...new Set((ctx.processes||[]).map(x=>text(x.process_key)).filter(Boolean))];
  const hybrid=processKeys.length>=2;
  const stage=text(ctx.lifecycle?.current_stage).toLowerCase();
  const prototypeToFinished=['approved_sample','production_authorized','production_run','qa_rework','completed'].includes(stage);
  const beforeAfter=/\bbefore\s*(?:and|&|\/)\s*after\b/i.test([item.title,item.summary,item.body_content].filter(Boolean).join(' '));
  const technique=processKeys.length>0;
  const type=hybrid?'hybrid_project_case_study':prototypeToFinished?'prototype_to_finished':ctx.capabilities.length?'capability_example':'workshop_journal';
  return {case_study_type:type,hybrid_project:hybrid,prototype_to_finished:prototypeToFinished,before_after:beforeAfter,process_technique_example:technique,reviewed_production_run_evidence:Number(ctx.production_run_count||0)>0};
}
function safePublicItem(item,ctx){
  const classification=classify(item,ctx);
  return {
    content_publication_id:id(item.content_publication_id),
    publication_slug:text(item.publication_slug,120),
    title:text(item.title,220),
    summary:text(item.summary||item.meta_description,900),
    hero_media_url:text(item.hero_media_url,1800),
    hero_alt_text:text(item.hero_alt_text,320),
    media_urls:Array.isArray(item.media_urls)?item.media_urls.map(x=>text(x,1800)).filter(Boolean).slice(0,12):[],
    canonical_path:text(item.canonical_path,600),
    product_path:text(item.product_path,600)||'/shop/',
    published_at:text(item.published_at,80),
    updated_at:text(item.updated_at,80),
    capabilities:ctx.capabilities.map(x=>({capability_key:x.capability_key,display_name:x.display_name,profile_path:`/capabilities/${encodeURIComponent(x.capability_key)}/`})),
    processes:(ctx.processes||[]).map(x=>({process_key:text(x.process_key,120),process_name:text(x.process_name,180)})),
    ...classification,
    public_release_authority:'content_publications',
    source_backed:true,
    raw_private_caip_exposed:false,
    custom_request_path:'/custom-request/'
  };
}
export async function onRequestGet({request,env}){
  const db=getDb(env);if(!db)return json({ok:true,items:[],source:'fallback',message:'Published case studies are temporarily unavailable.'});
  if(!(await tableExists(db,'content_publications')))return json({ok:true,items:[],source:'fallback',message:'Published case studies will appear after reviewed Content Release publication.'});
  const url=new URL(request.url),limit=Math.max(1,Math.min(24,Number(url.searchParams.get('limit')||12)||12));
  const capabilityFilter=text(url.searchParams.get('capability'),120).toLowerCase();
  const q=text(url.searchParams.get('q'),120).toLowerCase();
  try{
    const published=await publicContentPublications(db,{destination:'workshop_journal',limit});
    if(!published.length)return json({ok:true,items:[],count:0,source:'published_content_only',policy:{publication_engine_reused:true,raw_private_caip_exposed:false,automatic_publication:false}});
    const publicationIds=published.map(x=>id(x.content_publication_id)).filter(Boolean);
    const pMarks=publicationIds.map(()=>'?').join(',');
    const links=publicationIds.length?rows(await db.prepare(`SELECT cpb.content_publication_id,cp.source_type,cp.source_id
      FROM content_publications cpb JOIN content_projects cp ON cp.content_project_id=cpb.content_project_id
      WHERE cpb.content_publication_id IN (${pMarks}) AND cpb.content_status='published'`).bind(...publicationIds).all()):[];
    const projectByPub=new Map(links.map(x=>[id(x.content_publication_id),text(x.source_type)==='creative_work_project'?id(x.source_id):0]));
    const projectIds=[...new Set([...projectByPub.values()].filter(Boolean))];
    const marks=projectIds.map(()=>'?').join(',');
    const processesByProject=new Map();
    const lifecycles=new Map();
    const runCounts=new Map();
    if(projectIds.length&&await tableExists(db,'creative_project_operations')){
      const ops=rows(await db.prepare(`SELECT o.creative_work_project_id,ip.process_key,ip.process_name
        FROM creative_project_operations o JOIN inventory_processes ip ON ip.inventory_process_id=o.inventory_process_id
        WHERE o.creative_work_project_id IN (${marks}) AND COALESCE(o.plan_status,'')<>'void'
        ORDER BY o.creative_work_project_id,o.operation_order LIMIT 240`).bind(...projectIds).all());
      ops.forEach(x=>{const key=id(x.creative_work_project_id);if(!processesByProject.has(key))processesByProject.set(key,[]);processesByProject.get(key).push({process_key:text(x.process_key),process_name:text(x.process_name)});});
    }
    if(projectIds.length&&await tableExists(db,'creative_project_manufacturing_lifecycles')){
      const ls=rows(await db.prepare(`SELECT creative_work_project_id,current_stage FROM creative_project_manufacturing_lifecycles WHERE creative_work_project_id IN (${marks})`).bind(...projectIds).all());
      ls.forEach(x=>lifecycles.set(id(x.creative_work_project_id),{current_stage:text(x.current_stage)}));
    }
    if(projectIds.length&&await tableExists(db,'creative_project_production_runs')){
      const rs=rows(await db.prepare(`SELECT creative_work_project_id,COUNT(*) reviewed_count FROM creative_project_production_runs
        WHERE creative_work_project_id IN (${marks}) AND run_status='reviewed' GROUP BY creative_work_project_id`).bind(...projectIds).all());
      rs.forEach(x=>runCounts.set(id(x.creative_work_project_id),Number(x.reviewed_count||0)));
    }
    const publicCapabilities=await tableExists(db,'workshop_capability_profiles')?rows(await db.prepare(`SELECT capability_key,display_name,related_process_keys_json
      FROM workshop_capability_profiles WHERE is_public=1 AND review_status IN ('reviewed','published') ORDER BY display_name LIMIT 80`).all()):[];
    const caps=publicCapabilities.map(x=>({...x,process_keys:list(x.related_process_keys_json)}));
    let items=published.map(item=>{
      const projectId=projectByPub.get(id(item.content_publication_id))||0;
      const processes=processesByProject.get(projectId)||[];
      const processKeys=new Set(processes.map(x=>text(x.process_key)));
      const capabilities=caps.filter(c=>c.process_keys.some(k=>processKeys.has(k))).map(c=>({capability_key:text(c.capability_key),display_name:text(c.display_name)}));
      return safePublicItem(item,{processes,capabilities,lifecycle:lifecycles.get(projectId)||null,production_run_count:runCounts.get(projectId)||0});
    });
    if(capabilityFilter)items=items.filter(x=>x.capabilities.some(c=>c.capability_key===capabilityFilter));
    if(q)items=items.filter(x=>[x.title,x.summary,...x.capabilities.map(c=>c.display_name),...x.processes.map(p=>p.process_name)].join(' ').toLowerCase().includes(q));
    return json({ok:true,source:'published_content_only',items,count:items.length,policy:{publication_engine_reused:true,content_release_authority:'content_publications',capability_authority:'workshop_capability_profiles',process_authority:'inventory_processes',raw_private_caip_exposed:false,private_media_queries:false,automatic_publication:false,automatic_case_study_creation:false}});
  }catch(error){
    return json({ok:true,source:'fallback',items:[],message:'Published case studies are temporarily unavailable.',detail:text(error?.message,240)});
  }
}
