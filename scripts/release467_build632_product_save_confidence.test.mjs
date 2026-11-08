import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';

const root=new URL('../',import.meta.url);
const html=readFileSync(new URL('admin/product-editor/index.html',root),'utf8');
const source=readFileSync(new URL('public/js/admin-product-editor-v163.js',root),'utf8');

function harness({productId=0,respond=async(url)=>({ok:true,product_id:88,product_fields_confirmed:true,
 price_cents_confirmed:true,price_cents:850,compare_at_price_cents:null})}={}){
 const events={};let calls=[],activeElement=null,redirect='';
 const el=(name='',value='')=>({tagName:'INPUT',type:'text',name,value,disabled:false,hidden:false,dataset:{},textContent:'',
  events:{},addEventListener(type,fn){this.events[type]=fn;},focus(){activeElement=this;},
  scrollIntoView(){},replaceChildren(){}});
 const fields=[el('name',''),el('price','8.50'),el('compare_at_price',''),el('inventory_quantity',''),
   el('product_type','physical'),el('status','draft'),el('currency','CAD')];
 fields.namedItem=name=>fields.find(x=>x.name===name)||null;
 const form=el();form.tagName='FORM';form.elements=fields;form.dataset={};
 const status=el(),confidence=el(),reviewShortcut=el(),review=el(),reviewButton=el(),
  title=el(),identity=el(),save=el();review.hidden=true;reviewShortcut.hidden=true;
 const ids={productEditorForm:form,productEditorStatus:status,productEditorTitle:title,
  productEditorIdentity:identity,productEditorSave:save,dd632SaveConfidence:confidence,
  dd632ReviewSave:reviewShortcut,dd521SaveReview:review,dd521ReviewServer:reviewButton};
 const document={getElementById:id=>ids[id]||null,querySelectorAll:()=>[],querySelector:()=>null,
  dispatchEvent(){},addEventListener(type,fn){events[type]=fn;}};
 const session=new Map();
 const sessionStorage={getItem:key=>session.get(key)||null,setItem:(key,value)=>session.set(key,value),
  removeItem:key=>session.delete(key)};
 const location={search:productId?`?product_id=${productId}`:'',replace:to=>{redirect=to;}};
 const window={DDAuth:{apiFetch:async(url,options)=>{
    calls.push({url,options});const result=await respond(url,options);
    return {payload:result};},readApiJson:async response=>response.payload},
  DDRecovery468:{classify(error){return {category:error.category||'review',
    guidance:String(error.message||'Request failed'),uncertainWrite:!!error.uncertainWrite};}},
  addEventListener(){},confirm:()=>true};
 runInNewContext(source,{document,window,location,sessionStorage,URLSearchParams,Option:class {},
  CustomEvent:class{constructor(type,options){this.type=type;this.detail=options?.detail;}},
  setTimeout,clearTimeout});
 return {form,fields,status,confidence,reviewShortcut,review,reviewButton,save,window,
  get active(){return activeElement;},get calls(){return calls;},get redirect(){return redirect;},
  edit(name,value){const field=fields.namedItem(name);field.value=value;form.events.input({target:field});},
  submit(){return form.events.submit({preventDefault(){}});}};
}
const flush=()=>new Promise(resolve=>setImmediate(resolve));

test('Build 632 has a persistent, labeled save state and a non-writing review shortcut',()=>{
 assert.match(html,/id="dd632SaveConfidence"[^>]*role="status" aria-live="polite"/);
 assert.match(html,/id="dd632ReviewSave"[^>]*hidden aria-controls="dd521SaveReview"/);
 assert.match(html,/id="dd540SaveProduct"[^>]*aria-describedby="dd632SaveConfidence"/);
 assert.match(html,/admin-product-editor-v163\.js\?v=632&b390=1/);
 assert.match(html,/#dd632ReviewSave\[hidden\]\{display:none!important\}/);
 assert.match(source,/saveConfidence632\.textContent!==message/); // Avoid repeated live-region announcements on every keystroke.
 assert.doesNotMatch(source,/new WebSocket|sendBeacon/);
});

test('Build 632 identifies new, unsaved, invalid and explicit in-flight Save without an automatic request',async()=>{
 let resolveSave;
 const h=harness({respond:async()=>await new Promise(resolve=>{resolveSave=resolve;})});
 assert.equal(h.confidence.dataset.state,'new');assert.equal(h.calls.length,0);
 await h.submit();assert.equal(h.confidence.dataset.state,'invalid');assert.equal(h.calls.length,0);
 h.edit('name','Copper Pendant');assert.equal(h.confidence.dataset.state,'unsaved');
 const save=h.submit();assert.equal(h.confidence.dataset.state,'saving');assert.equal(h.calls.length,1);
 assert.equal(h.calls[0].url,'/api/admin/create-product');
 resolveSave({ok:true,product_id:88});await save;
 assert.match(h.redirect,/product_id=88/);assert.equal(h.calls.length,1);
});

test('Build 632 verifies saved edits and keeps Etsy/Meta outside the Product Save',async()=>{
 const h=harness({productId:12,respond:async(url)=>url.includes('detail')?
  {product:{product_id:12,name:'Copper Pendant',price_cents:850}}:
  {ok:true,product_id:12,product_fields_confirmed:true,price_cents_confirmed:true,
   price_cents:850,compare_at_price_cents:null}});
 await flush();
 assert.equal(h.confidence.dataset.state,'loaded');
 h.edit('name','Copper Pendant Updated');assert.equal(h.confidence.dataset.state,'unsaved');
 await h.submit();
 assert.equal(h.confidence.dataset.state,'saved');
 assert.match(h.confidence.textContent,/CAD price confirmed/);
 assert.equal(h.reviewShortcut.hidden,true);
 assert.deepEqual(h.calls.map(x=>x.url),
  ['/api/admin/product-editor-detail?product_id=12','/api/admin/product-editor-save']);
});

test('Build 632 uncertain outcome blocks repeat POST and review shortcut performs no request',async()=>{
 const h=harness({productId:12,respond:async(url)=>{
  if(url.includes('detail'))return {product:{product_id:12,name:'Pendant',price_cents:850}};
  const error=new Error('503 while saving');error.category='d1_503';error.uncertainWrite=true;
  throw error;
 }});
 await flush();h.edit('name','Pendant edited');await h.submit();
 assert.equal(h.confidence.dataset.state,'hold');
 assert.equal(h.reviewShortcut.hidden,false);assert.equal(h.review.hidden,false);
 const before=h.calls.length;h.reviewShortcut.events.click();
 assert.equal(h.active,h.reviewButton);assert.equal(h.calls.length,before);
 await h.submit();assert.equal(h.calls.length,before);
});

test('Build 632 reports saved Product but unconfirmed destinations without repeating the Product POST',async()=>{
 const h=harness({productId:12,respond:async(url)=>url.includes('detail')?
  {product:{product_id:12,name:'Pendant',price_cents:850}}:
  {ok:true,product_id:12,product_fields_confirmed:true,price_cents_confirmed:true,
   price_cents:850,compare_at_price_cents:null}});
 h.window.DDProductChannels405={captureForProductSave:()=>({changed:true}),afterProductSave:async()=>false};
 await flush();h.edit('name','Pendant new');await h.submit();
 assert.equal(h.confidence.dataset.state,'partial');
 assert.match(h.confidence.textContent,/do not repeat Product Save/i);
 assert.equal(h.calls.filter(x=>x.options?.method==='POST').length,1);
});

test('Build 632 a verified no-write error explains correction and leaves the next Save manual',async()=>{
 let attempts=0;
 const h=harness({productId:12,respond:async(url)=>{
  if(url.includes('detail'))return {product:{product_id:12,name:'Pendant',price_cents:850}};
  attempts++;if(attempts===1){const error=new Error('Correct the saved category');
   error.payload={no_product_write_started:true};throw error;}
  return {ok:true,product_id:12,product_fields_confirmed:true,price_cents_confirmed:true,
   price_cents:850,compare_at_price_cents:null};
 }});
 await flush();h.edit('name','Pendant new');await h.submit();
 assert.equal(h.confidence.dataset.state,'invalid');
 assert.equal(attempts,1);
 await h.submit();assert.equal(attempts,2);
 assert.equal(h.confidence.dataset.state,'saved');
});
