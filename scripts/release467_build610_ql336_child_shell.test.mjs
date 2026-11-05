import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {DatabaseSync} from 'node:sqlite';
import {onRequest,SHELL_ID,FIRST_CHILD,PATHS} from '../functions/api/_lib/ql336-owned-shell.mjs';

test('Devil n Dove is an owned first child, not platform-wide trust',async()=>{
  assert.notEqual(SHELL_ID,FIRST_CHILD);
  for(const path of PATHS){
    const r=await onRequest({request:new Request(`https://preview.example${path}`)});
    assert.equal(r.status,503);
    const data=await r.json();
    assert.equal(data.shell_id,SHELL_ID);
    assert.equal(data.authenticated,false);
    assert.equal(data.child_data_included,false);
    assert.equal(data.provider_operations_enabled,false);
    assert.equal(r.headers.get('Cache-Control'),'private, no-store');
  }
});
test('No forged child, alternate route or POST can reach Etsy, orders or media',async()=>{
  const url='https://preview.example/api/integration/v1/shell/capabilities';
  const call=async(u,opts)=>onRequest({request:new Request(u,opts)});
  assert.equal((await call(url,{method:'POST'})).status,405);
  assert.equal((await call(url+'?child=devil-n-dove')).status,404);
  assert.equal((await call(url,{headers:{'X-Rosevear-Business':'devil-n-dove'}})).status,403);
  assert.equal((await call(url,{headers:{'X-Rosevear-Shell-Envelope':'forged'}})).status,503);
  assert.equal((await call('https://preview.example/api/orders')).status,404);
});
test('proposed pending D1 tables cannot duplicate an order, Etsy listing or media claim across children',()=>{
  const sql=readFileSync('migrations/proposed/0051_ql336_owned_child_shell_hold.sql','utf8');
  const db=new DatabaseSync(':memory:');
  try {
    db.exec('PRAGMA foreign_keys=ON');db.exec(sql);
    const insert=db.prepare("INSERT INTO maker_shell_children_ql336(child_id,child_slug,display_name) VALUES(?,?,?)");
    insert.run('maker-a','maker-a','Maker A');insert.run('maker-b','maker-b','Maker B');
    db.prepare("INSERT INTO maker_shell_resource_claims_ql336(resource_kind,legacy_resource_id,child_id) VALUES('listing','etsy-7','maker-a')").run();
    assert.throws(()=>db.prepare("INSERT INTO maker_shell_resource_claims_ql336(resource_kind,legacy_resource_id,child_id) VALUES('listing','etsy-7','maker-b')").run());
    assert.throws(()=>db.prepare("UPDATE maker_shell_children_ql336 SET lifecycle='ACTIVE' WHERE child_id='maker-a'").run());
    assert.throws(()=>db.prepare("INSERT INTO maker_shell_resource_claims_ql336(resource_kind,legacy_resource_id,child_id) VALUES('order','1','unknown')").run());
    assert.equal(db.prepare('SELECT COUNT(*) AS count FROM maker_shell_memberships_ql336').get().count,0);
  } finally {db.close();}
});
