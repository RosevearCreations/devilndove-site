import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';

const page=readFileSync(new URL('../admin/social-publishing/index.html',import.meta.url),'utf8');
const bridge=readFileSync(new URL('../public/js/admin-social-post-queue.js',import.meta.url),'utf8');
const caipBridge=bridge.slice(bridge.indexOf('/* Build 671: CAIP source selection'));
const home=readFileSync(new URL('../admin/index.html',import.meta.url),'utf8');

test('social creator is reachable and requires an explicit review draft',()=>{
  assert.match(page,/id="dd671-social-creator"/);
  assert.match(page,/admin-social-post-queue\.js/);
  assert.match(page,/id="dd671Confirm" required/);
  assert.match(caipBridge,/post_status:'draft'/);
  assert.match(caipBridge,/source_type:'caip_project'/);
});
test('CAIP originals are referenced only, never published or copied to post media',()=>{
  assert.match(caipBridge,/creative_asset_ids/);
  assert.match(caipBridge,/image_urls:\[\],video_url:''/);
  assert.doesNotMatch(caipBridge,/publish_platforms|graph\.facebook\.com|r2_upload_id/);
  assert.match(caipBridge,/creative_project_id=\$\{selectedProject\}/);
});
test('each previously empty owner card has an existing distinct image',()=>{
  const matches=[...home.matchAll(/\.dd-brand-v3-admin-card\[href\*="([^"]+)"\]::before\{background-image:url\('([^']+)'\)/g)];
  assert.ok(matches.length>=10);
  const paths=matches.map(m=>m[2]);assert.equal(paths.length,new Set(paths).size);
  for(const asset of paths)assert.ok(existsSync(new URL('..'+asset,import.meta.url)),asset);
});
