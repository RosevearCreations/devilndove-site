// Build 418 — bounded read-only owner closure history with verified Admin.
import {getDb} from '../_lib/adminAudit.js';
import {verifiedAdminFromModule} from '../_lib/verifiedAdmin398.mjs';
import {onRequestGet as read414} from './provider-completion-414.js';
import {reconcileHistory418,REOPEN_TYPE} from '../_lib/providerClosureHistory418.mjs';
import {TYPE} from '../_lib/providerClosureApproval417.mjs';
export async function onRequestGet(c){
 const admin=verifiedAdminFromModule(c),db=getDb(c.env);
 const respond=(data,status=200)=>Response.json(data,{status,headers:{'Cache-Control':'no-store'}});
 if(!admin)return respond({ok:false,error:'Verified Admin required.'},401);
 if(!db)return respond({ok:false,error:'Audit D1 unavailable.'},503);
 const url=new URL(c.request.url),dest=url.searchParams.get('destination'),pid=url.searchParams.get('product_id'),draft=url.searchParams.get('draft_id');
 if(url.searchParams.get('mode')!=='detail'||!['etsy','facebook'].includes(dest))return respond({ok:false,error:'Explicit case detail required.'},400);
 try{
  const data=await read414(c);
  if(!data.ok)return data;
  const snapshot=await data.json();
  const kind=dest==='etsy'?'marketplace_draft':'product',key=dest==='etsy'?draft:pid;
  if(!key)return respond({ok:false,error:'Missing case identifier.'},400);
  const results=(await db.prepare('SELECT admin_action_audit_id,actor_user_id,action_type,created_at,details_json FROM admin_action_audit WHERE target_type=? AND target_key=? AND action_type IN (?,?) ORDER BY admin_action_audit_id DESC LIMIT 101').bind(kind,key,TYPE,REOPEN_TYPE).all())?.results||[];
  const history=reconcileHistory418({rows:results.slice(0,100),snapshot,scanComplete:results.length<101});
  return respond({ok:true,build:418,product_id:snapshot.product_id,destination:dest,history,read_only:true,no_provider_contact:true});
 }catch{return respond({ok:false,error:'Audit history unavailable; no decision authorized.'},503);}
}
