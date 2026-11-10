/* Build 671: CAIP source selection -> private, review-first Social Post Queue draft.
 * No source URL is copied; raw CAIP uploads must never be sent to providers. */
(()=>{'use strict';
const $=id=>document.getElementById(id),text=v=>String(v??'').trim();
const root=$('dd671-social-creator');if(!root)return;
let projects=[],assets=[],selectedProject=0,busy=false;
function status(value,error=false){const el=$('dd671Status');el.textContent=value;el.style.color=error?'#f8b4b4':'';}
async function api(url,options={}){if(!window.DDAuth?.apiFetch)throw Error('Admin sign-in is required.');
  const response=await window.DDAuth.apiFetch(url,{cache:'no-store',...options});
  const data=await response.json().catch(()=>({}));if(!response.ok||data.ok!==true)throw Error(data.error||`Request failed (${response.status})`);return data;}
function element(tag,content){const node=document.createElement(tag);node.textContent=content;return node;}
async function loadProjects(){status('Loading current and previous CAIP projects…');
  const data=await api('/api/admin/caip-evidence-review');projects=data.projects||[];
  const list=$('dd671Project');list.replaceChildren(element('option','Choose an existing CAIP project'));
  for(const p of projects){const option=element('option',`${p.project_title||p.product_name||p.creative_project_key||'CAIP project'} · ${p.project_status||'status unknown'}`);option.value=String(p.creative_project_id);list.append(option);}
  $('dd671Create').disabled=false;status(`${projects.length} source project(s) available. Choose one to tag media.`);
  const fromLink=Number(new URLSearchParams(location.search).get('creative_project_id')||0);
  if(projects.some(p=>Number(p.creative_project_id)===fromLink)){list.value=String(fromLink);await loadAssets();}}
async function loadAssets(){selectedProject=Number($('dd671Project').value)||0;assets=[];
  const fieldset=$('dd671Assets');fieldset.replaceChildren(element('legend','Tag source media'));
  if(!selectedProject){fieldset.append(element('p','Choose a project first.'));return;}
  status('Loading source media (private references only)…');const data=await api(`/api/admin/caip-evidence-review?creative_project_id=${selectedProject}`);
  assets=(data.assets||[]).filter(a=>Number(a.creative_project_id)===selectedProject&&a.asset_status!=='archived');
  if(!assets.length){fieldset.append(element('p','No source assets. Upload or link media through CAIP first.'));return;}
  for(const asset of assets.slice(0,80)){
    const label=element('label','');label.className='dd671-asset';
    const check=document.createElement('input');check.type='checkbox';check.value=String(asset.creative_asset_id);check.name='dd671Asset';
    const info=document.createElement('span');info.append(element('strong',asset.original_filename||asset.asset_key||`Asset ${asset.creative_asset_id}`));
    const detail=element('small',`${asset.media_type||'media'} · rights ${asset.rights_status||'unverified'} · consent ${asset.consent_state||'unverified'} · privacy ${asset.privacy_state||'unverified'}`);
    info.append(detail);label.append(check,info);fieldset.append(label);
  }
  if(assets.length>80)fieldset.append(element('p','Showing first 80 assets. Open CAIP for the complete library.'));
  status(`${assets.length} actual source asset(s) found. Select the ones to reference in the social draft.`);
}
async function createDraft(event){event.preventDefault();if(busy)return;
  const project=projects.find(p=>Number(p.creative_project_id)===selectedProject),picked=[...root.querySelectorAll('input[name="dd671Asset"]:checked')].map(x=>Number(x.value));
  const valid=new Set(assets.map(a=>Number(a.creative_asset_id)));const platforms=[...root.querySelectorAll('.dd671-platforms input:checked')].map(x=>x.value);
  if(!project||!picked.length||picked.some(id=>!valid.has(id)))return status('Choose a real project and at least one of its CAIP source assets.',true);
  if(!platforms.length)return status('Choose at least one intended social platform.',true);
  if(!$('dd671Confirm').checked)return status('Confirm the manual rights and consent review requirement.',true);
  busy=true;$('dd671Create').disabled=true;status('Saving a private review draft; no publishing will occur…');
  try{const ids=picked.join(',');const data=await api('/api/admin/social-post-queue',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({
    action:'create',source_type:'caip_project',source_id:String(selectedProject),title:text($('dd671Title').value),summary:text($('dd671Summary').value),
    target_platforms:platforms,post_status:'draft',image_urls:[],video_url:'',notes:`Build 671 source references: CAIP project ${selectedProject}; creative_asset_ids ${ids}. Private raw originals are NOT publication-ready. Verify rights, consent, derivative approval and intended account before any provider publish.`
  })});
    const id=data.result?.social_post_queue_id;status(`Draft ${id||''} saved for review. No media transferred and nothing published.`);
    $('dd671Form').reset();
  }catch(e){status(e.message||'Draft save failed; inspect the queue before retrying.',true);}
  finally{busy=false;$('dd671Create').disabled=false;}
}
root.addEventListener('submit',createDraft);$('dd671Project').addEventListener('change',()=>loadAssets().catch(e=>status(e.message,true)));
loadProjects().catch(e=>status(e.message,true));
})();
