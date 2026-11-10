import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {onRequestGet} from '../functions/api/admin/security-summary.js';
import {recoveryDescriptor} from '../functions/api/admin/_operationalRecovery.js';
import {evaluateShellRequest} from '../functions/api/_lib/ql336-owned-shell.mjs';
import {handleQl364SourceHealth} from '../functions/api/_lib/ql364-source-health.mjs';

const source=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const request=(cookie='')=>new Request('https://devilndove.com/api/admin/security-summary',{
  headers:cookie?{cookie:`dd_auth_token=${cookie}`}:{}});
function db({role='admin',active=1,expired=false,broken=false}={}){
  const writes=[];
  const account={user_id:42,session_user_id:42,session_id:9,email:'owner@example.test',
    display_name:'Owner',role,is_active:active,expires_at:'2099-01-01',
    password_hash:'NEVER_RETURN_THIS',session_token:'NEVER_RETURN_THIS'};
  return {
    writes,
    prepare(sql){
      if(/\b(?:INSERT|UPDATE|DELETE|DROP|ALTER|CREATE)\b/i.test(sql))writes.push(sql);
      const columns=sql.includes('table_info(sessions)')
        ?['session_id','user_id','session_token','expires_at']
        :['user_id','email','display_name','role','is_active','password_hash'];
      return {
        bind(){return this},
        async all(){if(broken)throw Error('PRIVATE_DB_DIAGNOSTIC');return {results:columns.map(name=>({name}))}},
        async first(){
          if(broken)throw Error('PRIVATE_DB_DIAGNOSTIC');
          if(sql.includes('INNER JOIN users'))return expired?null:account;
          if(sql.includes('FROM users'))return {total_users:4,active_users:3,inactive_users:1,admin_users:1,active_admin_users:1};
          if(sql.includes('FROM sessions'))return {total_sessions:6,active_sessions:2,expired_sessions:4,expiring_soon_sessions:1,stale_expired_sessions:2};
          throw Error('Unrecognized read-only source query');
        }
      };
    }
  };
}

test('anonymous, worker, inactive and expired identities cannot inspect the Admin security summary',async()=>{
  for(const [cookie,fixture] of [['',{}],['worker',{role:'worker'}],['inactive',{active:0}],['expired',{expired:true}]]){
    const database=db(fixture);
    const response=await onRequestGet({request:request(cookie),env:{DD_DB:database}});
    assert.equal(response.status,401,cookie||'anonymous');
    assert.equal(response.headers.get('Cache-Control'),'private, no-store');
    assert.equal(response.headers.get('X-Content-Type-Options'),'nosniff');
    assert.equal((await response.json()).ok,false);
    assert.equal(database.writes.length,0);
  }
});

test('active Admin reads bounded counts through DD_DB compatibility without exposing tokens or other users',async()=>{
  const database=db();
  const response=await onRequestGet({request:request('secret-token'),env:{DD_DB:database}});
  assert.equal(response.status,200);
  const data=await response.json();
  assert.equal(data.summary.active_admin_users,1);
  assert.equal(data.summary.stale_expired_sessions,2);
  assert.equal(data.security_readiness.tenant_isolation,'SOURCE_GATE_ONLY_FIELD_HOLD');
  assert.equal(data.security_readiness.backup_snapshot,'UNKNOWN_NO_ORIGINAL_RECEIPT');
  assert.equal(data.security_readiness.restore_witness,'HOLD_NO_INDEPENDENT_RESTORE');
  assert.equal(data.security_readiness.production_restore_executed,false);
  assert.equal(data.security_readiness.master_connection,'DISCONNECTED / HOLD');
  const encoded=JSON.stringify(data);
  for(const value of ['secret-token','NEVER_RETURN_THIS','PRIVATE_DB_DIAGNOSTIC'])assert.ok(!encoded.includes(value));
  assert.equal(database.writes.length,0);
});

test('missing binding and D1 error fail closed without leaking source diagnostics',async()=>{
  const noBinding=await onRequestGet({request:request('secret-token'),env:{}});
  assert.equal(noBinding.status,401);
  const broken=await onRequestGet({request:request('secret-token'),env:{DB:db({broken:true})}});
  assert.equal(broken.status,503);
  assert.equal((await broken.text()).includes('PRIVATE_DB_DIAGNOSTIC'),false);
  assert.equal(broken.headers.get('Cache-Control'),'private, no-store');
});

test('source shell rejects child impersonation, cross-method calls and unsigned private TEST',async()=>{
  const url='https://devilndove.com/api/integration/v1/shell/health';
  assert.deepEqual(evaluateShellRequest(new Request(url,{headers:{'x-child-id':'other-tenant'}})),{status:403,code:'DENY_CHILD_IDENTITY_AS_SHELL'});
  assert.equal(evaluateShellRequest(new Request(url,{method:'POST'})).status,405);
  assert.equal(evaluateShellRequest(new Request(url)).status,503);
  const unsigned=await handleQl364SourceHealth({request:new Request(url),sourceId:'devilndove',repository:'devilndove-site'});
  assert.equal(unsigned.status,503);
  const data=await unsigned.json();
  assert.equal(data.connected,false);
  assert.equal(data.customerDataAllowed,false);
  assert.equal(data.deviceActions,false);
});

test('recovery HEAD target rejects remote hosts and credential-bearing URLs',()=>{
  const descriptor=url=>recoveryDescriptor({details_json:JSON.stringify({public_url:url})});
  assert.equal(descriptor('https://assets.devilndove.com/sample.webp').kind,'https_head');
  for(const url of [
    'http://devilndove.com/private',
    'https://evil.example/private',
    'https://owner:password@devilndove.com/asset',
    'https://devilndove.com/asset?secret=token',
    'https://devilndove.com/asset#private',
    'https://devilndove.com:8443/asset'
  ]) assert.equal(descriptor(url).available,false,url);
});

test('the owner-facing security card exposes honest HOLD states without an unsafe restore button',()=>{
  const client=source('public/js/admin-security-summary.js');
  const handler=source('functions/api/admin/security-summary.js');
  assert.match(client,/security664Readiness/);
  assert.match(client,/readiness\.restore_witness/);
  assert.match(client,/successful security summary is not proof/i);
  assert.match(handler,/CODE_AND_CURRENT_ADMIN_COUNTS_NOT_FIELD_ACCEPTANCE/);
  assert.doesNotMatch(handler,/INSERT INTO|UPDATE users|DELETE FROM|DROP TABLE|ALTER TABLE/);
  assert.doesNotMatch(client,/method:\s*['"](?:POST|PUT|DELETE)['"]/);
});

test('release gate and owner guide require independent backup and privacy verification',()=>{
  const workflow=source('.github/workflows/current-application-quality.yml');
  const guide=source('docs/operations/RELEASE_467_BUILD_664_SECURITY_PRIVACY_RECOVERY_OWNER_GUIDE.md');
  assert.match(workflow,/release467_build664_security_privacy_tenant_recovery\.test\.mjs/);
  for(const value of ['NO_WITNESSED_RESTORE','HOLD','D1','R2','role','tenant','redact','recovery','Production GREEN'])
    assert.ok(guide.toLowerCase().includes(value.toLowerCase()),value);
});
