/* Build 559 — one bounded, admin-only, read-only destination summary.
 * D1 primary is the local authority. No token, arbitrary remote ID or remote
 * publication state is inferred; no provider request is made. */
import {getDb,jsonResponse} from '../_lib/adminAudit.js';
import {verifiedAdminFromModule} from '../_lib/verifiedAdmin398.mjs';
import {linkedReceipt506} from './product-etsy-existing-draft.js';
import {destinationProjection559} from '../../../public/js/product-destinations-559.mjs';

const reply=(value,status=200)=>jsonResponse({ok:status<400,build:559,provider_contacted:false,
  publication_performed:false,automatic_provider_action:false,...value},status,{'Cache-Control':'no-store'});
const valid=x=>/^[1-9]\d{0,14}$/.test(String(x??''))&&Number.isSafeInteger(Number(x));
const details=row=>{try{return JSON.parse(row?.details_json||'{}')}catch{return {}}};

export async function onRequestGet(c){
  if(!verifiedAdminFromModule(c))return reply({error:'Active administrator access required.'},401);
  const raw=getDb(c.env);if(!raw)return reply({error:'Saved Product database unavailable.'},503);
  const id=new URL(c.request.url).searchParams.get('product_id');
  if(!valid(id))return reply({error:'Choose one saved Product first.'},400);
  const db=typeof raw.withSession==='function'?raw.withSession('first-primary'):raw;
  try{
    const [product,drafts,connectionRows,intent]=await Promise.all([
      db.prepare('SELECT product_id,name,sku,status FROM products WHERE product_id=? LIMIT 1').bind(Number(id)).first(),
      db.prepare("SELECT id,product_id,external_reference,status FROM marketplace_syndication_drafts WHERE channel_key='etsy' AND product_id=? AND external_reference IS NOT NULL ORDER BY id DESC LIMIT 3")
        .bind(Number(id)).all(),
      db.prepare("SELECT provider_key,connection_status,access_expires_at FROM oauth_provider_connections WHERE provider_key IN ('etsy','facebook','instagram','tiktok','x','pinterest','youtube') ORDER BY provider_key LIMIT 10").all(),
      db.prepare("SELECT details_json FROM admin_action_audit WHERE action_type='product_channel_intent_405' AND target_type='product' AND target_key=? ORDER BY admin_action_audit_id DESC LIMIT 1")
        .bind(String(id)).first()
    ]);
    if(!product)return reply({error:'Saved Product does not exist.'},404);
    const claims=Array.isArray(drafts?.results)?drafts.results:[];
    const expected=Number(id)===54?'4601705477':null;
    const candidate=claims.length===1?String(claims[0].external_reference):
      claims.length===0?expected:null;
    const proof=candidate?await linkedReceipt506(raw,Number(id),candidate):null;
    const conflict=claims.length>1||proof?.claim_state==='another_product'||!!(expected&&claims.some(row=>String(row.external_reference)!==expected))||
      !!(expected&&proof?.confirmed&&String(proof.listing_id)!==expected);
    const local=destinationProjection559({product,etsy:{listing_id:candidate,
      saved_link_readback_confirmed:proof?.confirmed===true,receipt_id:proof?.receipt_id,
      conflict,ambiguous:claims.length>1||proof?.claim_state==='multiple_local_claims'},
      connections:connectionRows?.results||[],intent:details(intent)});
    return reply({...local,source:'saved_product_and_unique_d1_primary_receipts',
      note:'A linked Etsy ID is local evidence only. Live draft state, photo inventory, account authority and any publication remain independently unverified.'});
  }catch{return reply({error:'Destination records could not be verified. Nothing was sent or changed.'},503);}
}
