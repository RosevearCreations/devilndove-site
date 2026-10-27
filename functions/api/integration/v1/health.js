import {authorizedIntegration506,integrationResponse506} from '../../_lib/integrationContract506.mjs';
export async function onRequestGet(c){const result=await authorizedIntegration506(c,'/api/integration/v1/health');if(result.error)return result.error;
 return integrationResponse506(c,{status:'read_only_handshake_test',customer_records_exposed:false,etsy_modified:false});}
