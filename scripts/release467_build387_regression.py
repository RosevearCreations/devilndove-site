#!/usr/bin/env python3
"""Build 387 local proof: immutable migration, tax edge cases, client no-auto-post and JS syntax."""
from pathlib import Path
import subprocess,sys,json,sqlite3
R=Path(__file__).resolve().parents[1];bad=[]
def text(p):return (R/p).read_text()
def check(x,m):
 if not x:bad.append(m)
m=json.loads(text('migrations/canonical/manifest.json'))
check(m['migrations'][-1]['version']==38 and m['migrations'][-1]['file']=='0038_release467_inventory_quick_edit_tax_receipts.sql','canonical migration 0038')
for p in ['functions/api/admin/_lib/inventoryQuickEdit387.js','functions/api/admin/inventory-quick-edit.js','public/js/admin-inventory-tax-quickedit-v387.js','public/js/admin-product-resources.js']:
 x=subprocess.run(['node','--check',str(R/p)],capture_output=True,text=True)
 check(x.returncode==0,'JS syntax '+p+' '+x.stderr[-400:])
x=subprocess.run(['node','--test','scripts/release467_build387_tax.test.mjs'],cwd=R,capture_output=True,text=True)
check(x.returncode==0,'tax calculations '+x.stdout[-400:]+x.stderr[-400:])
api=text('functions/api/admin/inventory-quick-edit.js')
for v in ('STALE_INVENTORY','RESERVED_STOCK','request_key','db.batch([update,base,movement,entry])','retry_automatically:false'):
 check(v in api,'Inventory quick-edit API '+v)
ui=text('public/js/admin-product-resources.js')
check('dd:inventory-quick-edit-saved' in ui and 'state.productionPreview=null' in ui and 'data-dd387-edit-id' in ui,'linked Product correction/preview invalidation')
check('admin-inventory-tax-quickedit-v387.js' in text('admin/inventory-operations/index.html'),'interactive drawer installed')
db=sqlite3.connect(':memory:',isolation_level=None);db.execute('PRAGMA foreign_keys=ON')
try:
 db.executescript("""CREATE TABLE users(user_id INTEGER PRIMARY KEY);
 CREATE TABLE site_item_inventory(site_item_inventory_id INTEGER PRIMARY KEY,on_hand_quantity REAL,unit_cost_cents INTEGER,stock_unit_label TEXT,usage_unit_label TEXT,usage_units_per_stock_unit REAL);
 CREATE TABLE site_inventory_base_balances(site_item_inventory_id INTEGER PRIMARY KEY,base_on_hand_quantity REAL,purchase_unit_cost_cents INTEGER,base_units_per_purchase_unit REAL);
 CREATE TABLE site_inventory_movements(site_inventory_movement_id INTEGER PRIMARY KEY AUTOINCREMENT,site_item_inventory_id INTEGER,actor_user_id INTEGER,new_on_hand_quantity REAL,note TEXT);
 INSERT INTO users VALUES(7),(8);
 INSERT INTO site_item_inventory VALUES(21,2,1000,'pack','gram',50);
 INSERT INTO site_inventory_base_balances VALUES(21,100,1000,50);""")
 db.executescript(text('migrations/canonical/0038_release467_inventory_quick_edit_tax_receipts.sql'))
 key='inventory_key_387_12345';note='Correction verified manually in workshop'
 db.execute("UPDATE site_item_inventory SET on_hand_quantity=3,last_quick_edit_key=? WHERE site_item_inventory_id=21",(key,))
 db.execute('UPDATE site_inventory_base_balances SET base_on_hand_quantity=150 WHERE site_item_inventory_id=21')
 db.execute('INSERT INTO site_inventory_movements(site_item_inventory_id,actor_user_id,new_on_hand_quantity,note) VALUES(21,7,3,?)',('Build387 '+key+': '+note,))
 movement=db.execute('SELECT last_insert_rowid()').fetchone()[0]
 cols='request_key,actor_user_id,site_item_inventory_id,payload_sha256,prior_on_hand_quantity,new_on_hand_quantity,prior_unit_cost_cents,net_unit_cost_cents,tax_rate_basis_points,tax_included,tax_estimate_cents,gross_unit_cost_cents,purchase_cost_entered_cents,stock_unit_label,usage_unit_label,usage_units_per_stock_unit,source_movement_id,note'
 sql='INSERT INTO inventory_quick_edit_receipts('+cols+') VALUES ('+','.join(['?']*18)+')'
 args=(key,7,21,'a'*64,2,3,1000,1000,1300,0,130,1130,1000,'pack','gram',50,movement,note)
 db.execute(sql,args)
 check(db.execute('SELECT COUNT(*) FROM inventory_quick_edit_receipts').fetchone()[0]==1,'valid receipt')
 for statement,values,label in [(sql,args,'duplicate'),('DELETE FROM inventory_quick_edit_receipts',(),'immutable delete'),("UPDATE inventory_quick_edit_receipts SET tax_estimate_cents=0",(),'immutable update'),
 (sql,('another_key_123456',8,*args[2:]),'forged actor')]:
  try:db.execute(statement,values);bad.append('accepted '+label)
  except sqlite3.IntegrityError:pass
 check(not db.execute('PRAGMA foreign_key_check').fetchall(),'foreign keys')
except Exception as exc:bad.append('SQLite receipt test: '+repr(exc))
print('RELEASE467_BUILD387_REGRESSION='+('FAIL' if bad else 'GREEN'))
for msg in bad:print('-',msg)
sys.exit(bool(bad))
