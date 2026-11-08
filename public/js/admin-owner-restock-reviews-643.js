// Build 643 — opt-in private review-note timeline, never a stock/order action.
(() => {
  'use strict';
  const $=id=>document.getElementById(id),root=$('dd643ReviewPanel');
  if(!root||!window.DDAuth||!window.DD641OwnerPlans)return;
  const planSelect=$('dd643Plan'),outcome=$('dd643Outcome'),note=$('dd643Note'),load=$('dd643Load'),
    save=$('dd643Save'),more=$('dd643More'),status=$('dd643Status'),entries=$('dd643Entries');
  const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const labels={needs_physical_count:'Physical count still needed',needs_supplier_review:'Supplier review still needed',
    needs_workshop_review:'Workshop review still needed',follow_up_scheduled:'Owner follow-up scheduled',
    no_change_recommended:'No stock change recommended',separate_action_recommended:'Separate controlled action recommended'};
  let owner=null,planVersion=null,plans=[],selected='',timelineLoaded=false,timelineVersion=0,
    events=[],cursor=null,busy=false;
  const say=(message,tone='')=>{status.textContent=message;status.dataset.tone=tone;};
  const sync=()=>{load.disabled=busy||!selected;save.disabled=busy||!selected||!timelineLoaded;
    more.disabled=busy||!timelineLoaded||!cursor;};
  function invalidate(){timelineLoaded=false;timelineVersion=0;events=[];cursor=null;
    entries.textContent='Select Load recent 10 reviews. No review history is fetched automatically.';sync();}
  function render(){
    entries.innerHTML=events.length?`<ol>${events.map(event=>`<li class="dd640-plan"><strong>${esc(labels[event.outcome]||'Unverified review outcome')}</strong>
      <div class="small">Recorded ${esc(event.recorded_at)} · saved plan version ${Number(event.plan_version)}</div>
      <p>${esc(event.note)}</p><div class="small">Plan status at review: ${esc(event.status_at_review)} · follow-up date: ${esc(event.follow_up_on_at_review||'none')}. No Product stock authority is inferred.</div></li>`).join('')}</ol>`:
      '<p class="small">This saved plan has no recorded Build 643 review notes. Earlier status edits are not backfilled.</p>';
  }
  function receive(s){
    if(s?.loaded!==true||!Number.isSafeInteger(s.owner_user_id)||!Number.isSafeInteger(s.version)||!Array.isArray(s.plans)){
      owner=null;planVersion=null;plans=[];selected='';planSelect.innerHTML='<option value="">Load my saved plans above first</option>';
      invalidate();say('Owner plan evidence unavailable. No private reviews are displayed.','warn');return;}
    const changed=owner!==s.owner_user_id||planVersion!==s.version;
    owner=s.owner_user_id;planVersion=s.version;plans=s.plans.filter(p=>typeof p?.plan_id==='string'&&typeof p?.title==='string');
    planSelect.innerHTML='<option value="">Select a saved owner plan</option>'+plans.map(p=>
      `<option value="${esc(p.plan_id)}">${esc(p.title)}</option>`).join('');
    if(!plans.some(p=>p.plan_id===selected))selected='';
    planSelect.value=selected;
    if(changed){invalidate();say('Owner plans refreshed. Choose a plan and explicitly load its review notes.','ok');}
    sync();
  }
  function validate(data){return data?.ok===true&&data.private===true&&data.plan_id===selected&&
    data.owner_user_id===owner&&Number.isSafeInteger(data.timeline_version)&&data.timeline_version>=0&&
    Number.isSafeInteger(data.plan_version)&&data.plan_version===planVersion&&Array.isArray(data.events)&&
    data.events.length<=10&&data.events.every(x=>typeof x?.event_id==='string'&&typeof x?.recorded_at==='string'&&
      typeof x?.note==='string'&&Object.hasOwn(labels,x.outcome))&&
    (data.next_cursor===null||typeof data.next_cursor==='string');}
  async function read(earlier=false){if(busy||!selected||(earlier&&(!timelineLoaded||!cursor)))return;
    busy=true;sync();say(earlier?'Loading one earlier review page…':'Loading last 10 private owner reviews…');
    try{const url='/api/admin/owner-restock-review-notes?plan_id='+encodeURIComponent(selected)+
      (earlier?'&before='+encodeURIComponent(cursor):'');
      const r=await window.DDAuth.apiFetch(url,{method:'GET',cache:'no-store'}),data=await r.json().catch(()=>null);
      if(!r.ok||!validate(data))throw Error(data?.error||'Private review evidence was incomplete.');
      if(earlier&&data.timeline_version!==timelineVersion)throw Error('History changed. Reload the first page.');
      if(!earlier){events=[];timelineVersion=data.timeline_version;}
      const known=new Set(events.map(e=>e.event_id));for(const event of data.events)if(!known.has(event.event_id)){events.push(event);known.add(event.event_id);}
      cursor=data.next_cursor;timelineLoaded=true;render();
      say(`${events.length} dated review(s) displayed. ${cursor?'Choose Load earlier reviews for one more page.':'No additional pages.'}`,'ok');
    }catch(e){invalidate();say(`HOLD — ${e.message||'Unable to verify review history.'} No automatic retry.`, 'error');}
    finally{busy=false;sync();}
  }
  async function record(){if(busy||!timelineLoaded||!selected)return;
    const text=note.value.trim();if(text.length<8||text.length>300||!Object.hasOwn(labels,outcome.value)){
      say('Enter one factual 8–300 character note and choose a review outcome. Nothing was saved.','warn');return;}
    busy=true;sync();say('Saving one dated private owner review; no stock or supplier record will change…');
    const body={plan_id:selected,expected_plan_version:planVersion,expected_timeline_version:timelineVersion,
      outcome:outcome.value,note:text};
    try{const r=await window.DDAuth.apiFetch('/api/admin/owner-restock-review-notes',{method:'POST',
      headers:{'Content-Type':'application/json'},body:JSON.stringify(body)}),data=await r.json().catch(()=>null);
      if(!r.ok||data?.ok!==true||data.saved!==true||data.private!==true||data.plan_id!==selected||
        data.owner_user_id!==owner||data.timeline_version!==timelineVersion+1||data.event?.note!==text)
        throw Error(data?.error||'Review save could not be confirmed.');
      events.unshift(data.event);timelineVersion=data.timeline_version;note.value='';render();
      say(data.audit_recorded===false?(data.warning||'Private note saved, but metadata audit failed. Do not repeat it; ask an administrator to inspect.'):
        'Private dated owner review saved and verified. No Product, purchase or marketplace record changed.',data.audit_recorded===false?'warn':'ok');
    }catch(e){invalidate();say(`HOLD — ${e.message||'Review save unverified.'} Reload before another write; never automatically retry.`, 'error');}
    finally{busy=false;sync();}
  }
  planSelect.addEventListener('change',()=>{selected=planSelect.value;
    if(!plans.some(p=>p.plan_id===selected))selected='';invalidate();
    say(selected?'Choose Load recent 10 reviews for this private plan.':'Choose a saved owner plan.');});
  load.addEventListener('click',()=>void read(false));more.addEventListener('click',()=>void read(true));
  save.addEventListener('click',()=>void record());
  window.DD641OwnerPlans.subscribe(receive);sync();
})();
