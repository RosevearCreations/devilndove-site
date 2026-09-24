// Release 467 Build 247 — read-only non-Product visual coverage projection.
(function(){
  'use strict';
  const rootId='mediaVisualCoverage247';
  function el(tag,cls,text){
    const node=document.createElement(tag);
    if(cls) node.className=cls;
    if(text!=null) node.textContent=String(text);
    return node;
  }
  function policyLabel(value){
    return String(value||'').replaceAll('_',' ').replace(/\b\w/g,m=>m.toUpperCase());
  }
  function renderGroup(root,title,rows){
    const section=el('section','media-v247-group');
    section.appendChild(el('h3','',title));
    const grid=el('div','media-v247-grid');
    for(const row of rows||[]){
      const card=el('article','card media-v247-card');
      const head=el('div','media-v247-card-head');
      head.appendChild(el('strong','',row.route||row.target||'Visual target'));
      head.appendChild(el('span','small',row.id||''));
      card.appendChild(head);
      card.appendChild(el('div','small',row.target||''));
      const policy=el('div','small media-v247-policy',policyLabel(row.replacement_policy));
      card.appendChild(policy);
      card.appendChild(el('p','small',row.guidance||''));
      const status=el('div','small',row.status||'');
      card.appendChild(status);
      if(row.route && row.route.startsWith('/')){
        const link=el('a','btn','Open target');
        link.href=row.route;
        link.target='_blank';
        link.rel='noopener';
        card.appendChild(link);
      }
      grid.appendChild(card);
    }
    section.appendChild(grid);
    root.appendChild(section);
  }
  async function start(){
    const root=document.getElementById(rootId);
    if(!root) return;
    try{
      const response=await fetch('/public/data/non-product-visual-coverage-v247.json',{credentials:'same-origin',cache:'no-store'});
      if(!response.ok) throw new Error('Visual coverage plan unavailable.');
      const data=await response.json();
      root.replaceChildren();
      const summary=el('div','media-v247-summary');
      const c=data.coverage||{};
      summary.appendChild(el('strong','',`Build 247 coverage: ${Number(c.tracked_targets_total||0)} tracked targets`));
      summary.appendChild(el('p','small',`${Number(c.priority_a_public_targets||0)} public/customer • ${Number(c.priority_b_admin_targets||0)} Admin diagrams • ${Number(c.priority_c_helpful_targets||0)} helpful visuals. Public real-photo requirements remain open until owned/approved media exists; no synthetic evidence is substituted.`));
      root.appendChild(summary);
      renderGroup(root,'Priority A — public/customer capture & placement',data.public_targets);
      renderGroup(root,'Priority B — Admin explanatory visuals',data.admin_targets);
      renderGroup(root,'Priority C — helpful new visuals',data.helpful_targets);
      window.DDNonProductVisualCoverage247=Object.freeze(data);
      document.dispatchEvent(new CustomEvent('dd:non-product-visual-coverage-ready',{detail:{ok:true,build:247}}));
    }catch(error){
      root.replaceChildren(el('p','small',error?.message||'Visual coverage plan unavailable.'));
      document.dispatchEvent(new CustomEvent('dd:non-product-visual-coverage-ready',{detail:{ok:false,build:247}}));
    }
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',start,{once:true});
  else start();
})();