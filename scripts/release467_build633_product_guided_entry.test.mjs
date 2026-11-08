import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';

const root=new URL('../',import.meta.url);
const html=readFileSync(new URL('admin/product-editor/index.html',root),'utf8');
const source=readFileSync(new URL('public/js/admin-product-editor-v163.js',root),'utf8');

function harness(){
 let active=null,posted=0,redirect='';
 const el=(name='',value='')=>({name,value,type:'text',tagName:'INPUT',disabled:false,hidden:false,
  dataset:{},attributes:{},textContent:'',events:{},addEventListener(type,fn){this.events[type]=fn;},
  setAttribute(key,value){this.attributes[key]=String(value);},removeAttribute(key){delete this.attributes[key];},
  focus(){active=this;},scrollIntoView(){},closest(){return null;},replaceChildren(){}});
 const fields=[el('name'),el('product_category'),el('price'),el('compare_at_price'),
   el('inventory_quantity'),el('product_type','physical'),el('currency','CAD')];
 fields.namedItem=name=>fields.find(field=>field.name===name)||null;
 const form=el();form.tagName='FORM';form.elements=fields;
 const ids={productEditorForm:form,productEditorStatus:el(),productEditorTitle:el(),
  productEditorIdentity:el(),productEditorSave:el(),dd632SaveConfidence:el(),dd632ReviewSave:el(),
  dd633NameHint:el(),dd633CategoryHint:el(),dd633PriceHint:el(),dd633CompareHint:el()};
 const document={getElementById:id=>ids[id]||null,querySelectorAll:()=>[],querySelector:()=>null,
  dispatchEvent(){},addEventListener(){}};
 const window={DDAuth:{apiFetch:async()=>{posted++;return {payload:{ok:true,product_id:99}};},
  readApiJson:async response=>response.payload},addEventListener(){},confirm:()=>false};
 const location={search:'',replace:to=>{redirect=to;}};
 const sessionStorage={getItem:()=>null,setItem(){},removeItem(){}};
 runInNewContext(source,{document,window,location,sessionStorage,URLSearchParams,Option:class {},
  CustomEvent:class{constructor(type,options){this.type=type;this.detail=options?.detail;}},
  setTimeout,clearTimeout});
 return {form,fields,ids,window,get posted(){return posted;},get active(){return active;},
  get redirect(){return redirect;},field:name=>fields.namedItem(name),
  edit(name,value){const field=fields.namedItem(name);field.value=value;form.events.input({target:field});},
  submit(){return form.events.submit({preventDefault(){}});}};
}

test('Build 633 has accessible hints for the actual form fields and touch-safe mobile controls',()=>{
 for(const [name,hint] of [['name','dd633NameHint'],['product_category','dd633CategoryHint'],
   ['price','dd633PriceHint'],['compare_at_price','dd633CompareHint']]){
  assert.match(html,new RegExp(`name="${name}"[^>]*aria-describedby="${hint}"`));
  assert.match(html,new RegExp(`id="${hint}"`));
 }
 assert.match(html,/@media\(max-width:600px\)/);
 assert.match(html,/grid-template-columns:repeat\(2,minmax\(0,1fr\)\)/);
 assert.match(html,/min-height:48px/);
 assert.match(html,/font-size:16px/);
 assert.match(html,/admin-product-editor-v163\.js\?v=632&b390=1&b633=1/);
 assert.equal((html.match(/<h1\b/g)||[]).length,1);
});

test('Build 633 explains the first required field, focuses it and never sends an invalid form',async()=>{
 const h=harness();
 await h.submit();
 assert.equal(h.posted,0);assert.equal(h.active,h.field('name'));
 assert.equal(h.field('name').attributes['aria-invalid'],'true');
 assert.match(h.ids.dd633NameHint.textContent,/required/i);
 assert.equal(h.ids.dd632SaveConfidence.dataset.state,'invalid');
 h.edit('name','Silver Pendant');
 assert.equal(h.field('name').attributes['aria-invalid'],undefined);
 assert.equal(h.ids.dd633NameHint.dataset.error,'false');
 await h.submit();assert.equal(h.posted,0);
 assert.equal(h.active,h.field('product_category'));
 assert.equal(h.field('product_category').attributes['aria-invalid'],'true');
});

test('Build 633 validates CAD price and compare-at price without a Product write',async()=>{
 const h=harness();h.edit('name','Silver Pendant');h.edit('product_category','Jewelry');
 h.edit('price','8.999');await h.submit();
 assert.equal(h.active,h.field('price'));assert.equal(h.posted,0);
 assert.match(h.ids.dd633PriceHint.textContent,/two decimals/);
 h.edit('price','8.50');assert.equal(h.field('price').attributes['aria-invalid'],undefined);
 h.edit('compare_at_price','-1');await h.submit();
 assert.equal(h.active,h.field('compare_at_price'));assert.equal(h.posted,0);
 h.edit('compare_at_price','');assert.equal(h.field('compare_at_price').attributes['aria-invalid'],undefined);
 await h.submit();assert.equal(h.posted,1);assert.match(h.redirect,/product_id=99/);
});

test('Build 633 native-invalid capture provides one clear correction path without submit',()=>{
 const h=harness();h.edit('name','Silver Pendant');
 let prevented=false;
 h.form.events.invalid({target:h.field('product_category'),preventDefault(){prevented=true;}});
 assert.equal(prevented,true);assert.equal(h.posted,0);
 assert.equal(h.active,h.field('product_category'));
 assert.match(h.ids.dd633CategoryHint.textContent,/category/i);
});

test('Build 633 preserves the explicit free-Product confirmation without a silent POST',async()=>{
 const h=harness();h.edit('name','Gift Sample');h.edit('product_category','Other');
 h.edit('price','0.00');await h.submit();
 assert.equal(h.posted,0);
 assert.match(h.ids.dd632SaveConfidence.textContent,/Save cancelled/);
 assert.equal(h.active,h.field('price'));
});
