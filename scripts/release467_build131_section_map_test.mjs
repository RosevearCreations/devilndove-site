import fs from 'node:fs';
const body=fs.readFileSync('public/js/admin-section-map-v131.js','utf8');
const must=['const BUILD = 131',"const MANIFEST_URL = '/data/admin-navigation-modules.json'",'Section map','DDAdminSectionMap','dd:admin-section-map-ready','Section ${context.sectionIndex + 1} of ${context.sections.length}',"method: 'GET'",'MutationObserver','index === context.sectionIndex','targetForSection(section, context.path)'];
for(const token of must){if(!body.includes(token)){console.error('missing token',token);process.exit(1);}}
for(const forbidden of ['localStorage','sessionStorage',"method: 'POST'"]){if(body.includes(forbidden)){console.error('forbidden token',forbidden);process.exit(1);}}
console.log('BUILD 131 SECTION MAP SOURCE PROOF: PASS');
