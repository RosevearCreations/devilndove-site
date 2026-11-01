/* Build 563: authenticated, bounded local Product channel receipt/attempt readback. */
import {getDb,jsonResponse} from '../_lib/adminAudit.js';
import {verifiedAdminFromModule} from '../_lib/verifiedAdmin398.mjs';
import {projectProductRecovery563} from '../_lib/productChannelRecovery563.mjs';
const reply=(value,status=200)=>jsonResponse({ok:status<400,build:563,provider_contacted:false,
  publication_performed:false,automatic_retry:false,...value},status,{'Cache-Control':'no-store'});
export async function onRequestGet(c){
  if(!verifiedAdminFromModule(c))return reply({error:'Active administrator access required.'},401);
  const raw=getDb(c.env);if(!raw)return reply({error:'Saved Product database unavailable.'},503);
  const value=new URL(c.request.url).searchParams.get('product_id');
  if(!/^[1-9]\d{0,14}$/.test(String(value??''))||!Number.isSafeInteger(Number(value)))return reply({error:'Choose a saved Product.'},400);
  const db=typeof raw.withSession==='function'?raw.withSession('first-primary'):raw;
  try{
    const product=await db.prepare('SELECT product_id,name,status FROM products WHERE product_id=? LIMIT 1').bind(Number(value)).first();
    if(!product)return reply({error:'Saved Product not found.'},404);
    const read=async(sql,bindings=[])=>{
      try{return {rows:(await db.prepare(sql).bind(...bindings).all())?.results||[],unavailable:false};}
      catch{return {rows:[],unavailable:true};}
    };
    const [drafts,queue,attempts]=await Promise.all([
      read('SELECT id,channel_key,external_reference,status FROM marketplace_syndication_drafts WHERE product_id=? ORDER BY updated_at DESC LIMIT 24',[String(value)]),
      read("SELECT social_post_queue_id,source_type,source_id,target_platforms_json,post_status,do_not_repost FROM social_post_queue WHERE source_type='product' AND source_id=? ORDER BY social_post_queue_id DESC LIMIT 24",[String(value)]),
      read("SELECT a.social_post_attempt_id,a.social_post_queue_id,a.platform_key,a.attempt_status,a.external_post_id,a.platform_response_id,a.external_post_url,a.published_url,a.attempted_at FROM social_post_attempts a INNER JOIN social_post_queue q ON q.social_post_queue_id=a.social_post_queue_id WHERE q.source_type='product' AND q.source_id=? ORDER BY a.social_post_attempt_id DESC LIMIT 100",[String(value)])
    ]);
    return reply({...projectProductRecovery563({product,drafts:drafts.rows,queue:queue.rows,attempts:attempts.rows,
      draftsUnavailable:drafts.unavailable,queueUnavailable:queue.unavailable,attemptsUnavailable:attempts.unavailable})});
  }catch{return reply({error:'Reconciliation records unavailable. No provider contact or retry occurred.'},503);}
}
