import fs from 'node:fs';
import path from 'node:path';
import url from 'node:url';

const root=path.resolve(path.dirname(url.fileURLToPath(import.meta.url)),'..');
const source=fs.readFileSync(path.join(root,'functions/api/admin/startup-readiness.js'),'utf8');
const itemsStart=source.indexOf('const STARTUP_ITEMS = ')+22;
const itemsEnd=source.indexOf('\n];',itemsStart)+2;
const items=JSON.parse(source.slice(itemsStart,itemsEnd));
const focusStart=source.indexOf('const GATE_FIX_FOCUS = ')+23;
const focusEnd=source.indexOf('\n};',focusStart)+2;
const focus=Function(`"use strict";return (${source.slice(focusStart,focusEnd)});`)();
const severity=(value)=>value.charAt(0).toUpperCase()+value.slice(1);
const lines=['# Devil n Dove Startup and Go-Live Guide — Build 231','',
  `This is the human-readable operating copy of all ${items.length} database-backed gates in \`/admin/startup-readiness/\`. No prior blocker has been removed. Deployment Preflight, Post-Deploy Smoke Tests, Deploy Readiness, Go-Live Execution, and Live Ops Follow-through now also have standalone gates and separate operating pages. The D1 cockpit remains the status authority. Each gate states how to prepare, test, correct a failure, save evidence, retest, and decide whether the pass condition is met.`,'',
  '## Operating rules','',
  '1. Apply `database_build230_visual_image_manifest.sql` or the identical `database_upgrade_current_pass.sql`, not both. Back up D1 first and confirm Build 229 is already present.','2. Use owner-controlled test records and real Production bindings only where the gate explicitly requires a production test.','3. Never paste secrets, passwords, access tokens, full payment data, or private customer information into gate evidence.','4. A failed numbered step keeps the gate Failed or Blocked until the correction procedure and full retest succeed.','5. Complete and Not Applicable decisions require factual evidence. Reopen a completed gate after a related deployment, credential rotation, schema/provider version, policy, or material data change.','6. Use `PRELAUNCH_PROCESS_PLAYBOOKS.md` for the standalone process order; never use a green specialist page to erase another Startup blocker.','7. The `missing_launch_images` Critical gate, D1 Visual Image Manifest, item-specific Catalog Media evidence, and `IMAGES_REQUIRED.md` capture standard must be complete before go-live; generated editorial art cannot satisfy a real-photo requirement.','8. The guide does not replace legal, accounting, tax, product-safety, platform, printer, or regulatory review.',''];
let phase='';
for(const item of items){
  if(item.phase_label!==phase){phase=item.phase_label;lines.push(`## ${phase}`,'');}
  const route=item.route||'the named internal workflow';
  const correction=focus[item.key]||'correct the authoritative source record or configuration, then repeat the failed step and the full gate';
  lines.push(`### ${item.order}. ${item.title} — **${severity(item.severity)}**`,'',`**Inside the application:** \`${route}\`  `,`**External location:** ${item.external||'None'}  `,`**Production test:** ${item.live?'Yes — use owner-controlled records and save non-secret identifiers.':'No live binding is required, but deployed verification may still be appropriate.'}`,'','#### Before you begin','',`Assign one owner and open ${route}. Record the starting IDs, counts, totals, timestamps, browser/device, environment, and expected result before changing anything. Use owner-controlled test data and never place passwords, access tokens, full payment data, or private customer information in evidence.`,'','#### Test steps','');
  lines.push(...String(item.instructions||'').split('\n').map((entry)=>entry.trim()).filter(Boolean),'','#### If any step fails: correction procedure','',`Do not mark the gate Complete. Set Failed or Blocked and identify the exact numbered step, actual result, request/order/product/event ID, safe log reference, and affected environment. Then ${correction}. Preserve history with audited corrections or new versions instead of silently rewriting financial, inventory, approval, or customer evidence.`,'','#### Evidence to save','',`Save a concise before/after record: date/time and environment; owner; tested route and external console; non-secret record/event/deployment IDs; expected versus actual result for every numbered step; screenshots or approved evidence links; correction made; final rerun result; and confirmation that the stated pass condition is now true.`,'','#### Retest and reopening rule','',`Repeat the failed step first, then repeat the entire gate from a clean browser/session or fresh owner-controlled record. Reopen this gate after any related deployment, credential rotation, schema change, provider-version change, policy change, or material data correction.`,'',`**Pass condition:** ${item.pass}`,'');
}
lines.push('## Gate count and authority','',`This guide contains ${items.length} gates. If it differs from the D1 cockpit after deployment, use the Build 231 API seed, confirm all ${items.length} items return, and keep the gate Failed until the status authority and guide agree.`,'');
fs.writeFileSync(path.join(root,'STARTUP_GO_LIVE_GUIDE.md'),`${lines.join('\n')}\n`);
