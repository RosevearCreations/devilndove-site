// Release 459 — read-only I.T. provider setup guide renderer.
(function(){
  'use strict';
  const byId=(id)=>document.getElementById(id);
  const text=(v)=>String(v==null?'':v).trim();
  const esc=(v)=>text(v).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#039;');
  const apiFetch=(url,options={})=>window.DDAuth?.apiFetch?window.DDAuth.apiFetch(url,options):fetch(url,{credentials:'same-origin',...options});
  async function readJson(response){const type=text(response.headers?.get?.('content-type')).toLowerCase();if(!type.includes('application/json'))throw new Error(`HTTP ${response.status} did not return JSON.`);const payload=await response.json();if(!response.ok||payload?.ok===false)throw new Error(payload?.error||`HTTP ${response.status}`);return payload}
  function message(value,error=false){const node=byId('itSetupGuideMessage');if(!node)return;node.textContent=value||'';node.classList.toggle('is-error',error);node.classList.toggle('is-success',Boolean(value&&!error))}
  function badge(ok){return `<span class="it-setup-badge ${ok?'is-ready':'is-missing'}">${ok?'present':'missing'}</span>`}
  function fieldRow(item){return `<div class="it-setup-field"><div><code>${esc(item.name)}</code> ${badge(Boolean(item.present))}<div class="small"><strong>${esc(item.storage)}</strong> · ${esc(item.purpose)}</div><div class="small">Where it comes from: ${esc(item.source)}</div></div><button class="btn it-copy-ref" type="button" data-copy-ref="${esc(item.name)}">Copy name</button></div>`}
  function providerCard(provider){
    const callbacks=(provider.callbacks||[]).length?`<div class="it-setup-sub"><h4>Callbacks</h4>${provider.callbacks.map((row)=>`<div class="small"><strong>${esc(row.label)}:</strong> ${row.url?`<code>${esc(row.url)}</code>`:esc(row.status||'not available')}</div>`).join('')}</div>`:'';
    const scopes=(provider.scopes||[]).length?`<div class="it-setup-sub"><h4>Scopes / permissions</h4><ul class="small compact-list">${provider.scopes.map((scope)=>`<li><code>${esc(scope)}</code></li>`).join('')}</ul></div>`:'';
    const steps=(provider.setup_steps||[]).length?`<div class="it-setup-sub"><h4>Setup sequence</h4><ol class="small compact-list">${provider.setup_steps.map((step)=>`<li>${esc(step)}</li>`).join('')}</ol></div>`:'';
    const verification=(provider.verification||[]).length?`<div class="it-setup-sub"><h4>Acceptance notes</h4><ul class="small compact-list">${provider.verification.map((step)=>`<li>${esc(step)}</li>`).join('')}</ul></div>`:'';
    return `<article class="card it-setup-card"><div class="it-setup-title"><div><h3>${esc(provider.name)}</h3><div class="small">${esc(provider.type)} · ${esc(provider.environment)} · ${esc(provider.implementation_state)}</div></div><div class="it-setup-count">${Number(provider.configured_required_count||0)}/${Number(provider.required_field_count||0)} refs present</div></div><div class="small"><strong>Provider console:</strong> ${esc(provider.dashboard)}</div><div class="it-setup-fields">${(provider.fields||[]).map(fieldRow).join('')}</div>${callbacks}${scopes}${steps}${verification}</article>`;
  }
  function render(payload){
    const mount=byId('itSetupGuide');if(!mount)return;
    const providers=Array.isArray(payload.providers)?payload.providers:[];
    mount.innerHTML=providers.map(providerCard).join('')||'<p class="small">No provider setup guides were returned.</p>';
    mount.querySelectorAll('[data-copy-ref]').forEach((button)=>button.addEventListener('click',async()=>{
      const value=button.getAttribute('data-copy-ref')||'';
      try{await navigator.clipboard.writeText(value);button.textContent='Copied';setTimeout(()=>button.textContent='Copy name',1200)}catch{message(`Could not copy ${value}; select the reference name manually.`,true)}
    }));
    const configured=providers.filter((row)=>row.configuration_complete).length;
    message(`Release ${payload.release}: ${providers.length} provider guides loaded; ${configured} have all required Cloudflare references present. Secret values were not returned.`);
  }
  async function load(){const button=byId('itSetupGuideRefresh');if(button)button.disabled=true;message('Loading safe provider setup authority…');try{render(await readJson(await apiFetch('/api/admin/it-provider-setup-guide',{method:'GET',cache:'no-store'})))}catch(error){message(error.message||String(error),true)}finally{if(button)button.disabled=false}}
  function init(){byId('itSetupGuideRefresh')?.addEventListener('click',load);load()}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
