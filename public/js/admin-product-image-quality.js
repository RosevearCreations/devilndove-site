// Devil n Dove Release 448 — transparent browser-based Product image quality scoring.
(function () {
  'use strict';
  const byId = (id) => document.getElementById(id);
  const text = (value) => String(value == null ? '' : value).trim();
  const esc = (value) => text(value).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#039;');
  const apiFetch = (url, options = {}) => window.DDAuth?.apiFetch ? window.DDAuth.apiFetch(url, options) : fetch(url, { credentials:'same-origin', ...options });
  const state = { products:[], productId:Number(new URLSearchParams(location.search).get('product_id') || 0) || 0, images:[], assessments:[] };

  async function readJson(response) {
    const type = text(response.headers?.get?.('content-type')).toLowerCase();
    if (!type.includes('application/json')) throw new Error(`HTTP ${response.status} did not return JSON.`);
    const payload = await response.json();
    if (!response.ok || payload?.ok === false) throw new Error(payload?.error || `HTTP ${response.status}`);
    return payload;
  }
  function message(value, error=false) { const node=byId('imageQualityMessage'); if(!node)return; node.textContent=value||''; node.classList.toggle('is-error',error); node.classList.toggle('is-success',Boolean(value&&!error)); }
  function imageKey(value){return text(value).toLowerCase().replace(/[?#].*$/,'').replace(/^https?:\/\/[^/]+/,'').replace(/\/+$/,'')}
  function category(score){return score>=85?'Excellent':score>=70?'Good':score>=55?'Usable / improve':score>=40?'Reshoot recommended':'Poor / reshoot'}
  function clamp(value,min,max){return Math.max(min,Math.min(max,value))}

  function loadImage(url) {
    return new Promise((resolve,reject)=>{
      const image=new Image(); image.crossOrigin='anonymous'; image.decoding='async';
      image.onload=()=>resolve(image); image.onerror=()=>reject(new Error('Image could not be loaded for Canvas scoring. Check the image URL/R2 CORS policy.')); image.src=url;
    });
  }

  function canvasMetrics(image) {
    const maxSide=320; const scale=Math.min(1,maxSide/Math.max(image.naturalWidth,image.naturalHeight));
    const w=Math.max(1,Math.round(image.naturalWidth*scale)); const h=Math.max(1,Math.round(image.naturalHeight*scale));
    const canvas=document.createElement('canvas'); canvas.width=w; canvas.height=h;
    const ctx=canvas.getContext('2d',{willReadFrequently:true}); ctx.drawImage(image,0,0,w,h);
    const data=ctx.getImageData(0,0,w,h).data; const lum=new Float32Array(w*h);
    let sum=0,sumSq=0,low=0,high=0,rSum=0,gSum=0,bSum=0;
    for(let i=0,p=0;i<data.length;i+=4,p++){const r=data[i],g=data[i+1],b=data[i+2];const y=(.2126*r+.7152*g+.0722*b)/255;lum[p]=y;sum+=y;sumSq+=y*y;rSum+=r;gSum+=g;bSum+=b;if(y<.035)low++;if(y>.965)high++;}
    const n=w*h; const mean=sum/n; const variance=Math.max(0,sumSq/n-mean*mean); const contrast=Math.sqrt(variance);
    let edge=0,edgeN=0;
    for(let y=1;y<h-1;y++)for(let x=1;x<w-1;x++){const p=y*w+x;const lap=Math.abs(4*lum[p]-lum[p-1]-lum[p+1]-lum[p-w]-lum[p+w]);edge+=lap;edgeN++;}
    const sharpness=edge/Math.max(1,edgeN);
    const border=[]; const step=Math.max(1,Math.floor(Math.min(w,h)/80));
    for(let x=0;x<w;x+=step){border.push(lum[x],lum[(h-1)*w+x]);} for(let y=1;y<h-1;y+=step){border.push(lum[y*w],lum[y*w+w-1]);}
    const borderMean=border.reduce((a,b)=>a+b,0)/Math.max(1,border.length); const borderVar=border.reduce((a,b)=>a+(b-borderMean)**2,0)/Math.max(1,border.length);
    const threshold=Math.max(.09,Math.sqrt(borderVar)*2.4); let minX=w,minY=h,maxX=-1,maxY=-1,foreground=0;
    for(let y=0;y<h;y++)for(let x=0;x<w;x++){if(Math.abs(lum[y*w+x]-borderMean)>threshold){foreground++;if(x<minX)minX=x;if(x>maxX)maxX=x;if(y<minY)minY=y;if(y>maxY)maxY=y;}}
    const occupancy=foreground/n; let centerOffset=1;
    if(maxX>=0){const cx=(minX+maxX)/(2*w),cy=(minY+maxY)/(2*h);centerOffset=Math.hypot(cx-.5,cy-.5)/.7071;}
    const means=[rSum/n,gSum/n,bSum/n]; const channelSpread=(Math.max(...means)-Math.min(...means))/255;
    let blocks=0,blockN=0;
    for(let y=8;y<h;y+=8)for(let x=1;x<w;x++){blocks+=Math.abs(lum[y*w+x]-lum[(y-1)*w+x]);blockN++;}
    for(let x=8;x<w;x+=8)for(let y=1;y<h;y++){blocks+=Math.abs(lum[y*w+x]-lum[y*w+x-1]);blockN++;}
    return {w,h,mean,contrast,low_clip:low/n,high_clip:high/n,sharpness,border_variance:borderVar,occupancy,center_offset:centerOffset,channel_spread:channelSpread,block_boundary_energy:blocks/Math.max(1,blockN)};
  }

  function scoreMetrics(image, m, catalogRatios=[]) {
    const exposurePenalty=Math.abs(m.mean-.56)*30+(m.low_clip+m.high_clip)*80; const lighting=clamp(20-exposurePenalty,0,20);
    const clarity=clamp((m.sharpness-.025)*170,0,20);
    const background=clamp(15-Math.sqrt(m.border_variance)*55,0,15);
    const occupancyTarget=.62; const framing=clamp(15-Math.abs(m.occupancy-occupancyTarget)*22-m.center_offset*7,0,15);
    const minDim=Math.min(image.naturalWidth,image.naturalHeight); const resolution=minDim>=1200?10:minDim>=900?8:minDim>=700?6:minDim>=500?4:2;
    const color=clamp(10-m.channel_spread*22,0,10);
    const artifacts=clamp(5-Math.max(0,m.block_boundary_energy-.11)*18,0,5);
    const ratio=image.naturalWidth/Math.max(1,image.naturalHeight); const target=catalogRatios.length?catalogRatios.slice().sort((a,b)=>a-b)[Math.floor(catalogRatios.length/2)]:1; const consistency=clamp(5-Math.abs(Math.log(Math.max(.01,ratio/target)))*5,0,5);
    const round=(v)=>Math.round(v*10)/10;
    const components={lighting_score:round(lighting),clarity_score:round(clarity),background_score:round(background),framing_score:round(framing),resolution_score:round(resolution),color_balance_score:round(color),artifact_score:round(artifacts),consistency_score:round(consistency)};
    return {...components,total_score:round(Object.values(components).reduce((a,b)=>a+b,0))};
  }

  async function scoreImage(row, ratios) {
    const image=await loadImage(row.image_url); const metrics=canvasMetrics(image); const scores=scoreMetrics(image,metrics,ratios);
    const evidence={algorithm:'Release 448 deterministic browser Canvas heuristic',objective_metrics:metrics,limitations:['Background score measures border uniformity, not artistic appropriateness.','Framing uses contrast-from-border occupancy, not semantic object detection.','Vision/AI review can supplement subjective presentation but does not replace these measurements.']};
    const body={product_id:state.productId,image_url:row.image_url,image_key:imageKey(row.image_url),scorer_kind:'browser_deterministic',scorer_version:'r448-browser-v1',...scores,width_px:image.naturalWidth,height_px:image.naturalHeight,evidence,status:'machine_scored'};
    await readJson(await apiFetch('/api/admin/product-image-quality',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)}));
    return body;
  }

  function scoreFor(url){const key=imageKey(url);return state.assessments.find((row)=>imageKey(row.image_key||row.image_url)===key&&row.scorer_kind==='browser_deterministic')||state.assessments.find((row)=>imageKey(row.image_key||row.image_url)===key)}
  function render() {
    const node=byId('imageQualityGrid'); if(!node)return;
    if(!state.images.length){node.innerHTML='<p class="small">No saved Product images are available to score.</p>';return;}
    node.innerHTML=state.images.map((row,index)=>{const a=scoreFor(row.image_url);const total=a?Number(a.total_score):null;return `<article class="card image-quality-card" data-image-index="${index}"><img src="${esc(row.image_url)}" alt="${esc(row.alt_text||`Product image ${index+1}`)}" loading="lazy" crossorigin="anonymous"><div><strong>${esc(row.variant_role||row.image_source||`Image ${index+1}`)}</strong><div class="small">${a?`Score <strong>${total.toFixed(1)}/100</strong> • ${category(total)} • ${esc(a.status)}`:'Not scored yet'}</div>${a?`<div class="image-quality-components small">Lighting ${Number(a.lighting_score).toFixed(1)}/20 • Clarity ${Number(a.clarity_score).toFixed(1)}/20 • Background ${Number(a.background_score).toFixed(1)}/15 • Framing ${Number(a.framing_score).toFixed(1)}/15 • Resolution ${Number(a.resolution_score).toFixed(1)}/10 • Colour ${Number(a.color_balance_score).toFixed(1)}/10 • Artifacts ${Number(a.artifact_score).toFixed(1)}/5 • Consistency ${Number(a.consistency_score).toFixed(1)}/5</div>`:''}<button class="btn" type="button" data-score-one="${index}">${a?'Rescore':'Score image'}</button></div></article>`}).join('');
    node.querySelectorAll('[data-score-one]').forEach((button)=>button.addEventListener('click',()=>scoreOne(Number(button.dataset.scoreOne))));
  }

  async function loadProducts(){const payload=await readJson(await apiFetch('/api/admin/product-lineage?limit=1000',{cache:'no-store'}));state.products=Array.isArray(payload.products)?payload.products:[];const select=byId('imageQualityProduct');select.innerHTML='<option value="">Choose a product…</option>'+state.products.map((p)=>`<option value="${Number(p.product_id)}" ${Number(p.product_id)===state.productId?'selected':''}>${esc(p.name||`Product ${p.product_id}`)}</option>`).join('');if(state.productId)await loadProduct();}
  async function loadProduct(){if(!state.productId)return;message('Loading Product images and quality evidence…');const [detail,quality]=await Promise.all([readJson(await apiFetch(`/api/admin/product-detail?product_id=${state.productId}`,{cache:'no-store'})),readJson(await apiFetch(`/api/admin/product-image-quality?product_id=${state.productId}`,{cache:'no-store'}))]);state.images=Array.isArray(detail.images)?detail.images:[];state.assessments=Array.isArray(quality.assessments)?quality.assessments:[];render();history.replaceState(null,'',`/admin/product-image-quality/?product_id=${state.productId}`);message(quality.schema_ready===false?'Release 448 image-quality D1 schema is not applied yet.':`${state.images.length} unique Product image(s); ${state.assessments.length} saved assessment(s).`);}
  async function scoreOne(index){const row=state.images[index];if(!row)return;message(`Scoring image ${index+1}…`);try{const ratios=state.images.map((r)=>{const img=document.querySelector(`[data-image-index="${index}"] img`);return img?.naturalWidth&&img?.naturalHeight?img.naturalWidth/img.naturalHeight:null}).filter(Boolean);await scoreImage(row,ratios);await loadProduct();message(`Image ${index+1} scored and saved.`);}catch(error){message(error.message||String(error),true)}}
  async function scoreAll(){if(!state.images.length)return;const button=byId('imageQualityScoreAll');button.disabled=true;let passed=0;let failed=0;const ratios=[];try{for(let i=0;i<state.images.length;i++){message(`Scoring ${i+1} of ${state.images.length}…`);try{const image=await loadImage(state.images[i].image_url);ratios.push(image.naturalWidth/image.naturalHeight);await scoreImage(state.images[i],ratios);passed++;}catch{failed++;}}await loadProduct();message(`Scoring complete: ${passed} saved${failed?`, ${failed} could not be Canvas-scored (usually CORS/image load)` : ''}.`,Boolean(failed&& !passed));}finally{button.disabled=false}}
  function init(){byId('imageQualityProduct')?.addEventListener('change',async(e)=>{state.productId=Number(e.target.value||0);if(state.productId)await loadProduct().catch((error)=>message(error.message||String(error),true));});byId('imageQualityScoreAll')?.addEventListener('click',scoreAll);byId('imageQualityRefresh')?.addEventListener('click',()=>loadProduct().catch((error)=>message(error.message||String(error),true)));loadProducts().catch((error)=>message(error.message||String(error),true));}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
