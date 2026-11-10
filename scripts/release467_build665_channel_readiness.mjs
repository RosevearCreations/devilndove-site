// Build 665: no-network, no-write source audit. This is not an OAuth or publishing test.
import {readFileSync, existsSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {resolve, dirname} from 'node:path';

const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
export const reportPath='docs/operations/RELEASE_467_BUILD_665_CHANNEL_READINESS.json';
export const channelIds=Object.freeze(['etsy','facebook_page','instagram_business','pinterest','x','tiktok','youtube']);
const own=(value,key)=>Object.prototype.hasOwnProperty.call(value,key);

export function loadChannelReadiness(){
  return JSON.parse(readFileSync(resolve(root,reportPath),'utf8'));
}

export function validateChannelReadiness(report,{checkSources=true}={}){
  const errors=[];
  const insist=(condition,code)=>{if(!condition)errors.push(code);};
  insist(report?.schema==='release467-build665-channel-readiness-v1','schema');
  insist(report?.source_id==='devilndove' && report?.repository==='RosevearCreations/devilndove-site','source_identity');
  insist(report?.source_role==='owned_business_shell','source_role');
  insist(report?.assessment==='LOCAL_SOURCE_AUDIT_ONLY','source_assessment');
  insist(report?.provider_connection==='HOLD' && report?.master_shell_connection==='DISCONNECTED_HOLD','connection_boundary');
  insist(report?.external_provider_receipt===null && report?.verified_provider_revision===null && report?.owner_approval_receipt===null,'invented_provider_receipt');
  insist(Array.isArray(report?.channels) && report.channels.length===channelIds.length,'channel_count');
  if(Array.isArray(report?.channels)){
    insist(new Set(report.channels.map(c=>c?.id)).size===channelIds.length,'duplicate_channel');
    for(const id of channelIds){
      const c=report.channels.find(x=>x?.id===id);
      insist(Boolean(c),'missing_'+id);
      if(!c)continue;
      insist(c.state===(id==='etsy'?'PAUSED_BY_OWNER':'HOLD'),'state_'+id);
      insist(c.publication_authorized===false && c.external_identity_verified===false && c.original_owner_consent_verified===false,'authorization_'+id);
      insist(c.original_provider_receipt===null,'receipt_'+id);
    }
  }
  const ad=report?.advertising;
  insist(ad?.state==='NOT_IMPLEMENTED_HOLD','advertising_state');
  insist(ad?.ad_account_verified===false && ad?.budget_approved===false && ad?.campaign_execution_authorized===false && ad?.spend_enabled===false && ad?.original_provider_receipt===null,'advertising_spend_boundary');
  insist(report?.privacy?.customer_media_publication_allowed_by_this_record===false && report?.privacy?.tracking_consent_proves_publication_authority===false && report?.privacy?.original_media_rights_and_subject_consent_verified===false,'privacy_consent_boundary');
  insist(report?.source_code_green_implies_provider_connected===false && report?.requires_independent_owner_and_provider_acceptance===true,'production_truth');
  const paths=report?.evidence_paths;
  insist(Array.isArray(paths) && paths.length>=7 && new Set(paths).size===paths.length,'evidence_paths');
  if(Array.isArray(paths))for(const path of paths){
    insist(typeof path==='string' && /^(admin|functions)\/[a-zA-Z0-9_./-]+\.(?:js|html)$/.test(path) && !path.includes('..'),'unsafe_source_path');
    if(checkSources && typeof path==='string' && !path.includes('..'))insist(existsSync(resolve(root,path)),'missing_source_'+path);
  }
  if(checkSources){
    const queue=readFileSync(resolve(root,'functions/api/admin/social-post-queue.js'),'utf8');
    const intent=readFileSync(resolve(root,'functions/api/_lib/socialPublishContracts.js'),'utf8');
    const guard=readFileSync(resolve(root,'functions/api/admin/social-media-privacy-guard.js'),'utf8');
    const acceptance=readFileSync(resolve(root,'functions/api/admin/social-oauth-acceptance.js'),'utf8');
    const meta=readFileSync(resolve(root,'functions/api/admin/product-meta-readiness-560.js'),'utf8');
    insist(/review-first/i.test(queue) && /approved_for_public_post/.test(queue),'queue_review_boundary');
    insist(/MUST NOT contact providers/.test(intent),'planning_not_provider_execution');
    insist(/privacy_status/.test(guard) && /media_consent_required/.test(guard),'media_privacy_guard');
    insist(/Read-only projection/.test(acceptance) && /No provider call/.test(acceptance),'oauth_read_only');
    insist(/No provider token material, Graph API call, upload, publication/.test(meta),'meta_read_only');
  }
  return {ok:errors.length===0,errors,source:report?.source_id||null,assessment:report?.assessment||null,
    channels:channelIds.length,provider_connection:report?.provider_connection||'HOLD',
    master_shell_connection:report?.master_shell_connection||'DISCONNECTED_HOLD',
    publishing_enabled:false,advertising_spend_enabled:false,provider_contacted:false};
}

if(process.argv[1] && resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  const result=validateChannelReadiness(loadChannelReadiness());
  process.stdout.write(JSON.stringify(result,null,2)+'\n');
  if(!result.ok)process.exitCode=1;
}
