/* Build 609 — fold historical automatic CI into one mandatory current-quality step.
 * All original workflows remain manually dispatchable. No provider or D1 actions.
 */
import assert from 'node:assert/strict';
import {readFileSync, existsSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import path from 'node:path';

const root=fileURLToPath(new URL('../',import.meta.url));
const file=p=>path.join(root,p);
const read=p=>readFileSync(file(p),'utf8');
const legacy=[
 ...Array.from({length:19},(_,i)=>{
   const n=407+i;
   const suffix={
     407:'listing-sync',408:'operator',409:'etsy-trial',
     410:'draft-recovery',411:'evidence-governance',
     412:'work-queue',413:'followup',414:'completion',
     415:'closure',416:'closure-packet',417:'approval',
     418:'history',419:'reopen-decision',420:'continuity',
     421:'exception-followup',422:'ack',423:'handoff-governance',
     424:'acceptance',425:'owner-acceptance'}[n];
   return 'release467-build'+n+'-'+suffix+'.yml';
 }),
 'dd-brand-v3-autowire.yml','dd-signature-design-v1.yml',
 'release467-build436-admin-media.yml','release467-build436-etsy-gallery.yml'
];
const events=p=>{
 const lines=read('.github/workflows/'+p).split('\n');
 const start=lines.findIndex(x=>/^on:\s*$/.test(x));
 assert.ok(start>=0,'workflow event stanza missing: '+p);
 const found=[];
 for(let i=start+1;i<lines.length;i++){
   const line=lines[i];
   if(line.trim()&& !/^\s/.test(line))break;
   const m=/^  ([\w-]+):/.exec(line);
   if(m)found.push(m[1]);
 }
 return found;
};
for(const p of legacy)
 assert.deepEqual(events(p),['workflow_dispatch'],'historical workflow must be manual-only: '+p);
for(const [p,expected] of [
 ['system-gate.yml','push'],
 ['current-application-quality.yml','push'],
 ['it-admin-runtime-proof.yml','push'],
 ['repository-branch-hygiene.yml','push'],
 ['production-pages-deploy-current.yml','push'],
 ['production-live-resource-integrity-proof.yml','workflow_run']])
 assert.ok(events(p).includes(expected),'required independent release trigger missing: '+p);
assert.match(read('.github/workflows/current-application-quality.yml'),
 /node scripts\/release467_build609_ci_bundle\.mjs/);
assert.match(read('.github/workflows/production-pages-deploy-current.yml'),/"build":6\d{2}/);

const testPaths=[
 'scripts/release467_build399_etsy_draft.test.mjs',
 'scripts/release467_build406_distribution.test.mjs',
 'scripts/release467_build407_listing_sync.test.mjs',
 'scripts/release467_build408_listing_operator.test.mjs',
 'scripts/release467_build409_etsy_trial.test.mjs',
 'scripts/release467_build410_draft_recovery.test.mjs',
 'scripts/release467_build411_evidence_governance.test.mjs',
 'scripts/release467_build412_work_queue.test.mjs',
 'scripts/release467_build413_followup.test.mjs',
 'scripts/release467_build414_completion.test.mjs',
 'scripts/release467_build415_closure.test.mjs',
 'scripts/release467_build416_closure_packet.test.mjs',
 'scripts/release467_build417_approval.test.mjs',
 'scripts/release467_build418_history.test.mjs',
 'scripts/release467_build419_reopen_decision.test.mjs',
 'scripts/release467_build420_continuity.test.mjs',
 'scripts/release467_build421_exception_followup.test.mjs',
 'scripts/release467_build422_ack.test.mjs',
 'scripts/release467_build423_handoff_governance.test.mjs',
 'scripts/release467_build424_acceptance.test.mjs',
 'scripts/release467_build425_owner_acceptance.test.mjs',
 'scripts/brand_v3_autowire_50.test.mjs',
 'scripts/signature_design_v1.test.mjs',
 'scripts/brand_palette_v3.test.mjs',
 'scripts/release467_build436_admin_artwork_audit.mjs',
 'scripts/release467_build436_media_runtime.test.mjs',
 'scripts/release467_build436_channel_gallery_regression.mjs'
];
for(const p of testPaths)assert.ok(existsSync(file(p)),'required historical test missing: '+p);
const checkPaths=[
 'public/js/brand-v3-auto.js','public/js/media-content-runtime.js',
 'functions/api/_lib/canonicalDistributionGallery436.mjs',
 'functions/api/admin/product-distribution-406.js',
 'functions/api/admin/listing-sync-408.js'
];
for(const p of checkPaths){
 const result=spawnSync(process.execPath,['--check',p],
  {cwd:root,encoding:'utf8',timeout:30000});
 if(result.status!==0)throw Error('Historical source syntax failed: '+p+'\n'+result.stderr);
}
console.log('Build 609 CI fan-out: '+legacy.length+' historical workflows are manual-only; four protected development checks, production deployment and independent live integrity preserved.');
if(process.argv.includes('--audit-only')){
 console.log('Build 609 audit-only PASS; '+testPaths.length+' tests retained for mandatory bundled CI.');
 process.exit(0);
}
const result=spawnSync(process.execPath,
 ['--test','--test-concurrency=2',...testPaths],
 {cwd:root,encoding:'utf8',timeout:240000,maxBuffer:20*1024*1024});
process.stdout.write(result.stdout||'');
process.stderr.write(result.stderr||'');
if(result.error||result.status!==0)
 throw Error('Build 609 historical test bundle failed: '+(result.error?.message||result.status));
console.log('Build 609 legacy proof bundle GREEN: '+testPaths.length+' test files in one required Current Application Quality workflow.');
