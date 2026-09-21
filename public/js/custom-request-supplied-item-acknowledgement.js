// Release 467 Build 216 — private customer-supplied item limitation acknowledgement UI.
document.addEventListener('DOMContentLoaded',()=>{
  const mount=document.getElementById('suppliedItemAcknowledgementMount');if(!mount)return;
  const token=new URLSearchParams(location.search).get('token')||'';
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const setMessage=(t,e=false)=>{const x=document.getElementById('suppliedItemAckMessage');if(x){x.textContent=t||'';x.style.color=e?'#b00020':'#0a7a2f';}};
  function render(data){
    const a=data.acknowledgement||{},closed=String(a.status||'')!=='active';
    mount.innerHTML=`<div><div style="display:flex;justify-content:space-between;gap:12px;flex-wrap:wrap"><div><h2 style="margin-top:0">${esc(a.item_label||'Customer-supplied item')}</h2><p class="small">${esc(a.item_description||'')}</p></div><span class="status-note">${esc(a.status||'active')}</span></div>
      <h3>Requested modification</h3><p>${esc(a.requested_modification||'Not specified')}</p>
      <h3>Ownership / authority record</h3><p>${esc(a.ownership_snapshot||'Not recorded')}</p>
      <h3>Limitations to acknowledge</h3><pre class="quote-preview-scope" style="white-space:pre-wrap">${esc(a.limitations||'No limitations text is available.')}</pre>
      ${a.expires_at?`<p class="small"><strong>Link expiry:</strong> ${esc(String(a.expires_at).slice(0,10))}</p>`:''}
      <p class="small">Acknowledgement means you received and accept these stated limitations for this review. It does not mean the work has started, and it does not make any unknown material, coating, compatibility, or safety fact known.</p>
      ${closed?`<div class="status-note">Response recorded: ${esc(a.status)}</div>`:`<label>Optional note<textarea class="input" id="suppliedItemAckNote" rows="4" placeholder="Questions, clarifications, or anything you want us to review before work begins."></textarea></label><div style="display:flex;gap:10px;flex-wrap:wrap;margin-top:12px"><button class="btn primary" type="button" data-supplied-ack="acknowledge">Acknowledge limitations</button><button class="btn" type="button" data-supplied-ack="decline">Do not proceed / decline</button></div>`}
      <div id="suppliedItemAckMessage" class="small" style="margin-top:12px" role="status" aria-live="polite"></div></div>`;
  }
  async function load(){
    if(!token){mount.textContent='Missing acknowledgement token.';return;}
    try{const r=await fetch(`/api/custom-request-supplied-item-acknowledgement?token=${encodeURIComponent(token)}`,{cache:'no-store'}),d=await r.json().catch(()=>null);if(!r.ok||!d?.ok)throw new Error(d?.error||'Acknowledgement could not be loaded.');render(d);}
    catch(e){mount.innerHTML=`<p class="status-note" style="color:#b00020">${esc(e.message||e)}</p>`;}
  }
  async function respond(action){
    try{setMessage('Saving your response…');const r=await fetch('/api/custom-request-supplied-item-acknowledgement',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({token,action,customer_response_note:document.getElementById('suppliedItemAckNote')?.value||''})}),d=await r.json().catch(()=>null);if(!r.ok||!d?.ok)throw new Error(d?.error||'Response could not be saved.');render(d);setMessage(d.message||'Response saved.');}
    catch(e){setMessage(e.message||'Response could not be saved.',true);}
  }
  mount.addEventListener('click',e=>{const b=e.target.closest('[data-supplied-ack]');if(b)respond(b.dataset.suppliedAck);});
  void load();
});