#!/usr/bin/env python3
"""Build 734 canonical hashed, single-use recovery receipt constraints: isolated source SQLite."""
import sqlite3
from pathlib import Path
root=Path(__file__).resolve().parents[1]
db=sqlite3.connect(':memory:');db.execute('PRAGMA foreign_keys=ON')
db.executescript("""CREATE TABLE users(user_id INTEGER PRIMARY KEY,email TEXT UNIQUE,password_hash TEXT,updated_at TEXT);
CREATE TABLE sessions(session_id INTEGER PRIMARY KEY,user_id INTEGER REFERENCES users(user_id),session_token TEXT);
INSERT INTO users VALUES(1,'test@example.invalid','hash-old',CURRENT_TIMESTAMP);
INSERT INTO sessions VALUES(1,1,'old-session');""")
db.executescript((root/'migrations/canonical/0056_release467_auth_recovery_privacy_sender_custody.sql').read_text())
def fail(sql,args=()):
 try:db.execute(sql,args)
 except sqlite3.IntegrityError:return
 raise AssertionError('Expected original D1 constraint to fail: '+sql)
a='11111111-1111-4111-8111-111111111111'
b='22222222-2222-4222-8222-222222222222'
u='33333333-3333-4333-8333-333333333333'
db.execute("""INSERT INTO dnd_password_reset_tokens_734
(reset_id,user_id,token_sha256,expires_at,sent_at)
VALUES(?,1,?,datetime('now','+30 minutes'),CURRENT_TIMESTAMP)""",(a,'a'*64))
fail("""INSERT INTO dnd_password_reset_tokens_734
(reset_id,user_id,token_sha256,expires_at)
VALUES(?,1,?,datetime('now','+30 minutes'))""",(b,'a'*64))
fail("DELETE FROM dnd_password_reset_tokens_734")
fail("UPDATE dnd_password_reset_tokens_734 SET token_sha256=? WHERE reset_id=?",('f'*64,a))
db.execute("UPDATE dnd_password_reset_tokens_734 SET consumed_at=CURRENT_TIMESTAMP,claim_id=? WHERE reset_id=?",(u,a))
fail("UPDATE dnd_password_reset_tokens_734 SET consumed_at=CURRENT_TIMESTAMP,claim_id=? WHERE reset_id=?",(b,a))
db.execute("""INSERT INTO dnd_auth_recovery_attempts_734
(attempt_id,action,identity_sha256,ip_sha256) VALUES(?,?,?,?)""",(b,'reset_request','b'*64,'c'*64))
fail("DELETE FROM dnd_auth_recovery_attempts_734")
fail("UPDATE dnd_auth_recovery_attempts_734 SET action='reset_redeem'")
fail("""INSERT INTO dnd_auth_recovery_attempts_734
(attempt_id,action,identity_sha256,ip_sha256) VALUES(?,?,?,?)""",(u,'delete_all','b'*64,'c'*64))
assert db.execute("PRAGMA foreign_key_check").fetchall()==[]
print("Build734 D1 hashed reset custody, one-time use, immutable abuse receipts, foreign keys: PASS")
