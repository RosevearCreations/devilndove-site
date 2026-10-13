import test from 'node:test';import assert from 'node:assert/strict';import vm from 'node:vm';import {readFileSync} from 'node:fs';
const src=readFileSync(new URL('../public/js/admin-action-ack-v384.js',import.meta.url),'utf8');
test('one write for identical simultaneous submit; disabled wait label and clear success',async()=>{
 const handlers={};let sent=0,resolveWrite;
 const result=new Promise(resolve=>{resolveWrite=resolve});
 const button={nodeType:1,tagName:'BUTTON',dataset:{},textContent:'Save changes',disabled:false,isConnected:true,
  matches:()=>false,getAttribute:()=>null,setAttribute(){},removeAttribute(){},querySelector:()=>null};
 const window={fetch:async()=>{sent++;await result;return{ok:true,status:200,headers:{get:()=> 'application/json'},
  clone:()=>({json:async()=>({ok:true})})}}};
 const body={appendChild(node){this.node=node}};
 const document={body,addEventListener(name,callback){handlers[name]=callback},createElement(){return{style:{},setAttribute(){},hidden:true}},
  getElementById(){return null}};
 const context={window,location:{pathname:'/admin/custom-requests/',origin:'https://devilndove.com',href:'https://devilndove.com/admin/custom-requests/'},document,URL,Date,Promise,Map,WeakMap,Set,String,JSON};
 vm.runInNewContext(src,context);
 handlers.click({target:{nodeType:1,closest:()=>button},preventDefault(){},stopImmediatePropagation(){}});
 const p1=window.fetch('/api/admin/custom-requests',{method:'POST',body:'{"action":"save","id":7}'});
 assert.equal(button.disabled,true);assert.match(button.textContent,/Saving/);
 const p2=window.fetch('/api/admin/custom-requests',{method:'POST',body:'{"action":"save","id":7}'});
 resolveWrite();await Promise.all([p1,p2]);
 assert.equal(sent,1);assert.equal(button.disabled,false);assert.equal(button.textContent,'Save changes');
 assert.match(body.node.textContent,/OK — action completed successfully/);
 assert.equal(window.DDAdminActionAck.pending(),0);
});
test('unsafe network ambiguity is not misrepresented as confirmation',async()=>{
 let cb;
 const button={nodeType:1,tagName:'BUTTON',dataset:{},textContent:'Delete selected',disabled:false,isConnected:true,
  matches:()=>false,getAttribute:()=>null,setAttribute(){},removeAttribute(){},querySelector:()=>null};
 const body={appendChild(node){this.node=node}};
 const document={body,addEventListener(name,callback){if(name==='click')cb=callback},createElement(){return{style:{},setAttribute(){}}}};
 const window={fetch:async()=>{throw Error('network failure')}};
 vm.runInNewContext(src,{window,location:{pathname:'/admin/inventory/',origin:'https://devilndove.com',href:'https://devilndove.com/admin/inventory/'},document,URL,Date,Promise,Map,WeakMap,Set,String,JSON});
 cb({target:{nodeType:1,closest:()=>button},preventDefault(){},stopImmediatePropagation(){}});
 await assert.rejects(window.fetch('/api/admin/inventory',{method:'DELETE',body:'{"id":7}'}));
 assert.equal(button.disabled,false);assert.match(body.node.textContent,/result is unknown/);
});
