import {authorizedIntegration506,integrationResponse506} from '../../_lib/integrationContract506.mjs';
import {authorizedQL243Get510,responseQL243Get510,rejectQL243Write510} from '../../_lib/integrationContract510.mjs';
export async function onRequestGet(c){
 if(c.env?.ROSEVEAR_QL243_DEPLOYMENT_CLASS==='nonproduction'||c.request.headers.has('x-rosevear-contract')){
  const proof=await authorizedQL243Get510(c,'/api/integration/v1/health');if(proof.error)return proof.error;
  return responseQL243Get510(c,proof,{status:'HOLD',ready_for_signed_gateway_receipt:false,read_only:true});
 }
 const result=await authorizedIntegration506(c,'/api/integration/v1/health');if(result.error)return result.error;
 return integrationResponse506(c,{status:'read_only_handshake_test',customer_records_exposed:false,etsy_modified:false});}
export const onRequestPost=rejectQL243Write510;
export const onRequestPut=rejectQL243Write510;
export const onRequestPatch=rejectQL243Write510;
export const onRequestDelete=rejectQL243Write510;
