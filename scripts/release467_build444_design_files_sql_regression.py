#!/usr/bin/env python3
"""Build 444: D1 SQLite immutable provenance, review and exact-output lineage proof."""
from pathlib import Path
import sqlite3
import re

root=Path(__file__).resolve().parents[1]
sql=(root/'migrations/canonical/0040_release467_maker_design_file_revisions.sql').read_text()
conn=sqlite3.connect(':memory:')
conn.execute('PRAGMA foreign_keys=ON')
conn.executescript('''
CREATE TABLE users(user_id INTEGER PRIMARY KEY);
CREATE TABLE creative_work_projects(creative_work_project_id INTEGER PRIMARY KEY);
CREATE TABLE creative_work_outputs(creative_work_output_id INTEGER PRIMARY KEY,creative_work_project_id INTEGER NOT NULL);
INSERT INTO users VALUES(1);
INSERT INTO creative_work_projects VALUES(11),(22);
INSERT INTO creative_work_outputs VALUES(100,11),(200,22);
''')
conn.executescript(sql)
checks=0
def check_reject(label,sql_stmt,params=()):
    global checks
    try:
        conn.execute(sql_stmt,params)
    except sqlite3.IntegrityError:
        checks+=1
        return
    raise AssertionError(label+' incorrectly accepted')
def upload(project,key,rev,parent,hashchar):
    conn.execute('''INSERT INTO maker_design_file_revisions(creative_work_project_id,design_key,revision_no,parent_revision_id,design_title,original_filename,file_extension,object_key,sha256_hex,file_size_bytes,source_license,machine_readiness,created_by_user_id,request_key)
     VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?)''',
     (project,key,rev,parent,'Ring','ring.stl','stl',f'private/{project}/{key}/{rev}',hashchar*64,512,'own_work','ready',1,f'request_{project}_{key}_{rev}'))
upload(11,'ring',1,None,'a')
check_reject('missing parent',"INSERT INTO maker_design_file_revisions(creative_work_project_id,design_key,revision_no,design_title,original_filename,file_extension,object_key,sha256_hex,file_size_bytes,source_license,created_by_user_id,request_key) VALUES(11,'ring',2,'Wrong','ring.stl','stl','private/wrong','"+'b'*64+"',200,'unknown',1,'bad_key')")
upload(11,'ring',2,1,'b')
check_reject('immutable file','UPDATE maker_design_file_revisions SET sha256_hex=? WHERE maker_design_file_revision_id=1',('c'*64,))
check_reject('immutable delete','DELETE FROM maker_design_file_revisions WHERE maker_design_file_revision_id=1')
check_reject('cross project revision','INSERT INTO maker_design_output_links(creative_work_project_id,creative_work_output_id,maker_design_file_revision_id,link_note) VALUES(22,200,2,?)',('Manufactured from latest',))
check_reject('unapproved link','INSERT INTO maker_design_output_links(creative_work_project_id,creative_work_output_id,maker_design_file_revision_id,link_note) VALUES(11,100,2,?)',('Manufactured from latest',))
conn.execute("INSERT INTO maker_design_revision_reviews(maker_design_file_revision_id,review_status,review_note,reviewed_by_user_id) VALUES(1,'rejected','Failed revision stays visible',1)")
conn.execute("INSERT INTO maker_design_revision_reviews(maker_design_file_revision_id,review_status,review_note,reviewed_by_user_id) VALUES(2,'approved','Manually checked CAD and rights',1)")
conn.execute("INSERT INTO maker_design_output_links(creative_work_project_id,creative_work_output_id,maker_design_file_revision_id,link_note,linked_by_user_id) VALUES(11,100,2,'Manufactured exact second revision',1)")
assert conn.execute('SELECT maker_design_file_revision_id FROM maker_design_file_revisions ORDER BY revision_no').fetchall()==[(1,),(2,)]
assert conn.execute('SELECT sha256_hex FROM maker_design_output_links JOIN maker_design_file_revisions USING(maker_design_file_revision_id)').fetchone()==('b'*64,)
check_reject('review history immutable','DELETE FROM maker_design_revision_reviews WHERE maker_design_file_revision_id=1')
check_reject('output history immutable','UPDATE maker_design_output_links SET maker_design_file_revision_id=1 WHERE maker_design_output_link_id=1')
check_reject('cross project output','INSERT INTO maker_design_output_links(creative_work_project_id,creative_work_output_id,maker_design_file_revision_id,link_note) VALUES(11,200,2,?)',('Cannot associate other outputs',))
assert not conn.execute('PRAGMA foreign_key_check').fetchall()

# Execute the *actual* INSERT SELECT/HAVING SQL used by the Cloudflare upload
# handler, checking bind count, first-parent NULL and atomic stale-parent guard.
api=(root/'functions/api/admin/project-design-files.js').read_text()
match=re.search(r'INSERT INTO maker_design_file_revisions\([\s\S]*?HAVING COALESCE\(MAX\(maker_design_file_revision_id\),0\)=\?',api)
assert match,'Upload SQL missing from API'
insert_sql=match.group(0)
assert insert_sql.count('?')==18,insert_sql.count('?')
params=(22,'wax-tree',None,'Wax tree r1','tree.stl','stl','maker-designs/22/tree.stl','d'*64,720,'own_work','','ready','First model',1,'u_test_444_001',22,'wax-tree',0)
conn.execute(insert_sql,params)
assert conn.execute("SELECT revision_no FROM maker_design_file_revisions WHERE design_key='wax-tree'").fetchone()==(1,)
stale=(22,'wax-tree',1,'Wax tree stale','stale.stl','stl','maker-designs/22/stale.stl','e'*64,720,'own_work','','ready','Stale model',1,'u_test_444_002',22,'wax-tree',0)
assert conn.execute(insert_sql,stale).rowcount==0,'Stale parent insertion was not blocked'
assert not conn.execute('PRAGMA foreign_key_check').fetchall()
print(f'BUILD444_SQL_REGRESSION=GREEN; {checks} invalid writes rejected; failed r1 preserved, output traces approved r2 SHA-256; API insert tested')
