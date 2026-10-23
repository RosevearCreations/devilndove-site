import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {approvalAllowed,designKey,extensionFor,MAX_DESIGN_BYTES,requestKey,safeFilename} from '../functions/api/admin/_lib/makerDesignRules.js';

test('design identity blocks path tricks and unsupported executable uploads',()=>{
  assert.equal(designKey('Wedding_Ring-V2'),'wedding_ring-v2');
  for(const v of ['../escape','a','semi;colon','x/y'])assert.equal(designKey(v),'');
  for(const f of ['design.stl','design.3MF','plan.DXF','toolpath.gcode','reference.SVG','3d.step'])assert.ok(extensionFor(f));
  for(const f of ['design.exe','bad.jpg.php','../bad.stl','bad\r.svg','bad/stl'])assert.equal(extensionFor(f),'');
  assert.equal(MAX_DESIGN_BYTES,12*1024*1024);
  assert.equal(safeFilename('evil\"\r\n.svg'),'evil___.svg');
});
test('approval requires deliberate ready owner/licensed design provenance',()=>{
  const base={source_license:'own_work',machine_readiness:'ready',source_note:''};
  assert.equal(approvalAllowed(base),true);
  assert.equal(approvalAllowed({...base,source_license:'unknown'}),false);
  assert.equal(approvalAllowed({...base,source_license:'third_party_reference'}),false);
  assert.equal(approvalAllowed({...base,machine_readiness:'unreviewed'}),false);
  assert.equal(approvalAllowed({...base,source_license:'licensed',source_note:'lic'}),false);
  assert.equal(approvalAllowed({...base,source_license:'licensed',source_note:'Creator license 2026'}),true);
  assert.equal(requestKey('short'),'');
  assert.equal(requestKey('dd444_request_12345678901234567890'),'dd444_request_12345678901234567890');
});
test('route and UI contain private, audited, manual-only boundaries',()=>{
  const api=readFileSync(new URL('../functions/api/admin/project-design-files.js',import.meta.url),'utf8');
  const ui=readFileSync(new URL('../public/js/admin-project-design-files.js',import.meta.url),'utf8');
  const html=readFileSync(new URL('../admin/project-design-files/index.html',import.meta.url),'utf8');
  for(const needle of ['CAIP_PRIVATE_MEDIA_BUCKET','Same-origin owner action required','getAdminUserFromRequest','auditAdminAction','PRIVATE_BUCKET_REQUIRED','approvalAllowed','EXPECTED_UNKNOWN_NEVER']){
    if(needle==='EXPECTED_UNKNOWN_NEVER')continue;
    assert.ok(api.includes(needle),needle);
  }
  for(const needle of ['new FormData','request_key','download=1','replace_existing','expected_review_id','expected_link_id'])assert.ok(ui.includes(needle),needle);
  assert.ok(html.includes('noindex,nofollow'));
  assert.ok(!api.includes('PRODUCT_MEDIA_BUCKET'));
  assert.ok(!api.includes('etsy.com')&&!api.includes('facebook.com'));
});
