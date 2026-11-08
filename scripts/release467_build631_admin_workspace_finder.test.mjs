import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';

const root=new URL('../',import.meta.url);
const html=readFileSync(new URL('admin/index.html',root),'utf8');
const source=readFileSync(new URL('public/js/admin-home-on-demand-v398.js',root),'utf8');

function harness(){
 const listeners=new Map();
 const make=(tagName='DIV')=>({tagName,value:'',textContent:'',hidden:false,disabled:false,
  events:{},addEventListener(type,callback){this.events[type]=callback;},
  focus(){document.activeElement=this;}});
 const search=make('INPUT'),clear=make('BUTTON'),count=make('P');
 const button=make('BUTTON'),status=make('P'),mount=make('DIV');
 const data=[['Product Management','Product records and catalogue'],
  ['Maker Workbench','Creative Project workshop'],
  ['Cross-Project Accounting','Financial review']];
 const cards=data.map(([name,detail])=>({...make('A'),
  querySelector(selector){return {textContent:selector==='strong'?name:detail};}}));
 const ids={dd631WorkspaceSearch:search,dd631WorkspaceClear:clear,
  dd631WorkspaceCount:count,admin398LoadSnapshot:button,
  admin398SnapshotStatus:status,admin398SnapshotMount:mount};
 const document={activeElement:{tagName:'BODY'},getElementById:id=>ids[id]||null,
  querySelectorAll:selector=>selector==='#ddBrandV3AdminWorkspaces > a.dd-brand-v3-admin-card'?cards:[],
  addEventListener(type,callback){listeners.set(type,callback);}};
 const window={addEventListener(type,callback){listeners.set('window:'+type,callback);}};
 let requests=0;
 runInNewContext(source,{document,window,fetch(){requests++;throw Error('unexpected fetch');}});
 return {document,search,clear,count,cards,listeners,requests:()=>requests};
}

test('Build 631 uses one labeled no-network search landmark without a new H1',()=>{
 assert.match(html,/role="search" aria-label="Find an Admin workspace"/);
 assert.match(html,/id="dd631WorkspaceSearch"[^>]*aria-controls="ddBrandV3AdminWorkspaces"/);
 assert.match(html,/id="dd631WorkspaceCount" role="status" aria-live="polite"/);
 assert.match(html,/dd-brand-v3-admin-card\[hidden\]\{display:none!important\}/);
 assert.equal((html.match(/<h1\b/g)||[]).length,1);
 assert.doesNotMatch(source,/localStorage|sessionStorage|sendBeacon|new WebSocket/);
});

test('Build 631 filters existing static workspaces, restores everything and never fetches',()=>{
 const h=harness();
 assert.equal(h.count.textContent,'Showing 3 of 3 workspaces.');
 h.search.value='maker WORK';h.search.events.input();
 assert.deepEqual(h.cards.map(x=>x.hidden),[true,false,true]);
 assert.equal(h.count.textContent,'Showing 1 of 3 workspaces.');
 assert.equal(h.clear.disabled,false);
 h.search.value='not-present';h.search.events.input();
 assert.ok(h.cards.every(x=>x.hidden));
 assert.match(h.count.textContent,/No matching workspace/);
 h.clear.events.click();
 assert.ok(h.cards.every(x=>!x.hidden));
 assert.equal(h.document.activeElement,h.search);
 assert.equal(h.clear.disabled,true);
 assert.equal(h.requests(),0);
});

test('Build 631 slash, Enter and Escape are safe and respect editable focus',()=>{
 const h=harness();let prevented=0;
 h.listeners.get('keydown')({key:'/',preventDefault(){prevented++;}});
 assert.equal(h.document.activeElement,h.search);
 assert.equal(prevented,1);
 h.search.value='accounting';h.search.events.input();
 h.search.events.keydown({key:'Enter',preventDefault(){prevented++;}});
 assert.equal(h.document.activeElement,h.cards[2]);
 h.document.activeElement={tagName:'TEXTAREA'};
 h.listeners.get('keydown')({key:'/',preventDefault(){prevented++;}});
 assert.equal(prevented,2);
 h.search.events.keydown({key:'Escape',preventDefault(){prevented++;}});
 assert.equal(h.search.value,'');
 assert.ok(h.cards.every(x=>!x.hidden));
 assert.equal(h.requests(),0);
});
