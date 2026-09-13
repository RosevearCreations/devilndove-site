#!/usr/bin/env node
import fs from 'node:fs';
const body=fs.readFileSync('public/js/admin-navigation-context-dock-v132.js','utf8');
const must=['const SUMMARY_BUILD = 133','locationCue','updateSummary','ddAdminNavigationContextSummary','Navigation context ·','context panels','data-dd-admin-section-position','data-dd-admin-section-map'];
const forbidden=['localStorage','sessionStorage',"method: 'POST'",'XMLHttpRequest'];
for(const token of must){if(!body.includes(token)){console.error('missing',token);process.exit(1);}}
for(const token of forbidden){if(body.includes(token)){console.error('forbidden',token);process.exit(1);}}
console.log('RELEASE 467 BUILD 133 NAVIGATION CONTEXT SUMMARY SOURCE PROOF: PASS');
