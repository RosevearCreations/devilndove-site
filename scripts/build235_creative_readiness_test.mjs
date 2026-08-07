import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { DatabaseSync } from 'node:sqlite';

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const read = (name) => fs.readFileSync(path.join(root, name), 'utf8');

const apiSource = read('functions/api/admin/creative-automation.js');
for (const token of [
  "const BUILD='235'",
  'function stageReadiness',
  'function buildWorkQueue',
  'async function evidencePacket',
  'function evidencePacketHtml',
  "content_status IN ('published','approved')",
  "exportFormat==='json'"
]) assert(apiSource.includes(token), `Creative Automation Build 235 is missing ${token}.`);
assert(!apiSource.includes('publication_status IN'), 'The obsolete publication_status column is still used.');

let runnable = apiSource
  .replace(/import\s*\{[\s\S]*?\}\s*from\s*'\.\.\/_lib\/adminAudit\.js';/, `
    const auditAdminAction=async()=>{};
    const captureRuntimeIncident=async()=>{};
    const getAdminUserFromRequest=async()=>({user_id:1});
    const getDb=(env)=>env.DB;
    const jsonResponse=(data,status=200,headers={})=>new Response(JSON.stringify(data),{status,headers:{'Content-Type':'application/json',...headers}});
    const normalizeText=(value)=>String(value??'').trim();
  `)
  .replaceAll('export async function', 'async function');
runnable += '\n;globalThis.__DD_BUILD235_TEST__={projectDetail,buildWorkQueue,evidencePacket,evidencePacketHtml,payload};';
const context = { console, Response, URL, Date, JSON, Object, Number, String, Set, Array, Math };
vm.createContext(context);
vm.runInContext(runnable, context, { filename: 'creative-automation.js' });
const tested = context.__DD_BUILD235_TEST__;

const sqlite = new DatabaseSync(':memory:');
sqlite.exec(read('database_schema.sql'));
for (const migration of ['database_build213_creative_process_engine.sql','database_build215_creative_intelligence_integration.sql','database_build216_reviewed_inventory_caip_evidence.sql','database_build217_creative_project_controls.sql','database_build228_creative_automation_prelaunch_stages.sql']) sqlite.exec(read(migration));
const run = (sql, ...args) => sqlite.prepare(sql).run(...args);
run(`INSERT INTO content_projects (content_project_key,source_type,source_id,project_title) VALUES ('content-proof','creative_project','1','Proof package')`);
const contentId = Number(sqlite.prepare("SELECT content_project_id FROM content_projects WHERE content_project_key='content-proof'").get().content_project_id);
run(`INSERT INTO creative_work_projects (project_key,project_title,project_status,summary,objective,story_angle,privacy_status,rights_status) VALUES ('proof-project','Proof Project','in_progress','A complete factual project summary.','Prove the Build 235 workflow.','Show the documented process.','review_ready','cleared')`);
const projectId = Number(sqlite.prepare("SELECT creative_work_project_id FROM creative_work_projects WHERE project_key='proof-project'").get().creative_work_project_id);
run(`INSERT INTO creative_automation_workflows (workflow_key,creative_work_project_id,workflow_status,current_stage_key,due_date,owner_user_id) VALUES ('creative-proof',?,'in_progress','measure_repurpose','2026-08-01',1)`, projectId);
const workflowId = Number(sqlite.prepare("SELECT creative_automation_workflow_id FROM creative_automation_workflows WHERE creative_work_project_id=?").get(projectId).creative_automation_workflow_id);
run(`INSERT INTO creative_work_events (creative_work_project_id,event_type,event_title,event_notes,material_name,material_quantity,material_unit,material_cost_cents,media_url) VALUES (?,'process','Cut and test','Measured and photographed the test.','Cork blank',1,'piece',150,'r2://internal/proof.jpg')`, projectId);
const eventId = Number(sqlite.prepare('SELECT creative_work_event_id FROM creative_work_events WHERE creative_work_project_id=?').get(projectId).creative_work_event_id);
run(`INSERT INTO creative_project_material_reviews (creative_work_project_id,creative_work_event_id,review_status,actual_quantity,approved_cost_cents,review_notes) VALUES (?,?,'approved',1,150,'Verified')`, projectId, eventId);
run(`INSERT INTO creative_project_evidence_selections (creative_work_project_id,creative_work_event_id,evidence_role,selected) VALUES (?,?,'process_evidence',1)`, projectId, eventId);
run(`INSERT INTO creative_project_profitability (creative_work_project_id,labour_rate_cents,packaging_cost_cents,overhead_cost_cents,channel_fee_cents,shipping_cost_cents,revenue_cents,notes) VALUES (?,2000,100,50,75,0,4500,'Reviewed assumptions')`, projectId);
run(`INSERT INTO creative_project_content_handoffs (creative_work_project_id,content_project_id,handoff_status,evidence_count,package_json) VALUES (?,?,'ready_for_review',1,'{}')`, projectId, contentId);
run(`INSERT INTO creative_projects (creative_project_key,content_project_id,source_type,source_id,project_title) VALUES ('caip-proof',?,'creative_work_project',?,'Proof CAIP')`, contentId, String(projectId));
const caipId = Number(sqlite.prepare("SELECT creative_project_id FROM creative_projects WHERE creative_project_key='caip-proof'").get().creative_project_id);
run(`INSERT INTO creative_project_caip_mirrors (creative_work_project_id,creative_project_id,evidence_count,mirror_status) VALUES (?,?,1,'reviewed')`, projectId, caipId);
run(`INSERT INTO content_project_deliverables (content_project_id,deliverable_key,channel_key,deliverable_type,title,deliverable_status,approval_status,output_url) VALUES (?,'youtube-main','youtube','video','Main video','complete','approved','https://example.invalid/video')`, contentId);
run(`INSERT INTO content_publications (publication_key,content_project_id,destination,publication_slug,title,content_status,canonical_path,published_at) VALUES ('publication-proof',?,'workshop_journal','proof-project','Proof Project','published','/workshop-journal/proof-project/',CURRENT_TIMESTAMP)`, contentId);
run(`INSERT INTO creative_work_outputs (creative_work_project_id,output_key,output_label,output_group,output_status,approval_status,output_url,notes) VALUES (?,'youtube-main','Main video','video','complete','approved','https://example.invalid/video','Published result recorded')`, projectId);
run(`INSERT INTO creative_project_knowledge_summaries (creative_work_project_id,summary_type,summary_text,source_evidence_count,review_status,reviewed_at) VALUES (?,'lessons_learned','The measured test required a slower pass.',1,'approved',CURRENT_TIMESTAMP)`, projectId);
for (const key of ['process','materials_cost','assets_evidence','content_package','channel_review','public_release','measure_repurpose']) {
  run(`INSERT INTO creative_automation_stage_reviews (creative_automation_workflow_id,stage_key,review_status,evidence_reference,review_notes) VALUES (?,?,'complete',?,'Verified against source records')`, workflowId, key, `proof:${key}`);
}
run(`INSERT INTO creative_automation_events (creative_automation_workflow_id,event_type,stage_key,previous_status,next_status,details_json) VALUES (?,'stage_reviewed','measure_repurpose','needs_review','complete','{}')`, workflowId);

class D1Statement {
  constructor(db, sql) {
    this.db = db;
    this.indices = [...sql.matchAll(/\?(\d+)/g)].map((match) => Number(match[1]) - 1);
    this.sql = sql.replace(/\?\d+/g, '?');
    this.args = [];
  }
  bind(...args) { this.args = args; return this; }
  values() { return this.indices.length ? this.indices.map((index) => this.args[index]) : this.args; }
  async first() { return this.db.prepare(this.sql).get(...this.values()) || null; }
  async all() { return { results: this.db.prepare(this.sql).all(...this.values()) }; }
  async run() { return this.db.prepare(this.sql).run(...this.values()); }
}
const d1 = {
  prepare(sql) { return new D1Statement(sqlite, sql); },
  async batch(statements) { for (const statement of statements) await statement.run(); return []; }
};

const project = sqlite.prepare(`SELECT p.*,w.creative_automation_workflow_id,w.workflow_key,w.workflow_status,w.current_stage_key,w.owner_user_id,w.due_date,w.blocked_reason,w.operator_notes,w.updated_at workflow_updated_at FROM creative_work_projects p LEFT JOIN creative_automation_workflows w ON w.creative_work_project_id=p.creative_work_project_id WHERE p.creative_work_project_id=?`).get(projectId);
const detail = await tested.projectDetail(d1, project);
assert.equal(detail.facts.released_publication_count, 1, 'Published content was not counted from content_status.');
assert.equal(detail.stages.length, 7, 'Seven stage definitions were not returned.');
assert(detail.stages.every((stage) => stage.source_ready === 1), 'A fully evidenced project did not pass every source-readiness rule.');
assert(detail.stages.every((stage) => stage.effective_status === 'complete'), 'Completed human reviews did not reconcile with server source readiness.');

const queue = tested.buildWorkQueue([
  { creative_work_project_id: 1, creative_automation_workflow_id: 1, project_key: 'blocked', project_title: 'Blocked', workflow_status: 'blocked', current_stage_key: 'process', blocked_reason: 'Missing owner proof', due_date: '2026-08-10', owner_user_id: 1 },
  { creative_work_project_id: 2, creative_automation_workflow_id: 2, project_key: 'overdue', project_title: 'Overdue', workflow_status: 'in_progress', current_stage_key: 'assets_evidence', due_date: '2020-01-01', owner_user_id: 1 }
]);
assert.equal(queue[0].priority, 'blocked', 'Blocked work must sort before overdue work.');
assert.equal(queue[1].priority, 'overdue', 'Past-due active work was not marked overdue.');

const packet = await tested.evidencePacket(d1, projectId);
assert.equal(packet.schema, 'devilndove.creative_evidence_packet.v1');
assert.equal(packet.records.timeline.length, 1);
assert.equal(packet.records.deliverables.length, 1);
assert.equal(packet.records.publications[0].content_status, 'published');
const html = tested.evidencePacketHtml(packet);
for (const token of ['Proof Project', 'Print or save as PDF', 'Stage readiness', 'Timeline and material evidence', 'Reviewed lessons and recommendations']) assert(html.includes(token), `Printable evidence packet is missing ${token}.`);

const client = read('public/js/admin-creative-automation.js');
for (const token of ['work_queue', 'creativeAutomationExportHtml', "exportPacket('json')", 'creative-automation-check-list']) assert(client.includes(token), `Creative Automation client is missing ${token}.`);
assert.equal((read('admin/creative-automation/index.html').match(/<h1\b/gi) || []).length, 1, 'Creative Automation page must have exactly one H1.');
assert(read('css/styles.css').includes('.creative-automation-queue-grid'), 'Responsive queue CSS is missing.');
assert(read('sw.js').includes("devilndove-shell-v19"), 'Service worker cache was not advanced to the current Build 241 shell v19.');

console.log('Build 235 Creative Automation readiness, queue, evidence export, publication status, responsive UI and evidence packet checks passed.');
