import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { retryUploadedFileRegistration, createSafeReplacementUpload } from '../functions/api/_lib/caipMediaIntake.js';
import { FULL_SCHEMA_REQUIREMENTS } from '../functions/api/_lib/fullSchemaRequirements.js';

const root=path.resolve(path.dirname(new URL(import.meta.url).pathname),'..');
const read=(p)=>fs.readFileSync(path.join(root,p),'utf8');
class D1Statement{constructor(stmt){this.stmt=stmt;this.args=[];}bind(...args){this.args=args;return this;}async run(){const r=this.stmt.run(...this.args);return{success:true,meta:{changes:Number(r.changes),last_row_id:Number(r.lastInsertRowid||0)}};}async first(){return this.stmt.get(...this.args)||null;}async all(){return{success:true,results:this.stmt.all(...this.args)}}}
class D1Db{constructor(db){this.db=db;}prepare(sql){return new D1Statement(this.db.prepare(sql));}}
class FakeBucket{constructor(){this.objects=new Map();}async head(key){return this.objects.get(key)||null;}async put(){}async createMultipartUpload(key){return{uploadId:`up-${key}`};}resumeMultipartUpload(){return{uploadPart:async()=>({etag:'e'}),complete:async()=>({etag:'e'}),abort:async()=>{}};}}

assert(Object.keys(FULL_SCHEMA_REQUIREMENTS.tables).length>=470,'Full schema manifest should cover the complete canonical database.');
assert(Object.values(FULL_SCHEMA_REQUIREMENTS.tables).reduce((n,v)=>n+v.length,0)>=6000,'Full schema manifest should cover canonical columns.');
assert(FULL_SCHEMA_REQUIREMENTS.tables.media_assets.some((c)=>c[0]==='variant_role'),'Canonical media_assets must require variant_role.');

const base=new DatabaseSync(':memory:');
base.exec(read('database_full_schema.sql'));
// Simulate the exact live drift: media_assets exists but variant_role is absent.
base.exec('PRAGMA foreign_keys=OFF');
base.exec(`CREATE TABLE media_assets_legacy (
  media_asset_id INTEGER PRIMARY KEY AUTOINCREMENT,
  product_id INTEGER,storage_provider TEXT NOT NULL DEFAULT 'r2',bucket_name TEXT,object_key TEXT NOT NULL UNIQUE,
  public_url TEXT,original_filename TEXT,mime_type TEXT,file_size_bytes INTEGER,created_by_user_id INTEGER,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  sort_order INTEGER NOT NULL DEFAULT 0,annotation_notes TEXT,width_px INTEGER,height_px INTEGER,deleted_at TEXT
)`);
base.exec('DROP TABLE media_assets');
base.exec('ALTER TABLE media_assets_legacy RENAME TO media_assets');
base.exec('PRAGMA foreign_keys=ON');
base.exec("INSERT INTO users(email,password_hash,display_name,role) VALUES('b268@example.invalid','x','Build 268','admin')");
base.exec("INSERT INTO creative_projects(creative_project_key,source_type,source_id,project_title,project_status,governance_status) VALUES('cp268','manual','268','Build 268 test','active','needs_review')");
const projectId=Number(base.prepare("SELECT creative_project_id FROM creative_projects WHERE creative_project_key='cp268'").get().creative_project_id);
base.exec(`INSERT INTO caip_media_upload_sessions(creative_project_id,session_key,session_status,storage_profile,object_prefix,transport_mode,preferred_direct_transport,part_size_bytes,parallel_parts,total_files,total_bytes,uploaded_bytes,created_at,updated_at) VALUES(${projectId},'s268','complete','private_r2','projects/${projectId}/raw','worker_streamed_multipart_v1','future',33554432,2,2,500,500,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)`);
const sessionId=Number(base.prepare("SELECT caip_media_upload_session_id FROM caip_media_upload_sessions WHERE session_key='s268'").get().caip_media_upload_session_id);
const ins=base.prepare(`INSERT INTO caip_media_upload_files(caip_media_upload_session_id,creative_project_id,client_file_key,file_key,original_filename,mime_type,media_type,media_role,file_size_bytes,upload_status,storage_provider,bucket_alias,object_key,part_size_bytes,expected_parts,uploaded_parts,uploaded_bytes,file_fingerprint,checksum_status,privacy_state,consent_state,rights_status,created_at,updated_at,uploaded_at) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)`);
ins.run(sessionId,projectId,'c1','fk1','good.mp4','video/mp4','video','process',100,'uploaded','r2_private_caip','CAIP_PRIVATE_MEDIA_BUCKET','projects/x/raw/video/good.mp4',100,1,1,100,'fp-good','pending','private','not_applicable','needs_review');
ins.run(sessionId,projectId,'c2','fk2','partial.mp4','video/mp4','video','process',400,'uploaded','r2_private_caip','CAIP_PRIVATE_MEDIA_BUCKET','projects/x/raw/video/partial.mp4',400,1,1,400,'fp-partial','pending','private','not_applicable','needs_review');
const fileRows=base.prepare('SELECT caip_media_upload_file_id,object_key,file_size_bytes FROM caip_media_upload_files ORDER BY caip_media_upload_file_id').all();
const db=new D1Db(base);const bucket=new FakeBucket();bucket.objects.set(fileRows[0].object_key,{size:100,etag:'good',httpMetadata:{contentType:'video/mp4'}});bucket.objects.set(fileRows[1].object_key,{size:350,etag:'partial',httpMetadata:{contentType:'video/mp4'}});const env={CAIP_PRIVATE_MEDIA_BUCKET:bucket};
const good=await retryUploadedFileRegistration(db,env,fileRows[0].caip_media_upload_file_id,1);
assert.equal(Boolean(good.registration_pending),false,'Missing optional variant_role must not block CAIP registration.');
assert(Number(good.file?.creative_asset_id)>0,'CAIP registration should create/link canonical creative asset.');
assert.equal(base.prepare('SELECT COUNT(*) n FROM media_assets').get().n,1,'Compatibility registration should still create media_assets row.');
const partial=await retryUploadedFileRegistration(db,env,fileRows[1].caip_media_upload_file_id,1);
assert.equal(partial.diagnostic_code,'CAIP_R2_SIZE_MISMATCH');
assert.equal(partial.safe_replacement_available,true);
const old=base.prepare('SELECT last_error FROM caip_media_upload_files WHERE caip_media_upload_file_id=?').get(fileRows[1].caip_media_upload_file_id);
assert(String(old.last_error).includes('CAIP_R2_SIZE_MISMATCH'));
const replacement=await createSafeReplacementUpload(db,env,fileRows[1].caip_media_upload_file_id,1);
assert(replacement.replacement_file_id>0);
assert.notEqual(replacement.replacement_object_key,fileRows[1].object_key,'Replacement must use a new R2 key.');
assert(bucket.objects.has(fileRows[1].object_key),'Partial original must remain untouched.');

const fullAudit=read('functions/api/admin/schema-full-audit.js');
assert(fullAudit.includes('read_only:true'));
assert(fullAudit.includes('PRAGMA quick_check'));
assert(fullAudit.includes('PRAGMA foreign_key_check'));
assert(fullAudit.includes('additive_repair_preview'));
assert(fullAudit.includes('No DROP TABLE, DELETE, destructive rename, or data replacement is generated.'));
const client=read('public/js/admin-schema-drift-report.js');
assert(client.includes('Run full live D1 audit'));
assert(client.includes('Download additive repair preview SQL'));
assert(read('admin/operations/index.html').includes('admin-schema-drift-report.js?v=268'));
assert(/admin-caip-media-intake\.js\?v=(?:26[8-9]|27[0-2])/.test(read('admin/creative-assets/index.html')));
console.log('Build 268 full schema audit + CAIP compatibility/recovery checks: PASS');
