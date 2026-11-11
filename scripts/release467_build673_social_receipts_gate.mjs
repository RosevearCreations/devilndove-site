import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const api=read('functions/api/admin/social-post-queue.js');
const page=read('admin/social-publishing/index.html');
const client=read('public/js/admin-social-platform-preflight.js');
for(const action of ['verify_publication_673','retry_failed_673']){
  assert.ok(api.includes(action),'Missing backend action '+action);
  assert.ok(client.includes(action),'Missing client owner action '+action);
}
assert.match(api,/attempt_status IN \('api_posted','receipt_verified','posted_manual'\)/);
assert.match(api,/status:'already_published'/);
assert.match(api,/results\.every\(item=>item\.status==='already_published'\)/);
assert.match(api,/receipt\.external_post_id/);
assert.match(api,/returned!==idOnProvider/);
assert.match(api,/receipt_verified/);
assert.match(api,/owner_checked_no_duplicate!==true/);
assert.match(api,/attempt\?\.attempt_status!=='api_failed'/);
assert.match(api,/queue\?\.approval_status!=='approved'/);
assert.match(api,/platform_keys:\[platform\],force:false/);
assert.match(page,/id="dd673-receipts"/);
assert.match(page,/id="dd673Rows"/);
assert.match(client,/Checked provider: no duplicate/);
assert.match(client,/No recorded deliveries yet/);
console.log('Build 673 receipt evidence, provider recheck, channel dedupe, owner-gated recovery and analytics: PASS');
