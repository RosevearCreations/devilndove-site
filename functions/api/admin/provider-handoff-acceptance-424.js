// Build 424 — uses existing verified, capped Build 423 reader; no additional DB queries.
import {onRequestGet as read423} from './provider-handoff-governance-423.js';
import {reviewHandoffAcceptance424} from '../_lib/providerHandoffAcceptance424.mjs';
const reply=(data,status=200)=>Response.json({ok:status<400,build:424,read_only:true,
 provider_called:false,publication_performed:false,notifications_sent:false,
 automatic_reopen:false,automatic_closure:false,us_shipping_suspended:true,...data},
 {status,headers:{'Cache-Control':'no-store'}});
export async function onRequestGet(context){
 try{
  const upstream=await read423(context);
  if(!upstream.ok){
   const error=upstream.status===401?'Verified active Admin required.':
    upstream.status===400?'Explicit valid Product and case required.':
    'Current bounded governance evidence unavailable; manual HOLD.';
   return reply({error},upstream.status);
  }
  const source=await upstream.json();
  if(source?.ok!==true||source?.build!==423||source?.read_only!==true)
   return reply({error:'Verified governance report unavailable; manual HOLD.'},409);
  const review=reviewHandoffAcceptance424(source);
  return reply({product_id:source.product_id,destination:source.destination,review,
   current_owner_user_id:source.current_owner_user_id,
   current_source_signature:source.current_source_signature,
   current_receipts:source.current_receipts,draft_id:source.draft_id,
   manual_review_only:true,operator_action:
   'Prioritize original receipts. Eligibility does not approve reassignment, exception resolution or closure.'});
 }catch{
  return reply({error:'Governance evidence could not be read; no automatic action taken.'},503);
 }
}
