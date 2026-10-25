import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import vm from 'node:vm';

const require = createRequire(import.meta.url);
const { classify } = require('../public/js/admin-recovery-policy-468.js');
const file = (path) => readFileSync(new URL('../' + path, import.meta.url), 'utf8');

test('Build 468: 503, 1102, auth failure and uncertain Product writes have distinct manual decisions', () => {
  const cpu = classify({httpStatus:503,isCloudflareResourceLimit:true,cloudflareRay:'8d3cabbbb-YYZ'},'save');
  assert.equal(cpu.category,'worker_1102');
  assert.equal(cpu.uncertainWrite,true);
  assert.match(cpu.guidance,/A write may have completed|may have completed/i);
  assert.match(cpu.guidance,/no automatic write retry/i);
  assert.equal(cpu.cloudflareRay,'8d3cabbbb-YYZ');
  assert.equal(classify({httpStatus:503,code:'d1_read_capacity_unavailable'},'load').category,'d1_503');
  assert.equal(classify({httpStatus:503,code:'d1_read_capacity_unavailable'},'load').uncertainWrite,false);
  assert.equal(classify({httpStatus:409,code:'product_price_readback_unconfirmed'},'save').uncertainWrite,true);
  assert.equal(classify({httpStatus:401},'load').category,'authorization');
  assert.equal(classify({httpStatus:401},'login').uncertainWrite,false);
  assert.equal(classify({httpStatus:400,code:'invalid_price_cents'},'save').uncertainWrite,false);
  assert.equal(classify({httpStatus:503},'login').temporary,true);
  assert.equal(classify({httpStatus:503,cloudflareRay:'<secret>\n'},'save').cloudflareRay,'');
});

function authHarness(fetcher) {
  const context = {
    Headers, FormData, Response, URL, AbortController, JSON, Promise, CustomEvent:class {constructor(type,options){this.type=type;this.detail=options?.detail;}},
    fetch:fetcher,
    document:{cookie:'',dispatchEvent(){}},
    localStorage:{removeItem(){},getItem(){return null;},setItem(){}},
    sessionStorage:{getItem(){return null;},setItem(){}},
    window:{location:{origin:'https://devilndove.com',pathname:'/login/'},setTimeout,clearTimeout},
  };
  vm.runInNewContext(file('public/js/auth.js'),context);
  return context.window.DDAuth;
}

test('Build 468: branded Cloudflare 1102 HTML is recognized without echoing HTML or secrets',async()=>{
  const auth = authHarness(async()=>{throw Error('No external network expected.');});
  const html = '<html><h1>Error 1102</h1><p>Worker exceeded resource limits</p>hidden-key-please-not-echo</html>';
  const response = new Response(html,{status:503,headers:{'Content-Type':'text/html','cf-ray':'8d3cabbbb-YYZ'}});
  await assert.rejects(auth.readApiJson(response), (error) => {
    assert.equal(error.isCloudflareResourceLimit,true);
    assert.equal(error.code,'cloudflare_worker_resource_limit');
    assert.equal(error.httpStatus,503);
    assert.match(error.message,/CPU or memory limit/);
    assert.doesNotMatch(error.message,/hidden-key-please-not-echo/);
    return true;
  });
});

test('Build 468: server 503 on sign-in never replays the credential POST',async()=>{
  let calls=0;
  const auth=authHarness(async(_url,options)=>{
    calls+=1;
    assert.equal(options.method,'POST');
    assert.equal(options.credentials,'same-origin');
    return new Response(JSON.stringify({ok:false,error:'Temporary D1 outage',code:'AUTH_USER_LOOKUP_FAILED'}),{
      status:503,headers:{'Content-Type':'application/json'}
    });
  });
  await assert.rejects(auth.login('maker@example.invalid','not-a-real-password'),/Temporary D1 outage/);
  assert.equal(calls,1);
});

test('Build 468: a double-clicked login stays one in-flight attempt and restores the form on 503',async()=>{
  const listeners=new Map();
  const form={addEventListener:(type,handler)=>listeners.set('form:'+type,handler)};
  const email={value:'maker@example.invalid'},password={value:'our-local-test-password'};
  const notice={textContent:'',style:{},setAttribute(name,value){this[name]=value;}};
  const button={disabled:false,textContent:'Sign In'};
  const byId={loginForm:form,loginEmail:email,loginPassword:password,loginMessage:notice,loginSubmitButton:button};
  let attempts=0;let fail;
  const pending=new Promise((_resolve,reject)=>{fail=reject;});
  const context={document:{getElementById:(id)=>byId[id]||null,addEventListener:(name,handler)=>listeners.set(name,handler),dispatchEvent(){}},
    window:{DDAuth:{login:()=>{attempts+=1;return pending;}},location:{href:'https://devilndove.com/login/'}},
    URL};
  context.window.DDRecovery468={classify};
  vm.runInNewContext(file('public/js/login.js'),context);
  listeners.get('DOMContentLoaded')();
  const handler=listeners.get('form:submit');
  const first=handler({preventDefault(){}});
  const second=handler({preventDefault(){}});
  assert.equal(attempts,1);
  assert.equal(button.disabled,true);
  fail(Object.assign(new Error('Temporarily unavailable'),{httpStatus:503}));
  await Promise.all([first,second]);
  assert.equal(attempts,1);
  assert.equal(button.disabled,false);
  assert.equal(password.value,'our-local-test-password');
  assert.equal(notice.role,'alert');
  assert.match(notice.textContent,/No automatic login retry/i);
});

test('Build 468: Product UI uses one explicit write and a server-readback manual reconciliation gate',()=>{
  const editor=file('public/js/admin-product-editor-v163.js');
  const recovery=file('public/js/admin-recovery-policy-468.js');
  const page=file('admin/product-editor/index.html');
  const login=file('login/index.html');
  const loginJs=file('public/js/login.js');
  const save=file('functions/api/admin/product-editor-save.js');
  assert.equal(file('public/js/auth.js'),file('public/js/admin-auth.js'),'cookie-first Admin auth alias must remain identical');
  assert.match(editor,/refreshDirty\(\);snapshotEdits\(\);\s*const submittedFingerprint/);
  assert.match(editor,/const unlockFields=freezeFields\(\)/);
  assert.match(editor,/state\.saveNeedsReview=true/);
  assert.match(editor,/state\.quotaStop=false;load\(\)/);
  assert.match(editor,/state\.productId&&state\.saveNeedsReview/);
  assert.match(editor,/baseline=submittedFingerprint;refreshDirty\(\);snapshotEdits\(\)/);
  assert.match(editor,/DDProductChannels405\?\.afterProductSave/);
  assert.match(page,/admin-recovery-policy-468\.js\?v=467b468/);
  assert.match(login,/admin-recovery-policy-468\.js\?v=467b468/);
  assert.match(login,/login\.js\?v=467b468/);
  assert.match(loginJs,/if \(signingIn\) return/);
  assert.match(recovery,/Never replays a request, reads D1, stores credentials or sends telemetry/);
  assert.doesNotMatch(recovery, /\bfetch\s*\(|localStorage|setInterval|sendBeacon/);
  assert.match(save,/schema_introspection_reads:0/);
  assert.match(save,/retry_automatically:false/);
  assert.doesNotMatch(editor,/setInterval\s*\(|window\.setInterval\s*\(/);
  assert.match(file('docs/operations/RELEASE_467_BUILD_468_PRODUCT_EDITOR_LOGIN_RECOVERY.md'),/HOLD.*real-owner|real-owner.*HOLD/is);
});
