import fs from 'node:fs';
import path from 'node:path';
import url from 'node:url';

const root=path.resolve(path.dirname(url.fileURLToPath(import.meta.url)),'..');
const marker='-- Devil n Dove Build 240 — operational evidence, packaging continuity,';
const migrationPath=path.join(root,'database_build240_operational_evidence_continuity.sql');
const migration=fs.readFileSync(migrationPath,'utf8');
if(!migration.startsWith(marker))throw new Error('Build 240 migration marker is missing.');
if(/^\s*(BEGIN(?:\s+TRANSACTION)?|COMMIT|SAVEPOINT|RELEASE(?:\s+SAVEPOINT)?|ROLLBACK)\b/im.test(migration))throw new Error('Build 240 migration must not contain explicit SQL transaction statements.');
for(const name of ['database_schema.sql','database_full_schema.sql','database_store_schema.sql']){
  const file=path.join(root,name);
  let current=fs.readFileSync(file,'utf8');
  const at=current.indexOf(marker);
  if(at>=0)current=current.slice(0,at).trimEnd();
  fs.writeFileSync(file,`${current}\n\n${migration.trim()}\n`);
}
fs.writeFileSync(path.join(root,'database_upgrade_current_pass.sql'),migration);
console.log('Build 240 aggregate schemas and current-pass migration synchronized.');
