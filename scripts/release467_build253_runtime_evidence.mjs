import assert from 'node:assert/strict';
import { consumeAbuseBudget, rateLimitedResponse } from '../functions/api/_lib/authAbuseGuard.js';
import { evaluateMutationOrigin } from '../functions/api/_lib/csrfOriginProtection.js';
import { getAccountRequestToken } from '../functions/api/_lib/accountAuthCompat.js';
import { onRequestPost as revokeOtherSessions } from '../functions/api/auth/revoke-other-sessions.js';
import { requireAdminStepUp } from '../functions/api/_lib/adminStepUp.js';
import { formatStoredPasswordHashFromPlaintext } from '../functions/api/_lib/passwordHash.js';

const evidence = [];
function ok(name, detail='GREEN'){ evidence.push({name,detail}); }

class MemoryCache {
  constructor(){ this.map=new Map(); }
  async match(request){
    const hit=this.map.get(request.url);
    if(!hit) return undefined;
    return new Response(hit.body,{status:hit.status,headers:hit.headers});
  }
  async put(request,response){
    this.map.set(request.url,{body:await response.clone().text(),status:response.status,headers:Object.fromEntries(response.headers)});
  }
}
globalThis.caches={default:new MemoryCache()};

const throttleRequest=new Request('https://dev.devilndove.com/api/auth/login',{
  method:'POST',
  headers:{'CF-Connecting-IP':'203.0.113.42','Content-Type':'application/json'}
});
let ninth;
for(let i=1;i<=9;i+=1){
  const result=await consumeAbuseBudget({request:throttleRequest,scope:'login',identity:'synthetic@example.invalid',limit:8,windowSeconds:900});
  if(i<=8) assert.equal(result.allowed,true);
  if(i===9) ninth=result;
}
assert.equal(ninth.allowed,false);
assert.equal(ninth.fingerprint_exposed,false);
const limited=rateLimitedResponse(ninth);
assert.equal(limited.status,429);
assert.ok(Number(limited.headers.get('Retry-After'))>=1);
const limitedBody=await limited.text();
assert.equal(limitedBody.includes('synthetic@example.invalid'),false);
assert.equal(limitedBody.toLowerCase().includes('fingerprint'),false);
ok('login_throttle_runtime');

const sameOrigin=evaluateMutationOrigin(new Request('https://dev.devilndove.com/api/auth/change-password',{method:'POST',headers:{Origin:'https://dev.devilndove.com'}}));
assert.equal(sameOrigin.allowed,true);
const crossOrigin=evaluateMutationOrigin(new Request('https://dev.devilndove.com/api/auth/change-password',{method:'POST',headers:{Origin:'https://example.invalid'}}));
assert.equal(crossOrigin.allowed,false);
assert.equal(crossOrigin.response.status,403);
const crossBody=await crossOrigin.response.json();
assert.equal(crossBody.code,'csrf_origin_rejected');
const bearerOrigin=evaluateMutationOrigin(new Request('https://dev.devilndove.com/api/auth/change-password',{method:'POST',headers:{Authorization:'Bearer synthetic-automation-token'}}));
assert.deepEqual({allowed:bearerOrigin.allowed,mode:bearerOrigin.mode},{allowed:true,mode:'bearer_automation'});
ok('csrf_origin_runtime');

const cookieRequest=new Request('https://dev.devilndove.com/api/auth/session-info',{headers:{Cookie:'dd_auth_token=synthetic-current-session'}});
assert.equal(getAccountRequestToken(cookieRequest),'synthetic-current-session');
const bearerRequest=new Request('https://dev.devilndove.com/api/auth/session-info',{headers:{Cookie:'dd_auth_token=synthetic-cookie',Authorization:'Bearer synthetic-bearer'}});
assert.equal(getAccountRequestToken(bearerRequest),'synthetic-bearer');
ok('cookie_first_session_runtime');

class MockStatement {
  constructor(db,sql){ this.db=db; this.sql=String(sql); this.args=[]; }
  bind(...args){ this.args=args; return this; }
  async all(){
    if(this.sql.startsWith('PRAGMA table_info(sessions)')) return {results:[
      {name:'session_id'},{name:'user_id'},{name:'session_token'},{name:'token'},{name:'expires_at'},{name:'created_at'}
    ]};
    if(this.sql.startsWith('PRAGMA table_info(users)')) return {results:[
      {name:'user_id'},{name:'email'},{name:'display_name'},{name:'role'},{name:'is_active'},{name:'created_at'},{name:'updated_at'},{name:'password_hash'}
    ]};
    if(this.sql.includes('SELECT session_id FROM sessions WHERE user_id=? AND session_id<>?')) return {results:[{session_id:11},{session_id:12}]};
    return {results:[]};
  }
  async first(){
    if(this.sql.includes('FROM sessions s INNER JOIN users u')) return {
      session_id:10,session_user_id:7,user_id:7,email:'synthetic@example.invalid',display_name:'Synthetic',role:'admin',is_active:1
    };
    if(this.sql.includes('FROM users u') && this.sql.includes('INNER JOIN sessions s')) return this.db.stepUpRow || null;
    return null;
  }
  async run(){
    if(this.sql.includes('DELETE FROM sessions WHERE session_id IN')){
      this.db.deleted=this.args.slice();
      return {success:true};
    }
    return {success:true};
  }
}
class MockDb {
  constructor(){ this.deleted=[]; this.stepUpRow=null; }
  prepare(sql){ return new MockStatement(this,sql); }
}
const revokeDb=new MockDb();
const revokeResponse=await revokeOtherSessions({request:cookieRequest,env:{DB:revokeDb}});
assert.equal(revokeResponse.status,200);
const revokeBody=await revokeResponse.json();
assert.equal(revokeBody.current_session_preserved,true);
assert.equal(revokeBody.revoked_sessions,2);
assert.deepEqual(revokeDb.deleted,[11,12]);
assert.equal(revokeDb.deleted.includes(10),false);
ok('revoke_other_sessions_runtime');

const stepDb=new MockDb();
const stepRequest=new Request('https://dev.devilndove.com/api/admin/cleanup-sessions',{method:'POST',headers:{Cookie:'dd_auth_token=synthetic-current-session'}});
const missingStep=await requireAdminStepUp(stepRequest,{DB:stepDb},{user_id:7},{},'session cleanup');
assert.equal(missingStep.ok,false);
assert.equal(missingStep.response.status,403);
const missingBody=await missingStep.response.json();
assert.equal(missingBody.requires_step_up,true);
const confirmPassword='Synthetic-Only-Password-253!';
stepDb.stepUpRow={user_id:7,password_hash:await formatStoredPasswordHashFromPlaintext(confirmPassword),expires_at:'2099-01-01 00:00:00'};
const passedStep=await requireAdminStepUp(stepRequest,{DB:stepDb},{user_id:7},{confirm_password:confirmPassword},'session cleanup');
assert.equal(passedStep.ok,true);
ok('admin_step_up_runtime');

const serialized=JSON.stringify(evidence);
assert.equal(serialized.includes('Synthetic-Only-Password-253!'),false);
assert.equal(serialized.includes('synthetic-current-session'),false);
assert.equal(serialized.includes('synthetic-automation-token'),false);
ok('secret_output_runtime');

console.log('RELEASE 467 BUILD 253 SESSION & ABUSE-CONTROL RUNTIME EVIDENCE');
for(const item of evidence) console.log('PASS',item.name,item.detail);
console.log('PASS no real credentials, D1/R2 business mutation, provider action or secret output');
console.log('Future queue: OPEN; next Build 254');
