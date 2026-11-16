#!/usr/bin/env python3
"""Build 726: actual SQLite checks for D1-compatible unique, append-only outbox."""
from pathlib import Path
import sqlite3
import json
ROOT=Path(__file__).resolve().parents[1]
migration=ROOT/"migrations/canonical/0051_release467_event_outbox_dedupe_ack_deadletter.sql"
manifest=json.loads((ROOT/"migrations/canonical/manifest.json").read_text())
assert manifest["migrations"][-1]["version"]==51
assert manifest["migrations"][-1]["file"]==migration.name
db=sqlite3.connect(":memory:")
db.execute("PRAGMA foreign_keys=ON")
db.execute("CREATE TABLE users(user_id INTEGER PRIMARY KEY)")
db.execute("INSERT INTO users(user_id) VALUES (77)")
db.executescript(migration.read_text())
names={x[0] for x in db.execute("SELECT name FROM sqlite_master WHERE type='table'")}
assert {"dnd_event_outbox_726","dnd_event_dispositions_726"}<=names
def row(event_id="11111111-1111-4111-8111-111111111111",digest="a"*64):
 return (event_id,digest,"DND_HEALTH_EVIDENCE","ai-data-platform","b"*40,
         "c"*64,"d"*64,77)
insert="INSERT INTO dnd_event_outbox_726(event_id,dedupe_sha256,event_type,target_app,source_main_sha,tenant_scope_sha256,consent_scope_sha256,created_by_user_id) VALUES(?,?,?,?,?,?,?,?)"
db.execute(insert,row())
def denied(fn,label):
 try:
  fn()
 except sqlite3.IntegrityError:
  return
 raise AssertionError("Fail-closed database constraint not enforced: "+label)
denied(lambda:db.execute(insert,row("22222222-2222-4222-8222-222222222222")),"atomic dedupe unique")
denied(lambda:db.execute(insert,row(digest="e"*64)),"event id unique")
denied(lambda:db.execute(insert,(
 "33333333-3333-4333-8333-333333333333","e"*64,"CREDIT_CARD_PAYLOAD",
 "ai-data-platform","b"*40,"c"*64,"d"*64,77)),"no private family")
denied(lambda:db.execute(insert,(
 "33333333-3333-4333-8333-333333333333","e"*64,"DND_HEALTH_EVIDENCE",
 "rosiedazzlers","b"*40,"c"*64,"d"*64,77)),"only predeclared Master targets")
denied(lambda:db.execute(
 "UPDATE dnd_event_outbox_726 SET target_app='rosevear-ai-hub' WHERE event_id=?",
 ("11111111-1111-4111-8111-111111111111",)),"immutable outbox update")
denied(lambda:db.execute("DELETE FROM dnd_event_outbox_726"),"immutable outbox deletion")
receipt="INSERT INTO dnd_event_dispositions_726(event_id,decision,evidence_sha256,original_peer_signature_valid,note,created_by_user_id) VALUES(?,?,?,?,?,?)"
a="11111111-1111-4111-8111-111111111111"
db.execute(receipt,(a,"LOCAL_DEAD_LETTER","e"*64,0,
 "Local operator review confirmed held delivery; no network dispatch performed.",77))
denied(lambda:db.execute(receipt,(a,"LOCAL_DEAD_LETTER","e"*64,0,
 "Repeated local review cannot create a second terminal event disposition.",77)),"duplicate terminal decision")
denied(lambda:db.execute(receipt,(a,"SIGNED_ACK_REVIEW","f"*64,1,
 "Signed peer envelope review cannot overwrite a local dead-letter disposition.",77)),"ACK-after-deadletter conflicts")
denied(lambda:db.execute("UPDATE dnd_event_dispositions_726 SET note='rewritten'"),"immutable receipt update")
denied(lambda:db.execute("DELETE FROM dnd_event_dispositions_726"),"immutable receipt deletion")
b="22222222-2222-4222-8222-222222222222"
db.execute(insert,row(b,"f"*64))
denied(lambda:db.execute(receipt,(b,"SIGNED_ACK_REVIEW","b"*64,0,
 "Unsigned source must not create ACK review even with a valid event.",77)),"signed ACK must be cryptographically verified")
denied(lambda:db.execute(
 "INSERT INTO dnd_event_dispositions_726(event_id,decision,evidence_sha256,original_peer_signature_valid,source_origin_outside_verified,note,created_by_user_id) VALUES(?,?,?,?,?,?,?)",
 (b,"SIGNED_ACK_REVIEW","b"*64,1,1,
 "Do not invent independent source-of-origin or external delivery validity.",77)),"original source outside cannot be asserted by local DB")
db.execute(receipt,(b,"SIGNED_ACK_REVIEW","b"*64,1,
 "Signed metadata reviewed locally, not a proven external transport ACK.",77))
assert db.execute("SELECT COUNT(*) FROM dnd_event_outbox_726").fetchone()[0]==2
assert db.execute("SELECT COUNT(*) FROM dnd_event_dispositions_726").fetchone()[0]==2
assert db.execute("PRAGMA foreign_key_check").fetchall()==[]
print("Build726 D1 migration 0051 unique source-only deduped events, append-only mutually exclusive ACK/DLQ: PASS")
