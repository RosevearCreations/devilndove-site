import assert from 'node:assert/strict';
import { deriveItOperationsSelfDiagnostics, IT_DIAGNOSTIC_DOMAINS, RELEASE467_BUILD86 } from '../functions/api/_lib/itOperationsSelfDiagnostics.js';

const base = {
  environment:'development',
  deployment:{branch:'dev',sha:'a'.repeat(40),pages_project:'devilndove-site'},
  bindings:{d1:true,product_r2:true,caip_r2:true},
  schema:{expected_migrations:4,native_rows:4,proof_rows:4,foreign_key_violations:0,app_modules:5},
  runtime:{database_reachable:true,open_count:0,open_critical:0,open_error:0},
  module_authority:{enabled_modules:5,total_modules:5,it_user_allowed:true,it_access_level:'manage',root_admin:true},
  providers:{stripe:{configured:true,webhook_configured:true,acceptance_state:'HOLD_EXTERNAL'},paypal:{configured:true,webhook_configured:true,acceptance_state:'HOLD_EXTERNAL'},social_oauth:{encryption_configured:true,selected_provider:'',authorization_mode:'closed',acceptance_state:'HOLD_EXTERNAL'}},
  release_gates:{system_gate:true,quality:true,it_runtime:true,hygiene:true,preview:true,exact_sha:'a'.repeat(40)},
  backup_recovery:{guide_available:true,isolated_restore_rehearsed:false}
};

assert.equal(RELEASE467_BUILD86,86);
assert.deepEqual(IT_DIAGNOSTIC_DOMAINS,['deployment','bindings','schema','runtime','module_authority','providers','release_gates','backup_recovery']);

const green = deriveItOperationsSelfDiagnostics(base);
assert.equal(green.release,467);
assert.equal(green.build,86);
assert.equal(green.domains.length,8);
assert.equal(green.overall_status,'green');
assert.equal(green.technical_blocker_count,0);
assert.equal(green.technical_review_count,0);
assert.equal(green.domains.find(x=>x.key==='providers').status,'hold_external');
assert.equal(green.domains.find(x=>x.key==='backup_recovery').status,'review');
assert.equal(green.safety.read_only_projection,true);
assert.equal(green.safety.automatic_repair,false);
assert.equal(green.safety.d1_mutation,false);
assert.equal(green.safety.r2_mutation,false);
assert.equal(green.safety.provider_execution,false);
assert.equal(green.safety.provider_publication,false);
assert.equal(green.safety.backup_restore_execution,false);

const missingD1 = deriveItOperationsSelfDiagnostics({...base,bindings:{...base.bindings,d1:false}});
assert.equal(missingD1.overall_status,'blocked');
assert.equal(missingD1.domains.find(x=>x.key==='bindings').status,'blocked');
assert.match(missingD1.domains.find(x=>x.key==='bindings').correction.join(' '),/D1/);

const schemaDrift = deriveItOperationsSelfDiagnostics({...base,schema:{...base.schema,native_rows:3,proof_rows:3,foreign_key_violations:2,app_modules:4}});
assert.equal(schemaDrift.overall_status,'blocked');
assert.equal(schemaDrift.domains.find(x=>x.key==='schema').status,'blocked');
assert.match(schemaDrift.domains.find(x=>x.key==='schema').correction.join(' '),/canonical migration manifest/i);

const errorReview = deriveItOperationsSelfDiagnostics({...base,runtime:{database_reachable:true,open_count:2,open_critical:0,open_error:2}});
assert.equal(errorReview.overall_status,'review');
assert.equal(errorReview.domains.find(x=>x.key==='runtime').status,'review');

const criticalBlock = deriveItOperationsSelfDiagnostics({...base,runtime:{database_reachable:true,open_count:1,open_critical:1,open_error:0}});
assert.equal(criticalBlock.overall_status,'blocked');
assert.equal(criticalBlock.domains.find(x=>x.key==='runtime').status,'blocked');

const authorityDrift = deriveItOperationsSelfDiagnostics({...base,module_authority:{enabled_modules:5,total_modules:5,it_user_allowed:false,it_access_level:'view',root_admin:false}});
assert.equal(authorityDrift.overall_status,'blocked');
assert.equal(authorityDrift.domains.find(x=>x.key==='module_authority').status,'blocked');

const noCiAttestation = deriveItOperationsSelfDiagnostics({...base,release_gates:{system_gate:false,quality:false,it_runtime:false,hygiene:false,preview:false,exact_sha:'a'.repeat(40)}});
assert.equal(noCiAttestation.overall_status,'review');
assert.equal(noCiAttestation.domains.find(x=>x.key==='release_gates').status,'review');
assert.match(noCiAttestation.domains.find(x=>x.key==='release_gates').correction.join(' '),/System Gate/);

const wrongProduction = deriveItOperationsSelfDiagnostics({...base,environment:'production',deployment:{branch:'dev',sha:'a'.repeat(40),pages_project:'devilndove-site'}});
assert.equal(wrongProduction.overall_status,'blocked');
assert.equal(wrongProduction.domains.find(x=>x.key==='deployment').status,'blocked');

console.log('RELEASE 467 BUILD 86 I.T. SELF-DIAGNOSTICS RUNTIME: PASS');
console.log('Diagnostic domains: 8 / deployment -> bindings -> schema -> runtime -> module_authority -> providers -> release_gates -> backup_recovery');
console.log('External provider readiness: HOLD / does not block technical health');
console.log('Automatic repair / D1 / R2 / provider / restore execution: NONE');
