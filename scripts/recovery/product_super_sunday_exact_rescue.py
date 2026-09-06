#!/usr/bin/env python3
"""Restore one exact Super Sunday Product image to Production R2.

Safety boundary: one exact current Product key, pinned ZIP/image SHA-256 and byte size,
ephemeral token/project, write-free guards, conditional no-overwrite write, exact live
read-back, no D1 mutation and no R2 delete.
"""
from __future__ import annotations
import argparse, hashlib, json, pathlib, secrets, shutil, time, urllib.error, urllib.parse, urllib.request, zipfile
import product_glacial_purple_exact_rescue as base

PROJECT="devilndove-product-r2-exact-recovery"
BUCKET="devilndove-toolshed-images"
SHARE="Jpj9GXWegyJh"
ZIP_NAME="product-super-sunday-exact-rescue-1.zip"
ZIP_SIZE=3118133
ZIP_SHA="8980c8909d96be1b77e780bc2b77fab6404682d1e72d6dfea5eff13172e45c79"
PRODUCT_ID=30
PRODUCT_NAME="Super Sunday"
TARGET_KEY="products/30/1781972997080-3-8fb86208-064e-40a2-90df-eaac97b4a269.jpg"
ORIGINAL_FILENAME="20260608_133632.jpg"
EXPECTED_SIZE=3127031
EXPECTED_SHA="9bd6a1c10973cbf427d8eecce63f699c9778599d4e33ce206cb1888da38dd633"
PUBLIC="https://devilndove.com/api/product-media"
ROOT=pathlib.Path("/tmp/product-super-sunday-exact-rescue")
PAYLOAD=ROOT/"payload"; PROOF=ROOT/"proof"; BRIDGE=ROOT/"bridge"; TOKEN=ROOT/"recovery-token"; ZIP=ROOT/ZIP_NAME; IMAGE=PAYLOAD/ORIGINAL_FILENAME

def log(*a): print(*a,flush=True)
def reset():
    if ROOT.exists(): shutil.rmtree(ROOT)
    for p in (PAYLOAD,PROOF,BRIDGE): p.mkdir(parents=True,exist_ok=True)

def download():
    _,_,listing=base.request_json(f"{base.FIRESTORAGE_API}/shares/{SHARE}/files?maxResults=100")
    item=next((x for x in listing.get("files") or [] if (x.get("fileName") or x.get("name"))==ZIP_NAME),None); assert item
    size=int(item.get("sizeBytes") if item.get("sizeBytes") is not None else item.get("size") or 0); assert size==ZIP_SIZE,(size,ZIP_SIZE)
    fid=item.get("fileId") or item.get("id"); assert fid
    _,_,meta=base.request_json(f"{base.FIRESTORAGE_API}/shares/{SHARE}/files/{fid}/download",method="POST")
    _,_,body=base.request_bytes(meta["downloadUrl"],timeout=180)
    assert len(body)==ZIP_SIZE and base.sha256_bytes(body)==ZIP_SHA
    ZIP.write_bytes(body)
    (PROOF/"bundle-verification.json").write_text(json.dumps({"name":ZIP_NAME,"size":ZIP_SIZE,"sha256":ZIP_SHA},indent=2))
    log("BUNDLE=PASS",ZIP_SIZE,ZIP_SHA)

def validate():
    with zipfile.ZipFile(ZIP) as z:
        m=json.loads(z.read("manifest.json"))
        assert int(m.get("product_id") or 0)==PRODUCT_ID
        assert str(m.get("product_name") or "")==PRODUCT_NAME
        assert int(m.get("count") or 0)==1
        assert m.get("safety")=={"d1_mutation":False,"r2_delete":False,"overwrite_allowed":False}
        items=m.get("items") or []; assert len(items)==1
        x=items[0]
        assert x.get("target_key")==TARGET_KEY
        assert x.get("original_filename")==ORIGINAL_FILENAME
        assert int(x.get("size") or 0)==EXPECTED_SIZE
        assert x.get("sha256")==EXPECTED_SHA
        body=z.read(ORIGINAL_FILENAME)
    assert len(body)==EXPECTED_SIZE and base.sha256_bytes(body)==EXPECTED_SHA
    assert body[:3]==b"\xff\xd8\xff" and body.rfind(b"\xff\xd9")>2
    IMAGE.write_bytes(body)
    auth={"product_id":PRODUCT_ID,"product_name":PRODUCT_NAME,"key":TARGET_KEY,"original_filename":ORIGINAL_FILENAME,"size":EXPECTED_SIZE,"sha256":EXPECTED_SHA,"source":"Google Drive exact-name historical copy","d1_mutation":False,"r2_delete":False,"overwrite_allowed":False}
    (PROOF/"restore-authority.json").write_text(json.dumps(auth,indent=2))
    log("PAYLOAD=PASS",TARGET_KEY,EXPECTED_SIZE,EXPECTED_SHA)

def build():
    token=secrets.token_hex(32); th=hashlib.sha256(token.encode()).hexdigest()
    t=pathlib.Path("scripts/recovery/product-r2-exact-bridge-template.js").read_text()
    source=t.replace("__EXPECTED_JSON__",json.dumps({TARGET_KEY:EXPECTED_SHA},separators=(",",":"))).replace("__TOKEN_SHA256__",th)
    f=BRIDGE/"functions"/"api"; f.mkdir(parents=True); (f/"recovery.js").write_text(source)
    (BRIDGE/"index.html").write_text("<!doctype html><title>Product exact recovery</title>")
    (BRIDGE/"wrangler.toml").write_text(f'name = "{PROJECT}"\ncompatibility_date = "2026-09-05"\npages_build_output_dir = "."\n\n[[r2_buckets]]\nbinding = "PRODUCT_PROD_BUCKET"\nbucket_name = "{BUCKET}"\npreview_bucket_name = "{BUCKET}"\n')
    TOKEN.write_text(token); TOKEN.chmod(0o600)
    (PROOF/"bridge-authority.json").write_text(json.dumps({"bucket":BUCKET,"authorized_keys":[TARGET_KEY],"token_sha256":th,"conditional_no_overwrite":True,"d1_binding_present":False,"delete_route_present":False},indent=2))
    log("BRIDGE=PASS keys=1")

def prepare(): reset(); download(); validate(); build(); log("PREPARE=PASS")

def probe(marker):
    u=PUBLIC+"?"+urllib.parse.urlencode({"key":TARGET_KEY,marker:str(time.time_ns())})
    req=urllib.request.Request(u,headers={"Accept":"image/*","Cache-Control":"no-store","User-Agent":"dnd-product-super-sunday-rescue/1.0"})
    try:
        with urllib.request.urlopen(req,timeout=30) as resp: return int(resp.status),str(resp.headers.get("Content-Type") or "").lower(),resp.read(20*1024*1024)
    except urllib.error.HTTPError as e: return int(e.code),"",b""

def preflight():
    status,_,body=probe("super_sunday_preflight")
    if status==404: state="missing"
    elif status==200 and len(body)==EXPECTED_SIZE and base.sha256_bytes(body)==EXPECTED_SHA: state="already_exact"
    else: raise RuntimeError(f"LIVE_CONFLICT before recovery: HTTP {status} bytes {len(body)} sha={base.sha256_bytes(body) if body else ''}")
    (PROOF/"live-preflight.json").write_text(json.dumps({"key":TARGET_KEY,"state":state,"d1_mutation":False,"r2_mutation":False},indent=2))
    log("LIVE_PREFLIGHT=PASS",state); return state

def guard(url,token):
    evidence={
      "wrong_token":base.retry_expected("WRONG_TOKEN_GUARD",lambda:base.bridge_post(url,"wrong-token","products/999/not-authorized.jpg",b"blocked"),403),
      "unauthorized_key":base.retry_expected("UNAUTHORIZED_KEY_GUARD",lambda:base.bridge_post(url,token,"products/999/not-authorized.jpg",b"blocked"),403),
      "hash_lock":base.retry_expected("HASH_LOCK_GUARD",lambda:base.bridge_post(url,token,TARGET_KEY,b"deliberately-wrong-body",probe=True),422,expected_probe=True),
      "write_free":True,
    }
    (PROOF/"guard-results.json").write_text(json.dumps(evidence,indent=2))

def restore(url,token,state):
    body=IMAGE.read_bytes(); history=[]; result=None
    for attempt in range(base.MAX_ATTEMPTS):
        try: status,p=base.bridge_post(url,token,TARGET_KEY,body,timeout=60)
        except Exception as e: status,p=0,{"error":repr(e)}
        history.append({"attempt":attempt+1,"http_status":status,"payload":p})
        if status==200 and p.get("ok") is True and p.get("state") in ("restored","already_exact"):
            result={"http_status":status,**p,"attempts":attempt+1}; break
        if (status in base.TRANSIENT_HTTP or status==0) and attempt<base.MAX_ATTEMPTS-1:
            time.sleep(min(30,1.5*(2**min(attempt,5)))); continue
        raise RuntimeError(f"PRODUCT_RESTORE failed closed HTTP {status}: {json.dumps(p)[:1200]}")
    assert result and int(result.get("size") or 0)==EXPECTED_SIZE and result.get("sha256")==EXPECTED_SHA
    (PROOF/"restore-result.json").write_text(json.dumps({"preflight_state":state,"result":result,"history":history,"d1_mutation":False,"r2_delete":False,"overwrite_allowed":False},indent=2))
    log("PRODUCT_RESTORE=PASS",TARGET_KEY,result.get("state")); return result

def verify():
    attempts=[]
    for attempt in range(base.MAX_ATTEMPTS):
        status,ct,body=probe("super_sunday_verify"); sha=base.sha256_bytes(body) if body else ""
        attempts.append({"attempt":attempt+1,"http_status":status,"content_type":ct,"size":len(body),"sha256":sha})
        if status==200 and ct.startswith("image/") and len(body)==EXPECTED_SIZE and sha==EXPECTED_SHA:
            (PROOF/"public-verification.json").write_text(json.dumps({"key":TARGET_KEY,"state":"exact","attempts":attempts},indent=2)); log("PUBLIC_VERIFY=PASS",TARGET_KEY); return
        if status in base.TRANSIENT_HTTP or status==404:
            time.sleep(min(20,1.5*(2**min(attempt,4)))); continue
        raise RuntimeError(f"PUBLIC_VERIFY failed HTTP {status}")
    raise RuntimeError("PUBLIC_VERIFY retry budget exhausted")

def upload(base_url):
    token=TOKEN.read_text().strip(); state=preflight(); endpoint=base_url.rstrip("/")+"/api/recovery"; guard(endpoint,token); result=restore(endpoint,token,state); verify()
    summary={"total":1,"restored":int(result.get("state")=="restored"),"already_exact":int(result.get("state")=="already_exact"),"public_exact":1,"d1_mutation":False,"r2_delete":False,"overwrite_allowed":False}
    (PROOF/"restore-summary.json").write_text(json.dumps(summary,indent=2)); log(json.dumps(summary,indent=2))

def main():
    p=argparse.ArgumentParser(); s=p.add_subparsers(dest="cmd",required=True); s.add_parser("prepare"); u=s.add_parser("upload"); u.add_argument("--base-url",required=True)
    a=p.parse_args(); prepare() if a.cmd=="prepare" else upload(a.base_url)
if __name__=="__main__": main()
