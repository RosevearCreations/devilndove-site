#!/usr/bin/env node
// Release 467 Build 125 — static acceptance for admin user preferences/workspace memory.
import fs from 'node:fs';
const read=(p)=>fs.readFileSync(new URL(`../${p}`,import.meta.url),'utf8');
const memory=read('public/js/admin-workspace-preferences-v125.js');
const auth=read('public/js/site-auth-ui.js');
const palette=read('public/js/admin-workspace-command-palette-v122.js');
const manifest=JSON.parse(read('migrations/canonical/manifest.json'));
const req=(ok,msg)=>{if(!ok)throw new Error(msg);};
for(const token of [
  'const BUILD = 125',
  "dd_admin_workspace_preferences_v1",
  "dd_admin_workspace_memory_v1",
  "remember_last_workspace",
  "show_recent_tools",
  "recent_limit",
  "dd:admin-ready",
  "user_id",
  "localStorage.getItem",
  "localStorage.setItem",
  "localStorage.removeItem",
  "Clear workspace memory",
  "Resume:",
  "DDAdminWorkspaceMemory",
  "dd:workspace-memory-ready"
]) req(memory.includes(token),`workspace memory missing ${token}`);
for(const forbidden of ['sessionStorage',"method: 'POST'","method:\"POST\"",'fetch(']) req(!memory.includes(forbidden),`workspace memory contains forbidden behavior ${forbidden}`);
req(auth.includes("import('/public/js/admin-workspace-preferences-v125.js?v=467b125')"),'shared admin auth loader missing Build 125 workspace memory');
req(auth.includes("import('/public/js/admin-workspace-command-palette-v122.js?v=467b122')"),'Build 122 command palette bootstrap regressed');
req(!palette.includes('localStorage') && !palette.includes('sessionStorage'),'Build 122 command palette historical stateless contract drifted');
const files=(manifest.migrations||[]).map(x=>x.file);
req(files.join('|')==='0001_release464_migration_authority.sql|0002_release464_operational_acceptance.sql|0003_release464_business_growth.sql|0004_release465_storefront_quality.sql','canonical migrations drifted');
console.log('RELEASE 467 BUILD 125 WORKSPACE MEMORY TEST: PASS');
console.log('Persistence: USER-SCOPED BROWSER LOCALSTORAGE ONLY');
console.log('Server/business data writes: NONE');
