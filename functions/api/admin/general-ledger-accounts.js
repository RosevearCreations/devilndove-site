// File: /functions/api/admin/general-ledger-accounts.js
// Brief description: Starter general ledger accounts for accounting categorization and P&L structure.
import { auditAdminAction, getAdminUserFromRequest, getDb, jsonResponse, normalizeText } from "../_lib/adminAudit.js";
function json(data, status=200){ return jsonResponse(data,status); }
async function ensureTables(db){
  await db.prepare(`CREATE TABLE IF NOT EXISTS general_ledger_accounts (
    gl_account_id INTEGER PRIMARY KEY AUTOINCREMENT,
    code TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    parent_group TEXT,
    normal_balance TEXT NOT NULL DEFAULT 'debit',
    is_active INTEGER NOT NULL DEFAULT 1,
    sort_order INTEGER NOT NULL DEFAULT 0,
    notes TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`).run();
  await db.prepare(`CREATE INDEX IF NOT EXISTS idx_gl_accounts_category ON general_ledger_accounts(category, sort_order, code)`).run();
  const seeds = [
    ['4000','Sales Revenue','Revenue','Sales','credit',10],['4050','Shipping Income','Revenue','Sales','credit',20],['5000','Cost of Goods Sold','Cost of Sales','COGS','debit',30],
    ['6100','Electricity','Operating Expense','Utilities','debit',40],['6110','Water','Operating Expense','Utilities','debit',50],['6120','Gas','Operating Expense','Utilities','debit',60],
    ['6200','Rent','Operating Expense','Occupancy','debit',70],['6210','Property Tax','Operating Expense','Occupancy','debit',80],['6300','Internet','Operating Expense','Utilities','debit',90],
    ['6310','Phone','Operating Expense','Utilities','debit',100],['6400','Advertising','Operating Expense','Sales & Marketing','debit',110],['6410','Website & Hosting','Operating Expense','Sales & Marketing','debit',120],
    ['6500','Software Subscriptions','Operating Expense','Admin','debit',130],['6600','Insurance','Operating Expense','Admin','debit',140],['6700','Office Supplies','Operating Expense','Admin','debit',150],
    ['6800','Equipment & Tools','Operating Expense','Workshop','debit',160],['6810','Workshop Consumables','Operating Expense','Workshop','debit',170],['6900','Write-Offs','Other Expense','Adjustments','debit',180]
  ];
  for (const [code,name,category,parent_group,normal_balance,sort_order] of seeds){
    await db.prepare(`INSERT OR IGNORE INTO general_ledger_accounts (code,name,category,parent_group,normal_balance,sort_order,is_active) VALUES (?,?,?,?,?,?,1)`).bind(code,name,category,parent_group,normal_balance,sort_order).run();
  }
}
export async function onRequest(context){
 const {request, env}=context; const db=getDb(env); await ensureTables(db);
 const adminUser=await getAdminUserFromRequest(request, env); if(!adminUser) return json({ok:false,error:'Admin authentication required.'},401);
 if(request.method==='GET'){
   const rows=await db.prepare(`SELECT gl_account_id, code, name, category, parent_group, normal_balance, is_active, sort_order, notes FROM general_ledger_accounts ORDER BY category ASC, sort_order ASC, code ASC`).all();
   return json({ok:true, accounts: rows.results||[]});
 }
 if(request.method!=='POST') return json({ok:false,error:'Method not allowed.'},405);
 let body={}; try{ body=await request.json(); }catch{}
 const code=normalizeText(body.code).toUpperCase(); const name=normalizeText(body.name); const category=normalizeText(body.category)||'Operating Expense'; const parent_group=normalizeText(body.parent_group)||null; const normal_balance=(normalizeText(body.normal_balance)||'debit').toLowerCase()==='credit'?'credit':'debit'; const sort_order=Number(body.sort_order||0); const notes=normalizeText(body.notes)||null; const is_active=Number(body.is_active===false?0:body.is_active||1)?1:0;
 if(!code || !name) return json({ok:false,error:'code and name are required.'},400);
 await db.prepare(`INSERT INTO general_ledger_accounts (code,name,category,parent_group,normal_balance,is_active,sort_order,notes,updated_at) VALUES (?,?,?,?,?,?,?,?,CURRENT_TIMESTAMP) ON CONFLICT(code) DO UPDATE SET name=excluded.name, category=excluded.category, parent_group=excluded.parent_group, normal_balance=excluded.normal_balance, is_active=excluded.is_active, sort_order=excluded.sort_order, notes=excluded.notes, updated_at=CURRENT_TIMESTAMP`).bind(code,name,category,parent_group,normal_balance,is_active,sort_order,notes).run();
 await auditAdminAction(env, request, adminUser, { action_type:'gl_account_upserted', action_summary:`Updated GL account ${code} ${name}.`, action_details:{code,name,category} });
 const row=await db.prepare(`SELECT * FROM general_ledger_accounts WHERE code=? LIMIT 1`).bind(code).first();
 return json({ok:true, account:row});
}
