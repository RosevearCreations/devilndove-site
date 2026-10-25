/* Build 460: synthetic-only source/consent/accessibility HOLD regression. */
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {auditMakerMedia,OWNER_MEDIA_CHECKS} from '../public/js/maker-media-acceptance-policy-460.mjs';
import {MAKER_LINKS,workbenchUrl} from '../public/js/maker-workbench-policy-457.mjs';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const file=p=>readFileSync(resolve(root,p),'utf8');
const source={project:{creative_work_project_id:77,project_title:'Synthetic maker sample',privacy_status:'public_candidate',rights_status:'public_allowed'},
 current:{maker_media_story_revision_id:4,intended_visibility:'public_candidate',story_title:'Synthetic storyboard'},
 frames:[{maker_media_story_frame_id:12,source_kind:'product_image',source_id:19,frame_label:'Finished sample',moment:'after',
  caption:'A finished practice sample.',alt_description:'A handmade sample on a workbench.',is_principal:1,publication_intent:'public_candidate',consent_record_id:8,media_url:'https://example.test/media-sample.jpg'}],
 consents:[{consent_record_id:8,media_url:'https://example.test/media-sample.jpg',consent_status:'granted',consent_scope:'product_page',public_use_allowed:1,expires_at:'2026-11-25'}]};
const audit=sample=>auditMakerMedia(sample,{today:'2026-10-24'});

test('empty and missing story stay HOLD, never automatic acceptance',()=>{
 assert.equal(audit(null).state,'HOLD_SELECT_REAL_PROJECT');
 assert.equal(audit({project:source.project,current:null}).state,'HOLD_NO_MEDIA_STORY');
 assert.match(audit(source).state,/^HOLD_/);assert.equal(audit(source).frames.length,1);
 assert.ok(audit(source).frames[0].issues.some(s=>s.includes('dimensions')));
 assert.equal(Object.hasOwn(audit(source),'approved'),false);
});
test('source-linked consent mismatches, expiry and missing principal flag explicit gaps',()=>{
 const swapped=structuredClone(source);swapped.consents[0].media_url='https://example.test/other.jpg';
 assert.match(audit(swapped).frames[0].issues.join(' '),/does not match/);
 swapped.consents[0].media_url=source.frames[0].media_url;swapped.consents[0].expires_at='2026-01-01';
 assert.match(audit(swapped).frames[0].issues.join(' '),/expired/);
 swapped.frames[0].is_principal=0;assert.match(audit(swapped).gaps.join(' '),/principal image/);
 swapped.project.rights_status='private_only';assert.match(audit(swapped).gaps.join(' '),/not both currently authorized/);
});
test('private stories stay private, and confidential R2 objects require original inspection',()=>{
 const privateCase=structuredClone(source);privateCase.current.intended_visibility='internal_only';
 privateCase.project.privacy_status='private';privateCase.frames[0].publication_intent='internal_only';
 privateCase.frames[0].source_kind='media_asset';privateCase.frames[0].media_url=null;privateCase.consents=[];
 const result=audit(privateCase);
 assert.match(result.gaps.join(' '),/private\/internal/);
 assert.match(result.frames[0].issues.join(' '),/Private R2 asset/);
 assert.ok(!result.frames[0].issues.join(' ').includes('Consent URL'));
});
test('video captions and image textual accuracy always require actual human acceptance',()=>{
 const video=structuredClone(source);video.frames[0].source_kind='product_video';
 video.frames[0].caption='';video.frames[0].alt_description='';
 const findings=audit(video).frames[0].issues.join(' ');
 assert.match(findings,/factual caption/);assert.match(findings,/image\/video description/);
 assert.match(findings,/Time-synchronized/);
 assert.equal(OWNER_MEDIA_CHECKS.length,8);
 for(const key of ['original','dimensions','descriptions','keyboard','contrast','touch','rights','video'])assert.ok(OWNER_MEDIA_CHECKS.some(c=>c.key===key));
});
test('Admin source audit is accessible, mobile-ready, read-only and source-linked',()=>{
 const html=file('admin/maker-media-acceptance/index.html'),js=file('public/js/admin-maker-media-acceptance-460.js');
 assert.match(html,/href="#maMain"/);assert.match(html,/name="viewport"/);assert.match(html,/aria-live="polite"/);
 for(const id of ['maProject','maRevision'])assert.match(html,new RegExp(`for="${id}"`));
 assert.match(html,/:focus-visible/);assert.match(html,/@media\(max-width:600px\)/);
 assert.match(html,/min-height:48px/);assert.match(html,/prefers-reduced-motion/);
 assert.match(js,/credentials:'same-origin'/);assert.match(js,/cache:'no-store'/);
 assert.match(js,/\/api\/admin\/maker-media-stories/);assert.match(js,/\.replaceChildren\(/);
 assert.doesNotMatch(js,/localStorage|sessionStorage|innerHTML|method:\s*'POST'|document\.write|\.src\s*=/);
 assert.ok(existsSync(resolve(root,'admin/maker-media-acceptance/index.html')));
 const link=MAKER_LINKS.find(x=>x.key==='media-acceptance');assert.ok(link);
 assert.equal(workbenchUrl(link,77),'/admin/maker-media-acceptance/?project_id=77');
 assert.match(file('admin/maker-media-stories/index.html'),/href="\/admin\/maker-media-acceptance\/"/);
});
