/* Build 630: read-only introspection of the *bound live* original D1 database.
 * A SQL schema fingerprint is an observation, not an owner identity signature. */
import {sha256} from './trustAuthority614.js';

export const HOLD_630='HOLD_ORIGINAL_META_D1_OR_ARCHIVES_OR_SIGNED_READINESS';
const REQUIRED_MIGRATIONS=Object.freeze([
  '0052_devilndove_build614_external_authority_hold.sql',
  '0053_devilndove_build615_custody_ceremony_hold.sql',
  '0054_devilndove_build616_external_checkpoint_revocation_hold.sql',
  '0055_devilndove_build617_anchor_readback_recovery_preflight_hold.sql',
  '0056_devilndove_build618_original_issuer_backup_etsy_test_hold.sql',
  '0057_devilndove_build619_receipt_failure_meta_preflight_hold.sql',
  '0058_devilndove_build620_meta_original_grants_and_test_hold.sql',
  '0059_devilndove_build621_etsy_history_meta_witness_hold.sql',
  '0060_devilndove_build622_external_archive_meta_closure_hold.sql',
  '0061_devilndove_build623_original_meta_activation_hold.sql',
  '0062_devilndove_build624_meta_original_enrollment_recheck_hold.sql',
  '0063_devilndove_build628_original_meta_decision_custody_hold.sql',
  '0064_devilndove_build629_original_meta_archive_readback_go_live_hold.sql'
]);
const TABLES={
  dd628_original_meta_signed_decision_custody:[
    'custody_sha256','original_decision_sha256','original_packet_sha256',
    'witness_sha256','receipt_sha256','page_id','primary_custody_ref',
    'secondary_custody_ref','signed_original_decision_json','signed_custody_json','status'],
  dd629_original_meta_archive_readbacks:[
    'readback_sha256','custody_sha256','original_packet_sha256',
    'primary_custody_ref','secondary_custody_ref','primary_sha256',
    'secondary_sha256','primary_bytes','secondary_bytes','status',
    'verified_by','verified_at'],
  dd629_original_meta_go_live_decisions:[
    'decision_sha256','custody_sha256','readback_sha256',
    'original_decision_sha256','owner_decision','expires_at',
    'signed_bundle_json','status','recorded_by','recorded_at']
};
const TRIGGERS={
  dd629_readback_no_update:['dd629_original_meta_archive_readbacks','UPDATE'],
  dd629_readback_no_delete:['dd629_original_meta_archive_readbacks','DELETE'],
  dd629_owner_decision_no_update:['dd629_original_meta_go_live_decisions','UPDATE'],
  dd629_owner_decision_no_delete:['dd629_original_meta_go_live_decisions','DELETE']
};
const safeFailure={live_migration_readback_verified:false,
  migration_history_verified:false,migration_schema_verified:false,
  original_database_identity_independently_attested:false,
  migration_auto_applied:false,release_gate:HOLD_630};

export async function readOriginalMigration630(db,{digest=sha256}={}){
  if(!db)return {...safeFailure,error:'Original bound D1 database unavailable.'};
  try{
    const result=await db.prepare(`SELECT type,name,tbl_name,sql FROM sqlite_master
      WHERE name IN (${Array(Object.keys(TABLES).length+Object.keys(TRIGGERS).length)
        .fill('?').join(',')})`).bind(
      ...Object.keys(TABLES),...Object.keys(TRIGGERS)).all();
    const rows=result.results||[];
    const objects=new Map(rows.map(r=>[r.name,r]));
    const missing=[];
    for(const [name,columns] of Object.entries(TABLES)){
      const row=objects.get(name);
      if(row?.type!=='table'||row.tbl_name!==name||!row.sql){missing.push(name);continue;}
      // Column identity is checked against the original deployed table,
      // not against a prepared SQL file or synthetic local fixture.
      const columnResult=await db.prepare(`PRAGMA table_info('${name}')`).all();
      const present=new Set((columnResult.results||[]).map(c=>c.name));
      if(columns.some(c=>!present.has(c))){missing.push(name+':columns');continue;}
      if(name==='dd629_original_meta_archive_readbacks'&&
        (!/UNIQUE\s+REFERENCES\s+dd628_original_meta_signed_decision_custody/i.test(row.sql)||
         !/CHECK\s*\(\s*secondary_bytes\s*=\s*primary_bytes\s*\)/i.test(row.sql)))
        missing.push(name+':source_integrity');
      if(name==='dd629_original_meta_go_live_decisions'&&
        (!/REFERENCES\s+dd629_original_meta_archive_readbacks/i.test(row.sql)||
         !/HOLD_ORIGINAL_META_CHANNEL_READINESS/.test(row.sql)))
        missing.push(name+':owner_integrity');
    }
    for(const [name,[table,operation]] of Object.entries(TRIGGERS)){
      const row=objects.get(name);
      if(row?.type!=='trigger'||row.tbl_name!==table||
        !new RegExp('BEFORE\\s+'+operation,'i').test(row.sql||'')||
        !/RAISE\s*\(\s*ABORT\s*,/i.test(row.sql||''))missing.push(name);
    }
    // Cloudflare Wrangler records successful migrations in d1_migrations.
    // Manual DDL or a prepared migration file is not provenance proof.
    let migrationNames=[];
    try{const ledger=await db.prepare('SELECT name FROM d1_migrations ORDER BY name LIMIT 500').all();
      migrationNames=(ledger.results||[]).map(x=>x.name).filter(x=>typeof x==='string');
    }catch{}
    const ledger=new Set(migrationNames);
    const missingHistory=REQUIRED_MIGRATIONS.filter(name=>!ledger.has(name));
    const migration_schema_verified=missing.length===0;
    const migration_history_verified=missingHistory.length===0;
    const shape=rows.filter(r=>r.sql).map(r=>({type:r.type,name:r.name,sql:r.sql}))
      .sort((a,b)=>a.name.localeCompare(b.name));
    const schema_sha256=await digest(JSON.stringify(shape));
    return {...safeFailure,migration_schema_verified,migration_history_verified,
      live_migration_readback_verified:migration_schema_verified&&migration_history_verified,
      missing_schema_objects:missing,missing_original_migration_history:missingHistory,
      schema_sha256,source:'CURRENT_BOUND_D1_SQLITE_MASTER_AND_WRANGLER_LEDGER',
      original_host_provenance_not_inferred_from_schema:true,
      original_host_verified_by_this_request:false,
      previous_source_628_required:true};
  }catch{return {...safeFailure,error:'Bound D1 original schema could not be independently read back.'};}
}
