// Build 279 — smoke-test summary is opt-in on the dashboard; expensive release reads do not run on every admin visit.
document.addEventListener('DOMContentLoaded',()=>{
  if(!window.DDAuth)return;
  const grid=document.querySelector('.admin-summary-grid')||document.querySelector('.dashboard-summary-grid')||document.querySelector('main');
  if(!grid)return;
  const esc=(v)=>String(v??'').replace(/[&<>"']/g,(c)=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  function shell(){
    document.getElementById('adminDashboardSmokeCard')?.remove();
    const card=document.createElement('div');card.id='adminDashboardSmokeCard';card.className='card admin-summary-card';
    card.innerHTML='<h2>Smoke tests</h2><p class="small">Not loaded automatically. Use this only when reviewing deployment evidence.</p><button class="btn small" id="adminDashboardLoadSmoke" type="button">Load smoke status</button> <a class="btn small secondary" href="/admin/post-deploy-smoke-tests/">Open smoke tests</a>';
    grid.prepend(card);card.querySelector('#adminDashboardLoadSmoke')?.addEventListener('click',load);
  }
  async function load(){
    const button=document.getElementById('adminDashboardLoadSmoke');if(button){button.disabled=true;button.textContent='Loading…';}
    try{
      const d=await window.DDAuth.apiJson('/api/admin/post-deploy-smoke-tests',{method:'GET'},{fallbackMessage:'Smoke-test summary unavailable.',cacheKey:'admin-smoke-tests',cacheTtlMs:300000,retries:0,staleOnError:true,preferCache:true});
      if(!d?.ok)throw new Error('Smoke-test summary unavailable.');
      const card=document.getElementById('adminDashboardSmokeCard');if(!card)return;
      card.innerHTML=`<h2>Smoke tests</h2><p class="small">Passed ${esc(d.summary?.passed||0)} • Failed ${esc(d.summary?.failed||0)} • Total ${esc(d.summary?.total||0)}${d?._response_meta?.stale?' • saved view':''}</p><button class="btn small" id="adminDashboardLoadSmoke" type="button">Refresh smoke status</button> <a class="btn small secondary" href="/admin/post-deploy-smoke-tests/">Open smoke tests</a>`;
      card.querySelector('#adminDashboardLoadSmoke')?.addEventListener('click',load);
    }catch(error){const card=document.getElementById('adminDashboardSmokeCard');if(card)card.querySelector('p')?.replaceChildren(document.createTextNode(error.message||'Smoke-test summary unavailable.'));}
    finally{const b=document.getElementById('adminDashboardLoadSmoke');if(b){b.disabled=false;if(b.textContent==='Loading…')b.textContent='Load smoke status';}}
  }
  if(window.DDWhenAdminReady)window.DDWhenAdminReady(shell,{delayMs:500});else document.addEventListener('dd:admin-access-granted',shell,{once:true});
});
