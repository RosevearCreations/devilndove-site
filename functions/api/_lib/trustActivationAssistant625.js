/* Build 625: source-defined D1 table readback and evidence-only operator guidance.
 * This module has no migration, credential, provider or write capability. */
export const HOLD_625='HOLD_ORIGINAL_META_MIGRATIONS_AUTHORITY_AND_LIVE_WITNESS';

export const ORIGINAL_TABLES_625=Object.freeze([
  ['0052',['dd614_authorities','dd614_owner_decisions']],
  ['0053',['dd615_custody_readbacks','dd615_activation_ceremonies']],
  ['0054',['dd616_key_quarantines','dd616_checkpoint_receipts','dd616_rotation_candidates']],
  ['0055',['dd617_anchor_custodians','dd617_external_readbacks',
    'dd617_quarantine_recovery_packets','dd617_witnessed_test_preflights']],
  ['0056',['dd618_original_source_registrations','dd618_original_issuer_attestations',
    'dd618_backup_witness_packets','dd618_original_custody_decisions',
    'dd618_backup_restore_verifications','dd618_original_test_grants',
    'dd618_provider_test_attempts','dd618_provider_test_outcomes',
    'dd618_provider_test_acceptances']],
  ['0057',['dd619_etsy_failure_custody','dd619_etsy_failure_dispositions']],
  ['0058',['dd620_meta_original_source_registrations','dd620_meta_read_grants',
    'dd620_meta_test_attempts','dd620_meta_test_outcomes','dd620_meta_test_failures']],
  ['0059',['dd621_etsy_history_checkpoints','dd621_meta_get_witness_acceptances']],
  ['0060',['dd622_archive_attempts','dd622_archive_readbacks',
    'dd622_archive_failures','dd622_meta_test_closures']],
  ['0061',['dd623_original_meta_completions','dd623_archive_continuity_witnesses',
    'dd623_meta_readonly_windows']],
  ['0062',['dd624_meta_credential_enrollments','dd624_meta_one_use_grants',
    'dd624_meta_live_attempts','dd624_meta_live_outcomes',
    'dd624_meta_live_failures','dd624_meta_witness_acceptances']]
]);

export const RECEIPT_TABLES_625=Object.freeze([
  'dd614_authorities','dd614_owner_decisions','dd616_key_quarantines',
  'dd620_meta_original_source_registrations','dd620_meta_read_grants',
  'dd621_etsy_history_checkpoints','dd622_archive_readbacks',
  'dd622_meta_test_closures','dd623_original_meta_completions',
  'dd623_archive_continuity_witnesses','dd623_meta_readonly_windows',
  'dd624_meta_credential_enrollments','dd624_meta_one_use_grants',
  'dd624_meta_live_attempts','dd624_meta_live_outcomes',
  'dd624_meta_live_failures','dd624_meta_witness_acceptances'
]);

export async function schemaReadback625(db){
  const rows=await db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
  const present=new Set((rows.results||[]).map(r=>r.name));
  const migration_tables=ORIGINAL_TABLES_625.map(([migration,tables])=>({
    migration,source:'PROPOSED_ORIGINAL_OWNER_MIGRATION',
    present:tables.filter(t=>present.has(t)),
    missing:tables.filter(t=>!present.has(t)),
    schema_present:tables.every(t=>present.has(t))
  }));
  const receipt_counts={};
  for(const table of RECEIPT_TABLES_625){
    if(present.has(table)){
      // Only code-owned, static, known table names are interpolated.
      const count=await db.prepare(`SELECT COUNT(*) AS n FROM ${table}`).first();
      receipt_counts[table]=Number(count?.n||0);
    }else receipt_counts[table]=null;
  }
  return {migration_tables,receipt_counts,
    all_source_tables_present:migration_tables.every(g=>g.schema_present),
    provenance_certified:false,
    explanation:'SQLite table presence proves schema visibility only. It does not prove which migration operator ran the source DDL, original custody, or independent approval.'};
}

export function deriveAssistance625({schema,originalWindow=false,liveWitness=false,
  credentialPresent=false,credentialUnexpired=false,providerCandidate=false}){
  const count=name=>Number(schema?.receipt_counts?.[name]||0);
  const checks=[
    {id:'original_database',complete:!!schema?.all_source_tables_present,
      next:'Original owner: review source migrations 0052–0062, backup and independent approval; apply via the controlled D1 migration process, then refresh table readback.'},
    {id:'original_authorities',complete:count('dd614_authorities')>=3&&
        count('dd614_owner_decisions')>0&&count('dd616_key_quarantines')===0,
      next:'Independently authenticate and enroll three distinct original ISSUER / WITNESS / OWNER public keys, verify quarantine and the owner ledger in Admin sections 35–43.'},
    {id:'genuine_external_archive',complete:count('dd621_etsy_history_checkpoints')>0&&
        count('dd622_archive_readbacks')>=2&&count('dd623_archive_continuity_witnesses')>0,
      next:'Obtain two distinct real external archive readbacks, independently signed history custody and continuity in Admin sections 42–44.'},
    {id:'original_meta_window',complete:originalWindow===true,
      next:'In section 44 record original signed Meta completion, two-archive continuity and a fresh ten-minute signed Page-ID window. Expired/revoked windows require fresh approval.'},
    {id:'saved_meta_credential',complete:credentialPresent===true&&
        credentialUnexpired===true&&providerCandidate===true,
      next:'On the original deployment inspect the SAVED encrypted Meta credential, its unexpired access, exact Page ID and read-only scopes. Do not paste or refresh tokens in this assistant.'},
    {id:'original_enrollment',complete:count('dd624_meta_credential_enrollments')>0,
      next:'Section 45: have the three original roles sign ENROLL_624 for the existing encrypted credential fingerprint, then submit with admin step-up.'},
    {id:'one_use_get',complete:count('dd624_meta_live_outcomes')>0&&
        count('dd624_meta_live_attempts')>0,
      next:'Section 45: obtain one original signed RECHECK_624 authorization. Execute one explicit Page-ID GET. Every nonce is spent before the network request; never retry a failed nonce.'},
    {id:'independent_witness',complete:liveWitness===true,
      next:'Section 45: independently sign ACCEPT_624 against the actual saved receipt. Only the live original-chain verifier can mark this check complete.'}
  ];
  const first=checks.find(c=>!c.complete);
  return {release_gate:HOLD_625,software_deployment_is_provider_proof:false,
    first_action:first?.next||'All supervised evidence checks passed; review source receipts independently. A read-only TEST is not a connected or publishing channel.',
    source_proof_verified:originalWindow===true&&liveWitness===true&&
      checks.every(check=>check.complete),
    actual_readonly_meta_test_witnessed:liveWitness===true,
    connected:false,publishing_enabled:false,provider_write:false,
    auto_migration:false,automatic_provider_get:false,automatic_token_refresh:false,
    checks};
}
