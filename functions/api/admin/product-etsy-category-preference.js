/* Build 489: durable, local-only Etsy taxonomy preference for one saved Product. */
import {getDb,jsonResponse} from '../_lib/adminAudit.js';
import {verifiedAdminFromModule} from '../_lib/verifiedAdmin398.mjs';
const reply=(data,status=200)=>jsonResponse({ok:status<400,build:489,provider_contacted:false,publication_performed:false,...data},status,{'Cache-Control':'no-store'});
const valid=x=>/^[1-9]\d{0,14}$/.test(String(x??''))&&Number.isSafeInteger(Number(x));
function gate(c){const admin=verifiedAdminFromModule(c),db=getDb(c.env);return !admin?{error:reply({error:'Verified Admin required.'},401)}:!db?{error:reply({error:'D1 unavailable.'},503)}:{admin,db};}
async function saved(db,productId){return db.prepare("SELECT taxonomy_id FROM marketplace_listing_profiles WHERE channel_key='etsy' AND product_id=? LIMIT 1").bind(productId).first();}
export async function onRequestGet(c){const g=gate(c);if(g.error)return g.error;const id=new URL(c.request.url).searchParams.get('product_id');if(!valid(id))return reply({error:'Saved Product ID required.'},400);
 try{const row=await saved(g.db,Number(id));return reply({product_id:Number(id),taxonomy_id:valid(row?.taxonomy_id)?String(row.taxonomy_id):null,saved_locally:!!row});}
 catch{return reply({error:'Saved Etsy category preference unavailable; do not assume the browser selection is persisted.'},503);}}
export async function onRequestPost(c){const g=gate(c);if(g.error)return g.error;if(c.request.headers.get('Origin')!==new URL(c.request.url).origin)return reply({error:'Same-origin required.'},403);
 let b;try{b=await c.request.json()}catch{return reply({error:'Valid JSON required.'},400)}
 if(!valid(b?.product_id)||!valid(b?.taxonomy_id)||b?.confirm_local_only!==true)return reply({error:'Saved Product, selected Etsy category and local-only confirmation required.'},400);
 try{
  const id=Number(b.product_id),taxonomy=String(b.taxonomy_id);
  const product=await g.db.prepare('SELECT product_id FROM products WHERE product_id=? LIMIT 1').bind(id).first();if(!product)return reply({error:'Product not found.'},404);
  await g.db.prepare("INSERT INTO marketplace_listing_profiles(channel_key,product_id,taxonomy_id,created_by_user_id,created_at,updated_at) VALUES ('etsy',?,?,?,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP) ON CONFLICT(channel_key,product_id) DO UPDATE SET taxonomy_id=excluded.taxonomy_id,updated_at=CURRENT_TIMESTAMP")
   .bind(id,taxonomy,Number(g.admin.user_id)||null).run();
  return reply({product_id:id,taxonomy_id:taxonomy,saved_locally:true,message:'Etsy category saved to this Product. No Etsy draft or listing was changed.'});
 }catch{return reply({error:'Etsy category could not be saved locally. Keep the selection visible and try again after checking Product Media/IT health.'},503)}
}
