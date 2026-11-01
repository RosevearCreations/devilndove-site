/* Build 561 — explicit admin-only Product TikTok handoff readback; no TikTok API request. */
import {getDb,jsonResponse} from '../_lib/adminAudit.js';
import {verifiedAdminFromModule} from '../_lib/verifiedAdmin398.mjs';
import {readCanonicalDistributionGallery} from '../_lib/canonicalDistributionGallery436.mjs';
import {projectTikTokHandoff561} from '../_lib/productTikTokHandoff561.mjs';

const reply=(data,status=200)=>jsonResponse({ok:status<400,build:561,provider_contacted:false,
  publication_performed:false,automatic_provider_action:false,...data},status,{'Cache-Control':'no-store'});
const valid=id=>/^[1-9]\d{0,14}$/.test(String(id??''))&&Number.isSafeInteger(Number(id));

export async function onRequestGet(c){
  if(!verifiedAdminFromModule(c))return reply({error:'Active administrator access required.'},401);
  const raw=getDb(c.env);if(!raw)return reply({error:'Saved Product database unavailable.'},503);
  const id=new URL(c.request.url).searchParams.get('product_id');
  if(!valid(id))return reply({error:'Choose one saved Product first.'},400);
  const db=typeof raw.withSession==='function'?raw.withSession('first-primary'):raw;
  try{
    const [product,oauth,platforms,gallery]=await Promise.all([
      db.prepare('SELECT product_id,name,short_description,description,price_cents,currency,status FROM products WHERE product_id=? LIMIT 1')
        .bind(Number(id)).first(),
      db.prepare("SELECT provider_key,connection_status,scopes_json,access_expires_at FROM oauth_provider_connections WHERE provider_key='tiktok' LIMIT 1").all()
        .then(result=>({rows:result?.results||[],unavailable:false}),()=>({rows:[],unavailable:true})),
      db.prepare("SELECT platform_key,api_ready FROM social_platform_connections WHERE platform_key='tiktok' LIMIT 1").all()
        .catch(()=>({results:[]})),
      readCanonicalDistributionGallery(db,Number(id))
    ]);
    if(!product)return reply({error:'Saved Product not found.'},404);
    return reply({...projectTikTokHandoff561({product,oauth:oauth.rows,oauthUnavailable:oauth.unavailable,
      platforms:platforms?.results||[],images:gallery.images,annotationUnavailable:gallery.annotation_unavailable}),
      source:'saved_product_primary_d1_and_canonical_approved_gallery',
      note:'This is a local owner-prepared TikTok draft handoff, not a TikTok inbox upload, remote saved draft or publication.'});
  }catch{return reply({error:'TikTok handoff evidence is unavailable. No provider call or draft write occurred.'},503);}
}
