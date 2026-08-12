import fs from 'node:fs';
import path from 'node:path';
import url from 'node:url';

const root=path.resolve(path.dirname(url.fileURLToPath(import.meta.url)),'..');
const guide=JSON.parse(fs.readFileSync(path.join(root,'data/site/startup-readiness-guide.json'),'utf8'));
const items=Array.isArray(guide.items)?guide.items:[];
const focus=guide.fix_focus||{};
if(!items.length||new Set(items.map((item)=>item.key)).size!==items.length) throw new Error('Startup guide source is empty or has duplicate item keys.');
const severity=(value)=>String(value||'').charAt(0).toUpperCase()+String(value||'').slice(1);
const lines=[`# Devil n Dove Startup and Go-Live Guide — Build ${guide.build||'current'}`,'',
  `This is the human-readable operating copy of all ${items.length} gates used by \`/admin/startup-readiness/\`. Static test instructions live in \`data/site/startup-readiness-guide.json\`; mutable status, owner, evidence and history remain D1 authority through the compact Startup Readiness API.`,'',
  '## Operating rules','',
  '1. Back up D1 before applying the migration named by the current validation report. Apply the named migration or the byte-identical `database_upgrade_current_pass.sql`, not both.',
  '2. Use owner-controlled test records and real Production bindings only where the gate explicitly requires a production test.',
  '3. Never paste secrets, passwords, access tokens, full payment data, or private customer information into gate evidence.',
  '4. A failed numbered step keeps the gate Failed or Blocked until the correction procedure and full retest succeed.',
  '5. Complete and Not Applicable decisions require factual evidence. Reopen a completed gate after a related deployment, credential rotation, schema/provider version, policy, or material data change.',
  '6. Use `PRELAUNCH_PROCESS_PLAYBOOKS.md` for the standalone process order; never use a green specialist page to erase another Startup blocker.',
  '7. The `missing_launch_images` Critical gate, D1 Visual Image Manifest, item-specific Catalog Media evidence, and `IMAGES_REQUIRED.md` capture standard must be complete before go-live; generated editorial art cannot satisfy a real-photo requirement.',
  '8. The guide does not replace legal, accounting, tax, product-safety, laser/material, platform, printer, or regulatory review.',''];
let phase='';
for(const item of items){
  if(item.phase_label!==phase){phase=item.phase_label;lines.push(`## ${phase}`,'');}
  const route=item.route||'the named internal workflow';
  const correction=focus[item.key]||'correct the authoritative source record or configuration, then repeat the failed step and the full gate';
  lines.push(`### ${item.order}. ${item.title} — **${severity(item.severity)}**`,'',`**Inside the application:** \`${route}\`  `,`**External location:** ${item.external||'None'}  `,`**Production test:** ${item.live?'Yes — use owner-controlled records and save non-secret identifiers.':'No live binding is required, but deployed verification may still be appropriate.'}`,'','#### Before you begin','',`Assign one owner and open ${route}. Record starting IDs/counts/totals, timestamps, browser/device, environment, and expected result before changing anything. Never place secrets or private customer/payment data in evidence.`,'','#### Test steps','');
  lines.push(...String(item.instructions||'').split('\n').map((entry)=>entry.trim()).filter(Boolean),'','#### If any step fails: correction procedure','',`Do not mark the gate Complete. Set Failed or Blocked, identify the exact failed step and safe evidence reference, then ${correction}. Preserve history rather than silently rewriting financial, inventory, approval, or customer evidence.`,'','#### Evidence to save','',`Save date/time and environment; owner; tested route/external console; non-secret record/event/deployment IDs; expected versus actual result; approved proof links; correction made; final rerun result; and confirmation the pass condition is true.`,'','#### Retest and reopening rule','',`Repeat the failed step first, then the entire gate from a clean browser/session or fresh owner-controlled record. Reopen after related deployments, credential rotations, schema/provider changes, policy changes, or material data corrections.`,'',`**Pass condition:** ${item.pass}`,'');
}
lines.push('## Gate count and authority','',`This guide contains ${items.length} gates. If D1 returns fewer status rows, the browser keeps all ${items.length} instructions visible and marks the missing statuses unsynced/degraded until the database is corrected.`,'');
fs.writeFileSync(path.join(root,'STARTUP_GO_LIVE_GUIDE.md'),`${lines.join('\n')}\n`);
console.log(`Generated Startup guide with ${items.length} gates.`);
