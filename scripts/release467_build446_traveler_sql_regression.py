#!/usr/bin/env python3
"""Build 446: multi-session maker traveler, cure and receipt-level source integrity."""
from pathlib import Path
import sqlite3
import tempfile

root = Path(__file__).resolve().parents[1]
sql = (root / 'migrations/canonical/0042_release467_guided_manufacturing_traveler.sql').read_text()
with tempfile.TemporaryDirectory(prefix='dd446-') as folder:
    file = str(Path(folder) / 'maker.sqlite')
    db = sqlite3.connect(file)
    db.execute('PRAGMA foreign_keys=ON')
    db.executescript('''
    CREATE TABLE users(user_id INTEGER PRIMARY KEY);
    CREATE TABLE creative_work_projects(creative_work_project_id INTEGER PRIMARY KEY);
    CREATE TABLE creative_project_operations(creative_project_operation_id INTEGER PRIMARY KEY,creative_work_project_id INTEGER);
    CREATE TABLE site_item_inventory(site_item_inventory_id INTEGER PRIMARY KEY,is_active INTEGER,on_hand_quantity REAL);
    CREATE TABLE creative_work_events(creative_work_event_id INTEGER PRIMARY KEY,creative_work_project_id INTEGER,entry_status TEXT);
    CREATE TABLE creative_work_order_events(creative_work_order_event_id INTEGER PRIMARY KEY,creative_work_project_id INTEGER,creative_project_operation_id INTEGER,event_kind TEXT,minutes_worked INTEGER);
    CREATE TABLE creative_project_job_travelers(creative_project_job_traveler_id INTEGER PRIMARY KEY,creative_work_project_id INTEGER,traveler_status TEXT,snapshot_sha256 TEXT,snapshot_json TEXT);
    INSERT INTO users VALUES(1);
    INSERT INTO creative_work_projects VALUES(10),(20);
    INSERT INTO creative_project_operations VALUES(101,10),(102,10),(201,20);
    INSERT INTO site_item_inventory VALUES(501,1,5.0),(502,1,7.0);
    INSERT INTO creative_work_events VALUES(301,10,'active'),(302,20,'active'),(303,10,'voided');
    INSERT INTO creative_work_order_events VALUES(401,10,101,'time',45),(402,10,102,'time',15),(403,20,201,'time',15);
    INSERT INTO creative_project_job_travelers VALUES(90,10,'reviewed',
    'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
    '{"operations":[{"creative_project_operation_id":101,"operation_order":1},{"creative_project_operation_id":102,"operation_order":2}]}');
    ''')
    db.executescript(sql)
    before = db.execute('SELECT * FROM site_item_inventory ORDER BY 1').fetchall()
    digest = 'b' * 64
    db.execute("INSERT INTO maker_traveler_runs(creative_project_job_traveler_id,creative_work_project_id,snapshot_sha256,started_by_user_id,run_note,request_key,payload_sha256) VALUES(90,10,?,1,'Actual resin and polish commission','maker-run-446-long',?)", ('a' * 64,digest))
    for operation, order in ((101,1),(102,2)):
        db.execute("INSERT INTO maker_traveler_run_steps(maker_traveler_run_id,creative_project_operation_id,operation_order,title_snapshot,resource_snapshot_json) VALUES(1,?,?,?,?)", (operation,order,'Resin pour' if order==1 else 'Polish','[]'))

    def record(kind, step=1, key=None, note=None, due=None, evidence=None, time=None, equipment=None, substitution=None):
        key = key or 'maker-event-'+str(db.execute('SELECT COUNT(*) FROM maker_traveler_step_events').fetchone()[0]+1)+'-446'
        db.execute('''INSERT INTO maker_traveler_step_events(maker_traveler_run_step_id,event_kind,event_note,checkpoint_due_at,creative_work_event_id,creative_work_order_event_id,equipment_state,substitute_site_item_inventory_id,actor_user_id,request_key,payload_sha256)
        VALUES(?,?,?,?,?,?,?,?,1,?,?)''',(step,kind,note or 'Operator reviewed real step',due,evidence,time,equipment,substitution,key,digest))

    def reject(label, fn):
        try:
            fn()
        except sqlite3.IntegrityError:
            return
        raise AssertionError(label+' was accepted')

    reject('unapproved traveler', lambda: db.execute("INSERT INTO maker_traveler_runs(creative_project_job_traveler_id,creative_work_project_id,snapshot_sha256,started_by_user_id,run_note,request_key,payload_sha256) VALUES(90,20,?,1,'Incorrect project trial','wrong-project-446',?)", ('a'*64,digest)))
    reject('wrong snapshot operation', lambda: db.execute("INSERT INTO maker_traveler_run_steps(maker_traveler_run_id,creative_project_operation_id,operation_order,title_snapshot,resource_snapshot_json) VALUES(1,201,3,'Cross project','[]')"))
    reject('step not started', lambda: record('check'))
    record('start')
    reject('start twice', lambda: record('start'))
    record('equipment',equipment='unavailable')
    record('hold')
    reject('complete on equipment hold',lambda: record('complete'))
    db.commit()
    db.close()
    # A separate browser session / new connection resumes the exact operator history.
    db = sqlite3.connect(file)
    db.execute('PRAGMA foreign_keys=ON')
    assert db.execute("SELECT COUNT(*) FROM maker_traveler_step_events WHERE maker_traveler_run_step_id=1").fetchone()[0]==3
    record('resume')
    record('substitution',substitution=502)
    reject('wrong-project photo evidence',lambda: record('evidence_link',evidence=302))
    reject('voided evidence',lambda: record('evidence_link',evidence=303))
    record('evidence_link',evidence=301)
    reject('wrong-operation time',lambda: record('time_link',time=402))
    reject('wrong-project time',lambda: record('time_link',time=403))
    record('time_link',time=401)
    reject('same time receipt in another step',lambda: (record('start',step=2),record('time_link',step=2,time=401)))
    reject('duplicate idempotency key',lambda: record('check',key='maker-event-1-446'))
    record('checkpoint',due='2099-01-01T12:00:00Z')
    record('check')
    reject('premature cure completion',lambda: record('complete'))
    # Complete a second step without a future cure deadline.
    record('check',step=2)
    record('complete',step=2)
    reject('completed step event',lambda: record('time_link',step=2,time=402))
    reject('rewrite step notes',lambda: db.execute("UPDATE maker_traveler_run_steps SET title_snapshot='Silently changed' WHERE maker_traveler_run_step_id=1"))
    reject('rewrite evidence',lambda: db.execute("UPDATE maker_traveler_step_events SET event_note='Changed' WHERE maker_traveler_step_event_id=1"))
    reject('delete event',lambda: db.execute('DELETE FROM maker_traveler_step_events WHERE maker_traveler_step_event_id=1'))
    assert db.execute('SELECT * FROM site_item_inventory ORDER BY 1').fetchall()==before, 'Inventory changed while executing traveler'
    assert db.execute('SELECT SUM(w.minutes_worked) FROM maker_traveler_step_events e JOIN creative_work_order_events w ON w.creative_work_order_event_id=e.creative_work_order_event_id WHERE e.event_kind="time_link"').fetchone()[0]==45
    assert db.execute('PRAGMA foreign_key_check').fetchall()==[]
    db.close()
print('BUILD446_TRAVELER_SQL=GREEN; multi-session resume, evidence/time provenance, future cure hold, duplicate receipts, immutable history, zero Inventory writes')
