import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import {verifyProductChannelConsent471,channelPreparationState471} from '../functions/api/_lib/productChannelConsent471.mjs';

const source=readFileSync(new URL('../public/js/admin-product-channel-intent-v405.js',import.meta.url),'utf8');
const page=readFileSync(new URL('../admin/product-editor/index.html',import.meta.url),'utf8');
const save=readFileSync(new URL('../public/js/admin-product-editor-v163.js',import.meta.url),'utf8');
function mockBrowser({query='',stored=new Map(),response=null,postFails=false}={}){
 const elements=new Map(),calls=[];
 function node(id){const handlers={};return {id,checked:false,disabled:false,hidden:true,textContent:'',dataset:{},handlers,
   addEventListener(type,fn){handlers[type]=fn;},append(child){this.child=child;},
   fire(type='change'){handlers[type]?.();}};}
 for(const id of ['productChannel405','productChannel405Etsy','productChannel405Facebook','productChannel405Status',
   'productChannel405Reload','productChannel405Save','productChannel471Mount','productChannel471Consent',
   'productChannel471Recovery','productChannel471Restore'])elements.set(id,node(id));
 const DDAuth={apiFetch:async(path,opts)=>{
   calls.push({path,method:opts.method,body:opts.body?JSON.parse(opts.body):null});
   if(opts.method==='GET')return {ok:true,json:async()=>({ok:true,preferences:response||{etsy:false,facebook:false,configured:false,receipt:null}})};
   if(postFails)throw Error('Cloudflare 503 outcome unknown');
   return {ok:true,json:async()=>({ok:true,preferences:{receipt:123}})};
 }};
 const sessionStorage={getItem:k=>stored.get(k)||null,setItem:(k,v)=>stored.set(k,v),removeItem:k=>stored.delete(k)};
 const window={DDAuth,confirm:()=>true};
 const document={getElementById:id=>elements.get(id)||null,dispatchEvent:()=>true};
 class CustomEvent{constructor(type,options={}){this.type=type;this.detail=options.detail;}}
 vm.runInNewContext(source,{document,window,CustomEvent,location:{search:query},URLSearchParams,sessionStorage,crypto:{randomUUID:()=>
   '98765432-1234-4321-9876-123456789abc'},console});
 return {elements,calls,window,stored};
}

test('Build 471 rejects external intent without explicit owner consent and Canada-only gate',()=>{
 const safe={intent_source_build:471,etsy:true,facebook:false,confirmed_no_provider_publication:true,
   owner_confirmed_preparation:true,canada_only:true,us_shipping_disabled:true};
 assert.equal(verifyProductChannelConsent471(safe).ok,true);
 for(const key of ['owner_confirmed_preparation','canada_only','us_shipping_disabled','confirmed_no_provider_publication']){
   assert.equal(verifyProductChannelConsent471({...safe,[key]:false}).ok,false,key);
 }
 assert.equal(verifyProductChannelConsent471({...safe,facebook:'false'}).ok,false);
 assert.equal(verifyProductChannelConsent471({intent_source_build:405}).legacy,true);
});

test('Create once: a destination checkbox captures local intent without a second hidden consent gate',async()=>{
 const b=mockBrowser(),etsy=b.elements.get('productChannel405Etsy');
 assert.equal(b.window.DDProductChannels405.captureForProductSave().changed,false);
 etsy.checked=true;etsy.fire();
 const frozen=b.window.DDProductChannels405.captureForProductSave();
 assert.equal(frozen.etsy,true);assert.equal(frozen.confirmed,true);
 // Mutating a browser checkbox after the snapshot must not change the submitted owner decision.
 etsy.checked=false;
 assert.equal(await b.window.DDProductChannels405.afterProductSave(77,frozen),true);
 assert.equal(b.calls.length,1);
 assert.equal(b.calls[0].path,'/api/admin/product-channel-intent');
 assert.deepEqual({etsy:b.calls[0].body.etsy,facebook:b.calls[0].body.facebook,source:b.calls[0].body.intent_source_build},
   {etsy:true,facebook:false,source:471});
 assert.equal(b.calls[0].body.owner_confirmed_preparation,true);
 assert.equal(b.calls[0].body.us_shipping_disabled,true);
 assert.equal(b.calls[0].body.canada_only,true);
 assert.equal(b.calls.some(x=>/etsy|facebook|marketplace.*publish/i.test(x.path)),false);
});

test('Uncertain channel write preserves reviewable choices without duplicate Product creation',async()=>{
 const stored=new Map(),b=mockBrowser({stored,postFails:true});
 b.elements.get('productChannel405Facebook').checked=true;b.elements.get('productChannel405Facebook').fire();
 const frozen=b.window.DDProductChannels405.captureForProductSave();
 assert.equal(await b.window.DDProductChannels405.afterProductSave(88,frozen),false);
 assert.equal(stored.has('dnd:channel-intent:471:88'),true);
 const next=mockBrowser({query:'?product_id=88&destination_save=unconfirmed',stored});
 await new Promise(resolve=>setImmediate(resolve));
 assert.equal(next.elements.get('productChannel471Recovery').hidden,false);
 assert.equal(next.elements.get('productChannel405Facebook').checked,false);
 next.elements.get('productChannel471Restore').fire('click');
 assert.equal(next.elements.get('productChannel405Facebook').checked,true);
 const recovered=next.window.DDProductChannels405.captureForProductSave();
 assert.equal(recovered.facebook,true);
 assert.equal(recovered.confirmed,true);
 assert.equal(next.elements.get('productChannel405Save').disabled,false);
 assert.equal(next.calls.filter(x=>x.method==='POST').length,0);
});

test('Human-gated source readiness never implies a live listing or unreviewed media transfer',()=>{
 const state=channelPreparationState471({productSaved:true,etsy:true,facebook:true,consent:true,canonicalMediaReviewed:false});
 assert.deepEqual(state.channels,['etsy','facebook']);
 assert.ok(state.blockers.includes('canonical_media_review_separate'));
 assert.equal(state.provider_publication_authorized,false);
 assert.equal(state.provider_draft_created,false);
 assert.equal(state.provider_media_transferred,false);
 assert.equal(state.us_shipping_enabled,false);
});

test('The live Product Add page uses the single-flow mount, media handoff and explicit owner gate',()=>{
 for(const token of ['productChannel471Mount','productChannel471Consent','productChannel471Recovery'])assert.ok(page.includes(token),token);
 assert.match(page,/admin-product-creation-flow-471\.js\?v=(?:471|521|523|527)/);
 assert.match(page,/admin-product-channel-intent-v405\.js\?v=(?:471|521|523|526|527)/);
 assert.match(page,/admin-product-editor-v163\.js\?v=\d+/);
 assert.ok(save.includes('captureForProductSave'));
 assert.ok(save.includes('afterProductSave(savedId,channelSnapshot)'));
 assert.ok(save.includes('productChannel471Consent'));
});
