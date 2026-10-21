// Build 428: selected-case verified Admin GET-only manual evidence follow-up.
import {verifiedAdminFromModule} from '../_lib/verifiedAdmin398.mjs';
import {onRequestGet as read427} from './provider-independent-closure-review-427.js';
import {reviewEvidenceFollowup428} from '../_lib/providerEvidenceFollowup428.mjs';
const reply=(data,status=200)=>Response.json({ok:status<400,build:428,read_only:true,local_only:true,provider_called:false,automatic_closure:false,us_shipping_suspended:true,...data},{status,headers:{'Cache-Control':'no-store'}});
export async function onRequestGet(context){
 if(!verifiedAdminFromModule(context))return reply({error:'Verified active Admin required.'},401);
 const url=new URL(context.request.url);
 if(url.searchParams.get('mode')!=='detail')return reply({error:'Explicit case required.'},400);
 const previous=new URL('/api/admin/provider-independent-closure-review-427',url);
 previous.search=url.search;
 try{
  const response=await read427({...context,request:new Request(previous,{method:'GET',headers:context.request.headers})});
  if(!response.ok)return reply({error:'Upstream read-only evidence unavailable.'},response.status);
  const source=await response.json();
  return reply({product_id:source.product_id,destination:source.destination,draft_id:source.draft_id||null,review:reviewEvidenceFollowup428(source)});
 }catch{return reply({error:'Local follow-up review unavailable.'},503);}
}
export async function onRequestPost(){return reply({error:'Read-only follow-up; writes not allowed.'},405);}
