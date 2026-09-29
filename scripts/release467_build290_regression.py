#!/usr/bin/env python3
from pathlib import Path
import sqlite3,sys

R=Path(__file__).resolve().parents[1]
FAIL=[]

def q(ok,msg):
    if not ok: FAIL.append(msg)

client=(R/'public/js/admin-site-item-inventory.js').read_text(encoding='utf-8',errors='replace')
helper=(R/'public/js/admin-site-item-inventory-multistation.js').read_text(encoding='utf-8',errors='replace')
wrapper=(R/'functions/api/admin/site-item-inventory.js').read_text(encoding='utf-8',errors='replace')

q('workstationIdsFromScope' in client,'Primary Inventory client does not own workstation-membership extraction')
q('workstation_site_item_inventory_ids: workstationIds' in client,'Primary Inventory client does not send membership arrays')
q('workstation_item_names.join' in client,'Inventory list does not display all station names')
q('window.fetch = async' not in helper,'Compatibility helper still overrides window.fetch')
q('former window.fetch interception is intentionally retired' in helper,'Fetch-interception retirement marker missing')
q('async function loadWorkstationMemberships' in wrapper,'Batched workstation membership loader missing')
q('WHERE iwm.site_item_inventory_id IN (' in wrapper,'Membership loader is not set-based')
q('workstationMemberships.get(itemId)' in wrapper,'Batched membership results are not merged by item identity')

db=sqlite3.connect(':memory:')
db.executescript('''
CREATE TABLE site_item_inventory(site_item_inventory_id INTEGER PRIMARY KEY,item_name TEXT,source_type TEXT,is_active INTEGER);
CREATE TABLE inventory_process_assignments(site_item_inventory_id INTEGER PRIMARY KEY,inventory_process_id INTEGER);
CREATE TABLE inventory_workstation_roles(site_item_inventory_id INTEGER PRIMARY KEY,workstation_role TEXT,workstation_site_item_inventory_id INTEGER);
CREATE TABLE inventory_workstation_memberships(site_item_inventory_id INTEGER NOT NULL,workstation_site_item_inventory_id INTEGER NOT NULL,PRIMARY KEY(site_item_inventory_id,workstation_site_item_inventory_id));
''')
rows=[
 (101,'Forge A','tool',1),(102,'Forge B','tool',1),(103,'Hydraulic Press','tool',1),(201,'Forge Tongs','tool',1)
]
db.executemany('INSERT INTO site_item_inventory VALUES(?,?,?,?)',rows)
db.executemany('INSERT INTO inventory_process_assignments VALUES(?,?)',[(101,14),(102,14),(103,14),(201,14)])
db.executemany('INSERT INTO inventory_workstation_roles VALUES(?,?,?)',[(101,'station',None),(102,'station',None),(103,'station',None),(201,'associated',101)])
db.executemany('INSERT INTO inventory_workstation_memberships VALUES(?,?)',[(201,101),(201,102),(201,103)])
result=db.execute('''
SELECT iwm.site_item_inventory_id,iwm.workstation_site_item_inventory_id,COALESCE(ws.item_name,'')
FROM inventory_workstation_memberships iwm
JOIN site_item_inventory ws ON ws.site_item_inventory_id=iwm.workstation_site_item_inventory_id
WHERE iwm.site_item_inventory_id IN (?)
ORDER BY iwm.site_item_inventory_id,LOWER(COALESCE(ws.item_name,'')),iwm.workstation_site_item_inventory_id
''',(201,)).fetchall()
ids=[r[1] for r in result]
names=[r[2] for r in result]
q(set(ids)=={101,102,103} and len(ids)==3,'Forge-like associated item did not reload all three workstation memberships')
q(set(names)=={'Forge A','Forge B','Hydraulic Press'},'Forge-like membership names did not reload completely')
q(len(set(ids))==len(ids),'Duplicate membership identity detected')

print('RELEASE 467 BUILD 290 MULTI-STATION REGRESSION')
if FAIL:
    print('FAIL')
    for x in FAIL: print('-',x)
    sys.exit(1)
print('PASS')
print('Forge-like 3-station membership reload: PASS')
print('Client-native membership payload: PASS')
print('Global fetch interception: RETIRED')
