(()=>{
"use strict";
const mount=document.getElementById("workshopCapabilityAdminMount");if(!mount)return;
const apiFetch=(...a)=>window.DDAuth?.apiFetch?window.DDAuth.apiFetch(...a):fetch(...a);
const esc=v=>String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
let data=null,selected=0;
function parse(v){try{const x=JSON.parse(String(v||"[]"));return Array.isArray(x)?x:[];}catch{return[];}}
function option(v,label,current){return `<option value="${esc(v)}"${String(v)===String(current)?" selected":""}>${esc(label)}</option>`;}
function render(){
 const profiles=data?.profiles||[],processes=data?.processes||[];if(!selected&&profiles.length)selected=Number(profiles[0].workshop_capability_profile_id);
 const p=profiles.find(x=>Number(x.workshop_capability_profile_id)===selected)||profiles[0];if(!p){mount.innerHTML='<p class="small">No profiles found.</p>';return;}
 const keys=new Set(parse(p.related_process_keys_json));
 mount.innerHTML=`<section class="card"><div class="section-heading-row"><div><p class="small">Release 467 Build 209</p><h2>Workshop Capability Profiles</h2><p class="small">Edit reviewed public-facing capability facts. Unknown dimensions, settings and compatibility must stay unknown until measured or owner-supplied.</p></div><a class="btn" href="/capabilities/" target="_blank" rel="noopener">Public capabilities</a></div><label>Profile<select class="input" id="capabilityProfileSelect">${profiles.map(x=>option(x.workshop_capability_profile_id,x.display_name,p.workshop_capability_profile_id)).join("")}</select></label><form id="capabilityProfileForm" class="admin-form-grid" style="margin-top:14px">
<input type="hidden" name="workshop_capability_profile_id" value="${Number(p.workshop_capability_profile_id)}"/>
<label>Display name<input class="input" name="display_name" value="${esc(p.display_name)}" required></label>
<label class="span-2">Summary<textarea class="input" name="summary" rows="3" required>${esc(p.summary)}</textarea></label>
<label class="span-2">Suitable uses<textarea class="input" name="suitable_uses" rows="4" required>${esc(p.suitable_uses)}</textarea></label>
<label class="span-2">Common materials<textarea class="input" name="common_materials" rows="4" required>${esc(p.common_materials)}</textarea></label>
<label class="span-2">Known constraints<textarea class="input" name="known_constraints" rows="5" required>${esc(p.known_constraints)}</textarea></label>
<label>Constraint evidence<select class="input" name="constraints_state">${["unmeasured","owner_confirmed","measured","mixed"].map(x=>option(x,x.replaceAll("_"," "),p.constraints_state)).join("")}</select></label>
<label>Customer-supplied items<select class="input" name="customer_supplied_policy">${["may_be_assessed","not_assessed","not_applicable"].map(x=>option(x,x.replaceAll("_"," "),p.customer_supplied_policy)).join("")}</select></label>
<label>Proof / sample<select class="input" name="proof_sample_policy">${["case_by_case","normally_required","normally_not_required","unknown"].map(x=>option(x,x.replaceAll("_"," "),p.proof_sample_policy)).join("")}</select></label>
<label>Review status<select class="input" name="review_status">${["draft","reviewed","published","hold"].map(x=>option(x,x,p.review_status)).join("")}</select></label>
<label>Gallery search<input class="input" name="gallery_query" value="${esc(p.gallery_query||"")}"></label>
<label><input type="checkbox" name="is_public"${Number(p.is_public||0)===1?" checked":""}> Public after review</label>
<fieldset class="span-2"><legend>Canonical related processes</legend><div class="capability-admin-process-grid">${processes.map(x=>`<label><input type="checkbox" name="related_process_keys" value="${esc(x.process_key)}"${keys.has(x.process_key)?" checked":""}> ${esc(x.process_name)}</label>`).join("")}</div></fieldset>
<label class="span-2">Source note<textarea class="input" name="source_note" rows="4" required>${esc(p.source_note)}</textarea></label>
<div class="span-2"><button class="btn primary" type="submit">Save reviewed profile</button> <span id="capabilityAdminStatus" class="small" aria-live="polite"></span></div>
</form></section>`;
 document.getElementById("capabilityProfileSelect")?.addEventListener("change",e=>{selected=Number(e.target.value);render();});
 document.getElementById("capabilityProfileForm")?.addEventListener("submit",save);
}
async function save(e){e.preventDefault();const f=new FormData(e.currentTarget),status=document.getElementById("capabilityAdminStatus");const body=Object.fromEntries(f.entries());body.action="update";body.workshop_capability_profile_id=Number(body.workshop_capability_profile_id);body.is_public=f.get("is_public")==="on";body.related_process_keys=f.getAll("related_process_keys");status.textContent="Saving…";const r=await apiFetch("/api/admin/workshop-capabilities",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(body)});const d=await r.json().catch(()=>({}));if(!r.ok||!d.ok){status.textContent=d.error||`Save failed (${r.status}).`;return;}data=d;status.textContent=d.message||"Saved.";render();}
async function load(){mount.innerHTML='<section class="card"><p class="small">Loading capability profiles…</p></section>';try{const r=await apiFetch("/api/admin/workshop-capabilities",{cache:"no-store"}),d=await r.json();if(!r.ok||!d.ok)throw new Error(d.error||`Load failed (${r.status}).`);data=d;render();}catch(e){mount.innerHTML=`<section class="card"><h2>Capability profiles unavailable</h2><p class="small">${esc(e.message||e)}</p></section>`;}}
document.addEventListener("DOMContentLoaded",load);
})();