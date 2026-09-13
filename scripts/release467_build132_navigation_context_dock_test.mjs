#!/usr/bin/env node
import fs from 'node:fs';
const body=fs.readFileSync('public/js/admin-navigation-context-dock-v132.js','utf8');
const must=['const BUILD = 132','Navigation context','DDAdminNavigationContextDock','ddAdminNavigationContextDock','ddAdminNavigationContextBody','matchMedia','(max-width: 760px)','MutationObserver','dd:admin-related-tools-ready','dd:admin-section-position-ready','dd:admin-section-map-ready'];
const forbidden=['localStorage','sessionStorage',"method: 'POST'",'XMLHttpRequest'];
for(const token of must){if(!body.includes(token)){console.error('missing',token);process.exit(1);}}
for(const token of forbidden){if(body.includes(token)){console.error('forbidden',token);process.exit(1);}}
console.log('BUILD 132 NAVIGATION CONTEXT DOCK SOURCE PROOF: PASS');
