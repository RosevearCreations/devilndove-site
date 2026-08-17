import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import {
  choosePartSize, createUploadSession, initiateUploadFile, recordUploadedPart, completeUploadFile,
  listCaipMediaIntake, updateUploadFileGovernance, requestPublicPromotion, makeCaipMediaIntakeManifest
} from '../functions/api/_lib/caipMediaIntake.js';

const root=path.resolve(path.dirname(new URL(import.meta.url).pathname),'..');
const read=(name)=>fs.readFileSync(path.join(root,name),'utf8');
const migration=read('database_build241_caip_large_media_intake.sql');
assert(/Build 264|build264_content_project_merchandising/i.test(read('database_upgrade_current_pass.sql')),'Current-pass SQL must retain the Build 264 broad migration boundary while Build 241 remains retained history.');
assert(!/^\s*(BEGIN(?:\s+TRANSACTION)?|COMMIT|SAVEPOINT|RELEASE(?:\s+SAVEPOINT)?|ROLLBACK)\b/im.test(migration),'Build 241 migration contains explicit transaction control.');
const tables=['caip_media_intake_settings','caip_media_upload_sessions','caip_media_upload_files','caip_media_upload_parts','caip_media_processing_jobs','caip_media_public_promotion_requests'];
for(const name of tables)assert(migration.includes(`CREATE TABLE IF NOT EXISTS ${name}`),`Build 241 migration is missing ${name}.`);

for(const aggregate of ['database_schema.sql','database_full_schema.sql','database_store_schema.sql']){
  const db=new DatabaseSync(':memory:');
  db.exec(read(aggregate)); db.exec(migration); db.exec(migration);
  for(const name of tables) assert.equal(db.prepare("SELECT COUNT(*) n FROM sqlite_master WHERE type='table' AND name=?").get(name).n,1,`${aggregate} missing ${name}.`);
  assert.equal(db.prepare("SELECT COUNT(*) n FROM sqlite_master WHERE type='table' AND name='media_assets'").get().n,1,`${aggregate} must include media_assets.`);
  assert.equal(db.prepare('SELECT COUNT(*) n FROM operational_workstreams WHERE is_active=1').get().n,21,`${aggregate} must contain 21 workstreams.`);
  assert.equal(db.prepare('SELECT COUNT(*) n FROM startup_readiness_items WHERE is_active=1').get().n,46,`${aggregate} must contain 46 Startup gates.`);
  assert.equal(db.prepare("SELECT COUNT(*) n FROM creative_provider_profiles WHERE provider_key LIKE 'caip_%'").get().n>=4,true,`${aggregate} must include CAIP provider profiles.`);
  assert.equal(db.prepare("SELECT COUNT(*) n FROM schema_migration_ledger WHERE migration_key='build241_caip_large_media_intake'").get().n,1,`${aggregate} must contain one Build 241 ledger row.`);
}

class D1Statement {
  constructor(stmt){this.stmt=stmt;this.args=[];}
  bind(...args){this.args=args;return this;}
  async run(){const result=this.stmt.run(...this.args);return {success:true,meta:{changes:Number(result.changes),last_row_id:Number(result.lastInsertRowid||0)}};}
  async first(){return this.stmt.get(...this.args)||null;}
  async all(){return {success:true,results:this.stmt.all(...this.args)};}
}
class D1Db {
  constructor(db){this.db=db;}
  prepare(sql){return new D1Statement(this.db.prepare(sql));}
}
class FakeMultipart {
  constructor(bucket,key,uploadId){this.bucket=bucket;this.key=key;this.uploadId=uploadId;}
  async uploadPart(partNumber){const etag=`etag-${partNumber}`;this.bucket.parts.set(`${this.uploadId}:${partNumber}`,etag);return {partNumber,etag};}
  async complete(parts){this.bucket.objects.set(this.key,{etag:'complete-etag',size:this.bucket.expectedSize,httpMetadata:{contentType:'video/mp4'},parts});return {etag:'complete-etag'};}
  async abort(){this.bucket.aborted.add(this.uploadId);}
}
class FakeBucket {
  constructor(expectedSize){this.expectedSize=expectedSize;this.parts=new Map();this.objects=new Map();this.aborted=new Set();this.uploadSeq=0;}
  async createMultipartUpload(key){const uploadId=`upload-${++this.uploadSeq}`;return {uploadId,key};}
  resumeMultipartUpload(key,uploadId){return new FakeMultipart(this,key,uploadId);}
  async head(key){return this.objects.get(key)||null;}
  async put(){}
}

const base=new DatabaseSync(':memory:');
base.exec(read('database_full_schema.sql'));
base.exec(migration);
base.exec("INSERT INTO users(email,password_hash,display_name,role) VALUES('build241@example.invalid','test-hash','Build 241 Test','admin')");
base.exec("INSERT INTO creative_projects(creative_project_key,source_type,source_id,project_title,project_status,governance_status) VALUES('cp-build241','manual','build241-test','Build 241 CAIP test','active','needs_review')");
const projectId=Number(base.prepare("SELECT creative_project_id FROM creative_projects WHERE creative_project_key='cp-build241'").get().creative_project_id);
const db=new D1Db(base);
const fileSize=100*1024*1024;
const bucket=new FakeBucket(fileSize);
const env={CAIP_PRIVATE_MEDIA_BUCKET:bucket};
const created=await createUploadSession(db,env,projectId,[{name:'Workshop Progress 01.mp4',type:'video/mp4',size:fileSize,lastModified:123456,media_role:'during'}],1,{upload_device:'test-browser',privacy_state:'private',rights_status:'needs_review'});
assert.equal(created.files.length,1,'Create session should add one file.');
assert(created.files[0].object_key.startsWith(`projects/${projectId}/raw/video/`),'Raw object key must use project ID and raw/video prefix.');
assert(!created.files[0].object_key.includes('Workshop Progress 01'),'Generated R2 key must not copy the unsanitized display filename as a folder/name authority.');
const fileId=Number(created.files[0].caip_media_upload_file_id);
const initiated=await initiateUploadFile(db,env,fileId,1);
assert(initiated.file.r2_upload_id,'Initiation must store the multipart upload ID server-side.');
const partRows=base.prepare('SELECT * FROM caip_media_upload_parts WHERE caip_media_upload_file_id=? ORDER BY part_number').all(fileId);
assert.equal(partRows.length,4,'100 MiB test video should use four 32 MiB parts.');
for(const part of partRows) await recordUploadedPart(db,fileId,Number(part.part_number),{etag:`etag-${part.part_number}`},1);
await completeUploadFile(db,env,fileId,1);
const uploaded=base.prepare('SELECT * FROM caip_media_upload_files WHERE caip_media_upload_file_id=?').get(fileId);
assert.equal(uploaded.upload_status,'uploaded');
assert.equal(uploaded.storage_provider,'r2_private_caip');
assert(uploaded.creative_asset_id,'Completed private file must create a CAIP asset.');
const privateMedia=base.prepare('SELECT * FROM media_assets WHERE object_key=?').get(uploaded.object_key);
assert(privateMedia,'Completed raw upload must create a media_assets record.');
assert.equal(privateMedia.public_url,null,'Private raw asset must not receive a public URL.');
assert.equal(base.prepare('SELECT COUNT(*) n FROM caip_media_processing_jobs WHERE caip_media_upload_file_id=?').get(fileId).n,6,'Video should create six planned processing jobs.');
await updateUploadFileGovernance(db,fileId,{privacy_state:'public_candidate',rights_status:'public_allowed',consent_state:'public_allowed'},1);
const promotion=await requestPublicPromotion(db,fileId,'youtube',1);
assert.equal(promotion.request_status,'needs_review','Public promotion must remain review-first.');
assert.equal(promotion.target_public_url,null,'Requesting promotion must not create a public URL.');
const intake=await listCaipMediaIntake(db,projectId,env);
const manifest=makeCaipMediaIntakeManifest(intake);
assert.equal(manifest.files.length,1);
assert.equal(manifest.files[0].public_url,null);
assert(!JSON.stringify(manifest).includes('r2_upload_id'),'Portable manifest must not expose the R2 multipart upload ID field.');
assert.equal(choosePartSize(5*1024**4)<=5*1024**3,true,'Part sizing must stay within R2 part maximum.');

for(const file of ['functions/api/_lib/caipMediaIntake.js','functions/api/admin/caip-media-intake.js','functions/api/admin/caip-media-upload-part.js','functions/api/_lib/creativeAssetIntelligence.js','functions/api/_lib/creativeAssetOperations.js']){
  const code=read(file); assert(!/CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?[A-Za-z_]/i.test(code),`${file} must not create schema at request time.`);
}
const page=read('admin/creative-assets/index.html');
assert.equal((page.match(/<h1\b/gi)||[]).length,1,'CAIP admin page must have exactly one H1.');
assert(page.includes('noindex,nofollow'),'CAIP admin page must remain noindex.');
assert(page.includes('caipMediaIntakeMount'),'CAIP media intake mount is missing.');
assert(read('css/styles.css').includes('Build 241: CAIP private large-media intake'),'CAIP Build 241 responsive CSS is missing.');
console.log('Build 241 CAIP private media, schema, immutability, processing-plan and promotion-boundary checks: PASS');
