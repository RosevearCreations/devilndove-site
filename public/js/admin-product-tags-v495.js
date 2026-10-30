/* Build 495: preview a saved-Product keyword list against Etsy tag preparation
   limits without pretending the current draft API transports tags. */
(()=>{'use strict';
 const form=document.getElementById('productEditorForm'),input=form?.elements.namedItem('keywords');
 const preview=document.getElementById('dd495TagsPreview');if(!input||!preview)return;
 function render(){
  const tags=String(input.value||'').split(',').map(x=>x.trim()).filter(Boolean);
  const unique=new Set(tags.map(x=>x.toLocaleLowerCase()));
  const long=tags.filter(x=>Array.from(x).length>20);
  const invalid=tags.filter(x=>!/^[\p{L}\p{Nd}\p{Zs}\-']+$/u.test(x)||/^[-']/.test(x));
  const issues=[];
  if(tags.length>13)issues.push(`${tags.length} phrases exceed Etsy's 13-tag listing limit`);
  if(long.length)issues.push(`${long.length} phrase(s) exceed 20 characters`);
  if(unique.size!==tags.length)issues.push('duplicate phrases');
  if(invalid.length)issues.push(`${invalid.length} phrase(s) have characters or opening punctuation Etsy does not allow`);
  preview.textContent=`${tags.length} search phrase(s) saved locally when you Save Product • Etsy preparation: ${issues.length?issues.join('; '):tags.length?'within the 13 tags / 20 characters format':'no tags entered'}. Transfer is an optional, explicitly approved action in the Etsy tab, never part of saving the Product.`;
  preview.dataset.tone=issues.length?'warn':'ok';
 }
 input.addEventListener('input',render);document.addEventListener('dd:product-loaded',render);
 document.addEventListener('dd:save-succeeded',render);
 new MutationObserver(()=>{if(form.dataset.productAuthority==='ready')render();}).observe(form,{attributes:true,attributeFilter:['data-product-authority']});
 render();
})();
