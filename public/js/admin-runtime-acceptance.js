// Release 459 — authenticated Development runtime acceptance UI.
(function(){
  'use strict';
  const RELEASE=459;
  const byId=(id)=>document.getElementById(id);
  const text=(v)=>String(v==null?'':v).trim();
  const esc=(v)=>text(v).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#039;');
  const apiFetch=(url,options={})=>window.DDAuth?.apiFetch?window.DDAuth.apiFetch(url,options):fetch(url,{credentials:'same-origin',...options});
  let lastEvidence=null;
  const CORE=[
    ['application_modules','/api/admin/app-modules'],
    ['infrastructure','/api/admin/infrastructure-readiness'],
    ['it_provider_readiness','/api/admin/it-provider-readiness'],
    ['it_provider_setup_guide','/api/admin/it-provider-setup-guide'],
    ['product_lineage','/api/admin/product-lineage?limit=1'],
    ['product_image_quality','/api/admin/product-image-quality?summary=1&limit=1'],
    ['storefront_merchandising','/api/admin/storefront-merchandising'],
    ['inventory_intelligence','/api/admin/inventory-intelligence'],
    ['tool_lifecycle','/api/admin/tool-lifecycle'],
    ['supply_sourcing','/api/admin/supply-sourcing'],
    ['release448_calibration','/api/admin/release448-calibration'],
    ['it_integrations','/api/admin/it-integrations']
  ];
  async function readJson(response){const type=text(response.headers?.get?.('content-type')).toLowerCase();if(!type.includes('application/json'))throw new Error(`HTTP ${response.status} did not return JSON.`);const payload=await response.json();if(!response.ok||payload?.ok===false)throw new Error(payload?.error||`HTTP ${response.status}`);return payload}
  function setStatus(id,value,error=false){const node=byId(id);if(!node)return;node.textContent=value;node.classList.toggle('is-error',error);node.classList.toggle('is-success',!error&&Boolean(value))}
  function validate(name,payload){
    if(name==='application_modules'){
      const keys=(payload.modules||[]).map((row)=>text(row?.module_key).toLowerCase()).filter(Boolean).sort();
      const wanted=['creators','financials','it-platform','socials','storefront'];
      const d=payload.diagnostics||{};
      return {pass:Number(payload.release)===RELEASE&&payload.schema_ready===true&&payload.migration_required===false&&d.healthy===true&&Number(d.role_access_count)===10&&JSON.stringify(keys)===JSON.stringify(wanted),detail:`release ${payload.release}; modules ${keys.length}; role rows ${d.role_access_count||0}; healthy ${Boolean(d.healthy)}`};
    }
    if(name==='infrastructure')return {pass:payload.target==='development'&&payload.project==='devilndove-site-dev'&&payload.ready===true&&payload.d1?.schema_ready===true&&Array.isArray(payload.r2)&&payload.r2.length===2&&payload.r2.every((row)=>row.storage_ready===true),detail:`target ${payload.target}; project ${payload.project}; ready ${Boolean(payload.ready)}`};
    if(name==='it_provider_readiness')return {pass:payload.schema_ready===true&&payload.provider_execution_allowed===false&&payload.provider_publication_allowed===false&&Array.isArray(payload.providers),detail:`providers ${(payload.providers||[]).length}; execution ${payload.provider_execution_allowed}; publication ${payload.provider_publication_allowed}`};
    if(name==='it_provider_setup_guide')return {pass:Number(payload.release)===RELEASE&&payload.secret_values_emitted===false&&payload.provider_execution_allowed===false&&payload.provider_publication_allowed===false&&Array.isArray(payload.providers)&&payload.providers.length===8,detail:`release ${payload.release}; providers ${(payload.providers||[]).length}; secrets emitted ${payload.secret_values_emitted}`};
    if(name==='supply_sourcing')return {pass:payload.ok===true&&payload.stock_mutation_capability==='none',detail:`stock mutation ${payload.stock_mutation_capability}`};
    if(name==='inventory_intelligence')return {pass:payload.ok===true&&payload.write_authority_duplicated===false,detail:`write authority duplicated ${payload.write_authority_duplicated}`};
    if(name==='release448_calibration')return {pass:payload.ok===true&&Number(payload.summary?.schema_blocked||0)===0,detail:`schema blocked ${payload.summary?.schema_blocked||0}`};
    if(Object.prototype.hasOwnProperty.call(payload,'schema_ready'))return {pass:payload.ok===true&&payload.schema_ready!==false,detail:`ok ${Boolean(payload.ok)}; schema_ready ${payload.schema_ready}`};
    return {pass:payload.ok===true,detail:`ok ${Boolean(payload.ok)}`};
  }
  function render(evidence){const mount=byId('runtimeResults');if(!mount)return;mount.innerHTML=evidence.checks.map((row)=>`<div class="runtime-row ${row.status==='PASS'?'is-pass':'is-fail'}"><strong>${esc(row.status)} · ${esc(row.check)}</strong><span class="small">${esc(row.detail)}</span></div>`).join('')}
  async function runCore(){
    const button=byId('runtimeRunCore');if(button)button.disabled=true;byId('runtimeExport').disabled=true;setStatus('runtimeStatus','Running authenticated GET-only Development acceptance…');
    const checks=[];
    for(const [name,path] of CORE){
      try{const response=await apiFetch(path,{method:'GET',cache:'no-store'});const payload=await readJson(response);const result=validate(name,payload);checks.push({check:name,status:result.pass?'PASS':'FAIL',detail:`HTTP ${response.status}; ${result.detail}`})}
      catch(error){checks.push({check:name,status:'FAIL',detail:text(error?.message||error)})}
    }
    const pass=checks.every((row)=>row.status==='PASS');
    lastEvidence={authority:'development-runtime-acceptance',release:RELEASE,mode:'authenticated-development-read-only',target:location.origin,generated_at:new Date().toISOString(),http_method:'GET',credentials_emitted:false,core_runtime:pass?'PASS':'FAIL',checks,provider_transaction_acceptance:'NOT_PERFORMED',provider_execution:false,provider_publication:false,caip_private_media_acceptance:'NOT_PERFORMED',production_mutation:false};
    render(lastEvidence);setStatus('runtimeStatus',`Core runtime acceptance: ${lastEvidence.core_runtime}. ${checks.filter((row)=>row.status==='PASS').length}/${checks.length} checks passed.`,!pass);byId('runtimeExport').disabled=false;if(button)button.disabled=false;
  }
  function exportEvidence(){if(!lastEvidence)return;const blob=new Blob([JSON.stringify(lastEvidence,null,2)+'\n'],{type:'application/json'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=`devilndove-release459-runtime-${new Date().toISOString().replace(/[:.]/g,'-')}.json`;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000)}
  function mediaProof(url,contentType){return new Promise((resolve)=>{
    const mount=byId('runtimeCaipMedia');mount.innerHTML='';let node;if(contentType.startsWith('video/'))node=document.createElement('video');else if(contentType.startsWith('audio/'))node=document.createElement('audio');else if(contentType.startsWith('image/'))node=document.createElement('img');else return resolve({metadata_loaded:false,seek_checked:false,detail:`Unsupported preview MIME ${contentType||'unknown'}`});
    node.controls=true;node.preload='metadata';node.autoplay=false;node.src=url;node.className='runtime-proof-media';let settled=false;const done=(result)=>{if(settled)return;settled=true;resolve(result)};node.addEventListener('error',()=>done({metadata_loaded:false,seek_checked:false,detail:'Media metadata load failed.'}),{once:true});node.addEventListener('loadedmetadata',()=>{if(node.tagName==='VIDEO'||node.tagName==='AUDIO'){const duration=Number(node.duration||0);if(Number.isFinite(duration)&&duration>1){try{node.currentTime=Math.min(1,duration/2)}catch{}node.addEventListener('seeked',()=>done({metadata_loaded:true,seek_checked:true,duration_seconds:duration,autoplay:false}),{once:true});setTimeout(()=>done({metadata_loaded:true,seek_checked:false,duration_seconds:duration,autoplay:false}),3000)}else done({metadata_loaded:true,seek_checked:false,duration_seconds:duration||null,autoplay:false})}else done({metadata_loaded:true,seek_checked:false,autoplay:false})},{once:true});mount.appendChild(node);if(node.tagName==='IMG')node.addEventListener('load',()=>done({metadata_loaded:true,seek_checked:false,autoplay:false}),{once:true});setTimeout(()=>done({metadata_loaded:false,seek_checked:false,detail:'Metadata timed out.'}),8000)});}
  async function runCaip(){
    const project=Number(byId('runtimeCaipProject')?.value||0),asset=Number(byId('runtimeCaipAsset')?.value||0),button=byId('runtimeRunCaip');if(!Number.isInteger(project)||project<1||!Number.isInteger(asset)||asset<1){setStatus('runtimeCaipStatus','Enter valid positive Creative project and asset IDs.',true);return}
    button.disabled=true;setStatus('runtimeCaipStatus','Creating short-lived secure review grant…');byId('runtimeCaipMedia').innerHTML='';
    try{
      const grantPayload=await readJson(await apiFetch('/api/admin/creative-assets',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'create_secure_review_link',creative_project_id:project,creative_asset_id:asset,expires_in_minutes:10,max_access_count:25})}));
      const reviewUrl=grantPayload?.result?.review_url;if(!reviewUrl)throw new Error('Secure review URL was not returned.');
      const ranged=await apiFetch(reviewUrl,{method:'GET',headers:{Range:'bytes=0-1023'},cache:'no-store'});const accept=text(ranged.headers.get('Accept-Ranges')).toLowerCase(),range=text(ranged.headers.get('Content-Range')),type=text(ranged.headers.get('Content-Type')).toLowerCase();
      if(ranged.status!==206||accept!=='bytes'||!range.startsWith('bytes '))throw new Error(`Range proof failed: HTTP ${ranged.status}; Accept-Ranges ${accept||'missing'}; Content-Range ${range||'missing'}`);
      await ranged.arrayBuffer();const media=await mediaProof(reviewUrl,type);
      const evidence={range_status:ranged.status,accept_ranges:accept,content_range_present:Boolean(range),content_type:type,metadata_loaded:Boolean(media.metadata_loaded),seek_checked:Boolean(media.seek_checked),autoplay:false,source_media_copied:false,source_media_overwritten:false,provider_execution:false,publication:false,raw_review_token_recorded:false};
      setStatus('runtimeCaipStatus',`CAIP proof ${evidence.metadata_loaded?'PASS':'PARTIAL'}: bounded 206 range read passed; metadata ${evidence.metadata_loaded?'loaded':'not loaded'}; seek ${evidence.seek_checked?'verified':'not applicable/not verified'}. Source media unchanged.`,!evidence.metadata_loaded);
      if(lastEvidence){lastEvidence.caip_private_media_acceptance=evidence.metadata_loaded?'PASS':'PARTIAL';lastEvidence.caip_private_media_evidence=evidence}
    }catch(error){setStatus('runtimeCaipStatus',`CAIP proof failed safely: ${text(error?.message||error)} No source copy/provider publication was attempted.`,true)}finally{button.disabled=false}
  }
  function init(){byId('runtimeRunCore')?.addEventListener('click',runCore);byId('runtimeExport')?.addEventListener('click',exportEvidence);byId('runtimeRunCaip')?.addEventListener('click',runCaip)}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
