// Build 416 — authenticated read-only closure evidence packet.
import {onRequestGet as read414} from './provider-completion-414.js';
import {closurePacket416} from '../_lib/providerClosurePacket416.mjs';
export async function onRequestGet(context){
 const req=new URL(context.request.url);
 if(req.searchParams.get('mode')!=='detail')return Response.json({ok:false,error:'An explicitly selected detail case is required.'},{status:400,headers:{'Cache-Control':'no-store'}});
 const evidence=await read414(context);
 if(!evidence.ok)return evidence;
 let data;try{data=await evidence.json();}catch{return Response.json({ok:false,error:'Audit evidence unavailable.'},{status:503});}
 if(!data.ok||!data.evidence_receipts)return Response.json({ok:false,error:'Verified local evidence unavailable.'},{status:409});
 return Response.json(closurePacket416(data),{headers:{'Cache-Control':'no-store'}});
}
