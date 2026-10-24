/* Build 457 safety, contextual navigation and accessibility contract. Synthetic only. */
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {resolve,dirname} from 'node:path';
import {MAKER_LINKS,MAKER_PHASES,TRIAL_SCENARIOS,nextMakerAction,projectId,workbenchUrl} from '../public/js/maker-workbench-policy-457.mjs';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const file=p=>readFileSync(resolve(root,p),'utf8');

test('all maker cards link to existing original Admin workspaces, with no duplicate data table',()=>{
 const keys=MAKER_LINKS.map(link=>link.key);
 assert.equal(new Set(keys).size,keys.length);
 assert.equal(new Set(MAKER_PHASES.map(stage=>stage.key)).size,MAKER_PHASES.length);
 for(const link of MAKER_LINKS){
  assert.match(link.href,/^\/admin\/[a-z-]+\/$/);
  assert.ok(existsSync(resolve(root,link.href.slice(1),'index.html')),link.href);
  assert.ok(link.description.length>15&&link.help.length>20);
 }
 assert.equal(MAKER_LINKS.filter(link=>link.key==='project').length,1);
});

test('context URLs use only allowlisted route definitions and positive IDs',()=>{
 const creative=MAKER_LINKS.find(link=>link.key==='project');
 const designs=MAKER_LINKS.find(link=>link.key==='design');
 const traveler=MAKER_LINKS.find(link=>link.key==='making');
 const review=MAKER_LINKS.find(link=>link.key==='owner');
 assert.equal(workbenchUrl(creative,99),'/admin/creative-process/?project_id=99');
 assert.equal(workbenchUrl(designs,41),'/admin/project-design-files/?project_id=41');
 assert.equal(workbenchUrl(traveler,41),'/admin/guided-manufacturing/');
 assert.equal(workbenchUrl(review,19,'private_therapeutic'),'/admin/maker-owner-trials/?scenario=private_therapeutic&project_id=19');
 assert.equal(workbenchUrl(review,19,'custom_commission'),'/admin/maker-owner-trials/?scenario=custom_commission');
 assert.equal(workbenchUrl(review,19,'invalid'),'/admin/maker-owner-trials/?scenario=jewellery_metal&project_id=19');
 for(const wrong of [0,-1,'0','1/../',1.5,'1a','',null,Number.MAX_SAFE_INTEGER])assert.equal(projectId(wrong),0);
 assert.equal(projectId(1200),1200);
 assert.throws(()=>workbenchUrl({href:'https://example.com/',passProject:true},99));
 assert.deepEqual(new Set(TRIAL_SCENARIOS),new Set(['jewellery_metal','resin_clay','digital_fabrication','failed_salvage','private_therapeutic','custom_commission']));
});

test('advice is derived only from actual source counters and selected phase, not fabricated acceptance',()=>{
 const empty={caip_workspaces:0,active_events:0,selected_evidence_rows:0,maker_story_profiles:0};
 assert.equal(nextMakerAction(null).key,'project');
 assert.match(nextMakerAction(empty).title,/CAIP/);
 assert.match(nextMakerAction({...empty,caip_workspaces:1}).title,/process/);
 assert.match(nextMakerAction({...empty,caip_workspaces:1,active_events:1}).title,/evidence/);
 assert.match(nextMakerAction({...empty,caip_workspaces:1,active_events:1,selected_evidence_rows:1}).title,/Maker Story/);
 assert.match(nextMakerAction({...empty,caip_workspaces:1,active_events:1,selected_evidence_rows:1,maker_story_profiles:1}).explanation,/not inferred/);
 for(const focus of MAKER_PHASES.slice(1)){
  const recommendation=nextMakerAction(empty,focus.key);
  assert.ok(MAKER_LINKS.some(link=>link.key===recommendation.key));
  assert.ok(!/certified|approved for sale|published successfully/i.test(recommendation.explanation));
 }
});

test('responsive keyboard screen, every-card ⓘ help and accessible status remain present',()=>{
 const html=file('admin/maker-workbench/index.html');
 const script=file('public/js/admin-maker-workbench-457.js');
 const reviews=file('public/js/admin-maker-owner-trials.js');
 assert.match(html,/name="viewport" content="width=device-width,initial-scale=1"/);
 assert.match(html,/@media\s*\(max-width:600px\)/);
 assert.match(html,/:focus-visible/);
 assert.match(html,/href="#mwMain"/);
 assert.match(html,/id="mwStatus"[^>]*role="status"[^>]*aria-live="polite"/);
 for(const field of ['mwProject','mwFocus','mwTrial'])assert.match(html,new RegExp(`for="${field}"`));
 assert.match(script,/document\.createElement\('details'\)/);
 assert.match(script,/summary\.textContent='ⓘ How this step works'/);
 assert.match(script,/\/api\/admin\/project-workflow-routing/);
 assert.match(script,/credentials:'same-origin'/);
 assert.match(script,/\.replaceChildren\(/);
 assert.doesNotMatch(script,/localStorage|sessionStorage|setInterval|method:\s*'POST'|innerHTML/);
 assert.match(reviews,/new URLSearchParams\(location\.search\)/);
 assert.match(reviews,/load\(initialScope\)/);
 assert.match(file('admin/index.html'),/href="\/admin\/maker-workbench\/"/);
});
