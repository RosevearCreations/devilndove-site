#!/usr/bin/env node
// Release 467 Build 436: exercise actual Media Studio browser runtime in an offline VM.
// No live providers, D1/R2 writes, real network calls or owner-media overwrites.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const runtime=fs.readFileSync('public/js/media-content-runtime.js','utf8');
function harness(images,{outcomes={},original='/assets/original-owner-image.webp'}={}){
 const events=[];
 const pending=[];
 const attr={src:original};
 const element={
   tagName:'IMG',isConnected:true,alt:'Owner supplied original',dataset:{},style:{},
   classList:{add(){},remove(){}},
   getAttribute:key=>attr[key]||null,
   setAttribute:(key,value)=>{attr[key]=String(value);},
   removeAttribute:key=>{delete attr[key];},
   closest:()=>null
 };
 const listeners={};
 const doc={
   readyState:'loading',
   documentElement:{dataset:{}},
   addEventListener:(name,callback)=>{listeners[name]=callback;},
   querySelector:selector=>selector==='#target'?element:null,
   dispatchEvent:evt=>{events.push({name:evt.type,detail:evt.detail});},
 };
 class Probe{
   constructor(){this.naturalWidth=0;this.naturalHeight=0;}
   set src(value){this._src=value;pending.push(()=>{const ok=outcomes[value]!==false;
       if(ok){this.naturalWidth=1600;this.naturalHeight=1000;this.onload?.();}
       else this.onerror?.(new Error('404'));});}
   get src(){return this._src;}
 }
 const sandbox={
   document:doc,location:{pathname:'/about/',search:'',hash:''},
   URLSearchParams,Image:Probe,CustomEvent:class{constructor(type,config){this.type=type;this.detail=config?.detail;}},
   fetch:async()=>({ok:true,json:async()=>({ok:true,images,content:[]})}),
   setTimeout:()=>0,MutationObserver:class{observe(){}disconnect(){}},
   console,sessionStorage:{getItem:()=>null,setItem(){}}
 };
 vm.runInNewContext(runtime,sandbox,{filename:'public/js/media-content-runtime.js'});
 assert.equal(typeof listeners.DOMContentLoaded,'function');
 const start=async()=>{listeners.DOMContentLoaded();await new Promise(resolve=>setImmediate(resolve));};
 const settle=async()=>{await new Promise(resolve=>setImmediate(resolve));for(const next of pending.splice(0))next();};
 return {element,attr,events,doc,start,settle,pending};
}
function item(url){return {
  slot_key:'about.hero.image',slot_type:'image',target_selector:'#target',target_attribute:'src',
  public_url:url,alt_text:'Approved workshop image',decorative:false,focal_x:.5,focal_y:.5
};}
test('successful assigned media is adopted only after image probe is loaded',async()=>{
 const h=harness([item('/assets/approved.webp')]);await h.start();
 assert.equal(h.attr.src,'/assets/original-owner-image.webp');
 await h.settle();
 assert.equal(h.attr.src,'/assets/approved.webp');
 assert.equal(h.element.dataset.mediaContentOverride,'1');
 assert.equal(h.doc.documentElement.dataset.mediaContentStudio,'applied');
 assert.equal(h.element.alt,'Approved workshop image');
});
test('failed assigned URL preserves authored or previously approved owner media',async()=>{
 const h=harness([item('/assets/missing.webp')],{outcomes:{'/assets/missing.webp':false}});
 await h.start();await h.settle();
 assert.equal(h.attr.src,'/assets/original-owner-image.webp');
 assert.equal(h.element.alt,'Owner supplied original');
 assert.equal(h.element.dataset.mediaContentOverride,undefined);
 assert.equal(h.element.dataset.mediaContentOverrideError,'assigned-media-unavailable');
 assert.equal(h.doc.documentElement.dataset.mediaContentStudio,'degraded');
 assert.ok(h.events.some(e=>e.name==='dd:media-image-unavailable'&&e.detail.slot==='about.hero.image'));
});
test('stale slow image cannot overwrite the newest approved assignment',async()=>{
 const h=harness([item('/assets/old.webp'),item('/assets/new.webp')]);await h.start();
 assert.equal(h.pending.length,2);
 h.pending.splice(1,1)[0]();
 h.pending.splice(0,1)[0]();
 assert.equal(h.attr.src,'/assets/new.webp');
});
test('unsafe media URLs never replace existing authored owner assets',async()=>{
 const h=harness([item('javascript:alert(1)'),item('//another-site.invalid/a.webp'),item('data:image/svg+xml,evil')]);
 await h.start();await h.settle();
 assert.equal(h.attr.src,'/assets/original-owner-image.webp');
 assert.equal(h.pending.length,0);
});

test('image status stays pending until the preload has actually settled',async()=>{
 const h=harness([item('/assets/pending.webp')]);await h.start();
 assert.equal(h.doc.documentElement.dataset.mediaContentStudio,'pending');
 assert.notEqual(h.attr.src,'/assets/pending.webp');
 await h.settle();
 assert.equal(h.doc.documentElement.dataset.mediaContentStudio,'applied');
});
