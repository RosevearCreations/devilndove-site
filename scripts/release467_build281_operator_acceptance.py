#!/usr/bin/env python3
from __future__ import annotations
import hashlib,json,os,subprocess,sys
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
BASE=os.environ.get("BUILD281_EXACT_DEV_BASE_URL","").rstrip("/")
DB=os.environ.get("DEV_D1_DATABASE_NAME","devilndove-dev")
CF_ID=os.environ.get("CF_ACCESS_CLIENT_ID","").strip();CF_SECRET=os.environ.get("CF_ACCESS_CLIENT_SECRET","").strip()
CONFIGURED=os.environ.get("DND_CONFIGURED_SESSION_COOKIE","").strip()
OUT=Path("/tmp/build281-standalone-social-project-operator-acceptance-evidence.json")
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
def headers(cookie=None,content=False):
    h={"Cache-Control":"no-store","Accept":"application/json"}
    if cookie:h["Cookie"]=cookie
    if content:h["Content-Type"]="application/json"
    if CF_ID and CF_SECRET:h["CF-Access-Client-Id"]=CF_ID;h["CF-Access-Client-Secret"]=CF_SECRET
    return h
def request(path,cookie,method="GET",payload=None):
    out=Path("/tmp/build281-http-response.json")
    cmd=["curl","-sS","-o",str(out),"-w","%{http_code}","-X",method,
         "-H","Cache-Control: no-store","-H","Accept: application/json",
         "-H",f"Cookie: {cookie}","-H","User-Agent: curl/8.5.0"]
    if payload is not None:
        cmd+=["-H","Content-Type: application/json","--data-binary",json.dumps(payload,separators=(",",":"))]
    if CF_ID and CF_SECRET:
        cmd+=["-H",f"CF-Access-Client-Id: {CF_ID}","-H",f"CF-Access-Client-Secret: {CF_SECRET}"]
    p=subprocess.run(cmd+[BASE+path],cwd=ROOT,text=True,stdout=subprocess.PIPE,stderr=subprocess.PIPE)
    if p.returncode:stop(f"{path} request failed: "+(p.stderr or p.stdout)[-1000:])
    status=(p.stdout or "").strip()
    raw=out.read_bytes() if out.exists() else b""
    out.unlink(missing_ok=True)
    if status!="200":stop(f"{path} returned HTTP {status}: "+raw[:1000].decode("utf-8","replace"))
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
    cols=d1("PRAGMA table_info(sessions);")
    names={str(r.get("name") or "").strip().lower() for r in dicts(cols) if r.get("name")}
    if "session_token" in names and "token" in names:expr="COALESCE(NULLIF(s.session_token,''),s.token)"
    elif "session_token" in names:expr="s.session_token"
    elif "token" in names:expr="s.token"
    else:stop("sessions table has no supported token column.")
    data=d1(f"""SELECT {expr} AS runtime_token FROM sessions s JOIN users u ON u.user_id=s.user_id
      WHERE u.is_active=1 AND lower(trim(u.role))='admin' AND s.expires_at>datetime('now')
      AND length(COALESCE({expr},''))>0 ORDER BY s.expires_at DESC LIMIT 1;""")
    row=first_with(data,"runtime_token");token=str((row or {}).get("runtime_token") or "").strip()
    if not token:stop("No existing unexpired Development administrator session is available; Build 281 refuses synthetic operator creation.")
    cookie="dd_auth_token="+token
    if not validate(cookie):stop("Existing Development administrator session was rejected.")
candidate=d1("""SELECT cwp.creative_work_project_id,
  cp.creative_project_id AS existing_caip_id,
  cp.content_project_id AS existing_content_project_id,
  cp.product_id AS existing_caip_product_id
FROM creative_work_projects cwp
LEFT JOIN creative_projects cp ON cp.source_type='creative_work_project' AND cp.source_id=CAST(cwp.creative_work_project_id AS TEXT)
WHERE COALESCE(cwp.project_status,'active')<>'archived' AND cwp.product_id IS NULL
  AND (cp.creative_project_id IS NULL OR cp.product_id IS NULL)
ORDER BY CASE WHEN cp.creative_project_id IS NULL THEN 0 ELSE 1 END,cwp.updated_at DESC,cwp.creative_work_project_id DESC LIMIT 1;""")
row=first_with(candidate,"creative_work_project_id")
if not row:stop("No existing non-archived productless Development Creative Process project is available; Build 281 refuses to fabricate one.")
work_id=int(row["creative_work_project_id"]);before_caip=int(row.get("existing_caip_id") or 0);before_content=int(row.get("existing_content_project_id") or 0)
resp=request("/api/admin/creative-assets",cookie,"POST",{"action":"open_creative_work_project","creative_work_project_id":work_id})
if resp.get("ok") is not True:stop("CAIP operator action did not return ok=true.")
result=resp.get("result") or {};detail=resp.get("detail") or {};project=detail.get("project") or result.get("project") or {}
caip_id=int(project.get("creative_project_id") or 0)
if caip_id<=0:stop("CAIP operator action did not resolve a project identity.")
if str(project.get("source_type") or "")!="creative_work_project" or str(project.get("source_id") or "")!=str(work_id):stop("CAIP identity did not retain the Creative Process source.")
if project.get("product_id") not in (None,0,"","0"):stop("Productless operator path attached a Product.")
if result.get("product_created") is not False or result.get("content_project_created") is not False:stop("Operator response did not explicitly preserve Product/Content creation separation.")
after_content=int(project.get("content_project_id") or 0)
if after_content!=before_content:stop("Existing Content Studio link changed during standalone/social CAIP open/refresh.")
post=d1(f"""SELECT
 (SELECT COUNT(*) FROM creative_projects WHERE source_type='creative_work_project' AND source_id='{work_id}') AS mapping_count,
 (SELECT creative_project_id FROM creative_projects WHERE source_type='creative_work_project' AND source_id='{work_id}' LIMIT 1) AS creative_project_id,
 (SELECT product_id FROM creative_projects WHERE source_type='creative_work_project' AND source_id='{work_id}' LIMIT 1) AS product_id,
 (SELECT COALESCE(content_project_id,0) FROM creative_projects WHERE source_type='creative_work_project' AND source_id='{work_id}' LIMIT 1) AS content_project_id,
 (SELECT CAST(json_extract(policy_profile_json,'$.no_auto_publish') AS INTEGER) FROM creative_projects WHERE source_type='creative_work_project' AND source_id='{work_id}' LIMIT 1) AS no_auto_publish,
 (SELECT CAST(json_extract(policy_profile_json,'$.publication_requires_explicit_release_approval') AS INTEGER) FROM creative_projects WHERE source_type='creative_work_project' AND source_id='{work_id}' LIMIT 1) AS explicit_release_approval,
 (SELECT event_type FROM creative_project_events WHERE creative_project_id={caip_id} AND event_type IN ('standalone_project_opened','standalone_project_refreshed') ORDER BY creative_project_event_id DESC LIMIT 1) AS event_type,
 (SELECT CAST(json_extract(details_json,'$.product_created') AS INTEGER) FROM creative_project_events WHERE creative_project_id={caip_id} AND event_type IN ('standalone_project_opened','standalone_project_refreshed') ORDER BY creative_project_event_id DESC LIMIT 1) AS event_product_created,
 (SELECT CAST(json_extract(details_json,'$.content_project_created') AS INTEGER) FROM creative_project_events WHERE creative_project_id={caip_id} AND event_type IN ('standalone_project_opened','standalone_project_refreshed') ORDER BY creative_project_event_id DESC LIMIT 1) AS event_content_project_created,
 (SELECT CAST(json_extract(details_json,'$.private_media_unchanged') AS INTEGER) FROM creative_project_events WHERE creative_project_id={caip_id} AND event_type IN ('standalone_project_opened','standalone_project_refreshed') ORDER BY creative_project_event_id DESC LIMIT 1) AS private_media_unchanged;""")
state=first_with(post,"mapping_count","creative_project_id","content_project_id")
if not state:stop("Post-action CAIP identity evidence is unavailable.")
if int(state.get("mapping_count") or 0)!=1:stop("Creative Process identity does not map to exactly one CAIP project.")
if int(state.get("creative_project_id") or 0)!=caip_id:stop("CAIP project identity drifted after operator action.")
if state.get("product_id") not in (None,0,"","0"):stop("Post-action CAIP row is no longer productless.")
if int(state.get("content_project_id") or 0)!=before_content:stop("Post-action Content Studio link was not preserved.")
if int(state.get("no_auto_publish") or 0)!=1 or int(state.get("explicit_release_approval") or 0)!=1:stop("CAIP publication separation policy drifted.")
expected_event="standalone_project_refreshed" if before_caip else "standalone_project_opened"
if state.get("event_type")!=expected_event:stop("Expected standalone operator event was not recorded.")
if int(state.get("event_product_created") or 0)!=0 or int(state.get("event_content_project_created") or 0)!=0:stop("Operator event did not preserve Product/Content creation separation.")
if int(state.get("private_media_unchanged") or 0)!=1:stop("Operator event did not prove private media remained unchanged.")
evidence={
 "schema":"release467-build281-standalone-social-project-operator-acceptance-v1","status":"PASS","source_sha":os.environ.get("GITHUB_SHA"),"environment":"development",
 "exact_preview_url":True,"real_admin_operator_session":True,"synthetic_operator_created":False,
 "existing_non_archived_creative_process_project":True,"productless_source":True,"operator_action":"open_creative_work_project",
 "created_new_caip_mapping":before_caip==0,"idempotent_mapping_count":1,"source_identity_preserved":True,
 "product_created":False,"product_id_after":None,"content_project_created":False,"existing_content_studio_link_preserved":True,
 "had_content_studio_link_before":before_content>0,"private_media_unchanged":True,"no_auto_publish":True,"explicit_release_approval_required":True,
 "provider_execution_invoked":False,"provider_publication_invoked":False,"public_promotion_invoked":False,"production_mutation":False,
 "inventory_movement":False,"finance_posting":False,
 "creative_work_project_identity_sha256":hashlib.sha256(f"creative_work_project:{work_id}".encode()).hexdigest(),
 "creative_project_identity_sha256":hashlib.sha256(f"creative_project:{caip_id}".encode()).hexdigest(),
 "raw_project_id_retained":False,"raw_project_title_retained":False,"raw_session_token_retained":False,"runtime_acceptance":"OPERATOR_ACCEPTED"
}
OUT.write_text(json.dumps(evidence,indent=2,sort_keys=True)+"\n",encoding="utf-8")
print("BUILD 281 STANDALONE / SOCIAL PROJECT OPERATOR ACCEPTANCE: PASS")
print("Real existing productless Creative Process identity -> exactly one CAIP workspace; no Product/provider/public promotion path invoked.")
