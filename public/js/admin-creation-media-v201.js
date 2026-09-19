// Release 467 Build 201 — specialist creation image editor.
(()=>{
  'use strict';
  if(!window.DDAuth)return;
  const state={target:null,media:[],hasMore:false,before:null,loading:false};
  const id=(v)=>document.getElementById(v);
  const esc=(v)=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const text=(v)=>String(v??'').trim();
  const params=new URLSearchParams(location.search);
  const identity={catalog_item_id:text(params.get('creation_id')),source_key:text(params.get('creation_key'))};
  function msg(message='',error=false){const el=id('creationMediaMessage');if(!el)return;el.hidden=!message;el.textContent=message;el.classList.toggle('is-error',!!error);el.classList.toggle('is-success',!!message&&!error);}
  async function read(response,fallback){const data=await response.json().catch(()=>null);if(!response.ok||!data?.ok)throw new Error(data?.error||data?.detail||fallback);return data;}
  function targetQuery(extra={}){const p=new URLSearchParams(extra);if(identity.catalog_item_id)p.set('catalog_item_id',identity.catalog_item_id);if(identity.source_key)p.set('source_key',identity.source_key);return p;}
  function renderTarget(){
    const t=state.target,el=id('creationMediaCurrent');if(!el)return;
    if(!t){el.innerHTML='<div class="small">No creation is selected.</div>';return;}
    el.innerHTML='<div><img src="'+esc(t.image_url||'/assets/mark.png')+'" alt="'+esc(t.name||'Creation')+'"/></div><div><p class="eyebrow">Exact creation target</p><h2>'+esc(t.name||'Creation')+'</h2><p class="small">Catalog #'+Number(t.catalog_item_id||0)+' · '+esc(t.source_key||'no source key')+'</p><p class="small"><strong>Current image:</strong> '+esc(t.image_url||'none recorded')+'</p><p class="small">A selection below updates only <code>catalog_items.image_url</code> for this creation after a stale-safe check.</p><a class="btn" href="/creations/?media-edit=1">Back to Creations preview</a></div>';
  }
  function renderMedia(){
    const el=id('creationMediaLibrary');if(!el)return;
    if(!state.media.length){el.innerHTML='<div class="small">No matching managed public images were found. Upload a new creation image below.</div>';}
    else el.innerHTML=state.media.map(m=>'<article class="card creation-media-card"><img src="'+esc(m.public_url||'')+'" alt="'+esc(m.alt_text||m.display_name||'Managed image')+'" loading="lazy"/><strong>'+esc(m.display_name||m.original_filename||m.object_key)+'</strong><span class="small">'+esc((m.width_px||'?')+' × '+(m.height_px||'?'))+' · Media #'+Number(m.media_asset_id||0)+'</span><button class="btn primary" type="button" data-use-creation-media="'+Number(m.media_asset_id||0)+'">Use for this creation</button></article>').join('');
    el.querySelectorAll('[data-use-creation-media]').forEach(button=>button.addEventListener('click',()=>assign(Number(button.dataset.useCreationMedia),button)));
    const more=id('creationMediaMore');if(more){more.hidden=!state.hasMore;more.disabled=state.loading;}
  }
  async function load({append=false}={}){
    if(state.loading)return;state.loading=true;msg(append?'Loading more managed images…':'Loading creation image choices…');
    const p=targetQuery({limit:'48'}),q=text(id('creationMediaSearch')?.value);if(q)p.set('q',q);if(append&&state.before)p.set('before_id',String(state.before));
    try{
      const data=await read(await window.DDAuth.apiFetch('/api/admin/creation-media?'+p.toString(),{cache:'no-store'}),'Creation image editor could not load.');
      state.target=data.target||state.target;const incoming=Array.isArray(data.media)?data.media:[];state.media=append?state.media.concat(incoming):incoming;state.hasMore=!!data.has_more;state.before=data.next_before_id||null;renderTarget();renderMedia();msg('Creation image editor loaded. Nothing changes until we explicitly choose or upload an image.');
    }catch(error){msg(error.message||'Creation image editor failed.',true);if(!append){state.media=[];renderMedia();}}
    finally{state.loading=false;}
  }
  async function assign(mediaId,button){
    if(!state.target||!mediaId)return;const name=state.media.find(m=>Number(m.media_asset_id)===mediaId)?.display_name||('Media #'+mediaId);
    if(!confirm('Use “'+name+'” for “'+(state.target.name||'this creation')+'”?\n\nOnly this creation image will change.'))return;
    const old=button?.textContent||'';if(button){button.disabled=true;button.textContent='Saving & verifying…';}
    try{
      const payload={action:'assign_media',catalog_item_id:Number(state.target.catalog_item_id||0),source_key:state.target.source_key||'',media_asset_id:mediaId,expected_updated_at:state.target.updated_at||''};
      const data=await read(await window.DDAuth.apiFetch('/api/admin/creation-media',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)}),'Creation image could not be saved.');
      state.target=data.target||state.target;renderTarget();msg(data.message||'Creation image saved and verified.');
    }catch(error){msg(error.message||'Creation image save failed safely.',true);}
    finally{if(button?.isConnected){button.disabled=false;button.textContent=old;}}
  }
  async function upload(){
    if(!state.target)return;const file=id('creationMediaUploadFile')?.files?.[0];if(!file){msg('Choose an image file first.',true);return;}
    const button=id('creationMediaUpload'),old=button.textContent;button.disabled=true;button.textContent='Uploading…';
    try{
      const form=new FormData();form.append('file',file);form.append('upload_scope','creation');form.append('attach_to_product','0');form.append('variant_role','library');
      const uploaded=await read(await window.DDAuth.apiFetch('/api/admin/media-upload',{method:'POST',body:form}),'Creation image upload failed.');
      const mediaId=Number(uploaded.asset?.media_asset_id||0);if(!mediaId)throw new Error('Upload completed but did not return a managed media ID.');
      const payload={action:'assign_media',catalog_item_id:Number(state.target.catalog_item_id||0),source_key:state.target.source_key||'',media_asset_id:mediaId,expected_updated_at:state.target.updated_at||''};
      const saved=await read(await window.DDAuth.apiFetch('/api/admin/creation-media',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)}),'The upload succeeded but creation assignment could not be verified.');
      state.target=saved.target||state.target;id('creationMediaUploadFile').value='';renderTarget();msg('New image uploaded, assigned to this creation, and verified.');await load({append:false});
    }catch(error){msg(error.message||'Creation image upload failed safely.',true);}
    finally{button.disabled=false;button.textContent=old;}
  }
  function bind(){
    id('creationMediaSearchButton')?.addEventListener('click',()=>load({append:false}));
    id('creationMediaRefresh')?.addEventListener('click',()=>load({append:false}));
    id('creationMediaSearch')?.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();load({append:false});}});
    id('creationMediaMore')?.addEventListener('click',()=>load({append:true}));
    id('creationMediaUpload')?.addEventListener('click',upload);
  }
  bind();
  if(!identity.catalog_item_id&&!identity.source_key){msg('No creation was selected. Return to the Creations preview, turn Editing ON, and choose Edit image on a card.',true);return;}
  load({append:false});
})();
