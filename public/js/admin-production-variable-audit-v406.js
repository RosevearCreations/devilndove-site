// Build 406: strictly user-clicked, authenticated, presence-only production configuration audit.
(()=>{'use strict';
const button=document.getElementById('productionVariableAudit406Run'),
 status=document.getElementById('productionVariableAudit406Status'),
 result=document.getElementById('productionVariableAudit406Result');
if(!button||!status||!result||!window.DDAuth?.apiFetch)return;
button.addEventListener('click',async()=>{
 if(button.disabled)return;button.disabled=true;status.textContent='Checking whether known variable names are populated…';
 try{
 const response=await window.DDAuth.apiFetch('/api/admin/production-variable-audit-406',{method:'GET',cache:'no-store'});
 const data=await response.json().catch(()=>null);if(!response.ok||!data?.ok)throw Error(data?.error||'Audit unavailable');
 result.textContent=[...data.rows.map(r=>r.group+' / '+r.name+' — '+r.status+' ('+r.classification+')'),
 ...data.bindings.map(r=>'BINDING / '+r.name+' — '+r.status),
 'Etsy production OAuth callback correct: '+(data.etsy_callback_matches_production?'YES':'NO')].join('\n');
 status.textContent='Presence only; a PRESENT key can still be invalid or expired. Secret values are never shown.';
 }catch(error){status.textContent='Audit failed: '+error.message+'; no secret value was returned.';}
 finally{button.disabled=false;}
});
})();

// Build 720: separate owner-clicked drift review (no provider calls, approvals or stored secrets).
(()=>{
 'use strict';
 const button=document.getElementById('dd720Review'),
  status=document.getElementById('dd720Status'),
  result=document.getElementById('dd720Result');
 if(!button||!status||!result||!window.DDAuth?.apiFetch)return;
 button.addEventListener('click',async()=>{
  if(button.disabled)return;
  button.disabled=true;
  status.textContent='Checking the current Function environment (names and status only)…';
  try{
   const res=await window.DDAuth.apiFetch('/api/admin/production-variable-audit-406?review=720',
    {method:'GET',cache:'no-store'});
   const data=await res.json().catch(()=>null);
   if(!res.ok||!data?.ok||data.review720?.build!==720)throw Error('Protected review unavailable');
   const a=data.review720;
   result.textContent=[
    'Source: '+a.mode,
    'Core missing: '+(a.core_missing_names.join(', ')||'none'),
    'Missing resource bindings: '+(a.missing_binding_names.join(', ')||'none'),
    'Etsy callback: '+a.etsy_callback_status,
    'PayPal runtime expects: '+a.paypal_runtime_name,
    'Legacy PayPal alias only: '+(a.paypal_legacy_alias_only?'YES — change name':'NO'),
    ...a.providers.map(p=>p.provider+' — '+p.status+
     (p.missing_names.length?' (missing '+p.missing_names.join(', ')+')':'')+
     ' · freshness '+p.credential_freshness),
    'Safe review alerts: '+(a.alerts.join(', ')||'none'),
    'Original ninth/outside SLA recovery: '+a.signed_custody_recovery,
    'Original media closure: '+a.media_closure,
    'Protected owner approval: '+a.owner_ledger_approval
   ].join('\n');
   status.textContent='Snapshot only. No provider validity, signing renewal, independent custody or owner ledger approval was inferred.';
  }catch(_){status.textContent='HOLD — Protected binding review unavailable; no approvals were recorded.';}
  finally{button.disabled=false;}
 });
})();

// Build 721 — explicit Admin source recheck and durable owner-review record.
// Neither a checkbox nor a prior signed receipt authorizes financial closure.
(()=>{
 'use strict';
 const $=id=>document.getElementById(id),load=$('dd721Load'),
  record=$('dd721Record'),select=$('dd721Renewal'),status=$('dd721Status'),
  result=$('dd721Result'),campaign=$('dd721Campaign'),confirm=$('dd721Confirm'),
  note=$('dd721Note');
 if(!load||!record||!select||!status||!result||!campaign||!confirm||!note||
  !window.DDAuth?.apiFetch)return;
 let snapshot=null;
 const reset=()=>{
  snapshot=null;record.disabled=true;select.disabled=true;select.replaceChildren();
  const opt=document.createElement('option');opt.textContent='No eligible source';opt.value='';
  select.appendChild(opt);
 };
 async function reload(){
  reset();status.textContent='Rechecking original signed D1 receipts and issuer credential-name metadata…';
  const id=Number(campaign.value);
  if(!Number.isSafeInteger(id)||id<1)throw Error('Valid original campaign queue ID required');
  const res=await window.DDAuth.apiFetch('/api/admin/production-variable-audit-406?review=721&campaign_queue_id='+encodeURIComponent(id),{method:'GET',cache:'no-store'});
  const data=await res.json().catch(()=>null);
  if(!res.ok||!data?.ok||data.review721?.build!==721)throw Error('Protected original source unavailable');
  const source=data.review721,credentials=data.lifecycle721;
  result.textContent=[
   'Credential source: '+credentials.evidence_source,
   ...credentials.provider_states.map(p=>p.provider+' / '+p.configuration+
    ' / rotation '+p.issuer_rotation_receipt+' / age '+p.credential_age_status+
    ' / next '+p.action),
   'Independent custody source: '+source.status,
   'Original evidence current: '+(source.ready?'YES':'NO — HOLD'),
   'Original owner review receipt count: '+source.receipts.length,
   'Current verified owner review receipts: '+source.receipts.filter(x=>x.verified_current).length,
   'Actual financial books closed: NO'
  ].join('\n');
  if(source.ready&&source.eligible_items?.length){
   for(const item of source.eligible_items){
    const option=document.createElement('option');
    option.value=String(item.renewal_receipt_id);
    option.textContent='Renewal #'+item.renewal_receipt_id+
     ' · ninth #'+item.ninth_signed_receipt_id+
     ' · outside #'+item.outside_signed_receipt_id;
    select.appendChild(option);
   }
   select.disabled=false;snapshot={source,queue_id:id};
   record.disabled=false;
   status.textContent='Original signed evidence currently eligible for explicit Admin review. External custody and books closure remain separate.';
  }else status.textContent='HOLD — Original independent signed source incomplete, expired, mismatched or not verified.';
 }
 load.addEventListener('click',async()=>{
  if(load.disabled)return;load.disabled=true;
  try{await reload()}catch(e){reset();status.textContent='HOLD — '+e.message;}
  finally{load.disabled=false;}
 });
 record.addEventListener('click',async()=>{
  if(record.disabled||!snapshot)return;
  const id=Number(select.value),
   source=snapshot.source.eligible_items.find(x=>x.renewal_receipt_id===id);
  const reviewed=confirm.checked,reviewNote=note.value.trim();
  if(!source||!reviewed||reviewNote.length<25||reviewNote.length>400){
   status.textContent='HOLD — choose a verified source, explicitly review and supply a 25–400 character note.';
   return;
  }
  record.disabled=true;
  try{
   const response=await window.DDAuth.apiFetch('/api/admin/production-variable-audit-406',
    {method:'POST',headers:{'Content-Type':'application/json'},
    body:JSON.stringify({action:'owner_original_source_review_721',
      campaign_queue_id:snapshot.queue_id,
      original_711_renewal_receipt_id:id,
      original_716_signed_ninth_receipt_id:source.ninth_signed_receipt_id,
      original_717_signed_outside_receipt_id:source.outside_signed_receipt_id,
      expected_source_revision:snapshot.source.source_revision,
      expected_fingerprint_sha256:snapshot.source.fingerprint_sha256,
      owner_review_checked:true,review_note:reviewNote})});
   const data=await response.json().catch(()=>null);
   if(!response.ok||!data?.ok)throw Error(data?.error||'Original review not saved; HOLD');
   confirm.checked=false;note.value='';
   await reload();
   status.textContent='Verified source-bound Admin review receipt #'+data.receipt_id+
    ' recorded. Financial books remain HOLD.';
  }catch(_){reset();status.textContent='HOLD — Review rejected or source drifted. Refresh original evidence; no approval claimed.';}
  finally{record.disabled=!snapshot;}
 });
})();

// Build 722 — user-clicked independent issuer claim verification (no secrets persisted)
// and read-only current owner ledger drift/five-layer trust boundaries.
(()=>{
 'use strict';
 const $=id=>document.getElementById(id),check=$('dd722Audit'),verify=$('dd722VerifyIssuer'),
  status=$('dd722AuditStatus'),result=$('dd722AuditResult'),
  input=$('dd722SignedIssuerReceipt'),issuerStatus=$('dd722IssuerStatus'),
  campaign=$('dd721Campaign');
 if(!check||!verify||!status||!result||!input||!issuerStatus||
  !window.DDAuth?.apiFetch)return;
 check.addEventListener('click',async()=>{
  if(check.disabled)return;check.disabled=true;
  status.textContent='Rechecking original signed ledger and current Cloudflare signer enrollment…';
  try{
   const id=Number(campaign?.value||0);
   const res=await window.DDAuth.apiFetch('/api/admin/production-variable-audit-406?review=722&campaign_queue_id='+encodeURIComponent(Number.isSafeInteger(id)&&id>0?id:0),{method:'GET',cache:'no-store'});
   const data=await res.json().catch(()=>null);
   if(!res.ok||!data?.ok||!data.review722)throw Error('Protected original source unavailable');
   const r=data.review722,l=r.ledger;
   result.textContent=[
    'Credential issuer enrolled: '+(r.issuer_public_key_enrolled?'NAME PRESENT; provenance not independently confirmed':'NO — HOLD'),
    'Original owner ledger: '+l.status,
    'Current source-bound reviews: '+l.current_review_count,
    'Stale or drifted reviews: '+l.stale_review_count,
    'Duplicate reviews: '+l.duplicate_review_count,
    'Invalid review rows: '+l.invalid_review_count,
    'Seven-app handoff: '+r.handoff.status,
    'Runtime cross-app connected: NO',
    'Security controls: '+r.security_control_layers.join(', '),
    'Operational access: '+r.operational_access_tiers.join(', '),
    'Financial books closed by this audit: NO'
   ].join('\n');
   status.textContent='Snapshot read only. No receiver activated or approval recorded.';
  }catch(_){result.textContent='HOLD — No original source accepted.';status.textContent='HOLD — protected source review unavailable.'}
  finally{check.disabled=false}
 });
 verify.addEventListener('click',async()=>{
  if(verify.disabled)return;verify.disabled=true;
  const body=input.value.trim();
  input.value=''; // do not retain external signed evidence or accidental secrets in the DOM
  if(!body||body.length>3000){issuerStatus.textContent='HOLD — Bounded signed issuer evidence required.';verify.disabled=false;return}
  try{
   const res=await window.DDAuth.apiFetch('/api/admin/production-variable-audit-406',
    {method:'POST',headers:{'Content-Type':'application/json'},
    body:JSON.stringify({action:'verify_independent_credential_rotation_722',signed_receipt_json:body})});
   const data=await res.json().catch(()=>null);
   if(!res.ok||!data?.independent_issuer_signature_verified)
    throw Error('External issuer proof missing, expired or cryptographically invalid.');
   issuerStatus.textContent='Ed25519 enrolled issuer signature VERIFIED for '+data.provider+
    ', event '+data.rotation_event_id+'. Deployed credential live validity NOT VERIFIED; books and connectivity HOLD.';
  }catch(_){issuerStatus.textContent='HOLD — Independent issuer proof not established. No credential was rotated.'}
  finally{verify.disabled=false}
 });
})();

// Build 723: manually triggered canonical route/role source and unmeasured
// acceptance-denominator inspection. Does not grant access or score unknowns.
(()=>{
 'use strict';
 const button=document.getElementById('dd723Inspect'),
  status=document.getElementById('dd723Status'),
  result=document.getElementById('dd723Result');
 if(!button||!status||!result||!window.DDAuth?.apiFetch)return;
 button.addEventListener('click',async()=>{
  if(button.disabled)return;button.disabled=true;
  status.textContent='Inspecting current verified Admin source route declarations…';
  try{
   const res=await window.DDAuth.apiFetch(
    '/api/admin/production-variable-audit-406?review=723',
    {method:'GET',cache:'no-store'});
   const data=await res.json().catch(()=>null);
   if(!res.ok||!data?.ok||!data.review723?.inventory||
    data.review723.completion?.build!==723)throw Error('Protected registry unavailable');
   const v=data.review723,inv=v.inventory,baseline=v.completion;
   result.textContent=[
    'Source: '+inv.source,
    'Declared routes/prefix entries (not audited endpoints): '+inv.catalogued_declaration_count,
    'Named inventory groups: '+inv.route_catalog.length,
    ...inv.route_catalog.map(g=>'  '+g.group+' / '+g.module_key+
      ': '+g.declared_entries+' declarations (actual endpoint verification UNKNOWN)'),
    'Access tiers: '+inv.tiers.join(' · '),
    'Five control layers: '+inv.layers.join(' · '),
    'Shared-service contracts: '+inv.shared_service_contracts.length,
    'Source examples:',
    ...inv.route_examples.map(r=>'  '+r.path+' : '+r.classification+
      ' / '+(r.source_module_key||'NO MODULE MAPPING')),
    'Proposed acceptance checks: '+baseline.proposed_check_count+
      ' across '+baseline.scope_count+' proposed module scopes × '+baseline.axis_count+' axes',
    ...baseline.axes.map(a=>a.axis+' — '+a.verification_status+
      ' / approved denominator NONE / verified percent UNKNOWN'),
    'Verified app completion: UNKNOWN',
    'Verified +10 percentage-point gain: NO',
    'Three-Master live transport: '+inv.signed_three_master_transport,
    'T5 original receiver: '+inv.original_host_t5_witness,
    'Real cross-app connection: NO',
    'No new privilege, provider call, finance close or approval recorded.'
   ].join('\n');
   status.textContent='Source-only inventory inspected. Owner-approved denominators and original passing evidence remain UNMEASURED.';
  }catch(_){
   result.textContent='HOLD — Could not verify original source inventory.';
   status.textContent='HOLD — No baseline was approved or inferred.';
  }finally{button.disabled=false;}
 });
})();

// Build 724 owner-clicked source-only three-Master readiness. No transmit action.
(()=>{
 'use strict';
 const button=document.getElementById('dd724Inspect'),
  status=document.getElementById('dd724Status'),
  result=document.getElementById('dd724Result');
 if(!button||!status||!result||!window.DDAuth?.apiFetch)return;
 button.addEventListener('click',async()=>{
  if(button.disabled)return;button.disabled=true;
  status.textContent='Inspecting only current original source-key names; no connection attempted…';
  try{
   const response=await window.DDAuth.apiFetch(
    '/api/admin/production-variable-audit-406?review=724',
    {method:'GET',cache:'no-store'});
   const data=await response.json().catch(()=>null);
   if(!response.ok||!data?.ok||data.review724?.trust?.build!==724)
    throw Error('Protected source unavailable');
   const r=data.review724,t=r.trust;
   result.textContent=[
    'Source contract: '+t.source_contract,
    'Allowed Master source identities: '+t.master_apps.join(' · '),
    'Allowed metadata-only channels: '+t.channels.join(' · '),
    'Configured nonsecret signer/custody key NAMES: '+t.source_pin_names_present.join(', '),
    'Missing key names: '+t.source_pin_names_missing.join(', '),
    'Pinned source is recognized Master: '+(t.pinned_source_is_master?'YES':'NO'),
    'Independent original source signer evidence verified: NO',
    'Independent custody reviewer origin verified: NO',
    'Durable local Admin review receipt is NOT a unique replay transport admission',
    'Unique replay constraint verified: NO',
    'Transport opened: NO',
    'T4 Master governance granted: NO',
    'T5 receiver activated: NO',
    'Cross-app runtime connected: NO',
    'Vercel apps deployed by this inspection: NO',
    'Handoff: source-only evidence, current live ACK still required'
   ].join('\n');
   status.textContent='SOURCE INSPECTED — Original Master connection remains HOLD/NOT VERIFIED. No other app was modified.';
  }catch(_){
   result.textContent='HOLD — Protected Master trust source unavailable.';
   status.textContent='HOLD — No source state or live connection inferred.';
  }finally{button.disabled=false}
 });
})();

// Build 725 — original authenticated Admin, read-only protocol 1.1 status.
(()=>{
 'use strict';
 const button=document.getElementById('dd725Inspect'),
  status=document.getElementById('dd725Status'),
  result=document.getElementById('dd725Result');
 if(!button||!status||!result||!window.DDAuth?.apiFetch)return;
 button.addEventListener('click',async()=>{
  if(button.disabled)return;button.disabled=true;
  status.textContent='Checking only deployed local protocol policy…';
  try{
   const response=await window.DDAuth.apiFetch(
    '/api/admin/production-variable-audit-406?review=725',
    {method:'GET',cache:'no-store'});
   const data=await response.json().catch(()=>null);
   if(!response.ok||!data?.ok||data.review725?.compatibility?.build!==725)
    throw Error('Protected protocol source unavailable');
   const r=data.review725,c=r.compatibility;
   result.textContent=[
    'Devil n Dove local protocol: '+c.local_protocol,
    'Backward-compatible established peer: '+c.backward_compatible_with,
    'Lockstep release required: '+(c.lockstep_release_required?'YES':'NO'),
    'Original 1.0 source health: '+r.legacy_peer_1_0.compatibility,
    'New private media on 1.0: '+r.legacy_peer_new_capability.compatibility,
    'Held peer: '+r.unavailable_peer.compatibility,
    'Local product workflow blocked by held peer: NO',
    'Company/tenant/workspace mismatch: '+r.cross_tenant_negative.status,
    'Source purpose-bound consent and expiry: fail closed',
    'Delegation lifetime maximum: '+c.delegated_capability_max_hours+'h; no subdelegation',
    'Live Master signed handshake: NOT VERIFIED',
    'Physical original-host receiver T5: NOT AUTHORIZED',
    'Peer D1/R2 synchronization: NO',
    'Vercel deployment triggered: NO',
    'Original Build 723 measurable improvement: UNMEASURED'
   ].join('\n');
   status.textContent='SOURCE-ONLY PROTOCOL REVIEW COMPLETE — local releases independent; live integration HOLD.';
  }catch(_){
   result.textContent='HOLD — Original compatibility source unavailable.';
   status.textContent='HOLD — No live peer or consent evidence inferred.';
  }finally{button.disabled=false}
 });
})();

// Build 726 — on-demand source-only Event V2 review; no inter-app network send.
(()=>{
 'use strict';
 const button=document.getElementById('dd726Inspect'),
  status=document.getElementById('dd726Status'),
  result=document.getElementById('dd726Result');
 if(!button||!status||!result||!window.DDAuth?.apiFetch)return;
 button.addEventListener('click',async()=>{
  button.disabled=true;status.textContent='Inspecting local source contract…';
  try{
   const response=await window.DDAuth.apiFetch(
    '/api/admin/production-variable-audit-406?review=726',
    {method:'GET',cache:'no-store'});
   const data=await response.json().catch(()=>null);
   if(!response.ok||!data?.ok||data.review726?.event?.build!==726)
    throw Error('Protected event source unavailable');
   const e=data.review726.event;
   result.textContent=[
    'Envelope: '+e.schema+' / protocol '+e.protocol,
    'Legacy 1.0 peers remain supported for existing health only',
    'Event families: '+e.known_event_types.join(' · '),
    'Proposed operator inbox: '+e.operator_inbox_handoff_target,
    'Local D1 operator review evidence: '+(e.local_d1_review_receipt_supported?'SUPPORTED':'HOLD'),
    'Conditional sequential duplicate review: '+(e.conditional_sequential_dedupe_supported?'SUPPORTED':'HOLD'),
    'Database-enforced unique event admission: NOT VERIFIED',
    'External ACK / delivered dead-letter: NOT VERIFIED',
    'Signed remote event dispatch: NOT ACTIVATED',
    'Offline peers block only dependent event capability',
    'Unrelated local Product and inventory operations continue',
    'Original Windows T5 receiver: '+e.original_t5_receiver
   ].join('\n');
   status.textContent='SOURCE INSPECTED — local operator review only; remote handoff HOLD.';
  }catch(_){result.textContent='HOLD — Protected event source not verified.';
   status.textContent='HOLD — No remote ACK or replay proof inferred.';}
  finally{button.disabled=false;}
 });
})();
