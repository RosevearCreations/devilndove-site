// Build 268 — read-only full D1 schema audit against database_full_schema.sql.
// This endpoint never mutates production D1. It reports drift and previews additive-only repairs.
import { getAdminUserFromRequest, getDb, jsonResponse } from '../_lib/adminAudit.js';
import { FULL_SCHEMA_REQUIREMENTS } from '../_lib/fullSchemaRequirements.js';

function rows(result){ return Array.isArray(result?.results) ? result.results : []; }
function text(value){ return String(value == null ? '' : value).trim(); }
function qid(value){ return `"${String(value).replace(/"/g,'""')}"`; }
function affinity(type){
  const t=text(type).toUpperCase();
  if(!t) return 'BLOB';
  if(t.includes('INT')) return 'INTEGER';
  if(t.includes('CHAR')||t.includes('CLOB')||t.includes('TEXT')) return 'TEXT';
  if(t.includes('BLOB')) return 'BLOB';
  if(t.includes('REAL')||t.includes('FLOA')||t.includes('DOUB')) return 'REAL';
  return 'NUMERIC';
}
function sameCols(a,b){ return a.length===b.length && a.every((v,i)=>v===b[i]); }
function buildAddColumn(table,column,spec){
  const [,type,notnull,dflt,pk]=spec;
  if(Number(pk)>0) return {safe:false,reason:'Primary-key columns cannot be added safely to an existing populated SQLite table with ALTER TABLE.'};
  if(Number(notnull)>0 && (dflt===null || dflt===undefined)) return {safe:false,reason:'NOT NULL column has no default; existing rows need an explicit backfill plan.'};
  const parts=[`ALTER TABLE ${qid(table)} ADD COLUMN ${qid(column)}`];
  if(text(type)) parts.push(text(type));
  if(Number(notnull)>0) parts.push('NOT NULL');
  if(dflt!==null && dflt!==undefined) parts.push(`DEFAULT ${dflt}`);
  return {safe:true,sql:parts.join(' ')+';'};
}
function paymentRefundCompatRecipe(liveByTable){
  const cols=liveByTable.get('payment_refunds');
  if(!cols || cols.has('refund_id') || !cols.has('payment_refund_id')) return [];
  return [
    '-- Compatibility repair: older payment_refunds uses payment_refund_id while current code/FKs use refund_id.',
    'ALTER TABLE payment_refunds ADD COLUMN refund_id INTEGER;',
    'UPDATE payment_refunds SET refund_id=payment_refund_id WHERE refund_id IS NULL;',
    'CREATE UNIQUE INDEX IF NOT EXISTS uq_payment_refunds_refund_id ON payment_refunds(refund_id);',
    'CREATE TRIGGER IF NOT EXISTS trg_payment_refunds_sync_refund_id_after_insert AFTER INSERT ON payment_refunds WHEN NEW.refund_id IS NULL BEGIN UPDATE payment_refunds SET refund_id=NEW.payment_refund_id WHERE payment_refund_id=NEW.payment_refund_id; END;',
    'CREATE TRIGGER IF NOT EXISTS trg_payment_refunds_protect_refund_id_after_update AFTER UPDATE OF payment_refund_id ON payment_refunds WHEN NEW.refund_id IS NULL OR NEW.refund_id<>NEW.payment_refund_id BEGIN UPDATE payment_refunds SET refund_id=NEW.payment_refund_id WHERE payment_refund_id=NEW.payment_refund_id; END;'
  ];
}

export async function onRequestGet(context){
  const adminUser=await getAdminUserFromRequest(context.request,context.env);
  if(!adminUser) return jsonResponse({ok:false,error:'Admin access required.'},401);
  const db=getDb(context.env);
  if(!db) return jsonResponse({ok:false,error:'Database binding is not configured.'},500);
  try{
    const tableRows=rows(await db.prepare(`SELECT name,type FROM sqlite_schema WHERE type IN ('table','view') AND name NOT LIKE 'sqlite_%' ORDER BY name`).all());
    const liveColumnRows=rows(await db.prepare(`SELECT m.name AS table_name,p.cid AS cid,p.name AS column_name,p.type AS column_type,p.[notnull] AS is_not_null,p.dflt_value AS default_value,p.pk AS pk FROM sqlite_schema AS m JOIN pragma_table_info(m.name) AS p WHERE m.type='table' AND m.name NOT LIKE 'sqlite_%' ORDER BY m.name,p.cid`).all());
    const liveIndexRows=rows(await db.prepare(`SELECT m.name AS table_name,il.name AS index_name,il.[unique] AS is_unique,il.origin AS origin,ii.seqno AS seqno,ii.name AS column_name FROM sqlite_schema AS m JOIN pragma_index_list(m.name) AS il JOIN pragma_index_info(il.name) AS ii WHERE m.type='table' AND m.name NOT LIKE 'sqlite_%' ORDER BY m.name,il.name,ii.seqno`).all());
    const liveFkRows=rows(await db.prepare(`SELECT m.name AS child_table,fkl.id AS fk_id,fkl.seq AS fk_seq,fkl.[table] AS parent_table,fkl.[from] AS child_column,fkl.[to] AS parent_column,fkl.on_update AS on_update,fkl.on_delete AS on_delete FROM sqlite_schema AS m JOIN pragma_foreign_key_list(m.name) AS fkl WHERE m.type='table' AND m.name NOT LIKE 'sqlite_%' ORDER BY m.name,fkl.id,fkl.seq`).all());

    const liveTableNames=new Set(tableRows.filter(r=>r.type==='table').map(r=>text(r.name)));
    const liveByTable=new Map();
    const liveColumnSpec=new Map();
    for(const row of liveColumnRows){
      const t=text(row.table_name), c=text(row.column_name); if(!liveByTable.has(t)) liveByTable.set(t,new Set()); liveByTable.get(t).add(c);
      liveColumnSpec.set(`${t}.${c}`,row);
    }
    const missingTables=[]; const missingColumns=[]; const typeWarnings=[]; const pkWarnings=[]; const extraTables=[]; const extraColumns=[];
    for(const [table,expectedCols] of Object.entries(FULL_SCHEMA_REQUIREMENTS.tables||{})){
      if(!liveTableNames.has(table)){ missingTables.push(table); continue; }
      const liveCols=liveByTable.get(table)||new Set();
      const expectedNames=new Set(expectedCols.map(c=>c[0]));
      for(const spec of expectedCols){
        const [name,type,, ,pk]=spec;
        if(!liveCols.has(name)){ missingColumns.push({table,column:name,expected_type:type||'',not_null:Boolean(spec[2]),default_value:spec[3],pk:Number(pk)||0}); continue; }
        const live=liveColumnSpec.get(`${table}.${name}`)||{};
        if(type && live.column_type && affinity(type)!==affinity(live.column_type)) typeWarnings.push({table,column:name,expected_type:type,live_type:live.column_type});
        if(Number(pk)!==Number(live.pk||0) && (Number(pk)>0 || Number(live.pk||0)>0)) pkWarnings.push({table,column:name,expected_pk:Number(pk),live_pk:Number(live.pk||0)});
      }
      for(const c of liveCols){ if(!expectedNames.has(c)) extraColumns.push({table,column:c}); }
    }
    const expectedTableNames=new Set(Object.keys(FULL_SCHEMA_REQUIREMENTS.tables||{}));
    for(const t of liveTableNames){ if(!expectedTableNames.has(t) && t!=='_cf_KV') extraTables.push(t); }

    const liveIndexMap=new Map();
    for(const row of liveIndexRows){ const key=`${text(row.table_name)}::${text(row.index_name)}`; if(!liveIndexMap.has(key)) liveIndexMap.set(key,{table:text(row.table_name),name:text(row.index_name),unique:Number(row.is_unique)||0,origin:text(row.origin),columns:[]}); liveIndexMap.get(key).columns[Number(row.seqno)||0]=text(row.column_name); }
    const liveExplicitIndexNames=new Set(Array.from(liveIndexMap.values()).map(v=>v.name));
    const missingIndexes=[];
    for(const [name,table,sql] of FULL_SCHEMA_REQUIREMENTS.indexes||[]){ if(!liveExplicitIndexNames.has(name)) missingIndexes.push({name,table,sql,unique:/^\s*CREATE\s+UNIQUE\s+INDEX/i.test(sql||'')}); }

    const liveFkSet=new Set(liveFkRows.map(r=>[text(r.child_table),text(r.parent_table),text(r.child_column),text(r.parent_column),text(r.on_update).toUpperCase(),text(r.on_delete).toUpperCase()].join('|')));
    const missingForeignKeys=[];
    for(const fk of FULL_SCHEMA_REQUIREMENTS.foreign_keys||[]){ const key=[fk[0],fk[1],fk[2],fk[3],text(fk[4]).toUpperCase(),text(fk[5]).toUpperCase()].join('|'); if(!liveFkSet.has(key)) missingForeignKeys.push({child_table:fk[0],parent_table:fk[1],child_column:fk[2],parent_column:fk[3],on_update:fk[4],on_delete:fk[5]}); }

    const pkByTable=new Map();
    for(const row of liveColumnRows){ if(Number(row.pk)>0){ const t=text(row.table_name); if(!pkByTable.has(t)) pkByTable.set(t,[]); pkByTable.get(t).push([Number(row.pk),text(row.column_name)]); } }
    for(const [t,list] of pkByTable) pkByTable.set(t,list.sort((a,b)=>a[0]-b[0]).map(v=>v[1]));
    const uniqueByTable=new Map();
    for(const idx of liveIndexMap.values()){ if(!idx.unique) continue; if(!uniqueByTable.has(idx.table)) uniqueByTable.set(idx.table,[]); uniqueByTable.get(idx.table).push(idx.columns.filter(Boolean)); }
    const fkGroups=new Map();
    for(const row of liveFkRows){ const key=`${text(row.child_table)}::${Number(row.fk_id)||0}`; if(!fkGroups.has(key)) fkGroups.set(key,{child_table:text(row.child_table),parent_table:text(row.parent_table),pairs:[]}); fkGroups.get(key).pairs.push([Number(row.fk_seq)||0,text(row.child_column),text(row.parent_column)]); }
    const invalidForeignKeyParents=[];
    for(const group of fkGroups.values()){
      group.pairs.sort((a,b)=>a[0]-b[0]); const parentCols=group.pairs.map(v=>v[2]);
      const pk=pkByTable.get(group.parent_table)||[]; const unique=uniqueByTable.get(group.parent_table)||[];
      const valid=sameCols(pk,parentCols)||unique.some(cols=>sameCols(cols,parentCols));
      if(!valid) invalidForeignKeyParents.push({child_table:group.child_table,parent_table:group.parent_table,child_columns:group.pairs.map(v=>v[1]),parent_columns:parentCols,reason:'Referenced parent column set is not a live PRIMARY KEY or UNIQUE key.'});
    }

    let quickCheck={status:'unknown',rows:[]};
    try{ const qr=rows(await db.prepare('PRAGMA quick_check').all()); quickCheck={status:qr.every(r=>String(Object.values(r)[0]||'').toLowerCase()==='ok')?'ok':'fail',rows:qr.slice(0,100)}; }catch(error){ quickCheck={status:'error',error:String(error?.message||error)}; }
    let foreignKeyCheck={status:'unknown',issues:[]};
    try{ const fr=rows(await db.prepare('PRAGMA foreign_key_check').all()); foreignKeyCheck={status:fr.length?'fail':'ok',issues:fr.slice(0,200),issue_count:fr.length}; }catch(error){ foreignKeyCheck={status:'error',error:String(error?.message||error)}; }

    const repairLines=['-- Devil n Dove live D1 additive-only repair PREVIEW.','-- Generated read-only from the live schema. Review/back up before executing anything.','-- No DROP TABLE, DELETE, destructive rename, or data replacement is generated.'];
    const manual=[];
    const compat=paymentRefundCompatRecipe(liveByTable); if(compat.length) repairLines.push('',...compat);
    for(const miss of missingColumns){
      if(miss.table==='payment_refunds'&&miss.column==='refund_id'&&compat.length) continue;
      const spec=(FULL_SCHEMA_REQUIREMENTS.tables[miss.table]||[]).find(c=>c[0]===miss.column); if(!spec) continue;
      const candidate=buildAddColumn(miss.table,miss.column,spec);
      if(candidate.safe) repairLines.push(candidate.sql); else manual.push({...miss,reason:candidate.reason});
    }
    for(const idx of missingIndexes){ manual.push({index:idx.name,table:idx.table,reason:idx.unique?'UNIQUE index creation requires duplicate-data review before execution.':'Index is missing. Review after required columns/tables are repaired; the full audit does not auto-create indexes against live production.'}); }
    for(const table of missingTables) manual.push({table,reason:'Missing table requires its canonical CREATE TABLE migration; the full audit never auto-creates tables against live production.'});
    for(const fk of missingForeignKeys) manual.push({...fk,reason:'SQLite cannot safely add a foreign-key constraint to an existing populated table without a controlled table rebuild.'});
    for(const issue of pkWarnings) manual.push({...issue,reason:'Primary-key drift requires manual migration planning; no table rebuild is generated automatically.'});
    for(const issue of invalidForeignKeyParents) manual.push({...issue,reason:'Foreign-key parent key is not PRIMARY KEY/UNIQUE in the live schema; inspect data before adding a unique constraint.'});

    const criticalMissing=missingColumns.filter(x=>['media_assets','creative_assets','caip_media_upload_files','caip_media_upload_sessions','caip_media_upload_parts','payment_refunds','customer_documents','creative_projects'].includes(x.table));
    const failCount=missingTables.length+missingColumns.length+pkWarnings.length+invalidForeignKeyParents.length+(foreignKeyCheck.status==='fail'?foreignKeyCheck.issue_count||1:0);
    const warningCount=typeWarnings.length+missingIndexes.length+missingForeignKeys.length;
    return jsonResponse({ok:true,build:'Build 268',generated_at:new Date().toISOString(),read_only:true,canonical:{schema_build:FULL_SCHEMA_REQUIREMENTS.schema_build,table_count:Object.keys(FULL_SCHEMA_REQUIREMENTS.tables||{}).length,column_count:Object.values(FULL_SCHEMA_REQUIREMENTS.tables||{}).reduce((n,v)=>n+v.length,0),explicit_index_count:(FULL_SCHEMA_REQUIREMENTS.indexes||[]).length,foreign_key_count:(FULL_SCHEMA_REQUIREMENTS.foreign_keys||[]).length},live:{table_count:liveTableNames.size,column_count:liveColumnRows.length,index_column_rows:liveIndexRows.length,foreign_key_rows:liveFkRows.length},summary:{status:failCount?'fail':warningCount?'warning':'ok',fail_count:failCount,warning_count:warningCount,missing_table_count:missingTables.length,missing_column_count:missingColumns.length,missing_index_count:missingIndexes.length,missing_foreign_key_count:missingForeignKeys.length,invalid_foreign_key_parent_count:invalidForeignKeyParents.length,critical_missing_count:criticalMissing.length,extra_table_count:extraTables.length,extra_column_count:extraColumns.length},critical_missing:criticalMissing,missing_tables:missingTables,missing_columns:missingColumns,missing_indexes:missingIndexes,missing_foreign_keys:missingForeignKeys,invalid_foreign_key_parents:invalidForeignKeyParents,type_warnings:typeWarnings,primary_key_warnings:pkWarnings,extra_tables:extraTables.slice(0,300),extra_columns:extraColumns.slice(0,500),quick_check:quickCheck,foreign_key_check:foreignKeyCheck,additive_repair_preview:{safe_statement_count:repairLines.filter(line=>/^\s*(ALTER|UPDATE|CREATE)/i.test(line)).length,sql:repairLines.join('\n'),manual_review_count:manual.length,manual_review:manual.slice(0,500)}},200,{'Cache-Control':'no-store'});
  }catch(error){
    return jsonResponse({ok:false,error:'Full live D1 schema audit failed.',detail:String(error?.message||error),read_only:true},500,{'Cache-Control':'no-store'});
  }
}
