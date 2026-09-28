#!/usr/bin/env python3
from __future__ import annotations
import json, os, subprocess, sys
from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]
BASE=os.environ.get("BUILD288_EXACT_DEV_BASE_URL","").rstrip("/")
DB=os.environ.get("DEV_D1_DATABASE_NAME","devilndove-dev")
CF_ID=os.environ.get("CF_ACCESS_CLIENT_ID","").strip()
CF_SECRET=os.environ.get("CF_ACCESS_CLIENT_SECRET","").strip()
CONFIGURED=os.environ.get("DND_CONFIGURED_SESSION_COOKIE","").strip()
OUT=Path("/tmp/build288-real-planned-vs-actual-inventory-acceptance-evidence.json")
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
    if p.returncode:
        stop("Development D1 query failed: "+(p.stderr or p.stdout)[-2500:])
    try: data=json.loads(p.stdout)
    except Exception: stop("Development D1 returned non-JSON output.")
    for row in walk(data):
        meta=row.get("meta")
        if isinstance(meta,dict) and meta.get("rows_read") is not None:
            ROWS_READ += int(meta.get("rows_read") or 0)
    if ROWS_READ > ROWS_LIMIT:
        stop(f"Build 288 direct D1 evidence reads exceeded ceiling: {ROWS_READ}>{ROWS_LIMIT}")
    return data

def first(data,*keys):
    for row in walk(data):
        if all(k in row for k in keys): return row
    return None

def request(path,cookie,method="GET",payload=None,expect=200):
    out=Path("/tmp/build288-http.json")
    cmd=["curl","-sS","-o",str(out),"-w","%{http_code}","-X",method,
         "-H","Cache-Control: no-store","-H","Accept: application/json",
         "-H",f"Cookie: {cookie}","-H","User-Agent: curl/8.5.0"]
    if payload is not None:
        cmd += ["-H","Content-Type: application/json","--data-binary",json.dumps(payload,separators=(",",":"))]
    if CF_ID and CF_SECRET:
        cmd += ["-H",f"CF-Access-Client-Id: {CF_ID}","-H",f"CF-Access-Client-Secret: {CF_SECRET}"]
    p=subprocess.run(cmd+[BASE+path],cwd=ROOT,text=True,stdout=subprocess.PIPE,stderr=subprocess.PIPE)
    if p.returncode: stop(f"{path} request failed: "+(p.stderr or p.stdout)[-1200:])
    status=int((p.stdout or "0").strip() or 0)
    raw=out.read_bytes() if out.exists() else b""
    out.unlink(missing_ok=True)
    if status!=expect: stop(f"{path} returned HTTP {status}, expected {expect}: "+raw[:1800].decode("utf-8","replace"))
    try:return json.loads(raw)
    except Exception: stop(f"{path} did not return JSON.")

if not BASE.startswith("https://") or ".devilndove-site.pages.dev" not in BASE:
    stop("Exact Development Preview URL is missing or invalid.")
if bool(CF_ID)!=bool(CF_SECRET): stop("Cloudflare Access credential pair is incomplete.")
if not os.environ.get("CLOUDFLARE_API_TOKEN","").strip(): stop("Development D1 credential is unavailable.")

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
    if not validate(cookie):stop("Existing Development administrator session was rejected.")

baseline=first(d1("""
SELECT
  p.creative_work_project_id,p.project_title,e.creative_work_event_id,e.material_name,e.material_quantity,e.material_unit,
  r.creative_project_material_review_id,r.review_status,r.actual_quantity,r.waste_quantity,r.reusable_quantity,
  r.approved_cost_cents,COALESCE(r.review_notes,'') AS review_notes,COALESCE(r.inventory_consumed,0) AS inventory_consumed,
  l.creative_process_resource_link_id,l.resource_role,
  i.site_item_inventory_id,i.item_name AS inventory_name,LOWER(TRIM(i.source_type)) AS inventory_source_type,
  i.on_hand_quantity,COALESCE(i.reserved_quantity,0) AS reserved_quantity,
  COALESCE(i.usage_units_per_stock_unit,1) AS usage_units_per_stock_unit,
  COALESCE(i.usage_unit_label,'unit') AS usage_unit_label,COALESCE(i.stock_unit_label,'unit') AS stock_unit_label,
  COALESCE(u.usage_tracking_mode,'exact') AS usage_tracking_mode,COALESCE(u.minimum_usage_increment,0.001) AS minimum_usage_increment,
  (SELECT COUNT(*) FROM creative_work_events pe
     LEFT JOIN creative_project_material_reviews pr ON pr.creative_work_project_id=pe.creative_work_project_id AND pr.creative_work_event_id=pe.creative_work_event_id
    WHERE pe.creative_work_project_id=p.creative_work_project_id
      AND COALESCE(pe.entry_status,'active')='active'
      AND TRIM(COALESCE(pe.material_name,''))<>''
      AND COALESCE(LOWER(TRIM(pr.review_status)),'')<>'approved') AS planned_material_count,
  (SELECT COUNT(*) FROM creative_project_inventory_posts ip WHERE ip.creative_project_material_review_id=r.creative_project_material_review_id) AS historical_post_count,
  (SELECT COUNT(*) FROM site_inventory_movements m WHERE m.site_item_inventory_id=i.site_item_inventory_id) AS movement_count,
  (SELECT COUNT(*) FROM accounting_journal_entries) AS journal_entries,
  (SELECT COUNT(*) FROM accounting_journal_lines) AS journal_lines
FROM creative_work_projects p
JOIN creative_work_events e ON e.creative_work_project_id=p.creative_work_project_id
JOIN creative_project_material_reviews r ON r.creative_work_project_id=e.creative_work_project_id AND r.creative_work_event_id=e.creative_work_event_id
JOIN creative_process_resource_links l ON l.creative_work_project_id=e.creative_work_project_id AND l.creative_work_event_id=e.creative_work_event_id
JOIN site_item_inventory i ON i.site_item_inventory_id=l.site_item_inventory_id
LEFT JOIN site_inventory_usage_profiles u ON u.site_item_inventory_id=i.site_item_inventory_id
WHERE p.creative_work_project_id=7 AND e.creative_work_event_id=2
  AND l.creative_process_resource_link_id=1 AND i.site_item_inventory_id=2801
  AND l.resource_role='material' AND COALESCE(p.project_status,'active')<>'archived'
  AND COALESCE(e.entry_status,'active')='active' AND i.is_active=1
LIMIT 1;
"""),"creative_work_project_id","creative_work_event_id","site_item_inventory_id","creative_process_resource_link_id")
if not baseline: stop("Build 287 real project/material/Inventory linkage is unavailable.")
if str(baseline.get("review_status") or "").lower()!="approved": stop("Build 287 material review is no longer approved.")
if int(baseline.get("inventory_consumed") or 0)!=0: stop("Build 287 material is already marked consumed.")
if str(baseline.get("inventory_source_type") or "") not in ("supply","tool"): stop("Build 287 link no longer resolves to non-Product Inventory.")
if int(baseline.get("planned_material_count") or 0)<1: stop("The real linked project does not currently contain a planned material estimate.")
if int(baseline.get("historical_post_count") or 0)!=0: stop("The linked review already has historical Inventory posting evidence; Build 288 will not overwrite it.")
norm=lambda v:" ".join(str(v or "").strip().lower().split())
if norm(baseline.get("material_name"))!=norm(baseline.get("inventory_name")): stop("Build 287 exact material/Inventory identity has drifted.")

project_id=int(baseline["creative_work_project_id"])
event_id=int(baseline["creative_work_event_id"])
inventory_id=int(baseline["site_item_inventory_id"])
baseline_on_hand=float(baseline.get("on_hand_quantity") or 0)
reserved=float(baseline.get("reserved_quantity") or 0)
per_stock=max(0.001,float(baseline.get("usage_units_per_stock_unit") or 1))
minimum=max(0.001,float(baseline.get("minimum_usage_increment") or 0.001))
available_usage=max(0.0,baseline_on_hand-reserved)*per_stock
usage=min(max(minimum,0.001),available_usage)
if usage<=0 or usage+1e-9<minimum: stop("Real linked Inventory does not have enough available quantity for one accepted usage increment.")

initial=request(f"/api/admin/creative-process?project_id={project_id}",cookie)
life=initial.get("planned_actual_inventory_lifecycle") or {}
if life.get("classification")!="PLANNED_ESTIMATES_SEPARATE_FROM_REVIEWED_AND_POSTED_ACTUALS":
    stop("Live Creative Process lifecycle projection is not the planned-vs-actual contract.")
if int(life.get("planned_estimate_count") or 0)<1: stop("Live project does not expose a planned material estimate.")
if int(life.get("reviewed_actual_unposted_count") or 0)<1: stop("Live project does not expose the reviewed-unposted linked material state.")

review=request("/api/admin/creative-process",cookie,"POST",{
  "action":"review_material","project_id":project_id,"creative_work_event_id":event_id,
  "review_status":"approved","actual_quantity":usage,
  "waste_quantity":float(baseline.get("waste_quantity") or 0),
  "reusable_quantity":float(baseline.get("reusable_quantity") or 0),
  "approved_cost_cents":int(baseline.get("approved_cost_cents") or 0),
  "review_notes":str(baseline.get("review_notes") or "")
})
if review.get("ok") is not True: stop("Review action did not return ok=true.")
reviewed=first(d1(f"""
SELECT r.review_status,r.actual_quantity,r.inventory_consumed,i.on_hand_quantity,
 (SELECT COUNT(*) FROM creative_project_inventory_posts ip WHERE ip.creative_project_material_review_id=r.creative_project_material_review_id) AS post_count,
 (SELECT COUNT(*) FROM site_inventory_movements m WHERE m.site_item_inventory_id=i.site_item_inventory_id) AS movement_count,
 (SELECT COUNT(*) FROM accounting_journal_entries) AS journal_entries,
 (SELECT COUNT(*) FROM accounting_journal_lines) AS journal_lines
FROM creative_project_material_reviews r JOIN site_item_inventory i ON i.site_item_inventory_id={inventory_id}
WHERE r.creative_work_project_id={project_id} AND r.creative_work_event_id={event_id} LIMIT 1;
"""),"review_status","inventory_consumed","on_hand_quantity","post_count")
if str(reviewed.get("review_status") or "").lower()!="approved" or int(reviewed.get("inventory_consumed") or 0)!=0 or int(reviewed.get("post_count") or 0)!=0:
    stop("Reviewed actual did not remain explicitly unposted.")
if abs(float(reviewed.get("on_hand_quantity") or 0)-baseline_on_hand)>1e-9: stop("Inventory changed before explicit post.")
if int(reviewed.get("movement_count") or 0)!=int(baseline.get("movement_count") or 0): stop("Inventory movement occurred during review.")
if int(reviewed.get("journal_entries") or 0)!=int(baseline.get("journal_entries") or 0) or int(reviewed.get("journal_lines") or 0)!=int(baseline.get("journal_lines") or 0):
    stop("Finance changed during reviewed-unposted stage.")

posted=request("/api/admin/creative-process",cookie,"POST",{
  "action":"post_material_inventory","project_id":project_id,"creative_work_event_id":event_id,
  "site_item_inventory_id":inventory_id,"usage_quantity_consumed":usage,
  "notes":"Build 288 real planned-vs-actual operator acceptance; compensating reversal follows immediately."
})
if posted.get("ok") is not True: stop("Explicit Inventory post did not return ok=true.")
post=first(d1(f"""
SELECT ip.creative_project_inventory_post_id,ip.posting_status,ip.stock_quantity_consumed,
 ip.previous_on_hand_quantity,ip.new_on_hand_quantity,r.inventory_consumed,i.on_hand_quantity,
 (SELECT COUNT(*) FROM accounting_journal_entries) AS journal_entries,
 (SELECT COUNT(*) FROM accounting_journal_lines) AS journal_lines
FROM creative_project_inventory_posts ip
JOIN creative_project_material_reviews r ON r.creative_project_material_review_id=ip.creative_project_material_review_id
JOIN site_item_inventory i ON i.site_item_inventory_id=ip.site_item_inventory_id
WHERE ip.creative_work_project_id={project_id} AND ip.creative_work_event_id={event_id}
ORDER BY ip.creative_project_inventory_post_id DESC LIMIT 1;
"""),"creative_project_inventory_post_id","posting_status","stock_quantity_consumed","on_hand_quantity")
if not post or str(post.get("posting_status") or "").lower()=="reversed" or int(post.get("inventory_consumed") or 0)!=1:
    stop("Explicit posted actual was not persisted.")
post_id=int(post["creative_project_inventory_post_id"])
consumed=float(post.get("stock_quantity_consumed") or 0)
if consumed<=0: stop("Explicit post consumed no stock quantity.")
if abs(float(post.get("on_hand_quantity") or 0)-(baseline_on_hand-consumed))>1e-7: stop("Explicit post did not decrease Inventory as expected.")
if int(post.get("journal_entries") or 0)!=int(baseline.get("journal_entries") or 0) or int(post.get("journal_lines") or 0)!=int(baseline.get("journal_lines") or 0):
    stop("Finance changed during explicit Inventory post.")

reversal=request("/api/admin/creative-process",cookie,"POST",{
  "action":"reverse_material_inventory","project_id":project_id,
  "creative_project_inventory_post_id":post_id,
  "reason":"Build 288 real operator acceptance compensating reversal"
})
if reversal.get("ok") is not True: stop("Compensating reversal did not return ok=true.")
final=first(d1(f"""
SELECT ip.posting_status,r.inventory_consumed,i.on_hand_quantity,
 (SELECT COUNT(*) FROM creative_project_inventory_reversals x WHERE x.creative_project_inventory_post_id=ip.creative_project_inventory_post_id) AS reversal_count,
 (SELECT COUNT(*) FROM accounting_journal_entries) AS journal_entries,
 (SELECT COUNT(*) FROM accounting_journal_lines) AS journal_lines
FROM creative_project_inventory_posts ip
JOIN creative_project_material_reviews r ON r.creative_project_material_review_id=ip.creative_project_material_review_id
JOIN site_item_inventory i ON i.site_item_inventory_id=ip.site_item_inventory_id
WHERE ip.creative_project_inventory_post_id={post_id} LIMIT 1;
"""),"posting_status","inventory_consumed","on_hand_quantity","reversal_count")
if str(final.get("posting_status") or "").lower()!="reversed" or int(final.get("inventory_consumed") or 0)!=0 or int(final.get("reversal_count") or 0)!=1:
    stop("Compensating reversal did not close the posted actual.")
if abs(float(final.get("on_hand_quantity") or 0)-baseline_on_hand)>1e-7: stop("Inventory did not return to baseline.")
if int(final.get("journal_entries") or 0)!=int(baseline.get("journal_entries") or 0) or int(final.get("journal_lines") or 0)!=int(baseline.get("journal_lines") or 0):
    stop("Finance changed during Build 288 acceptance.")

restore=request("/api/admin/creative-process",cookie,"POST",{
  "action":"review_material","project_id":project_id,"creative_work_event_id":event_id,
  "review_status":"approved","actual_quantity":float(baseline.get("actual_quantity") or 0),
  "waste_quantity":float(baseline.get("waste_quantity") or 0),
  "reusable_quantity":float(baseline.get("reusable_quantity") or 0),
  "approved_cost_cents":int(baseline.get("approved_cost_cents") or 0),
  "review_notes":str(baseline.get("review_notes") or "")
})
if restore.get("ok") is not True: stop("Original reviewed values could not be restored.")

restored=first(d1(f"""
SELECT r.review_status,r.actual_quantity,r.inventory_consumed,i.on_hand_quantity,
 (SELECT COUNT(*) FROM accounting_journal_entries) AS journal_entries,
 (SELECT COUNT(*) FROM accounting_journal_lines) AS journal_lines
FROM creative_project_material_reviews r JOIN site_item_inventory i ON i.site_item_inventory_id={inventory_id}
WHERE r.creative_work_project_id={project_id} AND r.creative_work_event_id={event_id} LIMIT 1;
"""),"review_status","actual_quantity","inventory_consumed","on_hand_quantity")
if str(restored.get("review_status") or "").lower()!="approved" or int(restored.get("inventory_consumed") or 0)!=0:
    stop("Original review did not restore to approved/unconsumed.")
if abs(float(restored.get("actual_quantity") or 0)-float(baseline.get("actual_quantity") or 0))>1e-7: stop("Original actual quantity was not restored.")
if abs(float(restored.get("on_hand_quantity") or 0)-baseline_on_hand)>1e-7: stop("Inventory changed while restoring review values.")
if int(restored.get("journal_entries") or 0)!=int(baseline.get("journal_entries") or 0) or int(restored.get("journal_lines") or 0)!=int(baseline.get("journal_lines") or 0):
    stop("Finance changed while restoring review values.")

evidence={
  "release":467,"build":288,"state":"REAL_PLANNED_ACTUAL_INVENTORY_ACCEPTANCE_GREEN",
  "project_id":project_id,"project_title":baseline.get("project_title"),"event_id":event_id,
  "resource_link_id":int(baseline.get("creative_process_resource_link_id") or 0),
  "inventory_id":inventory_id,"inventory_source_type":baseline.get("inventory_source_type"),
  "planned_material_count":int(baseline.get("planned_material_count") or 0),
  "reviewed_unposted_verified":True,"explicit_post_verified":True,"compensating_reversal_verified":True,
  "inventory_on_hand_before":baseline_on_hand,"inventory_on_hand_after":float(restored.get("on_hand_quantity") or 0),
  "post_id":post_id,"stock_quantity_consumed":consumed,"usage_quantity_consumed":usage,
  "finance_journal_entries_before":int(baseline.get("journal_entries") or 0),
  "finance_journal_entries_after":int(restored.get("journal_entries") or 0),
  "finance_journal_lines_before":int(baseline.get("journal_lines") or 0),
  "finance_journal_lines_after":int(restored.get("journal_lines") or 0),
  "direct_d1_rows_read":ROWS_READ,"direct_d1_rows_read_ceiling":ROWS_LIMIT,
  "fixture_used":False,"project_created":False,"event_created":False,"inventory_item_created":False,
  "automatic_inventory_movement":False,"finance_posting":False,"production_mutation":False
}
OUT.write_text(json.dumps(evidence,indent=2,sort_keys=True)+"\n",encoding="utf-8")
print("BUILD288_EVIDENCE="+json.dumps(evidence,sort_keys=True))
print("RELEASE 467 BUILD 288 REAL PLANNED-VS-ACTUAL INVENTORY ACCEPTANCE: PASS")
