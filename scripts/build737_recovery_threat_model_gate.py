#!/usr/bin/env python3
"""Build 737: adversarial source-SQL checks against the canonical D1 recovery schema.

Ephemeral SQLite only; no Cloudflare, Resend, user database, or credential mutations.
"""
import concurrent.futures
import hashlib
import re
import sqlite3
import tempfile
import uuid
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
source = (ROOT / "functions/api/auth/recovery-734.js").read_text()
migration = (ROOT / "migrations/canonical/0056_release467_auth_recovery_privacy_sender_custody.sql").read_text()

gate = re.search(
    r"db\.prepare\(" + re.escape(chr(96)) +
    r"(INSERT INTO dnd_auth_recovery_attempts_734[\s\S]*?)" +
    re.escape(chr(96)) +
    r"\)\s*\.bind\(crypto\.randomUUID\(\),action,identityHash,ipHash,\s*action,identityHash,action,ipHash\)\.run\(\)",
    source,
)
assert gate, "Use the exact one-statement production quota SQL"
rate_sql = gate.group(1)
assert rate_sql.count("?") == 8 and "COUNT(*)" in rate_sql

def original_sql(prefix):
    marker = "db.prepare(" + chr(96) + prefix
    assert marker in source, "Missing original source statement: " + prefix
    begin = source.index(marker) + len("db.prepare(") + 1
    return source[begin:source.index(chr(96) + ")", begin)]

lookup_sql = original_sql("SELECT u.user_id FROM dnd_password_reset_tokens_734")
claim_sql = original_sql("UPDATE dnd_password_reset_tokens_734\n    SET consumed_at")
password_sql = original_sql("UPDATE users SET password_hash=")
session_sql = original_sql("DELETE FROM sessions WHERE user_id=")
invalidate_sql = original_sql("UPDATE dnd_password_reset_tokens_734\n    SET consumed_at=CURRENT_TIMESTAMP,claim_id=reset_id")

def setup(db):
    db.execute("PRAGMA foreign_keys=ON")
    db.executescript("""CREATE TABLE users(
      user_id INTEGER PRIMARY KEY,email TEXT,is_active INTEGER DEFAULT 1,
      password_hash TEXT,updated_at TEXT);
      CREATE TABLE sessions(session_id INTEGER PRIMARY KEY,user_id INTEGER);
      INSERT INTO users(user_id,email,is_active,password_hash)
      VALUES (1,'local@example.invalid',1,'old-hash');
      INSERT INTO sessions VALUES(1,1);
    """)
    db.executescript(migration)

def admit(db, action, identity, ip):
    before = db.total_changes
    db.execute(rate_sql, (str(uuid.uuid4()),action,identity,ip,action,identity,action,ip))
    return db.total_changes == before + 1

with tempfile.TemporaryDirectory() as temp:
    filepath = str(Path(temp) / "abuse.sqlite")
    owner = sqlite3.connect(filepath, isolation_level=None, timeout=30)
    owner.execute("PRAGMA journal_mode=WAL")
    setup(owner)
    owner.close()

    # Simultaneous competing writes to the SAME account across DIFFERENT source IPs.
    # A prior SELECT -> INSERT implementation permits more than three successes.
    def concurrent_attempt(i):
        conn = sqlite3.connect(filepath, timeout=30, isolation_level=None)
        conn.execute("PRAGMA busy_timeout=30000")
        try:
            return admit(conn, "reset_request", "a"*64, format(i+1,"064x"))
        finally:
            conn.close()
    with concurrent.futures.ThreadPoolExecutor(max_workers=18) as pool:
        outcomes = list(pool.map(concurrent_attempt, range(18)))
    assert sum(outcomes) == 3, ("Mixed-IP parallel account cap", outcomes)

    db = sqlite3.connect(filepath, isolation_level=None)
    # One IP spraying 24 distinct identities must get twelve, not 24.
    results = [admit(db,"reset_request",format(100+i,"064x"),"b"*64) for i in range(24)]
    assert results == [True]*12 + [False]*12
    # Per-action limits cannot collide, and a new network is not globally blocked.
    assert admit(db,"account_reminder","a"*64,"b"*64)
    assert admit(db,"reset_request","c"*64,"c"*64)
    # Previous-hour records must not cause a permanent lockout; immutable evidence
    # is seeded with an old source timestamp, never modified or deleted.
    for i in range(3):
        db.execute("""INSERT INTO dnd_auth_recovery_attempts_734
         (attempt_id,action,identity_sha256,ip_sha256,created_at)
         VALUES(?,?,?,?,datetime('now','-61 minutes'))""",
         (str(uuid.uuid4()),"reset_request","d"*64,"e"*64))
    assert admit(db,"reset_request","d"*64,"e"*64)
    assert db.execute("PRAGMA foreign_key_check").fetchall() == []
    db.close()

db = sqlite3.connect(":memory:", isolation_level=None)
setup(db)
def issue(digest, *, expiry="+30 minutes", sent=True):
    rid = str(uuid.uuid4())
    if expiry[0] == "-":
        db.execute("""INSERT INTO dnd_password_reset_tokens_734
          (reset_id,user_id,token_sha256,created_at,expires_at,sent_at)
          VALUES(?,1,?,datetime('now','-2 hours'),datetime('now',?),?)""",
          (rid,digest,expiry,"2026-11-18 12:00:00" if sent else None))
    else:
        db.execute("""INSERT INTO dnd_password_reset_tokens_734
          (reset_id,user_id,token_sha256,expires_at,sent_at)
          VALUES(?,1,?,datetime('now',?),?)""",
          (rid,digest,expiry,"2026-11-18 12:00:00" if sent else None))
    return rid
expired = "1"*64
unsent = "2"*64
valid = "3"*64
sibling = "4"*64
issue(expired,expiry="-60 minutes")
issue(unsent,sent=False)
issue(valid)
issue(sibling)
def eligible(digest):
    return db.execute(lookup_sql,(digest,)).fetchone()
assert eligible(expired) is None, "Expired token accepted"
assert eligible(unsent) is None, "Unsent link accepted"
assert eligible("9"*64) is None
assert eligible(valid) == (1,)
claim = str(uuid.uuid4())
db.execute("BEGIN IMMEDIATE")
try:
    assert db.execute(claim_sql,(claim,valid)).rowcount == 1
    assert db.execute(password_sql,("test-only-new-hash",1,valid,claim)).rowcount == 1
    db.execute(session_sql,(1,valid,claim))
    db.execute(invalidate_sql,(1,valid,valid,claim))
    db.execute("COMMIT")
except Exception:
    db.execute("ROLLBACK")
    raise
assert db.execute("SELECT password_hash FROM users WHERE user_id=1").fetchone()[0] == "test-only-new-hash"
assert db.execute("SELECT COUNT(*) FROM sessions WHERE user_id=1").fetchone()[0] == 0
assert eligible(valid) is None, "Replay token accepted"
assert eligible(sibling) is None, "Other outstanding links survived success"
assert db.execute(claim_sql,(str(uuid.uuid4()),valid)).rowcount == 0, "Replayed claim changed state"
assert db.execute("PRAGMA foreign_key_check").fetchall() == []
db.execute("UPDATE users SET is_active=0 WHERE user_id=1")
issue("5"*64)
assert eligible("5"*64) is None, "Disabled user accepted"

# The reset token must be captured in URL fragment and erased from the client
# address bar; a tampered forwarded header must not determine the source-IP quota.
client = (ROOT / "public/js/account-help.js").read_text()
assert "history.replaceState" in client and "mode==='reset'" in client
assert "request.headers.get('X-Forwarded-For')" not in source
assert "request.headers.get('CF-Connecting-IP')" in source
assert "sent_at IS NOT NULL" in lookup_sql and "expires_at>datetime('now')" in lookup_sql
assert "claim_id=?" in password_sql and "DELETE FROM sessions" in session_sql
print("BUILD737 PASS: mixed-IP concurrent quotas, IP spraying, expiry/replay, credential/session single-use, safe one-hour release, trusted source-IP and zero live effects")
