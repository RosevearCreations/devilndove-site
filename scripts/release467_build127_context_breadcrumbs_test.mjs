import fs from 'node:fs';
const read=(p)=>fs.readFileSync(new URL(`../${p}`,import.meta.url),'utf8');
const req=(ok,msg)=>{if(!ok)throw new Error(msg);};
const breadcrumbs=read('public/js/admin-context-breadcrumbs-v127.js');
const auth=read('public/js/site-auth-ui.js');
for(const token of [
  'const BUILD = 127',
  "const MANIFEST_URL = '/data/admin-navigation-modules.json'",
  "method: 'GET'",
  "aria-label', 'Admin context'",
  'ddAdminContextBreadcrumbs',
  'ddAdminWorkspaceReturn',
  'Back to ${context.module.label}',
  "aria-current', 'page'",
  'DDAdminContextBreadcrumbs',
  'dd:admin-context-breadcrumbs-ready',
  'MutationObserver',
]) req(breadcrumbs.includes(token),`breadcrumbs missing ${token}`);
for(const forbidden of ['localStorage','sessionStorage',"method: 'POST'",'method:"POST"','XMLHttpRequest']) req(!breadcrumbs.includes(forbidden),`breadcrumbs contains forbidden behavior ${forbidden}`);
req(auth.includes("import('/public/js/admin-context-breadcrumbs-v127.js?v=467b127')"),'shared auth loader missing Build 127 breadcrumbs');
for(const inherited of [
  "import('/public/js/admin-workspace-command-palette-v122.js?v=467b122')",
  "import('/public/js/admin-workspace-preferences-v125.js?v=467b125')",
  "import('/public/js/admin-favorites-quick-launch-v126.js?v=467b126')",
]) req(auth.includes(inherited),`inherited Admin convenience layer missing: ${inherited}`);
console.log('RELEASE 467 BUILD 127 CONTEXT BREADCRUMBS SOURCE PROOF: PASS');
