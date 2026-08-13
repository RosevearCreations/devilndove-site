import { getDb, jsonResponse, normalizeText } from "./_lib/adminAudit.js";

function json(data,status=200,headers={}){return jsonResponse(data,status,headers);}
function rows(result){return Array.isArray(result?.results)?result.results:[];}
function withVersion(url,updatedAt){const value=String(url||'');if(!value)return value;const stamp=String(updatedAt||'').replace(/[^0-9]/g,'').slice(0,14);return stamp?`${value}${value.includes('?')?'&':'?'}v=${stamp}`:value;}
function cleanPath(value){let path=normalizeText(value||'/');try{if(/^https?:\/\//i.test(path))path=new URL(path).pathname;}catch{}if(!path.startsWith('/'))path=`/${path}`;path=path.replace(/\/{2,}/g,'/');if(path.length>1&&path.endsWith('/'))path=path.slice(0,-1);return path.slice(0,500)||'/';}

export async function onRequestGet(context){
  const db=getDb(context.env); if(!db)return json({ok:true,page_path:'/',images:[],content:[]},200,{"Cache-Control":"public, max-age=30"});
  const url=new URL(context.request.url); const path=cleanPath(url.searchParams.get('path')||'/');
  try{
    const result=await db.prepare(`
      SELECT s.media_content_slot_id,s.slot_key,s.slot_label,s.slot_type,s.target_selector,s.target_attribute,
             ma.media_asset_id,ma.public_url,ma.updated_at AS media_updated_at,mm.alt_text,mm.image_title,mm.caption,mm.decorative,mm.focal_x,mm.focal_y,mm.archived_at,
             cb.published_text,cb.published
      FROM media_content_slots s
      LEFT JOIN media_content_assignments a ON a.media_content_slot_id=s.media_content_slot_id AND a.active=1
      LEFT JOIN media_assets ma ON ma.media_asset_id=a.media_asset_id AND ma.deleted_at IS NULL
      LEFT JOIN managed_media_metadata mm ON mm.media_asset_id=ma.media_asset_id
      LEFT JOIN managed_content_blocks cb ON cb.media_content_slot_id=s.media_content_slot_id
      WHERE s.page_path IN ('@site', ?) AND s.is_active=1
      ORDER BY CASE WHEN s.page_path='@site' THEN 0 ELSE 1 END,s.media_content_slot_id
      LIMIT 350
    `).bind(path).all();
    const images=[]; const content=[];
    for(const row of rows(result)){
      if((row.slot_type==='image'||row.slot_type==='background')&&row.media_asset_id&&row.public_url&&!row.archived_at){
        images.push({slot_key:row.slot_key,slot_type:row.slot_type,target_selector:row.target_selector,target_attribute:row.target_attribute,public_url:withVersion(row.public_url,row.media_updated_at),alt_text:row.alt_text||'',image_title:row.image_title||'',caption:row.caption||'',decorative:Number(row.decorative||0)===1,focal_x:row.focal_x==null?0.5:Number(row.focal_x),focal_y:row.focal_y==null?0.5:Number(row.focal_y)});
      }
      if(row.slot_type==='text'&&Number(row.published||0)===1&&row.published_text!=null){content.push({slot_key:row.slot_key,target_selector:row.target_selector,text:String(row.published_text)});}
    }
    return json({ok:true,page_path:path,images,content},200,{"Cache-Control":"public, max-age=30, s-maxage=60","Vary":"Accept-Encoding"});
  }catch{
    // Pre-migration deployments must not break public pages.
    return json({ok:true,page_path:path,images:[],content:[],studio_ready:false},200,{"Cache-Control":"public, max-age=15"});
  }
}
