#!/usr/bin/env node
import fs from 'node:fs';
const body=fs.readFileSync('public/js/admin-section-position-v130.js','utf8');
const must=['const BUILD = 130',"const MANIFEST_URL = '/data/admin-navigation-modules.json'",'Section position','DDAdminSectionPosition','dd:admin-section-position-ready','context.index - 1','context.index + 1','Tool ${context.index + 1} of ${total}','MutationObserver',"method: 'GET'"];
const forbidden=['localStorage','sessionStorage',"method: 'POST'",'XMLHttpRequest'];
for(const token of must){if(!body.includes(token)){console.error('missing',token);process.exit(1);}}
for(const token of forbidden){if(body.includes(token)){console.error('forbidden',token);process.exit(1);}}
if(!body.includes("context.index > 0 ? context.links[context.index - 1] : null")){console.error('previous boundary missing');process.exit(1);}
if(!body.includes("context.index + 1 < total ? context.links[context.index + 1] : null")){console.error('next boundary missing');process.exit(1);}
console.log('BUILD 130 SECTION POSITION SOURCE PROOF: PASS');
