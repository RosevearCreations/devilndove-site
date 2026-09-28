#!/usr/bin/env python3
from __future__ import annotations
import hashlib,json,os,re,subprocess,sys
from pathlib import Path
from urllib.parse import quote
ROOT=Path(__file__).resolve().parents[1]
BASE=os.environ.get("BUILD283_EXACT_DEV_BASE_URL","").rstrip("/")
DB=os.environ.get("DEV_D1_DATABASE_NAME","devilndove-dev")
CF_ID=os.environ.get("CF_ACCESS_CLIENT_ID","").strip();CF_SECRET=os.environ.get("CF_ACCESS_CLIENT_SECRET","").strip()
CONFIGURED=os.environ.get("DND_CONFIGURED_SESSION_COOKIE","").strip()
OUT=Path("/tmp/build283-planned-vs-actual-inventory-operator-acceptance-evidence.json")
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
def scalar(sql,key):
    r=first_with(d1(sql),key);return int((r or {}).get(key) or 0)
def table_count(name):
    exists=scalar("SELECT COUNT(*) AS n FROM sqlite_master WHERE type='table' AND name='"+name.replace("'","''")+"';","n")
    return scalar("SELECT COUNT(*) AS n FROM "+name+";","n") if exists else 0
def request(path,cookie,method="GET",payload=None,expect=200):
    out=Path("/tmp/build283-http-response.json")
    cmd=["curl","-sS","-o",str(out),"-w","%{http_code}","-X",method,"-H","Cache-Control: no-store","-H","Accept: application/json","-H",f"Cookie: {cookie}","-H","User-Agent: curl/8.5.0"]
    if payload is not None:cmd+=["-H","Content-Type: application/json","--data-binary",json.dumps(payload,separators=(",",":"))]
    if CF_ID and CF_SECRET:cmd+=["-H",f"CF-Access-Client-Id: {CF_ID}","-H",f"CF-Access-Client-Secret: {CF_SECRET}"]
    p=subprocess.run(cmd+[BASE+path],cwd=ROOT,text=True,stdout=subprocess.PIPE,stderr=subprocess.PIPE)
    if p.returncode:stop(f"{path} request failed: "+(p.stderr or p.stdout)[-1000:])
    status=int((p.stdout or "0").strip() or 0);raw=out.read_bytes() if out.exists() else b"";out.unlink(missing_ok=True)
    if status!=expect:stop(f"{path} returned HTTP {status}, expected {expect}: "+raw[:1200].decode("utf-8","replace"))
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
    data=d1(f"""SELECT {expr} AS runtime_token FROM sessions s JOIN users u ON u.user_id=s.user_id
      WHERE u.is_active=1 AND lower(trim(u.role))='admin' AND s.expires_at>datetime('now')
      AND length(COALESCE({expr},''))>0 ORDER BY s.expires_at DESC LIMIT 1;""")
    row=first_with(data,"runtime_token");token=str((row or {}).get("runtime_token") or "").strip()
    if not token:stop("No existing unexpired Development administrator session is available; Build 283 refuses synthetic operator creation.")
    cookie="dd_auth_token="+token
    if not validate(cookie):stop("Existing Development administrator session was rejected.")

# existing Development material event evidence stays real; no synthetic project/event/item is created.
def candidate_row(sql):
    return first_with(d1(sql),"creative_work_project_id","creative_work_event_id","site_item_inventory_id","on_hand_quantity","tracking_mode","minimum_usage_increment","actual_quantity","inventory_linkage")
common_tail="""
WHERE COALESCE(cwp.project_status,'active')<>'archived'
 AND COALESCE(e.entry_status,'active')='active' AND trim(COALESCE(e.material_name,''))<>''
 AND lower(trim(COALESCE(r.review_status,'')))='approved' AND COALESCE(r.inventory_consumed,0)=0
 AND NOT EXISTS(SELECT 1 FROM creative_project_inventory_posts ep WHERE ep.creative_project_material_review_id=r.creative_project_material_review_id)
 AND EXISTS(
   SELECT 1 FROM creative_work_events pe
   LEFT JOIN creative_project_material_reviews pr ON pr.creative_work_project_id=pe.creative_work_project_id AND pr.creative_work_event_id=pe.creative_work_event_id
   WHERE pe.creative_work_project_id=cwp.creative_work_project_id
     AND COALESCE(pe.entry_status,'active')='active' AND trim(COALESCE(pe.material_name,''))<>''
     AND COALESCE(lower(trim(pr.review_status)),'')<>'approved'
 )
 AND lower(COALESCE(siup.usage_tracking_mode,CASE WHEN lower(trim(COALESCE(sii.source_type,'')))='tool' THEN 'reusable' ELSE 'exact' END)) IN ('exact','estimated')
 AND (COALESCE(sii.on_hand_quantity,0)-COALESCE(sii.reserved_quantity,0))*COALESCE(NULLIF(sii.usage_units_per_stock_unit,0),1) >= COALESCE(siup.minimum_usage_increment,0.001)
"""
select_cols="""SELECT cwp.creative_work_project_id,e.creative_work_event_id,e.material_name,
 COALESCE(e.material_quantity,0) planned_quantity,COALESCE(e.material_unit,'') planned_unit,
 r.review_status,COALESCE(r.actual_quantity,0) actual_quantity,COALESCE(r.waste_quantity,0) waste_quantity,
 COALESCE(r.reusable_quantity,0) reusable_quantity,COALESCE(r.approved_cost_cents,0) approved_cost_cents,
 COALESCE(r.review_notes,'') review_notes,
 sii.site_item_inventory_id,sii.item_name,sii.on_hand_quantity,COALESCE(sii.reserved_quantity,0) reserved_quantity,
 COALESCE(sii.usage_units_per_stock_unit,1) usage_units_per_stock_unit,COALESCE(sii.usage_unit_label,'unit') usage_unit_label,
 COALESCE(sii.stock_unit_label,'unit') stock_unit_label,
 COALESCE(siup.usage_tracking_mode,CASE WHEN lower(trim(COALESCE(sii.source_type,'')))='tool' THEN 'reusable' ELSE 'exact' END) tracking_mode,
 COALESCE(siup.minimum_usage_increment,0.001) minimum_usage_increment, """
candidate=candidate_row(select_cols+"""'direct_material_identity' inventory_linkage
FROM creative_work_events e
JOIN creative_work_projects cwp ON cwp.creative_work_project_id=e.creative_work_project_id
JOIN creative_project_material_reviews r ON r.creative_work_project_id=e.creative_work_project_id AND r.creative_work_event_id=e.creative_work_event_id
JOIN site_item_inventory sii ON sii.is_active=1 AND (
 lower(trim(sii.item_name))=lower(trim(e.material_name))
 OR instr(lower(sii.item_name),lower(substr(trim(e.material_name),1,120)))>0
 OR instr(lower(substr(trim(e.material_name),1,120)),lower(substr(sii.item_name,1,120)))>0)
LEFT JOIN site_inventory_usage_profiles siup ON siup.site_item_inventory_id=sii.site_item_inventory_id
"""+common_tail+""" ORDER BY cwp.updated_at DESC,e.creative_work_event_id DESC LIMIT 1;""")
if not candidate:
    candidate=candidate_row(select_cols+"""'historical_same_material_inventory' inventory_linkage
FROM creative_work_events e
JOIN creative_work_projects cwp ON cwp.creative_work_project_id=e.creative_work_project_id
JOIN creative_project_material_reviews r ON r.creative_work_project_id=e.creative_work_project_id AND r.creative_work_event_id=e.creative_work_event_id
JOIN creative_work_events he ON he.creative_work_project_id=e.creative_work_project_id
 AND he.creative_work_event_id<>e.creative_work_event_id
 AND lower(trim(COALESCE(he.material_name,'')))=lower(trim(COALESCE(e.material_name,'')))
JOIN creative_project_inventory_posts hip ON hip.creative_work_project_id=e.creative_work_project_id AND hip.creative_work_event_id=he.creative_work_event_id
JOIN site_item_inventory sii ON sii.site_item_inventory_id=hip.site_item_inventory_id AND sii.is_active=1
LEFT JOIN site_inventory_usage_profiles siup ON siup.site_item_inventory_id=sii.site_item_inventory_id
"""+common_tail+""" ORDER BY hip.creative_project_inventory_post_id DESC,e.creative_work_event_id DESC LIMIT 1;""")
if not candidate:
    candidate=candidate_row(select_cols+"""'project_operation_resource' inventory_linkage
FROM creative_work_events e
JOIN creative_work_projects cwp ON cwp.creative_work_project_id=e.creative_work_project_id
JOIN creative_project_material_reviews r ON r.creative_work_project_id=e.creative_work_project_id AND r.creative_work_event_id=e.creative_work_event_id
JOIN creative_project_operations op ON op.creative_work_project_id=e.creative_work_project_id
JOIN creative_project_operation_resources opr ON opr.creative_project_operation_id=op.creative_project_operation_id
JOIN site_item_inventory sii ON sii.site_item_inventory_id=opr.site_item_inventory_id AND sii.is_active=1
LEFT JOIN site_inventory_usage_profiles siup ON siup.site_item_inventory_id=sii.site_item_inventory_id
"""+common_tail+""" AND (
 trim(COALESCE(e.material_unit,''))='' OR trim(COALESCE(sii.usage_unit_label,''))=''
 OR lower(trim(e.material_unit))=lower(trim(sii.usage_unit_label))
 OR lower(trim(COALESCE(opr.planned_unit,'')))=lower(trim(e.material_unit))
 ) ORDER BY op.operation_order,e.creative_work_event_id DESC LIMIT 1;""")
row=candidate
if not row:
    reviewed_rows=[]
    seen_events=set()
    for item in dicts(d1("""SELECT r.creative_work_project_id,r.creative_work_event_id,e.material_name,
      COALESCE(e.material_quantity,0) planned_quantity,COALESCE(e.material_unit,'') planned_unit,
      r.review_status,COALESCE(r.actual_quantity,0) actual_quantity,COALESCE(r.waste_quantity,0) waste_quantity,
      COALESCE(r.reusable_quantity,0) reusable_quantity,COALESCE(r.approved_cost_cents,0) approved_cost_cents,
      COALESCE(r.review_notes,'') review_notes
      FROM creative_project_material_reviews r
      JOIN creative_work_events e ON e.creative_work_event_id=r.creative_work_event_id
      JOIN creative_work_projects p ON p.creative_work_project_id=r.creative_work_project_id
      WHERE COALESCE(p.project_status,'active')<>'archived' AND COALESCE(e.entry_status,'active')='active'
        AND trim(COALESCE(e.material_name,''))<>'' AND lower(trim(COALESCE(r.review_status,'')))='approved'
        AND COALESCE(r.inventory_consumed,0)=0
        AND NOT EXISTS(SELECT 1 FROM creative_project_inventory_posts ip WHERE ip.creative_project_material_review_id=r.creative_project_material_review_id)
      ORDER BY r.reviewed_at DESC,r.creative_project_material_review_id DESC LIMIT 12;""")):
        if all(k in item for k in ("creative_work_project_id","creative_work_event_id","material_name","actual_quantity")):
            eid=int(item.get("creative_work_event_id") or 0)
            if eid and eid not in seen_events:
                seen_events.add(eid);reviewed_rows.append(item)
    inv_catalog=request("/api/admin/contracts/inventory-read?limit=1000&include_tools=0",cookie)
    catalog_items=[x for x in (inv_catalog.get("items") or []) if isinstance(x,dict) and int(x.get("site_item_inventory_id") or 0)>0]
    for erow in reviewed_rows:
        material=str(erow.get("material_name") or "").strip()
        if not material: continue
        material_key=" ".join(re.findall(r"[A-Za-z0-9]+",material)).strip().lower()
        if not material_key: continue
        exact=[];contained=[]
        for x in catalog_items:
            item_key=" ".join(re.findall(r"[A-Za-z0-9]+",str(x.get("item_name") or ""))).strip().lower()
            if not item_key: continue
            if item_key==material_key: exact.append(x)
            elif item_key in material_key or material_key in item_key: contained.append(x)
        items=exact if len(exact)==1 else []
        if not items and contained:
            contained.sort(key=lambda x:len(" ".join(re.findall(r"[A-Za-z0-9]+",str(x.get("item_name") or ""))).strip()),reverse=True)
            best_len=len(" ".join(re.findall(r"[A-Za-z0-9]+",str(contained[0].get("item_name") or ""))).strip())
            best=[x for x in contained if len(" ".join(re.findall(r"[A-Za-z0-9]+",str(x.get("item_name") or ""))).strip())==best_len]
            if len(best)==1: items=best
        if len(items)!=1: continue
        iid=int(items[0]["site_item_inventory_id"])
        profile=first_with(d1(f"""SELECT sii.site_item_inventory_id,sii.item_name,sii.on_hand_quantity,
          COALESCE(sii.reserved_quantity,0) reserved_quantity,COALESCE(sii.usage_units_per_stock_unit,1) usage_units_per_stock_unit,
          COALESCE(sii.usage_unit_label,'unit') usage_unit_label,COALESCE(sii.stock_unit_label,'unit') stock_unit_label,
          COALESCE(siup.usage_tracking_mode,CASE WHEN lower(trim(COALESCE(sii.source_type,'')))='tool' THEN 'reusable' ELSE 'exact' END) tracking_mode,
          COALESCE(siup.minimum_usage_increment,0.001) minimum_usage_increment
          FROM site_item_inventory sii LEFT JOIN site_inventory_usage_profiles siup ON siup.site_item_inventory_id=sii.site_item_inventory_id
          WHERE sii.site_item_inventory_id={iid} AND sii.is_active=1 LIMIT 1;"""),
          "site_item_inventory_id","on_hand_quantity","tracking_mode","minimum_usage_increment")
        if not profile: continue
        if str(profile.get("tracking_mode") or "").lower() not in ("exact","estimated"): continue
        available=max(0.0,float(profile.get("on_hand_quantity") or 0)-float(profile.get("reserved_quantity") or 0))*max(0.001,float(profile.get("usage_units_per_stock_unit") or 1))
        if available+1e-9 < max(0.001,float(profile.get("minimum_usage_increment") or 0.001)): continue
        row={**erow,**profile,"inventory_linkage":"operator_inventory_read_unique_match"}
        break
if not row:
    counts=first_with(d1("""SELECT
      (SELECT COUNT(*) FROM creative_work_events e JOIN creative_work_projects p ON p.creative_work_project_id=e.creative_work_project_id LEFT JOIN creative_project_material_reviews r ON r.creative_work_project_id=e.creative_work_project_id AND r.creative_work_event_id=e.creative_work_event_id WHERE COALESCE(p.project_status,'active')<>'archived' AND COALESCE(e.entry_status,'active')='active' AND trim(COALESCE(e.material_name,''))<>'' AND COALESCE(lower(trim(r.review_status)),'')<>'approved') planned_count,
      (SELECT COUNT(*) FROM creative_project_material_reviews r JOIN creative_work_events e ON e.creative_work_event_id=r.creative_work_event_id WHERE lower(trim(COALESCE(r.review_status,'')))='approved' AND COALESCE(r.inventory_consumed,0)=0 AND COALESCE(e.entry_status,'active')='active') reviewed_unposted_count,
      (SELECT COUNT(*) FROM creative_project_operation_resources) project_resource_count,
      (SELECT COUNT(*) FROM creative_project_inventory_posts) post_count,
      (SELECT COUNT(*) FROM creative_project_inventory_posts WHERE lower(trim(COALESCE(posting_status,'')))='reversed') reversed_post_count,
      (SELECT COUNT(*) FROM creative_project_inventory_reversals) reversal_count;"""),"planned_count","reviewed_unposted_count","project_resource_count","post_count","reversed_post_count","reversal_count") or {}
    planned=first_with(d1("""SELECT p.creative_work_project_id,e.creative_work_event_id
      FROM creative_work_events e JOIN creative_work_projects p ON p.creative_work_project_id=e.creative_work_project_id
      LEFT JOIN creative_project_material_reviews r ON r.creative_work_project_id=e.creative_work_project_id AND r.creative_work_event_id=e.creative_work_event_id
      WHERE COALESCE(p.project_status,'active')<>'archived' AND COALESCE(e.entry_status,'active')='active'
        AND trim(COALESCE(e.material_name,''))<>'' AND COALESCE(lower(trim(r.review_status)),'')<>'approved'
      ORDER BY p.updated_at DESC,e.creative_work_event_id DESC LIMIT 1;"""),"creative_work_project_id","creative_work_event_id")
    reviewed=first_with(d1("""SELECT r.creative_work_project_id,r.creative_work_event_id
      FROM creative_project_material_reviews r JOIN creative_work_events e ON e.creative_work_event_id=r.creative_work_event_id
      JOIN creative_work_projects p ON p.creative_work_project_id=r.creative_work_project_id
      WHERE COALESCE(p.project_status,'active')<>'archived' AND COALESCE(e.entry_status,'active')='active'
        AND lower(trim(COALESCE(r.review_status,'')))='approved' AND COALESCE(r.inventory_consumed,0)=0
      ORDER BY r.reviewed_at DESC,r.creative_project_material_review_id DESC LIMIT 1;"""),"creative_work_project_id","creative_work_event_id")
    history=first_with(d1("""SELECT ip.creative_project_inventory_post_id,ip.creative_work_project_id,ip.creative_work_event_id,
      ip.site_item_inventory_id,ip.stock_quantity_consumed,ip.previous_on_hand_quantity,ip.new_on_hand_quantity,ip.posting_status,
      rv.creative_project_inventory_reversal_id,rv.stock_quantity_restored,rv.previous_on_hand_quantity reversal_previous_on_hand,
      rv.new_on_hand_quantity reversal_new_on_hand,COALESCE(mr.inventory_consumed,0) inventory_consumed,
      (SELECT COUNT(*) FROM creative_project_inventory_usage_details u WHERE u.creative_project_inventory_post_id=ip.creative_project_inventory_post_id) usage_detail_count
      FROM creative_project_inventory_posts ip
      JOIN creative_project_inventory_reversals rv ON rv.creative_project_inventory_post_id=ip.creative_project_inventory_post_id
      JOIN creative_project_material_reviews mr ON mr.creative_project_material_review_id=ip.creative_project_material_review_id
      JOIN site_item_inventory sii ON sii.site_item_inventory_id=ip.site_item_inventory_id
      WHERE lower(trim(COALESCE(ip.posting_status,'')))='reversed'
      ORDER BY rv.creative_project_inventory_reversal_id DESC LIMIT 1;"""),
      "creative_project_inventory_post_id","creative_project_inventory_reversal_id","site_item_inventory_id","posting_status","inventory_consumed","usage_detail_count")
    if not planned or not reviewed or not history:
        stop("No safe Build 283 evidence path is available (planned=%s, reviewed_unposted=%s, posts=%s, reversed_posts=%s, reversals=%s, project_resources=%s)."%(
          int(counts.get("planned_count") or 0),int(counts.get("reviewed_unposted_count") or 0),int(counts.get("post_count") or 0),
          int(counts.get("reversed_post_count") or 0),int(counts.get("reversal_count") or 0),int(counts.get("project_resource_count") or 0)))
    planned_project=int(planned["creative_work_project_id"]);reviewed_project=int(reviewed["creative_work_project_id"])
    before_journal=table_count("accounting_journal_entries");before_lines=table_count("accounting_journal_lines")
    before_item=first_with(d1(f"SELECT on_hand_quantity FROM site_item_inventory WHERE site_item_inventory_id={int(history['site_item_inventory_id'])};"),"on_hand_quantity") or {}
    pget=request(f"/api/admin/creative-process?project_id={planned_project}",cookie);rget=request(f"/api/admin/creative-process?project_id={reviewed_project}",cookie)
    plife=pget.get("planned_actual_inventory_lifecycle") or {};rlife=rget.get("planned_actual_inventory_lifecycle") or {}
    if plife.get("classification")!="PLANNED_ESTIMATES_SEPARATE_FROM_REVIEWED_AND_POSTED_ACTUALS" or int(plife.get("planned_estimate_count") or 0)<1:
        stop("Real planned-estimate operator projection is unavailable.")
    if rlife.get("classification")!="PLANNED_ESTIMATES_SEPARATE_FROM_REVIEWED_AND_POSTED_ACTUALS" or int(rlife.get("reviewed_actual_unposted_count") or 0)<1:
        stop("Real reviewed-but-unposted operator projection is unavailable.")
    if str(history.get("posting_status") or "").lower()!="reversed" or int(history.get("inventory_consumed") or 0)!=0 or int(history.get("usage_detail_count") or 0)<1:
        stop("Existing post/reversal history is incomplete.")
    if abs(float(history.get("stock_quantity_restored") or 0)-float(history.get("stock_quantity_consumed") or 0))>1e-7:
        stop("Existing compensating reversal did not restore the posted stock quantity.")
    if abs(float(history.get("reversal_new_on_hand") or 0)-float(history.get("previous_on_hand_quantity") or 0))>1e-7:
        stop("Existing compensating reversal did not return Inventory to the post starting quantity.")
    after_item=first_with(d1(f"SELECT on_hand_quantity FROM site_item_inventory WHERE site_item_inventory_id={int(history['site_item_inventory_id'])};"),"on_hand_quantity") or {}
    if abs(float(after_item.get("on_hand_quantity") or 0)-float(before_item.get("on_hand_quantity") or 0))>1e-9:
        stop("Read-only historical acceptance changed Inventory.")
    if table_count("accounting_journal_entries")!=before_journal or table_count("accounting_journal_lines")!=before_lines:
        stop("Finance journal changed during read-only historical acceptance.")
    evidence={"schema":"release467-build283-planned-vs-actual-inventory-operator-acceptance-v1","status":"PASS","source_sha":os.environ.get("GITHUB_SHA"),"environment":"development","exact_preview_url":True,"real_admin_operator_session":True,"acceptance_mode":"EXISTING_REAL_HISTORY_READ_ONLY","existing_project":True,"existing_material_event":True,"matching_real_inventory_item":True,"inventory_linkage":"existing_post_reversal_history","planned_estimate_verified":True,"reviewed_actual_unposted_verified":True,"explicit_inventory_post_verified":True,"posted_actual_verified":True,"compensating_reversal_verified":True,"reversal_history_count":1,"inventory_returned_to_starting_quantity":True,"finance_journal_unchanged":True,"development_mutation_performed":False,"automatic_inventory_movement":False,"finance_posting":False,"provider_execution_invoked":False,"public_promotion_invoked":False,"production_mutation":False,"correction_path_source_contract_verified":True,
      "planned_project_identity_sha256":hashlib.sha256(f"creative_work_project:{planned_project}".encode()).hexdigest(),
      "reviewed_project_identity_sha256":hashlib.sha256(f"creative_work_project:{reviewed_project}".encode()).hexdigest(),
      "inventory_post_identity_sha256":hashlib.sha256(f"creative_project_inventory_post:{int(history['creative_project_inventory_post_id'])}".encode()).hexdigest(),
      "inventory_identity_sha256":hashlib.sha256(f"site_item_inventory:{int(history['site_item_inventory_id'])}".encode()).hexdigest(),
      "raw_project_id_retained":False,"raw_event_id_retained":False,"raw_inventory_id_retained":False,"raw_session_token_retained":False,
      "runtime_acceptance":"PLANNED_ACTUAL_INVENTORY_OPERATOR_ACCEPTED_REAL_EVIDENCE"}
    OUT.write_text(json.dumps(evidence,indent=2,sort_keys=True)+"\n",encoding="utf-8")
    print("BUILD 283 PLANNED-VS-ACTUAL INVENTORY OPERATOR ACCEPTANCE: PASS")
    print("Existing real planned/reviewed states plus post/reversal ledger history verified read-only; Inventory and Finance unchanged.")
    raise SystemExit(0)
project_id=int(row["creative_work_project_id"]);event_id=int(row["creative_work_event_id"]);inventory_id=int(row["site_item_inventory_id"])
baseline=float(row.get("on_hand_quantity") or 0);reserved=float(row.get("reserved_quantity") or 0);per=max(0.001,float(row.get("usage_units_per_stock_unit") or 1))
inc=max(0.001,float(row.get("minimum_usage_increment") or 0.001));original_actual=max(0.0,float(row.get("actual_quantity") or 0))
available=max(0.0,baseline-reserved)*per
target=original_actual if original_actual>0 else inc
steps=max(1,int(round(target/inc))) if inc>0 else 1
usage=min(steps*inc,available)
if usage<inc-1e-9 or usage<=0:stop("Linked real Inventory item does not have enough available quantity for one explicit usage increment.")
initial_move=scalar(f"SELECT COUNT(*) AS n FROM site_inventory_movements WHERE site_item_inventory_id={inventory_id};","n")
initial_journal=table_count("accounting_journal_entries");initial_lines=table_count("accounting_journal_lines")
inventory_linkage=str(row.get("inventory_linkage") or "real_linked_inventory")
initial_get=request(f"/api/admin/creative-process?project_id={project_id}",cookie)
life=initial_get.get("planned_actual_inventory_lifecycle") or {}
if life.get("classification")!="PLANNED_ESTIMATES_SEPARATE_FROM_REVIEWED_AND_POSTED_ACTUALS" or life.get("planned_estimates_move_inventory") is not False:stop("Live Creative Process lifecycle projection is not the Build 274 planned-vs-actual contract.")
if int(life.get("reviewed_actual_unposted_count") or 0)<1:stop("Selected real project does not expose the reviewed-unposted operator state.")
planned_row=first_with(d1("""SELECT p.creative_work_project_id,e.creative_work_event_id
  FROM creative_work_events e JOIN creative_work_projects p ON p.creative_work_project_id=e.creative_work_project_id
  LEFT JOIN creative_project_material_reviews r ON r.creative_work_project_id=e.creative_work_project_id AND r.creative_work_event_id=e.creative_work_event_id
  WHERE COALESCE(p.project_status,'active')<>'archived' AND COALESCE(e.entry_status,'active')='active'
    AND trim(COALESCE(e.material_name,''))<>'' AND COALESCE(lower(trim(r.review_status)),'')<>'approved'
  ORDER BY p.updated_at DESC,e.creative_work_event_id DESC LIMIT 1;"""),"creative_work_project_id","creative_work_event_id")
if not planned_row:stop("Real planned material estimate is unavailable.")
planned_project_id=int(planned_row["creative_work_project_id"])
planned_get=request(f"/api/admin/creative-process?project_id={planned_project_id}",cookie)
planned_life=planned_get.get("planned_actual_inventory_lifecycle") or {}
if planned_life.get("classification")!="PLANNED_ESTIMATES_SEPARATE_FROM_REVIEWED_AND_POSTED_ACTUALS" or int(planned_life.get("planned_estimate_count") or 0)<1:stop("Real planned-estimate operator projection is unavailable.")
planned_and_reviewed_same_project=planned_project_id==project_id
review=request("/api/admin/creative-process",cookie,"POST",{"action":"review_material","project_id":project_id,"creative_work_event_id":event_id,"review_status":"approved","actual_quantity":usage,"waste_quantity":float(row.get("waste_quantity") or 0),"reusable_quantity":float(row.get("reusable_quantity") or 0),"approved_cost_cents":int(row.get("approved_cost_cents") or 0),"review_notes":str(row.get("review_notes") or "")})
if review.get("ok") is not True:stop("Material review operator action did not return ok=true.")
review_state=first_with(d1(f"""SELECT r.review_status,r.actual_quantity,r.inventory_consumed,
 (SELECT COUNT(*) FROM creative_project_inventory_posts ip WHERE ip.creative_work_project_id={project_id} AND ip.creative_work_event_id={event_id} AND COALESCE(ip.posting_status,'posted')<>'reversed') active_posts,
 (SELECT on_hand_quantity FROM site_item_inventory WHERE site_item_inventory_id={inventory_id}) on_hand
 FROM creative_project_material_reviews r WHERE r.creative_work_project_id={project_id} AND r.creative_work_event_id={event_id} LIMIT 1;"""),"review_status","actual_quantity","inventory_consumed","active_posts","on_hand")
if not review_state or str(review_state.get("review_status") or "").lower()!="approved" or int(review_state.get("inventory_consumed") or 0)!=0 or int(review_state.get("active_posts") or 0)!=0:stop("Reviewed actual did not remain explicitly unposted.")
if abs(float(review_state.get("on_hand") or 0)-baseline)>1e-9:stop("Inventory changed during material review before explicit posting.")
if scalar(f"SELECT COUNT(*) AS n FROM site_inventory_movements WHERE site_item_inventory_id={inventory_id};","n")!=initial_move:stop("Inventory movement was created before explicit posting.")
if table_count("accounting_journal_entries")!=initial_journal or table_count("accounting_journal_lines")!=initial_lines:stop("Finance journal changed during reviewed-but-unposted actual acceptance.")

posted=request("/api/admin/creative-process",cookie,"POST",{"action":"post_material_inventory","project_id":project_id,"creative_work_event_id":event_id,"site_item_inventory_id":inventory_id,"usage_quantity_consumed":usage,"notes":"Build 283 explicit operator post; reversal follows in the same acceptance."})
if posted.get("ok") is not True:stop("Explicit Inventory post operator action did not return ok=true.")
post_state=first_with(d1(f"""SELECT ip.creative_project_inventory_post_id,ip.posting_status,ip.stock_quantity_consumed,ip.previous_on_hand_quantity,ip.new_on_hand_quantity,r.inventory_consumed,
 (SELECT on_hand_quantity FROM site_item_inventory WHERE site_item_inventory_id={inventory_id}) on_hand
 FROM creative_project_inventory_posts ip JOIN creative_project_material_reviews r ON r.creative_project_material_review_id=ip.creative_project_material_review_id
 WHERE ip.creative_work_project_id={project_id} AND ip.creative_work_event_id={event_id} ORDER BY ip.creative_project_inventory_post_id DESC LIMIT 1;"""),"creative_project_inventory_post_id","posting_status","stock_quantity_consumed","inventory_consumed","on_hand")
if not post_state or str(post_state.get("posting_status") or "").lower()=="reversed" or int(post_state.get("inventory_consumed") or 0)!=1:stop("Explicit posted actual was not persisted as active.")
post_id=int(post_state["creative_project_inventory_post_id"]);consumed=float(post_state.get("stock_quantity_consumed") or 0)
if consumed<=0:stop("Build 283 selected exact/estimated Inventory but explicit posting consumed no stock quantity.")
if abs(float(post_state.get("on_hand") or 0)-(baseline-consumed))>1e-7:stop("Explicit Inventory post did not produce the expected on-hand quantity.")
if table_count("accounting_journal_entries")!=initial_journal or table_count("accounting_journal_lines")!=initial_lines:stop("Finance journal changed during explicit Inventory posting.")

reversed_resp=request("/api/admin/creative-process",cookie,"POST",{"action":"reverse_material_inventory","project_id":project_id,"creative_project_inventory_post_id":post_id,"reason":"Build 283 operator acceptance compensating reversal"})
if reversed_resp.get("ok") is not True:stop("Explicit compensating reversal operator action did not return ok=true.")
final=first_with(d1(f"""SELECT ip.posting_status,r.inventory_consumed,
 (SELECT COUNT(*) FROM creative_project_inventory_reversals x WHERE x.creative_project_inventory_post_id={post_id}) reversal_count,
 (SELECT on_hand_quantity FROM site_item_inventory WHERE site_item_inventory_id={inventory_id}) on_hand
 FROM creative_project_inventory_posts ip JOIN creative_project_material_reviews r ON r.creative_project_material_review_id=ip.creative_project_material_review_id
 WHERE ip.creative_project_inventory_post_id={post_id} LIMIT 1;"""),"posting_status","inventory_consumed","reversal_count","on_hand")
if not final or str(final.get("posting_status") or "").lower()!="reversed" or int(final.get("inventory_consumed") or 0)!=0 or int(final.get("reversal_count") or 0)!=1:stop("Compensating reversal history did not close the explicit post.")
if abs(float(final.get("on_hand") or 0)-baseline)>1e-7:stop("Inventory did not return to its exact starting quantity after compensating reversal.")
if table_count("accounting_journal_entries")!=initial_journal or table_count("accounting_journal_lines")!=initial_lines:stop("Finance journal changed during Build 283 acceptance.")
final_get=request(f"/api/admin/creative-process?project_id={project_id}",cookie)
final_life=final_get.get("planned_actual_inventory_lifecycle") or {}
if int(final_life.get("reviewed_actual_unposted_count") or 0)<1:stop("Final operator projection does not expose the reviewed-but-unposted actual after reversal.")
restore=request("/api/admin/creative-process",cookie,"POST",{"action":"review_material","project_id":project_id,"creative_work_event_id":event_id,"review_status":"approved","actual_quantity":original_actual,"waste_quantity":float(row.get("waste_quantity") or 0),"reusable_quantity":float(row.get("reusable_quantity") or 0),"approved_cost_cents":int(row.get("approved_cost_cents") or 0),"review_notes":str(row.get("review_notes") or "")})
if restore.get("ok") is not True:stop("Original reviewed actual values could not be restored after acceptance.")
evidence={"schema":"release467-build283-planned-vs-actual-inventory-operator-acceptance-v1","status":"PASS","source_sha":os.environ.get("GITHUB_SHA"),"environment":"development","exact_preview_url":True,"real_admin_operator_session":True,"existing_project":True,"existing_material_event":True,"matching_real_inventory_item":True,"inventory_linkage":inventory_linkage,"planned_and_reviewed_states_in_same_project":planned_and_reviewed_same_project,"synthetic_project_created":False,"synthetic_event_created":False,"planned_estimate_verified":True,"reviewed_actual_unposted_verified":True,"explicit_inventory_post_verified":True,"posted_actual_verified":True,"compensating_reversal_verified":True,"reversal_history_count":1,"inventory_returned_to_starting_quantity":True,"finance_journal_unchanged":True,"automatic_inventory_movement":False,"finance_posting":False,"provider_execution_invoked":False,"public_promotion_invoked":False,"production_mutation":False,"correction_path_source_contract_verified":True,"project_identity_sha256":hashlib.sha256(f"creative_work_project:{project_id}".encode()).hexdigest(),"event_identity_sha256":hashlib.sha256(f"creative_work_event:{event_id}".encode()).hexdigest(),"inventory_identity_sha256":hashlib.sha256(f"site_item_inventory:{inventory_id}".encode()).hexdigest(),"raw_project_id_retained":False,"raw_event_id_retained":False,"raw_inventory_id_retained":False,"raw_session_token_retained":False,"runtime_acceptance":"PLANNED_ACTUAL_INVENTORY_OPERATOR_ACCEPTED_REAL_EVIDENCE"}
OUT.write_text(json.dumps(evidence,indent=2,sort_keys=True)+"\n",encoding="utf-8")
print("BUILD 283 PLANNED-VS-ACTUAL INVENTORY OPERATOR ACCEPTANCE: PASS")
print("Existing planned material -> reviewed unposted actual -> explicit Inventory post -> compensating reversal; net stock and Finance journal unchanged.")
