// Release 467 Build 105 — browser-local Product Work Session Completion & Handoff.
// Read-only summary/report over existing local session + already-rendered Product/readiness state.
(() => {
  const SESSION_KEY = 'dd_catalog_work_session_v1';
  const SNAPSHOT_KEY = 'dd_admin_products_snapshot_v2';
  const ready = (fn) => document.readyState === 'loading' ? document.addEventListener('DOMContentLoaded', fn, {once:true}) : fn();

  ready(() => {
    if (document.body?.dataset?.adminPage !== 'products') return;
    const tableBody = document.getElementById('productsTableBody');
    if (!tableBody) return;
    const esc = (v) => String(v ?? '').replace(/[&<>"']/g, (ch) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
    let lastSignature = '';
    let renderTimer = 0;

    function readSession() {
      try {
        const raw = JSON.parse(localStorage.getItem(SESSION_KEY) || 'null');
        return {sort_mode:String(raw?.sort_mode || 'priority'),items:(Array.isArray(raw?.items) ? raw.items : []).map((item) => ({product_id:Number(item?.product_id || 0) || 0,priority:String(item?.priority || 'normal'),added_at:String(item?.added_at || ''),completed_at:item?.completed_at ? String(item.completed_at) : null})).filter((item) => item.product_id > 0)};
      } catch { return {sort_mode:'priority',items:[]}; }
    }
    function readSnapshot() {
      try { const raw=JSON.parse(localStorage.getItem(SNAPSHOT_KEY) || 'null'); return Array.isArray(raw?.products) ? raw.products : []; }
      catch { return []; }
    }
    const productIdForRow = (row) => Number(row?.querySelector?.('[data-edit-product-id]')?.dataset?.editProductId || 0) || 0;
    const rowForProduct = (id) => Array.from(tableBody.querySelectorAll('tr')).find((row) => productIdForRow(row) === Number(id)) || null;
    function readinessForRow(row) {
      const node=row?.querySelector?.('.product-readiness-inline');
      if(!node || node.classList.contains('is-unknown')) return {state:'unknown',score:null,blocker:''};
      const strong=String(node.querySelector('strong')?.textContent || '').trim();
      const scoreMatch=strong.match(/(\d+(?:\.\d+)?)\s*%/);
      const blockerText=String(node.querySelector('span')?.textContent || '').trim();
      const split=blockerText.indexOf(':');
      return {state:/^ready\b/i.test(strong)?'ready':/^blocked\b/i.test(strong)?'blocked':'unknown',score:scoreMatch?Number(scoreMatch[1]):null,blocker:split>=0?blockerText.slice(0,split).trim():blockerText};
    }
    function productMeta(id,snapshot) {
      const product=snapshot.find((row)=>Number(row?.product_id || 0)===Number(id)) || {};
      const row=rowForProduct(id),cells=row ? Array.from(row.querySelectorAll('td')) : [];
      return {number:String(product?.product_number || String(cells[0]?.textContent || '').trim().replace(/^DD/i,'') || id),name:String(product?.name || String(cells[1]?.textContent || '').trim() || `Product #${id}`)};
    }
    function buildSummary() {
      const session=readSession(),snapshot=readSnapshot(),priority={urgent:0,high:0,normal:0,low:0},readiness={blocked:0,ready:0,unknown:0},products=[];
      for(const item of session.items){
        const meta=productMeta(item.product_id,snapshot),state=readinessForRow(rowForProduct(item.product_id)),done=Boolean(item.completed_at),priorityKey=Object.prototype.hasOwnProperty.call(priority,item.priority)?item.priority:'normal';
        priority[priorityKey]+=1;
        if(!done) readiness[state.state]=(readiness[state.state] || 0)+1;
        products.push({...item,...meta,done,readiness:state.state,score:state.score,blocker:state.blocker});
      }
      const done=products.filter((row)=>row.done).length,active=products.length-done,blockers=products.filter((row)=>!row.done && row.readiness==='blocked');
      return {sort_mode:session.sort_mode,total:products.length,active,done,priority,readiness,blockers,products};
    }
    function reportText(summary=buildSummary()) {
      const lines=['Devil n Dove — Product Work Session Handoff','Release 467 Build 105','Generated: '+new Date().toISOString(),'Scope: browser-local planning report; Product/Inventory authority is unchanged.','',`Summary: ${summary.total} total · ${summary.active} active · ${summary.done} done · ${summary.readiness.blocked} blocked · ${summary.readiness.ready} ready · ${summary.readiness.unknown} readiness unknown`,`Order: ${summary.sort_mode}`,`Priorities: ${summary.priority.urgent} urgent · ${summary.priority.high} high · ${summary.priority.normal} normal · ${summary.priority.low} low`,'','Current blockers:'];
      if(!summary.blockers.length) lines.push('- None in the already-rendered readiness evidence.');
      else summary.blockers.forEach((row)=>lines.push(`- DD${row.number} — ${row.name} · ${row.priority} priority${row.blocker ? ` · ${row.blocker}` : ''}`));
      lines.push('','Session Products:');
      if(!summary.products.length) lines.push('- No Products are currently pinned.');
      else summary.products.forEach((row)=>lines.push(`- DD${row.number} — ${row.name} · ${row.priority} priority · ${row.done?'done':row.readiness}${Number.isFinite(row.score)?` ${row.score}%`:''}${row.blocker?` · ${row.blocker}`:''}`));
      lines.push('','Safety: no Product/Inventory mutation, no Product/readiness API or database read, no provider execution/publication, no Production mutation.');
      return lines.join('\n');
    }
    function fallbackCopy(text) {
      const area=document.createElement('textarea'); area.value=text; area.setAttribute('readonly',''); area.style.position='fixed'; area.style.opacity='0'; document.body.appendChild(area); area.select(); let ok=false; try { ok=document.execCommand('copy'); } catch {} area.remove(); return ok;
    }
    async function copyReport() {
      const text=reportText(); let copied=false;
      try { if(navigator.clipboard?.writeText){await navigator.clipboard.writeText(text); copied=true;} } catch {}
      if(!copied) copied=fallbackCopy(text);
      setStatus(copied?'Work-session handoff report copied.':'Copy was unavailable. Use Download handoff instead.',copied?'green':'review');
    }
    function downloadReport() {
      const blob=new Blob([reportText()],{type:'text/plain;charset=utf-8'}),url=URL.createObjectURL(blob),a=document.createElement('a');
      a.href=url; a.download=`devilndove-product-work-session-handoff-${new Date().toISOString().slice(0,10)}.txt`; document.body.appendChild(a); a.click(); a.remove(); setTimeout(()=>URL.revokeObjectURL(url),0); setStatus('Work-session handoff report downloaded.','green');
    }
    function setStatus(text,tone='') { const node=document.getElementById('catalogWorkSessionHandoffStatus'); if(node){node.textContent=text;node.dataset.tone=tone;} }
    function render() {
      const panel=document.getElementById('catalogWorkSession'); if(!panel) return;
      const summary=buildSummary(),signature=JSON.stringify({total:summary.total,active:summary.active,done:summary.done,priority:summary.priority,readiness:summary.readiness,blockers:summary.blockers.map((row)=>[row.product_id,row.priority,row.blocker]),sort:summary.sort_mode});
      let section=panel.querySelector('#catalogWorkSessionHandoff');
      if(section && signature===lastSignature) return;
      if(!section){section=document.createElement('section');section.id='catalogWorkSessionHandoff';section.className='dd-work-session-handoff';panel.appendChild(section);}
      section.innerHTML=`<div class="dd-work-session-handoff-head"><div><p class="eyebrow">Build 105 · completion &amp; handoff</p><h4 style="margin:0">Session handoff</h4><p class="small">Read-only summary of the browser-local session and readiness already rendered on this Products page.</p></div><div class="dd-work-session-handoff-counts"><strong>${summary.total}</strong> total · <strong>${summary.active}</strong> active · <strong>${summary.done}</strong> done</div></div><div class="dd-work-session-handoff-grid"><span><strong>${summary.readiness.blocked}</strong> blocked</span><span><strong>${summary.readiness.ready}</strong> ready</span><span><strong>${summary.readiness.unknown}</strong> unknown</span><span><strong>${summary.priority.urgent}</strong> urgent</span><span><strong>${summary.priority.high}</strong> high</span></div><div class="small"><strong>Blocker handoff:</strong> ${summary.blockers.length ? summary.blockers.slice(0,5).map((row)=>`DD${esc(row.number)} ${esc(row.blocker || row.name)}`).join(' · ') : 'No active blockers in the already-rendered readiness evidence.'}${summary.blockers.length>5?` · +${summary.blockers.length-5} more`:''}</div><div class="dd-work-session-handoff-actions"><button class="btn" type="button" data-work-session-handoff-command="copy">Copy handoff</button><button class="btn" type="button" data-work-session-handoff-command="download">Download handoff</button><button class="btn secondary" type="button" data-work-session-handoff-command="refresh">Refresh summary</button></div><div id="catalogWorkSessionHandoffStatus" class="small" role="status" aria-live="polite"></div>`;
      if(!document.getElementById('catalogWorkSessionHandoffStyle')){const style=document.createElement('style');style.id='catalogWorkSessionHandoffStyle';style.textContent='.dd-work-session-handoff{margin-top:14px;padding-top:14px;border-top:1px solid var(--border);display:grid;gap:10px}.dd-work-session-handoff-head,.dd-work-session-handoff-actions{display:flex;gap:10px;justify-content:space-between;align-items:center;flex-wrap:wrap}.dd-work-session-handoff-grid{display:flex;gap:8px;flex-wrap:wrap}.dd-work-session-handoff-grid span{padding:6px 9px;border:1px solid var(--border);border-radius:999px}.dd-work-session-handoff-actions{justify-content:flex-start}@media(max-width:720px){.dd-work-session-handoff-actions .btn{flex:1 1 150px}}';document.head.appendChild(style);}
      lastSignature=signature;
    }
    document.addEventListener('click',(event)=>{const button=event.target.closest('[data-work-session-handoff-command]');if(!button)return;const action=button.dataset.workSessionHandoffCommand;if(action==='copy')void copyReport();if(action==='download')downloadReport();if(action==='refresh'){lastSignature='';render();setStatus('Session handoff summary refreshed.','green');}});
    const observer=new MutationObserver(()=>{clearTimeout(renderTimer);renderTimer=setTimeout(render,90);}); observer.observe(document.body,{childList:true,subtree:true,characterData:true});
    window.addEventListener('storage',(event)=>{if(event.key===SESSION_KEY||event.key===SNAPSHOT_KEY){lastSignature='';render();}});
    render();
  });
})();
