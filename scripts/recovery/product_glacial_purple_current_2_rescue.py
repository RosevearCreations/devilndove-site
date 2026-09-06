#!/usr/bin/env python3
"""Exact two-key recovery for the current Glacial Purple Product references."""
from __future__ import annotations
import argparse, hashlib, json, pathlib, secrets, shutil, time, urllib.error, urllib.parse, urllib.request, zipfile
import product_glacial_purple_exact_rescue as base

PROJECT="devilndove-product-r2-exact-recovery"
BUCKET="devilndove-toolshed-images"
SHARE="F0H9FST_bqsA"
ZIP_NAME="product-glacial-purple-current-2-rescue.zip"
ZIP_SIZE=4022135
ZIP_SHA="767a532ecca3e5cc5ca02ff4833a89b0de3c02857ad097af2ec8e3582461ab47"
PUBLIC="https://devilndove.com/api/product-media"
ROOT=pathlib.Path("/tmp/product-glacial-purple-current-2-rescue")
PAYLOAD=ROOT/"payload"; PROOF=ROOT/"proof"; BRIDGE=ROOT/"bridge"; TOKEN=ROOT/"recovery-token"; ZIP=ROOT/ZIP_NAME
EXPECTED={
 "products/39/1784128843832-1-12ac5543-0b39-46d2-97fd-bdeafb01539c.jpg":{"original_filename":"20260714_122022-Copy.jpg","size":2293542,"sha256":"b56656596983af1e5b336c3de71f992642ab61e7b6d9366e127b3dd8a89531cd"},
 "products/39/1784128845236-5-37ee2c65-e332-4816-b323-568b4d0e17cd.jpg":{"original_filename":"20260714_122742.jpg","size":1775354,"sha256":"74e036275fd21d4d360e7006912648666c15aed342949c211124bde9f9e78c14"},
}

def log(*a): print(*a,flush=True)
def reset():
    if ROOT.exists(): shutil.rmtree(ROOT)
    for p in (PAYLOAD,PROOF,BRIDGE): p.mkdir(parents=True,exist_ok=True)

def download():
    _,_,listing=base.request_json(f"{base.FIRESTORAGE_API}/shares/{SHARE}/files?maxResults=100")
    item=next((x for x in listing.get("files") or [] if (x.get("fileName") or x.get("name"))==ZIP_NAME),None); assert item
    size=int(item.get("sizeBytes") if item.get("sizeBytes") is not None else item.get("size") or 0); assert size==ZIP_SIZE
    fid=item.get("fileId") or item.get("id"); assert fid
    _,_,meta=base.request_json(f"{base.FIRESTORAGE_API}/shares/{SHARE}/files/{fid}/download",method="POST")
    _,_,body=base.request_bytes(meta["downloadUrl"],timeout=180)
    assert len(body)==ZIP_SIZE and base.sha256_bytes(body)==ZIP_SHA
    ZIP.write_bytes(body)
    (PROOF/"bundle-verification.json").write_text(json.dumps({"size":ZIP_SIZE,"sha256":ZIP_SHA},indent=2))
    log("BUNDLE=PASS",ZIP_SIZE,ZIP_SHA)

def validate():
    rows=[]
    with zipfile.ZipFile(ZIP) as z:
        m=json.loads(z.read("manifest.json")); assert m["product_id"]==39 and m["product_name"]=="Glacial Purple" and m["count"]==2
        assert m["safety"]=={"d1_mutation":False,"r2_delete":False,"overwrite_allowed":False}
        by={x["target_key"]:x for x in m["items"]}; assert set(by)==set(EXPECTED)
        for key in sorted(EXPECTED):
            a=EXPECTED[key]; x=by[key]
            assert x["original_filename"]==a["original_filename"] and x["size"]==a["size"] and x["sha256"]==a["sha256"]
            b=z.read(a["original_filename"]); assert len(b)==a["size"] and base.sha256_bytes(b)==a["sha256"]
            assert b[:3]==b"\xff\xd8\xff" and b.rfind(b"\xff\xd9")>2
            p=PAYLOAD/a["original_filename"]; p.write_bytes(b)
            rows.append({"key":key,**a,"local_file":str(p)})
    (PROOF/"restore-manifest.json").write_text(json.dumps(rows,indent=2))
    log("PAYLOAD=PASS keys=2"); return rows

def build(rows):
    token=secrets.token_hex(32); th=hashlib.sha256(token.encode()).hexdigest()
    t=pathlib.Path("scripts/recovery/product-r2-exact-bridge-template.js").read_text()
    expected={r["key"]:r["sha256"] for r in rows}
    source=t.replace("__EXPECTED_JSON__",json.dumps(expected,separators=(",",":"))).replace("__TOKEN_SHA256__",th)
    f=BRIDGE/"functions"/"api"; f.mkdir(parents=True); (f/"recovery.js").write_text(source)
    (BRIDGE/"index.html").write_text("<!doctype html><title>Product current-key recovery</title>")
    (BRIDGE/"wrangler.toml").write_text(
      f'name = "{PROJECT}"\ncompatibility_date = "2026-09-05"\npages_build_output_dir = "."\n\n'
      f'[[r2_buckets]]\nbinding = "PRODUCT_PROD_BUCKET"\nbucket_name = "{BUCKET}"\npreview_bucket_name = "{BUCKET}"\n')
    TOKEN.write_text(token); TOKEN.chmod(0o600)
    (PROOF/"bridge-authority.json").write_text(json.dumps({"bucket":BUCKET,"authorized_keys":sorted(expected),"token_sha256":th,"d1_binding_present":False,"delete_route_present":False,"conditional_no_overwrite":True},indent=2))
    log("BRIDGE=PASS keys=2")

def prepare():
    reset(); download(); rows=validate(); build(rows); log("PREPARE=PASS")

def probe(row,marker):
    u=PUBLIC+"?"+urllib.parse.urlencode({"key":row["key"],marker:str(time.time_ns())})
    req=urllib.request.Request(u,headers={"Accept":"image/*","Cache-Control":"no-store","User-Agent":"dnd-product-current2/1.0"})
    try:
        with urllib.request.urlopen(req,timeout=30) as resp: return int(resp.status),str(resp.headers.get("Content-Type") or "").lower(),resp.read(20*1024*1024)
    except urllib.error.HTTPError as e: return int(e.code),"",b""

def preflight(rows):
    out={}; ev=[]
    for r in rows:
        status,_,b=probe(r,"current2_preflight")
        if status==404: state="missing"
        elif status==200 and len(b)==r["size"] and base.sha256_bytes(b)==r["sha256"]: state="already_exact"
        else: raise RuntimeError(f"preflight conflict {r['key']} HTTP {status} bytes {len(b)}")
        out[r["key"]]=state; ev.append({"key":r["key"],"state":state}); log("PREFLIGHT",r["key"],state)
    (PROOF/"live-preflight.json").write_text(json.dumps(ev,indent=2)); return out

def guard(url,token,rows):
    ev={}
    ev["wrong_token"]=base.retry_expected("WRONG_TOKEN_GUARD",lambda:base.bridge_post(url,"wrong-token","products/999/not-authorized.jpg",b"blocked"),403)
    ev["unauthorized_key"]=base.retry_expected("UNAUTHORIZED_KEY_GUARD",lambda:base.bridge_post(url,token,"products/999/not-authorized.jpg",b"blocked"),403)
    ev["hash_locks"]=[]
    for r in rows:
        h=base.retry_expected("HASH_LOCK_GUARD",lambda r=r:base.bridge_post(url,token,r["key"],b"deliberately-wrong-body",probe=True),422,expected_probe=True)
        ev["hash_locks"].append({"key":r["key"],"history":h})
    ev["write_free"]=True; (PROOF/"guard-results.json").write_text(json.dumps(ev,indent=2))

def restore(rows,url,token,pre):
    out=[]
    for r in rows:
        body=pathlib.Path(r["local_file"]).read_bytes(); result=None
        for attempt in range(base.MAX_ATTEMPTS):
            try: status,p=base.bridge_post(url,token,r["key"],body,timeout=60)
            except Exception as e: status,p=0,{"error":repr(e)}
            if status==200 and p.get("ok") is True and p.get("state") in ("restored","already_exact"):
                result={"key":r["key"],"preflight_state":pre[r["key"]],"http_status":status,**p,"attempts":attempt+1}; break
            if (status in base.TRANSIENT_HTTP or status==0) and attempt<base.MAX_ATTEMPTS-1:
                time.sleep(min(30,1.5*(2**min(attempt,5)))); continue
            raise RuntimeError(f"restore failed {r['key']} HTTP {status} {json.dumps(p)[:800]}")
        assert result and int(result.get("size") or 0)==r["size"] and result.get("sha256")==r["sha256"]
        out.append(result); log("RESTORE=PASS",r["key"],result["state"])
    (PROOF/"restore-results.json").write_text(json.dumps(out,indent=2)); return out

def verify(rows):
    out=[]
    for r in rows:
        exact=None
        for attempt in range(base.MAX_ATTEMPTS):
            status,ct,b=probe(r,"current2_verify"); sha=base.sha256_bytes(b) if b else ""
            if status==200 and ct.startswith("image/") and len(b)==r["size"] and sha==r["sha256"]:
                exact={"key":r["key"],"state":"exact","size":len(b),"sha256":sha}; break
            if status in base.TRANSIENT_HTTP or status==404:
                time.sleep(min(20,1.5*(2**min(attempt,4)))); continue
            raise RuntimeError(f"public verify failed {r['key']} HTTP {status}")
        if not exact: raise RuntimeError(f"public verify retry exhausted {r['key']}")
        out.append(exact); log("PUBLIC=PASS",r["key"])
    (PROOF/"public-verification.json").write_text(json.dumps(out,indent=2)); return out

def upload(base_url):
    rows=json.loads((PROOF/"restore-manifest.json").read_text()); token=TOKEN.read_text().strip()
    pre=preflight(rows); endpoint=base_url.rstrip("/")+"/api/recovery"; guard(endpoint,token,rows)
    writes=restore(rows,endpoint,token,pre); pub=verify(rows)
    s={"total":2,"restored":sum(x["state"]=="restored" for x in writes),"already_exact":sum(x["state"]=="already_exact" for x in writes),"public_exact":len(pub),"d1_mutation":False,"r2_delete":False,"overwrite_allowed":False}
    (PROOF/"restore-summary.json").write_text(json.dumps(s,indent=2)); log(json.dumps(s,indent=2))

def main():
    p=argparse.ArgumentParser(); s=p.add_subparsers(dest="cmd",required=True); s.add_parser("prepare"); u=s.add_parser("upload"); u.add_argument("--base-url",required=True)
    a=p.parse_args(); prepare() if a.cmd=="prepare" else upload(a.base_url)
if __name__=="__main__": main()
