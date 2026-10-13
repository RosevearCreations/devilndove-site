// Release 467 Build389: return only explicitly approved Product videos, no private-review rows.
import {getDb,jsonResponse} from './_lib/adminAudit.js';
export async function onRequestGet({request,env}){
 const slug=String(new URL(request.url).searchParams.get('slug')||'').trim();
 if(!slug||slug.length>180)return jsonResponse({ok:false,error:'Valid Product slug required'},400);
 const db=getDb(env);if(!db)return jsonResponse({ok:false,error:'Not available'},503);
 try{
  const p=await db.prepare(`SELECT product_id FROM products WHERE slug=? AND status='active' LIMIT 1`).bind(slug).first();
  if(!p)return jsonResponse({ok:true,videos:[],approved_only:true},200);
  const r=await db.prepare(`SELECT product_video_id,video_url,mime_type,video_title,caption,alt_description FROM product_video_attachments
   WHERE product_id=? AND publication_status='product_page_ok' ORDER BY product_video_id DESC LIMIT 3`).bind(p.product_id).all();
  return jsonResponse({ok:true,videos:r?.results||[],approved_only:true});
 }catch{return jsonResponse({ok:false,error:'Video currently unavailable'},503);}
}
