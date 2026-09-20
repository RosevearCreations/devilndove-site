// Release 467 Build 213 — admin Digital Proof workspace.
(() => {
  const ENDPOINT='/api/admin/custom-work-proof';
  const state={data:null,requestId:0};
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const id=v=>Number(v||0)||0;
  const host=()=>document.getElementById('customWorkProof213Mount');
  const msg=(t,e=false)=>{const n=document.getElementById('customWorkProof213Message');if(n){n.textContent=t||'';n.style.color=e?'#ffb4b4':'';}};
  async function api(url=ENDPOINT,init={}){const r=await DDAuth.apiFetch(url,init);const d=await DDAuth.readApiJson(r,{fallbackMessage:'Digital Proof request failed.'});if(!r.ok||!d?.ok)throw new Error(d?.error||`Request failed (${r.status})`);return d;}
  function requestOptions(){return '<option value="">Choose Custom Request…</option>'+(state.data?.requests||[]).map(r=>`<option value="${id(r.custom_request_id)}" ${id(r.custom_request_id)===state.requestId?'selected':''}>#${id(r.custom_request_id)} ${esc(r.product_interest||r.request_type||r.request_key)} • ${esc(r.status||'')}</option>`).join('');}
  function packagingOptions(){return '<option value="">Choose saved Packaging version…</option>'+(state.data?.packaging_candidates||[]).map(v=>`<option value="${id(v.packaging_project_id)}:${id(v.packaging_project_version_id)}">${esc(v.project_name)} • ${esc(v.version_label||('Version '+v.version_number))} • ${esc(v.review_status||'')}</option>`).join('');}
  function stagePhotoOptions(){return '<option value="">Choose customer-safe stage photo…</option>'+(state.data?.stage_photos||[]).map(p=>`<option value="${id(p.custom_order_stage_photo_id)}">${esc(p.stage_key||'stage')} • ${esc(p.image_caption||p.image_url||'photo')}</option>`).join('');}
  function proofRows(){
    const rows=state.data?.readiness?.versions||[];
    if(!rows.length)return '<p class="small">No proof versions yet.</p>';
    return `<div class="admin-table-wrap"><table><thead><tr><th>Version</th><th>Status</th><th>Source</th><th>Customer response</th><th>Internal production</th><th>Private link</th><th>Actions</th></tr></thead><tbody>${rows.map(v=>{
      const vid=id(v.custom_request_proof_version_id),url=`/custom-request/proof/?token=${encodeURIComponent(v.proof_token||'')}`;
      return `<tr><td><strong>v${Number(v.version_number||0)}</strong><br><span class="small">${esc(v.proof_title||'')}</span></td><td>${esc(v.proof_status||'')}<br><span class="small">${esc(v.updated_at||'')}</span></td><td>${esc(v.source_kind||'')}</td><td class="small">${v.approved_at?'Approved '+esc(v.approved_at):v.changes_requested_at?'Changes requested '+esc(v.changes_requested_at):'No final response'}<br>${esc(v.customer_response_note||'')}</td><td class="small">${Number(v.internal_production_approval_required||0)===1?esc(v.internal_production_approval_status||'pending'):'Not required'}</td><td>${['draft','superseded','expired'].includes(String(v.proof_status||''))?'<span class="small">Inactive</span>':`<a href="${esc(url)}" target="_blank" rel="noopener">Open</a><br><button class="btn small" data-proof-copy="${esc(url)}" type="button">Copy link</button>`}</td><td><div style="display:flex;gap:5px;flex-wrap:wrap">${['draft','changes_requested'].includes(String(v.proof_status||''))?`<button class="btn small" data-proof-activate="${vid}" type="button">Activate link</button>`:''}${!['expired','superseded'].includes(String(v.proof_status||''))?`<button class="btn small secondary" data-proof-expire="${vid}" type="button">Expire</button>`:''}${Number(v.internal_production_approval_required||0)===1?`<button class="btn small" data-proof-internal="${vid}:approved" type="button">Internal approve</button><button class="btn small secondary" data-proof-internal="${vid}:rejected" type="button">Reject</button>`:''}</div></td></tr>`;
    }).join('')}</tbody></table></div>`;
  }
  function readiness(){
    const r=state.data?.readiness;if(!r)return '';
    return `<section class="card"><h3 style="margin-top:0">Production proof gate</h3><p class="small"><strong>Proof required:</strong> ${r.proof_required?'Yes':'No'} • <strong>Customer approved:</strong> ${r.customer_approved?'Yes':'No'} • <strong>Internal approval:</strong> ${r.internal_production_approval_required?(r.internal_production_approved?'Approved':'Required / not approved'):'Not required'} • <strong>Production ready from proof gate:</strong> ${r.production_ready?'YES':'NO'}</p>${(r.blockers||[]).length?`<ul>${r.blockers.map(x=>`<li>${esc(x)}</li>`).join('')}</ul>`:''}<p class="small">Customer approval is not publication approval. This gate does not start production, consume Inventory, capture payment, publish media, or send provider messages.</p></section>`;
  }
  function createForm(){
    return `<form id="customWorkProof213Form" class="card"><h3 style="margin-top:0">Create proof version</h3><div class="admin-form-grid">
      <label>Title<input class="input" name="proof_title" maxlength="220" placeholder="Design proof for review"></label>
      <label>Expiry (optional)<input class="input" name="expires_at" type="datetime-local"></label>
      <label>Source<select class="input" name="source_kind" id="customWorkProof213Source"><option value="text_only">Text-only proof</option><option value="customer_safe_url">Customer-safe image/URL</option><option value="stage_photo">Approved customer-safe stage photo</option><option value="packaging_version">Immutable Packaging saved version</option></select></label>
      <label>Customer-safe URL<input class="input" name="proof_preview_url" placeholder="/assets/... or https://..."></label>
      <label>Stage photo<select class="input" name="custom_order_stage_photo_id">${stagePhotoOptions()}</select></label>
      <label>Packaging saved version<select class="input" id="customWorkProof213Packaging">${packagingOptions()}</select></label>
      <label style="grid-column:1/-1">Customer message<textarea class="input" name="customer_message" rows="3"></textarea></label>
      <label style="grid-column:1/-1">Source/internal note<textarea class="input" name="source_note" rows="2"></textarea></label>
      <label><input type="checkbox" name="internal_production_approval_required" value="1"> Require separate internal production approval after customer approval</label>
    </div><button class="btn primary" type="submit">Create private proof draft</button></form>`;
  }
  function render(){
    const h=host();if(!h)return;
    const req=state.data?.request;
    h.innerHTML=`<section class="card"><p class="eyebrow">Release 467 • Build 213</p><h2 style="margin-top:0">Digital proof & customer approval</h2><p class="small">Create versioned private proofs, activate one customer-safe link at a time, record exact approval/changes-requested evidence, and keep internal production approval separate when required.</p><label>Custom Request<select class="input" id="customWorkProof213Request">${requestOptions()}</select></label><div id="customWorkProof213Message" class="small" role="status" aria-live="polite"></div></section>
      ${req?readiness()+createForm()+`<section class="card"><h3 style="margin-top:0">Proof version history</h3>${proofRows()}</section>`:''}`;
    bind();
  }
  async function load(requestId=state.requestId){try{const q=requestId?`?request_id=${requestId}`:'';state.data=await api(ENDPOINT+q);state.requestId=id(state.data.request?.custom_request_id||requestId||0);render();msg(requestId?'Proof workspace loaded.':'Choose a Custom Request.');}catch(e){if(host())host().innerHTML=`<section class="card"><h2>Digital Proof unavailable</h2><p>${esc(e.message)}</p><button class="btn" id="customWorkProof213Retry">Retry</button></section>`;document.getElementById('customWorkProof213Retry')?.addEventListener('click',()=>load());}}
  async function post(payload){try{msg('Saving…');state.data=await api(ENDPOINT,{method:'POST',body:JSON.stringify({custom_request_id:state.requestId,...payload})});render();msg(state.data.message||'Saved.');}catch(e){msg(e.message,true);}}
  function bind(){
    document.getElementById('customWorkProof213Request')?.addEventListener('change',e=>{state.requestId=id(e.target.value);load(state.requestId);});
    document.getElementById('customWorkProof213Form')?.addEventListener('submit',e=>{e.preventDefault();const p=Object.fromEntries(new FormData(e.currentTarget).entries());const pack=document.getElementById('customWorkProof213Packaging')?.value||'';if(pack.includes(':'))[p.packaging_project_id,p.packaging_project_version_id]=pack.split(':');p.action='create_version';p.internal_production_approval_required=p.internal_production_approval_required==='1'?1:0;post(p);});
    document.querySelectorAll('[data-proof-copy]').forEach(b=>b.onclick=async()=>{await navigator.clipboard.writeText(location.origin+b.dataset.proofCopy);msg('Private proof link copied.');});
    document.querySelectorAll('[data-proof-activate]').forEach(b=>b.onclick=()=>post({action:'activate_link',custom_request_proof_version_id:id(b.dataset.proofActivate)}));
    document.querySelectorAll('[data-proof-expire]').forEach(b=>b.onclick=()=>post({action:'expire_version',custom_request_proof_version_id:id(b.dataset.proofExpire),note:'Expired from Build 213 admin workspace.'}));
    document.querySelectorAll('[data-proof-internal]').forEach(b=>b.onclick=()=>{const [vid,status]=b.dataset.proofInternal.split(':');post({action:'internal_review',custom_request_proof_version_id:id(vid),internal_production_approval_status:status,internal_production_approval_note:`Internal production review: ${status}`});});
  }
  document.addEventListener('DOMContentLoaded',()=>load(id(new URLSearchParams(location.search).get('request_id')||0)));
})();
