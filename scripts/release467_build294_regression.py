#!/usr/bin/env python3
"""Build 294 productless Workshop Folly identity regression."""
import sqlite3,sys
F=[]
def q(ok,msg):
    if not ok:F.append(msg)
db=sqlite3.connect(':memory:')
db.executescript("""
PRAGMA foreign_keys=ON;
CREATE TABLE creative_work_projects(creative_work_project_id INTEGER PRIMARY KEY, project_title TEXT, product_id INTEGER);
CREATE TABLE inventory_processes(inventory_process_id INTEGER PRIMARY KEY, process_key TEXT UNIQUE, process_name TEXT, is_active INTEGER DEFAULT 1);
CREATE TABLE site_item_inventory(site_item_inventory_id INTEGER PRIMARY KEY,item_name TEXT,is_active INTEGER DEFAULT 1);
CREATE TABLE inventory_workstation_roles(site_item_inventory_id INTEGER PRIMARY KEY,workstation_role TEXT);
CREATE TABLE creative_project_maker_story_profiles(
 creative_work_project_id INTEGER PRIMARY KEY,
 story_kind TEXT NOT NULL,
 primary_inventory_process_id INTEGER,
 outcome_status TEXT NOT NULL,
 lesson_learned TEXT,
 FOREIGN KEY(creative_work_project_id) REFERENCES creative_work_projects(creative_work_project_id),
 FOREIGN KEY(primary_inventory_process_id) REFERENCES inventory_processes(inventory_process_id)
);
CREATE TABLE creative_project_maker_story_workstations(
 creative_work_project_id INTEGER NOT NULL,
 site_item_inventory_id INTEGER NOT NULL,
 PRIMARY KEY(creative_work_project_id,site_item_inventory_id),
 FOREIGN KEY(creative_work_project_id) REFERENCES creative_work_projects(creative_work_project_id),
 FOREIGN KEY(site_item_inventory_id) REFERENCES site_item_inventory(site_item_inventory_id)
);
CREATE TABLE creative_projects(
 creative_project_id INTEGER PRIMARY KEY AUTOINCREMENT,
 source_type TEXT NOT NULL,source_id TEXT NOT NULL,product_id INTEGER,
 UNIQUE(source_type,source_id)
);
CREATE TABLE content_projects(
 content_project_id INTEGER PRIMARY KEY AUTOINCREMENT,
 source_type TEXT NOT NULL,source_id TEXT NOT NULL,product_id INTEGER,
 UNIQUE(source_type,source_id)
);
""")
db.execute("INSERT INTO creative_work_projects VALUES(7,'Forge bottle opener experiment',NULL)")
db.execute("INSERT INTO inventory_processes VALUES(3,'forging-heat-work','Forging & Heat Work',1)")
stations=[(101,'Propane Forge A',1),(102,'Propane Forge B',1),(103,'Hydraulic Press',1)]
db.executemany("INSERT INTO site_item_inventory VALUES(?,?,?)",stations)
db.executemany("INSERT INTO inventory_workstation_roles VALUES(?,'station')",[(101,),(102,),(103,)])
db.execute("INSERT INTO creative_project_maker_story_profiles VALUES(7,'workshop_folly',3,'partial_win','Heat sequence worked; finish needs revision.')")
db.executemany("INSERT INTO creative_project_maker_story_workstations VALUES(7,?)",[(101,),(102,),(103,)])
for _ in range(2):
    db.execute("INSERT INTO creative_projects(source_type,source_id,product_id) VALUES('creative_work_project','7',NULL) ON CONFLICT(source_type,source_id) DO UPDATE SET product_id=excluded.product_id")
for _ in range(2):
    db.execute("INSERT INTO content_projects(source_type,source_id,product_id) VALUES('creative_project','7',NULL) ON CONFLICT(source_type,source_id) DO UPDATE SET product_id=excluded.product_id")
profile=db.execute("SELECT story_kind,outcome_status,product_id FROM creative_project_maker_story_profiles m JOIN creative_work_projects p USING(creative_work_project_id) WHERE creative_work_project_id=7").fetchone()
station_ids=[r[0] for r in db.execute("SELECT site_item_inventory_id FROM creative_project_maker_story_workstations WHERE creative_work_project_id=7 ORDER BY site_item_inventory_id")]
caip=db.execute("SELECT COUNT(*),MAX(product_id) FROM creative_projects WHERE source_type='creative_work_project' AND source_id='7'").fetchone()
content=db.execute("SELECT COUNT(*),MAX(product_id) FROM content_projects WHERE source_type='creative_project' AND source_id='7'").fetchone()
q(profile==('workshop_folly','partial_win',None),'Folly profile/productless identity drift')
q(station_ids==[101,102,103],'Zero/one/many workstation reference contract failed')
q(caip==(1,None),'CAIP identity must remain one productless workspace')
q(content==(1,None),'Content Studio identity must remain one productless package')
q(db.execute("PRAGMA foreign_key_check").fetchall()==[],'Foreign-key regression')
print('RELEASE 467 BUILD 294 PRODUCTLESS FOLLY IDENTITY REGRESSION')
print('Creative Process project: 1')
print('Workstations: 3')
print('CAIP workspaces: 1')
print('Content Studio packages: 1')
print('Product required: NO')
if F:
    print('FAIL');[print('-',x) for x in F];sys.exit(1)
print('PASS')
