// Build 228 — read-only Startup blocker summary for the standalone process map.
(() => {
  const esc=(value)=>String(value??'').replace(/[&<>"']/g,(ch)=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  async function load(){
    const host=document.getElementById('prelaunchReadinessSummary');if(!host)return;
    try{
      const response=await DDAuth.apiFetch('/api/admin/startup-readiness');
      const raw=await response.text();let data=null;try{data=JSON.parse(raw);}catch{throw new Error('The readiness service returned an invalid response.');}
      if(!response.ok||!data?.ok||!Array.isArray(data.items))throw new Error(data?.error||'Startup blocker status is unavailable.');
      const closed=(status)=>['passed','not_applicable'].includes(status);
      const total=data.items.length;const complete=data.items.filter((row)=>closed(row.item_status)).length;const critical=data.items.filter((row)=>row.blocker_severity==='critical'&&!closed(row.item_status)).length;const blocked=data.items.filter((row)=>row.item_status==='blocked').length;
      host.innerHTML=`<div class="prelaunch-summary-metrics"><article><span>Total gates</span><strong>${total}</strong></article><article><span>Complete</span><strong>${complete}</strong></article><article><span>Critical open</span><strong>${critical}</strong></article><article><span>Blocked</span><strong>${blocked}</strong></article></div><p class="small">${critical?'The site is not ready for unrestricted opening. Work the Critical gates first.':'No Critical gate is currently open; complete High and remaining evidence before unrestricted promotion.'}</p>`;
    }catch(error){host.innerHTML=`<div class="prelaunch-summary-unavailable"><strong>Status unavailable</strong><p>${esc(error.message)} No readiness result is being inferred. Open Startup Readiness and restore D1 connectivity.</p></div>`;}
  }
  document.addEventListener('DOMContentLoaded',load);
})();
