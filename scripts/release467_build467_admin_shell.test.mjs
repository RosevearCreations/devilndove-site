import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {ADMIN_THEMES_467,ADMIN_SHELL_LINKS_467,ADMIN_SHELL_PAGES_467,adminHelpFor467,adminPageHelp467,normalizeAdminTheme467} from '../public/js/admin-shell-policy-467.mjs';

const file=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const pages=['admin/index.html','admin/maker-workbench/index.html','admin/maker-owner-trials/index.html',
 'admin/maker-pilot-closure/index.html','admin/maker-trial-debrief/index.html','admin/maker-product-safety/index.html'];

test('Build 467 theme keys are explicit, stable and fail closed to existing Standard',()=>{
 assert.deepEqual(ADMIN_THEMES_467.map(x=>x.key),['standard','purple']);
 for(const value of ['Purple','gold','__proto__','',null,undefined])assert.equal(normalizeAdminTheme467(value),'standard');
 assert.equal(normalizeAdminTheme467('purple'),'purple');
 assert.equal(new Set(ADMIN_SHELL_LINKS_467.map(x=>x.key)).size,ADMIN_SHELL_LINKS_467.length);
 assert.equal(new Set(ADMIN_SHELL_PAGES_467).size,ADMIN_SHELL_PAGES_467.length);
});

test('Build 467 help is tied to source authority and never claims business approval',()=>{
 assert.match(adminHelpFor467('Orders and returns'),/original fulfillment ledger/);
 assert.match(adminHelpFor467('Tools inventory'),/Inventory owns/);
 assert.match(adminHelpFor467('Canadian product safety'),/cannot certify/);
 assert.match(adminHelpFor467('Maker trial debrief'),/original scoped Maker trial/);
 assert.match(adminHelpFor467('Public video stories'),/separate owner approval/);
 assert.match(adminPageHelp467('maker-pilot-closure'),/HOLD/);
 assert.match(adminPageHelp467('maker-product-safety'),/cannot certify/);
 assert.match(adminPageHelp467('unknown'),/Nothing in this Help panel/);
});

test('Build 467 additive shell is loaded exactly once on each designated original Admin page',()=>{
 assert.equal(pages.length,ADMIN_SHELL_PAGES_467.length);
 for(const path of pages){
  const html=file(path);
  assert.equal((html.match(/\/public\/css\/admin-shell-467\.css\?v=467b467/g)||[]).length,1,path);
  assert.equal((html.match(/\/public\/js\/admin-shell-467\.js\?v=467b467/g)||[]).length,1,path);
  assert.match(html,/data-admin-page="[^"]+"/);
  assert.match(html,/admin-shell-467\.js\?v=467b467"><\/script><\/body>/);
 }
 const home=file('admin/index.html');
 assert.match(home,/type="application\/x-dd-historical"/);
 assert.match(home,/admin-home-on-demand-v398/);
 assert.match(home,/ddBrandV3AdminWorkspaces/);
});

test('Build 467 has keyboard-friendly, source-linked, non-mutating interaction',()=>{
 const ui=file('public/js/admin-shell-467.js');
 const css=file('public/css/admin-shell-467.css');
 assert.match(ui,/aria-label/);assert.match(ui,/aria-describedby/);
 assert.match(ui,/aria-live/);assert.match(ui,/DOMContentLoaded/);
 assert.match(ui,/createElement/);assert.match(ui,/textContent/);
 assert.match(ui,/normalizeAdminTheme467/);assert.match(ui,/window\.localStorage/);
 assert.doesNotMatch(ui,/\bfetch\s*\(|XMLHttpRequest|MutationObserver|setInterval\s*\(|innerHTML|sendBeacon|location\.assign/);
 assert.doesNotMatch(ui,/method:\s*['"](?:POST|PUT|DELETE|PATCH)['"]/);
 assert.match(css,/:focus-visible/);assert.match(css, /prefers-reduced-motion/);
 assert.match(css,/forced-colors/);assert.match(css,/max-width:640px/);
 assert.match(css,/body\[data-dd-admin-theme="purple"\]/);
 assert.match(css,/Standard leaves existing Admin visuals intact/);
});

test('Build 467 guide identifies real-world accessibility/owner trial as independent HOLD',()=>{
 const docs=file('docs/operations/RELEASE_467_BUILD_467_ADMIN_SHELL_THEMES_HELP.md');
 assert.match(docs,/real browser/i);assert.match(docs,/HOLD/);
 assert.match(docs,/Canada-first/);assert.match(docs,/U\.S\. shipping/);
 assert.match(docs,/no D1|D1 reads/);
});
