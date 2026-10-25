import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {planActualMakerMedia472,MEDIA_TARGET_RATIOS} from '../public/js/maker-media-remediation-policy-472.mjs';
import {auditMakerMedia} from '../public/js/maker-media-acceptance-policy-460.mjs';

const file=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const source={project:{creative_work_project_id:91,project_title:'Synthetic workshop only',privacy_status:'private',rights_status:'private_only'},
 current:{maker_media_story_revision_id:3,intended_visibility:'internal_only'},
 frames:[{maker_media_story_frame_id:8,source_id:14,source_kind:'product_image',frame_label:'Synthetic workbench picture',
  caption:'Original handmade workbench test photograph.',alt_description:'An original test workbench photograph.',
  media_url:'https://example.invalid/private-asset',publication_intent:'internal_only',is_principal:1},
 {maker_media_story_frame_id:9,source_id:15,source_kind:'product_video',frame_label:'Synthetic bench video',
  caption:'Original private tutorial sequence.',alt_description:'A synthetic workshop tutorial sample.',
  publication_intent:'internal_only',is_principal:0}],consents:[]};
const audit=auditMakerMedia(source,{today:'2026-10-25'});
const imageKey='product_image:14:8',videoKey='product_video:15:9';

test('missing real sources always stay HOLD and never inherit inferred media acceptance',()=>{
 const missing=planActualMakerMedia472(null);
 assert.equal(missing.state,'HOLD_SELECT_REAL_MEDIA_SOURCE');assert.equal(missing.frames.length,0);
 const p=planActualMakerMedia472(audit);
 assert.match(p.state,/^HOLD_/);assert.equal(p.publication_authorized,false);
 assert.equal(p.owner_approval_recorded,false);assert.equal(p.accessibility_certified,false);
 assert.equal(p.media_modified,false);assert.equal(p.r2_media_fetched,false);
 assert.equal(p.d1_write,false);
});

test('owner-measured pixels and target crop are only planning estimates, never visual proof',()=>{
 const p=planActualMakerMedia472(audit,{[imageKey]:{width:1600,height:900,target_ratio:'4:5',crop_mode:'cover',
   alt_text:'A hand-shaped ring displayed on a plain workbench.',caption:'A craft sample in the workshop.',rights_reference:'owner-photo-sheet-17'}});
 const f=p.frames[0];assert.deepEqual(f.original_pixels,{width:1600,height:900});
 assert.equal(f.target_ratio,'4:5');assert.ok(f.estimated_cover_crop_fraction>0.5);
 assert.match(f.review_findings.join(' '),/crop may remove/);
 assert.equal(f.owner_visual_check_pending,true);assert.ok(f.source_findings.length>0);
 assert.equal(MEDIA_TARGET_RATIOS['16:9'],16/9);
});

test('invalid measurement and unknown ratio stay blocked rather than coerced into success',()=>{
 const p=planActualMakerMedia472(audit,{[imageKey]:{width:-1,height:'14.7',target_ratio:'3:7',crop_mode:'invented',alt_text:'nice',caption:'x'}});
 const f=p.frames[0];assert.equal(f.original_pixels,null);assert.equal(f.target_ratio,null);
 assert.ok(f.review_findings.some(x=>x.includes('pixel dimensions')));
 assert.ok(f.review_findings.some(x=>x.includes('aspect ratio')));
 assert.equal(f.proposed_alt_text,'nice');assert.equal(f.owner_visual_check_pending,true);
});

test('video timed captions remain an explicit independent owner device review',()=>{
 const a=planActualMakerMedia472(audit,{[videoKey]:{width:1920,height:1080,target_ratio:'16:9',crop_mode:'contain',
   alt_text:'An actual jeweler shows the forming process.',caption:'Making a piece at the workbench.',
   rights_reference:'media-release-2026',timed_captions_reviewed:false}});
 assert.match(a.frames[1].review_findings.join(' '),/Time-synchronized captions/);
 const checked=planActualMakerMedia472(audit,{[videoKey]:{timed_captions_reviewed:true}});
 assert.equal(checked.frames[1].timed_captions_claimed_reviewed,true);
 assert.equal(checked.owner_approval_recorded,false);
});

test('raw private URLs are not preserved in downloaded plan references',()=>{
 const p=planActualMakerMedia472(audit,{[imageKey]:{rights_reference:'https://secret.example/private?key=token'}});
 assert.doesNotMatch(JSON.stringify(p),/secret\.example|token/);
 assert.equal(p.source_revision_id,3);assert.equal(p.source_project_id,91);
 assert.ok(p.device_review_gaps.includes('desktop_keyboard_focus'));
});

test('Build 472 UI remains authenticated-source-linked, keyboard-labelled, local-only and explicit download',()=>{
 const html=file('admin/maker-media-acceptance/index.html'),ui=file('public/js/admin-maker-media-remediation-472.js');
 const old=file('public/js/admin-maker-media-acceptance-460.js');
 for(const token of ['ma472Remediation','ma472Frames','ma472Devices','ma472Export',
   'admin-maker-media-remediation-472.js?v=472','aria-live="polite"','focus-visible','https://www.w3.org/TR/WCAG22/']){
   assert.ok(html.includes(token),token);
 }
 assert.match(old,/CustomEvent\('dd:maker-media-audited'/);
 assert.match(ui,/addEventListener\('dd:maker-media-audited'/);
 assert.match(ui,/Blob\(/);assert.match(ui,/URL\.createObjectURL/);
 assert.doesNotMatch(ui,/fetch\(|apiFetch\(|method:\s*['"]POST|localStorage|sessionStorage|\.src\s*=/);
});
