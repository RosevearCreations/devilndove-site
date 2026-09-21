// Release 467 Build 215 — Small-Batch, Corporate & Event Quoting.
// Extends the existing Custom Work quote draft/revision/line-item authority.
// No parallel quote engine; no payment/provider/order execution; no request-time DDL.
import { auditAdminAction, getAdminUserFromRequest, getDb, jsonResponse, normalizeText } from '../_lib/adminAudit.js';

const BUILD=215;
const OWNED_LINE_TYPES=new Set(['build215_batch_units','build215_setup','build215_prototype_sample','build215_packaging']);
const rows=r=>Array.isArray(r?.results)?r.results:[];
const id=v=>{const n=Number(v||0);return Number.isInteger(n)&&n>0?n:0;};
const intOrNull=v=>{if(v===null||v===undefined||v==='')return null;const n=Number(v);return Number.isInteger(n)?n:null;};
const cents=v=>{if(v===null||v===undefined||v==='')return 0;const n=Number(v);return Number.isFinite(n)?Math.max(0,Math.round(n)):0;};
const nullableCents=v=>{if(v===null||v===undefined||v==='')return null;const n=Number(v);return Number.isFinite(n)?Math.max(0,Math.round(n)):null;};
const clean=(v,n=1600)=>normalizeText(v).slice(0,n);
const json=(data,status=200)=>jsonResponse({build:BUILD,...data},status,{'Cache-Control':'no-store'});

async function access(context){
  const admin=await getAdminUserFromRequest(context.request,context.env);
  if(!admin)return {error:json({ok:false,error:'Admin authentication required.'},401)};
  const db=getDb(context.env);if(!db)return {error:json({ok:false,error:'Database binding is not configured.'},500)};
  const schema=await db.prepare(`SELECT COUNT(*) c FROM sqlite_master WHERE type='table' AND name IN (
    'custom_requests','custom_request_quote_drafts','custom_request_quote_line_items','custom_request_quote_revisions',
    'custom_request_quote_share_links','custom_request_quote_batch_terms','custom_request_quote_quantity_tiers')`).first().catch(()=>({c:0}));
  if(Number(schema?.c||0)!==7)return {error:json({ok:false,error:'Build 215 canonical migration is required.',code:'build215_schema_required'},503)};
  return {admin,db};
}
async function requestById(db,requestId){
  return db.prepare(`SELECT custom_request_id,request_key,name,email,request_type,product_interest,status,quantity,project_intent,organization_name,event_context_structured,deadline_date,budget_cents
    FROM custom_requests WHERE custom_request_id=? LIMIT 1`).bind(id(requestId)).first().catch(()=>null);
}
async function quoteByRequest(db,requestId){
  return db.prepare(`SELECT * FROM custom_request_quote_drafts WHERE custom_request_id=? LIMIT 1`).bind(id(requestId)).first().catch(()=>null);
}
async function termsByQuote(db,quoteId){
  return db.prepare(`SELECT * FROM custom_request_quote_batch_terms WHERE quote_draft_id=? LIMIT 1`).bind(id(quoteId)).first().catch(()=>null);
}
async function tiersByTerms(db,termsId){
  return id(termsId)?rows(await db.prepare(`SELECT * FROM custom_request_quote_quantity_tiers
    WHERE custom_request_quote_batch_terms_id=? ORDER BY sort_order,min_quantity,custom_request_quote_quantity_tier_id`).bind(id(termsId)).all().catch(()=>({results:[]}))):[];
}
async function revisions(db,quoteId){
  return id(quoteId)?rows(await db.prepare(`SELECT custom_request_quote_revision_id,revision_type,revision_status,revision_notes,snapshot_json,created_by_user_id,created_at
    FROM custom_request_quote_revisions WHERE quote_draft_id=? ORDER BY custom_request_quote_revision_id DESC LIMIT 40`).bind(id(quoteId)).all().catch(()=>({results:[]}))):[];
}
async function quoteLines(db,quoteId){
  return id(quoteId)?rows(await db.prepare(`SELECT custom_request_quote_line_item_id,line_type,line_label,quantity,unit_amount_cents,line_amount_cents,is_taxable,line_status,sort_order,updated_at
    FROM custom_request_quote_line_items WHERE quote_draft_id=? ORDER BY sort_order,custom_request_quote_line_item_id`).bind(id(quoteId)).all().catch(()=>({results:[]}))):[];
}
function quoteTotals(lines,fallback=0){
  const active=(lines||[]).filter(x=>String(x.line_status||'active')!=='void');
  const subtotal=active.reduce((s,x)=>s+Number(x.line_amount_cents||0),0)||Math.max(0,Number(fallback||0));
  const shipping=active.filter(x=>String(x.line_type||'')==='pickup_shipping').reduce((s,x)=>s+Number(x.line_amount_cents||0),0);
  const taxable=active.filter(x=>Number(x.is_taxable)===1&&!['tax','pickup_shipping'].includes(String(x.line_type||''))).reduce((s,x)=>s+Number(x.line_amount_cents||0),0);
  const explicitTax=active.filter(x=>String(x.line_type||'')==='tax').reduce((s,x)=>s+Number(x.line_amount_cents||0),0);
  const tax=explicitTax||Math.round(taxable*0.13);
  return {subtotal_cents:subtotal,pickup_shipping_cents:shipping,tax_estimate_cents:tax,quote_total_cents:subtotal+tax};
}
async function syncQuoteTotals(db,quote){
  const lines=await quoteLines(db,quote.custom_request_quote_draft_id);
  const totals=quoteTotals(lines,quote.estimated_budget_cents||0);
  const material=lines.filter(x=>String(x.line_type||'')==='material'&&String(x.line_status||'active')!=='void').reduce((s,x)=>s+Number(x.line_amount_cents||0),0);
  const labour=lines.filter(x=>['labour','labor'].includes(String(x.line_type||''))&&String(x.line_status||'active')!=='void').reduce((s,x)=>s+Number(x.line_amount_cents||0),0);
  await db.prepare(`UPDATE custom_request_quote_drafts SET material_cost_cents=?,labor_cost_cents=?,pickup_shipping_cents=?,tax_estimate_cents=?,quote_total_cents=?,updated_at=CURRENT_TIMESTAMP WHERE custom_request_quote_draft_id=?`)
    .bind(material,labour,totals.pickup_shipping_cents,totals.tax_estimate_cents,totals.quote_total_cents,id(quote.custom_request_quote_draft_id)).run();
  return totals;
}
async function upsertOwnedLine(db,{requestId,quoteId,type,label,quantity=1,unitCents=0,taxable=1,sortOrder=100,userId,active=true}){
  if(!OWNED_LINE_TYPES.has(type))throw new Error('Build 215 attempted to write an unowned quote line type.');
  const existing=await db.prepare(`SELECT custom_request_quote_line_item_id FROM custom_request_quote_line_items WHERE quote_draft_id=? AND line_type=? ORDER BY custom_request_quote_line_item_id DESC LIMIT 1`).bind(quoteId,type).first().catch(()=>null);
  const qty=Number.isFinite(Number(quantity))&&Number(quantity)>0?Number(quantity):1;
  const unit=cents(unitCents),amount=Math.max(0,Math.round(qty*unit));
  const status=active?'active':'void';
  if(existing){
    await db.prepare(`UPDATE custom_request_quote_line_items SET line_label=?,quantity=?,unit_amount_cents=?,line_amount_cents=?,is_taxable=?,line_status=?,sort_order=?,updated_by_user_id=?,updated_at=CURRENT_TIMESTAMP
      WHERE custom_request_quote_line_item_id=?`).bind(label,qty,unit,amount,taxable?1:0,status,sortOrder,userId,id(existing.custom_request_quote_line_item_id)).run();
  }else if(active){
    await db.prepare(`INSERT INTO custom_request_quote_line_items(custom_request_id,quote_draft_id,line_type,line_label,quantity,unit_amount_cents,line_amount_cents,is_taxable,line_status,sort_order,created_by_user_id,updated_by_user_id,created_at,updated_at)
      VALUES(?,?,?,?,?,?,?,?, 'active',?,?,?,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)`).bind(requestId,quoteId,type,label,qty,unit,amount,taxable?1:0,sortOrder,userId,userId).run();
  }
}
async function recordRevision(db,{requestId,quoteId,userId,type='build215_terms_changed',note,snapshot}){
  await db.prepare(`INSERT INTO custom_request_quote_revisions(custom_request_id,quote_draft_id,revision_type,revision_status,revision_notes,snapshot_json,created_by_user_id,created_at)
    VALUES(?,?,?,'open',?,?,?,CURRENT_TIMESTAMP)`).bind(requestId,quoteId,type,clean(note||'Build 215 quote assumptions changed.',1200)||null,JSON.stringify(snapshot||{}),userId).run();
}
function termsSummary(request,terms,tiers){
  if(!terms)return '';
  const selected=(tiers||[]).find(x=>Number(x.is_selected||0)===1)||null;
  const q=Number(terms.quote_quantity||1);
  const parts=[
    `Quote quantity: ${q}.`,
    terms.requested_quantity?`Requested quantity: ${Number(terms.requested_quantity)}.`:'',
    selected?`Selected quantity tier: ${selected.tier_label} (${selected.min_quantity}${selected.max_quantity?'–'+selected.max_quantity:'+'}); ${selected.unit_amount_cents==null?'unit price still unknown':(Number(selected.unit_amount_cents)/100).toLocaleString('en-CA',{style:'currency',currency:'CAD'})+' per unit'}.`:'',
    terms.personalization_scope?`Personalization scope: ${String(terms.personalization_scope).replace(/_/g,' ')}.`:'',
    terms.packaging_choice?`Packaging: ${terms.packaging_choice}.`:'',
    terms.lead_time_min_days!=null||terms.lead_time_max_days!=null?`Lead-time assumption: ${terms.lead_time_min_days??'?'}–${terms.lead_time_max_days??'?'} days.`:(terms.lead_time_assumption?`Lead-time assumption: ${terms.lead_time_assumption}.`:''),
    terms.handoff_method&&terms.handoff_method!=='tbd'?`Handoff: ${String(terms.handoff_method).replace(/_/g,' ')}.`:'',
    terms.expires_at?`Quote expires: ${terms.expires_at}.`:'',
    terms.production_cost_state==='unknown'?'Production-cost evidence is still unknown; this quote does not treat unknown production cost as zero.':terms.production_cost_state==='partial'?'Production-cost evidence is partial and remains subject to review.':'Production-cost evidence state: reviewed.',
    terms.corporate_event_context?`Corporate/event context: ${terms.corporate_event_context}.`:'',
    terms.unit_assumption_note||'',
    terms.personalization_notes||'',
    terms.packaging_notes||'',
    terms.handoff_notes||'',
    terms.production_cost_note||''
  ].filter(Boolean);
  return parts.join('\n');
}
async function syncOwnedQuoteProjection(db,request,quote,terms,tiers,userId){
  const requestId=id(request.custom_request_id),quoteId=id(quote.custom_request_quote_draft_id);
  const selected=(tiers||[]).find(x=>Number(x.is_selected||0)===1)||null;
  const selectedUnit=selected?.unit_amount_cents==null?null:Number(selected.unit_amount_cents);
  await upsertOwnedLine(db,{requestId,quoteId,type:'build215_batch_units',label:selected?`Batch units — ${selected.tier_label}`:'Batch units',quantity:Number(terms.quote_quantity||1),unitCents:selectedUnit||0,taxable:1,sortOrder:35,userId,active:Boolean(selected&&selectedUnit!=null)});
  await upsertOwnedLine(db,{requestId,quoteId,type:'build215_setup',label:'Batch / production setup charge',quantity:1,unitCents:terms.setup_charge_cents,taxable:1,sortOrder:36,userId,active:Number(terms.setup_charge_cents||0)>0});
  await upsertOwnedLine(db,{requestId,quoteId,type:'build215_prototype_sample',label:'Prototype / sample charge',quantity:1,unitCents:terms.prototype_sample_charge_cents,taxable:1,sortOrder:37,userId,active:Number(terms.prototype_sample_charge_cents||0)>0});
  await upsertOwnedLine(db,{requestId,quoteId,type:'build215_packaging',label:terms.packaging_choice?`Packaging — ${terms.packaging_choice}`:'Packaging',quantity:Number(terms.quote_quantity||1),unitCents:terms.packaging_charge_cents,taxable:1,sortOrder:38,userId,active:Number(terms.packaging_charge_cents||0)>0});
  const totals=await syncQuoteTotals(db,quote);
  const summary=termsSummary(request,terms,tiers);
  if(summary){
    await db.prepare(`UPDATE custom_request_quote_share_links SET scope_summary=?,expires_at=COALESCE(?,expires_at),updated_at=CURRENT_TIMESTAMP
      WHERE custom_request_id=? AND quote_draft_id=? AND share_status IN ('active','viewed')`).bind(summary,terms.expires_at||null,requestId,quoteId).run().catch(()=>null);
  }
  return {totals,summary,selected_tier:selected};
}
function readiness(terms,tiers){
  if(!terms)return {state:'not_configured',blockers:['Batch/corporate quote assumptions have not been saved yet.'],warnings:[]};
  const blockers=[],warnings=[];
  if(Number(terms.quote_quantity||0)<1)blockers.push('Quote quantity must be at least 1.');
  if(terms.unit_assumption_mode==='tiered'){
    const selected=(tiers||[]).find(x=>Number(x.is_selected||0)===1);
    if(!selected)blockers.push('Tiered unit assumptions require one selected quantity tier.');
    else if(selected.unit_amount_cents==null)warnings.push('Selected tier unit price is unknown.');
  }
  if(terms.production_cost_state==='unknown')warnings.push('Production-cost evidence is unknown and is not treated as zero.');
  if(terms.production_cost_state==='partial')warnings.push('Production-cost evidence is partial.');
  if(!terms.expires_at)warnings.push('Quote expiry is not set.');
  if(!terms.lead_time_assumption&&terms.lead_time_min_days==null&&terms.lead_time_max_days==null)warnings.push('Lead-time assumption is not set.');
  if(terms.handoff_method==='tbd')warnings.push('Pickup/shipping/event handoff is still to be determined.');
  return {state:blockers.length?'blocked':warnings.length?'review':'ready',blockers,warnings};
}
async function payload(db,requestId){
  const request=await requestById(db,requestId);
  if(!request)return {ok:false,error:'Custom request was not found.'};
  const quote=await quoteByRequest(db,requestId);
  if(!quote)return {ok:true,request,quote:null,quote_required:true,terms:null,tiers:[],readiness:{state:'quote_required',blockers:['Create the existing Custom Work quote draft first.'],warnings:[]},payment_execution:false,order_creation:false};
  const terms=await termsByQuote(db,quote.custom_request_quote_draft_id);
  const tiers=terms?await tiersByTerms(db,terms.custom_request_quote_batch_terms_id):[];
  return {ok:true,request,quote,quote_required:false,terms,tiers,readiness:readiness(terms,tiers),quote_lines:await quoteLines(db,quote.custom_request_quote_draft_id),revisions:await revisions(db,quote.custom_request_quote_draft_id),scope_summary:termsSummary(request,terms,tiers),payment_execution:false,provider_execution:false,order_creation:false,unknown_cost_is_zero:false};
}
async function ensureTerms(db,request,quote,admin,body={}){
  let terms=await termsByQuote(db,quote.custom_request_quote_draft_id);
  if(terms)return terms;
  const requested=intOrNull(body.requested_quantity)??intOrNull(request.quantity);
  const quoted=intOrNull(body.quote_quantity)??requested??1;
  const insert=await db.prepare(`INSERT INTO custom_request_quote_batch_terms(
    custom_request_id,quote_draft_id,requested_quantity,quote_quantity,unit_assumption_mode,personalization_scope,handoff_method,production_cost_state,created_by_user_id,updated_by_user_id,created_at,updated_at)
    VALUES(?,?,?,?,'single_unit','unknown','tbd','unknown',?,?,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)`)
    .bind(id(request.custom_request_id),id(quote.custom_request_quote_draft_id),requested,Math.max(1,quoted),id(admin.user_id)||null,id(admin.user_id)||null).run();
  return db.prepare(`SELECT * FROM custom_request_quote_batch_terms WHERE custom_request_quote_batch_terms_id=? LIMIT 1`).bind(id(insert.meta?.last_row_id)).first();
}
async function audit(context,admin,quote,action,details={}){
  await auditAdminAction(context.env,context.request,admin,{action_type:`build215_${action}`,target_type:'custom_request_quote_drafts',target_id:id(quote?.custom_request_quote_draft_id),target_key:quote?.quote_key||null,details:{parallel_quote_engine:false,payment_execution:false,provider_execution:false,order_creation:false,unknown_cost_is_zero:false,...details}});
}

export async function onRequestGet(context){
  const a=await access(context);if(a.error)return a.error;
  const u=new URL(context.request.url),requestId=id(u.searchParams.get('request_id')||u.searchParams.get('custom_request_id'));
  if(!requestId)return json({ok:false,error:'Choose a Custom Request.'},400);
  const data=await payload(a.db,requestId);return json(data,data.ok?200:404);
}

export async function onRequestPost(context){
  const a=await access(context);if(a.error)return a.error;
  let body={};try{body=await context.request.json();}catch{return json({ok:false,error:'Invalid JSON body.'},400);}
  const requestId=id(body.request_id||body.custom_request_id);if(!requestId)return json({ok:false,error:'Choose a Custom Request.'},400);
  const request=await requestById(a.db,requestId);if(!request)return json({ok:false,error:'Custom request was not found.'},404);
  const quote=await quoteByRequest(a.db,requestId);if(!quote)return json({ok:false,error:'Create the existing Custom Work quote draft before adding batch/corporate quote assumptions.',code:'quote_draft_required'},409);
  const action=clean(body.action,60).toLowerCase(),userId=id(a.admin.user_id)||null;
  let terms=await ensureTerms(a.db,request,quote,a.admin,body);

  if(action==='save_terms'){
    const requested=intOrNull(body.requested_quantity),quoted=intOrNull(body.quote_quantity);
    if(quoted!=null&&quoted<1)return json({ok:false,error:'Quote quantity must be at least 1.'},400);
    const minDays=intOrNull(body.lead_time_min_days),maxDays=intOrNull(body.lead_time_max_days);
    if(minDays!=null&&minDays<0||maxDays!=null&&maxDays<0)return json({ok:false,error:'Lead-time days cannot be negative.'},400);
    if(minDays!=null&&maxDays!=null&&maxDays<minDays)return json({ok:false,error:'Maximum lead time cannot be less than minimum lead time.'},400);
    const mode=['single_unit','tiered','mixed','manual'].includes(String(body.unit_assumption_mode||''))?String(body.unit_assumption_mode):'single_unit';
    const personal=['none','fixed','variable','mixed','unknown'].includes(String(body.personalization_scope||''))?String(body.personalization_scope):'unknown';
    const handoff=['tbd','pickup','shipping','event_handoff','corporate_delivery','other'].includes(String(body.handoff_method||''))?String(body.handoff_method):'tbd';
    const costState=['unknown','partial','reviewed'].includes(String(body.production_cost_state||''))?String(body.production_cost_state):'unknown';
    await a.db.prepare(`UPDATE custom_request_quote_batch_terms SET
      requested_quantity=?,quote_quantity=?,unit_assumption_mode=?,setup_charge_cents=?,prototype_sample_charge_cents=?,
      packaging_choice=?,packaging_charge_cents=?,personalization_scope=?,personalization_notes=?,unit_assumption_note=?,
      lead_time_min_days=?,lead_time_max_days=?,lead_time_assumption=?,handoff_method=?,handoff_notes=?,corporate_event_context=?,
      expires_at=?,production_cost_state=?,production_cost_note=?,revision_note=?,updated_by_user_id=?,updated_at=CURRENT_TIMESTAMP
      WHERE custom_request_quote_batch_terms_id=?`).bind(
        requested??intOrNull(request.quantity),Math.max(1,quoted??Number(terms.quote_quantity||1)),mode,cents(body.setup_charge_cents),cents(body.prototype_sample_charge_cents),
        clean(body.packaging_choice,240)||null,cents(body.packaging_charge_cents),personal,clean(body.personalization_notes,1600)||null,clean(body.unit_assumption_note,1600)||null,
        minDays,maxDays,clean(body.lead_time_assumption,800)||null,handoff,clean(body.handoff_notes,1600)||null,clean(body.corporate_event_context,1600)||null,
        clean(body.expires_at,80)||null,costState,clean(body.production_cost_note,1600)||null,clean(body.revision_note,1200)||null,userId,id(terms.custom_request_quote_batch_terms_id)).run();
    terms=await termsByQuote(a.db,quote.custom_request_quote_draft_id);
    const tiers=await tiersByTerms(a.db,terms.custom_request_quote_batch_terms_id);
    const projection=await syncOwnedQuoteProjection(a.db,request,quote,terms,tiers,userId);
    await recordRevision(a.db,{requestId,quoteId:id(quote.custom_request_quote_draft_id),userId,type:'build215_terms_changed',note:body.revision_note||'Small-batch/corporate/event quote assumptions updated.',snapshot:{terms,tiers,projection}});
    await audit(context,a.admin,quote,'save_terms',{quote_quantity:terms.quote_quantity,production_cost_state:terms.production_cost_state});
    return json({message:'Batch/corporate quote assumptions saved into the existing quote authority.',...await payload(a.db,requestId)});
  }

  if(action==='save_tier'){
    const tierId=id(body.custom_request_quote_quantity_tier_id||body.tier_id);
    const label=clean(body.tier_label,240)||'Quantity tier',min=intOrNull(body.min_quantity),max=intOrNull(body.max_quantity),unit=nullableCents(body.unit_amount_cents);
    if(!min||min<1)return json({ok:false,error:'Tier minimum quantity must be at least 1.'},400);
    if(max!=null&&max<min)return json({ok:false,error:'Tier maximum quantity cannot be less than minimum quantity.'},400);
    const selected=Number(body.is_selected||0)===1;
    if(selected)await a.db.prepare(`UPDATE custom_request_quote_quantity_tiers SET is_selected=0,updated_by_user_id=?,updated_at=CURRENT_TIMESTAMP WHERE custom_request_quote_batch_terms_id=?`).bind(userId,id(terms.custom_request_quote_batch_terms_id)).run();
    if(tierId){
      await a.db.prepare(`UPDATE custom_request_quote_quantity_tiers SET tier_label=?,min_quantity=?,max_quantity=?,unit_amount_cents=?,is_selected=?,assumption_note=?,sort_order=?,updated_by_user_id=?,updated_at=CURRENT_TIMESTAMP
        WHERE custom_request_quote_quantity_tier_id=? AND custom_request_quote_batch_terms_id=?`).bind(label,min,max,unit,selected?1:0,clean(body.assumption_note,1000)||null,Number(body.sort_order||100),userId,tierId,id(terms.custom_request_quote_batch_terms_id)).run();
    }else{
      await a.db.prepare(`INSERT INTO custom_request_quote_quantity_tiers(custom_request_quote_batch_terms_id,quote_draft_id,tier_label,min_quantity,max_quantity,unit_amount_cents,is_selected,assumption_note,sort_order,created_by_user_id,updated_by_user_id,created_at,updated_at)
        VALUES(?,?,?,?,?,?,?,?,?,?,?,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)`).bind(id(terms.custom_request_quote_batch_terms_id),id(quote.custom_request_quote_draft_id),label,min,max,unit,selected?1:0,clean(body.assumption_note,1000)||null,Number(body.sort_order||100),userId,userId).run();
    }
    const tiers=await tiersByTerms(a.db,terms.custom_request_quote_batch_terms_id);
    const projection=await syncOwnedQuoteProjection(a.db,request,quote,terms,tiers,userId);
    await recordRevision(a.db,{requestId,quoteId:id(quote.custom_request_quote_draft_id),userId,type:'build215_tier_changed',note:`Quantity tier ${tierId?'updated':'added'}: ${label}`,snapshot:{terms,tiers,projection}});
    await audit(context,a.admin,quote,'save_tier',{tier_label:label,selected,unit_amount_known:unit!=null});
    return json({message:'Quantity tier saved and quote projection refreshed.',...await payload(a.db,requestId)});
  }

  if(action==='delete_tier'){
    const tierId=id(body.custom_request_quote_quantity_tier_id||body.tier_id);if(!tierId)return json({ok:false,error:'Choose a quantity tier.'},400);
    const existing=await a.db.prepare(`SELECT * FROM custom_request_quote_quantity_tiers WHERE custom_request_quote_quantity_tier_id=? AND custom_request_quote_batch_terms_id=? LIMIT 1`).bind(tierId,id(terms.custom_request_quote_batch_terms_id)).first();
    if(!existing)return json({ok:false,error:'Quantity tier was not found.'},404);
    await a.db.prepare(`DELETE FROM custom_request_quote_quantity_tiers WHERE custom_request_quote_quantity_tier_id=?`).bind(tierId).run();
    const tiers=await tiersByTerms(a.db,terms.custom_request_quote_batch_terms_id);
    const projection=await syncOwnedQuoteProjection(a.db,request,quote,terms,tiers,userId);
    await recordRevision(a.db,{requestId,quoteId:id(quote.custom_request_quote_draft_id),userId,type:'build215_tier_removed',note:`Quantity tier removed: ${existing.tier_label}`,snapshot:{removed_tier:existing,terms,tiers,projection}});
    await audit(context,a.admin,quote,'delete_tier',{tier_id:tierId,was_selected:Number(existing.is_selected||0)===1});
    return json({message:'Quantity tier removed; revision history retained.',...await payload(a.db,requestId)});
  }

  return json({ok:false,error:'Unsupported Build 215 action.'},400);
}
