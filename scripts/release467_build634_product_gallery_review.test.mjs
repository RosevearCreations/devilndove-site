import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';

const root=new URL('../',import.meta.url);
const html=readFileSync(new URL('admin/product-editor/index.html',root),'utf8');
const source=readFileSync(new URL('public/js/admin-product-editor-v163.js',root),'utf8');

function galleryHarness(images,featured='https://assets.devilndove.com/original-one.jpg'){
  const requests=[];
  const element=(name='')=>({name,value:'',type:'text',tagName:'INPUT',hidden:false,disabled:false,
    dataset:{},events:{},textContent:'',attributes:{},addEventListener(type,fn){this.events[type]=fn;},
    setAttribute(key,value){this.attributes[key]=String(value);},removeAttribute(key){delete this.attributes[key];},
    focus(){},scrollIntoView(){},closest(){return null;},replaceChildren(){}});
  const fields=[...new Set(['name','featured_image_url','price','compare_at_price','product_category',
    'inventory_quantity','product_type','currency','status','keywords'])].map(element);
  fields.namedItem=name=>fields.find(field=>field.name===name)||null;
  const form=element();form.elements=fields;form.tagName='FORM';
  const controls={};
  const mediaStrip=element();
  let mediaMarkup='';const mediaControls=new Map();
  Object.defineProperty(mediaStrip,'innerHTML',{get:()=>mediaMarkup,set(value){mediaMarkup=value;mediaControls.clear();}});
  mediaStrip.innerHTML='';
  mediaStrip.querySelectorAll=selector=>{
    if(mediaControls.has(selector))return mediaControls.get(selector);
    const attribute={"img[data-media-raw]":'data-media-raw',
      '[data-dd634-review-index]':'data-dd634-review-index',
      '[data-use-featured-url]':'data-use-featured-url',
      '[data-dd495-jump-media]':'data-dd495-jump-media'}[selector];
    if(!attribute)return [];
    const values=[...mediaStrip.innerHTML.matchAll(new RegExp(`${attribute}="([^"]*)"`,'g'))].map(match=>match[1]);
    const result=values.map(value=>{const button=element();button.dataset[attribute.replace(/-([a-z])/g,(_,char)=>char.toUpperCase()).replace(/^data/,'').replace(/^./,char=>char.toLowerCase())]=value;
      return button;});
    mediaControls.set(selector,result);return result;
  };
  const dialog=element();dialog.open=false;dialog.showModal=()=>{dialog.open=true;};dialog.close=()=>{dialog.open=false;};
  Object.assign(controls,{productEditorForm:form,productEditorStatus:element(),productEditorTitle:element(),
    productEditorIdentity:element(),productEditorSave:element(),productEditorMediaStatus:element(),
    productEditorMediaStrip:mediaStrip,productEditorFeaturedPreview:element(),dd634GalleryCount:element(),
    dd634GalleryReview:dialog,dd634ReviewImage:element(),dd634ReviewDescription:element(),
    dd634ReviewPrevious:element(),dd634ReviewNext:element(),dd634ReviewClose:element(),
    dd632SaveConfidence:element(),dd632ReviewSave:element()});
  const panels=[{dataset:{editorPanel:'details'},hidden:true},{dataset:{editorPanel:'media'},hidden:false}];
  const document={getElementById:id=>controls[id]||null,
    querySelectorAll:selector=>selector==='[data-editor-panel]'?panels:[],
    querySelector:selector=>selector==='[data-editor-panel]:not([hidden])'?panels.find(panel=>!panel.hidden):null,
    dispatchEvent(){},addEventListener(){}};
  const window={DDAuth:{apiFetch:async url=>{requests.push(url);
    return {payload:url.includes('product-editor-media?')?{images,d1_rows_read:images.length}:
      {product:{product_id:53,name:'Copper Pendant',price_cents:2200,featured_image_url:featured}}};},
    readApiJson:async response=>response.payload},addEventListener(){},confirm:()=>false};
  runInNewContext(source,{document,window,location:{search:'?product_id=53&tab=media',origin:'https://devilndove.com'},
    sessionStorage:{getItem:()=>null,setItem(){},removeItem(){}},URL,URLSearchParams,
    Option:class{},CustomEvent:class{constructor(type,options){this.type=type;this.detail=options?.detail;}},
    setTimeout,clearTimeout});
  return {controls,requests,fields,dialog,mediaStrip,async ready(){
    for(let i=0;i<12&&requests.length<2;i++)await new Promise(resolve=>setImmediate(resolve));
    assert.equal(requests.length,2,'only Product authority plus explicit canonical gallery GET');
  }};
}

test('Build 634 renders an uncropped responsive photo gallery with explicit rights guidance',()=>{
  assert.match(html,/id="dd634GalleryReview"[^>]*aria-labelledby="dd634ReviewTitle"/);
  assert.match(html,/id="dd634GalleryCount"[^>]*aria-live="polite"/);
  assert.match(html,/#productEditorMediaStrip \.dd634-review-photo img\{[^}]*object-fit:contain/);
  assert.match(html,/Image rights and channel approvals must still be checked/);
  assert.match(html,/admin-product-editor-v163\.js\?v=632&b390=1&b633=1&b634=1/);
});

test('Build 634 loads only authoritative Product and canonical gallery on Photos opening',async()=>{
  const h=galleryHarness([{product_image_id:101,image_url:'https://assets.devilndove.com/original-one.jpg',alt_text:'Copper pendant on linen'}]);
  await h.ready();
  assert.deepEqual(h.requests.map(url=>url.split('?')[0]),['/api/admin/product-editor-detail','/api/admin/product-editor-media']);
  assert.match(h.controls.dd634GalleryCount.textContent,/1 saved gallery photo/);
  assert.match(h.mediaStrip.innerHTML,/Featured draft/);
  assert.match(h.mediaStrip.innerHTML,/aria-pressed="true" disabled/);
  assert.match(h.mediaStrip.innerHTML,/Copper pendant on linen/);
});

test('Build 634 review is keyboard-native, does not crop, upload, approve or write',async()=>{
  const h=galleryHarness([
    {product_image_id:101,image_url:'https://assets.devilndove.com/original-one.jpg',alt_text:'Copper pendant'},
    {product_image_id:102,image_url:'https://assets.devilndove.com/original-two.jpg',alt_text:''}]);
  await h.ready();
  const reviewButtons=h.mediaStrip.querySelectorAll('[data-dd634-review-index]');
  assert.equal(reviewButtons.length,2);reviewButtons[0].events.click();
  assert.equal(h.dialog.open,true);assert.equal(h.controls.dd634ReviewPrevious.disabled,true);
  assert.match(h.controls.dd634ReviewImage.src,/original-one\.jpg/);
  h.controls.dd634ReviewNext.events.click();
  assert.match(h.controls.dd634ReviewImage.src,/original-two\.jpg/);
  assert.match(h.controls.dd634ReviewDescription.textContent,/Alt text missing/);
  assert.match(h.controls.dd634ReviewDescription.textContent,/rights are not verified/);
  assert.equal(h.controls.dd634ReviewNext.disabled,true);
  h.controls.dd634ReviewClose.events.click();assert.equal(h.dialog.open,false);
  assert.equal(h.requests.length,2,'review never makes an API request');
});

test('Build 634 labels missing rights and preserves existing featured-only authority as distinct',async()=>{
  const h=galleryHarness([{product_image_id:102,image_url:'https://assets.devilndove.com/other.jpg',alt_text:''}]);
  await h.ready();
  assert.match(h.controls.dd634GalleryCount.textContent,/plus an existing featured-only reference/);
  assert.match(h.mediaStrip.innerHTML,/existing featured-only reference/);
  assert.match(h.mediaStrip.innerHTML,/Alt text missing — review in Image Editor/);
  assert.doesNotMatch(h.mediaStrip.innerHTML,/Rights approved|Public-use approved/);
});

test('Build 634 featured selection changes only the browser Product draft until Save',async()=>{
  const h=galleryHarness([{product_image_id:102,image_url:'https://assets.devilndove.com/other.jpg',alt_text:'Copper pendant'}]);
  await h.ready();
  const featuredButtons=h.mediaStrip.querySelectorAll('[data-use-featured-url]');
  assert.equal(featuredButtons.length,2);
  featuredButtons[1].events.click();
  assert.equal(h.fields.namedItem('featured_image_url').value,'https://assets.devilndove.com/other.jpg');
  assert.match(h.controls.productEditorStatus.textContent,/Press Save Product to commit it/);
  assert.match(h.mediaStrip.innerHTML,/Currently featured/);
  assert.equal(h.requests.length,2,'no Product POST or provider request on gallery selection');
});
