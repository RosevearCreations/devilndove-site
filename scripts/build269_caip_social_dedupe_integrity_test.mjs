import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { createUploadSession, completeUploadFile, listCaipMediaIntake } from '../functions/api/_lib/caipMediaIntake.js';

const root=path.resolve(path.dirname(new URL(import.meta.url).pathname),'..');
const read=(p)=>fs.readFileSync(path.join(root,p),'utf8');
class D1Statement{constructor(stmt){this.stmt=stmt;this.args=[];}bind(...args){this.args=args;return this;}async run(){const r=this.stmt.run(...this.args);return{success:true,meta:{changes:Number(r.changes),last_row_id:Number(r.lastInsertRowid||0)}};}async first(){return this.stmt.get(...this.args)||null;}async all(){return{success:true,results:this.stmt.all(...this.args)}}}
class D1Db{constructor(db){this.db=db;}prepare(sql){return new D1Statement(this.db.prepare(sql));}async batch(statements){const out=[];this.db.exec('BEGIN');try{for(const stmt of statements)out.push(await stmt.run());this.db.exec('COMMIT');return out;}catch(e){this.db.exec('ROLLBACK');throw e;}}}
class FakeBucket{
  constructor(){this.objects=new Map();this.completeCount=0;this.uploads=new Map();}
  async head(key){return this.objects.get(key)||null;}
  async put(){}
  async createMultipartUpload(key){const uploadId=`up-${this.uploads.size+1}`;this.uploads.set(uploadId,key);return{uploadId};}
  resumeMultipartUpload(key,uploadId){return{uploadPart:async(partNumber)=>({partNumber,etag:`e-${partNumber}`}),complete:async(parts)=>{this.completeCount+=1;const existing=this.objects.get(key);if(!existing)throw new Error('test must pre-seed completed HEAD');return{etag:`etag-${parts.length}`};},abort:async()=>{}};}
}

const base=new DatabaseSync(':memory:');
base.exec(read('database_full_schema.sql'));
base.exec("INSERT INTO users(email,password_hash,display_name,role) VALUES('b269@example.invalid','x','Build 269','admin')");
base.exec("INSERT INTO creative_work_projects(project_key,project_title,project_type,project_status,summary,objective,story_angle,created_by) VALUES('social-269','Standalone social footage','content_only','active','Social-only project','Create a workshop social story','Process footage',1)");
const workId=Number(base.prepare("SELECT creative_work_project_id FROM creative_work_projects WHERE project_key='social-269'").get().creative_work_project_id);
base.prepare("INSERT INTO creative_projects(creative_project_key,source_type,source_id,project_title,project_status,governance_status,lifecycle_stage,created_by_user_id) VALUES('cp269','creative_work_project',?,'Standalone social footage','active','needs_review','intake',1)").run(String(workId));
const projectId=Number(base.prepare("SELECT creative_project_id FROM creative_projects WHERE creative_project_key='cp269'").get().creative_project_id);
const db=new D1Db(base);const bucket=new FakeBucket();const env={CAIP_PRIVATE_MEDIA_BUCKET:bucket};
const size=96*1024*1024;
const strong='a'.repeat(64);
const first=await createUploadSession(db,env,projectId,[{client_key:'c1',name:'clip-original.mov',type:'video/quicktime',size,lastModified:100,content_fingerprint:strong,content_fingerprint_version:'sample_sha256_v1'}],1,{media_role:'process'});
assert.equal(first.files.length,1);const fileId=Number(first.files[0].caip_media_upload_file_id);
assert.equal(base.prepare('SELECT COUNT(*) n FROM caip_media_upload_parts WHERE caip_media_upload_file_id=?').get(fileId).n,3,'Part plan must contain all expected rows.');
// Renaming the local file must still match the strong content fingerprint and reuse the same active row.
const second=await createUploadSession(db,env,projectId,[{client_key:'c2',name:'renamed-copy.mov',type:'video/quicktime',size,lastModified:200,content_fingerprint:strong,content_fingerprint_version:'sample_sha256_v1'}],1,{media_role:'process'});
assert.equal(Number(second.files[0].caip_media_upload_file_id),fileId);
assert.equal(second.possible_duplicates[0].duplicate_action,'resume_existing');
assert.equal(base.prepare('SELECT COUNT(*) n FROM caip_media_upload_files').get().n,1,'Strong duplicate preflight must not create a second upload row.');

// Simulate the historical bug: only two of three parts are uploaded. R2 complete must never be called.
base.prepare("UPDATE caip_media_upload_files SET r2_upload_id='up-bad',upload_status='uploading' WHERE caip_media_upload_file_id=?").run(fileId);
base.prepare("UPDATE caip_media_upload_parts SET part_status='uploaded',etag='e-'||part_number WHERE caip_media_upload_file_id=? AND part_number<=2").run(fileId);
let blocked=false;try{await completeUploadFile(db,env,fileId,1);}catch(e){blocked=String(e.message).includes('CAIP_MULTIPART_INCOMPLETE');}
assert.equal(blocked,true,'Incomplete multipart completion must be blocked.');
assert.equal(bucket.completeCount,0,'R2 complete must not be called for an incomplete part plan.');
const failed=base.prepare('SELECT upload_status,uploaded_parts,uploaded_bytes,last_error FROM caip_media_upload_files WHERE caip_media_upload_file_id=?').get(fileId);
assert.equal(failed.upload_status,'failed');assert.equal(failed.uploaded_parts,2);assert(String(failed.last_error).includes('CAIP_MULTIPART_INCOMPLETE'));

// Selecting the source again after an integrity failure creates a clean lineage-preserving recovery row, not a stale resume.
const recovery=await createUploadSession(db,env,projectId,[{client_key:'c3',name:'clip-original.mov',type:'video/quicktime',size,lastModified:100,content_fingerprint:strong,content_fingerprint_version:'sample_sha256_v1'}],1,{media_role:'process'});
const recoveryId=Number(recovery.files[0].caip_media_upload_file_id);
assert.notEqual(recoveryId,fileId);assert.equal(recovery.possible_duplicates[0].duplicate_action,'reupload_recovery');
assert.equal(Number(base.prepare('SELECT recovery_of_file_id FROM caip_media_upload_files WHERE caip_media_upload_file_id=?').get(recoveryId).recovery_of_file_id),fileId);
assert.equal(base.prepare('SELECT content_fingerprint FROM caip_media_upload_files WHERE caip_media_upload_file_id=?').get(recoveryId).content_fingerprint,strong);

// A complete 3-part recovery may finalize and then register only after R2 HEAD size verification.
base.prepare("UPDATE caip_media_upload_files SET r2_upload_id='up-good',upload_status='uploading' WHERE caip_media_upload_file_id=?").run(recoveryId);
base.prepare("UPDATE caip_media_upload_parts SET part_status='uploaded',etag='g-'||part_number WHERE caip_media_upload_file_id=?").run(recoveryId);
const objectKey=base.prepare('SELECT object_key FROM caip_media_upload_files WHERE caip_media_upload_file_id=?').get(recoveryId).object_key;
bucket.objects.set(objectKey,{size,etag:'good-head',httpMetadata:{contentType:'video/quicktime'}});
const completed=await completeUploadFile(db,env,recoveryId,1);
assert.equal(bucket.completeCount,1);assert.equal(completed.verified_private_object,true);assert(Number(completed.file.creative_asset_id)>0);
const canonical=base.prepare('SELECT upload_status,uploaded_parts,uploaded_bytes,content_fingerprint,recovery_of_file_id FROM caip_media_upload_files WHERE caip_media_upload_file_id=?').get(recoveryId);
assert.deepEqual([canonical.upload_status,canonical.uploaded_parts,canonical.uploaded_bytes,canonical.content_fingerprint,canonical.recovery_of_file_id],['uploaded',3,size,strong,fileId]);

const intake=await listCaipMediaIntake(db,projectId,env);
assert(intake.stage_summary?.work_project,'Productless/social CAIP project should expose its Creative Process context.');
assert.equal(intake.stage_summary.work_project.project_type,'content_only');
assert(String(intake.stage_summary.recommended_next).length>0);
assert.equal(intake.stage_summary.counts.active_uploads,0,'Historical superseded attempts must not keep the social-project stage falsely active.');
assert.equal(intake.stage_summary.counts.failed_uploads,0,'A successful canonical recovery must hide its superseded failed lineage from stage readiness.');

// Two identical binaries selected in one browser batch must create only one physical upload plan/session total.
const batchStrong='b'.repeat(64);
const sameBatch=await createUploadSession(db,env,projectId,[
  {client_key:'batch-a',name:'same-binary-a.mov',type:'video/quicktime',size,lastModified:300,content_fingerprint:batchStrong,content_fingerprint_version:'sample_sha256_v1'},
  {client_key:'batch-b',name:'same-binary-b.mov',type:'video/quicktime',size,lastModified:301,content_fingerprint:batchStrong,content_fingerprint_version:'sample_sha256_v1'}
],1,{media_role:'process'});
assert.equal(sameBatch.files.length,2,'Both local selections should receive an intake decision.');
assert.equal(Number(sameBatch.files[0].caip_media_upload_file_id),Number(sameBatch.files[1].caip_media_upload_file_id),'Same-batch duplicate content must reuse the first physical upload row.');
assert.equal(sameBatch.reused_existing_count,1);
const batchSession=base.prepare('SELECT total_files,total_bytes FROM caip_media_upload_sessions WHERE caip_media_upload_session_id=?').get(Number(sameBatch.session.caip_media_upload_session_id));
assert.deepEqual([batchSession.total_files,batchSession.total_bytes],[1,size],'Same-batch duplicate selections must not inflate physical session totals.');

const client=read('public/js/admin-caip-media-intake.js');
assert(client.includes('sample_sha256_v1'));assert(client.includes('content_fingerprint'));assert(client.includes('Re-upload source safely'));assert(client.includes('Strengthen'));assert(client.includes("duplicateAction==='registration_only'"));assert(client.includes("action:'retry_registration'"));
const helper=read('functions/api/_lib/caipMediaIntake.js');
assert(helper.includes('parts.length===expectedParts'));assert(helper.includes('Completion blocked before R2 finalize'));
assert(/admin-caip-media-intake\.js\?v=(?:269|27[0-2])/.test(read('admin/creative-assets/index.html')));
assert(read('database_build269_caip_social_project_dedupe_integrity.sql').includes('content_fingerprint'));
console.log('Build 269 CAIP social-project dedupe + multipart integrity checks: PASS');
