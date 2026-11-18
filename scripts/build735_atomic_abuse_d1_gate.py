#!/usr/bin/env python3
"""Build 735: exercise the exact original D1 conditional INSERT, not a copied approximation."""
import re, sqlite3,uuid
from pathlib import Path
R=Path(__file__).resolve().parents[1]
source=(R/'functions/api/auth/recovery-734.js').read_text()
m=re.search(r"db\.prepare\(`(INSERT INTO dnd_auth_recovery_attempts_734[\s\S]*?)`\)\s*\.bind\(crypto\.randomUUID\(\),action,identityHash,ipHash,\s*action,identityHash,action,ipHash\)\.run\(\)",source)
assert m,'Original recovery gate must issue one source conditional D1 INSERT, never stale SELECT then INSERT'
sql=m.group(1)
assert sql.lstrip().startswith('INSERT') and sql.count('?')==8
assert 'COUNT(*)' in sql and "identity_sha256=?" in sql and "ip_sha256=?" in sql
db=sqlite3.connect(':memory:')
db.execute('PRAGMA foreign_keys=ON')
db.executescript("CREATE TABLE users (user_id INTEGER PRIMARY KEY);")
db.executescript((R/'migrations/canonical/0056_release467_auth_recovery_privacy_sender_custody.sql').read_text())
def admit(action,identity,ip):
 before=db.total_changes
 db.execute(sql,(str(uuid.uuid4()),action,identity,ip,action,identity,action,ip))
 return db.total_changes>before
a='a'*64;ip='b'*64
assert [admit('reset_request',a,ip) for i in range(4)]==[True,True,True,False]
assert admit('account_reminder',a,ip),'action-specific scope must not collide'
ip2='d'*64
for i in range(12):
 assert admit('reset_request',f'{i:064x}',ip2)
assert not admit('reset_request','f'*64,ip2),'12 original IP attempts must block even with new identities'
assert admit('reset_request','f'*64,'e'*64),'independent IP must not be blocked'
assert not db.execute('PRAGMA foreign_key_check').fetchall()
assert not re.search(r"const rows=await db.prepare\(`SELECT[\s\S]*?by_email",source)
print('BUILD735 PASS: source SQL atomic 3/email/hour, 12/IP/hour, action separation, no stale-count read, immutable original D1')
