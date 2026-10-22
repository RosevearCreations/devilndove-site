// Build 432: browser-only read of release authority. No rollback, mutation, polling or credentials.
document.addEventListener('DOMContentLoaded',()=>{
  const button=document.getElementById('dd432Read');
  const message=document.getElementById('dd432Message');
  const mount=document.getElementById('dd432Status');
  if(!button||!message||!mount)return;
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const box=(heading,value)=>'<div><strong>'+esc(heading)+'</strong><p><code>'+esc(value)+'</code></p></div>';
  button.addEventListener('click',async()=>{
    button.disabled=true;message.textContent='Reading current release evidence only…';mount.replaceChildren();
    try{
      if(!window.DDAuth?.apiFetch)throw Error('Verified Admin session is required.');
      const response=await window.DDAuth.apiFetch('/api/admin/release-gate-status-431',{method:'GET',cache:'no-store'});
      const result=await response.json().catch(()=>null);
      if(!response.ok||!result?.ok)throw Error(result?.error||'GitHub release status unavailable.');
      let live=null;
      try{
        const response=await fetch('/release-version.json?rollback432='+Date.now(),{cache:'no-store'});
        if(response.ok)live=await response.json();
      }catch{ /* Explicit UNKNOWN; do not fabricate live identity. */ }
      const target=String(result.main_sha||'');
      const exact=Boolean(target&&live?.source_sha===target&&live?.branch==='main');
      mount.innerHTML=[
        box('GitHub dev',result.dev_sha||'UNKNOWN'),
        box('GitHub main',target||'UNKNOWN'),
        box('Production Pages Deploy',result.production?.status||'UNKNOWN'),
        box('Live custom-domain source SHA',live?.source_sha||'UNKNOWN'),
        box('Current live matches main',exact?'YES, marker only':'UNKNOWN or MISMATCH'),
        box('Rollback authorization','NOT AUTHORIZED — human review required')
      ].join('');
      message.textContent='Read-only check complete. '+(exact?'Current live marker matches main; original Cloudflare deployment and historical rollback proofs still require review.':
        'Live Production identity was not verified. Hold all recovery attempts.')+
        ' No historical rollback candidate was selected or applied.';
    }catch(e){
      message.textContent='Release evidence UNKNOWN: '+(e?.message||'unavailable')+'. No rollback performed.';
    }finally{button.disabled=false;}
  });
});
