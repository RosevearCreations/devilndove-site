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

// Build 726: owner-triggered original D1 local evidence Inbox. No sender.
(()=>{
 'use strict';
 const button=document.getElementById('dd726Inspect'),
  status=document.getElementById('dd726Status'),
  result=document.getElementById('dd726Result');
 if(!button||!status||!result||!window.DDAuth?.apiFetch)return;
 button.addEventListener('click',async()=>{
  if(button.disabled)return;button.disabled=true;
  status.textContent='Reading a bounded local source-only event window…';
  try{
   const response=await window.DDAuth.apiFetch(
    '/api/admin/production-variable-audit-406?review=726',
    {method:'GET',cache:'no-store'});
   const data=await response.json().catch(()=>null);
   if(!response.ok||!data?.ok||data.review726?.contract?.build!==726)
    throw Error('Protected original event source unavailable');
   const state=data.review726,items=state.inbox?.events||[];
   result.textContent=[
    'Schema: '+state.contract.schema_id+'; protocol 1.1, legacy 1.0 health unchanged',
    'D1 unique deduped local event storage: '+state.contract.db_schema,
    'Source-only families: '+state.contract.approved_source_event_families.join(' · '),
    'Original reviewed events (15 maximum): '+items.length,
    ...items.map(e=>e.event_id+' · '+e.event_type+' → '+e.target_app+
     ' · '+e.local_disposition+' · '+(e.created_at||'date unverified')),
    'External message sent: NO',
    'Live Master ACK / receiver: NOT VERIFIED',
    'Remote consumer Inbox delivered: NO',
    'D1 ACK-review does not establish external transport or customer consent',
    'Inventory Fit to screen and existing Quick stock + HST remain local UI'
   ].join('\n');
   status.textContent=state.inbox?.source?
    'Local D1 review loaded. Peer delivery and live ACK remain HOLD.':
    'HOLD — local D1 source readback unavailable.';
  }catch(_){
   result.textContent='HOLD — protected local event source not available.';
   status.textContent='HOLD — No remote delivery or event receipt inferred.';
  }finally{button.disabled=false}
 });
})();


/* Build 729 — never auto-probe a Master, rotate a key, dispatch a withdrawal or purge records. */
document.addEventListener('DOMContentLoaded',()=>{
 const root=document.getElementById('privacyOperations729');
 if(!root)return;
 const status=root.querySelector('#privacy729Status'),results=root.querySelector('#privacy729Results');
 const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const safeUuid=s=>/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(String(s||''));
 const api=(url,opts)=>window.DDAuth?.apiFetch?window.DDAuth.apiFetch(url,opts):fetch(url,{credentials:'same-origin',...opts});
 async function parse(response){
  const data=await response.json().catch(()=>null);
  if(!response.ok||!data?.ok)throw Error(String(data?.code||data?.error||'HOLD_ORIGINAL_ADMIN_DATA_UNAVAILABLE'));
  return data;
 }
 function setStatus(message){status.textContent=message;}
 function render(data){
  const view=data.review729;if(!view)throw Error('HOLD_BUILD729_REVIEW_UNAVAILABLE');
  const key=view.keyring||{},peers=Array.isArray(view.peers)?view.peers:[],
    events=Array.isArray(view.withdrawal_events)?view.withdrawal_events:[],
    reviews=Array.isArray(view.retention_reviews)?view.retention_reviews:[];
  results.innerHTML=`
   <div class="competitive-summary-grid">
    <div class="metric-card"><strong>${esc(key.state||'HOLD')}</strong><span>Keyring configuration (not canary proof)</span></div>
    <div class="metric-card"><strong>${esc(view.schema_ready?'D1 READY':'HOLD D1')}</strong><span>Original custody schema</span></div>
    <div class="metric-card"><strong>${esc(view.counters?.encrypted_evidence??'Unknown')}</strong><span>Encrypted vault records</span></div>
    <div class="metric-card"><strong>${esc(key.latest_ciphertexts_needing_rotation??'Unknown')}</strong><span>Current versions needing key rotation</span></div>
   </div>
   <p class="small">Current key ID: ${esc(key.active_key_id||'Not configured')} · Keys configured: ${esc(key.configured_key_count??0)} · Source ciphertexts: ${esc(key.current_ciphertexts??0)}. No secret, plaintext or live encryption key is displayed. A successful key canary is shown only in the result of the explicit check.</p>
   <h3>Independent original Master enrollment &amp; consent delivery</h3>
   <p class="small">Only an actual signed response from the configured peer plus a durable D1 receipt qualifies as a fresh live challenge proof. It does not demonstrate remote consent deletion, publication recall or receiver activation.</p>
   <div class="admin-table-wrap"><table><thead><tr><th>Original Master</th><th>Enrollment state</th><th>Proof time</th><th>Held withdrawal events</th><th>Signed delivery ACKs</th><th>Over 24 hours</th><th>Over 7 days</th></tr></thead>
   <tbody>${peers.map(p=>`<tr><td>${esc(p.peer_app)}</td><td>${esc(p.state)}</td><td>${esc(p.latest_proof_at||'None')}</td>
     <td>${esc(p.held)}</td><td>${esc(p.signed_withdrawal_acks)}</td><td>${esc(p.aged_one_day)}</td><td>${esc(p.aged_seven_days)}</td></tr>`).join('')||'<tr><td colspan="7">No peer evidence.</td></tr>'}</tbody></table></div>
   <h3>Unacknowledged / recent withdrawal evidence (bounded)</h3>
   <div class="admin-table-wrap"><table><thead><tr><th>Event ID</th><th>Destination</th><th>Delivery evidence</th><th>Created</th></tr></thead><tbody>
    ${events.map(e=>`<tr><td><code>${esc(e.event_id)}</code></td><td>${esc(e.target_app)}</td><td>${esc(e.delivery_state)}</td><td>${esc(e.created_at)}</td></tr>`).join('')||'<tr><td colspan="4">No source events recorded or D1 unavailable.</td></tr>'}
   </tbody></table></div>
   <h3>Supervised retention reviews (bounded)</h3>
   <div class="admin-table-wrap"><table><thead><tr><th>Review ID</th><th>Vault ID</th><th>Review</th><th>Eligibility</th></tr></thead><tbody>
    ${reviews.map(r=>`<tr><td><code>${esc(r.review_id)}</code></td><td><code>${esc(r.evidence_id)}</code></td>
    <td>${esc(r.review_state)}</td><td>${esc(r.eligibility)}</td></tr>`).join('')||'<tr><td colspan="4">No retention reviews recorded or D1 unavailable.</td></tr>'}
   </tbody></table></div>
   <p class="small">Local vault purge receipts: ${esc(view.counters?.vault_purge_receipts??'Unknown')}. Automatic purge: OFF. Automatic delivery/retries: OFF. Other applications' historical D1/R2 records and third-party publication are not deleted by this workflow.</p>`;
 }
 async function refresh(){
  setStatus('Reading original Admin D1 and Cloudflare configuration status…');
  const data=await parse(await api('/api/admin/production-variable-audit-406?review=729',{method:'GET',cache:'no-store'}));
  render(data);setStatus('Current read-only status loaded. No secret values or automatic actions.');
 }
 async function post(action,other={}){
  const response=await api('/api/admin/production-variable-audit-406',{
   method:'POST',headers:{'Content-Type':'application/json'},cache:'no-store',
   body:JSON.stringify({action,owner_review_confirmed:true,...other})});
  return parse(response);
 }
 async function handle(button,fn){
  if(button.disabled)return;
  button.disabled=true;
  try{await fn();}catch(e){setStatus('HOLD — '+String(e.message||e).slice(0,150));}
  finally{button.disabled=false;}
 }
 root.querySelector('#privacy729Refresh')?.addEventListener('click',e=>
  handle(e.currentTarget,refresh));
 root.querySelector('#privacy729Keyring')?.addEventListener('click',e=>
  handle(e.currentTarget,async()=>{
   setStatus('Validating active AES-256-GCM key using an in-memory canary…');
   const out=await post('verify_keyring_729');
   setStatus(out.code+' — in-memory proof only. No historic key rotation or Cloudflare setting change.');
  }));
 root.querySelector('#privacy729Probe')?.addEventListener('click',e=>
  handle(e.currentTarget,async()=>{
   const target=root.querySelector('#privacy729Peer')?.value;
   if(!['ai-data-platform','rosevear-ai-hub','rosevear-comms-hub'].includes(target))throw Error('Unknown receiver');
   if(!window.confirm('Contact the original '+target+' HTTPS endpoint and record a verified live challenge only if its pinned signature checks out?'))return;
   setStatus('Contacting original enrolled peer; no simulated ACK accepted…');
   const out=await post('probe_peer_729',{target_app:target});
   setStatus(out.code+' · Immutable original receipt '+out.proof_id);
   await refresh();
  }));
 root.querySelector('#privacy729Submit')?.addEventListener('click',e=>
  handle(e.currentTarget,async()=>{
   const action=root.querySelector('#privacy729Action')?.value;
   const id=root.querySelector('#privacy729Id')?.value.trim();
   if(!safeUuid(id))throw Error('Enter the exact 36-character original UUID');
   const aliases={retention_prepare_728:'evidence_id',retention_approve_728:'review_id',
    retention_execute_728:'review_id',dispatch_withdrawal_728:'event_id'};
   if(!aliases[action])throw Error('Unknown owner action');
   const destructive=action==='retention_execute_728';
   if(!window.confirm((destructive?'PERMANENT VAULT CIPHERTEXT PURGE: ':'Owner-only verified action: ')+
    action+' on exact '+id+'? D1 approvals, holds and live peer signatures must still pass.'))return;
   setStatus('Submitting guarded Admin action…');
   const out=await post(action,{[aliases[action]]:id});
   setStatus((out.code||'ACTION_PROCESSED')+' — verified original server readback. Check status and retain the receipt ID.');
   await refresh();
  }));
});


/* Build 730: source-only D1 heartbeat and two-person dead-letter operator actions. */
document.addEventListener('DOMContentLoaded',()=>{
 const root=document.getElementById('privacyOperations730');
 if(!root)return;
 const $=id=>root.querySelector('#'+id),status=$('privacy730Status'),out=$('privacy730Results');
 const call=(url,options)=>window.DDAuth?.apiFetch?window.DDAuth.apiFetch(url,options):
  fetch(url,{credentials:'same-origin',...options});
 const uuid=s=>/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(s);
 $('privacy730Refresh').addEventListener('click',async()=>{
  status.textContent='Reading original D1 state…';
  try{
   const response=await call('/api/admin/production-variable-audit-406?review=730');
   const data=await response.json();
   if(!response.ok||!data.ok||!data.review730)throw Error('HOLD_ORIGINAL_SOURCE_NOT_READY');
   const v=data.review730;
   out.textContent=JSON.stringify({scheduler:v.scheduler,latest_tick:v.latest_scheduled_tick,
    auto_signed_ack_count:v.auto_signed_ack_count,dead_letter_count:v.dead_letter_count,
    key_rotation:v.source?.keyring?.latest_ciphertexts_needing_rotation,
    alerts:v.alerts,queued_review:v.queued_review},null,2);
   status.textContent='Original D1 readback complete. A tick or ACK never proves deletion on external platforms.';
  }catch{status.textContent='HOLD — protected privacy automation source unavailable.';}
 });
 for(const [id,action] of [['privacy730Record','review_dead_letter_730'],['privacy730Approve','approve_dead_letter_730']]){
  $(id).addEventListener('click',async()=>{
   const event_id=$('privacy730Event').value.trim(),reason_code=$('privacy730Reason').value.trim();
   const review_id=$('privacy730Review').value.trim();
   if(!uuid(event_id)||!/^[A-Z0-9_]{4,80}$/.test(reason_code)||
      (action==='approve_dead_letter_730'&&!uuid(review_id))){
    status.textContent='Enter an exact UUID and uppercase reason code.';return;
   }
   if(!window.confirm(action==='review_dead_letter_730'?
    'Record an immutable original review? A different Admin must approve.':
    'Approve this original review as a different Admin? This requeues locally but never sends automatically from the browser.'))return;
   $(id).disabled=true;
   try{
    const response=await call('/api/admin/privacy-retry-730',{method:'POST',
     headers:{'Content-Type':'application/json','Origin':location.origin},
     body:JSON.stringify({action,event_id,reason_code,review_id,owner_review_confirmed:true})});
    const data=await response.json().catch(()=>({}));
    if(!response.ok||!data.ok)throw Error(String(data.code||'HOLD_REVIEW_NOT_ACCEPTED'));
    out.textContent=JSON.stringify(data,null,2);
    status.textContent='Original D1 receipt recorded. No Master delivery or deletion inferred.';
   }catch{status.textContent='HOLD — review rejected or not independently authorized.';}
   finally{$(id).disabled=false}
  });
 }
});


/* Build 731: operator-requested, read-only privacy health and evidence review. */
document.addEventListener('DOMContentLoaded',()=>{
 const root=document.getElementById('privacyOperations730');
 const button=root?.querySelector('#privacy731Refresh'),out=root?.querySelector('#privacy731Results');
 if(!button||!out)return;
 button.addEventListener('click',async()=>{
  button.disabled=true;out.textContent='Checking original D1 evidence…';
  try{
   const url='/api/admin/production-variable-audit-406?review=731';
   const response=await (window.DDAuth?.apiFetch?window.DDAuth.apiFetch(url):
    fetch(url,{credentials:'same-origin'}));
   const body=await response.json();
   if(!response.ok||!body?.ok||!body.review731)throw Error('HOLD_ORIGINAL_D1');
   const x=body.review731;
   out.textContent=JSON.stringify({state:x.state||x.scheduler_health,
    signed_delivery_evidence:x.delivery_evidence,
    counters:x.counters,alerts:x.alerts,
    rotation:x.rotation,
    sample_count:x.queue_sample_bounded,
    full_queue_sla_certified:x.full_queue_sla_certified,
    external_data_removed_verified:x.external_data_removed_verified},null,2);
  }catch{out.textContent='HOLD — original privacy health and signed evidence cannot be verified.';}
  finally{button.disabled=false;}
 });
});


/* Build 732: explicit operator-requested, read-only local D1 compliance status. */
document.addEventListener('DOMContentLoaded',()=>{
 const root=document.getElementById('privacyOperations730'),
 button=root?.querySelector('#privacy732Refresh'),out=root?.querySelector('#privacy732Results');
 if(!button||!out)return;
 button.addEventListener('click',async()=>{
  button.disabled=true;out.textContent='Checking original privacy custody and SLA…';
  try{
   const url='/api/admin/production-variable-audit-406?review=732';
   const response=await (window.DDAuth?.apiFetch?window.DDAuth.apiFetch(url):
    fetch(url,{credentials:'same-origin'}));
   const data=await response.json().catch(()=>null);
   if(!response.ok||!data?.ok||!data.review732)throw Error('HOLD_UNVERIFIED_ORIGINAL_D1');
   const x=data.review732;
   out.textContent=JSON.stringify({state:x.state||x.automation_recovery,
    cross_application_compliance:x.cross_application_compliance,
    privacy_sla_escalations:x.privacy_sla_escalations,
    key_custody:x.key_custody,
    queue_evidence_complete:x.queue_evidence_complete,
    cross_application_delivery_or_remote_erasure_proven:x.cross_application_delivery_or_remote_erasure_proven},null,2);
  }catch{out.textContent='HOLD — independent original source evidence unavailable.';}
  finally{button.disabled=false;}
 });
});


/* Build 733: explicit Admin-only read and supervised original D1 closure actions. */
document.addEventListener('DOMContentLoaded',()=>{
 const root=document.getElementById('privacy733Command');if(!root)return;
 const $=id=>root.querySelector('#'+id),out=$('privacy733Results');
 const uuid=s=>/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(s);
 const reason=s=>/^[A-Z0-9_]{4,80}$/.test(s);
 const endpoint='/api/admin/privacy-command-centre-733';
 const call=(options={})=>window.DDAuth?.apiFetch?
  window.DDAuth.apiFetch(endpoint,options):fetch(endpoint,{credentials:'same-origin',...options});
 $('privacy733Refresh').addEventListener('click',async()=>{
  $('privacy733Refresh').disabled=true;out.textContent='Reading original source evidence…';
  try{
   const r=await call(),d=await r.json();
   if(!r.ok||!d.ok)throw Error('HOLD_SOURCE_READBACK');
   out.textContent=JSON.stringify({scheduler:d.scheduler_state,
    seven_application_matrix:d.seven_application_matrix,latest_tick:d.latest_tick,
    independent_key_lineage_witness_count:d.independent_key_lineage_witness_count,
    remote_erasure_verified:d.remote_erasure_verified,
    old_key_retirement_authorized:d.old_key_retirement_authorized},null,2);
  }catch{out.textContent='HOLD — independently verified original D1 custody is unavailable.';}
  finally{$('privacy733Refresh').disabled=false;}
 });
 const act=async(button,body,label)=>{
  if(!window.confirm(label))return;
  button.disabled=true;out.textContent='Verifying original D1…';
  try{
   const r=await call({method:'POST',headers:{'Content-Type':'application/json'},
    body:JSON.stringify({...body,owner_review_confirmed:true})});
   const d=await r.json().catch(()=>({}));
   if(!r.ok||!d.ok)throw Error('HOLD_ORIGINAL_APPROVAL');
   out.textContent=JSON.stringify(d,null,2);
  }catch{out.textContent='HOLD — original signature, distinct-Admin, lineage or D1 constraints rejected this action.';}
  finally{button.disabled=false;}
 };
 $('privacy733RecordReview').addEventListener('click',()=>{
  const event_id=$('privacy733Event').value.trim(),reason_code=$('privacy733Reason').value.trim();
  if(!uuid(event_id)||!reason(reason_code)){out.textContent='Enter exact event UUID and uppercase reason code.';return;}
  act($('privacy733RecordReview'),{action:'review_sla_733',event_id,reason_code},
   'Record an immutable source signed ACK review? Independent Admin approval remains required.');
 });
 $('privacy733ApproveReview').addEventListener('click',()=>{
  const review_id=$('privacy733Review').value.trim(),reason_code=$('privacy733Reason').value.trim();
  if(!uuid(review_id)||!reason(reason_code)){out.textContent='Enter original review UUID and exact uppercase reason code.';return;}
  act($('privacy733ApproveReview'),{action:'approve_sla_733',review_id,reason_code},
   'Confirm you are a different Administrator approving this source-only SLA closure? No remote erasure is claimed.');
 });
 $('privacy733Witness').addEventListener('click',()=>{
  const evidence_id=$('privacy733Evidence').value.trim(),
   target_version=Number($('privacy733Version').value),
   reason_code=$('privacy733WitnessReason').value.trim();
  if(!uuid(evidence_id)||!Number.isSafeInteger(target_version)||target_version<2||target_version>999||
     !reason(reason_code)){out.textContent='Enter evidence UUID, latest version 2–999 and uppercase reason.';return;}
  act($('privacy733Witness'),{action:'witness_key_lineage_733',evidence_id,target_version,reason_code},
   'Record an independent original ciphertext metadata witness? This is NOT decryption proof or key retirement authority.');
 });
});


/* Build 734: on-demand original signed Master enrollment evidence; no sends or authority change. */
document.addEventListener('DOMContentLoaded',()=>{
 const button=document.getElementById('privacy734Refresh'),
  out=document.getElementById('privacy734Results');
 if(!button||!out)return;
 button.addEventListener('click',async()=>{
  button.disabled=true;out.textContent='Checking original signed peer enrollment…';
  try{
   const url='/api/admin/privacy-readiness-734';
   const res=await (window.DDAuth?.apiFetch?
    window.DDAuth.apiFetch(url):fetch(url,{credentials:'same-origin'}));
   const json=await res.json().catch(()=>null);
   if(!res.ok||!json?.ok)throw Error('HOLD_ORIGINAL_SOURCE_AUTHORITY');
   out.textContent=JSON.stringify({status:json.status,peers:json.peers,
    external_privacy_sending_authorized:json.external_privacy_sending_authorized,
    owner_activation_received:json.owner_activation_received,
    worker_environment_activation_verified:json.worker_environment_activation_verified},null,2);
  }catch{out.textContent='HOLD — original Master signed enrollment authority unavailable.';}
  finally{button.disabled=false;}
 });
});


/* Build 735: source-only recovery email acceptance and provider configuration.
   No external mail test, customer or credential details, and no implicit GREEN. */
document.addEventListener('DOMContentLoaded',()=>{
 const button=document.getElementById('privacy735Refresh'),out=document.getElementById('privacy735Results');
 if(!button||!out)return;
 button.addEventListener('click',async()=>{
  button.disabled=true;out.textContent='Checking original D1 recovery delivery status…';
  try{
   const uri='/api/admin/privacy-readiness-734?review=recovery735';
   const response=await(window.DDAuth?.apiFetch?window.DDAuth.apiFetch(uri):fetch(uri,{credentials:'same-origin'}));
   const d=await response.json().catch(()=>null);
   if(!response.ok||!d?.ok)throw Error('HOLD_ORIGINAL_READBACK');
   out.textContent=JSON.stringify({
    status:d.status,provider_configuration_present:d.provider_configuration_present,
    original_provider_acceptances_not_inbox_deliveries:d.original_provider_acceptances_not_inbox_deliveries,
    original_reset_requests_last_24h:d.original_reset_requests_last_24h,
    original_pending_unused_reset_links:d.original_pending_unused_reset_links,
    original_unconfirmed_unsent_reset_tokens:d.original_unconfirmed_unsent_reset_tokens,
    original_abuse_attempts_last_24h:d.original_abuse_attempts_last_24h,
    actual_external_inbox_delivery_verified:d.actual_external_inbox_delivery_verified,
    genuine_owner_consented_inbox_pilot_pending:d.genuine_owner_consented_inbox_pilot_pending
   },null,2);
  }catch{out.textContent='HOLD — original D1 or verified Admin permission unavailable.';}
  finally{button.disabled=false;}
 });
});


/* Build 736: user-initiated original registered Admin inbox pilot. No auto-send. */
document.addEventListener('DOMContentLoaded',()=>{
 const root=document.getElementById('recovery736OwnerInbox');if(!root)return;
 const $=id=>root.querySelector('#'+id),out=$('recovery736Results');
 const url='/api/admin/recovery-inbox-pilot-736';
 let pilotId='';
 const call=opts=>window.DDAuth?.apiFetch?
  window.DDAuth.apiFetch(url,opts):fetch(url,{credentials:'same-origin',...opts});
 const display=d=>{out.textContent=JSON.stringify({
  status:d.status,provider_configuration_present:d.provider_configuration_present,
  provider_api_acceptance_observed:d.provider_api_acceptance_observed,
  owner_inbox_code_confirmed:d.owner_inbox_code_confirmed,
  provider_delivered_webhook_verified:d.provider_delivered_webhook_verified,
  actual_customer_reset_delivery_verified:d.actual_customer_reset_delivery_verified,
  original_expires_at:d.original_expires_at,
  wrong_code_attempts:d.wrong_code_attempts,
  original_expires_in_minutes:d.original_expires_in_minutes
 },null,2);};
 async function read(){
  const button=$('recovery736Refresh');button.disabled=true;
  try{
   const response=await call(),d=await response.json().catch(()=>({}));
   if(!response.ok||!d.ok)throw Error('HOLD_SOURCE_STATUS');
   pilotId=d.original_pilot_id||'';
   display(d);
  }catch{out.textContent='HOLD — independently verified Admin and original D1 required.';}
  finally{button.disabled=false;}
 }
 async function write(button,body){
  button.disabled=true;
  try{
   const response=await call({method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
   const d=await response.json().catch(()=>({}));
   if(!response.ok||!d.ok){out.textContent=d.status||'HOLD_ORIGINAL_SOURCE_REJECTED';return false;}
   if(d.original_pilot_id)pilotId=d.original_pilot_id;
   display(d);return true;
  }catch{out.textContent='HOLD — original Admin, D1, Resend or network readback unverified.';return false;}
  finally{button.disabled=false;}
 }
 $('recovery736Refresh').addEventListener('click',read);
 $('recovery736Start').addEventListener('click',async()=>{
  if(!$('recovery736Consent').checked){
   out.textContent='HOLD — check express registered Admin inbox consent before sending.';return;
  }
  if(!window.confirm('Send exactly one verification email to the currently authenticated Admin registered mailbox? This will not email customers or reset any password.'))return;
  const success=await write($('recovery736Start'),{action:'start',
   consent_confirmed:true,purpose:'OWNER_REGISTERED_INBOX_PILOT'});
  $('recovery736Consent').checked=false;
  if(success)$('recovery736Code').value='';
 });
 $('recovery736Confirm').addEventListener('click',async()=>{
  const code=$('recovery736Code').value.trim().toUpperCase();
  $('recovery736Code').value='';
  if(!/^[0-9A-F]{32}$/.test(code)||!pilotId){
   out.textContent='HOLD — load your original pilot and enter the 32-character code from your registered inbox.';return;
  }
  await write($('recovery736Confirm'),{action:'confirm',pilot_id:pilotId,code});
 });
});
