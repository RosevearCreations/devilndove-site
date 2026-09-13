#!/usr/bin/env node
import fs from 'node:fs';
const body=fs.readFileSync('public/js/admin-related-tools-v129.js','utf8');
const must=['const BUILD = 129',"const MANIFEST_URL = '/data/admin-navigation-modules.json'",'Related tools','ddAdminRelatedTools','DDAdminRelatedTools','dd:admin-related-tools-ready','.slice(0, 4)','MutationObserver',"method: 'GET'"];
const forbidden=['localStorage','sessionStorage',"method: 'POST'",'XMLHttpRequest'];
for(const token of must){if(!body.includes(token)){console.error('missing',token);process.exit(1);}}
for(const token of forbidden){if(body.includes(token)){console.error('forbidden',token);process.exit(1);}}
if(!body.includes("normalizePath(link.href) !== currentPath")){console.error('current route exclusion missing');process.exit(1);}
console.log('BUILD 129 RELATED TOOLS SOURCE PROOF: PASS');
