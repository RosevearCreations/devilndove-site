// Release 467 Build 213 — private Digital Proof customer review.
document.addEventListener('DOMContentLoaded',()=>{
  const mount=document.getElementById('customRequestProofMount');if(!mount)return;
  const token=new URLSearchParams(location.search).get('token')||'';
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const msg=(t,e=false)=>{const n=document.getElementById('customProofMessage');if(n){n.textContent=t||'';n.style.color=e?'#b00020':'';}};
  async function call(init){const r=await fetch('/api/custom-request-proof'+(init?'':`?token=${encodeURIComponent(token)}`),init);const d=await r.json().catch(()=>null);if(!r.ok||!d?.ok)throw new Error(d?.error||'Proof could not be loaded.');return d;}
  function preview(p){
    if(p.source_kind==='packaging_version'&&p.packaging_artifact_url)return `<div class="card" style="margin-top:12px"><img src="${esc(p.packaging_artifact_url)}" alt="Saved Packaging proof version ${esc(p.version_number)}" style="max-width:100%;height:auto"></div>`;
    if(p.preview_url)return `<div class="card" style="margin-top:12px"><img src="${esc(p.preview_url)}" alt="Customer proof preview" style="max-width:100%;height:auto"></div>`;
    return '<div class="card small" style="margin-top:12px">This proof is text-based. Review the title, message and notes below.</div>';
  }
  function render(p){
    const responded=['approved','changes_requested'].includes(String(p.proof_status||''));
    mount.innerHTML=`<div style="display:flex;justify-content:space-between;gap:12px;flex-wrap:wrap"><div><span class="badge">Private proof • Version ${esc(p.version_number)}</span><h2>${esc(p.title)}</h2><p>${esc(p.customer_message||'Please review this proof and tell us whether it is approved or needs changes.')}</p></div><span class="status-note">${esc(p.proof_status)}</span></div>
      ${preview(p)}
      ${p.source_note?`<p class="small"><strong>Proof note:</strong> ${esc(p.source_note)}</p>`:''}
      <div class="card" style="margin-top:14px"><strong>Important:</strong> Approving this design proof confirms this exact version for the custom-work process. It does not authorize public posting, social media use, payment, or automatic production.</div>
      ${responded?`<div class="card" style="margin-top:14px"><strong>${p.proof_status==='approved'?'Approved':'Changes requested'}</strong><p class="small">${esc(p.customer_response_note||'')}</p></div>`:`<form id="customProofResponseForm" class="card" style="margin-top:14px"><label>Your note<textarea class="input" name="customer_response_note" rows="4" placeholder="Optional for approval; please describe requested changes if needed."></textarea></label><div style="display:flex;gap:10px;flex-wrap:wrap;margin-top:10px"><button class="btn primary" name="action" value="approve" type="submit">Approve this exact version</button><button class="btn" name="action" value="request_changes" type="submit">Request changes</button></div></form>`}
      <div id="customProofMessage" class="small" role="status" aria-live="polite"></div>`;
    document.getElementById('customProofResponseForm')?.addEventListener('submit',async e=>{e.preventDefault();const submit=e.submitter?.value||'';const note=new FormData(e.currentTarget).get('customer_response_note')||'';try{msg('Saving your response…');const d=await call({method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({token,action:submit,customer_response_note:note})});render(d.proof);msg(d.message||'Response saved.');}catch(err){msg(err.message,true);}});
  }
  (async()=>{try{if(!token)throw new Error('This private proof link is missing its token.');const d=await call();render(d.proof);}catch(e){mount.innerHTML=`<h2>Proof unavailable</h2><p>${esc(e.message)}</p><p class="small">Please contact Devil n Dove if you need a new proof link.</p>`;}})();
});
