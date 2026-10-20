// Release 467 Build 426: authenticated read-only review, no manual closure operation.
import {verifiedAdminFromModule} from '../_lib/verifiedAdmin398.mjs';
import {onRequestGet as read425} from './provider-owner-acceptance-425.js';
import {boundedReview426} from '../_lib/providerAcceptanceContinuity426.mjs';

const reply = (body, status=200) => Response.json(
  {ok:status<400,build:426,read_only:true,local_only:true,
   provider_called:false,publication_performed:false,notifications_sent:false,
   automatic_reopen:false,automatic_closure:false,us_shipping_suspended:true,...body},
  {status,headers:{'Cache-Control':'no-store'}}
);
export async function onRequestGet(context) {
  if (!verifiedAdminFromModule(context)) return reply({error:'Verified active Admin required.'},401);
  const url = new URL(context.request.url);
  if (url.searchParams.get('mode') !== 'detail')
    return reply({error:'Explicit selected case required.'},400);
  const upstreamUrl = new URL('/api/admin/provider-owner-acceptance-425',url);
  upstreamUrl.search = url.search;
  try {
    const response = await read425({...context,request:new Request(upstreamUrl,{method:'GET',headers:context.request.headers})});
    if (!response.ok) return reply({error:'Current owner acceptance source unavailable; no closure allowed.'},response.status);
    const source = await response.json();
    const review = boundedReview426(source);
    return reply({product_id:source.product_id,destination:source.destination,draft_id:source.draft_id||null,
      review, operator_action:'Independently verify provider evidence, then obtain a separate authorized human closure decision. This endpoint records nothing.'});
  } catch {
    return reply({error:'Bounded provenance review unavailable; closure remains on HOLD.'},503);
  }
}
export async function onRequestPost() {
  return reply({error:'Build 426 is strictly read-only. No closure, provider, or audit writes are permitted.'},405);
}
