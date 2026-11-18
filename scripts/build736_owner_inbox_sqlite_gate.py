#!/usr/bin/env python3
"""Build736: original immutable D1 owner-inbox pilot, hashed secret constraints."""
import sqlite3
from pathlib import Path
R=Path(__file__).resolve().parents[1]
db=sqlite3.connect(':memory:');db.execute('PRAGMA foreign_keys=ON')
db.execute('CREATE TABLE users(user_id INTEGER PRIMARY KEY)')
db.execute('INSERT INTO users(user_id) VALUES(3)')
db.executescript((R/'migrations/canonical/0057_release467_recovery_inbox_owner_pilot.sql').read_text())
a='11111111-1111-4111-8111-111111111111'
def expectfail(sql,params=()):
 try:db.execute(sql,params)
 except sqlite3.IntegrityError:return
 raise AssertionError('Expected source D1 constraint failure: '+sql)
db.execute("""INSERT INTO dnd_recovery_inbox_pilots_736
(pilot_id,admin_user_id,recipient_sha256,code_sha256,expires_at)
VALUES(?,3,?,?,datetime('now','+15 minutes'))""",(a,'a'*64,'b'*64))
expectfail("""INSERT INTO dnd_recovery_inbox_pilots_736
(pilot_id,admin_user_id,recipient_sha256,code_sha256,expires_at)
VALUES('22222222-2222-4222-8222-222222222222',3,?,?,datetime('now','+15 minutes'))""",('a'*64,'b'*64))
expectfail("DELETE FROM dnd_recovery_inbox_pilots_736")
expectfail("UPDATE dnd_recovery_inbox_pilots_736 SET code_sha256=? WHERE pilot_id=?",('c'*64,a))
expectfail("UPDATE dnd_recovery_inbox_pilots_736 SET inbox_confirmed_at=CURRENT_TIMESTAMP WHERE pilot_id=?",(a,))
db.execute("""UPDATE dnd_recovery_inbox_pilots_736 SET provider_accepted_at=CURRENT_TIMESTAMP,
provider_message_sha256=? WHERE pilot_id=?""",('d'*64,a))
db.execute("""UPDATE dnd_recovery_inbox_pilots_736 SET
inbox_confirmed_at=CURRENT_TIMESTAMP WHERE pilot_id=?""",(a,))
expectfail("UPDATE dnd_recovery_inbox_pilots_736 SET provider_message_sha256=? WHERE pilot_id=?",('e'*64,a))
expectfail("UPDATE dnd_recovery_inbox_pilots_736 SET inbox_confirmed_at=NULL WHERE pilot_id=?",(a,))
expectfail("UPDATE dnd_recovery_inbox_pilots_736 SET failed_attempts=-1 WHERE pilot_id=?",(a,))
expectfail("UPDATE dnd_recovery_inbox_pilots_736 SET failed_attempts=6 WHERE pilot_id=?",(a,))
assert db.execute('PRAGMA foreign_key_check').fetchall()==[]
print('BUILD736 PASS: original D1 hashed code, provider vs inbox proof, immutable witness, attempt bounds, FK integrity')
