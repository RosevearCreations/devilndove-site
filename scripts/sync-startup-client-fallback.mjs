import fs from 'node:fs';
import path from 'node:path';
import url from 'node:url';

const root=path.resolve(path.dirname(url.fileURLToPath(import.meta.url)),'..');
const api=fs.readFileSync(path.join(root,'functions/api/admin/startup-readiness.js'),'utf8');
const itemsStart=api.indexOf('const STARTUP_ITEMS = ')+22;
const itemsEnd=api.indexOf('\n];',itemsStart)+2;
const items=JSON.parse(api.slice(itemsStart,itemsEnd));
const file=path.join(root,'public/js/admin-startup-readiness.js');
const current=fs.readFileSync(file,'utf8');
const start=current.indexOf('  const FALLBACK = ');
const end=current.indexOf(';\n',start)+1;
if(start<0||end<=start)throw new Error('FALLBACK declaration was not found.');
const replacement=`  const FALLBACK = ${JSON.stringify(items)};`;
fs.writeFileSync(file,`${current.slice(0,start)}${replacement}${current.slice(end)}`);
