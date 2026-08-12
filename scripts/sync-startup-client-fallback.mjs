import fs from 'node:fs';
import path from 'node:path';
import url from 'node:url';

const root=path.resolve(path.dirname(url.fileURLToPath(import.meta.url)),'..');
const guide=JSON.parse(fs.readFileSync(path.join(root,'data/site/startup-readiness-guide.json'),'utf8'));
const items=Array.isArray(guide.items)?guide.items:[];
if(!items.length||new Set(items.map((item)=>item.key)).size!==items.length) throw new Error('Startup guide source is empty or has duplicate item keys.');
const file=path.join(root,'public/js/admin-startup-readiness.js');
const current=fs.readFileSync(file,'utf8');
const start=current.indexOf('  const FALLBACK = ');
const end=current.indexOf(';\n',start)+1;
if(start<0||end<=start)throw new Error('FALLBACK declaration was not found.');
const replacement=`  const FALLBACK = ${JSON.stringify(items)};`;
fs.writeFileSync(file,`${current.slice(0,start)}${replacement}${current.slice(end)}`);
console.log(`Synchronized ${items.length} Startup gates from data/site/startup-readiness-guide.json.`);
