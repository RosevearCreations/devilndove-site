// Release 467 Build 299 — bounded schema-column snapshots.
// Consolidates repeated PRAGMA table_info fan-out into one read-only SQLite statement.
// Falls back to per-table PRAGMA only when an older runtime cannot use pragma_table_info().
const snapshots=new WeakMap();
const safe=(v)=>/^[A-Za-z_][A-Za-z0-9_]*$/.test(String(v||''))?String(v):'';
const rows=(r)=>Array.isArray(r?.results)?r.results:[];
function signature(names){return [...new Set(names.map(safe).filter(Boolean))].sort().join('|');}
function emptyMap(names){return new Map(names.map((name)=>[name,new Set()]));}
export async function loadSchemaColumnSnapshot(db,tableNames=[]){
  const names=[...new Set(tableNames.map(safe).filter(Boolean))];
  if(!db||!names.length)return emptyMap(names);
  let cache=snapshots.get(db);if(!cache){cache=new Map();snapshots.set(db,cache);}
  const key=signature(names);if(cache.has(key))return cache.get(key);
  const promise=(async()=>{
    const out=emptyMap(names);
    try{
      const quoted=names.map((name)=>`'${name.replace(/'/g,"''")}'`).join(',');
      const sql=`SELECT m.name AS table_name,p.name AS name
        FROM sqlite_schema m
        JOIN pragma_table_info(m.name) p
        WHERE m.type='table' AND m.name IN (${quoted})
        ORDER BY m.name,p.cid`;
      const result=await db.prepare(sql).all();
      for(const row of rows(result)){const table=safe(row.table_name),column=safe(row.name);if(table&&column&&out.has(table))out.get(table).add(column);}
      return out;
    }catch{
      for(const name of names){
        const result=await db.prepare(`PRAGMA table_info(${name})`).all().catch(()=>({results:[]}));
        out.set(name,new Set(rows(result).map((row)=>safe(row.name)).filter(Boolean)));
      }
      return out;
    }
  })();
  cache.set(key,promise);
  return promise;
}
export async function loadSchemaColumnSet(db,tableName,group=[]){
  const name=safe(tableName);if(!name)return new Set();
  const names=group.length?[...new Set([...group,name])]:[name];
  const map=await loadSchemaColumnSnapshot(db,names);
  return map.get(name)||new Set();
}
