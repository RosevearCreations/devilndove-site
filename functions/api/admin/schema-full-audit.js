// Build 269 — read-only full D1 schema audit against database_full_schema.sql.
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

function sameCols(a,b){
  return a.length===b.length && a.every((v,i)=>v===b[i]);
}

function buildAddColumn(table,column,spec){
  const [,type,notnull,dflt,pk]=spec;

  if(Number(pk)>0){
    return {
      safe:false,
      reason:'Primary-key columns cannot be added safely to an existing populated SQLite table with ALTER TABLE.'
    };
  }

  if(Number(notnull)>0 && (dflt===null || dflt===undefined)){
    return {
      safe:false,
      reason:'NOT NULL column has no default; existing rows need an explicit backfill plan.'
    };
  }

  const parts=[`ALTER TABLE ${qid(table)} ADD COLUMN ${qid(column)}`];

  if(text(type)) parts.push(text(type));
  if(Number(notnull)>0) parts.push('NOT NULL');
  if(dflt!==null && dflt!==undefined) parts.push(`DEFAULT ${dflt}`);

  return {
    safe:true,
    sql:parts.join(' ')+';'
  };
}

function paymentRefundCompatRecipe(liveByTable){
  const cols=liveByTable.get('payment_refunds');

  if(!cols || cols.has('refund_id') || !cols.has('payment_refund_id')){
    return [];
  }

  return [
    '-- Compatibility repair: older payment_refunds uses payment_refund_id while current code/FKs use refund_id.',
    'ALTER TABLE payment_refunds ADD COLUMN refund_id INTEGER;',
    'UPDATE payment_refunds SET refund_id=payment_refund_id WHERE refund_id IS NULL;',
    'CREATE UNIQUE INDEX IF NOT EXISTS uq_payment_refunds_refund_id ON payment_refunds(refund_id);',
    'CREATE TRIGGER IF NOT EXISTS trg_payment_refunds_sync_refund_id_after_insert AFTER INSERT ON payment_refunds WHEN NEW.refund_id IS NULL BEGIN UPDATE payment_refunds SET refund_id=NEW.payment_refund_id WHERE payment_refund_id=NEW.payment_refund_id; END;',
    'CREATE TRIGGER IF NOT EXISTS trg_payment_refunds_protect_refund_id_after_update AFTER UPDATE OF payment_refund_id ON payment_refunds WHEN NEW.refund_id IS NULL OR NEW.refund_id<>NEW.payment_refund_id BEGIN UPDATE payment_refunds SET refund_id=NEW.payment_refund_id WHERE payment_refund_id=NEW.payment_refund_id; END;'
  ];
}

function unquoteIdent(value){
  const v=text(value);

  if(!v) return '';

  if(
    (v[0]==='"'&&v.at(-1)==='"') ||
    (v[0]==='`'&&v.at(-1)==='`') ||
    (v[0]==="'"&&v.at(-1)==="'")
  ){
    return v
      .slice(1,-1)
      .replace(new RegExp(v[0]+v[0],'g'),v[0]);
  }

  if(v[0]==='['&&v.at(-1)===']'){
    return v.slice(1,-1);
  }

  return v;
}

function splitTopLevel(input,delimiter=','){
  const out=[];
  let start=0;
  let depth=0;
  let quote='';

  for(let i=0;i<input.length;i++){
    const ch=input[i];

    if(quote){
      if(ch===quote){
        if(input[i+1]===quote){
          i++;
          continue;
        }
        quote='';
      } else if(quote===']'&&ch===']'){
        quote='';
      }
      continue;
    }

    if(ch==='"'||ch==="'"||ch==='`'){
      quote=ch;
      continue;
    }

    if(ch==='['){
      quote=']';
      continue;
    }

    if(ch==='('){
      depth++;
    } else if(ch===')'&&depth>0){
      depth--;
    } else if(ch===delimiter&&depth===0){
      out.push(input.slice(start,i).trim());
      start=i+1;
    }
  }

  out.push(input.slice(start).trim());

  return out.filter(Boolean);
}

function tableBody(sql){
  const src=String(sql||'');
  const first=src.indexOf('(');

  if(first<0) return '';

  let depth=0;
  let quote='';

  for(let i=first;i<src.length;i++){
    const ch=src[i];

    if(quote){
      if(ch===quote){
        if(src[i+1]===quote){
          i++;
          continue;
        }
        quote='';
      } else if(quote===']'&&ch===']'){
        quote='';
      }
      continue;
    }

    if(ch==='"'||ch==="'"||ch==='`'){
      quote=ch;
      continue;
    }

    if(ch==='['){
      quote=']';
      continue;
    }

    if(ch==='('){
      depth++;
    } else if(ch===')'){
      depth--;

      if(depth===0){
        return src.slice(first+1,i);
      }
    }
  }

  return src.slice(first+1);
}

function firstIdentifier(def){
  const s=String(def||'').trim();

  const m=s.match(
    /^(?:"((?:[^"]|"")+)"|`([^`]+)`|\[([^\]]+)\]|([^\s]+))/
  );

  if(!m){
    return {
      name:'',
      rest:s
    };
  }

  const raw=m[0];

  const name=unquoteIdent(
    m[1] ??
    m[2] ??
    m[3] ??
    m[4] ??
    ''
  );

  return {
    name,
    rest:s.slice(raw.length).trim()
  };
}

function identifierList(value){
  return splitTopLevel(String(value||''))
    .map(v=>unquoteIdent(v.trim().split(/\s+/)[0]))
    .filter(Boolean);
}

function parseAction(tail,which){
  const re=new RegExp(
    `\\bON\\s+${which}\\s+(CASCADE|RESTRICT|SET\\s+NULL|SET\\s+DEFAULT|NO\\s+ACTION)\\b`,
    'i'
  );

  const m=String(tail||'').match(re);

  return m
    ? m[1].replace(/\s+/g,' ').toUpperCase()
    : 'NO ACTION';
}

function parseTableDefinition(name,sql){
  const info={
    name,
    columns:[],
    pk:[],
    unique:[],
    foreignKeys:[]
  };

  const parts=splitTopLevel(tableBody(sql));
  const tablePk=[];

  for(const part of parts){
    const normalized=part
      .replace(
        /^CONSTRAINT\s+(?:"[^"]+"|`[^`]+`|\[[^\]]+\]|\S+)\s+/i,
        ''
      )
      .trim();

    let m=normalized.match(
      /^PRIMARY\s+KEY\s*\(([^)]*)\)/i
    );

    if(m){
      tablePk.push(...identifierList(m[1]));
      continue;
    }

    m=normalized.match(
      /^UNIQUE\s*\(([^)]*)\)/i
    );

    if(m){
      info.unique.push(identifierList(m[1]));
      continue;
    }

    m=normalized.match(
      /^FOREIGN\s+KEY\s*\(([^)]*)\)\s+REFERENCES\s+("(?:[^"]|"")+"|`[^`]+`|\[[^\]]+\]|[^\s(]+)\s*\(([^)]*)\)(.*)$/i
    );

    if(m){
      const child=identifierList(m[1]);
      const parent=unquoteIdent(m[2]);
      const parentCols=identifierList(m[3]);
      const tail=m[4]||'';

      const groupId=`table:${info.foreignKeys.length}`;

      child.forEach((c,i)=>{
        info.foreignKeys.push({
          child_table:name,
          parent_table:parent,
          child_column:c,
          parent_column:parentCols[i]||'',
          on_update:parseAction(tail,'UPDATE'),
          on_delete:parseAction(tail,'DELETE'),
          group:groupId
        });
      });

      continue;
    }

    if(/^(CHECK|CONSTRAINT)\b/i.test(normalized)){
      continue;
    }

    const {
      name:column,
      rest
    }=firstIdentifier(part);

    if(!column) continue;

    const constraintAt=rest.search(
      /\b(?:PRIMARY\s+KEY|NOT\s+NULL|NULL|UNIQUE|CHECK|DEFAULT|COLLATE|REFERENCES|GENERATED)\b/i
    );

    const type=(
      constraintAt<0
        ? rest
        : rest.slice(0,constraintAt)
    ).trim();

    const notnull=
      /\bNOT\s+NULL\b/i.test(rest)
        ? 1
        : 0;

    const pk=
      /\bPRIMARY\s+KEY\b/i.test(rest)
        ? 1
        : 0;

    let dflt=null;

    const dm=rest.match(
      /\bDEFAULT\s+((?:\([^)]*\))|(?:'[^']*(?:''[^']*)*')|(?:"[^"]*(?:""[^"]*)*")|[^\s,]+)/i
    );

    if(dm){
      dflt=dm[1];
    }

    info.columns.push({
      table_name:name,
      cid:info.columns.length,
      column_name:column,
      column_type:type,
      is_not_null:notnull,
      default_value:dflt,
      pk
    });

    if(pk){
      info.pk.push(column);
    }

    if(/\bUNIQUE\b/i.test(rest)){
      info.unique.push([column]);
    }

    const rm=rest.match(
      /\bREFERENCES\s+("(?:[^"]|"")+"|`[^`]+`|\[[^\]]+\]|[^\s(]+)\s*\(([^)]*)\)(.*)$/i
    );

    if(rm){
      info.foreignKeys.push({
        child_table:name,
        parent_table:unquoteIdent(rm[1]),
        child_column:column,
        parent_column:identifierList(rm[2])[0]||'',
        on_update:parseAction(rm[3],'UPDATE'),
        on_delete:parseAction(rm[3],'DELETE'),
        group:`inline:${column}`
      });
    }
  }

  if(tablePk.length){
    info.pk=tablePk;

    info.columns.forEach(c=>{
      const n=tablePk.indexOf(c.column_name);
      c.pk=n<0 ? 0 : n+1;
    });
  }

  return info;
}

function parseIndexDefinition(name,sql){
  const src=String(sql||'');

  const m=src.match(
    /^\s*CREATE\s+(UNIQUE\s+)?INDEX\s+(?:IF\s+NOT\s+EXISTS\s+)?(?:"(?:[^"]|"")+"|`[^`]+`|\[[^\]]+\]|[^\s]+)\s+ON\s+("(?:[^"]|"")+"|`[^`]+`|\[[^\]]+\]|[^\s(]+)\s*\((.*)\)/is
  );

  if(!m){
    return {
      name,
      table:'',
      unique:/^\s*CREATE\s+UNIQUE\s+INDEX/i.test(src),
      columns:[]
    };
  }

  return {
    name,
    table:unquoteIdent(m[2]),
    unique:Boolean(m[1]),
    columns:identifierList(m[3])
  };
}

export async function onRequestGet(context){
  const adminUser=await getAdminUserFromRequest(
    context.request,
    context.env
  );

  if(!adminUser){
    return jsonResponse(
      {
        ok:false,
        error:'Admin access required.'
      },
      401
    );
  }

  const db=getDb(context.env);

  if(!db){
    return jsonResponse(
      {
        ok:false,
        error:'Database binding is not configured.'
      },
      500
    );
  }

  try{
    /*
      Build 269 compatibility:

      Use only ordinary SELECTs against sqlite_master here.

      D1 can reject table-valued PRAGMA joins with SQLITE_AUTH even when
      the equivalent direct PRAGMA is otherwise supported.

      Parsing sqlite_master keeps this audit read-only and avoids hundreds
      of dynamic PRAGMA calls against production.
    */
    const schemaRows=rows(
      await db.prepare(`
        SELECT
          name,
          type,
          tbl_name,
          sql
        FROM sqlite_master
        WHERE
          type IN ('table','view','index','trigger')
          AND name NOT LIKE 'sqlite_%'
        ORDER BY
          type,
          name
      `).all()
    );

    const tableRows=schemaRows.filter(
      r=>r.type==='table'
    );

    const liveTableNames=new Set(
      tableRows.map(r=>text(r.name))
    );

    const parsedTables=new Map();

    const liveColumnRows=[];
    const liveByTable=new Map();
    const liveColumnSpec=new Map();

    for(const row of tableRows){
      const t=text(row.name);

      const parsed=parseTableDefinition(
        t,
        row.sql||''
      );

      parsedTables.set(
        t,
        parsed
      );

      liveByTable.set(
        t,
        new Set(
          parsed.columns.map(
            c=>c.column_name
          )
        )
      );

      for(const col of parsed.columns){
        liveColumnRows.push(col);

        liveColumnSpec.set(
          `${t}.${col.column_name}`,
          col
        );
      }
    }

    const missingTables=[];
    const missingColumns=[];
    const typeWarnings=[];
    const pkWarnings=[];
    const extraTables=[];
    const extraColumns=[];

    for(
      const [table,expectedCols]
      of Object.entries(
        FULL_SCHEMA_REQUIREMENTS.tables||{}
      )
    ){
      if(!liveTableNames.has(table)){
        missingTables.push(table);
        continue;
      }

      const liveCols=
        liveByTable.get(table)||
        new Set();

      const expectedNames=
        new Set(
          expectedCols.map(c=>c[0])
        );

      for(const spec of expectedCols){
        const [
          name,
          type,
          ,
          ,
          pk
        ]=spec;

        if(!liveCols.has(name)){
          missingColumns.push({
            table,
            column:name,
            expected_type:type||'',
            not_null:Boolean(spec[2]),
            default_value:spec[3],
            pk:Number(pk)||0
          });

          continue;
        }

        const live=
          liveColumnSpec.get(
            `${table}.${name}`
          )||{};

        if(
          type &&
          live.column_type &&
          affinity(type)!==
          affinity(live.column_type)
        ){
          typeWarnings.push({
            table,
            column:name,
            expected_type:type,
            live_type:live.column_type
          });
        }

        if(
          Number(pk)!==
          Number(live.pk||0) &&
          (
            Number(pk)>0 ||
            Number(live.pk||0)>0
          )
        ){
          pkWarnings.push({
            table,
            column:name,
            expected_pk:Number(pk),
            live_pk:Number(live.pk||0)
          });
        }
      }

      for(const c of liveCols){
        if(!expectedNames.has(c)){
          extraColumns.push({
            table,
            column:c
          });
        }
      }
    }

    const expectedTableNames=
      new Set(
        Object.keys(
          FULL_SCHEMA_REQUIREMENTS.tables||{}
        )
      );

    for(const t of liveTableNames){
      if(
        !expectedTableNames.has(t) &&
        t!=='_cf_KV'
      ){
        extraTables.push(t);
      }
    }

    const indexRows=
      schemaRows.filter(
        r=>r.type==='index'
      );

    const liveIndexes=
      indexRows
        .map(
          r=>parseIndexDefinition(
            text(r.name),
            r.sql||''
          )
        )
        .filter(v=>v.name);

    const liveExplicitIndexNames=
      new Set(
        liveIndexes.map(v=>v.name)
      );

    const missingIndexes=[];

    for(
      const [
        name,
        table,
        sql
      ]
      of FULL_SCHEMA_REQUIREMENTS.indexes||[]
    ){
      if(
        !liveExplicitIndexNames.has(name)
      ){
        missingIndexes.push({
          name,
          table,
          sql,
          unique:
            /^\s*CREATE\s+UNIQUE\s+INDEX/i
              .test(sql||'')
        });
      }
    }

    const liveFkRows=[];
    const uniqueByTable=new Map();
    const pkByTable=new Map();

    for(
      const [table,parsed]
      of parsedTables
    ){
      pkByTable.set(
        table,
        parsed.pk||[]
      );

      uniqueByTable.set(
        table,
        [
          ...(parsed.unique||[])
        ]
      );

      liveFkRows.push(
        ...(parsed.foreignKeys||[])
      );
    }

    for(const idx of liveIndexes){
      if(
        idx.unique &&
        idx.table &&
        idx.columns.length
      ){
        if(!uniqueByTable.has(idx.table)){
          uniqueByTable.set(
            idx.table,
            []
          );
        }

        uniqueByTable
          .get(idx.table)
          .push(idx.columns);
      }
    }

    const liveFkSet=
      new Set(
        liveFkRows.map(
          r=>[
            text(r.child_table),
            text(r.parent_table),
            text(r.child_column),
            text(r.parent_column),
            text(r.on_update).toUpperCase(),
            text(r.on_delete).toUpperCase()
          ].join('|')
        )
      );

    const missingForeignKeys=[];

    for(
      const fk
      of FULL_SCHEMA_REQUIREMENTS.foreign_keys||[]
    ){
      const key=[
        fk[0],
        fk[1],
        fk[2],
        fk[3],
        text(fk[4]).toUpperCase(),
        text(fk[5]).toUpperCase()
      ].join('|');

      if(!liveFkSet.has(key)){
        missingForeignKeys.push({
          child_table:fk[0],
          parent_table:fk[1],
          child_column:fk[2],
          parent_column:fk[3],
          on_update:fk[4],
          on_delete:fk[5]
        });
      }
    }

    const fkGroups=new Map();

    for(const row of liveFkRows){
      const key=
        `${text(row.child_table)}::`+
        `${text(row.group)||`${text(row.parent_table)}:${text(row.child_column)}`}`;

      if(!fkGroups.has(key)){
        fkGroups.set(
          key,
          {
            child_table:text(
              row.child_table
            ),
            parent_table:text(
              row.parent_table
            ),
            pairs:[]
          }
        );
      }

      fkGroups
        .get(key)
        .pairs
        .push([
          fkGroups.get(key).pairs.length,
          text(row.child_column),
          text(row.parent_column)
        ]);
    }

    const invalidForeignKeyParents=[];

    for(const group of fkGroups.values()){
      const parentCols=
        group.pairs.map(
          v=>v[2]
        );

      const pk=
        pkByTable.get(
          group.parent_table
        )||[];

      const unique=
        uniqueByTable.get(
          group.parent_table
        )||[];

      const valid=
        sameCols(
          pk,
          parentCols
        ) ||
        unique.some(
          cols=>sameCols(
            cols,
            parentCols
          )
        );

      if(!valid){
        invalidForeignKeyParents.push({
          child_table:group.child_table,
          parent_table:group.parent_table,
          child_columns:
            group.pairs.map(v=>v[1]),
          parent_columns:parentCols,
          reason:
            'Referenced parent column set is not a live PRIMARY KEY or UNIQUE key.'
        });
      }
    }

    /*
      Integrity PRAGMAs are optional diagnostics.

      A D1 authorization error here is reported as unavailable instead of
      aborting the entire schema inventory.
    */
    let quickCheck={
      status:'unavailable',
      rows:[]
    };

    try{
      const qr=rows(
        await db.prepare(
          'PRAGMA quick_check'
        ).all()
      );

      quickCheck={
        status:
          qr.every(
            r=>
              String(
                Object.values(r)[0]||''
              ).toLowerCase()==='ok'
          )
            ? 'ok'
            : 'fail',
        rows:qr.slice(0,100)
      };
    }catch(error){
      quickCheck={
        status:'unavailable',
        error:String(
          error?.message||error
        )
      };
    }

    let foreignKeyCheck={
      status:'unavailable',
      issues:[]
    };

    try{
      const fr=rows(
        await db.prepare(
          'PRAGMA foreign_key_check'
        ).all()
      );

      foreignKeyCheck={
        status:
          fr.length
            ? 'fail'
            : 'ok',
        issues:fr.slice(0,200),
        issue_count:fr.length
      };
    }catch(error){
      foreignKeyCheck={
        status:'unavailable',
        error:String(
          error?.message||error
        )
      };
    }

    const repairLines=[
      '-- Devil n Dove live D1 additive-only repair PREVIEW.',
      '-- Generated read-only from the live schema. Review/back up before executing anything.',
      '-- No DROP TABLE, DELETE, destructive rename, or data replacement is generated.'
    ];

    const manual=[];

    const compat=
      paymentRefundCompatRecipe(
        liveByTable
      );

    if(compat.length){
      repairLines.push(
        '',
        ...compat
      );
    }

    for(const miss of missingColumns){
      if(
        miss.table==='payment_refunds' &&
        miss.column==='refund_id' &&
        compat.length
      ){
        continue;
      }

      const spec=
        (
          FULL_SCHEMA_REQUIREMENTS
            .tables[miss.table]||[]
        )
        .find(
          c=>c[0]===miss.column
        );

      if(!spec) continue;

      const candidate=
        buildAddColumn(
          miss.table,
          miss.column,
          spec
        );

      if(candidate.safe){
        repairLines.push(
          candidate.sql
        );
      }else{
        manual.push({
          ...miss,
          reason:candidate.reason
        });
      }
    }

    for(const idx of missingIndexes){
      manual.push({
        index:idx.name,
        table:idx.table,
        reason:
          idx.unique
            ? 'UNIQUE index creation requires duplicate-data review before execution.'
            : 'Index is missing. Review after required columns/tables are repaired; the full audit does not auto-create indexes against live production.'
      });
    }

    for(const table of missingTables){
      manual.push({
        table,
        reason:
          'Missing table requires its canonical CREATE TABLE migration; the full audit never auto-creates tables against live production.'
      });
    }

    for(const fk of missingForeignKeys){
      manual.push({
        ...fk,
        reason:
          'SQLite cannot safely add a foreign-key constraint to an existing populated table without a controlled table rebuild.'
      });
    }

    for(const issue of pkWarnings){
      manual.push({
        ...issue,
        reason:
          'Primary-key drift requires manual migration planning; no table rebuild is generated automatically.'
      });
    }

    for(
      const issue
      of invalidForeignKeyParents
    ){
      manual.push({
        ...issue,
        reason:
          'Foreign-key parent key is not PRIMARY KEY/UNIQUE in the live schema; inspect data before adding a unique constraint.'
      });
    }

    const criticalMissing=
      missingColumns.filter(
        x=>[
          'media_assets',
          'creative_assets',
          'caip_media_upload_files',
          'caip_media_upload_sessions',
          'caip_media_upload_parts',
          'payment_refunds',
          'customer_documents',
          'creative_projects'
        ].includes(x.table)
      );

    const failCount=
      missingTables.length +
      missingColumns.length +
      pkWarnings.length +
      invalidForeignKeyParents.length +
      (
        foreignKeyCheck.status==='fail'
          ? foreignKeyCheck.issue_count||1
          : 0
      );

    const warningCount=
      typeWarnings.length +
      missingIndexes.length +
      missingForeignKeys.length +
      (
        quickCheck.status==='unavailable'
          ? 1
          : 0
      ) +
      (
        foreignKeyCheck.status==='unavailable'
          ? 1
          : 0
      );

    return jsonResponse(
      {
        ok:true,
        build:'Build 269',
        generated_at:new Date().toISOString(),
        read_only:true,
        audit_method:'sqlite_schema_parse',

        canonical:{
          schema_build:
            FULL_SCHEMA_REQUIREMENTS
              .schema_build,

          table_count:
            Object.keys(
              FULL_SCHEMA_REQUIREMENTS
                .tables||{}
            ).length,

          column_count:
            Object.values(
              FULL_SCHEMA_REQUIREMENTS
                .tables||{}
            ).reduce(
              (n,v)=>n+v.length,
              0
            ),

          explicit_index_count:
            (
              FULL_SCHEMA_REQUIREMENTS
                .indexes||[]
            ).length,

          foreign_key_count:
            (
              FULL_SCHEMA_REQUIREMENTS
                .foreign_keys||[]
            ).length
        },

        live:{
          table_count:
            liveTableNames.size,

          column_count:
            liveColumnRows.length,

          index_count:
            liveIndexes.length,

          foreign_key_rows:
            liveFkRows.length
        },

        summary:{
          status:
            failCount
              ? 'fail'
              : warningCount
                ? 'warning'
                : 'ok',

          fail_count:
            failCount,

          warning_count:
            warningCount,

          missing_table_count:
            missingTables.length,

          missing_column_count:
            missingColumns.length,

          missing_index_count:
            missingIndexes.length,

          missing_foreign_key_count:
            missingForeignKeys.length,

          invalid_foreign_key_parent_count:
            invalidForeignKeyParents.length,

          critical_missing_count:
            criticalMissing.length,

          extra_table_count:
            extraTables.length,

          extra_column_count:
            extraColumns.length
        },

        critical_missing:
          criticalMissing,

        missing_tables:
          missingTables,

        missing_columns:
          missingColumns,

        missing_indexes:
          missingIndexes,

        missing_foreign_keys:
          missingForeignKeys,

        invalid_foreign_key_parents:
          invalidForeignKeyParents,

        type_warnings:
          typeWarnings,

        primary_key_warnings:
          pkWarnings,

        extra_tables:
          extraTables.slice(
            0,
            300
          ),

        extra_columns:
          extraColumns.slice(
            0,
            500
          ),

        quick_check:
          quickCheck,

        foreign_key_check:
          foreignKeyCheck,

        additive_repair_preview:{
          safe_statement_count:
            repairLines.filter(
              line=>
                /^\s*(ALTER|UPDATE|CREATE)/i
                  .test(line)
            ).length,

          sql:
            repairLines.join('\n'),

          manual_review_count:
            manual.length,

          manual_review:
            manual.slice(
              0,
              500
            )
        }
      },
      200,
      {
        'Cache-Control':'no-store'
      }
    );

  }catch(error){
    return jsonResponse(
      {
        ok:false,
        error:
          'Full live D1 schema audit failed.',
        detail:
          String(
            error?.message||error
          ),
        read_only:true
      },
      500,
      {
        'Cache-Control':'no-store'
      }
    );
  }
}
