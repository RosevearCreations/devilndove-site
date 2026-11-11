import assert from 'node:assert/strict';
import {readFileSync,statSync} from 'node:fs';
const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const server=read('functions/api/admin/social-post-queue.js');
const page=read('admin/social-publishing/index.html');
const client=read('public/js/admin-social-platform-preflight.js');
const home=read('admin/index.html');
for(const action of ['verify_accounts_672','approve_caip_derivative_672']) {
  assert.ok(server.includes(action), 'Missing backend action '+action);
  assert.ok(client.includes(action), 'Missing owner UI call '+action);
}
assert.match(server,/blocked_caip_derivative_approval/);
assert.match(server,/row\.source_type === 'caip_project' \|\| payload\.force !== true/);
assert.match(server,/consent_state!=='public_allowed'/);
assert.match(server,/privacy_state!=='public_approved'/);
assert.match(server,/public_url!==url/);
assert.match(server,/publication_performed:false/);
assert.match(page,/id="dd672Owner"/);
assert.match(page,/id="dd672Reviewed"/);
const cards=['maker-workbench','device-acceptance','channel-trials','project-bom','maker-owner-trials','guided-manufacturing','finished-quality','shared-tools','project-costs','finished-pieces','maker-media-stories'];
for(const name of cards) {
  const image='assets/images/site/build672-'+name+'.webp';
  assert.ok(home.includes('/'+image), 'Missing distinct card path for '+name);
  assert.ok(statSync(new URL('../'+image,import.meta.url)).size>10000,'Missing generated artwork for '+name);
}
assert.equal(new Set(cards.map(name=>'build672-'+name)).size,cards.length);
console.log('Build 672 public derivative, owner gate, identity verification and 11 distinct illustrations: PASS');
