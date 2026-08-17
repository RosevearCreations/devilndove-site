import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { retryUploadedFileRegistration, listCaipDuplicateAudit, cleanupCaipDuplicateGroup } from '../functions/api/_lib/caipMediaIntake.js';

const root=path.resolve(path.dirname(new URL(import.meta.url).pathname),'..');
const read=(p)=>fs.readFileSync(path.join(root,p),'utf8');
class D1Statement{constructor(stmt){this.stmt=stmt;this.args=[];}bind(...args){this.args=args;return this;}async run(){const r=this.stmt.run(...this.args);return{success:true,meta:{changes:Number(r.changes),last_row_id:Number(r.lastInsertRowid||0)}};}async first(){return this.stmt.get(...this.args)||null;}async all(){return{success:true,results:this.stmt.all(...this.args)}}}
class D1Db{constructor(db){this.db=db;}prepare(sql){return new D1Statement(this.db.prepare(sql));}}
class FakeBucket{constructor(){this.objects=new Map();this.deleted=[];}async head(key){return this.objects.get(key)||null;}async put(key,body,opt={}){const size=Number(body?.byteLength||body?.size||0);const obj={size,etag:`etag-${key}`,httpMetadata:{contentType:opt?.httpMetadata?.contentType||'video/mp4'}};this.objects.set(key,obj);return obj;}async delete(key){this.deleted.push(key);this.objects.delete(key);}async createMultipartUpload(key){return{uploadId:`up-${key}`};}resumeMultipartUpload(){return{uploadPart:async()=>({etag:'e'}),complete:async()=>({etag:'e'}),abort:async()=>{}};}}

const base=new DatabaseSync(':memory:');
base.exec(read('database_full_schema.sql'));
base.exec("INSERT INTO users(email,password_hash,display_name,role) VALUES('b267@example.invalid','x','Build 267','admin')");
base.exec("INSERT INTO creative_projects(creative_project_key,source_type,source_id,project_title,project_status,governance_status) VALUES('cp267','manual','267','Build 267 test','active','needs_review')");
const projectId=Number(base.prepare("SELECT creative_project_id FROM creative_projects WHERE creative_project_key='cp267'").get().creative_project_id);
base.exec(`INSERT INTO caip_media_upload_sessions(creative_project_id,session_key,session_status,storage_profile,object_prefix,transport_mode,preferred_direct_transport,part_size_bytes,parallel_parts,total_files,total_bytes,uploaded_bytes,created_at,updated_at) VALUES(${projectId},'s267','complete','private_r2','projects/${projectId}/raw','worker_streamed_multipart_v1','future',33554432,2,3,300,300,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)`);
const sessionId=Number(base.prepare("SELECT caip_media_upload_session_id FROM caip_media_upload_sessions WHERE session_key='s267'").get().caip_media_upload_session_id);
const insert=base.prepare(`INSERT INTO caip_media_upload_files(caip_media_upload_session_id,creative_project_id,client_file_key,file_key,original_filename,mime_type,media_type,media_role,file_size_bytes,upload_status,storage_provider,bucket_alias,object_key,part_size_bytes,expected_parts,uploaded_parts,uploaded_bytes,file_fingerprint,checksum_value,checksum_status,privacy_state,consent_state,rights_status,created_at,updated_at,uploaded_at) VALUES(?,?,?,?,?,'video/mp4','video','process',100,'uploaded','r2_private_caip','CAIP_PRIVATE_MEDIA_BUCKET',?,100,1,1,100,'same-fp','sha256-same','verified','private','not_applicable','needs_review',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)`);
for(const [client,fileKey,name,obj] of [['c1','fk1','clip.mp4','projects/x/raw/video/1.mp4'],['c2','fk2','clip.mp4','projects/x/raw/video/2.mp4'],['c3','fk3','clip.mp4','projects/x/raw/video/3.mp4']]) insert.run(sessionId,projectId,client,fileKey,name,obj);
const ids=base.prepare("SELECT caip_media_upload_file_id id,object_key FROM caip_media_upload_files ORDER BY caip_media_upload_file_id").all();
const db=new D1Db(base); const bucket=new FakeBucket(); for(const row of ids) bucket.objects.set(row.object_key,{size:100,etag:`etag-${row.id}`,httpMetadata:{contentType:'video/mp4'}}); const env={CAIP_PRIVATE_MEDIA_BUCKET:bucket};
// Optional downstream tables must not block canonical registration.
base.exec('DROP TABLE creative_asset_technical_observations');
base.exec('DROP TABLE caip_media_processing_jobs');
const retried=await retryUploadedFileRegistration(db,env,ids[0].id,1);
assert.equal(Boolean(retried.registration_pending),false,'Verified R2 binary should register even when optional observation/processing tables are absent.');
assert(Number(retried.file?.creative_asset_id)>0,'Retry should link the canonical creative asset.');
const audit=await listCaipDuplicateAudit(db,projectId);
assert.equal(audit.groups.length,1);
assert.equal(audit.duplicate_rows,2);
assert.equal(audit.groups[0].canonical_file_id,ids[0].id,'Linked creative asset should win canonical ranking.');
assert.deepEqual(new Set(audit.groups[0].duplicate_file_ids),new Set([ids[1].id,ids[2].id]));
const cleaned=await cleanupCaipDuplicateGroup(db,env,projectId,ids[0].id,[ids[1].id,ids[2].id],1,{delete_private_r2_copy:true});
assert.equal(cleaned.archived_count,2);
assert.equal(cleaned.r2_deleted_count,2,'Unlinked redundant R2 copies should be safely removable.');
assert.equal(base.prepare("SELECT COUNT(*) n FROM caip_media_upload_files WHERE upload_status='archived'").get().n,2);
assert(bucket.objects.has(ids[0].object_key),'Canonical R2 object must remain.');

const endpoint=read('functions/api/admin/caip-media-intake.js');
assert(endpoint.includes("action==='cleanup_duplicate_group'"));
assert(endpoint.includes('refresh_warning'));
assert(endpoint.includes('CAIP private-media action completed.'));
const direct=read('functions/api/admin/caip-media-upload-direct.js');
assert(direct.includes('binary_stored:true'));
assert(direct.includes('registration_pending:true'));
const client=read('public/js/admin-caip-media-intake.js');
assert(client.includes('CAIP media audit & duplicate cleanup'));
assert(client.includes('Archive redundant rows'));
assert(client.includes('Archive + delete'));
assert(client.includes('Refresh duplicate audit'));
assert(read('admin/creative-assets/index.html').includes('admin-caip-media-intake.js?v=267'));
console.log('Build 267 CAIP registration reconciliation and safe duplicate cleanup checks: PASS');
