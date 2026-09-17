// Release 467 Build 172 — schema-safe Product image annotation compatibility.
// Read-only schema discovery is bounded to an explicit image action and cached per Worker isolate.
// No request-time DDL, catalog scan, R2 listing, timer, or background retry is allowed here.

let cachedColumns=null;

function clean(value,max=0){const text=String(value??'').trim();return max>0?text.slice(0,max):text;}
function rows(result){return Array.isArray(result?.results)?result.results:[];}
export function rowsRead(result){const n=Number(result?.meta?.rows_read??result?.meta?.rowsRead);return Number.isFinite(n)&&n>=0?n:0;}

export async function annotationColumns(db){
  if(cachedColumns instanceof Set)return {columns:cachedColumns,rows_read:0,cached:true};
  try{
    const result=await db.prepare('PRAGMA table_info(product_image_annotations)').all();
    const columns=new Set(rows(result).map((row)=>clean(row?.name)).filter(Boolean));
    cachedColumns=columns;
    return {columns,rows_read:rowsRead(result),cached:false};
  }catch{
    cachedColumns=new Set();
    return {columns:cachedColumns,rows_read:0,cached:false};
  }
}

export async function readAnnotation(db,imageId){
  const schema=await annotationColumns(db);const columns=schema.columns;
  if(!columns.has('product_image_id'))return {row:null,rows_read:schema.rows_read,available:false};
  const names=['alt_text','image_title','caption','focal_point_x','focal_point_y','annotation_notes','image_role','public_use_status','role_review_notes','width_px','height_px','image_orientation'];
  const select=['product_image_id',...names.filter((name)=>columns.has(name))];
  try{
    const result=await db.prepare(`SELECT ${select.join(',')} FROM product_image_annotations WHERE product_image_id=? ORDER BY product_image_annotation_id DESC LIMIT 1`).bind(imageId).all();
    return {row:rows(result)[0]||null,rows_read:schema.rows_read+rowsRead(result),available:true,columns};
  }catch{
    return {row:null,rows_read:schema.rows_read,available:false,columns};
  }
}

export async function upsertAnnotation(db,payload){
  const schema=await annotationColumns(db);const columns=schema.columns;let measured=schema.rows_read;
  const explicitFields=payload.fields&&typeof payload.fields==='object'?payload.fields:{};
  if(!columns.has('product_image_id'))return {saved_fields:[],unsupported_fields:Object.keys(explicitFields),rows_read:measured,warning:'Product image annotations are unavailable; core Product image changes were still saved.'};

  const stable={
    product_id:Number(payload.product_id||0),
    product_image_id:Number(payload.product_image_id||0),
    image_url:clean(payload.image_url,2048)||null,
    alt_text:explicitFields.alt_text==null?null:clean(explicitFields.alt_text,1000),
    image_title:explicitFields.image_title==null?null:clean(explicitFields.image_title,250),
    caption:explicitFields.caption==null?null:clean(explicitFields.caption,2000),
    focal_point_x:explicitFields.focal_point_x==null?null:Number(explicitFields.focal_point_x),
    focal_point_y:explicitFields.focal_point_y==null?null:Number(explicitFields.focal_point_y),
    annotation_notes:explicitFields.annotation_notes==null?null:clean(explicitFields.annotation_notes,3000),
    image_role:explicitFields.image_role==null?null:clean(explicitFields.image_role,80),
    public_use_status:explicitFields.public_use_status==null?null:clean(explicitFields.public_use_status,80),
    role_review_notes:explicitFields.role_review_notes==null?null:clean(explicitFields.role_review_notes,1500),
    width_px:explicitFields.width_px==null?null:Number(explicitFields.width_px),
    height_px:explicitFields.height_px==null?null:Number(explicitFields.height_px),
    image_orientation:explicitFields.image_orientation==null?null:clean(explicitFields.image_orientation,20),
  };
  const requested=['product_id','image_url',...Object.keys(explicitFields)];
  const candidateNames=[...new Set(requested)].filter((name)=>name!=='product_image_id'&&Object.prototype.hasOwnProperty.call(stable,name)&&columns.has(name));
  const unsupported=Object.keys(explicitFields).filter((name)=>!columns.has(name));

  let existing=null;
  try{
    const found=await db.prepare('SELECT product_image_annotation_id FROM product_image_annotations WHERE product_image_id=? ORDER BY product_image_annotation_id DESC LIMIT 1').bind(stable.product_image_id).all();
    measured+=rowsRead(found);existing=rows(found)[0]||null;
  }catch(error){return {saved_fields:[],unsupported_fields:unsupported,rows_read:measured,warning:String(error?.message||'Annotation lookup failed.')};}

  try{
    if(existing?.product_image_annotation_id){
      const updateNames=candidateNames.filter((name)=>name!=='product_id');
      if(updateNames.length){
        const assignments=updateNames.map((name)=>`${name}=?`);
        if(columns.has('updated_at'))assignments.push('updated_at=CURRENT_TIMESTAMP');
        const result=await db.prepare(`UPDATE product_image_annotations SET ${assignments.join(',')} WHERE product_image_annotation_id=?`).bind(...updateNames.map((name)=>stable[name]),existing.product_image_annotation_id).run();
        measured+=rowsRead(result);
      }
    }else{
      const insertNames=['product_image_id',...candidateNames.filter((name)=>name!=='product_image_id')];
      if(columns.has('updated_at'))insertNames.push('updated_at');
      const valueSql=insertNames.map((name)=>name==='updated_at'?'CURRENT_TIMESTAMP':'?').join(',');
      const bindValues=insertNames.filter((name)=>name!=='updated_at').map((name)=>stable[name]);
      const result=await db.prepare(`INSERT INTO product_image_annotations (${insertNames.join(',')}) VALUES (${valueSql})`).bind(...bindValues).run();
      measured+=rowsRead(result);
    }
    return {saved_fields:candidateNames.filter((name)=>name!=='product_id'),unsupported_fields:unsupported,rows_read:measured,warning:unsupported.length?`Optional annotation fields unavailable in this schema: ${unsupported.join(', ')}.`:''};
  }catch(error){
    return {saved_fields:[],unsupported_fields:unsupported,rows_read:measured,warning:String(error?.message||'Annotation save failed.')};
  }
}
