/* Build 499 — durable per-channel overrides in the existing admin audit ledger.
   No new D1 tables, no provider posts and no hidden keyword rewrites. */
import {getDb,jsonResponse} from '../_lib/adminAudit.js';
import {verifiedAdminFromModule} from '../_lib/verifiedAdmin398.mjs';
import {CHANNELS499,phraseList499,readOverride499,parseOverride499,effectiveEtsyTags499} from '../_lib/channelTagOverrides499.mjs';
const respond=(data,status=200)=>jsonResponse({ok:status<400,build:499,provider_write:false,...data},status,{'Cache-Control':'no-store'});
const valid=x=>/^[1-9]\d{0,14}$/.test(String(x??''))&&Number.isSafeInteger(Number(x));
function gate(c){const admin=verifiedAdminFromModule(c),db=getDb(c.env);return !admin?{error:respond({error:'Verified administrator required.'},401)}:!db?{error:respond({error:'D1 unavailable.'},503)}:{admin,db};}
async function product(db,id){return db.prepare('SELECT p.product_id,ps.keywords FROM products p LEFT JOIN product_seo ps ON ps.product_id=p.product_id WHERE p.product_id=? LIMIT 1').bind(id).first();}
export async function onRequestGet(c){const g=gate(c);if(g.error)return g.error;
 const id=Number(new URL(c.request.url).searchParams.get('product_id'));
 if(!valid(id))return respond({error:'Saved Product required.'},400);
 try{const row=await product(g.db,id);if(!row)return respond({error:'Product not found.'},404);
  const overrides=Object.fromEntries(CHANNELS499.map(channel=>[channel,{mode:'shared',tags:[]}]));
  const changes=await g.db.prepare("SELECT target_key,details_json,created_at FROM admin_action_audit WHERE action_type='product_channel_tags_499_changed' AND target_type='product' AND target_key LIKE ? ORDER BY admin_action_audit_id DESC LIMIT 100").bind(`${id}:%`).all();
  const seen=new Set();for(const change of changes?.results||[]){const channel=String(change.target_key||'').slice(String(id).length+1);
   if(!CHANNELS499.includes(channel)||seen.has(channel))continue;const value=parseOverride499(change,channel);if(value){overrides[channel]=value;seen.add(channel);}}
  return respond({product_id:id,shared_keywords:String(row.keywords||''),overrides,etsy_effective:effectiveEtsyTags499(row.keywords,overrides.etsy)});
 }catch{return respond({error:'Channel tag overrides unavailable. No tags changed.'},503)}
}
export async function onRequestPost(c){const g=gate(c);if(g.error)return g.error;
 if(c.request.headers.get('Origin')!==new URL(c.request.url).origin)return respond({error:'Same-origin request required.'},403);
 let body;try{body=await c.request.json()}catch{return respond({error:'JSON required.'},400)}
 const id=Number(body?.product_id),channel=String(body?.channel||'').toLowerCase(),mode=String(body?.mode||'');
 if(!valid(id)||!CHANNELS499.includes(channel)||!['shared','override'].includes(mode)||body?.confirm_local_tags_only!==true)
  return respond({error:'Choose Product, channel, explicit shared/override mode and local-only confirmation.'},400);
 try{const row=await product(g.db,id);if(!row)return respond({error:'Product not found.'},404);
  const tags=mode==='override'?phraseList499(body.tags):[];
  if(mode==='override'&&!tags.length)return respond({error:'Override mode requires at least one phrase.'},400);
  if(channel==='etsy'&&mode==='override'){
   const check=effectiveEtsyTags499(row.keywords,{mode,tags});if(!check.ready)return respond({error:'Invalid Etsy override: '+check.blockers.join(' ')},400);
  }
  const entry={build:499,product_id:id,channel,mode,tags,provider_write:false,request_key:String(body.request_key||'')};
  const result=await g.db.prepare("INSERT INTO admin_action_audit(actor_user_id,action_type,target_type,target_key,request_method,request_path,details_json,created_at) VALUES (?,'product_channel_tags_499_changed','product',?,'POST',?,?,CURRENT_TIMESTAMP)")
   .bind(g.admin.user_id,`${id}:${channel}`,new URL(c.request.url).pathname,JSON.stringify(entry)).run();
  if(Number(result.meta?.changes)!==1)return respond({error:'Local tag override save was not confirmed.'},503);
  const confirmed=await readOverride499(g.db,id,channel);
  if(!confirmed||confirmed.mode!==mode||JSON.stringify(confirmed.tags)!==JSON.stringify(tags))return respond({error:'Local tags readback did not match. Review before repeating.'},503);
  return respond({product_id:id,channel,override:confirmed,etsy_effective:channel==='etsy'?effectiveEtsyTags499(row.keywords,confirmed):undefined,saved_locally:true});
 }catch(error){return respond({error:'Channel override save held: '+String(error?.message||'unavailable').slice(0,170)},503)}
}
