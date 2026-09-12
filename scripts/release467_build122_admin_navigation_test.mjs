#!/usr/bin/env node
import fs from 'node:fs';
const read=(p)=>fs.readFileSync(new URL(`../${p}`,import.meta.url),'utf8');
const palette=read('public/js/admin-workspace-command-palette-v122.js');
const auth=read('public/js/site-auth-ui.js');
const manifest=JSON.parse(read('data/admin-navigation-modules.json'));
const req=(ok,msg)=>{if(!ok)throw new Error(msg);};
req(/const BUILD = 122/.test(palette),'palette build identity missing');
req(palette.includes('/data/admin-navigation-modules.json'),'manifest URL missing');
for(const token of ['dd-admin-workspace-nav','dd-admin-command-palette','Ctrl/Cmd+K','ArrowDown','ArrowUp','Escape','aria-modal','listbox','aria-current','FALLBACK_MODULES'])req(palette.includes(token),`palette missing ${token}`);
for(const forbidden of ['localStorage','sessionStorage',"method: 'POST'",'method:"POST"'])req(!palette.includes(forbidden),`palette contains forbidden behavior ${forbidden}`);
req(auth.includes("import('/public/js/admin-workspace-command-palette-v122.js?v=467b122')"),'shared admin auth loader missing Build 122 palette');
req(auth.includes("window.location.pathname.startsWith('/admin')"),'admin route guard missing');
const modules=manifest.modules||[];req(JSON.stringify(modules.map(x=>x.key))===JSON.stringify(['storefront','creator','finance','it']),'workspace module keys drifted');
const links=modules.flatMap(m=>(m.sections||[]).flatMap(s=>s.links||[]));req(links.length>=50,`expected >=50 current admin tool links, got ${links.length}`);
for(const label of ['Products','Catalog & Inventory','Accounting','Business Health','Application Sanity Check','Today Tasks'])req(links.some(x=>x.label===label),`current navigation missing ${label}`);
console.log('RELEASE 467 BUILD 122 ADMIN NAVIGATION TEST: PASS');
console.log(`Manifest modules: ${modules.length}; current tool links: ${links.length}`);
console.log('Persistence: ZERO; manifest access: GET-only');
