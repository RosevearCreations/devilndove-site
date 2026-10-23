// Build 444: human-controlled private design revision library (no auto-publication).
(() => {
  'use strict';
  const api='/api/admin/project-design-files';
  const $=id=>document.getElementById(id);
  const escaped=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const state={projectId:0,revisions:[],outputs:[],links:[],projects:[],busy:false,uploadKey:''};
  const message=(text,error=false)=>{const n=$('makerMessage');n.textContent=text;n.style.borderColor=error?'#f5a2a2':'#8d8ab4';};
  const active=()=>!!state.projectId;
  const latest=key=>state.revisions.find(r=>r.design_key===key);
  const currentLink=id=>state.links.find(l=>Number(l.creative_work_output_id)===Number(id));
  const uid=()=>globalThis.crypto?.randomUUID?.().replaceAll('-','')||`${Date.now()}_${Math.random().toString(36).slice(2).padEnd(16,'0')}`;
  const opt=(id,label)=>`<option value="${escaped(id)}">${escaped(label)}</option>`;
  const fetchJson=async(url,options)=>{
    const response=await fetch(url,{credentials:'same-origin',cache:'no-store',...options});
    const payload=await response.json().catch(()=>({ok:false,error:`HTTP ${response.status} without JSON`}));
    if(!response.ok||!payload.ok)throw new Error(payload.error||`Request failed (${response.status})`);
    return payload;
  };
  const busy=on=>{state.busy=on;document.querySelectorAll('button').forEach(b=>b.disabled=on);};
  async function projects(){
    const data=await fetchJson(api);state.projects=data.projects||[];
    $('makerProject').innerHTML=opt('','Choose a Creative Project')+state.projects.map(p=>opt(p.creative_work_project_id,p.project_title+' (#'+p.creative_work_project_id+')')).join('');
    const fromUrl=Number(new URLSearchParams(location.search).get('project_id')||0);
    if(state.projects.some(p=>Number(p.creative_work_project_id)===fromUrl))$('makerProject').value=String(fromUrl);
    if($('makerProject').value)await refresh();else message('Choose an existing Creative Project to begin. Files stay private.');
  }
  async function refresh(){
    const id=Number($('makerProject').value||0);state.projectId=id;
    for(const suffix of ['Upload','History','Outputs'])$('maker'+suffix+'Section').hidden=!id;
    if(!id){message('Choose a project.');return;}
    const data=await fetchJson(`${api}?project_id=${id}`);
    state.revisions=data.revisions||[];state.outputs=data.outputs||[];state.links=data.links||[];
    history();outputs();parents();
    window.history.replaceState(null,'',location.pathname+'?project_id='+id);
    message(`${data.project.project_title}: ${state.revisions.length} exact revisions, ${state.outputs.length} project outputs. Private originals only.`);
  }
  function parents(){
    const select=$('makerParent');
    select.innerHTML=opt(0,'New design — revision 1')+state.revisions.filter(r=>latest(r.design_key)===r).map(r=>opt(r.maker_design_file_revision_id,`${r.design_key} • latest r${r.revision_no} • ${r.design_title}`)).join('');
    select.onchange=()=>{const r=state.revisions.find(x=>String(x.maker_design_file_revision_id)===select.value);if(r){const f=$('makerUpload');f.elements.design_key.value=r.design_key;f.elements.design_title.value=r.design_title;}};
  }
  function history(){
    $('makerHistory').innerHTML=state.revisions.length?state.revisions.map(r=>{
      const id=r.maker_design_file_revision_id,status=r.review_status||'pending';
      return `<article class="maker-item" data-revision="${id}"><h3>${escaped(r.design_title)} • ${escaped(r.design_key)} r${r.revision_no}</h3>
      <p><strong>Review:</strong> ${escaped(status)} · Machine: ${escaped(r.machine_readiness)} · Rights: ${escaped(r.source_license)}</p>
      <p><small>Original: ${escaped(r.original_filename)} · ${Math.round(Number(r.file_size_bytes||0)/1024)} KiB · parent #${escaped(r.parent_revision_id||'none')}<br>SHA-256: <code>${escaped(r.sha256_hex)}</code></small></p>
      <p>${escaped(r.revision_note||'No revision note')} ${r.review_note?'<br>Latest decision: '+escaped(r.review_note):''}</p>
      <p><a href="${api}?project_id=${state.projectId}&revision_id=${id}&download=1" download>Download private original</a></p>
      <form class="makerReview" data-revision="${id}" data-review="${r.review_id||0}">
      <label>Review decision<select name="review_status">${opt('needs_changes','Needs changes')}${opt('approved','Approved')}${opt('rejected','Rejected')}</select></label>
      <label>Factual review note (12+ characters)<textarea name="review_note" minlength="12" maxlength="1200" required></textarea></label>
      <button type="submit">Save review decision</button></form></article>`;
    }).join(''):'<p>No designs saved yet. Upload a new private revision above.</p>';
  }
  function outputs(){
    const selected=$('makerOutputSelect'),approved=$('makerApprovedSelect');
    selected.innerHTML=opt('','Choose output')+state.outputs.map(o=>opt(o.creative_work_output_id,`${o.output_label} (${o.output_status})`)).join('');
    approved.innerHTML=opt('','Choose approved revision')+state.revisions.filter(r=>r.review_status==='approved').map(r=>opt(r.maker_design_file_revision_id,`${r.design_key} r${r.revision_no} — ${r.design_title}`)).join('');
    $('makerOutputHistory').innerHTML=state.outputs.length?`<h3>Current output references and prior decisions</h3>`+state.outputs.map(o=>{
      const entries=state.links.filter(l=>Number(l.creative_work_output_id)===Number(o.creative_work_output_id));
      return `<div class="maker-item"><strong>${escaped(o.output_label)}</strong> (${escaped(o.output_status)})<br>${entries.length?entries.map((l,i)=>`${i===0?'Current':'Earlier'}: ${escaped(l.design_key)} r${l.revision_no} · <code>${escaped(l.sha256_hex)}</code> · ${escaped(l.link_note)}`).join('<hr>'):'No design assigned'}</div>`;
    }).join(''):'<p>This project has no canonical outputs yet. Create one in Creative Process before linking.</p>';
  }
  async function jsonAction(payload){
    return fetchJson(api,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({project_id:state.projectId,...payload})});
  }
  $('makerProject').onchange=()=>refresh().catch(e=>message(e.message,true));
  $('makerRefresh').onclick=()=>refresh().catch(e=>message(e.message,true));
  $('makerUpload').onsubmit=async(event)=>{
    event.preventDefault();if(!active()||state.busy)return;
    const form=event.currentTarget,field=form.elements.file.files[0];
    if(!field||field.size>12*1024*1024){message('Choose a supported file up to 12 MiB.',true);return;}
    const data=new FormData(form);data.set('project_id',String(state.projectId));data.set('request_key',state.uploadKey||uid());state.uploadKey=data.get('request_key');
    busy(true);message('Saving an immutable private original… Do not close the page.');
    try{
      const result=await fetchJson(api,{method:'POST',body:data});
      state.uploadKey='';form.reset();await refresh();message(result.message);
    }catch(e){message(e.message+' Keep the page open and retry with the same file if unsure.',true);}finally{busy(false);}
  };
  $('makerHistory').addEventListener('submit',async(event)=>{
    const form=event.target.closest('.makerReview');if(!form)return;event.preventDefault();if(state.busy)return;
    busy(true);
    try{const result=await jsonAction({action:'review_revision',revision_id:Number(form.dataset.revision),expected_review_id:Number(form.dataset.review||0),
      review_status:form.elements.review_status.value,review_note:form.elements.review_note.value});
      await refresh();message(result.message);
    }catch(e){message(e.message,true);}finally{busy(false);}
  });
  $('makerLink').onsubmit=async(event)=>{
    event.preventDefault();if(state.busy)return;
    const form=event.currentTarget,outputId=Number(form.elements.output_id.value),prior=currentLink(outputId);
    busy(true);
    try{const result=await jsonAction({action:'link_output',output_id:outputId,revision_id:Number(form.elements.revision_id.value),
      link_note:form.elements.link_note.value,replace_existing:form.elements.replace_existing.checked,
      expected_link_id:Number(prior?.maker_design_output_link_id||0)});
      await refresh();message(result.message);
    }catch(e){message(e.message,true);}finally{busy(false);}
  };
  projects().catch(e=>message(e.message,true));
})();
