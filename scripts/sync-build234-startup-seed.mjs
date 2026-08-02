import fs from 'node:fs';
import path from 'node:path';
import url from 'node:url';

const root=path.resolve(path.dirname(url.fileURLToPath(import.meta.url)),'..');
const source=fs.readFileSync(path.join(root,'functions/api/admin/startup-readiness.js'),'utf8');
const itemsStart=source.indexOf('const STARTUP_ITEMS = ')+22;
const itemsEnd=source.indexOf('\n];',itemsStart)+2;
const items=JSON.parse(source.slice(itemsStart,itemsEnd));
if(items.length!==44)throw new Error(`Expected 44 Build 234 Startup gates, found ${items.length}.`);
const quote=(value)=>`'${String(value??'').replaceAll("'","''")}'`;
const rows=items.map((item)=>`(${[
  quote(item.key),quote(item.phase),quote(item.phase_label),quote(item.title),Number(item.order),quote(item.severity),1,Number(item.live||0),
  quote(item.route),quote(item.external),quote(item.instructions),quote(item.pass),1
].join(',')})`).join(',\n');
const start='-- Build 234 startup gate seed BEGIN';
const end='-- Build 234 startup gate seed END';
const block=`${start}\nINSERT INTO startup_readiness_items (\n  item_key,phase_key,phase_label,item_title,sort_order,blocker_severity,is_launch_blocker,requires_live_binding,\n  target_route,external_location,instructions_markdown,pass_condition,is_active\n) VALUES\n${rows}\nON CONFLICT(item_key) DO UPDATE SET\n  phase_key=excluded.phase_key,\n  phase_label=excluded.phase_label,\n  item_title=excluded.item_title,\n  sort_order=excluded.sort_order,\n  blocker_severity=excluded.blocker_severity,\n  is_launch_blocker=excluded.is_launch_blocker,\n  requires_live_binding=excluded.requires_live_binding,\n  target_route=excluded.target_route,\n  external_location=excluded.external_location,\n  instructions_markdown=excluded.instructions_markdown,\n  pass_condition=excluded.pass_condition,\n  is_active=1,\n  updated_at=CURRENT_TIMESTAMP;\n${end}`;
const migrationPath=path.join(root,'database_build234_packaging_templates_creative_cleanup.sql');
let migration=fs.readFileSync(migrationPath,'utf8');
const present=migration.indexOf(start);
if(present>=0){
  const finish=migration.indexOf(end,present);
  if(finish<0)throw new Error('Build 234 Startup gate seed end marker is missing.');
  migration=`${migration.slice(0,present)}${block}${migration.slice(finish+end.length)}`;
}else{
  const ledger=migration.indexOf('CREATE TABLE IF NOT EXISTS schema_migration_ledger');
  if(ledger<0)throw new Error('Build 234 ledger insertion point is missing.');
  migration=`${migration.slice(0,ledger).trimEnd()}\n\n${block}\n\n${migration.slice(ledger)}`;
}
fs.writeFileSync(migrationPath,migration);
console.log(`Synchronized ${items.length} Startup gates into the Build 234 migration.`);
