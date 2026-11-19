import {handleBuild423Telemetry} from '../../../../api/_lib/sysopTelemetry423.mjs';
export async function onRequestGet({request,env}){return handleBuild423Telemetry({request,env});}
export async function onRequest(){return new Response(JSON.stringify({state:'DENY_METHOD',connected:false,authorizesAction:false}),{status:405,headers:{'Content-Type':'application/json','Cache-Control':'private, no-store'}});}
