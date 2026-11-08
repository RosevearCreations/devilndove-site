import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';

const board=readFileSync(new URL('../public/js/admin-owner-restock-priority-642.js',import.meta.url),'utf8');
const editor=readFileSync(new URL('../public/js/admin-owner-restock-plans-641.js',import.meta.url),'utf8');
const day=offset=>{const d=new Date(),v=new Date(d.getFullYear(),d.getMonth(),d.getDate()+offset);
  return `${v.getFullYear()}-${String(v.getMonth()+1).padStart(2,'0')}-${String(v.getDate()).padStart(2,'0')}`;};
const plan=(id,status,due,title='Plan '+id)=>({plan_id:String(id).padStart(36,'a'),title,status,follow_up_on:due,owner_note:'Count pieces before taking action',
  items:[{product_id:id,name:'Ring '+id,units:2,method:'make',note:'Count pieces',saved_on_hand:1,qualifying_order_committed:1}],updated_at:'2026-11-08T12:00:00Z'});
const evidence=[plan(1,'follow_up',day(-2),'Overdue pendant'),plan(2,'draft',day(0),'Due today ring'),
  plan(3,'follow_up',day(7),'Seven day necklace'),plan(4,'blocked',day(15),'Blocked supplier'),
  plan(5,'draft','', 'Undated work'),plan(6,'completed',day(-8),'Completed trial')];
function element(value=''){return {value,textContent:'',innerHTML:'',disabled:false,dataset:{},events:{},attributes:{},
  addEventListener(kind,handler){this.events[kind]=handler;},setAttribute(k,v){this.attributes[k]=v;},
  querySelectorAll(){return[];},focus(){},scrollIntoView(){}};}
function fixture(){
  const ids=['dd642PriorityPanel','dd642Status','dd642Counts','dd642Rows'];
  const els=Object.fromEntries(ids.map(x=>[x,element()]));
  const filters=['all','overdue','week','blocked','undated','completed'].map(f=>{const el=element();el.dataset.dd642Filter=f;return el;});
  els.dd642PriorityPanel.querySelectorAll=key=>key==='[data-dd642-filter]'?filters:[];
  const reviewButton=element();els.dd642Rows.querySelectorAll=key=>key==='[data-dd642-review]'?[reviewButton]:[];
  let listener=null;const opened=[];const source={subscribe(fn){listener=fn;fn({loaded:false});return()=>{};},
    reopen(id){opened.push(id);return evidence.some(p=>p.plan_id===id);}};
  const win={DD641OwnerPlans:source};
  runInNewContext(board,{window:win,document:{getElementById:id=>els[id]||null}});
  return {els,filters,opened,reviewButton,receive:s=>listener(s),win};
}
function loaded(plans=evidence){return {loaded:true,owner_user_id:7,version:3,plans};}

test('642 has accessible priority filters, read-only source boundary and no periodic fetch',()=>{
  const html=readFileSync(new URL('../admin/products/index.html',import.meta.url),'utf8');
  for(const id of ['dd642PriorityPanel','dd642Status','dd642Counts','dd642Rows'])assert.match(html,new RegExp(`id="${id}"`));
  for(const value of ['all','overdue','week','blocked','undated','completed'])assert.match(html,new RegExp(`data-dd642-filter="${value}"`));
  assert.match(html,/admin-owner-restock-priority-642\.js\?v=642/);
  assert.match(html,/aria-pressed/);assert.match(html,/aria-live="polite"/);
  assert.doesNotMatch(board,/apiFetch|fetch\(|XMLHttpRequest|setInterval\(|setTimeout\(|localStorage|sessionStorage|inventory_quantity\s*=/);
});

test('642 does not display private owner plans before explicit verified load',()=>{
  const f=fixture();assert.equal(f.filters.every(x=>x.disabled),true);
  assert.match(f.els.dd642Rows.textContent,/Load my saved plans/);
  f.filters[1].events.click();assert.equal(f.opened.length,0);
});

test('642 correctly counts overdue, today, inclusive seven-day, blocked, undated and completed',()=>{
  const f=fixture();f.receive(loaded());assert.equal(f.filters.every(x=>!x.disabled),true);
  const counts=f.els.dd642Counts.textContent;
  assert.match(counts,/1 overdue/);assert.match(counts,/2 due within 7 days/);
  assert.match(counts,/1 blocked/);assert.match(counts,/1 active without dates/);assert.match(counts,/1 completed/);
  const rows=f.els.dd642Rows.innerHTML;
  assert.ok(rows.indexOf('Overdue pendant')<rows.indexOf('Due today ring'));
  assert.ok(rows.indexOf('Due today ring')<rows.indexOf('Blocked supplier'));
  assert.ok(rows.indexOf('Blocked supplier')<rows.indexOf('Seven day necklace'));
  assert.ok(rows.indexOf('Undated work')<rows.indexOf('Completed trial'));
});

test('642 filter shortcuts never requery, overlap correctly and have truthful empty states',()=>{
  const f=fixture();f.receive(loaded());
  const choose=kind=>f.filters.find(x=>x.dataset.dd642Filter===kind).events.click();
  choose('overdue');assert.match(f.els.dd642Rows.innerHTML,/Overdue pendant/);assert.doesNotMatch(f.els.dd642Rows.innerHTML,/Due today ring/);
  choose('week');assert.match(f.els.dd642Rows.innerHTML,/Due today ring/);assert.match(f.els.dd642Rows.innerHTML,/Seven day necklace/);
  assert.doesNotMatch(f.els.dd642Rows.innerHTML,/Overdue pendant/);
  choose('blocked');assert.match(f.els.dd642Rows.innerHTML,/Blocked supplier/);assert.doesNotMatch(f.els.dd642Rows.innerHTML,/Seven day necklace/);
  choose('undated');assert.match(f.els.dd642Rows.innerHTML,/Undated work/);
  choose('completed');assert.match(f.els.dd642Rows.innerHTML,/Completed trial/);
  assert.equal(f.filters.find(x=>x.dataset.dd642Filter==='completed').attributes['aria-pressed'],'true');
  f.receive(loaded([]));assert.match(f.els.dd642Rows.innerHTML,/No owner plans match/);
});

test('642 Review plan uses only the existing owner editor, never a direct stock or network action',()=>{
  const f=fixture();f.receive(loaded());f.reviewButton.dataset.dd642Review=evidence[0].plan_id;
  f.reviewButton.events.click();assert.deepEqual(f.opened,[evidence[0].plan_id]);assert.match(f.els.dd642Status.textContent,/Opened/);
  f.reviewButton.dataset.dd642Review='not-owned';f.reviewButton.events.click();
  assert.match(f.els.dd642Status.textContent,/Reload saved plans/);
});

test('642 escapes untrusted owner notes and titles, suppresses malformed/unverified snapshots',()=>{
  const f=fixture();const badTitle=plan(8,'follow_up',day(-1),'<img src=x onerror=alert(1)>');
  badTitle.owner_note='<script>evil()</script>';f.receive(loaded([badTitle]));
  assert.doesNotMatch(f.els.dd642Rows.innerHTML,/<img|<script/);
  assert.match(f.els.dd642Rows.innerHTML,/&lt;img/);
  f.receive(loaded([{...badTitle,status:'unapproved'}]));assert.equal(f.filters.every(x=>x.disabled),true);
  assert.match(f.els.dd642Status.textContent,/HOLD/);
  f.receive({loaded:false});assert.match(f.els.dd642Rows.textContent,/Load my saved plans/);
});

test('642 listens to the real 641 owner editor after deliberate GET, and reopens its original owner draft',async()=>{
  const ids=['dd641PlansPanel','dd641Load','dd641New','dd641Status','dd641List','dd641Title','dd641Due',
    'dd641State','dd641Note','dd641Items','dd641Save','dd641Cancel',
    'dd642PriorityPanel','dd642Status','dd642Counts','dd642Rows'];
  const els=Object.fromEntries(ids.map(x=>[x,element()])),filters=['all','overdue','week','blocked','undated','completed']
    .map(f=>{const e=element();e.dataset.dd642Filter=f;return e;});
  els.dd642PriorityPanel.querySelectorAll=s=>s==='[data-dd642-filter]'?filters:[];
  const review=element();review.dataset.dd642Review=evidence[0].plan_id;
  els.dd642Rows.querySelectorAll=s=>s==='[data-dd642-review]'?[review]:[];
  let reads=0,writes=0;const win={DDAuth:{apiFetch:async(url,options)=>{
    if(options.method==='GET'){reads++;return {ok:true,json:async()=>({ok:true,private:true,owner_user_id:7,version:3,plans:evidence})};}
    writes++;const body=JSON.parse(options.body);assert.equal(body.action,'update');assert.equal(body.expected_version,3);
    return {ok:true,json:async()=>({ok:true,saved:true,audit_recorded:true,version:4,
      plan:{...evidence[0],status:'completed',updated_at:'2026-11-08T13:00:00Z'}})};
  }}};
  const document={getElementById:id=>els[id]||null};
  runInNewContext(editor,{window:win,document});runInNewContext(board,{window:win,document});
  assert.equal(reads,0);assert.equal(filters.every(x=>x.disabled),true);
  els.dd641Load.events.click();await new Promise(resolve=>setImmediate(resolve));
  assert.equal(reads,1);assert.match(els.dd642Rows.innerHTML,/Overdue pendant/);
  review.events.click();assert.equal(els.dd641Title.value,'Overdue pendant');
  assert.equal(els.dd641Due.value,day(-2));assert.equal(els.dd641State.value,'follow_up');
  assert.equal(reads,1);
  els.dd641State.value='completed';els.dd641Save.events.click();await new Promise(resolve=>setImmediate(resolve));
  assert.equal(writes,1);assert.equal(reads,1);assert.match(els.dd642Counts.textContent,/2 completed reviews/);
  assert.match(els.dd642Rows.innerHTML,/Review completed/);
});
