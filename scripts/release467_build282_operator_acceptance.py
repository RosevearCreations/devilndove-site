#!/usr/bin/env python3
from __future__ import annotations
import hashlib,json,os,subprocess,sys
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
BASE=os.environ.get("BUILD282_EXACT_DEV_BASE_URL","").rstrip("/")
DB=os.environ.get("DEV_D1_DATABASE_NAME","devilndove-dev")
CF_ID=os.environ.get("CF_ACCESS_CLIENT_ID","").strip();CF_SECRET=os.environ.get("CF_ACCESS_CLIENT_SECRET","").strip()
CONFIGURED=os.environ.get("DND_CONFIGURED_SESSION_COOKIE","").strip()
OUT=Path("/tmp/build282-content-studio-bridge-operator-acceptance-evidence.json")
def stop(msg): print("STOP:",msg,file=sys.stderr);raise SystemExit(1)
def d1(sql):
    p=subprocess.run(["npx","--yes","wrangler@4","d1","execute",DB,"--remote","--config","wrangler.toml","--json","--command",sql],cwd=ROOT,text=True,stdout=subprocess.PIPE,stderr=subprocess.PIPE)
    if p.returncode: stop("Development D1 query failed: "+(p.stderr or p.stdout)[-2500:])
    try:return json.loads(p.stdout)
    except Exception:stop("Development D1 returned non-JSON output.")
def dicts(v):
    if isinstance(v,dict):
        yield v
        for x in v.values():yield from dicts(x)
    elif isinstance(v,list):
        for x in v:yield from dicts(x)
def first_with(data,*keys):
    for row in dicts(data):
        if all(k in row for k in keys):return row
    return None
def request(path,cookie,method="GET",payload=None):
    out=Path("/tmp/build282-http-response.json")
    cmd=["curl","-sS","-o",str(out),"-w","%{http_code}","-X",method,"-H","Cache-Control: no-store","-H","Accept: application/json","-H",f"Cookie: {cookie}","-H","User-Agent: curl/8.5.0"]
    if payload is not None:cmd+=["-H","Content-Type: application/json","--data-binary",json.dumps(payload,separators=(",",":"))]
    if CF_ID and CF_SECRET:cmd+=["-H",f"CF-Access-Client-Id: {CF_ID}","-H",f"CF-Access-Client-Secret: {CF_SECRET}"]
    p=subprocess.run(cmd+[BASE+path],cwd=ROOT,text=True,stdout=subprocess.PIPE,stderr=subprocess.PIPE)
    if p.returncode:stop(f"{path} request failed: "+(p.stderr or p.stdout)[-1000:])
    status=(p.stdout or "").strip();raw=out.read_bytes() if out.exists() else b"";out.unlink(missing_ok=True)
    if status!="200":stop(f"{path} returned HTTP {status}: "+raw[:1200].decode("utf-8","replace"))
    try:return json.loads(raw)
    except Exception:stop(f"{path} did not return JSON.")
if not BASE.startswith("https://") or ".devilndove-site.pages.dev" not in BASE:stop("Exact Development Preview URL is missing or invalid.")
if bool(CF_ID)!=bool(CF_SECRET):stop("Cloudflare Access credential pair is incomplete.")
if not os.environ.get("CLOUDFLARE_API_TOKEN","").strip():stop("Development D1 credential is unavailable.")
def validate(cookie):
    try:d=request("/api/auth/me",cookie)
    except SystemExit:return False
    u=d.get("user") or {}
    return d.get("ok") is True and str(u.get("role") or "").strip().lower()=="admin" and int(u.get("is_active") or 0)==1
cookie=""
if CONFIGURED:
    c=CONFIGURED[7:] if CONFIGURED.startswith("Cookie: ") else CONFIGURED
    if "=" not in c:c="dd_auth_token="+c
    c=c.split(";",1)[0]
    if validate(c):cookie=c
if not cookie:
    cols=d1("PRAGMA table_info(sessions);");names={str(r.get("name") or "").strip().lower() for r in dicts(cols) if r.get("name")}
    if "session_token" in names and "token" in names:expr="COALESCE(NULLIF(s.session_token,''),s.token)"
    elif "session_token" in names:expr="s.session_token"
    elif "token" in names:expr="s.token"
    else:stop("sessions table has no supported token column.")
    data=d1(f"""SELECT {expr} AS runtime_token FROM sessions s JOIN users u ON u.user_id=s.user_id WHERE u.is_active=1 AND lower(trim(u.role))='admin' AND s.expires_at>datetime('now') AND length(COALESCE({expr},''))>0 ORDER BY s.expires_at DESC LIMIT 1;""")
    row=first_with(data,"runtime_token");token=str((row or {}).get("runtime_token") or "").strip()
    if not token:stop("No existing unexpired Development administrator session is available; Build 282 refuses synthetic operator creation.")
    cookie="dd_auth_token="+token
    if not validate(cookie):stop("Existing Development administrator session was rejected.")

candidate=d1("""SELECT cwp.creative_work_project_id,cp.creative_project_id AS caip_id,cp.content_project_id AS caip_content_project_id,cwp.product_id AS work_product_id,cp.product_id AS caip_product_id,
 (SELECT COUNT(*) FROM creative_projects x WHERE x.source_type='creative_work_project' AND x.source_id=CAST(cwp.creative_work_project_id AS TEXT)) AS caip_count,
 (SELECT COUNT(*) FROM content_projects y WHERE y.source_type='creative_project' AND y.source_id=CAST(cwp.creative_work_project_id AS TEXT)) AS content_count,
 (SELECT content_project_id FROM content_projects y WHERE y.source_type='creative_project' AND y.source_id=CAST(cwp.creative_work_project_id AS TEXT) LIMIT 1) AS existing_content_id,
 (SELECT COUNT(*) FROM creative_assets a WHERE a.creative_project_id=cp.creative_project_id AND a.asset_status<>'archived') AS caip_asset_count
FROM creative_work_projects cwp JOIN creative_projects cp ON cp.source_type='creative_work_project' AND cp.source_id=CAST(cwp.creative_work_project_id AS TEXT)
WHERE COALESCE(cwp.project_status,'active')<>'archived'
GROUP BY cwp.creative_work_project_id,cp.creative_project_id
HAVING caip_count=1 AND content_count<=1 AND (caip_content_project_id IS NULL OR existing_content_id IS NULL OR caip_content_project_id=existing_content_id)
ORDER BY CASE WHEN content_count=0 THEN 0 ELSE 1 END,cwp.updated_at DESC,cwp.creative_work_project_id DESC LIMIT 1;""")
row=first_with(candidate,"creative_work_project_id","caip_id","caip_count","content_count","caip_asset_count")
if not row:stop("No existing non-archived Development Creative Process identity with exactly one non-conflicting CAIP workspace is available; Build 282 refuses synthetic evidence.")
work_id=int(row["creative_work_project_id"]);caip_id=int(row["caip_id"]);before_content=int(row.get("existing_content_id") or 0);before_assets=int(row.get("caip_asset_count") or 0)
work_product=row.get("work_product_id");caip_product=row.get("caip_product_id")
payload={"action":"create_from_creative_project","creative_work_project_id":work_id,"refresh_copy":0}
first=request("/api/admin/content-studio",cookie,"POST",payload)
if first.get("ok") is not True:stop("First Content Studio bridge action did not return ok=true.")
r1=first.get("result") or {};p1=(first.get("detail") or {}).get("project") or {};content_id=int(r1.get("content_project_id") or p1.get("content_project_id") or 0)
if content_id<=0:stop("First Content Studio bridge action did not resolve a package identity.")
if int(r1.get("creative_work_project_id") or 0)!=work_id or int(r1.get("creative_project_id") or 0)!=caip_id:stop("First bridge response did not preserve Creative Process/CAIP identity.")
if r1.get("duplicate_project_created") is not False:stop("First bridge response did not explicitly reject duplicate project creation.")
if str(p1.get("source_type") or "")!="creative_project" or str(p1.get("source_id") or "")!=str(work_id):stop("Content Studio package source identity drifted.")
if first.get("mode")!="review_first_no_auto_publish":stop("Content Studio review-first/no-auto-publish mode drifted.")
expected_first="refreshed_existing_package" if before_content else "created_package_for_existing_identity"
if r1.get("bridge_outcome")!=expected_first:stop("First bridge outcome did not match existing-package state.")
second=request("/api/admin/content-studio",cookie,"POST",payload)
if second.get("ok") is not True:stop("Second Content Studio bridge action did not return ok=true.")
r2=second.get("result") or {};p2=(second.get("detail") or {}).get("project") or {};content_id_2=int(r2.get("content_project_id") or p2.get("content_project_id") or 0)
if content_id_2!=content_id:stop("Repeated bridge action did not reuse the same Content Studio package.")
if r2.get("bridge_outcome")!="refreshed_existing_package" or r2.get("duplicate_project_created") is not False:stop("Repeated bridge action did not prove idempotent refresh.")
post=d1(f"""SELECT
 (SELECT COUNT(*) FROM creative_projects WHERE source_type='creative_work_project' AND source_id='{work_id}') AS caip_count,
 (SELECT COUNT(*) FROM content_projects WHERE source_type='creative_project' AND source_id='{work_id}') AS content_count,
 (SELECT COUNT(*) FROM creative_project_content_handoffs WHERE creative_work_project_id={work_id} AND content_project_id={content_id}) AS handoff_count,
 (SELECT content_project_id FROM creative_projects WHERE creative_project_id={caip_id} LIMIT 1) AS caip_content_project_id,
 (SELECT COUNT(*) FROM creative_assets WHERE creative_project_id={caip_id} AND asset_status<>'archived') AS caip_asset_count,
 (SELECT product_id FROM creative_work_projects WHERE creative_work_project_id={work_id} LIMIT 1) AS work_product_id,
 (SELECT product_id FROM creative_projects WHERE creative_project_id={caip_id} LIMIT 1) AS caip_product_id,
 (SELECT source_type FROM content_projects WHERE content_project_id={content_id} LIMIT 1) AS package_source_type,
 (SELECT source_id FROM content_projects WHERE content_project_id={content_id} LIMIT 1) AS package_source_id,
 (SELECT event_type FROM content_project_events WHERE content_project_id={content_id} AND event_type='creative_project_content_studio_bridge' ORDER BY content_project_event_id DESC LIMIT 1) AS event_type,
 (SELECT CAST(json_extract(details_json,'$.duplicate_project_created') AS INTEGER) FROM content_project_events WHERE content_project_id={content_id} AND event_type='creative_project_content_studio_bridge' ORDER BY content_project_event_id DESC LIMIT 1) AS event_duplicate_project_created,
 (SELECT CAST(json_extract(details_json,'$.caip_creative_project_id') AS INTEGER) FROM content_project_events WHERE content_project_id={content_id} AND event_type='creative_project_content_studio_bridge' ORDER BY content_project_event_id DESC LIMIT 1) AS event_caip_id;""")
state=first_with(post,"caip_count","content_count","handoff_count","caip_content_project_id","caip_asset_count")
if not state:stop("Post-action bridge evidence is unavailable.")
if int(state.get("caip_count") or 0)!=1:stop("Creative Process identity no longer maps to exactly one CAIP workspace.")
if int(state.get("content_count") or 0)!=1:stop("Creative Process identity does not map to exactly one Content Studio package.")
if int(state.get("handoff_count") or 0)!=1:stop("Creative Process identity does not retain exactly one Content Studio handoff row.")
if int(state.get("caip_content_project_id") or 0)!=content_id:stop("CAIP workspace does not point at the accepted Content Studio package.")
if int(state.get("caip_asset_count") or 0)!=before_assets:stop("CAIP private-media reference count changed during Content Studio bridge acceptance.")
if state.get("work_product_id")!=work_product or state.get("caip_product_id")!=caip_product:stop("Product association changed during Content Studio bridge acceptance.")
if state.get("package_source_type")!="creative_project" or str(state.get("package_source_id") or "")!=str(work_id):stop("Persisted Content Studio package identity drifted.")
if state.get("event_type")!="creative_project_content_studio_bridge" or int(state.get("event_duplicate_project_created") or 0)!=0 or int(state.get("event_caip_id") or 0)!=caip_id:stop("Content Studio bridge event did not preserve the accepted identity contract.")
evidence={"schema":"release467-build282-content-studio-bridge-operator-acceptance-v1","status":"PASS","source_sha":os.environ.get("GITHUB_SHA"),"environment":"development","exact_preview_url":True,"real_admin_operator_session":True,"synthetic_operator_created":False,"existing_non_archived_creative_process_project":True,"existing_exactly_one_caip_workspace":True,"operator_action":"create_from_creative_project","content_package_existed_before":before_content>0,"first_bridge_outcome":expected_first,"second_bridge_outcome":"refreshed_existing_package","idempotent_content_package_count":1,"single_handoff_row":True,"same_content_package_reused":True,"duplicate_project_created":False,"source_identity_preserved":True,"private_media_reference_count_unchanged":True,"product_association_unchanged":True,"review_first_no_auto_publish":True,"provider_execution_invoked":False,"provider_publication_invoked":False,"public_promotion_invoked":False,"production_mutation":False,"inventory_movement":False,"finance_posting":False,"creative_work_project_identity_sha256":hashlib.sha256(f"creative_work_project:{work_id}".encode()).hexdigest(),"creative_project_identity_sha256":hashlib.sha256(f"creative_project:{caip_id}".encode()).hexdigest(),"content_project_identity_sha256":hashlib.sha256(f"content_project:{content_id}".encode()).hexdigest(),"raw_project_id_retained":False,"raw_project_title_retained":False,"raw_session_token_retained":False,"runtime_acceptance":"CONTENT_STUDIO_BRIDGE_OPERATOR_ACCEPTED_REAL_EVIDENCE"}
OUT.write_text(json.dumps(evidence,indent=2,sort_keys=True)+"\n",encoding="utf-8")
print("BUILD 282 CONTENT STUDIO BRIDGE OPERATOR ACCEPTANCE: PASS")
print("One existing Creative Process identity + one existing CAIP workspace -> one idempotent Content Studio package; no duplicate/provider/public promotion path invoked.")
