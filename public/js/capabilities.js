(()=>{
"use strict";
const esc=v=>String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const label=v=>String(v||"").replaceAll("_"," ").replace(/\b\w/g,c=>c.toUpperCase());

function card(p){
 const proc=(p.related_processes||[]).map(x=>`<span class="capability-process-pill">${esc(x.process_name)}</span>`).join("");
 return `<article class="card capability-profile-card" id="${esc(p.capability_key)}"><p class="small capability-profile-state">Constraints: ${esc(label(p.constraints_state))}</p><h2>${esc(p.display_name)}</h2><p>${esc(p.summary)}</p><dl><dt>Good fit for</dt><dd>${esc(p.suitable_uses)}</dd><dt>Materials</dt><dd>${esc(p.common_materials)}</dd><dt>Known constraints</dt><dd>${esc(p.known_constraints)}</dd><dt>Customer-supplied items</dt><dd>${esc(label(p.customer_supplied_policy))}</dd><dt>Proof / sample</dt><dd>${esc(label(p.proof_sample_policy))}</dd></dl><div class="capability-process-row">${proc}</div><p class="small"><strong>Evidence source:</strong> ${esc(p.source_note)}</p><div class="capability-profile-actions"><a class="btn primary" href="${esc(p.custom_request_href||"/custom-request/")}">Request Custom Work</a><a class="btn" href="/case-studies/?capability=${encodeURIComponent(p.capability_key)}">Approved case studies</a><a class="btn secondary" href="${esc(p.gallery_href||"/gallery/")}">Gallery</a><a class="btn secondary" href="/capabilities/${encodeURIComponent(p.capability_key)}/">Profile page</a></div></article>`;
}

async function readJsonResponse(response){
 const raw=await response.text().catch(()=>"");
 if(!raw.trim()) return {data:null,parse_error:"empty_response"};
 try{return {data:JSON.parse(raw),parse_error:""};}
 catch{return {data:null,parse_error:"invalid_json"};}
}

function renderRecovery(mount,detail){
 mount.dataset.runtimeState="degraded";
 mount.innerHTML=detail
  ? '<section class="card"><h2>Detailed workshop evidence is being refreshed</h2><p class="small">The capability summary above is still available. For current material, size, setting or feasibility questions, send us the project details and we will review them before making any promise.</p><p><a class="btn primary" href="/custom-request/">Ask about Custom Work</a> <a class="btn" href="/capabilities/">All capabilities</a></p></section>'
  : '<section class="card"><h2>Detailed capability profiles are being refreshed</h2><p class="small">You can still use the capability directory above or send us a Custom Work request. We will confirm project-specific materials, limits and feasibility before quoting.</p><p><a class="btn primary" href="/custom-request/">Ask about Custom Work</a></p></section>';
}

async function load(){
 const detail=document.body?.dataset?.capabilityKey||"";
 const mount=document.getElementById(detail?"capabilityProfileMount":"capabilityProfilesMount");
 if(!mount)return;
 try{
  const r=await fetch(`/api/capabilities${detail?`?key=${encodeURIComponent(detail)}`:""}`,{headers:{Accept:"application/json"},cache:"no-store"});
  const parsed=await readJsonResponse(r);
  const d=parsed.data;
  if(!r.ok||!d?.ok){
   const code=String(d?.code||parsed.parse_error||`http_${r.status}`);
   console.warn("Capability profile request unavailable",{code,status:r.status});
   renderRecovery(mount,detail);
   return;
  }
  const profiles=Array.isArray(d.profiles)?d.profiles:[];
  if(!profiles.length){
   console.warn("Capability profile request returned no reviewed profiles",{detail});
   renderRecovery(mount,detail);
   return;
  }
  mount.dataset.runtimeState="ready";
  mount.innerHTML=detail?card(profiles[0]):`<div class="capability-profile-grid">${profiles.map(card).join("")}</div>`;
 }catch(error){
  console.warn("Capability profile request failed",{name:error?.name||"Error"});
  renderRecovery(mount,detail);
 }
}
document.addEventListener("DOMContentLoaded",load);
})();
