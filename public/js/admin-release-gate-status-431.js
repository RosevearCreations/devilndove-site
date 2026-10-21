// Release 467 Build 431 — on-demand, read-only and failure-explicit Admin release status.
document.addEventListener('DOMContentLoaded',()=>{
 const button=document.getElementById('release431Refresh');
 const summary=document.getElementById('release431Summary');
 const results=document.getElementById('release431Results');
 const live=document.getElementById('release431Live');
 if(!button||!summary||!results||!live)return;
 const escapeHtml=(s)=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const safeUrl=(value)=>typeof value==='string'&&/^https:\/\/github\.com\/RosevearCreations\/devilndove-site\/actions\/(?:runs\/\d+|workflows\/[a-z0-9-]+\.yml)$/.test(value)?value:null;
 const link=(item)=>{const target=safeUrl(item.run_url)||safeUrl(item.workflow_url);return target?'<a href="'+escapeHtml(target)+'" target="_blank" rel="noopener noreferrer">View '+(safeUrl(item.run_url)?'run':'workflow')+'</a>':'Evidence unavailable';};
 const stamp=(value)=>value?'<code>'+escapeHtml(value)+'</code>':'<span class="release431-unknown">Unknown</span>';
 const line=(item)=>'<div class="release431-proof"><div><strong>'+escapeHtml(item.name)+'</strong><p class="small">'+escapeHtml(item.reason||'No evidence available.')+'</p></div><span class="release431-pill" data-state="'+escapeHtml(item.status||'UNKNOWN')+'">'+escapeHtml(item.status||'UNKNOWN')+'</span><div>'+link(item)+'</div></div>';
 async function check(){
   button.disabled=true;
   summary.textContent='Checking GitHub evidence…';
   results.textContent='';
   live.textContent='Checking live version…';
   try{
     if(!window.DDAuth?.apiFetch)throw new Error('Admin session API is unavailable. Sign in and try again.');
     const response=await window.DDAuth.apiFetch('/api/admin/release-gate-status-431',{method:'GET',cache:'no-store'});
     const data=await response.json();
     if(!response.ok||data?.ok!==true)throw new Error(data?.error||'Release proof data is unavailable.');
     let version=null,versionError='';
     try{
       const res=await fetch('/release-version.json?nocache='+Date.now(),{cache:'no-store'});
       if(!res.ok)throw new Error('Live release-version marker is not deployed (HTTP '+res.status+').');
       version=await res.json();
     }catch(e){versionError=e?.message||'Live version is unavailable.';}
     const sameSha=Boolean(data.main_sha&&data.main_sha===data.dev_sha);
     const liveMatches=Boolean(version&&/^[a-f0-9]{40}$/.test(version.source_sha||'')&&
       version.source_sha===data.main_sha&&version.branch==='main');
     const green=Boolean(data.summary?.all_development_proofs_green&&sameSha&&
       data.summary?.production_workflow_green&&liveMatches);
     summary.innerHTML='<div class="release431-summary">'+
       '<div><strong>Development</strong><p>'+stamp(data.dev_sha)+'</p></div>'+
       '<div><strong>main</strong><p>'+stamp(data.main_sha)+'</p></div>'+
       '<div><strong>Release conclusion</strong><p class="release431-pill" data-state="'+(green?'GREEN':'UNKNOWN')+'">'+
       (green?'PRODUCTION GREEN — VERIFIED':'NOT CONFIRMED GREEN')+'</p></div></div>'+
       '<p class="small">'+escapeHtml(green?'The exact Development proofs, Production workflow and live deployed version agree.':data.summary?.reason||'Missing proof evidence. Do not assume Production is live.')+'</p>';
     results.innerHTML=(data.checks||[]).map(line).join('')+
       '<h3>Protected Production deployment</h3>'+line(data.production||{name:'Production Pages Deploy',status:'UNKNOWN',reason:'No evidence'});
     live.innerHTML='<strong>Cloudflare live version:</strong> '+(liveMatches?
       '<span class="release431-pill" data-state="GREEN">MATCH</span> '+stamp(version.source_sha):
       '<span class="release431-pill" data-state="UNKNOWN">UNVERIFIED</span> '+
       escapeHtml(versionError||'The currently served version does not match the exact main SHA.'))+
       '<p class="small">Live marker: <a href="/release-version.json" target="_blank" rel="noopener noreferrer">/release-version.json</a>. This is an explicit proof check, never a deployment command.</p>';
   }catch(e){
     summary.textContent='Release status unavailable: '+(e?.message||'Unexpected error.');
     results.innerHTML='<p class="small">No verification can be claimed. Try Refresh after authentication or GitHub API access is restored.</p>';
     live.textContent='UNKNOWN — no Production assertion made.';
   }finally{button.disabled=false;}
 }
 button.addEventListener('click',check);
 check(); // One bounded inspection when owner opens this Admin page; no polling.
});
