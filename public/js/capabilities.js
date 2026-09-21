(()=>{
"use strict";
const esc=v=>String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const label=v=>String(v||"").replaceAll("_"," ").replace(/\b\w/g,c=>c.toUpperCase());
function card(p){
 const proc=(p.related_processes||[]).map(x=>`<span class="capability-process-pill">${esc(x.process_name)}</span>`).join("");
 return `<article class="card capability-profile-card" id="${esc(p.capability_key)}"><p class="small capability-profile-state">Constraints: ${esc(label(p.constraints_state))}</p><h2>${esc(p.display_name)}</h2><p>${esc(p.summary)}</p><dl><dt>Good fit for</dt><dd>${esc(p.suitable_uses)}</dd><dt>Materials</dt><dd>${esc(p.common_materials)}</dd><dt>Known constraints</dt><dd>${esc(p.known_constraints)}</dd><dt>Customer-supplied items</dt><dd>${esc(label(p.customer_supplied_policy))}</dd><dt>Proof / sample</dt><dd>${esc(label(p.proof_sample_policy))}</dd></dl><div class="capability-process-row">${proc}</div><p class="small"><strong>Evidence source:</strong> ${esc(p.source_note)}</p><div class="capability-profile-actions"><a class="btn primary" href="${esc(p.custom_request_href||"/custom-request/")}">Request Custom Work</a><a class="btn" href="/case-studies/?capability=${encodeURIComponent(p.capability_key)}">Approved case studies</a><a class="btn secondary" href="${esc(p.gallery_href||"/gallery/")}">Gallery</a><a class="btn secondary" href="/capabilities/${encodeURIComponent(p.capability_key)}/">Profile page</a></div></article>`;
}
async function load(){
 const detail=document.body?.dataset?.capabilityKey||"";const mount=document.getElementById(detail?"capabilityProfileMount":"capabilityProfilesMount");if(!mount)return;
 try{const r=await fetch(`/api/capabilities${detail?`?key=${encodeURIComponent(detail)}`:""}`,{headers:{Accept:"application/json"}});const d=await r.json();if(!r.ok||!d.ok)throw new Error(d.error||`Capability load failed (${r.status}).`);const rows=Array.isArray(d.profiles)?d.profiles:[];if(!rows.length)throw new Error("No reviewed public capability profile is available.");mount.innerHTML=detail?card(rows[0]):`<div class="capability-profile-grid">${rows.map(card).join("")}</div>`;}
 catch(e){mount.innerHTML=`<section class="card"><h2>Capability profile unavailable</h2><p class="small">${esc(e.message||e)}</p><p><a class="btn" href="/custom-request/">Ask about Custom Work</a></p></section>`;}
}
document.addEventListener("DOMContentLoaded",load);
})();