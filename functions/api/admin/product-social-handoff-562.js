/* Build 562 — authenticated GET of saved product and approved originals; no provider requests. */
import {getDb,jsonResponse} from '../_lib/adminAudit.js';
import {verifiedAdminFromModule} from '../_lib/verifiedAdmin398.mjs';
import {readCanonicalDistributionGallery} from '../_lib/canonicalDistributionGallery436.mjs';
import {projectSocialHandoff562} from '../_lib/productSocialHandoff562.mjs';
const reply=(data,status=200)=>jsonResponse({ok:status<400,build:562,provider_contacted:false,publication_performed:false,...data},status,{'Cache-Control':'no-store'});
export async function onRequestGet(c){
  if(!verifiedAdminFromModule(c))return reply({error:'Active administrator access required.'},401);
  const raw=getDb(c.env);if(!raw)return reply({error:'Saved Product database unavailable.'},503);
  const id=new URL(c.request.url).searchParams.get('product_id');
  if(!/^[1-9]\d{0,14}$/.test(String(id??''))||!Number.isSafeInteger(Number(id)))return reply({error:'Choose a saved Product.'},400);
  const db=typeof raw.withSession==='function'?raw.withSession('first-primary'):raw;
  try{
    const [product,connections,gallery]=await Promise.all([
      db.prepare('SELECT product_id,name,short_description,description,price_cents,currency,status FROM products WHERE product_id=? LIMIT 1').bind(Number(id)).first(),
      db.prepare("SELECT provider_key,connection_status,access_expires_at FROM oauth_provider_connections WHERE provider_key IN ('x','pinterest')").all()
        .then(r=>({rows:r?.results||[],unavailable:false}),()=>({rows:[],unavailable:true})),
      readCanonicalDistributionGallery(db,Number(id))
    ]);
    if(!product)return reply({error:'Saved Product not found.'},404);
    return reply({...projectSocialHandoff562({product,images:gallery.images,annotationUnavailable:gallery.annotation_unavailable,
      connections:connections.rows,connectionUnavailable:connections.unavailable}),source:'saved_product_primary_d1_and_canonical_approved_gallery'});
  }catch{return reply({error:'Social handoff evidence unavailable; no provider action occurred.'},503);}
}
