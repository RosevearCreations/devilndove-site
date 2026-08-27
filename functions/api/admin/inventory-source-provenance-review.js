// Devil n Dove Build 440 — Tool/Supply source and identifier provenance review.
// Metadata-only. This endpoint never changes on-hand/reserved/incoming quantities or purchase-lot quantities.

import { auditAdminAction, captureRuntimeIncident, getAdminUserFromRequest, getDb, jsonResponse, normalizeText } from '../_lib/adminAudit.js';
import { inventoryReceivingSchemaReadiness } from '../_lib/inventoryReceiving.js';

const BUILD = 440;
function json(data, status = 200) { return jsonResponse(data, status, { 'Cache-Control':'no-store' }); }
function rows(result) { return Array.isArray(result?.results) ? result.results : []; }
function id(value) { const n=Number(value||0); return Number.isInteger(n)&&n>0?n:0; }
function text(value,max=1000){ return normalizeText(value).slice(0,max); }

async function access(context) {
  const user=await getAdminUserFromRequest(context.request,context.env);
  if(!user) return {error:json({ok:false,build:BUILD,error:'Unauthorized.'},401)};
  const db=getDb(context.env);
  if(!db) return {error:json({ok:false,build:BUILD,error:'Database binding is not configured.'},500)};
  const schema=await inventoryReceivingSchemaReadiness(db);
  if(!schema.ok) return {error:json({ok:false,build:BUILD,error:'Build 440 source-provenance schema is not ready.',missing_tables:schema.missing_tables},503)};
  return {user,db};
}

async function loadQueues(db) {
  const unverifiedSources=rows(await db.prepare(`
    SELECT s.inventory_item_source_id,s.site_item_inventory_id,s.source_kind,s.source_name,s.supplier_sku,s.source_url,
           s.is_preferred,s.verification_status,s.receipt_count,s.last_received_at,s.updated_at,
           sii.item_name,sii.source_type,sii.external_key
    FROM inventory_item_sources s
    INNER JOIN site_item_inventory sii ON sii.site_item_inventory_id=s.site_item_inventory_id
    WHERE s.verification_status='needs_review' AND COALESCE(sii.is_active,1)=1
      AND LOWER(TRIM(COALESCE(sii.source_type,''))) IN ('tool','supply')
    ORDER BY COALESCE(s.last_received_at,s.updated_at) DESC,s.inventory_item_source_id DESC LIMIT 80
  `).all().catch(()=>({results:[]})));

  const preferredDrift=rows(await db.prepare(`
    SELECT s.inventory_item_source_id,s.site_item_inventory_id,s.source_kind,s.source_name,s.supplier_sku,s.source_url,
           s.is_preferred,s.verification_status,s.receipt_count,s.last_received_at,
           sii.item_name,sii.source_type,sii.external_key,sii.supplier_name inventory_supplier_name,
           sii.supplier_sku inventory_supplier_sku,sii.source_url inventory_source_url
    FROM inventory_item_sources s
    INNER JOIN site_item_inventory sii ON sii.site_item_inventory_id=s.site_item_inventory_id
    WHERE s.is_preferred=1 AND COALESCE(sii.is_active,1)=1
      AND LOWER(TRIM(COALESCE(sii.source_type,''))) IN ('tool','supply')
      AND (
        LOWER(TRIM(COALESCE(s.source_name,'')))<>LOWER(TRIM(COALESCE(sii.supplier_name,''))) OR
        UPPER(REPLACE(TRIM(COALESCE(s.supplier_sku,'')),' ',''))<>UPPER(REPLACE(TRIM(COALESCE(sii.supplier_sku,'')),' ','')) OR
        LOWER(TRIM(COALESCE(s.source_url,'')))<>LOWER(TRIM(COALESCE(sii.source_url,'')))
      )
    ORDER BY sii.item_name LIMIT 80
  `).all().catch(()=>({results:[]})));

  const preferredCardinality=rows(await db.prepare(`
    SELECT sii.site_item_inventory_id,sii.item_name,sii.source_type,sii.external_key,
           COUNT(s.inventory_item_source_id) source_count,
           SUM(CASE WHEN s.is_preferred=1 AND s.verification_status<>'rejected' THEN 1 ELSE 0 END) preferred_count
    FROM site_item_inventory sii
    INNER JOIN inventory_item_sources s ON s.site_item_inventory_id=sii.site_item_inventory_id AND s.verification_status<>'rejected'
    WHERE COALESCE(sii.is_active,1)=1 AND LOWER(TRIM(COALESCE(sii.source_type,''))) IN ('tool','supply')
    GROUP BY sii.site_item_inventory_id
    HAVING preferred_count<>1
    ORDER BY sii.item_name LIMIT 80
  `).all().catch(()=>({results:[]})));

  const duplicateSupplierIdentifiers=rows(await db.prepare(`
    SELECT ii.normalized_value,COUNT(DISTINCT ii.site_item_inventory_id) item_count,
           GROUP_CONCAT(DISTINCT sii.item_name) item_names,
           GROUP_CONCAT(DISTINCT ii.site_item_inventory_id) inventory_ids
    FROM inventory_item_identifiers ii
    INNER JOIN site_item_inventory sii ON sii.site_item_inventory_id=ii.site_item_inventory_id
    WHERE ii.identifier_type='supplier_sku' AND ii.verification_status<>'rejected' AND COALESCE(sii.is_active,1)=1
      AND LOWER(TRIM(COALESCE(sii.source_type,''))) IN ('tool','supply')
    GROUP BY ii.normalized_value
    HAVING COUNT(DISTINCT ii.site_item_inventory_id)>1
    ORDER BY item_count DESC,ii.normalized_value LIMIT 80
  `).all().catch(()=>({results:[]})));

  const identifierReview=rows(await db.prepare(`
    SELECT ii.inventory_item_identifier_id,ii.site_item_inventory_id,ii.identifier_type,ii.identifier_value,
           ii.normalized_value,ii.source_name,ii.is_primary,ii.verification_status,ii.created_at,
           sii.item_name,sii.source_type,sii.external_key
    FROM inventory_item_identifiers ii
    INNER JOIN site_item_inventory sii ON sii.site_item_inventory_id=ii.site_item_inventory_id
    WHERE ii.verification_status='needs_review' AND COALESCE(sii.is_active,1)=1
      AND LOWER(TRIM(COALESCE(sii.source_type,''))) IN ('tool','supply')
    ORDER BY ii.created_at DESC,ii.inventory_item_identifier_id DESC LIMIT 80
  `).all().catch(()=>({results:[]})));

  return {
    unverified_sources:unverifiedSources,
    preferred_drift:preferredDrift,
    preferred_cardinality:preferredCardinality,
    duplicate_supplier_identifiers:duplicateSupplierIdentifiers,
    identifier_review:identifierReview,
    summary:{
      unverified_sources:unverifiedSources.length,
      preferred_drift:preferredDrift.length,
      preferred_cardinality:preferredCardinality.length,
      duplicate_supplier_identifiers:duplicateSupplierIdentifiers.length,
      identifier_review:identifierReview.length,
    }
  };
}

export async function onRequestGet(context){
  const a=await access(context); if(a.error)return a.error;
  try{return json({ok:true,build:BUILD,owner:'inventory',queues:await loadQueues(a.db),mutation_capability:'metadata_review_only'});}
  catch(error){return json({ok:false,build:BUILD,error:error?.message||'Source provenance review could not load.'},500);}
}

export async function onRequestPost(context){
  const a=await access(context); if(a.error)return a.error;
  let body={}; try{body=await context.request.json();}catch{return json({ok:false,build:BUILD,error:'Invalid JSON body.'},400);}
  const action=text(body.action,60).toLowerCase();
  const note=text(body.review_note,1000);
  try{
    if(action==='review_source'){
      const sourceId=id(body.inventory_item_source_id); const status=text(body.verification_status,30).toLowerCase();
      if(!sourceId||!['verified','rejected'].includes(status)) throw Object.assign(new Error('Choose a source and verified/rejected status.'),{status:400});
      if(note.length<8) throw Object.assign(new Error('Enter a review note of at least 8 characters.'),{status:400});
      const source=await a.db.prepare(`SELECT * FROM inventory_item_sources WHERE inventory_item_source_id=? LIMIT 1`).bind(sourceId).first();
      if(!source) throw Object.assign(new Error('Source record not found.'),{status:404});
      await a.db.prepare(`UPDATE inventory_item_sources SET verification_status=?,is_preferred=CASE WHEN ?='rejected' THEN 0 ELSE is_preferred END,last_verified_at=CURRENT_TIMESTAMP,updated_by_user_id=?,updated_at=CURRENT_TIMESTAMP WHERE inventory_item_source_id=?`).bind(status,status,a.user.user_id,sourceId).run();
      await auditAdminAction(context.env,context.request,a.user,{action_type:'inventory_source_review',target_type:'inventory_item_source',target_id:sourceId,target_key:source.source_name||source.supplier_sku||String(sourceId),details:{verification_status:status,review_note:note,site_item_inventory_id:Number(source.site_item_inventory_id||0)}});
    } else if(action==='set_preferred_source'){
      const sourceId=id(body.inventory_item_source_id); if(!sourceId)throw Object.assign(new Error('Choose a source record.'),{status:400});
      if(note.length<8) throw Object.assign(new Error('Enter a review note of at least 8 characters.'),{status:400});
      const source=await a.db.prepare(`SELECT * FROM inventory_item_sources WHERE inventory_item_source_id=? AND verification_status<>'rejected' LIMIT 1`).bind(sourceId).first();
      if(!source)throw Object.assign(new Error('Source record was not found or is rejected.'),{status:404});
      const itemId=Number(source.site_item_inventory_id||0);
      const result=await a.db.batch([
        a.db.prepare(`UPDATE inventory_item_sources SET is_preferred=0,updated_at=CURRENT_TIMESTAMP WHERE site_item_inventory_id=?`).bind(itemId),
        a.db.prepare(`UPDATE inventory_item_sources SET is_preferred=1,updated_by_user_id=?,updated_at=CURRENT_TIMESTAMP WHERE inventory_item_source_id=? AND site_item_inventory_id=? AND verification_status<>'rejected'`).bind(a.user.user_id,sourceId,itemId),
        a.db.prepare(`UPDATE site_item_inventory SET supplier_name=?,supplier_sku=?,source_url=?,updated_at=CURRENT_TIMESTAMP WHERE site_item_inventory_id=?`).bind(source.source_name||null,source.supplier_sku||null,source.source_url||null,itemId)
      ]);
      if(Number(result?.[1]?.meta?.changes||0)!==1||Number(result?.[2]?.meta?.changes||0)!==1) throw Object.assign(new Error('Preferred-source update could not be verified.'),{status:409});
      await auditAdminAction(context.env,context.request,a.user,{action_type:'inventory_source_set_preferred',target_type:'site_item_inventory',target_id:itemId,target_key:source.source_name||String(itemId),details:{inventory_item_source_id:sourceId,review_note:note,legacy_inventory_fields_synced:true}});
    } else if(action==='review_identifier'){
      const identifierId=id(body.inventory_item_identifier_id); const status=text(body.verification_status,30).toLowerCase();
      if(!identifierId||!['verified','rejected'].includes(status))throw Object.assign(new Error('Choose an identifier and verified/rejected status.'),{status:400});
      if(note.length<8)throw Object.assign(new Error('Enter a review note of at least 8 characters.'),{status:400});
      const identifier=await a.db.prepare(`SELECT * FROM inventory_item_identifiers WHERE inventory_item_identifier_id=? LIMIT 1`).bind(identifierId).first();
      if(!identifier)throw Object.assign(new Error('Identifier record not found.'),{status:404});
      await a.db.prepare(`UPDATE inventory_item_identifiers SET verification_status=?,verified_by_user_id=?,verified_at=CURRENT_TIMESTAMP,updated_at=CURRENT_TIMESTAMP WHERE inventory_item_identifier_id=?`).bind(status,a.user.user_id,identifierId).run();
      await auditAdminAction(context.env,context.request,a.user,{action_type:'inventory_identifier_review',target_type:'inventory_item_identifier',target_id:identifierId,target_key:identifier.identifier_value||String(identifierId),details:{verification_status:status,review_note:note,site_item_inventory_id:Number(identifier.site_item_inventory_id||0),identifier_type:identifier.identifier_type||''}});
    } else {
      return json({ok:false,build:BUILD,error:'Unsupported source-provenance review action.'},400);
    }
    return json({ok:true,build:BUILD,message:'Inventory source provenance updated.',queues:await loadQueues(a.db),stock_mutation:false,lot_quantity_mutation:false});
  }catch(error){
    await captureRuntimeIncident(context.env,context.request,{incident_scope:'inventory_source_provenance_review',incident_code:'inventory_source_review_failed',severity:'warning',message:error?.message||'Source provenance review failed.',related_user_id:a.user.user_id,details:{action,error:String(error?.stack||error)}}).catch(()=>null);
    return json({ok:false,build:BUILD,error:error?.message||'Source provenance review failed safely.'},Number(error?.status||500));
  }
}
