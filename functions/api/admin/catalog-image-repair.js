// Release 467 Build 184 — Product & Tool/Supply image repair evidence.
// Cross-authority review only. Product Media and Inventory Operations remain the mutation owners.
// R2 evidence is one selected object HEAD at a time; no bucket listing, copy, delete, or upload.
import { getAdminUserFromRequest, getDb, jsonResponse, normalizeText } from '../_lib/adminAudit.js';
import { buildReadBudgetHeaders } from '../_lib/d1ReadBudget.js';

const BUILD=184, CLOSURE_BUILD=190, RECONCILIATION_BUILD=202, MAX_ROWS=40, MAX_IMAGE_ROWS=240;
const APPROVED_PRODUCT_USE=new Set(['product_page_ok','all_public_ok']);
const PUBLIC_ORIGIN='https://assets.devilndove.com';
const rows=(r)=>Array.isArray(r?.results)?r.results:[];
const n=(v)=>Number(v||0);
const text=(v)=>normalizeText(v);
const json=(data,status=200,routeKey='admin_catalog_image_repair_v184',limit=MAX_ROWS)=>jsonResponse({release:467,build:BUILD,closure_build:CLOSURE_BUILD,reconciliation_build:RECONCILIATION_BUILD,read_only:true,...data},status,{
  'Cache-Control':'no-store',
  ...buildReadBudgetHeaders(routeKey,{limit}),
});

function canonicalR2Key(urlValue, objectKey=''){
  const direct=text(objectKey).replace(/^\/+/, '');
  if(direct)return direct;
  const raw=text(urlValue);
  if(!raw)return '';
  try{
    const url=new URL(raw);
    if(url.origin.toLowerCase()!==PUBLIC_ORIGIN)return '';
    return decodeURIComponent(url.pathname).replace(/^\/+/, '');
  }catch{return '';}
}
function imageSourceStatus(urlValue, objectKey=''){
  const raw=text(urlValue);
  if(!raw)return 'missing';
  return canonicalR2Key(raw,objectKey)?'r2_reference':'external_reference';
}
function mediaEvidenceToken(scope,row={}){
  const parts=scope==='product_image'
    ? [row.product_image_id,row.image_url,row.alt_text,row.image_role,row.public_use_status,row.annotation_updated_at,row.approved_same_role_count]
    : [row.site_item_inventory_id,row.image_url,row.updated_at,row.catalog_image_url];
  return parts.map((v)=>text(v)).join('|');
}
function roleEvidenceStatus(row={}){
  const approved=APPROVED_PRODUCT_USE.has(text(row.public_use_status).toLowerCase());
  if(!approved)return 'not_product_approved';
  if(!text(row.image_role))return 'missing_on_approved';
  if(n(row.approved_same_role_count)>1)return 'ambiguous_on_approved';
  return 'assigned_on_approved';
}
function evidenceClassification(metadataIssues=[],objectState='not_checked'){
  const metadataAttention=metadataIssues.length>0;
  const objectMissing=objectState==='missing';
  if(metadataAttention&&objectMissing)return 'metadata_and_object_attention';
  if(objectMissing)return 'object_missing';
  if(metadataAttention)return 'metadata_attention';
  if(objectState==='present')return 'healthy';
  return 'reference_review';
}
function productIssueCodes(row){
  const out=[];
  if(!text(row.featured_image_url))out.push('missing_featured');
  if(n(row.image_count)===0)out.push('no_gallery');
  else if(n(row.image_count)<3)out.push('shallow_gallery');
  if(n(row.alt_attention)>0)out.push('alt_text');
  if(n(row.role_attention)>0)out.push('image_role');
  if(n(row.featured_not_in_gallery)>0)out.push('featured_not_in_gallery');
  if(n(row.image_source_attention)>0)out.push('image_source');
  return out;
}
function imageIssues(row){
  const out=[];
  if(!text(row.image_url))out.push('missing_url');
  if(text(row.alt_text).length<12)out.push('alt_text');
  const roleState=roleEvidenceStatus(row);
  if(roleState==='missing_on_approved')out.push('image_role');
  if(roleState==='ambiguous_on_approved')out.push('image_role_ambiguous');
  if(imageSourceStatus(row.image_url,row.object_key)==='external_reference')out.push('external_source');
  return out;
}
function inventoryIssues(row){
  const out=[];
  const image=text(row.image_url), catalog=text(row.catalog_image_url);
  if(!image)out.push('missing_image');
  if(!image&&catalog)out.push('catalog_image_candidate');
  if(image&&catalog&&canonicalR2Key(image)!==canonicalR2Key(catalog))out.push('authority_drift');
  if(imageSourceStatus(image)==='external_reference')out.push('external_source');
  return out;
}

async function summary(db){
  // Build 184 quota hardening: pre-aggregate Product image facts and Tool/Supply
  // catalog references. A summary must never rescan Inventory/catalog once per row.
  const [p,i]=await Promise.all([
    db.prepare(`
      WITH active_products AS (
        SELECT product_id,featured_image_url
        FROM products
        WHERE LOWER(TRIM(COALESCE(status,'draft'))) NOT IN ('archived','deleted')
      ),
      role_by_image AS (
        SELECT product_image_id,MAX(CASE WHEN TRIM(COALESCE(image_role,''))<>'' THEN 1 ELSE 0 END) AS has_role
        FROM product_image_annotations GROUP BY product_image_id
      ),
      image_stats AS (
        SELECT pi.product_id,COUNT(*) AS image_count,
          SUM(CASE WHEN LENGTH(TRIM(COALESCE(pi.alt_text,'')))<12 THEN 1 ELSE 0 END) AS alt_attention,
          SUM(CASE WHEN COALESCE(rbi.has_role,0)=0 THEN 1 ELSE 0 END) AS role_attention,
          SUM(CASE WHEN TRIM(COALESCE(pi.image_url,''))<>'' AND LOWER(TRIM(pi.image_url)) NOT LIKE 'https://assets.devilndove.com/%' THEN 1 ELSE 0 END) AS image_source_attention
        FROM product_images pi
        LEFT JOIN role_by_image rbi ON rbi.product_image_id=pi.product_image_id
        GROUP BY pi.product_id
      ),
      featured_match AS (
        SELECT ap.product_id,MAX(CASE WHEN TRIM(COALESCE(pi.image_url,''))=TRIM(COALESCE(ap.featured_image_url,'')) THEN 1 ELSE 0 END) AS has_featured
        FROM active_products ap
        LEFT JOIN product_images pi ON pi.product_id=ap.product_id
        GROUP BY ap.product_id
      )
      SELECT COUNT(*) active_products,
        SUM(CASE WHEN TRIM(COALESCE(ap.featured_image_url,''))='' THEN 1 ELSE 0 END) missing_featured,
        SUM(CASE WHEN COALESCE(ins.image_count,0)=0 THEN 1 ELSE 0 END) no_gallery,
        SUM(CASE WHEN COALESCE(ins.image_count,0)>0 AND COALESCE(ins.image_count,0)<3 THEN 1 ELSE 0 END) shallow_gallery,
        SUM(CASE WHEN COALESCE(ins.alt_attention,0)>0 THEN 1 ELSE 0 END) products_with_alt_attention,
        SUM(CASE WHEN COALESCE(ins.role_attention,0)>0 THEN 1 ELSE 0 END) products_with_role_attention,
        SUM(CASE WHEN TRIM(COALESCE(ap.featured_image_url,''))<>'' AND COALESCE(fm.has_featured,0)=0 THEN 1 ELSE 0 END) featured_not_in_gallery,
        SUM(CASE WHEN COALESCE(ins.image_source_attention,0)>0 THEN 1 ELSE 0 END) products_with_external_image_source
      FROM active_products ap
      LEFT JOIN image_stats ins ON ins.product_id=ap.product_id
      LEFT JOIN featured_match fm ON fm.product_id=ap.product_id
    `).first(),
    db.prepare(`
      WITH active_inventory AS (
        SELECT sii.site_item_inventory_id,
               LOWER(TRIM(COALESCE(sii.source_type,''))) AS item_kind,
               LOWER(TRIM(COALESCE(sii.external_key,''))) AS external_key_norm,
               sii.image_url
        FROM site_item_inventory sii
        WHERE COALESCE(sii.is_active,1)=1
          AND LOWER(TRIM(COALESCE(sii.source_type,''))) IN ('tool','supply')
      ),
      catalog_ranked AS (
        SELECT catalog_item_id,LOWER(TRIM(COALESCE(item_kind,''))) AS item_kind,
               LOWER(TRIM(COALESCE(source_key,''))) AS source_key_norm,image_url,
               ROW_NUMBER() OVER (
                 PARTITION BY LOWER(TRIM(COALESCE(item_kind,''))),LOWER(TRIM(COALESCE(source_key,'')))
                 ORDER BY catalog_item_id DESC
               ) AS rn
        FROM catalog_items
        WHERE LOWER(TRIM(COALESCE(item_kind,''))) IN ('tool','supply')
          AND COALESCE(status,'active')<>'archived'
      )
      SELECT COUNT(*) active_inventory,
        SUM(CASE WHEN TRIM(COALESCE(ai.image_url,''))='' THEN 1 ELSE 0 END) blank_images,
        SUM(CASE WHEN TRIM(COALESCE(ai.image_url,''))='' AND TRIM(COALESCE(cr.image_url,''))<>'' THEN 1 ELSE 0 END) catalog_image_candidates,
        SUM(CASE WHEN TRIM(COALESCE(ai.image_url,''))<>'' AND TRIM(COALESCE(cr.image_url,''))<>'' AND TRIM(ai.image_url)<>TRIM(cr.image_url) THEN 1 ELSE 0 END) authority_drift,
        SUM(CASE WHEN TRIM(COALESCE(ai.image_url,''))<>'' AND LOWER(TRIM(ai.image_url)) NOT LIKE 'https://assets.devilndove.com/%' THEN 1 ELSE 0 END) external_image_sources
      FROM active_inventory ai
      LEFT JOIN catalog_ranked cr ON cr.rn=1 AND cr.item_kind=ai.item_kind AND cr.source_key_norm=ai.external_key_norm
    `).first(),
  ]);
  return {
    products:{
      active_products:n(p?.active_products),missing_featured:n(p?.missing_featured),no_gallery:n(p?.no_gallery),
      shallow_gallery:n(p?.shallow_gallery),products_with_alt_attention:n(p?.products_with_alt_attention),
      products_with_role_attention:n(p?.products_with_role_attention),featured_not_in_gallery:n(p?.featured_not_in_gallery),
      products_with_external_image_source:n(p?.products_with_external_image_source),
    },
    inventory:{
      active_inventory:n(i?.active_inventory),blank_images:n(i?.blank_images),catalog_image_candidates:n(i?.catalog_image_candidates),
      authority_drift:n(i?.authority_drift),external_image_sources:n(i?.external_image_sources),
    },
  };
}

async function productRows(db,q,limit,issue='all'){
  const like=`%${String(q||'').toLowerCase()}%`;
  const safeIssue=['all','alt_text'].includes(issue)?issue:'all';
  const result=await db.prepare(`
    WITH role_by_image AS (
      SELECT product_image_id,MAX(CASE WHEN TRIM(COALESCE(image_role,''))<>'' THEN 1 ELSE 0 END) AS has_role
      FROM product_image_annotations GROUP BY product_image_id
    ),
    image_stats AS (
      SELECT pi.product_id,COUNT(*) image_count,
        SUM(CASE WHEN LENGTH(TRIM(COALESCE(pi.alt_text,'')))<12 THEN 1 ELSE 0 END) alt_attention,
        SUM(CASE WHEN COALESCE(rbi.has_role,0)=0 THEN 1 ELSE 0 END) role_attention,
        SUM(CASE WHEN TRIM(COALESCE(pi.image_url,''))<>'' AND LOWER(TRIM(pi.image_url)) NOT LIKE 'https://assets.devilndove.com/%' THEN 1 ELSE 0 END) image_source_attention
      FROM product_images pi
      LEFT JOIN role_by_image rbi ON rbi.product_image_id=pi.product_image_id
      GROUP BY pi.product_id
    ),
    base AS (
      SELECT p.product_id,p.name,p.slug,p.sku,p.status,p.review_status,p.featured_image_url,p.updated_at,
        COALESCE(ins.image_count,0) image_count,COALESCE(ins.alt_attention,0) alt_attention,
        COALESCE(ins.role_attention,0) role_attention,COALESCE(ins.image_source_attention,0) image_source_attention,
        CASE WHEN TRIM(COALESCE(p.featured_image_url,''))<>'' AND NOT EXISTS(
          SELECT 1 FROM product_images pi WHERE pi.product_id=p.product_id AND TRIM(COALESCE(pi.image_url,''))=TRIM(COALESCE(p.featured_image_url,''))
        ) THEN 1 ELSE 0 END featured_not_in_gallery
      FROM products p
      LEFT JOIN image_stats ins ON ins.product_id=p.product_id
      WHERE LOWER(TRIM(COALESCE(p.status,'draft'))) NOT IN ('archived','deleted')
    )
    SELECT * FROM base
    WHERE (?='' OR LOWER(COALESCE(name,'')) LIKE ? OR LOWER(COALESCE(sku,'')) LIKE ? OR LOWER(COALESCE(slug,'')) LIKE ? OR CAST(product_id AS TEXT)=?)
      AND (TRIM(COALESCE(featured_image_url,''))='' OR image_count<3 OR alt_attention>0 OR role_attention>0 OR featured_not_in_gallery>0 OR image_source_attention>0)
      AND (?='all' OR (?='alt_text' AND alt_attention>0))
    ORDER BY
      (CASE WHEN image_count=0 THEN 8 ELSE 0 END
       +CASE WHEN TRIM(COALESCE(featured_image_url,''))='' THEN 6 ELSE 0 END
       +alt_attention*2+role_attention*2+featured_not_in_gallery*4+image_source_attention*3) DESC,
      LOWER(COALESCE(name,'')),product_id
    LIMIT ?
  `).bind(q,like,like,like,q,safeIssue,safeIssue,limit).all();
  const products=rows(result).map(r=>({...r,image_count:n(r.image_count),alt_attention:n(r.alt_attention),role_attention:n(r.role_attention),featured_not_in_gallery:n(r.featured_not_in_gallery),image_source_attention:n(r.image_source_attention),issues:productIssueCodes(r),images:[]}));
  const ids=products.map(r=>n(r.product_id)).filter(Boolean);
  if(!ids.length)return products;
  const marks=ids.map(()=>'?').join(',');
  const images=rows(await db.prepare(`
    WITH annotation_ranked AS (
      SELECT product_image_id,image_role,public_use_status,updated_at,
             ROW_NUMBER() OVER (PARTITION BY product_image_id ORDER BY updated_at DESC,product_image_annotation_id DESC) rn
      FROM product_image_annotations
      WHERE product_image_id IS NOT NULL
    ),
    approved_role_counts AS (
      SELECT pi2.product_id,LOWER(TRIM(COALESCE(ar2.image_role,''))) image_role_norm,COUNT(*) approved_same_role_count
      FROM product_images pi2
      JOIN annotation_ranked ar2 ON ar2.product_image_id=pi2.product_image_id AND ar2.rn=1
      WHERE LOWER(TRIM(COALESCE(ar2.public_use_status,''))) IN ('product_page_ok','all_public_ok')
        AND TRIM(COALESCE(ar2.image_role,''))<>''
      GROUP BY pi2.product_id,LOWER(TRIM(COALESCE(ar2.image_role,'')))
    )
    SELECT pi.product_image_id,pi.product_id,pi.image_url,pi.alt_text,pi.sort_order,
      ar.image_role,ar.public_use_status,ar.updated_at annotation_updated_at,
      COALESCE(arc.approved_same_role_count,0) approved_same_role_count,
      (SELECT ma.object_key FROM media_assets ma
        WHERE ma.product_id=pi.product_id AND ma.deleted_at IS NULL
          AND (TRIM(COALESCE(ma.public_url,''))=TRIM(COALESCE(pi.image_url,'')) OR TRIM(COALESCE(ma.object_key,''))=TRIM(REPLACE(COALESCE(pi.image_url,''),'https://assets.devilndove.com/','')))
        ORDER BY ma.media_asset_id DESC LIMIT 1) object_key
    FROM product_images pi
    LEFT JOIN annotation_ranked ar ON ar.product_image_id=pi.product_image_id AND ar.rn=1
    LEFT JOIN approved_role_counts arc ON arc.product_id=pi.product_id AND arc.image_role_norm=LOWER(TRIM(COALESCE(ar.image_role,'')))
    WHERE pi.product_id IN (${marks})
    ORDER BY pi.product_id,COALESCE(pi.sort_order,0),pi.product_image_id
    LIMIT ?
  `).bind(...ids,MAX_IMAGE_ROWS).all());
  const byId=new Map(products.map(r=>[n(r.product_id),r]));
  for(const image of images){
    const target=byId.get(n(image.product_id)); if(!target)continue;
    const key=canonicalR2Key(image.image_url,image.object_key);
    const normalized={...image,approved_same_role_count:n(image.approved_same_role_count)};
    normalized.role_evidence_status=roleEvidenceStatus(normalized);
    normalized.issues=imageIssues(normalized);
    normalized.image_source_status=imageSourceStatus(normalized.image_url,normalized.object_key);
    normalized.r2_key=key||null;
    normalized.evidence_token=mediaEvidenceToken('product_image',normalized);
    target.images.push(normalized);
  }
  return products;
}

async function inventoryRows(db,q,kind,limit,issue='all'){
  const like=`%${String(q||'').toLowerCase()}%`;
  const safeIssue=['all','missing_image','external_source','authority_drift'].includes(issue)?issue:'all';
  const result=await db.prepare(`
    WITH active_inventory AS (
      SELECT sii.site_item_inventory_id,LOWER(TRIM(COALESCE(sii.source_type,''))) item_kind,
        LOWER(TRIM(COALESCE(sii.external_key,''))) external_key_norm,
        sii.external_key,sii.item_name,sii.category,sii.image_url,sii.supplier_name,sii.source_url,sii.amazon_url,sii.updated_at
      FROM site_item_inventory sii
      WHERE COALESCE(sii.is_active,1)=1
        AND LOWER(TRIM(COALESCE(sii.source_type,''))) IN ('tool','supply')
    ),
    catalog_ranked AS (
      SELECT catalog_item_id,LOWER(TRIM(COALESCE(item_kind,''))) item_kind,
        LOWER(TRIM(COALESCE(source_key,''))) source_key_norm,image_url,
        ROW_NUMBER() OVER (
          PARTITION BY LOWER(TRIM(COALESCE(item_kind,''))),LOWER(TRIM(COALESCE(source_key,'')))
          ORDER BY catalog_item_id DESC
        ) rn
      FROM catalog_items
      WHERE LOWER(TRIM(COALESCE(item_kind,''))) IN ('tool','supply')
        AND COALESCE(status,'active')<>'archived'
    )
    SELECT ai.site_item_inventory_id,ai.item_kind,ai.external_key,ai.item_name,ai.category,ai.image_url,
      ai.supplier_name,ai.source_url,ai.amazon_url,ai.updated_at,cr.catalog_item_id,cr.image_url catalog_image_url
    FROM active_inventory ai
    LEFT JOIN catalog_ranked cr ON cr.rn=1 AND cr.item_kind=ai.item_kind AND cr.source_key_norm=ai.external_key_norm
    WHERE (?='' OR LOWER(COALESCE(ai.item_name,'')) LIKE ? OR LOWER(COALESCE(ai.external_key,'')) LIKE ? OR LOWER(COALESCE(ai.category,'')) LIKE ? OR LOWER(COALESCE(ai.supplier_name,'')) LIKE ?)
      AND (?='' OR ai.item_kind=?)
      AND (
        TRIM(COALESCE(ai.image_url,''))=''
        OR (TRIM(COALESCE(ai.image_url,''))<>'' AND LOWER(TRIM(ai.image_url)) NOT LIKE 'https://assets.devilndove.com/%')
        OR (TRIM(COALESCE(ai.image_url,''))<>'' AND TRIM(COALESCE(cr.image_url,''))<>'' AND TRIM(ai.image_url)<>TRIM(cr.image_url))
      )
      AND (
        ?='all'
        OR (?='missing_image' AND TRIM(COALESCE(ai.image_url,''))='')
        OR (?='external_source' AND TRIM(COALESCE(ai.image_url,''))<>'' AND LOWER(TRIM(ai.image_url)) NOT LIKE 'https://assets.devilndove.com/%')
        OR (?='authority_drift' AND TRIM(COALESCE(ai.image_url,''))<>'' AND TRIM(COALESCE(cr.image_url,''))<>'' AND TRIM(ai.image_url)<>TRIM(cr.image_url))
      )
    ORDER BY
      CASE WHEN TRIM(COALESCE(ai.image_url,''))='' THEN 0 ELSE 1 END,
      CASE WHEN TRIM(COALESCE(cr.image_url,''))<>'' THEN 0 ELSE 1 END,
      LOWER(COALESCE(ai.item_name,'')),ai.site_item_inventory_id
    LIMIT ?
  `).bind(q,like,like,like,like,kind,kind,safeIssue,safeIssue,safeIssue,safeIssue,limit).all();
  return rows(result).map(r=>{
    const normalized={...r,issues:inventoryIssues(r),image_source_status:imageSourceStatus(r.image_url),r2_key:canonicalR2Key(r.image_url)||null,catalog_r2_key:canonicalR2Key(r.catalog_image_url)||null};
    normalized.evidence_token=mediaEvidenceToken('inventory',normalized);
    return normalized;
  });
}
async function r2Evidence(db,env,scope,id,expectedToken=''){
  let row=null,key='',metadataIssues=[],repairHref='',roleState=null;
  if(scope==='product_image'){
    row=await db.prepare(`
      WITH annotation_ranked AS (
        SELECT product_image_id,image_role,public_use_status,updated_at,
               ROW_NUMBER() OVER (PARTITION BY product_image_id ORDER BY updated_at DESC,product_image_annotation_id DESC) rn
        FROM product_image_annotations WHERE product_image_id IS NOT NULL
      )
      SELECT pi.product_image_id,pi.product_id,pi.image_url,pi.alt_text,p.name product_name,
        ar.image_role,ar.public_use_status,ar.updated_at annotation_updated_at,
        (SELECT COUNT(*)
         FROM product_images pi2
         JOIN annotation_ranked ar2 ON ar2.product_image_id=pi2.product_image_id AND ar2.rn=1
         WHERE pi2.product_id=pi.product_id
           AND LOWER(TRIM(COALESCE(ar2.public_use_status,''))) IN ('product_page_ok','all_public_ok')
           AND TRIM(COALESCE(ar.image_role,''))<>''
           AND LOWER(TRIM(COALESCE(ar2.image_role,'')))=LOWER(TRIM(COALESCE(ar.image_role,'')))) approved_same_role_count,
        (SELECT ma.object_key FROM media_assets ma
         WHERE ma.product_id=pi.product_id AND ma.deleted_at IS NULL
           AND (TRIM(COALESCE(ma.public_url,''))=TRIM(COALESCE(pi.image_url,'')) OR TRIM(COALESCE(ma.object_key,''))=TRIM(REPLACE(COALESCE(pi.image_url,''),'https://assets.devilndove.com/','')))
         ORDER BY ma.media_asset_id DESC LIMIT 1) object_key
      FROM product_images pi
      JOIN products p ON p.product_id=pi.product_id
      LEFT JOIN annotation_ranked ar ON ar.product_image_id=pi.product_image_id AND ar.rn=1
      WHERE pi.product_image_id=? LIMIT 1
    `).bind(id).first();
    if(!row)return {supported:false,state:'image_not_found',exists:null};
    row.approved_same_role_count=n(row.approved_same_role_count);
    roleState=roleEvidenceStatus(row);
    metadataIssues=imageIssues(row);
    key=canonicalR2Key(row.image_url,row.object_key);
    repairHref='/admin/catalog-media/?product_id='+n(row.product_id)+'&repair_from=build190';
  }else if(scope==='inventory'){
    row=await db.prepare(`
      WITH catalog_ranked AS (
        SELECT catalog_item_id,LOWER(TRIM(COALESCE(item_kind,''))) item_kind,
               LOWER(TRIM(COALESCE(source_key,''))) source_key_norm,image_url,
               ROW_NUMBER() OVER (
                 PARTITION BY LOWER(TRIM(COALESCE(item_kind,''))),LOWER(TRIM(COALESCE(source_key,'')))
                 ORDER BY catalog_item_id DESC
               ) rn
        FROM catalog_items
        WHERE LOWER(TRIM(COALESCE(item_kind,''))) IN ('tool','supply') AND COALESCE(status,'active')<>'archived'
      )
      SELECT sii.site_item_inventory_id,LOWER(TRIM(COALESCE(sii.source_type,''))) item_kind,
             sii.external_key,sii.item_name,sii.image_url,sii.updated_at,cr.image_url catalog_image_url
      FROM site_item_inventory sii
      LEFT JOIN catalog_ranked cr ON cr.rn=1
        AND cr.item_kind=LOWER(TRIM(COALESCE(sii.source_type,'')))
        AND cr.source_key_norm=LOWER(TRIM(COALESCE(sii.external_key,'')))
      WHERE sii.site_item_inventory_id=? LIMIT 1
    `).bind(id).first();
    if(!row)return {supported:false,state:'inventory_item_not_found',exists:null};
    metadataIssues=inventoryIssues(row);
    key=canonicalR2Key(row.image_url);
    repairHref='/admin/inventory-operations/?q='+encodeURIComponent(text(row.external_key)||text(row.item_name)||String(id))+'&repair_from=build190#siteInventoryAdminMount';
  }else return {supported:false,state:'unsupported_scope',exists:null};

  const currentToken=mediaEvidenceToken(scope,row);
  const staleTarget=Boolean(text(expectedToken)&&text(expectedToken)!==currentToken);
  const bucket=env.PRODUCT_MEDIA_BUCKET||env.MEDIA_BUCKET||env.R2_PRODUCT_MEDIA;
  let objectState='not_mappable',head=null;
  if(!key)objectState=text(row.image_url)?'external_or_unmapped_source':'missing_image_url';
  else if(!bucket||typeof bucket.head!=='function')objectState='bucket_binding_unavailable';
  else{
    head=await bucket.head(key);
    objectState=head?'present':'missing';
  }
  return {
    supported:Boolean(key&&bucket&&typeof bucket.head==='function'),
    state:objectState,
    object_state:objectState,
    exists:head?true:(objectState==='missing'?false:null),
    r2_key:key||null,
    row,
    metadata_issues:metadataIssues,
    metadata_state:metadataIssues.length?'attention':'complete',
    role_evidence_status:roleState,
    evidence_classification:evidenceClassification(metadataIssues,objectState),
    expected_token:text(expectedToken)||null,
    current_token:currentToken,
    stale_target:staleTarget,
    safe_to_rely:!staleTarget,
    mutation_authority:scope==='product_image'?'Product Media & Image Editor':'Inventory Operations',
    repair_href:repairHref,
    r2_execution:key?'single_object_head':'none',
    automatic_reassignment:false,
    r2_mutation:false,
    object:head?{size:n(head.size),etag:text(head.etag),uploaded:head.uploaded||null,content_type:text(head.httpMetadata?.contentType||head.customMetadata?.contentType||'')}:null,
  };
}

export async function onRequestGet({request,env}){
  const admin=await getAdminUserFromRequest(request,env);
  if(!admin)return json({ok:false,error:'Admin access required.'},401);
  const db=getDb(env); if(!db)return json({ok:false,error:'Database binding is not configured.'},500);
  const url=new URL(request.url),mode=text(url.searchParams.get('mode')||'summary').toLowerCase();
  const q=text(url.searchParams.get('q')).slice(0,120),kindRaw=text(url.searchParams.get('kind')).toLowerCase();
  const kind=['tool','supply'].includes(kindRaw)?kindRaw:'';
  const productIssueRaw=text(url.searchParams.get('product_issue')||'all').toLowerCase();
  const inventoryIssueRaw=text(url.searchParams.get('inventory_issue')||'all').toLowerCase();
  const productIssue=['all','alt_text'].includes(productIssueRaw)?productIssueRaw:'all';
  const inventoryIssue=['all','missing_image','external_source','authority_drift'].includes(inventoryIssueRaw)?inventoryIssueRaw:'all';
  const limit=Math.max(1,Math.min(MAX_ROWS,Number(url.searchParams.get('limit')||MAX_ROWS)));
  try{
    if(mode==='summary')return json({ok:true,mode,authority:'live_d1_image_evidence',r2_execution:'none',mutation_capability:'none',summary:await summary(db)});
    if(mode==='products')return json({ok:true,mode,q,limit,product_issue:productIssue,authority:'live_d1_image_evidence',r2_execution:'none',mutation_capability:'none',products:await productRows(db,q,limit,productIssue)});
    if(mode==='inventory')return json({ok:true,mode,q,kind,limit,inventory_issue:inventoryIssue,authority:'live_d1_image_evidence',r2_execution:'none',mutation_capability:'none',inventory:await inventoryRows(db,q,kind,limit,inventoryIssue)});
    if(mode==='r2_evidence'){
      const scope=text(url.searchParams.get('scope')).toLowerCase(),id=Number(url.searchParams.get('id')||0);
      if(!Number.isInteger(id)||id<=0)return json({ok:false,error:'A positive image/inventory id is required.'},400);
      return json({ok:true,mode,scope,id,authority:'bound_product_media_bucket',r2_execution:'single_object_head',mutation_capability:'none',evidence:await r2Evidence(db,env,scope,id,url.searchParams.get('expected_token'))},200,'admin_media_evidence_recheck_v190',1);
    }
    return json({ok:false,error:'Unsupported image-repair mode.'},400);
  }catch(error){
    return json({ok:false,mode,mutation_capability:'none',error:'Catalog image repair evidence could not be loaded.',detail:text(error?.message||error)},503);
  }
}

export { canonicalR2Key, imageSourceStatus };
