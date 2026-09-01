// Release 466 Build 1 — read-only governance/recovery/reliability intelligence.
// Runtime business authorities remain owned by their existing modules; this helper derives a snapshot only.
import { loadItHealth, RELEASE465_EXPECTED_MIGRATIONS } from './release465BusinessHealth.js';

const n=(v)=>Number.isFinite(Number(v))?Number(v):0;
const i=(v)=>Math.trunc(n(v));

export const RELEASE466_BUILD1 = 1;
export const RELEASE466_EXPECTED_MIGRATIONS = RELEASE465_EXPECTED_MIGRATIONS;

export async function loadRelease466Reliability(db,env={}){
  const base=await loadItHealth(db,env);
  const environment=String(env.DND_ENVIRONMENT||'development').toLowerCase()==='production'?'production':'development';
  const incidents=base.runtime_incidents||{};
  const resources=base.resources||{};
  const migrations=base.migrations||{};
  const checks=[
    {key:'canonical_migrations',weight:20,pass:i(migrations.native_rows)===RELEASE466_EXPECTED_MIGRATIONS,label:'Canonical migrations are complete'},
    {key:'migration_proofs',weight:10,pass:i(migrations.proof_rows)>=RELEASE466_EXPECTED_MIGRATIONS,label:'Migration proof ledger is complete'},
    {key:'publication_triggers',weight:10,pass:i(migrations.release465_triggers)===4,label:'Release 465 publication guards remain installed'},
    {key:'five_modules',weight:10,pass:i(migrations.app_modules)===5,label:'Five-module platform authority is intact'},
    {key:'foreign_keys',weight:15,pass:i(base.foreign_key_violations)===0,label:'Foreign-key integrity is clean'},
    {key:'d1_binding',weight:10,pass:resources.d1===true,label:'D1 binding is present'},
    {key:'product_r2_binding',weight:5,pass:resources.product_r2===true,label:'Product R2 binding is present'},
    {key:'caip_r2_binding',weight:5,pass:resources.caip_r2===true,label:'CAIP R2 binding is present'},
    {key:'no_open_critical_incidents',weight:10,pass:i(incidents.open_critical)===0,label:'No open critical runtime incidents'},
    {key:'no_open_error_incidents',weight:5,pass:i(incidents.open_error)===0,label:'No open error runtime incidents'}
  ];
  const score=checks.reduce((sum,x)=>sum+(x.pass?x.weight:0),0);
  const status=score>=95?'green':score>=80?'amber':'red';
  return{
    release:466,
    build:1,
    environment,
    score,
    status,
    scope:'current_snapshot_not_historical_uptime',
    slo_targets:{critical_platform_checks_percent:100,open_critical_runtime_incidents:0,open_error_runtime_incidents:0,foreign_key_violations:0,canonical_migration_proof_percent:100},
    checks,
    migrations:{expected:RELEASE466_EXPECTED_MIGRATIONS,native_rows:i(migrations.native_rows),proof_rows:i(migrations.proof_rows),release465_triggers:i(migrations.release465_triggers)},
    runtime_incidents:{open_count:i(incidents.open_count),open_critical:i(incidents.open_critical),open_error:i(incidents.open_error)},
    foreign_key_violations:i(base.foreign_key_violations),
    resources,
    governance:{native_github_ruleset:'external_repository_setting_pending',required_status_context:'source-gate',force_push_policy:'forbidden',branch_delete_policy:'forbidden',exact_green_development_tree_only_for_main:true},
    recovery:{rollback_planner:true,rollback_schema_reversal:false,automatic_business_data_restore:false,development_export_restore_rehearsal:true,raw_database_dump_retained:false},
    drift:{development_production_structural_check:true,production_contact:'read_only_schema_metadata',business_rows_compared:false},
    safety:{mutation_capability:'none',provider_execution:false,provider_publication:false,production_mutation:false,accounting_posting:false,inventory_mutation:false,raw_r2_delete:false,secrets_exposed:false}
  };
}
