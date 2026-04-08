// File: /functions/api/admin/accounting-writeoffs.js
// Brief description: Write-off tracking for damaged, gifted, lost, or obsolete items.
import { auditAdminAction, getAdminUserFromRequest, getDb, jsonResponse, normalizeText } from "../_lib/adminAudit.js";
function json(data, status=200){ return jsonResponse(data,status); }
function toCents(v){ const n=Number(v); return Number.isFinite(n)?Math.round(n*100):0; }
async function ensureTables(db){
  await db.prepare(`CREATE TABLE IF NOT EXISTS accounting_writeoffs (
    writeoff_id INTEGER PRIMARY KEY AUTOINCREMENT,
    writeoff_date TEXT NOT NULL,
    writeoff_type TEXT NOT NULL,
    description TEXT,
    amount_cents INTEGER NOT NULL DEFAULT 0,
    currency TEXT NOT NULL DEFAULT 'CAD',
    gl_account_code TEXT,
    product_id INTEGER,
    quantity REAL,
    notes TEXT,
    created_by_user_id INTEGER,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`).run();
  await db.prepare(`CREATE INDEX IF NOT EXISTS idx_accounting_writeoffs_date ON accounting_writeoffs(writeoff_date DESC, writeoff_id DESC)`).run();
}
export async function onRequest(context){ const {request, env}=context; const db=getDb(env); await ensureTables(db); const adminUser=await getAdminUserFromRequest(request, env); if(!adminUser) return json({ok:false,error:'Admin authentication required.'},401);
 const url=new URL(request.url); const limit=Math.min(Math.max(Number(url.searchParams.get('limit')||50),1),200);
 if(request.method==='GET'){
   const rows=await db.prepare(`SELECT writeoff_id, writeoff_date, writeoff_type, description, amount_cents, currency, gl_account_code, product_id, quantity, notes, created_at FROM accounting_writeoffs ORDER BY writeoff_date DESC, writeoff_id DESC LIMIT ?`).bind(limit).all();
   return json({ok:true, writeoffs: rows.results||[]});
 }
 if(request.method!=='POST') return json({ok:false,error:'Method not allowed.'},405);
 let body={}; try{ body=await request.json(); }catch{}
 const writeoff_date=normalizeText(body.writeoff_date) || new Date().toISOString().slice(0,10); const writeoff_type=normalizeText(body.writeoff_type)||'inventory'; const description=normalizeText(body.description)||null; const amount_cents=Number.isInteger(body.amount_cents)?Number(body.amount_cents):toCents(body.amount); const currency=(normalizeText(body.currency)||'CAD').toUpperCase(); const gl_account_code=(normalizeText(body.gl_account_code)||'6900').toUpperCase(); const product_id=Number(body.product_id||0)||null; const quantity=Number(body.quantity||0)||null; const notes=normalizeText(body.notes)||null;
 const ins=await db.prepare(`INSERT INTO accounting_writeoffs (writeoff_date, writeoff_type, description, amount_cents, currency, gl_account_code, product_id, quantity, notes, created_by_user_id) VALUES (?,?,?,?,?,?,?,?,?,?)`).bind(writeoff_date, writeoff_type, description, Math.max(0,amount_cents), currency, gl_account_code, product_id, quantity, notes, Number(adminUser.user_id||0)||null).run();
 await auditAdminAction(env, request, adminUser, { action_type:'accounting_writeoff_created', action_summary:`Created write-off dated ${writeoff_date}.`, action_details:{writeoff_type, amount_cents, gl_account_code, product_id} });
 const row=await db.prepare(`SELECT * FROM accounting_writeoffs WHERE writeoff_id=? LIMIT 1`).bind(ins.meta.last_row_id).first();
 return json({ok:true, writeoff: row}); }
