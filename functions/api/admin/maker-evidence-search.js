/* Release 467 Build 459 — private, source-linked Maker search GET only. */
import {getAdminUserFromRequest,getDb,jsonResponse} from '../_lib/adminAudit.js';
import {findMakerEvidence,parseMakerSearch,SEARCH_KINDS} from './_lib/makerEvidenceSearch459.mjs';

const out=(data,status=200)=>jsonResponse({ok:status===200,release:467,build:459,...data},status,
 {'Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff'});

export async function onRequestGet({request,env}){
 const admin=await getAdminUserFromRequest(request,env);
 if(!admin)return out({error:'An authenticated Admin session is required; Maker evidence is private.',code:'MAKER_AUTH_REQUIRED'},401);
 const db=getDb(env);if(!db)return out({error:'Canonical D1 is unavailable.',code:'MAKER_DB_UNAVAILABLE'},503);
 let filter;try{filter=parseMakerSearch(new URL(request.url).searchParams)}
 catch(error){return out({error:error.message,code:'MAKER_INVALID_FILTER'},400)}
 try{
  return out({...(await findMakerEvidence(db,filter)),filter:{kind:filter.kind,project_id:filter.projectId,query:filter.query},
   available_kinds:SEARCH_KINDS,source_authority:'existing_creative_projects_designs_recipes_inventory_finished_pieces',
   safety:{admin_only:true,read_only:true,bounded:true,private_originals_not_downloaded:true,
    customer_data_excluded:true,no_provider_calls:true,no_inferred_consent:true,no_sale_approval:true}});
 }catch(error){console.error('BUILD459_MAKER_SEARCH',error?.name||'Error');
  return out({error:'Source-linked Maker search could not complete. No source or private media was changed.',code:'MAKER_SEARCH_READ_FAILED'},503)}
}
