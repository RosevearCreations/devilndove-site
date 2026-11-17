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


/* Build 731: source-derived operational assurance, never a substitute for external deletion. */
export function assessPrivacyHealth731({tick=null,events=[],rotation=null,schema_ready=false,now=Date.now()}={}){
 const asTime=s=>{
  if(typeof s!=='string'||!/^\d{4}-\d\d-\d\d[ T]\d\d:\d\d:\d\d(?:\.\d+)?(?:Z)?$/.test(s))return NaN;
  return Date.parse(s.replace(' ','T')+(s.endsWith('Z')?'':'Z'));
 };
 const alerts=[],counters={pending:0,overdue_24h:0,overdue_7d:0,dead_letters:0,
  signed_receipts:0,unverified_receipts:0,expired_leases:0};
 const age=asTime(tick?.created_at),fresh=Number.isFinite(age)&&now-age>=0&&now-age<=30*60000;
 const health=!schema_ready?'HOLD_SCHEMA_MISSING':!fresh?'HOLD_HEARTBEAT_MISSING_OR_STALE':
  tick?.tick_state!=='RUN'?'HOLD_LAST_TICK_UNHEALTHY':'SCHEDULE_HEARTBEAT_OBSERVED';
 if(health!=='SCHEDULE_HEARTBEAT_OBSERVED')alerts.push({code:health,severity:'critical'});
 const reviewed=Array.isArray(events)?events.slice(0,100):[];
 for(const e of reviewed){
  const created=asTime(e.created_at),state=String(e.state||'');
  const manual=Number(e.manual_receipt||0),service=Number(e.service_receipt||0);
  const ack=manual+service;
  const match=(manual===1||service===1)&&manual<=1&&service<=1&&
   String(e.ack_target||e.target_app)===String(e.target_app)&&
   Number(e.consent_withdrawn)===1&&
   (manual===1?Number(e.manual_signature_verified)===1:true)&&
   (service===1?Number(e.service_signature_verified)===1:true);
  if(ack>0){
   if(!match||ack>1||state==='DEAD_LETTER'&&service>0){
    counters.unverified_receipts++;
    alerts.push({code:'HOLD_SIGNED_DELIVERY_CONSISTENCY',severity:'critical',event_id:e.event_id});
   }else counters.signed_receipts++;
   continue;
  }
  counters.pending++;
  if(state==='DEAD_LETTER')counters.dead_letters++;
  if(state==='LEASED'&&asTime(e.lease_expires_at)<now)counters.expired_leases++;
  if(!Number.isFinite(created)||now-created<0){
   alerts.push({code:'HOLD_EVENT_TIME_INVALID',severity:'warning',event_id:e.event_id});continue;
  }
  if(now-created>7*86400000)counters.overdue_7d++;
  else if(now-created>86400000)counters.overdue_24h++;
 }
 if(counters.overdue_7d)alerts.push({code:'RETRY_SLA_OVER_7_DAYS',severity:'critical',count:counters.overdue_7d});
 if(counters.overdue_24h)alerts.push({code:'RETRY_SLA_OVER_24_HOURS',severity:'warning',count:counters.overdue_24h});
 if(counters.dead_letters)alerts.push({code:'DEAD_LETTERS_UNRESOLVED',severity:'critical',count:counters.dead_letters});
 if(counters.expired_leases)alerts.push({code:'RETRY_LEASE_EXPIRED',severity:'warning',count:counters.expired_leases});
 const backlog=rotation?.old_key_latest_versions==null?NaN:Number(rotation.old_key_latest_versions);
 const historical=rotation?.old_key_history_versions==null?NaN:Number(rotation.old_key_history_versions);
 const active=String(rotation?.active_key_id||'');
 const configured=!!rotation?.keyring_ready;
 const rotation_state=!configured||!active||!Number.isSafeInteger(backlog)||backlog<0||
   !Number.isSafeInteger(historical)||historical<0?'HOLD_ROTATION_EVIDENCE_INCOMPLETE':
   backlog>0?'HOLD_CURRENT_VERSIONS_PENDING_ROTATION':
   historical>0?'CURRENT_VERSIONS_ROTATED_OLD_KEYS_STILL_REFERENCED':
   'NO_OLD_KEY_REFERENCES_DETECTED';
 if(rotation_state.startsWith('HOLD'))alerts.push({code:rotation_state,severity:'warning'});
 return {build:731,scheduler_health:health,alerts,counters,
  rotation:{state:rotation_state,current_old_key_versions:Number.isSafeInteger(backlog)?backlog:null,
   historical_old_key_references:Number.isSafeInteger(historical)?historical:null,
   old_key_retirement_authorized:false,cryptographic_decryption_proven:false,
   automatic_reencryption_performed:false},
  delivery_evidence:'LOCAL_D1_SIGNED_ACK_RECEIPT_NOT_REMOTE_ERASURE_PROOF',
  queue_sample_bounded:reviewed.length,full_queue_sla_certified:false,
  external_data_removed_verified:false,live_peer_connected_implied:false};
}

/* Build 732: original source-only escalation, recovery and cross-application compliance.
   No outbound communication, credential exposure, purge, or secret-retirement permission. */
export function assessPrivacyGovernance732({health={},events=[],peers=[],rotation=null,
 scheduleReceipts=[],now=Date.now(),complete=false}={}){
 const allowed=['ai-data-platform','rosevear-ai-hub','rosevear-comms-hub'];
 const stamp=s=>{
  if(typeof s!=='string'||!/^\d{4}-\d\d-\d\d[ T]\d\d:\d\d:\d\d(?:\.\d+)?(?:Z)?$/.test(s))return NaN;
  return Date.parse(s.replace(' ','T')+(s.endsWith('Z')?'':'Z'));
 };
 const alerts=[],matrix=allowed.map(name=>({peer_app:name,withdrawn_pending:0,
  breached_24h:0,breached_7d:0,dead_letter:0,expired_lease:0,
  verified_local_ack:0,conflicting_ack:0,remote_receipt_verified:false,
  compliance_state:'HOLD_ORIGINAL_PEER_EVIDENCE'}));
 const limited=Array.isArray(events)?events.slice(0,100):[];
 for(const e of limited){
  const m=matrix.find(x=>x.peer_app===e.target_app);
  if(!m){alerts.push({code:'HOLD_UNRECOGNIZED_MASTER_TARGET',severity:'critical'});continue;}
  const manual=Number(e.manual_receipt||0),service=Number(e.service_receipt||0);
  const signatureOk=(manual===1&&Number(e.manual_signature_verified)===1&&e.manual_target===m.peer_app)||
   (service===1&&Number(e.service_signature_verified)===1&&e.service_target===m.peer_app);
  const valid=manual+service===1&&signatureOk&&Number(e.consent_withdrawn)===1;
  if(manual+service){
   if(valid)m.verified_local_ack++;
   else {m.conflicting_ack++;alerts.push({code:'HOLD_CONFLICTING_LOCAL_DELIVERY_EVIDENCE',severity:'critical',peer_app:m.peer_app});}
   continue;
  }
  m.withdrawn_pending++;
  if(e.state==='DEAD_LETTER')m.dead_letter++;
  if(e.state==='LEASED'&&Number.isFinite(stamp(e.lease_expires_at))&&stamp(e.lease_expires_at)<now)m.expired_lease++;
  const age=now-stamp(e.created_at);
  if(Number.isFinite(age)&&age>=7*86400000)m.breached_7d++;
  else if(Number.isFinite(age)&&age>=86400000)m.breached_24h++;
  else if(!Number.isFinite(age)||age<0)alerts.push({code:'HOLD_UNKNOWN_EVENT_AGE',severity:'warning',peer_app:m.peer_app});
 }
 const proofs=Array.isArray(peers)?peers:[];
 for(const m of matrix){
  const p=proofs.find(x=>x.peer_app===m.peer_app);
  const live=!!p&&p.state==='CURRENT_LIVE_SIGNED_CHALLENGE_PROOF'&&
   Number.isFinite(stamp(p.latest_proof_at))&&now-stamp(p.latest_proof_at)>=0&&
   now-stamp(p.latest_proof_at)<=7*86400000;
  m.compliance_state=!complete?'HOLD_QUEUE_SAMPLE_INCOMPLETE':
   !live?'HOLD_ORIGINAL_SIGNED_PEER_ENROLLMENT':
   m.conflicting_ack?'HOLD_DELIVERY_EVIDENCE_CONFLICT':
   m.dead_letter||m.breached_7d?'ESCALATE_ORIGINAL_PRIVACY_SLA':
   m.breached_24h||m.expired_lease?'REVIEW_PRIVACY_SLA':
   'LOCAL_SOURCE_COMPLIANCE_REVIEW_ONLY';
  if(m.breached_7d||m.dead_letter)
   alerts.push({code:'CRITICAL_PRIVACY_SLA_ESCALATION',severity:'critical',peer_app:m.peer_app,
    count:m.breached_7d+m.dead_letter});
  else if(m.breached_24h||m.expired_lease)
   alerts.push({code:'PRIVACY_SLA_OPERATOR_REVIEW',severity:'warning',peer_app:m.peer_app,
    count:m.breached_24h+m.expired_lease});
 }
 const ticks=Array.isArray(scheduleReceipts)?scheduleReceipts.slice(0,2):[];
 const newest=ticks[0]||null,prev=ticks[1]||null;
 const latest=stamp(newest?.created_at);
 const fresh=Number.isFinite(latest)&&now-latest>=0&&now-latest<=30*60000;
 const consistent=fresh&&newest.tick_state==='RUN'&&Number(newest.signed_ack_count)>=0&&
  Number(newest.held_events)>=0&&Number(newest.considered_events)>=0&&
  Number(newest.signed_ack_count)+Number(newest.held_events)<=Number(newest.considered_events);
 const monotonic=(!prev||Number.isFinite(stamp(prev.created_at))&&
   stamp(prev.created_at)<=latest&&newest.tick_id!==prev.tick_id);
 const automation=consistent&&monotonic?'ORIGINAL_D1_TICK_EVIDENCE_OBSERVED':
  'HOLD_SCHEDULER_RECOVERY_NOT_VERIFIED';
 if(automation.startsWith('HOLD'))alerts.push({code:automation,severity:'critical'});
 const oldLatest=rotation?.current_old_key_versions,oldHistorical=rotation?.historical_old_key_references;
 const validRotation=Number.isSafeInteger(oldLatest)&&oldLatest>=0&&
  Number.isSafeInteger(oldHistorical)&&oldHistorical>=0&&!!rotation?.active_key_id;
 const custody=!validRotation?'HOLD_KEY_CUSTODY_PROOF_INCOMPLETE':
  oldLatest>0?'HOLD_ACTIVE_CIPHERTEXT_ROTATION_PENDING':
  oldHistorical>0?'HOLD_HISTORICAL_KEY_REFERENCES_RETAINED':
  'LOCAL_REFERENCE_SCAN_CLEAR_NOT_RETIREMENT_PROOF';
 if(custody.startsWith('HOLD'))alerts.push({code:custody,severity:'warning'});
 return {build:732,automation_recovery:automation,privacy_sla_escalations:alerts,
  cross_application_compliance:matrix,queue_evidence_complete:complete,
  key_custody:{status:custody,active_key_id:rotation?.active_key_id||null,
   original_rotation_attested:false,old_key_retirement_authorized:false,
   independently_decrypted_ciphertext_verified:false},
  scheduler_actual_cloudflare_deployment_verified:false,
  cross_application_delivery_or_remote_erasure_proven:false,
  no_auto_send:true,operator_decision_required:true};
}
