// Release 467 Build 86 — current environment I.T. Operations & Self-Diagnostics API.
// Read-only by design: no provider calls, no D1/R2 writes, no schema repair, no deploy/restore execution.
import { getAdminUserFromRequest, getDb, jsonResponse } from '../_lib/adminAudit.js';
import { deriveItOperationsSelfDiagnostics } from '../_lib/itOperationsSelfDiagnostics.js';
import { encryptionKeyConfigured, oauthAcceptanceProvider } from '../_lib/oauthSecurity.js';

const EXPECTED_MODULE_KEYS = Object.freeze(['storefront','creators','socials','financials','it-platform']);
const MIGRATIONS = Object.freeze([
  '0001_release464_migration_authority.sql',
  '0002_release464_operational_acceptance.sql',
  '0003_release464_business_growth.sql',
  '0004_release465_storefront_quality.sql'
]);
const rows = (result) => Array.isArray(result?.results) ? result.results : [];
const text = (value) => String(value == null ? '' : value).trim();
const integer = (value) => Number.isFinite(Number(value)) ? Math.trunc(Number(value)) : 0;
const configured = (value) => typeof value === 'string' && value.trim().length > 0;
const json = (data,status=200) => jsonResponse({release:467,build:86,...data},status,{'Cache-Control':'no-store'});

async function first(db,sql,bind=[]){try{return await db.prepare(sql).bind(...bind).first();}catch{return null;}}
async function all(db,sql,bind=[]){try{return rows(await db.prepare(sql).bind(...bind).all());}catch{return [];}}
function manages(row){return Number(row?.is_allowed||0)===1 && text(row?.access_level).toLowerCase()==='manage';}
function runtimeSha(env){for(const candidate of [env?.CF_PAGES_COMMIT_SHA,env?.COMMIT_SHA,env?.GITHUB_SHA]){const value=text(candidate);if(/^[0-9a-f]{40}$/i.test(value))return value;}return '';}

async function schemaSnapshot(db){
  const facts = await first(db,`SELECT
    (SELECT COUNT(*) FROM d1_migrations WHERE name IN (${MIGRATIONS.map(()=>'?').join(',')})) native_rows,
    (SELECT COUNT(*) FROM app_schema_migration_proofs WHERE migration_name IN (${MIGRATIONS.map(()=>'?').join(',')})) proof_rows,
    (SELECT COUNT(*) FROM app_modules) app_modules,
    (SELECT COUNT(*) FROM app_modules WHERE is_enabled=1) enabled_modules`,[...MIGRATIONS,...MIGRATIONS]);
  const fk = (await all(db,'PRAGMA foreign_key_check')).length;
  return {expected_migrations:MIGRATIONS.length,native_rows:integer(facts?.native_rows),proof_rows:integer(facts?.proof_rows),app_modules:integer(facts?.app_modules),enabled_modules:integer(facts?.enabled_modules),foreign_key_violations:fk};
}

async function incidentSnapshot(db){
  const row = await first(db,`SELECT COUNT(*) total,
    SUM(CASE WHEN lower(COALESCE(review_status,'open'))='open' THEN 1 ELSE 0 END) open_count,
    SUM(CASE WHEN lower(COALESCE(review_status,'open'))='open' AND lower(COALESCE(severity,''))='critical' THEN 1 ELSE 0 END) open_critical,
    SUM(CASE WHEN lower(COALESCE(review_status,'open'))='open' AND lower(COALESCE(severity,''))='error' THEN 1 ELSE 0 END) open_error
    FROM runtime_incidents`);
  return {database_reachable:true,total:integer(row?.total),open_count:integer(row?.open_count),open_critical:integer(row?.open_critical),open_error:integer(row?.open_error)};
}

async function rootAuthoritySnapshot(db){
  const root = await first(db,`SELECT user_id FROM users WHERE is_active=1 AND lower(trim(role))='admin' ORDER BY user_id ASC LIMIT 1`);
  const rootId = integer(root?.user_id);
  const modules = await all(db,'SELECT module_key,is_enabled FROM app_modules ORDER BY module_key');
  const roleRows = await all(db,`SELECT module_key,is_allowed,access_level FROM app_module_role_access WHERE lower(trim(role_code))='admin'`);
  const explicitRows = rootId ? await all(db,`SELECT module_key,is_allowed,access_level FROM app_module_user_access WHERE user_id=?`,[rootId]) : [];
  const moduleMap = new Map(modules.map((row)=>[text(row.module_key).toLowerCase(),row]));
  const roleMap = new Map(roleRows.map((row)=>[text(row.module_key).toLowerCase(),row]));
  const explicitMap = new Map(explicitRows.map((row)=>[text(row.module_key).toLowerCase(),row]));
  const missing=[];
  for(const key of EXPECTED_MODULE_KEYS){
    if(Number(moduleMap.get(key)?.is_enabled||0)!==1){missing.push(key);continue;}
    const explicit=explicitMap.get(key);
    if(explicit){if(!manages(explicit))missing.push(key);continue;}
    if(key==='it-platform'||!manages(roleMap.get(key)))missing.push(key);
  }
  const itRow=explicitMap.get('it-platform');
  const enabled=EXPECTED_MODULE_KEYS.filter((key)=>Number(moduleMap.get(key)?.is_enabled||0)===1).length;
  return {root_admin:Boolean(rootId)&&missing.length===0,root_admin_user_id:rootId||null,total_modules:EXPECTED_MODULE_KEYS.length,enabled_modules:enabled,it_user_allowed:Number(itRow?.is_allowed||0)===1,it_access_level:text(itRow?.access_level).toLowerCase()||'none',missing_manage_modules:missing};
}

async function recoverySnapshot(db){
  const row = await first(db,`SELECT item_status,evidence_url,evidence_notes,completed_at FROM startup_readiness_items WHERE item_key='backup_migrate_deploy' AND is_active=1 LIMIT 1`);
  const status=text(row?.item_status).toLowerCase()||'not_started';
  return {guide_available:true,backup_migrate_deploy_status:status,recovery_point_evidence_present:Boolean(text(row?.evidence_url)||text(row?.evidence_notes)),isolated_restore_rehearsed:false,completed_at:row?.completed_at||null};
}

export async function onRequestGet({request,env}){
  const admin=await getAdminUserFromRequest(request,env);
  if(!admin)return json({ok:false,error:'Administrator authorization required.'},401);
  const db=getDb(env);
  if(!db)return json({ok:false,error:'Database binding is not configured.',diagnostics:deriveItOperationsSelfDiagnostics({bindings:{d1:false,product_r2:Boolean(env?.PRODUCT_MEDIA_BUCKET),caip_r2:Boolean(env?.CAIP_PRIVATE_MEDIA_BUCKET)},runtime:{database_reachable:false}})},503);
  try{
    const [schema,runtime,moduleAuthority,recovery]=await Promise.all([schemaSnapshot(db),incidentSnapshot(db),rootAuthoritySnapshot(db),recoverySnapshot(db)]);
    const environment=text(env?.DND_ENVIRONMENT).toLowerCase()==='production'?'production':'development';
    const expectedBranch=environment==='production'?'main':'dev';
    const observedBranch=text(env?.CF_PAGES_BRANCH);
    const sha=runtimeSha(env);
    const selectedSocial=oauthAcceptanceProvider(env);
    const oauthMode=text(env?.OAUTH_PROVIDER_AUTHORIZATION_MODE).toLowerCase();
    const observations={
      environment,
      deployment:{pages_project:'devilndove-site',branch:observedBranch,expected_branch:expectedBranch,sha,pages_url:text(env?.CF_PAGES_URL)},
      bindings:{d1:Boolean(env?.DB||env?.DD_DB),product_r2:Boolean(env?.PRODUCT_MEDIA_BUCKET||env?.MEDIA_BUCKET||env?.R2_PRODUCT_MEDIA),caip_r2:Boolean(env?.CAIP_PRIVATE_MEDIA_BUCKET||env?.CAIP_MEDIA_BUCKET)},
      schema,
      runtime,
      module_authority:moduleAuthority,
      providers:{
        stripe:{configured:configured(env?.STRIPE_PUBLISHABLE_KEY)&&configured(env?.STRIPE_SECRET_KEY),webhook_configured:configured(env?.STRIPE_WEBHOOK_SECRET)||configured(env?.STRIPE_WEBHOOK_SIGNING_SECRET),acceptance_state:'HOLD_EXTERNAL'},
        paypal:{configured:configured(env?.PAYPAL_CLIENT_ID)&&configured(env?.PAYPAL_SECRET),webhook_configured:configured(env?.PAYPAL_WEBHOOK_ID),acceptance_state:'HOLD_EXTERNAL'},
        social_oauth:{encryption_configured:encryptionKeyConfigured(env),selected_provider:selectedSocial,authorization_mode:oauthMode==='development-explicit'?'development-explicit':'closed',acceptance_state:'HOLD_EXTERNAL',production_authorization_open:false,provider_publication:false}
      },
      release_gates:{runtime_cannot_attest:true,system_gate:false,quality:false,it_runtime:false,hygiene:false,preview:false,exact_sha:sha},
      backup_recovery:recovery
    };
    const diagnostics=deriveItOperationsSelfDiagnostics(observations);
    const expectedResources=environment==='production'
      ? {branch:'main',d1:'devilndove-prod-r462',product_r2:'devilndove-toolshed-images',caip_r2:'devilndove-caip-media'}
      : {branch:'dev',d1:'devilndove-dev',product_r2:'devilndove-toolshed-images-dev',caip_r2:'devilndove-caip-media-dev'};
    return json({ok:true,authority:'release467-build86-it-operations-self-diagnostics',environment,observations:{...observations,expected_resources:expectedResources},diagnostics,
      corrective_links:{deployment:'/admin/deployment-preflight/',bindings:'/admin/deployment-preflight/',schema:'/admin/schema-drift/',runtime:'/admin/runtime-incidents/',module_authority:'/admin/application-modules/',providers:'/admin/it-integrations/',release_gates:'/admin/release-control/',backup_recovery:'/admin/operational-continuity/'},
      safety:{read_only:true,secret_values_emitted:false,provider_contacted:false,automatic_repair:false,request_time_schema_mutation:false,d1_mutation:false,r2_mutation:false,deployment_execution:false,restore_execution:false,production_business_data_overwrite:false},generated_at:new Date().toISOString()});
  }catch(error){return json({ok:false,error:error?.message||'I.T. self-diagnostics could not load.',safety:{read_only:true,secret_values_emitted:false,provider_contacted:false,automatic_repair:false}},503);}
}
