// Release 467 Build 241 — Cross-Authority Handoff Simplification.
// Shared Admin-only navigation context. Passes identifiers by URL only; authoritative records remain in owning workspaces.
(() => {
  'use strict';
  const path=String(location.pathname||'/');
  if(!path.startsWith('/admin/')) return;

  const PARAMS=new URLSearchParams(location.search);
  const ID_KEYS=[
    'product_id','creative_project_id','creative_work_project_id','project_id',
    'inventory_id','site_item_inventory_id','custom_request_id','content_project_id',
    'creation_id','creation_key'
  ];
  const ROUTE_KEYS=[
    [/^\/admin\/(?:products|product-editor|catalog-media|product-image-quality|product-lineage|release-preflight)\//,['product_id']],
    [/^\/admin\/(?:creative-automation|creative-process|creative-assets|caip-content-handoff|content-studio|public-proof-candidates|content-publications|social-publishing)\//,['creative_project_id','creative_work_project_id','project_id','content_project_id']],
    [/^\/admin\/(?:inventory-operations|inventory-intelligence|inventory-creator-intelligence|mobile-inventory|supply-sourcing|vendor-reviews|tool-lifecycle)\//,['product_id','inventory_id','site_item_inventory_id']],
    [/^\/admin\/(?:custom-request|custom-work-pilot|manufacturing-adoption|creative-project-pilot|evidence-adoption)\//,['custom_request_id','creative_project_id','project_id','product_id']],
    [/^\/admin\/(?:accounting|month-end|business-health|business-pipeline|orders|customer-documents)\//,['product_id','custom_request_id','project_id']],
    [/^\/admin\/(?:media-content-studio|image-manifest|visual-enrichment-studio|stage-photo-moderation)\//,['product_id','creative_project_id','project_id','content_project_id','creation_id','creation_key']]
  ];
  const HANDOFF_KEYS=new Set(ID_KEYS);

  const clean=(v,max=180)=>String(v??'').trim().slice(0,max);
  const currentIds=Object.fromEntries(ID_KEYS.map(k=>[k,clean(PARAMS.get(k))]).filter(([,v])=>v));
  const currentUrl=location.pathname+location.search+location.hash;
  const sourceLabel=clean(document.querySelector('h1')?.textContent||document.title||'Previous workspace',80);

  function allowedKeys(targetPath){
    const match=ROUTE_KEYS.find(([re])=>re.test(targetPath));
    return match?match[1]:[];
  }
  function safeReturn(raw){
    if(!raw) return '';
    try{
      const u=new URL(raw,location.origin);
      if(u.origin!==location.origin || !u.pathname.startsWith('/admin/')) return '';
      return u.pathname+u.search+u.hash;
    }catch{return '';}
  }
  function decorate(anchor){
    if(!(anchor instanceof HTMLAnchorElement) || anchor.dataset.ddHandoff==='off') return;
    if(anchor.target==='_blank' || anchor.hasAttribute('download')) return;
    let u;
    try{u=new URL(anchor.href,location.origin);}catch{return;}
    if(u.origin!==location.origin || !u.pathname.startsWith('/admin/')) return;
    if(u.pathname===location.pathname) return;
    const keys=allowedKeys(u.pathname);
    let passed=0;
    for(const key of keys){
      if(!u.searchParams.has(key) && currentIds[key]){
        u.searchParams.set(key,currentIds[key]); passed++;
      }
    }
    if(!passed && !keys.some(k=>u.searchParams.has(k))) return;
    if(!u.searchParams.has('handoff_from')) u.searchParams.set('handoff_from',path);
    if(!u.searchParams.has('handoff_label')) u.searchParams.set('handoff_label',sourceLabel);
    if(!u.searchParams.has('return_to')) u.searchParams.set('return_to',currentUrl);
    anchor.href=u.pathname+u.search+u.hash;
    anchor.dataset.ddHandoff='241';
  }
  function decorateAll(root=document){
    if(root instanceof HTMLAnchorElement) decorate(root);
    root?.querySelectorAll?.('a[href]').forEach(decorate);
  }
  function renderReturn(){
    const returnTo=safeReturn(PARAMS.get('return_to'));
    if(!returnTo || document.getElementById('ddHandoffReturnV241')) return;
    const label=clean(PARAMS.get('handoff_label'),80)||'Previous workspace';
    const box=document.createElement('aside');
    box.id='ddHandoffReturnV241';
    box.className='card';
    box.dataset.ddHandoffReturn='241';
    box.style.margin='12px 0';
    box.innerHTML='<strong>Continue where you came from</strong><div class="small">This page is using the same record context; no business record was copied.</div>';
    const a=document.createElement('a');
    a.className='btn';
    a.href=returnTo;
    a.textContent='Return to '+label;
    a.dataset.ddHandoff='off';
    box.appendChild(a);
    const h1=document.querySelector('h1');
    const host=h1?.parentElement||document.querySelector('main')||document.body;
    if(h1?.nextSibling) host.insertBefore(box,h1.nextSibling); else host.appendChild(box);
  }
  function signal(){
    window.DDAdminHandoffV241={
      version:'467b241-cross-authority-handoff-v1',
      source:path,
      identifiers:{...currentIds},
      return_to:safeReturn(PARAMS.get('return_to'))||null,
      copies_authoritative_records:false
    };
    document.documentElement.dataset.ddBuild241Handoff='ready';
    document.dispatchEvent(new CustomEvent('dd:admin-handoff-ready',{detail:window.DDAdminHandoffV241}));
  }
  function run(){decorateAll(document);renderReturn();signal();}
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',run,{once:true}); else run();

  const observer=new MutationObserver((records)=>{
    for(const record of records) for(const node of record.addedNodes||[]){
      if(node?.nodeType===1) decorateAll(node);
    }
  });
  if(document.documentElement) observer.observe(document.documentElement,{childList:true,subtree:true});
})();