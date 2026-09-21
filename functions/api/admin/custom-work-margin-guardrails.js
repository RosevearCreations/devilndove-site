// Release 467 Build 218 — Quote ↔ Production Cost ↔ Margin Guardrails.
// Reuses Custom Work quote/revision authority, Build 217 source evidence, Product linked-resource margin,
// and Finance profitability. No automatic price rewrite, accounting posting, Inventory mutation or provider execution.
import { auditAdminAction, getAdminUserFromRequest, getDb, jsonResponse, normalizeText } from '../_lib/adminAudit.js';
import { loadProfitabilityIntelligence } from '../_lib/release465BusinessHealth.js';
import { loadProductLinks, buildProfitabilityEvidence } from './_productResourcesData.js';

const BUILD=218;
const rows=r=>Array.isArray(r?.results)?r.results:[];
const id=v=>{const n=Number(v||0);return Number.isInteger(n)&&n>0?n:0;};
const numberOrNull=v=>{if(v===null||v===undefined||v==='')return null;const n=Number(v);return Number.isFinite(n)?n:null;};
const int=v=>Math.round(Number(v||0)||0);
const clean=(v,max=1800)=>normalizeText(v||'').slice(0,max);
const json=(data,status=200)=>jsonResponse({release:467,build:BUILD,...data},status,{'Cache-Control':'no-store'});
const ACTIVE_LINE=x=>String(x?.line_status||'active')!=='void';

async function tableExists(db,name){
  return Boolean(await db.prepare("SELECT 1 ok FROM sqlite_master WHERE type='table' AND name=? LIMIT 1").bind(name).first().catch(()=>null));
}
async function access(context){
  const admin=await getAdminUserFromRequest(context.request,context.env);
  if(!admin)return {error:json({ok:false,error:'Admin authentication required.'},401)};
  const db=getDb(context.env);if(!db)return {error:json({ok:false,error:'Database binding is not configured.'},500)};
  const required=['custom_requests','custom_request_quote_drafts','custom_request_quote_line_items','custom_request_quote_revisions','creative_project_manufacturing_lifecycles','creative_work_projects','creative_project_production_cost_evidence'];
  const missing=[];for(const name of required)if(!(await tableExists(db,name)))missing.push(name);
  if(missing.length)return {error:json({ok:false,error:'Build 218 required authority is unavailable.',missing_tables:missing},503)};
  return {admin,db};
}
async function requestChoices(db){
  return rows(await db.prepare(`SELECT r.custom_request_id,r.request_key,r.product_interest,r.request_type,r.status,r.quantity,r.updated_at,
    q.custom_request_quote_draft_id,q.quote_status,q.quote_total_cents,
    l.creative_work_project_id,w.project_title,w.project_status
    FROM custom_requests r
    LEFT JOIN custom_request_quote_drafts q ON q.custom_request_id=r.custom_request_id
    LEFT JOIN creative_project_manufacturing_lifecycles l ON l.custom_request_id=r.custom_request_id
    LEFT JOIN creative_work_projects w ON w.creative_work_project_id=l.creative_work_project_id
    WHERE COALESCE(r.status,'new')<>'archived'
    ORDER BY datetime(r.updated_at) DESC,r.custom_request_id DESC LIMIT 100`).all().catch(()=>({results:[]})));
}
async function requestById(db,requestId){
  return db.prepare(`SELECT custom_request_id,request_key,request_type,product_interest,status,quantity,budget_cents,project_intent,organization_name,deadline_date,updated_at
    FROM custom_requests WHERE custom_request_id=? LIMIT 1`).bind(requestId).first().catch(()=>null);
}
async function quoteByRequest(db,requestId){
  return db.prepare(`SELECT * FROM custom_request_quote_drafts WHERE custom_request_id=? ORDER BY custom_request_quote_draft_id DESC LIMIT 1`).bind(requestId).first().catch(()=>null);
}
async function quoteTerms(db,quoteId){
  if(!(await tableExists(db,'custom_request_quote_batch_terms')))return null;
  return db.prepare(`SELECT * FROM custom_request_quote_batch_terms WHERE quote_draft_id=? LIMIT 1`).bind(quoteId).first().catch(()=>null);
}
async function quoteLines(db,quoteId){
  return rows(await db.prepare(`SELECT custom_request_quote_line_item_id,line_type,line_label,quantity,unit_amount_cents,line_amount_cents,is_taxable,line_status,sort_order
    FROM custom_request_quote_line_items WHERE quote_draft_id=? ORDER BY sort_order,custom_request_quote_line_item_id`).bind(quoteId).all().catch(()=>({results:[]})));
}
async function lifecycleProject(db,requestId){
  return db.prepare(`SELECT l.creative_project_manufacturing_lifecycle_id,l.creative_work_project_id,l.current_stage,l.updated_at,
    w.project_key,w.project_title,w.project_type,w.project_status
    FROM creative_project_manufacturing_lifecycles l
    LEFT JOIN creative_work_projects w ON w.creative_work_project_id=l.creative_work_project_id
    WHERE l.custom_request_id=? LIMIT 1`).bind(requestId).first().catch(()=>null);
}
async function productionEvidence(db,projectId){
  if(!projectId)return {
    evidence_rows:0,reviewed_rows:0,cost_evidence_state:'unknown',known_cost_component_count:0,
    known_direct_cost_cents:null,quantity_produced:null,quantity_accepted:null,failed_prototype_count:0,
    design_setup_minutes:0,machine_minutes:0,hands_on_labour_minutes:0,rework_minutes:0,latest_evidence_at:null,
    unknown_cost_is_zero:false
  };
  const row=await db.prepare(`SELECT COUNT(*) evidence_rows,
    SUM(CASE WHEN cost_evidence_state='reviewed' THEN 1 ELSE 0 END) reviewed_rows,
    SUM(COALESCE(design_setup_minutes,0)) design_setup_minutes,
    SUM(COALESCE(machine_minutes,0)) machine_minutes,
    SUM(COALESCE(hands_on_labour_minutes,0)) hands_on_labour_minutes,
    SUM(COALESCE(rework_minutes,0)) rework_minutes,
    SUM(COALESCE(failed_prototype_count,0)) failed_prototype_count,
    SUM(CASE WHEN quantity_produced IS NOT NULL THEN quantity_produced ELSE 0 END) quantity_produced,
    SUM(CASE WHEN quantity_accepted IS NOT NULL THEN quantity_accepted ELSE 0 END) quantity_accepted,
    SUM(CASE WHEN quantity_produced IS NOT NULL THEN 1 ELSE 0 END) produced_rows,
    SUM(CASE WHEN quantity_accepted IS NOT NULL THEN 1 ELSE 0 END) accepted_rows,
    SUM(
      CASE WHEN consumables_cost_cents IS NOT NULL THEN 1 ELSE 0 END +
      CASE WHEN packaging_cost_cents IS NOT NULL THEN 1 ELSE 0 END +
      CASE WHEN prototype_waste_cost_cents IS NOT NULL THEN 1 ELSE 0 END +
      CASE WHEN rework_cost_cents IS NOT NULL THEN 1 ELSE 0 END +
      CASE WHEN finishing_cost_cents IS NOT NULL THEN 1 ELSE 0 END +
      CASE WHEN outside_service_cost_cents IS NOT NULL THEN 1 ELSE 0 END
    ) known_cost_component_count,
    SUM(COALESCE(consumables_cost_cents,0)+COALESCE(packaging_cost_cents,0)+COALESCE(prototype_waste_cost_cents,0)+COALESCE(rework_cost_cents,0)+COALESCE(finishing_cost_cents,0)+COALESCE(outside_service_cost_cents,0)) known_direct_cost_cents,
    MAX(recorded_at) latest_evidence_at
    FROM creative_project_production_cost_evidence
    WHERE creative_work_project_id=? AND evidence_status='active'`).bind(projectId).first().catch(()=>null)||{};
  const evidenceRows=int(row.evidence_rows),reviewedRows=int(row.reviewed_rows),known=int(row.known_cost_component_count);
  const state=!evidenceRows?'unknown':reviewedRows===evidenceRows?'reviewed':known>0?'partial':'unknown';
  return {
    evidence_rows:evidenceRows,reviewed_rows:reviewedRows,cost_evidence_state:state,
    known_cost_component_count:known,known_direct_cost_cents:known>0?int(row.known_direct_cost_cents):null,
    quantity_produced:int(row.produced_rows)>0?Number(row.quantity_produced||0):null,
    quantity_accepted:int(row.accepted_rows)>0?Number(row.quantity_accepted||0):null,
    failed_prototype_count:int(row.failed_prototype_count),design_setup_minutes:int(row.design_setup_minutes),
    machine_minutes:int(row.machine_minutes),hands_on_labour_minutes:int(row.hands_on_labour_minutes),
    rework_minutes:int(row.rework_minutes),latest_evidence_at:row.latest_evidence_at||null,unknown_cost_is_zero:false
  };
}
async function inventoryMaterialEvidence(db,projectId){
  if(!projectId||!(await tableExists(db,'creative_project_inventory_posts'))||!(await tableExists(db,'site_item_inventory')))
    return {post_count:0,known_cost_posts:0,unknown_cost_posts:0,known_material_cost_cents:null,cost_state:'unknown',unknown_cost_is_zero:false};
  const row=await db.prepare(`SELECT COUNT(*) post_count,
    SUM(CASE WHEN COALESCE(sii.unit_cost_cents,0)>0 THEN 1 ELSE 0 END) known_cost_posts,
    SUM(CASE WHEN COALESCE(sii.unit_cost_cents,0)<=0 THEN 1 ELSE 0 END) unknown_cost_posts,
    SUM(CASE WHEN COALESCE(sii.unit_cost_cents,0)>0 THEN ROUND(sii.unit_cost_cents*ip.stock_quantity_consumed) ELSE 0 END) known_material_cost_cents
    FROM creative_project_inventory_posts ip
    JOIN site_item_inventory sii ON sii.site_item_inventory_id=ip.site_item_inventory_id
    WHERE ip.creative_work_project_id=? AND COALESCE(ip.posting_status,'posted')<>'reversed'`).bind(projectId).first().catch(()=>null)||{};
  const count=int(row.post_count),known=int(row.known_cost_posts),unknown=int(row.unknown_cost_posts);
  return {post_count:count,known_cost_posts:known,unknown_cost_posts:unknown,
    known_material_cost_cents:known>0?int(row.known_material_cost_cents):null,
    cost_state:!count?'unknown':unknown>0?'partial':'reviewed',unknown_cost_is_zero:false};
}
async function linkedResourceMargins(db,projectId){
  if(!projectId||!(await tableExists(db,'creative_project_product_links'))||!(await tableExists(db,'products')))return [];
  const linked=rows(await db.prepare(`SELECT l.product_id,l.relationship_type,l.is_primary,p.name,p.price_cents,p.currency,p.status,p.review_status
    FROM creative_project_product_links l JOIN products p ON p.product_id=l.product_id
    WHERE l.creative_work_project_id=? ORDER BY l.is_primary DESC,l.product_id LIMIT 6`).bind(projectId).all().catch(()=>({results:[]})));
  const out=[];
  for(const product of linked){
    const links=await loadProductLinks(db,id(product.product_id)).catch(()=>[]);
    out.push({product_id:id(product.product_id),product_name:clean(product.name,240),relationship_type:clean(product.relationship_type,120),
      is_primary:Number(product.is_primary||0)===1,...buildProfitabilityEvidence(product,links)});
  }
  return out;
}
async function financeEvidence(db,projectId){
  if(!projectId)return null;
  const intelligence=await loadProfitabilityIntelligence(db,{limit:150}).catch(()=>({rows:[]}));
  const row=(intelligence.rows||[]).find(x=>id(x.creative_work_project_id)===projectId);
  return row||null;
}
function quoteProjection(quote,terms,lines,request){
  const active=(lines||[]).filter(ACTIVE_LINE);
  const revenueLines=active.filter(x=>!['tax','pickup_shipping'].includes(String(x.line_type||'')));
  const quotedRevenue=revenueLines.length?revenueLines.reduce((s,x)=>s+int(x.line_amount_cents),0):int(quote?.estimated_budget_cents||request?.budget_cents);
  const quantity=Math.max(1,int(terms?.quote_quantity||request?.quantity||1));
  const unitRevenue=quotedRevenue>0?Math.round(quotedRevenue/quantity):null;
  return {quote_draft_id:id(quote?.custom_request_quote_draft_id),quote_key:quote?.quote_key||null,quote_status:quote?.quote_status||'draft',
    quote_quantity:quantity,quoted_revenue_before_tax_shipping_cents:quotedRevenue>0?quotedRevenue:null,
    quoted_unit_revenue_cents:unitRevenue,quote_total_cents:int(quote?.quote_total_cents),
    automatic_price_rewrite:false,interpretation:'Quoted revenue uses active customer-visible price lines excluding tax and pickup/shipping; it is not cost evidence.'};
}
function economics({quote,production,materials,latestReview}){
  const expectedTotal=numberOrNull(latestReview?.expected_production_cost_cents);
  const expectedUnit=numberOrNull(latestReview?.expected_unit_cost_cents);
  const accepted=numberOrNull(production.quantity_accepted);
  const actualDirect=production.cost_evidence_state==='reviewed'&&production.known_cost_component_count>0?production.known_direct_cost_cents:null;
  const actualDirectUnit=actualDirect!==null&&accepted!==null&&accepted>0?Math.round(actualDirect/accepted):null;
  const quoteUnit=quote.quoted_unit_revenue_cents;
  const expectedMargin=quoteUnit!==null&&expectedUnit!==null?quoteUnit-expectedUnit:null;
  const actualDirectMargin=quoteUnit!==null&&actualDirectUnit!==null?quoteUnit-actualDirectUnit:null;
  const expectedVsActual=expectedTotal!==null&&actualDirect!==null?actualDirect-expectedTotal:null;
  const blockers=[],warnings=[];
  if(!quote.quote_draft_id)blockers.push('Existing Custom Work quote draft is required.');
  if(production.cost_evidence_state!=='reviewed')warnings.push('Production cost evidence is not fully reviewed.');
  if(actualDirect===null)warnings.push('Reviewed production direct-cost total is unknown.');
  if(accepted===null||accepted<=0)warnings.push('Accepted production quantity is unknown, so actual unit cost remains unknown.');
  if(expectedTotal===null&&expectedUnit===null)warnings.push('No reviewed expected production-cost assumption is stored in Build 218 revision history.');
  if(materials.cost_state!=='reviewed')warnings.push('Inventory material-cost evidence is incomplete or absent; it is not silently treated as zero.');
  return {
    expected_production_cost_cents:expectedTotal,expected_unit_cost_cents:expectedUnit,
    actual_reviewed_direct_cost_cents:actualDirect,actual_reviewed_direct_unit_cost_cents:actualDirectUnit,
    expected_vs_actual_direct_cost_variance_cents:expectedVsActual,
    quoted_unit_revenue_cents:quoteUnit,expected_unit_headroom_cents:expectedMargin,actual_direct_unit_headroom_cents:actualDirectMargin,
    state:blockers.length?'blocked':warnings.length?'review':'reviewed',blockers,warnings,
    scope_note:'Expected/actual comparison is only for the operator-declared production-cost scope. Linked-resource margin and full Finance profitability are separate evidence lanes.',
    unknown_cost_is_zero:false,automatic_price_rewrite:false
  };
}
function parseSnapshot(row){
  if(!row)return null;let snapshot={};try{snapshot=JSON.parse(row.snapshot_json||'{}')||{};}catch{}
  return {custom_request_quote_revision_id:id(row.custom_request_quote_revision_id),revision_status:row.revision_status||'open',
    revision_notes:row.revision_notes||'',created_by_user_id:id(row.created_by_user_id)||null,created_at:row.created_at||null,...snapshot};
}
async function latestReview(db,quoteId){
  if(!quoteId)return null;
  const row=await db.prepare(`SELECT custom_request_quote_revision_id,revision_status,revision_notes,snapshot_json,created_by_user_id,created_at
    FROM custom_request_quote_revisions WHERE quote_draft_id=? AND revision_type='build218_margin_review'
    ORDER BY custom_request_quote_revision_id DESC LIMIT 1`).bind(quoteId).first().catch(()=>null);
  return parseSnapshot(row);
}
async function snapshot(db,requestId){
  const request=await requestById(db,requestId);if(!request)return {ok:false,error:'Custom request was not found.'};
  const quote=await quoteByRequest(db,requestId);
  const project=await lifecycleProject(db,requestId);
  const projectId=id(project?.creative_work_project_id);
  const terms=quote?await quoteTerms(db,id(quote.custom_request_quote_draft_id)):null;
  const lines=quote?await quoteLines(db,id(quote.custom_request_quote_draft_id)):[];
  const review=quote?await latestReview(db,id(quote.custom_request_quote_draft_id)):null;
  const production=await productionEvidence(db,projectId);
  const materials=await inventoryMaterialEvidence(db,projectId);
  const quoteView=quoteProjection(quote,terms,lines,request);
  const [linkedMargins,finance]=await Promise.all([linkedResourceMargins(db,projectId),financeEvidence(db,projectId)]);
  const guardrails=economics({quote:quoteView,production,materials,latestReview:review});
  return {ok:true,request,quote,terms,quote_lines:lines,project,production_cost_evidence:production,
    inventory_material_evidence:materials,linked_resource_margins:linkedMargins,finance_profitability:finance,
    latest_margin_review:review,quote_economics:quoteView,margin_guardrails:guardrails,
    boundaries:{quote_authority:'custom_request_quote_drafts + custom_request_quote_line_items + custom_request_quote_revisions',
      project_link_authority:'creative_project_manufacturing_lifecycles',production_cost_authority:'creative_project_production_cost_evidence',
      linked_resource_margin_authority:'product_resource_links + Inventory cost evidence',finance_profitability_authority:'creative_project_profitability',
      unknown_cost_is_zero:false,automatic_price_rewrite:false,accounting_posting:false,inventory_mutation:false,payment_execution:false,provider_execution:false}};
}
async function recordReview(db,context,admin,current,body){
  const quoteId=id(current.quote?.custom_request_quote_draft_id);if(!quoteId)throw Object.assign(new Error('Create the existing Custom Work quote draft before recording a margin review.'),{status:409});
  const disposition=['needs_cost_evidence','reviewed_no_price_change','price_review_recommended'].includes(String(body.review_disposition||''))?String(body.review_disposition):'needs_cost_evidence';
  const expectedTotal=numberOrNull(body.expected_production_cost_cents);
  const expectedUnit=numberOrNull(body.expected_unit_cost_cents);
  if(expectedTotal!==null&&expectedTotal<0||expectedUnit!==null&&expectedUnit<0)throw new Error('Expected production cost cannot be negative.');
  const note=clean(body.review_note,1800);
  if(!note)throw new Error('Add a review note describing the expected-cost scope and decision.');
  const snapshotJson={
    build:218,review_disposition:disposition,expected_production_cost_cents:expectedTotal===null?null:Math.round(expectedTotal),
    expected_unit_cost_cents:expectedUnit===null?null:Math.round(expectedUnit),review_note:note,
    quote_economics:current.quote_economics,project:{creative_work_project_id:id(current.project?.creative_work_project_id),project_title:current.project?.project_title||null},
    production_cost_evidence:current.production_cost_evidence,inventory_material_evidence:current.inventory_material_evidence,
    linked_resource_margins:current.linked_resource_margins,finance_profitability:current.finance_profitability,
    boundaries:{unknown_cost_is_zero:false,automatic_price_rewrite:false,accounting_posting:false,inventory_mutation:false}
  };
  await db.prepare(`INSERT INTO custom_request_quote_revisions(custom_request_id,quote_draft_id,revision_type,revision_status,revision_notes,snapshot_json,created_by_user_id,created_at)
    VALUES(?,?,'build218_margin_review','open',?,?,?,CURRENT_TIMESTAMP)`)
    .bind(id(current.request.custom_request_id),quoteId,note,JSON.stringify(snapshotJson),id(admin.user_id)||null).run();
  await auditAdminAction(context.env,context.request,admin,{action_type:'build218_margin_review_recorded',target_type:'custom_request_quote_drafts',
    target_id:quoteId,target_key:current.quote?.quote_key||null,details:{review_disposition:disposition,expected_cost_known:expectedTotal!==null||expectedUnit!==null,
      production_cost_state:current.production_cost_evidence?.cost_evidence_state||'unknown',automatic_price_rewrite:false,accounting_posting:false,inventory_mutation:false}});
}

export async function onRequestGet(context){
  const a=await access(context);if(a.error)return a.error;
  const requestId=id(new URL(context.request.url).searchParams.get('request_id'));
  if(!requestId)return json({ok:true,request_choices:await requestChoices(a.db),selected:null,
    boundaries:{unknown_cost_is_zero:false,automatic_price_rewrite:false,accounting_posting:false,inventory_mutation:false,payment_execution:false,provider_execution:false}});
  const current=await snapshot(a.db,requestId);
  current.request_choices=await requestChoices(a.db);
  return json(current,current.ok?200:404);
}
export async function onRequestPost(context){
  const a=await access(context);if(a.error)return a.error;
  let body={};try{body=await context.request.json();}catch{return json({ok:false,error:'Invalid JSON body.'},400);}
  const requestId=id(body.request_id||body.custom_request_id);if(!requestId)return json({ok:false,error:'Choose a Custom Request.'},400);
  const action=clean(body.action,80);
  if(action!=='record_review')return json({ok:false,error:'Unsupported Build 218 action.'},400);
  try{
    const current=await snapshot(a.db,requestId);if(!current.ok)return json(current,404);
    await recordReview(a.db,context,a.admin,current,body);
    return json({message:'Margin guardrail review appended to the existing quote revision history. No price was changed.',...(await snapshot(a.db,requestId)),request_choices:await requestChoices(a.db)});
  }catch(error){return json({ok:false,error:String(error?.message||error)},Number(error?.status||400));}
}
