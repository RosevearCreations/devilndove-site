#!/usr/bin/env node
// Release 467 Build 126 — static acceptance for Admin favorites and quick launch.
import fs from 'node:fs';
const read=(p)=>fs.readFileSync(new URL(`../${p}`,import.meta.url),'utf8');
const favorites=read('public/js/admin-favorites-quick-launch-v126.js');
const auth=read('public/js/site-auth-ui.js');
const memory=read('public/js/admin-workspace-preferences-v125.js');
const palette=read('public/js/admin-workspace-command-palette-v122.js');
const manifest=JSON.parse(read('migrations/canonical/manifest.json'));
const req=(ok,msg)=>{if(!ok)throw new Error(msg);};
for(const token of [
  'const BUILD = 126',
  'dd_admin_favorites_v1',
  'MAX_FAVORITES = 8',
  'dd:admin-ready',
  'user_id',
  'localStorage.getItem',
  'localStorage.setItem',
  'localStorage.removeItem',
  '☆ Favorite',
  '★ Favorited',
  'Favorites (',
  'Clear favorites',
  'DDAdminFavorites',
  'dd:admin-favorites-ready',
  'dd:admin-favorites-changed',
  'event.altKey',
  'event.shiftKey'
]) req(favorites.includes(token),`favorites missing ${token}`);
for(const forbidden of ['sessionStorage',"method: 'POST'",'method:"POST"','fetch(']) req(!favorites.includes(forbidden),`favorites contains forbidden behavior ${forbidden}`);
req(auth.includes("import('/public/js/admin-favorites-quick-launch-v126.js?v=467b126')"),'shared admin auth loader missing Build 126 favorites');
req(auth.includes("import('/public/js/admin-workspace-preferences-v125.js?v=467b125')"),'Build 125 workspace memory bootstrap regressed');
req(auth.includes("import('/public/js/admin-workspace-command-palette-v122.js?v=467b122')"),'Build 122 command palette bootstrap regressed');
req(memory.includes('DDAdminWorkspaceMemory'),'Build 125 workspace memory contract missing');
req(!palette.includes('localStorage') && !palette.includes('sessionStorage'),'Build 122 command palette historical stateless contract drifted');
const files=(manifest.migrations||[]).map(x=>x.file);
req(files.join('|')==='0001_release464_migration_authority.sql|0002_release464_operational_acceptance.sql|0003_release464_business_growth.sql|0004_release465_storefront_quality.sql','canonical migrations drifted');
console.log('RELEASE 467 BUILD 126 FAVORITES QUICK-LAUNCH TEST: PASS');
console.log('Persistence: USER-SCOPED BROWSER LOCALSTORAGE ONLY');
console.log('Favorites: MAX 8 / ADMIN ROUTES ONLY');
console.log('Server/business data writes: NONE');
