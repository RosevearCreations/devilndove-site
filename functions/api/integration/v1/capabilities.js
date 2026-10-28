import {authorizedIntegration506,integrationResponse506} from '../../_lib/integrationContract506.mjs';
import {authorizedQL243Get510,responseQL243Get510,rejectQL243Write510} from '../../_lib/integrationContract510.mjs';
export async function onRequestGet(c){
 if(c.env?.ROSEVEAR_QL243_DEPLOYMENT_CLASS==='nonproduction'||c.request.headers.has('x-rosevear-contract')){
  const proof=await authorizedQL243Get510(c,'/api/integration/v1/capabilities');if(proof.error)return proof.error;
  return responseQL243Get510(c,proof,{capabilities:{health:{enabled:true,method:'GET'},capabilities:{enabled:true,method:'GET'},
   read_product_reference:{enabled:false,requires_separate_owner_pilot:true},
   read_listing_reference:{enabled:false,requires_separate_owner_pilot:true},
   etsy_writes:{enabled:false},media_uploads:{enabled:false},inventory_writes:{enabled:false},
   orders:{enabled:false},customer_data:{enabled:false},events:{enabled:false},commands:{enabled:false}},
   read_only:true,connection_approved:false});
 }
 const result=await authorizedIntegration506(c,'/api/integration/v1/capabilities');if(result.error)return result.error;
 return integrationResponse506(c,{capabilities:{health:{enabled:true,method:'GET'},capabilities:{enabled:true,method:'GET'},
   product_reference:{enabled:false,requires_separate_owner_approval:true},events:{enabled:false},commands:{enabled:false},etsy_writes:{enabled:false},marketplace_writes:{enabled:false}},
   customer_records_exposed:false,connection_approved:false});}
export const onRequestPost=rejectQL243Write510;
export const onRequestPut=rejectQL243Write510;
export const onRequestPatch=rejectQL243Write510;
export const onRequestDelete=rejectQL243Write510;
