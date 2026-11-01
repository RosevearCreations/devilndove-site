/* Build 560 — explicit read-only owner request for Meta account and approved photo handoff.
 * No provider token material, Graph API call, upload, publication or request-time DDL. */
import {getDb,jsonResponse} from '../_lib/adminAudit.js';
import {verifiedAdminFromModule} from '../_lib/verifiedAdmin398.mjs';
import {readCanonicalDistributionGallery} from '../_lib/canonicalDistributionGallery436.mjs';
import {projectMetaReadiness560} from '../_lib/productMetaReadiness560.mjs';

const reply=(data,status=200)=>jsonResponse({ok:status<400,build:560,provider_contacted:false,
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
      db.prepare('SELECT product_id,name,status FROM products WHERE product_id=? LIMIT 1').bind(Number(id)).first(),
      db.prepare("SELECT provider_key,connection_status,scopes_json,access_expires_at FROM oauth_provider_connections WHERE provider_key='meta' LIMIT 1").all(),
      db.prepare("SELECT platform_key,api_ready FROM social_platform_connections WHERE platform_key IN ('facebook','instagram') LIMIT 2").all()
        .catch(()=>({results:[]})),
      readCanonicalDistributionGallery(db,Number(id))
    ]);
    if(!product)return reply({error:'Saved Product not found.'},404);
    return reply({...projectMetaReadiness560({product,oauth:oauth?.results||[],platforms:platforms?.results||[],
      images:gallery.images,annotationUnavailable:gallery.annotation_unavailable}),
      source:'primary_saved_product_and_approved_canonical_gallery',
      note:'Local OAuth and configuration flags never authorize a Meta post. Complete every external handoff on the chosen provider.'});
  }catch{return reply({error:'Meta readiness evidence is unavailable. No external action was attempted.'},503);}
}
