// Build 641 — deliberate private D1 save/reopen and owner follow-up tracking.
// No automatic reads, writes, background retry or inventory/order mutations.
(() => {
  'use strict';
  const $=id=>document.getElementById(id),root=$('dd641PlansPanel');
  if(!root||!window.DDAuth)return;
  const nodes={load:$('dd641Load'),fresh:$('dd641New'),status:$('dd641Status'),list:$('dd641List'),
    title:$('dd641Title'),due:$('dd641Due'),state:$('dd641State'),note:$('dd641Note'),
    items:$('dd641Items'),save:$('dd641Save'),cancel:$('dd641Cancel')};
  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  let loaded=false,version=0,owner=null,plans=[],selected=null,reviewed=null,busy=false;
  const listeners=new Set();
  const snapshot=()=>({loaded,owner_user_id:loaded?owner:null,version:loaded?version:null,
    plans:loaded?plans.map(p=>p&&typeof p==='object'?{...p,
      items:Array.isArray(p.items)?p.items.map(item=>item&&typeof item==='object'?{...item}:item):p.items}:p):[]});
  const notify=()=>{for(const listener of listeners)try{listener(snapshot());}catch{ /* UI projections cannot block owner actions. */ }};
  const say=(msg,tone='')=>{nodes.status.textContent=msg;nodes.status.dataset.tone=tone;};
  function sync(){nodes.load.disabled=busy;nodes.fresh.disabled=busy;nodes.cancel.disabled=busy;
    nodes.save.disabled=busy||!loaded||(!selected&&!reviewed);}
  function clear(){selected=null;reviewed=null;nodes.title.value='';nodes.due.value='';nodes.state.value='draft';
    nodes.note.value='';nodes.items.textContent='Select a saved plan, or prepare a fresh stock worksheet above and choose Start new.';sync();}
  function reopen(planId){
    if(!loaded||busy)return false;
    const p=plans.find(x=>x.plan_id===planId);if(!p)return false;
    selected=p.plan_id;reviewed=null;nodes.title.value=p.title;nodes.due.value=p.follow_up_on||'';
    nodes.state.value=p.status;nodes.note.value=p.owner_note||'';
    nodes.items.textContent=`Reopened saved snapshot: ${p.items.map(x=>`#${x.product_id} ${x.name}: ${x.units} planned, ${x.method}, saved ${x.saved_on_hand}, qualified orders ${x.qualifying_order_committed}`).join(' | ')}. Source evidence may be stale. No stock changes.`;
    say('Editing this owner plan. Save explicitly to update its follow-up status or notes.','ok');
    sync();nodes.title.focus?.();root.scrollIntoView?.({block:'nearest'});return true;
  }
  function display(){
    const sorted=[...plans].sort((a,b)=>((a.status==='completed')-(b.status==='completed'))||
      String(a.follow_up_on||'9999').localeCompare(String(b.follow_up_on||'9999'))||String(b.updated_at).localeCompare(String(a.updated_at)));
    nodes.list.innerHTML=sorted.length?`<div class="dd640-scroll"><table><thead><tr><th>Owner plan</th><th>Follow-up</th><th>Items</th><th>Action</th></tr></thead><tbody>${sorted.map(p=>
      `<tr><td><strong>${esc(p.title)}</strong><div class="small">${esc(p.status.replaceAll('_',' '))} · Updated ${esc(p.updated_at?.slice(0,10))}</div></td>`+
      `<td>${esc(p.follow_up_on||'No date')}</td><td>${p.items.length} Product(s)</td><td><button type="button" class="btn" data-dd641-open="${esc(p.plan_id)}">Reopen</button></td></tr>`).join('')}</tbody></table></div>`:
      '<p class="small">No saved plans for this owner. Prepare a Product worksheet above and create our first plan.</p>';
    nodes.list.querySelectorAll('[data-dd641-open]').forEach(button=>button.addEventListener('click',()=>reopen(button.dataset.dd641Open)));
  }
  async function load(){if(busy)return;busy=true;sync();say('Loading only this signed-in owner’s private restock drafts…');
    try{const res=await window.DDAuth.apiFetch('/api/admin/owner-restock-plans',{method:'GET',cache:'no-store'});
      const data=await res.json().catch(()=>null);if(!res.ok||data?.ok!==true||data.private!==true||
        !Number.isSafeInteger(data.version)||!Array.isArray(data.plans)||!Number.isSafeInteger(data.owner_user_id))
        throw Error(data?.error||'Owner plan read was not verified.');
      plans=data.plans;version=data.version;owner=data.owner_user_id;loaded=true;clear();display();
      say(`Loaded ${plans.length} private owner plan(s) (version ${version}). Reopen an existing plan or create one from the reviewed worksheet.`, 'ok');
    }catch(e){loaded=false;plans=[];version=0;owner=null;clear();nodes.list.textContent='Saved owner plans unavailable; no stale plan may be edited.';
      say(`HOLD — ${e.message||'Unable to verify owner plans.'} No automatic retry.`, 'error');}
    finally{busy=false;sync();notify();}
  }
  function fresh(){if(!loaded){say('First choose Load my saved plans to establish the current owner version.','warn');return;}
    const items=window.DD640RestockDraft?.reviewedItems?.();
    if(!Array.isArray(items)||!items.length){say('Prepare and review the current stock worksheet above before creating a saved draft.','warn');return;}
    clear();reviewed=items;nodes.state.value='draft';nodes.items.textContent=`New unsaved draft from ${items.length} reviewed Product(s): ${items.map(x=>`#${x.product_id}: ${x.units} planned`).join(', ')}. All stock evidence will be checked again on save.`;
    say('New draft ready. Add a title and follow-up details, then explicitly Save owner plan.','ok');sync();
  }
  async function save(){if(busy||!loaded||(!selected&&!reviewed))return;
    const title=nodes.title.value.trim(),due=nodes.due.value,status=nodes.state.value,note=nodes.note.value;
    if(title.length<4||title.length>100||note.length>500||(reviewed&&status!=='draft')){
      say('Use a 4–100 character title, at most 500 characters of follow-up notes and Draft status for a new plan.','warn');return;}
    const body={action:selected?'update':'create',expected_version:version,title,follow_up_on:due,
      status,owner_note:note,...(selected?{plan_id:selected}:{items:reviewed})};
    busy=true;sync();say('Saving one owner-scoped plan; no stock or purchase records will change…');
    try{const res=await window.DDAuth.apiFetch('/api/admin/owner-restock-plans',{method:'POST',
      headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
      const data=await res.json().catch(()=>null);
      if(!res.ok||data?.ok!==true||data.saved!==true||!Number.isSafeInteger(data.version)||
        data.version!==version+1||data.plan?.plan_id===undefined)throw Error(data?.error||'Save was not confirmed.');
      version=data.version;plans=plans.filter(p=>p.plan_id!==data.plan.plan_id);plans.unshift(data.plan);
      selected=data.plan.plan_id;reviewed=null;display();notify();
      say(data.audit_recorded===false?'Saved and verified, but audit logging failed. Do not repeat the save; have an administrator inspect.':
        `Saved privately for owner #${owner} at version ${version}. No stock, order or supplier action was taken.`,
        data.audit_recorded===false?'warn':'ok');
      nodes.items.textContent=`Saved plan contains ${data.plan.items.length} Product snapshot(s). Reopen from the list to track follow-up. Review live stock again before any operational change.`;
    }catch(e){if(/changed|Reload|version|outcome|race/i.test(e.message)){
        loaded=false;selected=null;reviewed=null;plans=[];version=0;nodes.list.textContent='Reload plans explicitly before another edit.';
        notify();
      }say(`HOLD — ${e.message||'Save failed.'} Do not automatically retry; reload and review when uncertain.`, 'error');}
    finally{busy=false;sync();}
  }
  nodes.load?.addEventListener('click',()=>void load());nodes.fresh?.addEventListener('click',fresh);
  nodes.save?.addEventListener('click',()=>void save());nodes.cancel?.addEventListener('click',()=>{clear();say('Selection cleared. No saved plans changed.');});
  // Read-only browser bridge. No API, storage, owner impersonation or stock access.
  window.DD641OwnerPlans={snapshot,reopen,subscribe(listener){if(typeof listener!=='function')return ()=>{};
    listeners.add(listener);try{listener(snapshot());}catch{}return ()=>listeners.delete(listener);}};
  sync();
})();
