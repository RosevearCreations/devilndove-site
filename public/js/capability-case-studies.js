// Release 467 Build 223 — public capability case studies over already-published Content Release records.
(()=>{'use strict';
const mount=document.querySelector('[data-capability-case-studies]');if(!mount)return;
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const short=(v,n=220)=>{const s=String(v||'').replace(/\s+/g,' ').trim();return s.length>n?s.slice(0,n-1).trim()+'…':s;};
const params=new URLSearchParams(location.search);const capability=String(params.get('capability')||'').trim();const q=String(params.get('q')||'').trim();
function badges(item){
 const b=[];if(item.hybrid_project)b.push('Hybrid project');if(item.prototype_to_finished)b.push('Prototype → finished');if(item.before_after)b.push('Before / after');if(item.process_technique_example)b.push('Process / technique');if(item.reviewed_production_run_evidence)b.push('Reviewed production run');if(!b.length)b.push('Workshop Journal');
 return b.map(x=>'<span class="badge">'+esc(x)+'</span>').join(' ');
}
function capabilityLinks(item){const rows=Array.isArray(item.capabilities)?item.capabilities:[];return rows.length?'<div class="small"><strong>Related capabilities:</strong> '+rows.map(c=>'<a href="'+esc(c.profile_path||'/capabilities/')+'">'+esc(c.display_name||c.capability_key)+'</a>').join(' · ')+'</div>':'';}
function processLine(item){const rows=Array.isArray(item.processes)?item.processes:[];return rows.length?'<p class="small"><strong>Reviewed process evidence:</strong> '+rows.map(p=>esc(p.process_name||p.process_key)).join(' · ')+'</p>':'';}
function card(item){
 const story='/workshop-journal/story/?story='+encodeURIComponent(item.publication_slug||'');
 return '<article class="card journal-card journal-live-card">'+
   '<a class="journal-live-media" href="'+story+'">'+(item.hero_media_url?'<img src="'+esc(item.hero_media_url)+'" alt="'+esc(item.hero_alt_text||item.title||'Devil n Dove workshop story')+'" loading="lazy">':'<span aria-hidden="true">✦</span>')+'</a>'+
   '<div><div style="display:flex;gap:6px;flex-wrap:wrap">'+badges(item)+'</div><h2><a href="'+story+'">'+esc(item.title||'Workshop story')+'</a></h2>'+
   '<p>'+esc(short(item.summary||'A reviewed Devil n Dove workshop story.'))+'</p>'+capabilityLinks(item)+processLine(item)+
   '<div class="journal-live-actions"><a class="btn primary" href="'+story+'">Read case study</a>'+(item.product_path?'<a class="btn secondary" href="'+esc(item.product_path)+'">Related piece</a>':'')+'<a class="btn secondary" href="/custom-request/">Request similar Custom Work</a></div></div></article>';
}
async function load(){
 const u=new URL('/api/capability-case-studies',location.origin);u.searchParams.set('limit','24');if(capability)u.searchParams.set('capability',capability);if(q)u.searchParams.set('q',q);
 try{const r=await fetch(u.pathname+u.search,{headers:{Accept:'application/json'}}),d=await r.json().catch(()=>({}));if(!r.ok||!d.ok)throw new Error(d.error||'Case studies unavailable.');
 const items=Array.isArray(d.items)?d.items:[];if(!items.length){mount.innerHTML='<section class="card"><h2>No published case studies match yet</h2><p class="small">This page only shows stories that have already passed Content Studio, media/public-use review, and the existing Content Release publication process. Private/raw CAIP work never appears here.</p><p><a class="btn" href="/workshop-journal/">Workshop Journal</a> <a class="btn secondary" href="/capabilities/">Capabilities</a></p></section>';return;}
 mount.innerHTML='<div class="workshop-journal-grid workshop-journal-live-grid">'+items.map(card).join('')+'</div>';
 }catch(e){mount.innerHTML='<section class="card"><h2>Case studies temporarily unavailable</h2><p class="small">'+esc(e.message||e)+'</p><p><a class="btn" href="/workshop-journal/">Workshop Journal</a></p></section>';}
}
load();
})();