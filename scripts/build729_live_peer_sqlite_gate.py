#!/usr/bin/env python3
"""Build 729: source-only original D1 peer verification immutable custody proof."""
import json,sqlite3
from pathlib import Path
root=Path(__file__).resolve().parents[1]
manifest=json.loads((root/"migrations/canonical/manifest.json").read_text())
file=root/"migrations/canonical/0053_release467_peer_enrollment_live_proof.sql"
assert manifest["migrations"][-1]["version"]==53
assert manifest["migrations"][-1]["file"]==file.name
db=sqlite3.connect(":memory:")
db.execute("PRAGMA foreign_keys=ON")
db.executescript("CREATE TABLE users(user_id INTEGER PRIMARY KEY); INSERT INTO users VALUES(1);")
db.executescript(file.read_text())
def deny(run,label):
 try:run()
 except sqlite3.IntegrityError:return
 raise AssertionError("D1 fail-closed: "+label)
id="11111111-1111-4111-8111-111111111111"
sql="""INSERT INTO dnd_peer_enrollment_proofs_729
 (proof_id,peer_app,challenge_nonce,pinned_public_key_sha256,original_enrollment_receipt_sha256,
 signed_ack_sha256,observed_live_response,signature_verified,verified_by_user_id)
 VALUES(?,?,?,?,?,?,?,?,?)"""
args=(id,"ai-data-platform","a"*32,"b"*64,"c"*64,"d"*64,1,1,1)
db.execute(sql,args)
deny(lambda:db.execute(sql,("22222222-2222-4222-8222-222222222222",*args[1:])),"no nonce replay")
deny(lambda:db.execute("UPDATE dnd_peer_enrollment_proofs_729 SET peer_app='rosevear-ai-hub'"),"no witness rewrite")
deny(lambda:db.execute("DELETE FROM dnd_peer_enrollment_proofs_729"),"no proof deletion")
deny(lambda:db.execute(sql,("33333333-3333-4333-8333-333333333333","invalid-peer","b"*32,
 "b"*64,"c"*64,"d"*64,1,1,1)),"only original known Master")
deny(lambda:db.execute(sql,("44444444-4444-4444-8444-444444444444","rosevear-ai-hub","c"*32,
 "b"*64,"c"*64,"d"*64,0,1,1)),"live response required")
deny(lambda:db.execute(sql,("55555555-5555-4555-8555-555555555555","rosevear-ai-hub","d"*32,
 "b"*64,"c"*64,"d"*64,1,0,1)),"cryptographic signature required")
assert db.execute("SELECT COUNT(*) FROM dnd_peer_enrollment_proofs_729").fetchone()[0]==1
assert db.execute("PRAGMA foreign_key_check").fetchall()==[]
print("Build729 D1 migration 0053 immutable independently signed peer challenge receipts: PASS")
