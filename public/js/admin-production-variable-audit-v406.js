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
