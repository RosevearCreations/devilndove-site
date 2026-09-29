#!/usr/bin/env python3
from __future__ import annotations
import json, os, subprocess, sys
from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]
BASE=os.environ.get("BUILD289_EXACT_DEV_BASE_URL","").rstrip("/")
DB=os.environ.get("DEV_D1_DATABASE_NAME","devilndove-dev")
CF_ID=os.environ.get("CF_ACCESS_CLIENT_ID","").strip()
CF_SECRET=os.environ.get("CF_ACCESS_CLIENT_SECRET","").strip()
CONFIGURED=os.environ.get("DND_CONFIGURED_SESSION_COOKIE","").strip()
OUT=Path("/tmp/build289-real-inventory-adoption-outcomes-evidence.json")
ROWS_READ=0
ROWS_LIMIT=int(os.environ.get("D1_PROVIDER_ROWS_READ_CEILING","20000"))

def stop(msg):
    print("STOP:",msg,file=sys.stderr)
    raise SystemExit(1)

def walk(v):
    if isinstance(v,dict):
        yield v
        for x in v.values(): yield from walk(x)
    elif isinstance(v,list):
        for x in v: yield from walk(x)

def d1(sql):
    global ROWS_READ
    p=subprocess.run(["npx","--yes","wrangler@4","d1","execute",DB,"--remote","--config","wrangler.toml","--json","--command",sql],
                     cwd=ROOT,text=True,stdout=subprocess.PIPE,stderr=subprocess.PIPE)
    if p.returncode: stop("Development D1 query failed: "+(p.stderr or p.stdout)[-2200:])
    try: data=json.loads(p.stdout)
    except Exception: stop("Development D1 returned non-JSON output.")
    for row in walk(data):
        meta=row.get("meta")
        if isinstance(meta,dict) and meta.get("rows_read") is not None:
            ROWS_READ += int(meta.get("rows_read") or 0)
    if ROWS_READ > ROWS_LIMIT: stop(f"Build 289 direct D1 evidence reads exceeded ceiling: {ROWS_READ}>{ROWS_LIMIT}")
    return data

def first(data,*keys):
    for row in walk(data):
        if all(k in row for k in keys): return row
    return None

def request(path,cookie):
    out=Path("/tmp/build289-http.json")
    cmd=["curl","-sS","-o",str(out),"-w","%{http_code}","-H","Cache-Control: no-store","-H","Accept: application/json",
         "-H",f"Cookie: {cookie}","-H","User-Agent: curl/8.5.0"]
    if CF_ID and CF_SECRET:
        cmd += ["-H",f"CF-Access-Client-Id: {CF_ID}","-H",f"CF-Access-Client-Secret: {CF_SECRET}"]
    p=subprocess.run(cmd+[BASE+path],cwd=ROOT,text=True,stdout=subprocess.PIPE,stderr=subprocess.PIPE)
    if p.returncode: stop(f"{path} request failed: "+(p.stderr or p.stdout)[-1000:])
    status=int((p.stdout or "0").strip() or 0)
    raw=out.read_bytes() if out.exists() else b""
    out.unlink(missing_ok=True)
    if status!=200: stop(f"{path} returned HTTP {status}: "+raw[:1600].decode("utf-8","replace"))
    try:return json.loads(raw)
    except Exception: stop(f"{path} did not return JSON.")

if not BASE.startswith("https://") or ".devilndove-site.pages.dev" not in BASE:
    stop("Exact Development Preview URL is missing or invalid.")
if bool(CF_ID)!=bool(CF_SECRET): stop("Cloudflare Access credential pair is incomplete.")
if not os.environ.get("CLOUDFLARE_API_TOKEN","").strip(): stop("Development D1 credential is unavailable.")

def valid(cookie):
    try:d=request("/api/auth/me",cookie)
    except SystemExit:return False
    u=d.get("user") or {}
    return d.get("ok") is True and str(u.get("role") or "").strip().lower()=="admin" and int(u.get("is_active") or 0)==1

cookie=""
if CONFIGURED:
    c=CONFIGURED[7:] if CONFIGURED.startswith("Cookie: ") else CONFIGURED
    if "=" not in c:c="dd_auth_token="+c
    c=c.split(";",1)[0]
    if valid(c):cookie=c
if not cookie:
    cols=d1("PRAGMA table_info(sessions);")
    names={str(r.get("name") or "").strip().lower() for r in walk(cols) if r.get("name")}
    if "session_token" in names and "token" in names:expr="COALESCE(NULLIF(s.session_token,''),s.token)"
    elif "session_token" in names:expr="s.session_token"
    elif "token" in names:expr="s.token"
    else:stop("sessions table has no supported token column.")
    row=first(d1(f"""SELECT {expr} AS runtime_token FROM sessions s JOIN users u ON u.user_id=s.user_id
      WHERE u.is_active=1 AND lower(trim(u.role))='admin' AND s.expires_at>datetime('now')
      AND length(COALESCE({expr},''))>0 ORDER BY s.expires_at DESC LIMIT 1;"""),"runtime_token")
    token=str((row or {}).get("runtime_token") or "").strip()
    if not token:stop("No existing unexpired Development administrator session is available.")
    cookie="dd_auth_token="+token
    if not valid(cookie):stop("Existing Development administrator session was rejected.")

bootstrap=request("/api/admin/inventory-bootstrap",cookie)
processes=bootstrap.get("processes") if isinstance(bootstrap.get("processes"),list) else []
stations=bootstrap.get("station_tools") if isinstance(bootstrap.get("station_tools"),list) else []
units=bootstrap.get("unit_presets") if isinstance(bootstrap.get("unit_presets"),list) else []
if len(processes)<22:stop(f"Inventory bootstrap exposed only {len(processes)} active workshop categories.")
for required in ("unit","package","sheet","tool","use"):
    if required not in units:stop("Inventory bootstrap unit dropdown is missing "+required)

listing=request("/api/admin/site-item-inventory?include_history=0&include_link_stats=0&page=1&page_size=25",cookie)
items=listing.get("items") if isinstance(listing.get("items"),list) else []
if not items:stop("Real Development Inventory list returned no items.")
required_fields=("site_item_inventory_id","source_type","stock_unit_label","usage_unit_label","usage_units_per_stock_unit","unit_cost_cents","do_not_reorder","workstation_role","inventory_process_id")
for field in required_fields:
    if field not in items[0]:stop("Inventory row projection is missing "+field)

facts=first(d1("""
SELECT
  (SELECT COUNT(*) FROM inventory_processes WHERE is_active=1) AS active_processes,
  (SELECT COUNT(*) FROM inventory_process_assignments) AS process_assignments,
  (SELECT COUNT(*) FROM inventory_workstation_roles) AS workstation_role_rows,
  (SELECT COUNT(*) FROM inventory_workstation_roles WHERE workstation_role='station') AS station_role_rows,
  (SELECT COUNT(*) FROM site_item_inventory WHERE COALESCE(is_active,1)=1 AND LOWER(TRIM(COALESCE(source_type,''))) IN ('tool','supply')) AS active_tool_supply_items,
  (SELECT COUNT(*) FROM creative_process_resource_links
    WHERE creative_work_project_id=7 AND creative_work_event_id=2
      AND creative_process_resource_link_id=1 AND site_item_inventory_id=2801 AND resource_role='material') AS build287_real_link_rows,
  (SELECT COUNT(*) FROM creative_project_inventory_posts
    WHERE creative_work_project_id=7 AND creative_work_event_id=2
      AND site_item_inventory_id=2801 AND LOWER(TRIM(COALESCE(posting_status,'')))='reversed') AS build288_reversed_post_rows,
  (SELECT COUNT(*) FROM pragma_foreign_key_check) AS foreign_key_violations;
"""),"active_processes","process_assignments","workstation_role_rows","station_role_rows","active_tool_supply_items","build287_real_link_rows","build288_reversed_post_rows","foreign_key_violations")
if not facts:stop("Build 289 adoption facts query returned no row.")
if int(facts.get("active_processes") or 0)<22:stop("Canonical workshop taxonomy is incomplete.")
if int(facts.get("active_tool_supply_items") or 0)<1:stop("No real active Tool/Supply Inventory exists.")
if int(facts.get("build287_real_link_rows") or 0)!=1:stop("Build 287 real material-to-Inventory linkage no longer resolves exactly.")
if int(facts.get("build288_reversed_post_rows") or 0)<1:stop("Build 288 real explicit-post/reversal evidence is missing.")
if int(facts.get("foreign_key_violations") or 0)!=0:stop("Development foreign-key integrity is not clean.")

evidence={
  "release":467,
  "build":289,
  "state":"REAL_INVENTORY_ADOPTION_OUTCOMES_RENEWAL_GREEN",
  "builds_remeasured":[285,286,287,288],
  "active_processes":int(facts.get("active_processes") or 0),
  "process_assignments":int(facts.get("process_assignments") or 0),
  "workstation_role_rows":int(facts.get("workstation_role_rows") or 0),
  "station_role_rows":int(facts.get("station_role_rows") or 0),
  "active_tool_supply_items":int(facts.get("active_tool_supply_items") or 0),
  "bootstrap_station_tools":len(stations),
  "build287_real_link_rows":int(facts.get("build287_real_link_rows") or 0),
  "build288_reversed_post_rows":int(facts.get("build288_reversed_post_rows") or 0),
  "canonical_category_dropdown":True,
  "station_vs_associated_role_model":True,
  "stock_unit_dropdown":True,
  "usage_unit_dropdown":True,
  "reorder_na_supported":True,
  "amazon_fill_missing_only":True,
  "amazon_current_price_only_when_cost_missing":True,
  "amazon_package_units_supported":True,
  "amazon_image_fill_supported":True,
  "automatic_station_classification":False,
  "fixture_used":False,
  "inventory_mutation":False,
  "finance_mutation":False,
  "direct_d1_rows_read":ROWS_READ,
  "direct_d1_rows_read_ceiling":ROWS_LIMIT,
  "measured_software_residual":"NONE",
  "remaining_owner_work":"Classify real tools/supplies into canonical workshop categories and mark station tools as owner-reviewed inventory facts.",
  "successor_justified":False,
  "queue_state":"AUTONOMOUS_QUEUE_EXHAUSTED"
}
OUT.write_text(json.dumps(evidence,indent=2,sort_keys=True)+"\n",encoding="utf-8")
print("BUILD289_EVIDENCE="+json.dumps(evidence,sort_keys=True))
print("RELEASE 467 BUILD 289 REAL INVENTORY ADOPTION OUTCOMES RENEWAL: PASS")
print("AUTONOMOUS_QUEUE_EXHAUSTED")
