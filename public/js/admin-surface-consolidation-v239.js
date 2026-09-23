// Release 467 Build 239 — Admin Surface & Navigation Consolidation.
(() => {
  if (!window.location.pathname.startsWith('/admin')) return;
  const normalize=(href)=>{ try { const u=new URL(href,window.location.origin); let p=u.pathname||'/'; if(!p.endsWith('/')) p+='/'; return p; } catch { return String(href||''); } };
  const canonicalOwners={
    '/admin/local-seo-review/':{module:'Storefront',href:'/admin/storefront/'},
    '/admin/visual-polish/':{module:'Storefront',href:'/admin/storefront/'}
  };
  const dedupeExactLinks=()=>{
    document.querySelectorAll('.links, .admin-compact-tool-grid').forEach((root)=>{
      const seen=new Set();
      root.querySelectorAll('a[href]').forEach((a)=>{
        const key=normalize(a.getAttribute('href'));
        if(!key || key==='/admin/') return;
        if(seen.has(key)){ a.hidden=true; a.dataset.ddRedundantEntry='1'; a.setAttribute('aria-hidden','true'); }
        else seen.add(key);
      });
    });
  };
  const markCanonicalOwner=()=>{
    const current=normalize(window.location.pathname);
    const owner=canonicalOwners[current];
    if(!owner || document.querySelector('[data-dd-canonical-owner-v239]')) return;
    const host=document.querySelector('.hero, main, .container');
    if(!host) return;
    const note=document.createElement('div');
    note.className='card small';
    note.dataset.ddCanonicalOwnerV239='1';
    note.style.marginTop='12px';
    note.innerHTML='Canonical navigation: <strong>'+owner.module+'</strong>. This deep link remains supported. <a href="'+owner.href+'">Open '+owner.module+' workspace</a>.';
    host.insertAdjacentElement('afterend',note);
  };
  const run=()=>{dedupeExactLinks();markCanonicalOwner();};
  window.DDAdminSurfaceConsolidationV239={normalize,canonicalOwners,dedupeExactLinks,run};
  document.addEventListener('DOMContentLoaded',run,{once:true});
  window.addEventListener('dd:admin-module-hub-ready',run);
  document.dispatchEvent(new CustomEvent('dd:admin-surface-consolidation-ready',{detail:{build:239}}));
})();