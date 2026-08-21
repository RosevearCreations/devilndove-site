// Build 279 — release/preflight dashboard status is opt-in; normal admin navigation does not invoke heavy readiness endpoints.
document.addEventListener('DOMContentLoaded',()=>{
  if(!window.DDAuth)return;
  const grid=document.querySelector('.admin-summary-grid')||document.querySelector('.dashboard-summary-grid');if(!grid)return;
  const esc=(v)=>String(v??'').replace(/[&<>"']/g,(c)=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const cls=(s)=>['blocked','fail','not_ready'].includes(String(s||'').toLowerCase())?'status-pill status-pill-error':(['review','warn'].includes(String(s||'').toLowerCase())?'status-pill status-pill-warning':'status-pill status-pill-success');
  function shell(){
    document.getElementById('adminDashboardReleaseStatusCard')?.remove();
    const card=document.createElement('div');card.id='adminDashboardReleaseStatusCard';card.className='card admin-summary-card';
    card.innerHTML='<h2>Release status</h2><p class="small">Readiness checks are deployment tools, not background dashboard traffic.</p><button class="btn small" id="adminDashboardLoadReleaseStatus" type="button">Load release status</button> <a class="btn small secondary" href="/admin/prelaunch/">Release &amp; Go-Live Center</a>';
    grid.prepend(card);card.querySelector('#adminDashboardLoadReleaseStatus')?.addEventListener('click',load);
  }
  async function load(){
    const button=document.getElementById('adminDashboardLoadReleaseStatus');if(button){button.disabled=true;button.textContent='Loading…';}
    try{
      const pre=await window.DDAuth.apiJson('/api/admin/deployment-preflight',{method:'GET'},{fallbackMessage:'Preflight temporarily unavailable.',cacheKey:'dashboard-preflight',cacheTtlMs:300000,retries:0,staleOnError:true,preferCache:true}).catch(()=>null);
      const rel=await window.DDAuth.apiJson('/api/admin/release-control?view=phone',{method:'GET'},{fallbackMessage:'Release summary temporarily unavailable.',cacheKey:'dashboard-release-control',cacheTtlMs:300000,retries:0,staleOnError:true,preferCache:true}).catch(()=>null);
      const card=document.getElementById('adminDashboardReleaseStatusCard');if(!card)return;
      const preText=pre?.ok?`<span class="${cls(pre.summary?.status)}">${esc(pre.summary?.status||'unknown')}</span> • ${esc(pre.summary?.blocker_count||0)} blocker(s) • ${esc(pre.summary?.warning_count||0)} warning(s)`:'Preflight unavailable';
      const score=Number(rel?.summary?.readiness_score||0);const relText=rel?.ok?`<span class="${cls(score>=90?'passed':'review')}">${esc(score)}/100</span> • ${esc(rel.summary?.dashboard_card_count||0)} release card(s)`:'Release score unavailable';
      card.innerHTML=`<h2>Release status</h2><p class="small"><strong>Preflight:</strong> ${preText}<br><strong>Deploy score:</strong> ${relText}</p><button class="btn small" id="adminDashboardLoadReleaseStatus" type="button">Refresh release status</button> <a class="btn small secondary" href="/admin/prelaunch/">Release &amp; Go-Live Center</a>`;
      card.querySelector('#adminDashboardLoadReleaseStatus')?.addEventListener('click',load);
    }finally{const b=document.getElementById('adminDashboardLoadReleaseStatus');if(b){b.disabled=false;if(b.textContent==='Loading…')b.textContent='Load release status';}}
  }
  if(window.DDWhenAdminReady)window.DDWhenAdminReady(shell,{delayMs:650});else document.addEventListener('dd:admin-access-granted',shell,{once:true});
});
