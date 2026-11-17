// Build 730 — privacy retry scheduling decisions and anonymous alert summaries.
// No external transport, secret rotation or deletion occurs in this module.
export const BUILD730_POLICY=Object.freeze({
 build:730,maximum_attempts:6,base_delay_seconds:300,max_delay_seconds:86400,
 dead_letter_after_attempts:6, automatic_external_delivery_enabled:false,
 automatic_key_replacement_enabled:false,automatic_deletion_enabled:false
});
export function retryWindow730({attempts=0,created_at,last_attempt_at=null,acknowledged=false,now=Date.now()}={}){
 const count=Number(attempts);
 if(acknowledged)return {state:'ACKNOWLEDGED',due:false,next_retry_at:null};
 if(!Number.isSafeInteger(count)||count<0)return {state:'HOLD_INVALID_ATTEMPT_COUNT',due:false,next_retry_at:null};
 if(count>=BUILD730_POLICY.maximum_attempts)return {state:'DEAD_LETTER_REVIEW',due:false,next_retry_at:null};
 const value=last_attempt_at||created_at,stamp=Date.parse(String(value||'').replace(' ','T').replace(/T.*Z$/,'$&')+(String(value||'').includes('Z')||String(value||'').includes('+')?'':'Z'));
 if(!Number.isFinite(stamp))return {state:'HOLD_SOURCE_TIME_UNVERIFIED',due:false,next_retry_at:null};
 const seconds=Math.min(BUILD730_POLICY.max_delay_seconds,BUILD730_POLICY.base_delay_seconds*2**count);
 const next=stamp+seconds*1000;
 return {state:now>=next?'DUE_REQUIRES_AUTHORIZED_DELIVERY':'BACKOFF',
   due:now>=next,next_retry_at:new Date(next).toISOString(),attempts:count};
}
export function privacyAlerts730(view={},now=Date.now()){
 const alerts=[],peers=Array.isArray(view.peers)?view.peers:[],key=view.keyring||{};
 for(const peer of peers){
  if(!['ai-data-platform','rosevear-ai-hub','rosevear-comms-hub'].includes(peer.peer_app))continue;
  const withheld=Number(peer.held||0),agedDay=Number(peer.aged_one_day||0),
   agedWeek=Number(peer.aged_seven_days||0);
  if(agedWeek>0)alerts.push({code:'WITHDRAWAL_OVERDUE_7D',severity:'critical',peer_app:peer.peer_app,count:agedWeek});
  else if(agedDay>0)alerts.push({code:'WITHDRAWAL_OVERDUE_24H',severity:'warning',peer_app:peer.peer_app,count:agedDay});
  if(withheld>0&&peer.state!=='CURRENT_LIVE_SIGNED_CHALLENGE_PROOF')
   alerts.push({code:'WITHDRAWAL_RECEIVER_PROOF_HOLD',severity:'warning',peer_app:peer.peer_app,count:withheld});
  if(peer.latest_proof_at&&peer.state==='CURRENT_LIVE_SIGNED_CHALLENGE_PROOF'){
   const at=Date.parse(String(peer.latest_proof_at).replace(' ','T')+'Z');
   if(Number.isFinite(at)&&now-at>5*86400000)
    alerts.push({code:'PEER_PROOF_EXPIRING',severity:'warning',peer_app:peer.peer_app,count:1});
  }
 }
 const rotation=Number(key.latest_ciphertexts_needing_rotation||0);
 if(rotation>0)alerts.push({code:'KEY_ROTATION_BACKLOG',severity:'warning',count:rotation});
 if(!key.configured)alerts.push({code:'ACTIVE_KEY_NOT_CONFIGURED',severity:'warning',count:1});
 const holds=(Array.isArray(view.retention_reviews)?view.retention_reviews:[]).filter(x=>Number(x.eligibility?.legal_hold||0)===1);
 if(holds.length)alerts.push({code:'RETENTION_LEGAL_HOLD',severity:'info',count:holds.length});
 return {build:730,alerts,critical:alerts.filter(x=>x.severity==='critical').length,
  warning:alerts.filter(x=>x.severity==='warning').length,
  automatic_external_delivery_enabled:false,scheduled_worker_verified:false,
  external_recall_verified:false,cloudflare_secret_rotation_performed:false};
}
