/* Build 489: purely local entry completeness and cross-channel field badges. */
(()=>{'use strict';
 const form=document.getElementById('productEditorForm'),score=document.getElementById('dd489EntryScore'),meter=document.getElementById('dd489EntryMeter');
 if(!form||!score||!meter)return;
 const mappings={name:'both',price:'both',inventory_quantity:'both',description:'both',product_category:'marketplace',sku:'export',short_description:'export'};
 const labels={both:'Etsy + Marketplace required',marketplace:'Marketplace category preparation',export:'CSV/export field'};
 for(const [name,type] of Object.entries(mappings)){
  const el=form.elements.namedItem(name),label=el?.closest('label'),head=label?.querySelector('.small');if(!head)continue;
  const existing=head.querySelector('.dd-channel-required');if(existing)existing.remove();
  if(head.querySelector('.dd489-both,.dd489-marketplace,.dd489-export'))continue;
  const tag=document.createElement('span');tag.className='dd489-'+type;tag.textContent=labels[type];head.append(' ',tag);
 }
 function value(name){const el=form.elements.namedItem(name);return String(el?.value||'').trim();}
 let timer=null;
 function calculate(){
  const fields=['name','price','inventory_quantity','description','product_category','sku','short_description'];
  const passed=fields.filter(name=>name==='price'?Number(value(name))>0:name==='inventory_quantity'?Number(value(name))>0:value(name).length>0);
  const pct=Math.round(passed.length/fields.length*100);meter.value=pct;score.textContent=pct+'%';
  document.getElementById('dd489EntryStatus').textContent=`${passed.length} of ${fields.length} selected entry fields filled. ${fields.filter(x=>!passed.includes(x)).map(x=>x.replaceAll('_',' ')).join(', ')||'All selected fields present.'} This is a local completeness indicator—not Product QA, image quality, Etsy acceptance or publication approval.`;
 }
 const schedule=()=>{clearTimeout(timer);timer=setTimeout(calculate,180)};
 form.addEventListener('input',schedule);form.addEventListener('change',schedule);
 document.addEventListener('dd:save-succeeded',calculate);
  document.addEventListener('dd:product-loaded',calculate);
 for(const button of form.querySelectorAll('[data-dd489-open]'))button.addEventListener('click',()=>form.querySelector(`[data-editor-tab="${button.dataset.dd489Open}"]`)?.click());
 calculate();
})();
