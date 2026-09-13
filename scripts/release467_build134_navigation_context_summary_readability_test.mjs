import fs from 'node:fs';
const src=fs.readFileSync(new URL('../public/js/admin-navigation-context-dock-v132.js',import.meta.url),'utf8');
const required=['const SUMMARY_BUILD = 134','dd-admin-navigation-context-summary-label','dd-admin-navigation-context-summary-count','text-overflow:ellipsis','white-space:nowrap','summary.replaceChildren(label,count)','summary.title=fullText','ddAdminNavigationContextFullText','aria-label','locationCue()'];
const missing=required.filter(token=>!src.includes(token));
if(missing.length){console.error('BUILD 134 SUMMARY READABILITY TEST: FAIL');for(const token of missing)console.error('-',token);process.exit(1);}
for(const forbidden of ['localStorage','sessionStorage',"fetch(",'XMLHttpRequest']){if(src.includes(forbidden)){console.error('BUILD 134 SUMMARY READABILITY TEST: FAIL forbidden',forbidden);process.exit(1);}}
console.log('BUILD 134 SUMMARY READABILITY TEST: PASS');
