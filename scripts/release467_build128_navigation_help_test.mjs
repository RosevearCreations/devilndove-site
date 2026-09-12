import fs from 'node:fs';
const read=(p)=>fs.readFileSync(new URL(`../${p}`,import.meta.url),'utf8');
const req=(ok,msg)=>{if(!ok)throw new Error(msg);};
const help=read('public/js/admin-navigation-help-v128.js');
const auth=read('public/js/site-auth-ui.js');
for(const token of [
  'const BUILD = 128',
  'Admin navigation help',
  'Alt + Shift + H',
  'Ctrl/Cmd + K',
  'Alt + Shift + F',
  "role', 'dialog'",
  "aria-modal', 'true'",
  'ddAdminNavigationHelpTrigger',
  'DDAdminNavigationHelp',
  'dd:admin-navigation-help-ready',
  'MutationObserver',
  "event.key === 'Escape'",
  "event.key === 'Tab'",
]) req(help.includes(token),`navigation help missing ${token}`);
for(const forbidden of ['localStorage','sessionStorage',"method: 'POST'",'method:"POST"','XMLHttpRequest']) req(!help.includes(forbidden),`navigation help contains forbidden behavior ${forbidden}`);
for(const inherited of [
  "import('/public/js/admin-workspace-command-palette-v122.js?v=467b122')",
  "import('/public/js/admin-workspace-preferences-v125.js?v=467b125')",
  "import('/public/js/admin-favorites-quick-launch-v126.js?v=467b126')",
  "import('/public/js/admin-context-breadcrumbs-v127.js?v=467b127')",
  "import('/public/js/admin-navigation-help-v128.js?v=467b128')",
]) req(auth.includes(inherited),`Admin navigation bootstrap missing: ${inherited}`);
console.log('RELEASE 467 BUILD 128 ADMIN NAVIGATION HELP SOURCE PROOF: PASS');
