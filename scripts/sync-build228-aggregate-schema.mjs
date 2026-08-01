import fs from 'node:fs';
import path from 'node:path';
import url from 'node:url';

const root=path.resolve(path.dirname(url.fileURLToPath(import.meta.url)),'..');
const marker='-- Build 228 — master Creative Automation workflow and clear prelaunch stages.';
const migration=fs.readFileSync(path.join(root,'database_build228_creative_automation_prelaunch_stages.sql'),'utf8');
const body=migration.slice(migration.indexOf('CREATE TABLE IF NOT EXISTS creative_automation_workflows')).trim();
fs.writeFileSync(path.join(root,'database_upgrade_current_pass.sql'),migration);
for(const name of ['database_schema.sql','database_full_schema.sql','database_store_schema.sql']){
  const file=path.join(root,name);
  let current=fs.readFileSync(file,'utf8');
  const at=current.indexOf(marker);
  if(at>=0) current=current.slice(0,at).trimEnd();
  fs.writeFileSync(file,`${current}\n\n${marker}\n${body}\n`);
}
