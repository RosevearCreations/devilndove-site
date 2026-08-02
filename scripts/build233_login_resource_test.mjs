import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import url from 'node:url';

const root=path.resolve(path.dirname(url.fileURLToPath(import.meta.url)),'..');
const read=(name)=>fs.readFileSync(path.join(root,name),'utf8');
const assert=(condition,message)=>{if(!condition)throw new Error(message);};

const loginApi=read('functions/api/auth/login.js');
const meApi=read('functions/api/auth/me.js');
const authClient=read('public/js/auth.js');
const authUi=read('public/js/site-auth-ui.js');
const loginClient=read('public/js/login.js');
const amazonMatches=read('functions/api/admin/_amazonInventoryMatches.js');
const catalogSync=read('functions/api/admin/catalog-sync.js');
const siteInventory=read('functions/api/admin/site-item-inventory.js');
const productResources=read('functions/api/admin/product-resources.js');

assert(loginApi.includes('response_profile: "auth_login_bounded_v1"'),'Bounded login response profile is missing.');
assert(loginApi.includes('await env.DB.batch(['),'Login session creation and last-login update must share one D1 batch.');
const postStart=loginApi.indexOf('async function handleLoginPost');
const postEnd=loginApi.indexOf('\nexport async function onRequest',postStart);
const postSource=loginApi.slice(postStart,postEnd);
assert(postSource.indexOf('request.json()') < postSource.indexOf('env?.DB'),'Login must validate/read the request before touching D1.');
assert(!/PRAGMA\s+table_info|sqlite_master/i.test(postSource),'Login POST hot path must not run schema discovery.');
assert(!postSource.includes('ORDER BY session_id DESC'),'Login POST must not reread the newest session.');
assert(authClient.includes('cloudflare_worker_resource_limit'),'Shared API parser must classify Cloudflare resource limits.');
assert(authUi.includes('authenticationRejected = status === 401 || status === 403'),'Session UI must clear only after an authentication rejection.');
assert(authUi.includes('session_retained: true'),'Temporary session-verification fallback must report retention.');
assert(loginClient.includes('No login or password change was completed.'),'Login resource-limit retry guidance is missing.');
assert(meApi.includes('response_profile: "auth_session_bounded_v1"'),'Bounded session-verification response profile is missing.');
assert(meApi.includes('WHERE s.session_token = ?'),'Session verification must use the indexed session_token lookup.');
assert(!/session_token\s*=\s*\?\s+OR\s+s\.token/i.test(meApi),'Session verification still performs the duplicate compatibility-token OR lookup.');
assert(amazonMatches.includes('AMAZON_INVENTORY_MATCHES_GZIP_BY_AREA'),'Amazon reference payload must remain compressed at Worker startup.');
assert(amazonMatches.includes("new DecompressionStream('gzip')"),'Amazon reference payload is missing demand-loaded gzip expansion.');
assert(!amazonMatches.includes('export const AMAZON_INVENTORY_MATCHES = ['),'Amazon reference payload still allocates the full object array at Worker startup.');
assert(!amazonMatches.includes('AMAZON_INVENTORY_MATCHES_JSON_BY_AREA'),'Amazon reference payload still embeds one megabyte of uncompressed JSON source.');
assert(Buffer.byteLength(amazonMatches)<300000,`Compressed Amazon helper unexpectedly exceeds 300 KB (${Buffer.byteLength(amazonMatches)} bytes).`);
assert(catalogSync.includes("await getAmazonInventoryMatch('toolshed'"),'Catalog tool sync must await its demand-loaded Amazon match.');
assert(catalogSync.includes("await getAmazonInventoryMatch('supplies'"),'Catalog supply sync must await its demand-loaded Amazon match.');
assert(siteInventory.includes('await getAmazonInventoryMatch(amazonArea'),'Inventory sync must await its demand-loaded Amazon match.');
assert(productResources.includes('await getAmazonInventoryMatch(amazonArea'),'Product resources must await their demand-loaded Amazon match.');

const password='owner-test-password';
const digest=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(password));
const passwordHash=`sha256$${[...new Uint8Array(digest)].map((byte)=>byte.toString(16).padStart(2,'0')).join('')}`;
const executions=[];
let batch=[];
const db={
  prepare(sql){
    const normalized=String(sql).replace(/\s+/g,' ').trim();
    return {
      sql:normalized,args:[],bind(...args){this.args=args;return this;},
      async first(){
        executions.push({kind:'first',sql:normalized,args:this.args});
        if(normalized.includes('FROM users WHERE email = ?')) return {user_id:7,email:'owner@example.test',password_hash:passwordHash,display_name:'Owner',role:'admin',is_active:1,created_at:'2026-01-01 00:00:00',updated_at:'2026-01-01 00:00:00'};
        throw new Error(`Unexpected first query: ${normalized}`);
      },
      async all(){throw new Error(`Unexpected all query: ${normalized}`);},
      async run(){throw new Error(`Login test expected batch, not run: ${normalized}`);}
    };
  },
  async batch(statements){
    executions.push({kind:'batch',count:statements.length});
    batch=statements.map((statement)=>({sql:statement.sql,args:statement.args}));
    return statements.map(()=>({meta:{changes:1}}));
  }
};

const loginModule=await import(url.pathToFileURL(path.join(root,'functions/api/auth/login.js')).href+`?test=${Date.now()}`);
const response=await loginModule.onRequestPost({
  request:new Request('https://devilndove.com/api/auth/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email:'OWNER@EXAMPLE.TEST',password})}),
  env:{DB:db}
});
const payload=await response.json();
assert(response.status===200&&payload.ok===true,'Valid owner login must return HTTP 200 JSON.');
assert(payload.response_profile==='auth_login_bounded_v1','Valid owner login did not return the bounded profile.');
assert(payload.user?.role==='admin'&&payload.session_token,'Valid owner login response is incomplete.');
assert(response.headers.get('X-DD-Auth-Profile')==='auth_login_bounded_v1','Bounded login response header is missing.');
assert(executions.length===2&&executions[0].kind==='first'&&executions[1].kind==='batch',`Login must execute exactly two D1 operations; received ${JSON.stringify(executions)}.`);
assert(batch.length===2,'Login atomic batch must contain the session insert and last-login update.');
assert(batch[0].sql.startsWith('INSERT INTO sessions'),'Session insert must be first in the login batch.');
assert(batch[1].sql.startsWith('UPDATE users SET last_login_at'),'Last-login update must be second in the login batch.');
assert(!executions.some((entry)=>/PRAGMA\s+table_info|sqlite_master/i.test(entry.sql||'')),'Mock login executed schema discovery.');

let invalidTouchedDb=false;
const invalidResponse=await loginModule.onRequestPost({
  request:new Request('https://devilndove.com/api/auth/login',{method:'POST',headers:{'Content-Type':'application/json'},body:'not-json'}),
  env:{DB:{prepare(){invalidTouchedDb=true;throw new Error('D1 must not be touched');},batch(){invalidTouchedDb=true;}}}
});
assert(invalidResponse.status===400&&!invalidTouchedDb,'Invalid JSON must fail before any D1 operation.');

let diagnosticTouchedDb=false;
const diagnosticResponse=await loginModule.onRequestGet({
  request:new Request('https://devilndove.com/api/auth/login'),
  env:{DB:{prepare(){diagnosticTouchedDb=true;throw new Error('Binding-only GET must not query D1');}}}
});
const diagnosticPayload=await diagnosticResponse.json();
assert(diagnosticResponse.status===200&&diagnosticPayload.diagnostic_mode==='binding_only','Default login GET must return binding-only diagnostics.');
assert(!diagnosticTouchedDb,'Default login GET unexpectedly queried D1.');

const meExecutions=[];
const meDb={prepare(sql){const normalized=String(sql).replace(/\s+/g,' ').trim();return {args:[],bind(...args){this.args=args;return this;},async first(){meExecutions.push({sql:normalized,args:this.args});return {session_id:33,expires_at:'2099-01-01 00:00:00',user_id:7,email:'owner@example.test',display_name:'Owner',role:'admin',is_active:1,created_at:'2026-01-01',updated_at:'2026-01-02'};}};}};
const meModule=await import(url.pathToFileURL(path.join(root,'functions/api/auth/me.js')).href+`?test=${Date.now()}`);
const meResponse=await meModule.onRequestGet({request:new Request('https://devilndove.com/api/auth/me',{headers:{Authorization:'Bearer current-session-token'}}),env:{DB:meDb}});
const mePayload=await meResponse.json();
assert(meResponse.status===200&&mePayload.response_profile==='auth_session_bounded_v1','Bounded session verification must return HTTP 200 and its profile.');
assert(meExecutions.length===1&&meExecutions[0].args.length===1,'Session verification must execute one query with one indexed token binding.');
assert(!/\sOR\s/i.test(meExecutions[0].sql),'Mock session verification executed an OR-token lookup.');

async function runUiSessionCheck(httpStatus){
  let domReady;
  let clearCount=0;
  const events=[];
  const cachedUser={user_id:7,email:'owner@example.test',display_name:'Owner',role:'admin'};
  const document={
    cookie:'',body:{appendChild(){}},
    addEventListener(name,handler){if(name==='DOMContentLoaded')domReady=handler;},
    dispatchEvent(event){events.push(event);},
    querySelectorAll(){return [];},querySelector(){return null;},getElementById(){return null;},
    createElement(){return {id:'',className:'',innerHTML:'',querySelector(){return null;}};}
  };
  const context={
    window:{location:{href:'https://devilndove.com/admin/',pathname:'/admin/',search:'',hash:'',origin:'https://devilndove.com'},DDAuth:{
      getStoredUser(){return cachedUser;},isLoggedIn(){return true;},
      async me(){const error=new Error('session check failed');error.httpStatus=httpStatus;error.code=httpStatus===503?'cloudflare_worker_resource_limit':'unauthorized';throw error;},
      clearAuth(){clearCount+=1;},async logout(){}
    }},
    document,CustomEvent:class{constructor(type,options){this.type=type;this.detail=options?.detail;}},URL,setTimeout,clearTimeout,console
  };
  vm.createContext(context);
  vm.runInContext(authUi,context);
  assert(typeof domReady==='function','Auth UI DOM-ready handler was not registered.');
  domReady();
  await new Promise((resolve)=>setTimeout(resolve,0));
  return {clearCount,events};
}

const temporary=await runUiSessionCheck(503);
assert(temporary.clearCount===0,'A temporary 503 session check erased the browser session.');
assert(temporary.events.some((event)=>event.type==='dd:auth-degraded'&&event.detail?.session_retained===true),'Temporary session failure did not emit retained/degraded evidence.');
const rejected=await runUiSessionCheck(401);
assert(rejected.clearCount===1,'An explicit 401 session rejection must clear the browser session.');

const migration=read('database_build230_visual_image_manifest.sql');
assert(read('database_upgrade_current_pass.sql')===migration,'Build 233 is code-only; current-pass SQL must remain the byte-identical Build 230 migration.');
assert(!/^\s*(BEGIN(?:\s+TRANSACTION)?|COMMIT|SAVEPOINT|RELEASE(?:\s+SAVEPOINT)?|ROLLBACK)\b/im.test(migration),'Current D1 migration contains an unsupported explicit transaction statement.');

const amazonModule=await import(url.pathToFileURL(path.join(root,'functions/api/admin/_amazonInventoryMatches.js')).href+`?test=${Date.now()}`);
const toolshedMatch=await amazonModule.getAmazonInventoryMatch('toolshed',0,'');
const suppliesMatch=await amazonModule.getAmazonInventoryMatch('supplies',0,'');
assert(toolshedMatch?.amazon_asin==='B08MD45N9H','Compressed toolshed reference payload did not round-trip correctly.');
assert(suppliesMatch?.amazon_asin==='B07H55M1ZR','Compressed supplies reference payload did not round-trip correctly.');

console.log('Build 233 bounded login/session verification, temporary-session retention, compressed private reference payload, safe error and code-only schema checks: PASS (2 login + 1 me mock D1 operations; 897 matches demand-loaded)');
