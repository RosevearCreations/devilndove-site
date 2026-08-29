// Release 450 marketplace export/readiness preview.
// Uses migration-owned schema. No request-time DDL and no provider publication/network calls.
import { getAdminUserFromRequest, getDb, jsonResponse, normalizeText } from '../_lib/adminAudit.js';
import {
  MARKETPLACE_RELEASE,
  MARKETPLACE_CONTRACT,
  marketplaceSchemaStatus,
  readChannelPolicy,
  validateListingDraft,
  jsonArray,
  cleanList,
} from '../_lib/marketplaceReadiness.js';

function json(data,status=200){return jsonResponse(data,status,{ 'Cache-Control':'no-store' });}
function rows(result){return Array.isArray(result?.results)?result.results:[];}
function clean(value,limit=4000){const text=normalizeText(value);return text.length>limit?text.slice(0,limit).trim():text;}
function csvEscape(value){const text=String(value??'');return /[",\n\r]/.test(text)?`"${text.replace(/"/g,'""')}"`:text;}
function csv(data,filename){return new Response(data,{status:200,headers:{'Content-Type':'text/csv; charset=utf-8','Content-Disposition':`attachment; filename="${filename}"`,'Cache-Control':'no-store'}});}
const SUPPORTED=['etsy','facebook','pinterest','tiktok','manual'];

async function productRows(db){
  return rows(await db.prepare(`
    SELECT p.product_id,p.name,p.slug,p.sku,p.status,p.review_status,p.price_cents,p.currency,
           p.product_category,p.short_description,p.description,ps.keywords
    FROM products p
    LEFT JOIN product_seo ps ON ps.product_id=p.product_id
    WHERE COALESCE(p.status,'draft')<>'archived'
    ORDER BY p.product_id DESC LIMIT 150
  `).all().catch(()=>({results:[]})));
}
async function imageRows(db){
  return rows(await db.prepare(`
    SELECT product_image_id,product_id,image_url,alt_text,image_role,public_use_status,width_px,height_px,merchandising_score
    FROM product_images ORDER BY product_id,sort_order ASC,product_image_id ASC
  `).all().catch(()=>({results:[]})));
}
async function selectionMap(db,channel){
  const result=rows(await db.prepare(`SELECT product_id,selected_image_urls_json,notes,updated_at FROM marketplace_export_image_selections WHERE channel=?`).bind(channel).all().catch(()=>({results:[]})));
  const map=new Map();
  for(const row of result)map.set(Number(row.product_id||0),{urls:cleanList(jsonArray(row.selected_image_urls_json||'[]',40),1200,40),notes:row.notes||'',updated_at:row.updated_at||''});
  return map;
}
async function profileMap(db,channel){
  const result=rows(await db.prepare(`SELECT * FROM marketplace_listing_profiles WHERE channel_key=?`).bind(channel).all().catch(()=>({results:[]})));
  return new Map(result.map((row)=>[Number(row.product_id||0),row]));
}
function groupedImages(all){
  const map=new Map();
  for(const row of all){const id=Number(row.product_id||0);if(!map.has(id))map.set(id,[]);map.get(id).push(row);}
  return map;
}
function publicImages(images){return images.filter((img)=>['product_page_ok','social_ok','all_public_ok'].includes(String(img.public_use_status||'').toLowerCase()));}
function autoImageOrder(images,limit){
  const ranks=new Map([['hero_front',0],['detail_texture',1],['scale_context',2],['process_story',3],['gallery_support',4]]);
  return [...images].sort((a,b)=>(ranks.get(String(a.image_role||'').toLowerCase())??50)-(ranks.get(String(b.image_role||'').toLowerCase())??50) || Number(b.merchandising_score||0)-Number(a.merchandising_score||0) || Number(a.product_image_id||0)-Number(b.product_image_id||0)).slice(0,limit);
}
function effectiveProfile(product,profile){
  if(profile)return profile;
  const tags=String(product.keywords||product.product_category||'').split(',').map((v)=>v.trim()).filter(Boolean).slice(0,13);
  return {
    channel_key:'',product_id:Number(product.product_id||0),listing_type:'physical',title_override:'',description_override:'',
    tags_json:JSON.stringify(tags),materials_json:'[]',style_terms_json:'[]',personalization_questions_json:'[]',variation_properties_json:'[]',production_partner_refs_json:'[]'
  };
}
function fieldPreview(row){
  const p=row.profile||{}; const product=row.product||{}; const images=row.selected_images||[];
  const tags=cleanList(p.tags_json,80,50);
  const materials=cleanList(p.materials_json,80,50);
  const questions=jsonArray(p.personalization_questions_json||'[]',10);
  const variations=jsonArray(p.variation_properties_json||'[]',10);
  return {
    title:clean(p.title_override||product.name,140),
    description:clean(p.description_override||product.description||product.short_description,12000),
    price:Number(product.price_cents||0)>0?(Number(product.price_cents)/100).toFixed(2):'',
    currency:product.currency||'CAD', quantity:Number(p.quantity_override||1), sku:product.sku||'',
    taxonomy_id:p.taxonomy_id||'', who_made:p.who_made||'', when_made:p.when_made||'', is_supply:Number(p.is_supply||0),
    materials, tags, shipping_profile_reference:p.shipping_profile_reference||'', readiness_state_reference:p.readiness_state_reference||'',
    return_policy_reference:p.return_policy_reference||'', personalization_question_count:questions.length, variation_property_count:variations.length,
    link:product.slug?`/shop/product/?slug=${encodeURIComponent(product.slug)}`:'',
    image_1:images[0]?.image_url||'',image_2:images[1]?.image_url||'',image_3:images[2]?.image_url||'',image_4:images[3]?.image_url||'',image_5:images[4]?.image_url||''
  };
}

async function buildPreview(db,channel){
  const policy=await readChannelPolicy(db,channel);
  if(!policy)return {policy:null,previews:[]};
  const [products,images,selections,profiles]=await Promise.all([productRows(db),imageRows(db),selectionMap(db,channel),profileMap(db,channel)]);
  const grouped=groupedImages(images); const maxImages=Math.max(1,Number(policy.max_images||10));
  const previews=products.map((product)=>{
    const productId=Number(product.product_id||0); const available=publicImages(grouped.get(productId)||[]);
    const saved=selections.get(productId)||{urls:[],notes:'',updated_at:''};
    const selected=saved.urls.length?saved.urls.map((url)=>available.find((img)=>img.image_url===url)).filter(Boolean).slice(0,maxImages):autoImageOrder(available,maxImages);
    const profile=effectiveProfile(product,profiles.get(productId));
    const validation=validateListingDraft({channel,product,profile,selectedImages:selected,policy});
    const row={product_id:productId,name:product.name||'',sku:product.sku||'',slug:product.slug||'',channel,product,profile,policy,
      selected_images:selected,selected_image_urls:selected.map((img)=>img.image_url),available_images:available.slice(0,Math.max(maxImages,20)).map((img)=>({product_image_id:Number(img.product_image_id||0),image_url:img.image_url||'',alt_text:img.alt_text||'',image_role:img.image_role||'',width_px:Number(img.width_px||0),height_px:Number(img.height_px||0)})),
      selection_saved:Boolean(saved.urls.length),selection_notes:saved.notes,selection_saved_at:saved.updated_at,validation};
    row.field_preview=fieldPreview(row); row.ok=validation.blocker_count===0; row.issues=[...validation.blockers,...validation.warnings];
    return row;
  });
  return {policy,previews};
}

async function marginBlockers(db,channel,previewIds){
  const marginChannel=channel==='facebook'?'facebook_meta':channel==='manual'?'manual_local':channel;
  const warnings=rows(await db.prepare(`SELECT product_id,warning_status,marketplace_export_status,estimated_margin_cents,estimated_margin_percent FROM product_margin_warning_rows WHERE marketplace_export_status<>'allowed' OR warning_status<>'healthy_margin'`).all().catch(()=>({results:[]})));
  const overrides=rows(await db.prepare(`SELECT product_id FROM marketplace_margin_override_history WHERE approval_status='approved' AND channel_key=? AND (expires_at IS NULL OR date(expires_at)>=date('now'))`).bind(marginChannel).all().catch(()=>({results:[]})));
  const allowed=new Set(overrides.map((row)=>Number(row.product_id||0)));
  return warnings.filter((row)=>previewIds.has(Number(row.product_id||0))&&!allowed.has(Number(row.product_id||0)));
}
async function saveValidationRows(db,channel,previews,userId){
  await db.prepare(`DELETE FROM marketplace_export_row_validation_results WHERE channel=?`).bind(channel).run().catch(()=>null);
  let blocked=0;
  for(const row of previews){
    const v=row.validation; if(v.blocker_count)blocked+=1;
    await db.prepare(`INSERT INTO marketplace_export_row_validation_results (channel,product_id,validation_status,blocker_count,warning_count,missing_fields_json,row_payload_json,created_by_user_id,created_at) VALUES (?,?,?,?,?,?,?,?,CURRENT_TIMESTAMP)`)
      .bind(channel,row.product_id,v.blocker_count?'blocked':v.warning_count?'needs_review':'passed',v.blocker_count,v.warning_count,JSON.stringify(v.blockers),JSON.stringify(row.field_preview),userId||null).run();
  }
  return {total:previews.length,blocked,passed:previews.length-blocked};
}

export async function onRequestGet(context){
  const user=await getAdminUserFromRequest(context.request,context.env); if(!user)return json({ok:false,release:MARKETPLACE_RELEASE,error:'Admin access required.'},401);
  const db=getDb(context.env); if(!db)return json({ok:false,release:MARKETPLACE_RELEASE,error:'Database binding is not configured.'},500);
  const schema=await marketplaceSchemaStatus(db); if(!schema.ready)return json({ok:false,release:MARKETPLACE_RELEASE,contract:MARKETPLACE_CONTRACT,schema_ready:false,missing_tables:schema.missing_tables,request_time_schema_mutation:false,error:'Release 450 marketplace schema is not active.'},503);
  const url=new URL(context.request.url); const channel=clean(url.searchParams.get('channel')||'etsy',40).toLowerCase();
  if(!SUPPORTED.includes(channel))return json({ok:false,error:`Supported channels: ${SUPPORTED.join(', ')}.`},400);
  const {policy,previews}=await buildPreview(db,channel); if(!policy)return json({ok:false,error:'Marketplace channel policy is not configured.'},409);
  if(url.searchParams.get('format')==='csv'){
    if(Number(policy.provider_execution_allowed||0)!==0||Number(policy.publication_allowed||0)!==0)return json({ok:false,error:'Release 450 refuses export while provider publication is enabled.'},409);
    const marginBlocked=await marginBlockers(db,channel,new Set(previews.map((row)=>row.product_id)));
    if(marginBlocked.length){await db.prepare(`INSERT INTO marketplace_download_block_events (channel,gate_status,hard_blocker_count,blocked,requested_by_user_id,created_at,notes) VALUES (?,'blocked_margin',?,1,?,CURRENT_TIMESTAMP,?)`).bind(channel,marginBlocked.length,Number(user.user_id||0)||null,'Release 450 local export blocked by margin completeness policy.').run().catch(()=>null);return json({ok:false,error:`CSV preparation is blocked: ${marginBlocked.length} product(s) need healthy margin data or an approved temporary override.`,margin_blockers:marginBlocked},409);}
    const hardBlocked=previews.filter((row)=>row.validation.blocker_count>0);
    if(hardBlocked.length)return json({ok:false,error:`CSV preparation is blocked: ${hardBlocked.length} listing(s) have unresolved marketplace blockers.`,blocked_products:hardBlocked.map((row)=>({product_id:row.product_id,blockers:row.validation.blockers}))},409);
    await db.prepare(`INSERT INTO marketplace_export_history (channel,export_format,product_count,ready_count,blocked_count,created_by_user_id,created_at,notes) VALUES (?,'csv',?,?,?,?,CURRENT_TIMESTAMP,?)`).bind(channel,previews.length,previews.length,0,Number(user.user_id||0)||null,'Release 450 local CSV prepared; no provider publication occurred.').run().catch(()=>null);
    const headers=['channel','product_id','sku','title','description','price','currency','quantity','taxonomy_id','who_made','when_made','is_supply','materials','tags','shipping_profile_reference','readiness_state_reference','return_policy_reference','link','image_1','image_2','image_3','image_4','image_5'];
    const lines=[headers.join(',')];
    for(const row of previews){const f=row.field_preview;lines.push([channel,row.product_id,row.sku,f.title,f.description,f.price,f.currency,f.quantity,f.taxonomy_id,f.who_made,f.when_made,f.is_supply,(f.materials||[]).join('|'),(f.tags||[]).join('|'),f.shipping_profile_reference,f.readiness_state_reference,f.return_policy_reference,f.link,f.image_1,f.image_2,f.image_3,f.image_4,f.image_5].map(csvEscape).join(','));}
    return csv(lines.join('\n'),`devilndove-${channel}-release450-draft-preparation.csv`);
  }
  const history=rows(await db.prepare(`SELECT marketplace_export_history_id,channel,export_format,product_count,ready_count,blocked_count,created_at,notes FROM marketplace_export_history WHERE channel=? ORDER BY datetime(created_at) DESC LIMIT 20`).bind(channel).all().catch(()=>({results:[]})));
  return json({ok:true,release:MARKETPLACE_RELEASE,contract:MARKETPLACE_CONTRACT,request_time_schema_mutation:false,provider_execution:false,publication_allowed:false,channel,policy,summary:{total:previews.length,draft_ready:previews.filter((row)=>row.validation.validation_state==='draft_ready').length,needs_review:previews.filter((row)=>row.validation.validation_state==='needs_review').length,blocked:previews.filter((row)=>row.validation.validation_state==='blocked').length,selected_products:previews.filter((row)=>row.selection_saved).length},previews,history});
}

export async function onRequestPost(context){
  const user=await getAdminUserFromRequest(context.request,context.env); if(!user)return json({ok:false,release:MARKETPLACE_RELEASE,error:'Admin access required.'},401);
  const db=getDb(context.env); if(!db)return json({ok:false,error:'Database binding is not configured.'},500);
  const schema=await marketplaceSchemaStatus(db); if(!schema.ready)return json({ok:false,release:MARKETPLACE_RELEASE,schema_ready:false,missing_tables:schema.missing_tables,request_time_schema_mutation:false,error:'Release 450 marketplace schema is not active.'},503);
  let body={};try{body=await context.request.json();}catch{return json({ok:false,error:'Invalid JSON body.'},400);}
  const channel=clean(body.channel||'etsy',40).toLowerCase();const action=clean(body.action||'save_selection',80);const productId=Number(body.product_id||0);
  if(!SUPPORTED.includes(channel))return json({ok:false,error:'Unsupported marketplace channel.'},400);
  const policy=await readChannelPolicy(db,channel);if(!policy)return json({ok:false,error:'Marketplace channel policy is not configured.'},409);
  if(Number(policy.provider_execution_allowed||0)!==0||Number(policy.publication_allowed||0)!==0)return json({ok:false,error:'Release 450 refuses marketplace writes while provider publication is enabled.'},409);
  if(action==='validate_export_rows'){const {previews}=await buildPreview(db,channel);const summary=await saveValidationRows(db,channel,previews,Number(user.user_id||0)||null);return json({ok:true,release:MARKETPLACE_RELEASE,message:`Validated ${summary.total} local ${channel} draft row(s).`,summary,provider_execution:false});}
  if(action==='bulk_apply_role_order'){
    const {previews}=await buildPreview(db,channel);let saved=0;
    for(const row of previews){const ordered=autoImageOrder(row.available_images||[],Number(policy.max_images||10)).map((img)=>img.image_url).filter(Boolean);if(!ordered.length)continue;await db.prepare(`INSERT INTO marketplace_export_image_selections (channel,product_id,selected_image_urls_json,selected_product_image_ids_json,notes,created_by_user_id,created_at,updated_at) VALUES (?,?,?,'[]',?,?,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP) ON CONFLICT(channel,product_id) DO UPDATE SET selected_image_urls_json=excluded.selected_image_urls_json,notes=excluded.notes,updated_at=CURRENT_TIMESTAMP`).bind(channel,row.product_id,JSON.stringify(ordered),'Release 450 automatic image-role order.',Number(user.user_id||0)||null).run();saved+=1;}
    return json({ok:true,message:`Applied image-role order to ${saved} product(s).`,saved,provider_execution:false});
  }
  if(action==='clear_channel_selections'){const result=await db.prepare(`DELETE FROM marketplace_export_image_selections WHERE channel=?`).bind(channel).run();return json({ok:true,message:`Cleared ${Number(result?.meta?.changes||0)} saved selection(s).`,provider_execution:false});}
  if(action==='rollback_selection'){if(!productId)return json({ok:false,error:'product_id is required.'},400);await db.prepare(`DELETE FROM marketplace_export_image_selections WHERE channel=? AND product_id=?`).bind(channel,productId).run();return json({ok:true,message:'Marketplace image selection returned to automatic local ordering.',product_id:productId,provider_execution:false});}
  if(!productId)return json({ok:false,error:'product_id is required.'},400);
  const maxImages=Math.max(1,Number(policy.max_images||10));const urls=(Array.isArray(body.selected_image_urls)?body.selected_image_urls:[]).map((url)=>clean(url,1200)).filter(Boolean).slice(0,maxImages);
  await db.prepare(`INSERT INTO marketplace_export_image_selections (channel,product_id,selected_image_urls_json,selected_product_image_ids_json,notes,created_by_user_id,created_at,updated_at) VALUES (?,?,?,'[]',?,?,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP) ON CONFLICT(channel,product_id) DO UPDATE SET selected_image_urls_json=excluded.selected_image_urls_json,notes=excluded.notes,updated_at=CURRENT_TIMESTAMP`).bind(channel,productId,JSON.stringify(urls),clean(body.notes||'',800),Number(user.user_id||0)||null).run();
  return json({ok:true,release:MARKETPLACE_RELEASE,message:'Marketplace image selection saved for local draft preparation.',channel,product_id:productId,selected_image_urls:urls,provider_execution:false,publication_allowed:false});
}
