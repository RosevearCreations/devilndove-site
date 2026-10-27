import {authorizedIntegration506,integrationResponse506} from '../../_lib/integrationContract506.mjs';
export async function onRequestGet(c){const result=await authorizedIntegration506(c,'/api/integration/v1/capabilities');if(result.error)return result.error;
 return integrationResponse506(c,{capabilities:{health:{enabled:true,method:'GET'},capabilities:{enabled:true,method:'GET'},
   product_reference:{enabled:false,requires_separate_owner_approval:true},events:{enabled:false},commands:{enabled:false},etsy_writes:{enabled:false},marketplace_writes:{enabled:false}},
   customer_records_exposed:false,connection_approved:false});}
