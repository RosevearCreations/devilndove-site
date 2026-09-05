// Release 467 Build 60 — schema-compatible account/session access for live D1.
// Read-only schema inspection only. No request-time DDL or migration behavior.

function text(value){return String(value||'').trim();}
function parseCookies(request){
  const raw=request.headers.get('Cookie')||'';
  return raw.split(/;\s*/).reduce((acc,part)=>{
    if(!part)return acc;
    const i=part.indexOf('='); if(i<0)return acc;
    const key=part.slice(0,i).trim(); const value=part.slice(i+1).trim();
    try{acc[key]=decodeURIComponent(value);}catch{acc[key]=value;}
    return acc;
  },{});
}
export function getAccountRequestToken(request){
  const auth=request.headers.get('Authorization')||'';
  const match=auth.match(/^Bearer\s+(.+)$/i);
  if(match&&text(match[1]))return text(match[1]);
  return text(parseCookies(request).dd_auth_token);
}

export async function getTableColumns(db,table){
  if(!db||typeof db.prepare!=='function')throw new Error('D1 binding unavailable');
  if(!['users','sessions'].includes(table))throw new Error('Unsupported account table');
  const result=await db.prepare(`PRAGMA table_info(${table})`).all();
  return new Set((Array.isArray(result?.results)?result.results:[]).map(row=>text(row?.name).toLowerCase()).filter(Boolean));
}

function selectExpr(columns,tableAlias,column,alias=column){
  return columns.has(column.toLowerCase())?`${tableAlias}.${column} AS ${alias}`:`NULL AS ${alias}`;
}

export async function resolveSessionUser(request,db,{requireAdmin=false,includePassword=false}={}){
  const token=getAccountRequestToken(request); if(!token)return null;
  const sessionColumns=await getTableColumns(db,'sessions');
  const userColumns=await getTableColumns(db,'users');
  if(!sessionColumns.has('user_id')||!userColumns.has('user_id'))throw new Error('Account schema missing user_id join authority');
  const tokenColumns=['session_token','token'].filter(column=>sessionColumns.has(column));
  if(!tokenColumns.length)throw new Error('sessions table has no supported session token column');
  const tokenWhere=tokenColumns.map(column=>`s.${column}=?`).join(' OR ');
  const expiryWhere=sessionColumns.has('expires_at')?` AND s.expires_at>datetime('now')`:'';
  const select=[
    selectExpr(sessionColumns,'s','session_id'),
    's.user_id AS session_user_id',
    selectExpr(sessionColumns,'s','expires_at'),
    'u.user_id AS user_id',
    selectExpr(userColumns,'u','email'),
    selectExpr(userColumns,'u','display_name'),
    selectExpr(userColumns,'u','role'),
    selectExpr(userColumns,'u','is_active'),
    selectExpr(userColumns,'u','created_at'),
    selectExpr(userColumns,'u','updated_at')
  ];
  if(includePassword)select.push(selectExpr(userColumns,'u','password_hash'));
  const row=await db.prepare(`SELECT ${select.join(', ')} FROM sessions s INNER JOIN users u ON u.user_id=s.user_id WHERE (${tokenWhere})${expiryWhere} LIMIT 1`).bind(...tokenColumns.map(()=>token)).first();
  if(!row)return null;
  if(userColumns.has('is_active')&&Number(row.is_active||0)!==1)return null;
  if(requireAdmin&&String(row.role||'').toLowerCase()!=='admin')return null;
  return row;
}

export async function readUserById(db,userId){
  const row=await db.prepare('SELECT * FROM users WHERE user_id=? LIMIT 1').bind(Number(userId)).first();
  return row||null;
}

export async function createUserCompatible(db,{email,password_hash,display_name,role,is_active}){
  const columns=await getTableColumns(db,'users');
  for(const required of ['user_id','email','password_hash','role','is_active']){
    if(!columns.has(required))throw new Error(`users table missing required column ${required}`);
  }
  const names=['email','password_hash','role','is_active'];
  const values=[email,password_hash,role,Number(is_active||0)];
  const slots=['?','?','?','?'];
  if(columns.has('display_name')){names.splice(2,0,'display_name');values.splice(2,0,display_name||null);slots.splice(2,0,'?');}
  if(columns.has('created_at')){names.push('created_at');slots.push('CURRENT_TIMESTAMP');}
  if(columns.has('updated_at')){names.push('updated_at');slots.push('CURRENT_TIMESTAMP');}
  const result=await db.prepare(`INSERT INTO users (${names.join(',')}) VALUES (${slots.join(',')})`).bind(...values).run();
  return Number(result?.meta?.last_row_id||0);
}

export async function updateUserPasswordCompatible(db,userId,passwordHash){
  const columns=await getTableColumns(db,'users');
  if(!columns.has('user_id')||!columns.has('password_hash'))throw new Error('users table missing password update authority');
  const assignments=['password_hash=?'];
  if(columns.has('updated_at'))assignments.push('updated_at=CURRENT_TIMESTAMP');
  await db.prepare(`UPDATE users SET ${assignments.join(',')} WHERE user_id=?`).bind(passwordHash,Number(userId)).run();
}

export async function describeAccountSchema(db){
  const users=[...await getTableColumns(db,'users')].sort();
  const sessions=[...await getTableColumns(db,'sessions')].sort();
  return {users,sessions,session_token_columns:['session_token','token'].filter(column=>sessions.includes(column))};
}
