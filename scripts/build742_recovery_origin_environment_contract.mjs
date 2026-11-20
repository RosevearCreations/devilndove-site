// Build 742 prereq: independent no-network reset-link host isolation.
// All credentials, emails, users, D1 records and Resend calls below are in-memory mocks.
import assert from 'node:assert/strict';
import {onRequestPost} from '../functions/api/auth/recovery-734.js';
import {readFileSync} from 'node:fs';
const source=readFileSync(new URL('../functions/api/auth/recovery-734.js',import.meta.url),'utf8');
assert.ok(!source.includes("const link='https://devilndove.com/account-help/index.html?mode=reset#token='+raw;"));
assert.ok(source.includes("canonicalResetLink734(request,raw)"));
assert.ok(source.includes("if(url.protocol!=='https:'||!authorizedHost)return ''"));
assert.ok(source.includes("host==='dev.devilndove-site.pages.dev'"));

const originalFetch=globalThis.fetch;
const sent=[];
globalThis.fetch=async (url,options)=>{
  assert.equal(url,'https://api.resend.com/emails');
  const body=JSON.parse(options.body);
  sent.push(body);
  return new Response(JSON.stringify({id:'mock-only'}),{status:200,headers:{'Content-Type':'application/json'}});
};
const mockDb=()=>{
  const statements=[];
  return {
    statements,
    prepare(sql) {
      return {
        bind(...params){
          return {
            async first(){
              if(sql.includes('SELECT user_id,email,is_active FROM users'))return {user_id:93,email:'owner@example.invalid',is_active:1};
              throw new Error('Unexpected SELECT in fake D1: '+sql.slice(0,55));
            },
            async run(){statements.push({sql,params});return {meta:{changes:1}};}
          };
        }
      };
    },
    batch:async()=>{throw Error('No batch mutations expected in reset requests');}
  };
};
async function request(host){
  const db=mockDb();
  const req=new Request(host+'/api/auth/recovery-734',{
    method:'POST',headers:{'Content-Type':'application/json','Origin':host},
    body:JSON.stringify({action:'reset_request',email:'owner@example.invalid'})
  });
  let wait=null;
  const result=await onRequestPost({
    request:req,
    env:{DB:db,RESEND_API_KEY:'local-test-key',NOTIFICATION_FROM_EMAIL:'notify@example.invalid'},
    waitUntil(p){wait=p}
  });
  assert.equal(result.status,200);
  const resp=await result.json();
  assert.equal(resp.delivery_unconfirmed,true);
  assert.ok(!JSON.stringify(resp).includes('token='));
  assert.ok(wait);
  await wait;
  return {statements:db.statements};
}
try {
  for(const host of [
    'https://dev.devilndove-site.pages.dev',
    'https://abcd1234.devilndove-site.pages.dev',
    'https://devilndove.com',
    'https://www.devilndove.com'
  ]){
    const before=sent.length;
    await request(host);
    assert.equal(sent.length,before+1,host+' should send exactly one mocked mail');
    const mail=sent.at(-1);
    assert.ok(mail.html.includes(host+'/account-help/index.html?mode=reset#token='),host+' must use original request host');
    assert.ok(/#token=[0-9a-f]{64}/.test(mail.html),'only single-use fragment token');
    assert.equal(mail.to[0],'owner@example.invalid');
  }
  const before=sent.length;
  const untrusted=await request('https://attacker.invalid');
  assert.equal(sent.length,before,'no reset email to uncontrolled attacker host');
  assert.ok(untrusted.statements.some(s=>s.sql.includes('SET consumed_at=CURRENT_TIMESTAMP')),'untrusted host token must be invalidated');
  console.log('BUILD 742 DEVELOPMENT AUTH RESET LINK: PASS — dev, exact Preview, prod and www use own allowlisted hosts; untrusted host refused, no production redirect, in-memory only.');
} finally{
  globalThis.fetch=originalFetch;
}
