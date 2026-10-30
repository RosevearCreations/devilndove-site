/* Build 533: visual crop within the ONE existing canonical Product gallery.
 * Opening/dragging the preview performs no writes. Only an explicit button
 * replaces the selected gallery image via the existing product-image-file API.
 * It does NOT modify an Etsy or Meta listing. */
import {photoSizeAdvice533,squareSelection533} from './product-photo-framing-policy-533.mjs';
const root=document.getElementById('productDistribution406Gallery');
const notice=document.getElementById('dd495InlineImageStatus');
const productId=Number(new URLSearchParams(location.search).get('product_id')||0);
if(root&&notice&&productId>0&&window.DDAuth?.apiFetch){
 const create=(tag,cls,text)=>{const el=document.createElement(tag);if(cls)el.className=cls;if(text)el.textContent=text;return el;};
 const api=async(path,init)=>{const response=await window.DDAuth.apiFetch(path,{cache:'no-store',...init});
  const data=window.DDAuth.readApiJson?await window.DDAuth.readApiJson(response,{fallbackMessage:'Photo operation was not confirmed.'}):await response.json();
  if(!response.ok||!data?.ok)throw Error(data?.error||`Photo operation HTTP ${response.status}`);return data;};
 async function openFrame(imageId,button){
  const mount=root.querySelector(`[data-dd533-frame-mount="${imageId}"]`);
  if(!mount)return;
  if(mount.childNodes.length){mount.replaceChildren();button.textContent='Choose square framing (optional)';return;}
  button.disabled=true;
  try{
   const record=await api(`/api/admin/product-image-editor?product_image_id=${imageId}`),original=record.image||{};
   if(Number(original.product_id)!==productId||!/^https:\/\//.test(original.image_url||''))throw Error('The original saved Product photo could not be verified.');
   const originalUrl=String(original.image_url),advice=photoSizeAdvice533(original.width_px,original.height_px);
   const shell=create('section','dd533-frame-editor');shell.setAttribute('aria-label',`Frame image #${imageId}`);
   shell.append(create('strong','',`Visual square framing — image #${imageId}`));
   shell.append(create('p','small',advice.message));
   shell.append(create('p','small','Drag or click the photograph to move the square. This only previews composition. The original is reused on every channel unless we explicitly save a replacement. A second image list is not needed.'));
   const stage=create('div','dd533-stage');const source=create('img','dd533-source');source.src=originalUrl;source.alt=original.alt_text||'Saved Product photograph';
   const rectangle=create('div','dd533-square');rectangle.setAttribute('aria-hidden','true');stage.append(source,rectangle);
   const preview=create('canvas','dd533-preview');preview.width=240;preview.height=240;preview.setAttribute('aria-label','Square crop preview');
   const previewStatus=create('p','small dd533-frame-status','Choose the preferred subject framing. No image has been changed.');previewStatus.setAttribute('role','status');
   const localLabel=create('label','small dd533-local-label','If the original cannot be exported from our image host, choose the same original file on this computer:');
   const localFile=create('input','input');localFile.type='file';localFile.accept='image/jpeg,image/png,image/webp';localLabel.append(localFile);
   const save=create('button','btn primary','Replace this gallery photo with square crop');save.type='button';save.disabled=!advice.meetsLocalMinimum;
   const download=create('button','btn','Download square JPG (manual use)');download.type='button';download.disabled=!advice.meetsLocalMinimum;
   const buttons=create('div','dd-product-actions');buttons.append(download,save);
   shell.append(stage,preview,previewStatus,localLabel,buttons);
   mount.append(shell);
   let centerX=.5,centerY=.5,busy=false,selectedLocal=null;
   const originalDimensions=()=>({width:source.naturalWidth||Number(original.width_px),height:source.naturalHeight||Number(original.height_px)});
   const geometry=()=>{const {width,height}=originalDimensions();return squareSelection533(width,height,centerX,centerY);};
   function paint(){if(!source.complete||!source.naturalWidth)return;
    const {left,top,width,height}=geometry();Object.assign(rectangle.style,{left:left+'%',top:top+'%',width:width+'%',height:height+'%'});
    const g=geometry(),ctx=preview.getContext('2d');ctx.clearRect(0,0,preview.width,preview.height);
    try{ctx.drawImage(source,g.sx,g.sy,g.side,g.side,0,0,preview.width,preview.height);}catch{}
    previewStatus.textContent=`Selected square: ${g.outputSize} × ${g.outputSize} source pixels. ${g.outputSize<2000?'For a sharper Etsy photo, shoot or supply an original at least 2000 px on its shortest side.':'Meets Etsy’s 2000 px recommended shortest side.'} No save yet.`;
   }
   source.addEventListener('load',paint);if(source.complete)paint();
   const move=(event)=>{if(!source.naturalWidth)return;const bounds=source.getBoundingClientRect();centerX=(event.clientX-bounds.left)/bounds.width;centerY=(event.clientY-bounds.top)/bounds.height;paint();};
   stage.addEventListener('pointerdown',event=>{stage.setPointerCapture?.(event.pointerId);move(event);});
   stage.addEventListener('pointermove',event=>{if(event.buttons===1)move(event);});
   localFile.addEventListener('change',()=>{selectedLocal=localFile.files?.[0]||null;if(selectedLocal)previewStatus.textContent=`Local original selected: ${selectedLocal.name}. Framing remains as shown; confirm it is this same photo before saving.`;});
   async function output(){
    const origin=selectedLocal?URL.createObjectURL(selectedLocal):originalUrl;
    const img=new Image();if(!selectedLocal)img.crossOrigin='anonymous';
    try{await new Promise((resolve,reject)=>{img.onload=resolve;img.onerror=()=>reject(Error('The image host did not allow browser export. Select the same original file using the file chooser below.'));img.src=origin;});
     const width=img.naturalWidth,height=img.naturalHeight;
     if(Math.min(width,height)<800)throw Error('This original is smaller than our 800-pixel minimum. Choose a higher-resolution original.');
     const g=squareSelection533(width,height,centerX,centerY),canvas=document.createElement('canvas');
     canvas.width=canvas.height=g.outputSize;canvas.getContext('2d').drawImage(img,g.sx,g.sy,g.side,g.side,0,0,g.outputSize,g.outputSize);
     const blob=await new Promise((resolve,reject)=>{try{canvas.toBlob(b=>b?resolve(b):reject(Error('The original host blocked export; choose the same original file on this computer.')),'image/jpeg',.9);}catch{reject(Error('The original host blocked export; choose the same original file on this computer.'));}});
     if(blob.size>10*1024*1024)throw Error('Crop exceeds the 10 MB gallery upload limit.');
     return {blob,size:g.outputSize};
    }finally{if(selectedLocal)URL.revokeObjectURL(origin);}
   }
   async function act(replace){if(busy)return;busy=true;download.disabled=true;save.disabled=true;previewStatus.textContent='Preparing selected square from the original image…';
    try{
     const generated=await output(),filename=`product-${productId}-photo-${imageId}-square-${generated.size}.jpg`;
     if(!replace){const url=URL.createObjectURL(generated.blob),anchor=document.createElement('a');anchor.href=url;anchor.download=filename;anchor.click();setTimeout(()=>URL.revokeObjectURL(url),1500);
      previewStatus.textContent='Square photo downloaded for optional manual use. The Product gallery and Etsy have not changed.';return;}
     if(!window.confirm(`Replace ONLY Product #${productId} gallery photo #${imageId} with this ${generated.size} × ${generated.size} square JPG? The old R2 object is preserved but the active Product photo changes. Etsy and Facebook will NOT be updated automatically.`)){
      previewStatus.textContent='Cancelled. Existing Product photo is unchanged.';return;}
     const data=new FormData();for(const [name,value] of Object.entries({action:'replace',product_id:productId,product_image_id:imageId,
      width_px:generated.size,height_px:generated.size,image_orientation:'square',sort_order:original.sort_order||0,
      alt_text:original.alt_text||'',image_title:original.image_title||'',caption:original.caption||'',public_use_status:original.public_use_status||'internal_review'}))data.append(name,String(value));
     data.append('file',new File([generated.blob],filename,{type:'image/jpeg'}));
     const saved=await api('/api/admin/product-image-file',{method:'POST',body:data,headers:{}});
     if(saved.save_confirmed!==true||Number(saved.product_id)!==productId||Number(saved.product_image_id)!==imageId||!saved.image_url)
      throw Error('The upload returned an unconfirmed Product image identity. Check the gallery before another attempt.');
     const check=await api(`/api/admin/product-image-editor?product_image_id=${imageId}`);
     if(Number(check.image?.product_id)!==productId||String(check.image?.image_url)!==String(saved.image_url))
      throw Error('Image replacement may have saved, but its exact readback was not confirmed. Check the gallery before another attempt.');
     let scoring='';
     try{const score=await api('/api/admin/product-image-editor',{method:'POST',headers:{'Content-Type':'application/json'},
      body:JSON.stringify({action:'score',product_image_id:imageId,width_px:generated.size,height_px:generated.size,load_status:'loaded'})});
      scoring=` Rescored ${score.quality_score}/100 (${score.acceptance_status||'review'}).`;
     }catch(error){scoring=` Image scoring was not confirmed: ${error.message}. Check photo approval before Etsy.`;}
     previewStatus.textContent=`Saved ✓ Image #${imageId} now uses the ${generated.size} × ${generated.size} square crop in the ONE Product gallery.${scoring} Etsy has not been updated. Review the gallery and explicitly update its existing Etsy draft.`;
     notice.textContent=`Image #${imageId} crop saved and read back. Refreshing shared photo list; no Etsy write occurred.`;
     document.dispatchEvent(new CustomEvent('dd:media-inline-updated',{detail:{product_id:productId,product_image_id:imageId}}));
    }catch(error){previewStatus.textContent=`Crop not confirmed: ${error.message} Do not retry a possibly saved upload before checking the current gallery.`;}
    finally{busy=false;download.disabled=!advice.meetsLocalMinimum;save.disabled=!advice.meetsLocalMinimum;}
   }
   download.addEventListener('click',()=>void act(false));save.addEventListener('click',()=>void act(true));
   button.textContent='Close square framing';
  }catch(error){notice.textContent=`Image framing unavailable: ${error.message}`;}
  finally{button.disabled=false;}
 }
 root.addEventListener('click',event=>{const button=event.target.closest('button[data-dd533-frame]');if(!button||!root.contains(button))return;
  const imageId=Number(button.dataset.dd533Frame);if(Number.isSafeInteger(imageId)&&imageId>0)void openFrame(imageId,button);});
}
