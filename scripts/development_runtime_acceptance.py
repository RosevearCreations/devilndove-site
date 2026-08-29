#!/usr/bin/env python3
"""Release 448 Development-only runtime acceptance for Devil n Dove.

The runtime path performs GET requests only. Authentication is supplied only through
DND_DEV_SESSION_COOKIE. Provider readiness is reported separately from provider
transaction acceptance.
"""
from __future__ import annotations

import argparse,json,os,sys
from datetime import datetime,timezone
from pathlib import Path
from urllib.error import HTTPError,URLError
from urllib.parse import urljoin,urlparse
from urllib.request import Request,urlopen

EXPECTED_RELEASE = 448
DEFAULT_BASE_URL = "https://devilndove-site-dev.pages.dev"
ALLOWED_HOSTS = {"devilndove-site-dev.pages.dev"}
SESSION_ENV = "DND_DEV_SESSION_COOKIE"
EXPECTED_MODULES = ["storefront", "creators", "socials", "financials", "it-platform"]
AUTH_ENDPOINTS = {
    "infrastructure": "/api/admin/infrastructure-readiness",
    "modules": "/api/admin/app-modules",
    "storefront": "/api/admin/contracts/catalog-read?limit=1",
    "creators": "/api/admin/contracts/content-media?limit=1",
    "financials": "/api/admin/contracts/accounting-read?limit=1",
}
RELEASE448_READ_ENDPOINTS = {
    "product_lineage": "/api/admin/product-lineage?limit=1",
    "photography": "/api/admin/product-image-quality?summary=1&limit=1",
    "storefront_merchandising": "/api/admin/storefront-merchandising",
    "inventory_intelligence": "/api/admin/inventory-intelligence",
    "tool_lifecycle": "/api/admin/tool-lifecycle",
    "supply_sourcing": "/api/admin/supply-sourcing",
    "calibration": "/api/admin/release448-calibration",
    "it_integrations": "/api/admin/it-integrations",
}
PUBLIC_ENDPOINTS = {"payment_providers": "/api/payment-providers"}

class AcceptanceError(RuntimeError):
    pass

def validate_base_url(value: str) -> str:
    value=str(value or "").strip().rstrip("/");parsed=urlparse(value);host=(parsed.hostname or "").lower()
    if parsed.scheme!="https" or host not in ALLOWED_HOSTS or parsed.path not in ("", "/"):
        raise AcceptanceError("Refusing runtime target. Only the exact Development Pages host is allowed; Production, custom-domain and arbitrary targets are forbidden.")
    return value

def get_json(base_url: str,path: str,cookie: str|None,timeout: float=20.0)->tuple[int,dict]:
    headers={"Accept":"application/json","Cache-Control":"no-store","User-Agent":"devilndove-development-runtime-acceptance"}
    if cookie:headers["Cookie"]=cookie
    request=Request(urljoin(base_url+"/",path.lstrip("/")),headers=headers,method="GET")
    try:
        with urlopen(request,timeout=timeout) as response:
            status=int(getattr(response,"status",200));raw=response.read().decode("utf-8",errors="replace")
    except HTTPError as error:
        status=int(error.code);raw=error.read().decode("utf-8",errors="replace")
    except URLError as error:raise AcceptanceError(f"GET {path} failed: {error.reason}") from error
    try:payload=json.loads(raw)
    except json.JSONDecodeError as error:raise AcceptanceError(f"GET {path} returned non-JSON content (HTTP {status}).") from error
    if not isinstance(payload,dict):raise AcceptanceError(f"GET {path} returned a non-object JSON payload.")
    return status,payload

def record(checks:list[dict],name:str,passed:bool,detail:str)->None:
    checks.append({"check":name,"status":"PASS" if passed else "FAIL","detail":detail})

def provider_readiness(payload:dict)->dict:
    providers={str(row.get("code") or "").lower():row for row in payload.get("providers",[]) if isinstance(row,dict)}
    stripe=providers.get("stripe",{});paypal=providers.get("paypal",{})
    stripe_ready=bool(stripe.get("ready") and stripe.get("webhook_ready") and str(stripe.get("environment") or "").lower()=="test")
    paypal_ready=bool(paypal.get("ready") and paypal.get("webhook_ready") and str(paypal.get("mode") or "").lower()=="sandbox")
    return {
        "stripe":{"configuration_readiness":"READY" if stripe_ready else "HOLD","provider_acceptance":"HOLD","required_mode":"test"},
        "paypal":{"configuration_readiness":"READY" if paypal_ready else "HOLD","provider_acceptance":"HOLD","required_mode":"sandbox"},
        "note":"Configuration readiness is read-only evidence and is not checkout, webhook replay, reconciliation or provider acceptance.",
    }

def protected_manifest()->dict[str,str]:
    return {**AUTH_ENDPOINTS,**RELEASE448_READ_ENDPOINTS}

def run_anonymous_check(base_url:str,timeout:float)->dict:
    checks=[]
    for name,path in protected_manifest().items():
        status,_=get_json(base_url,path,cookie=None,timeout=timeout)
        record(checks,f"anonymous_{name}_refused",status in (401,403),f"HTTP {status}; expected 401/403")
    return {"mode":"anonymous-protected-route-check","target":base_url,"checks":checks,"overall":"PASS" if all(row["status"]=="PASS" for row in checks) else "FAIL"}

def release448_read_ok(name:str,payload:dict)->tuple[bool,str]:
    if int(payload.get("release") or 0)!=EXPECTED_RELEASE:return False,f"release={payload.get('release')!r}"
    if payload.get("ok") is not True:return False,"ok is not true"
    if name in {"product_lineage","photography","storefront_merchandising","tool_lifecycle","it_integrations"} and payload.get("schema_ready") not in (True,1):return False,f"schema_ready={payload.get('schema_ready')!r}"
    if name=="calibration" and int((payload.get("summary") or {}).get("schema_blocked") or 0)!=0:return False,f"schema_blocked={(payload.get('summary') or {}).get('schema_blocked')!r}"
    if name=="supply_sourcing" and payload.get("stock_mutation_capability")!="none":return False,f"stock_mutation_capability={payload.get('stock_mutation_capability')!r}"
    if name=="inventory_intelligence" and payload.get("write_authority_duplicated") is not False:return False,f"write_authority_duplicated={payload.get('write_authority_duplicated')!r}"
    return True,"Release 448 authenticated GET authority ready"

def run_authenticated(base_url:str,cookie:str,timeout:float)->dict:
    checks=[]
    payment_status,payment_payload=get_json(base_url,PUBLIC_ENDPOINTS["payment_providers"],cookie=None,timeout=timeout)
    record(checks,"payment_provider_readiness_contract",payment_status==200 and payment_payload.get("ok") is True,f"HTTP {payment_status}; safe non-secret readiness only")

    infra_status,infra=get_json(base_url,AUTH_ENDPOINTS["infrastructure"],cookie=cookie,timeout=timeout)
    record(checks,"authenticated_infrastructure_contract",infra_status==200 and infra.get("ok") is True,f"HTTP {infra_status}")
    record(checks,"development_target",infra.get("target")=="development" and infra.get("project")=="devilndove-site-dev",f"target={infra.get('target')!r} project={infra.get('project')!r}")
    record(checks,"d1_r2_readiness",infra.get("ready") is True and infra.get("d1",{}).get("schema_ready") is True and len(infra.get("r2",[]))==2 and all(row.get("storage_ready") is True for row in infra.get("r2",[])),"D1 schema plus both Development R2 bindings")
    record(checks,"no_runtime_migration",infra.get("migration",{}).get("required") is False and infra.get("current_release_sql_required") is False,f"migration_required={infra.get('migration',{}).get('required')!r}")
    mutation=infra.get("mutation_policy",{})
    record(checks,"read_only_runtime_policy",mutation.get("d1_write") is False and mutation.get("r2_write") is False and mutation.get("provider_write") is False and mutation.get("destructive_probe_performed") is False,"D1/R2/provider writes disabled")

    modules_status,modules=get_json(base_url,AUTH_ENDPOINTS["modules"],cookie=cookie,timeout=timeout)
    module_rows=modules.get("modules",[]) if isinstance(modules.get("modules"),list) else []
    module_keys=sorted(str(row.get("module_key") or "").lower() for row in module_rows if isinstance(row,dict) and row.get("module_key"))
    diagnostics=modules.get("diagnostics",{}) if isinstance(modules.get("diagnostics"),dict) else {}
    record(checks,"five_module_runtime",modules_status==200 and modules.get("ok") is True and int(modules.get("release") or 0)==EXPECTED_RELEASE and module_keys==sorted(EXPECTED_MODULES) and diagnostics.get("healthy") is True and int(diagnostics.get("role_access_count") or 0)==10,f"HTTP {modules_status}; release={modules.get('release')!r}; modules={module_keys}; roles={diagnostics.get('role_access_count')}")
    record(checks,"socials_runtime_authority","socials" in module_keys,"Socials present; no publish mutation executed.")

    for name,expected_contract in (("storefront","catalog-read"),("creators","content-media"),("financials","accounting-read")):
        status,payload=get_json(base_url,AUTH_ENDPOINTS[name],cookie=cookie,timeout=timeout)
        passed=status==200 and payload.get("ok") is True and payload.get("contract")==expected_contract and int(payload.get("release") or 0)==EXPECTED_RELEASE
        if name=="financials":passed=passed and payload.get("schema_ready") is True
        record(checks,f"{name}_read_contract",passed,f"HTTP {status}; release={payload.get('release')!r}; contract={payload.get('contract')!r}")

    for name,path in RELEASE448_READ_ENDPOINTS.items():
        status,payload=get_json(base_url,path,cookie=cookie,timeout=timeout)
        valid,detail=release448_read_ok(name,payload) if status==200 else (False,f"HTTP {status}")
        record(checks,f"release448_{name}_read",status==200 and valid,f"HTTP {status}; {detail}")

    record(checks,"it_runtime_authority",infra_status==200 and infra.get("ok") is True and "it-platform" in module_keys,"I.T. covered by authenticated infrastructure plus canonical module authority.")
    core_pass=all(row["status"]=="PASS" for row in checks)
    return {
        "authority":"development-runtime-acceptance","release":EXPECTED_RELEASE,"mode":"authenticated-development-read-only","target":base_url,
        "generated_at":datetime.now(timezone.utc).replace(microsecond=0).isoformat(),"http_method":"GET","credentials_source":SESSION_ENV,"credentials_emitted":False,
        "core_runtime":"PASS" if core_pass else "FAIL","checks":checks,"provider_readiness":provider_readiness(payment_payload),
        "provider_transaction_acceptance":"NOT_PERFORMED","caip_private_media_acceptance":"NOT_PERFORMED","production_mutation":"FORBIDDEN",
    }

def self_check()->int:
    checks=[]
    try:validate_base_url(DEFAULT_BASE_URL);record(checks,"development_default_allowed",True,DEFAULT_BASE_URL)
    except AcceptanceError as error:record(checks,"development_default_allowed",False,str(error))
    for forbidden in ("https://devilndove.com","https://devilndove-site.pages.dev","https://example.com","http://devilndove-site-dev.pages.dev"):
        refused=False
        try:validate_base_url(forbidden)
        except AcceptanceError:refused=True
        record(checks,f"forbid_{urlparse(forbidden).hostname or 'invalid'}",refused,forbidden)
    record(checks,"release_448_declared",EXPECTED_RELEASE==448,str(EXPECTED_RELEASE))
    record(checks,"five_modules_declared",EXPECTED_MODULES==["storefront","creators","socials","financials","it-platform"],str(EXPECTED_MODULES))
    record(checks,"auth_from_environment_only",SESSION_ENV=="DND_DEV_SESSION_COOKIE",SESSION_ENV)
    all_paths=[*protected_manifest().values(),*PUBLIC_ENDPOINTS.values()]
    record(checks,"get_only_manifest",all(path.startswith("/api/") for path in all_paths),f"{len(all_paths)} runtime endpoints are GET-only in this harness")
    required_reads={"product_lineage","photography","storefront_merchandising","inventory_intelligence","tool_lifecycle","supply_sourcing","calibration","it_integrations"}
    record(checks,"release448_operational_manifest",set(RELEASE448_READ_ENDPOINTS)==required_reads,str(sorted(RELEASE448_READ_ENDPOINTS)))
    overall=all(row["status"]=="PASS" for row in checks)
    print("DEVELOPMENT RUNTIME ACCEPTANCE SELF-CHECK")
    for row in checks:print(f"{row['status']}: {row['check']} — {row['detail']}")
    print(f"SELF-CHECK: {'PASS' if overall else 'FAIL'}")
    return 0 if overall else 1

def write_evidence(path:str,evidence:dict)->None:
    target=Path(path);target.parent.mkdir(parents=True,exist_ok=True);target.write_text(json.dumps(evidence,indent=2,sort_keys=True)+"\n",encoding="utf-8")

def main()->int:
    parser=argparse.ArgumentParser(description=__doc__);parser.add_argument("--base-url",default=DEFAULT_BASE_URL);parser.add_argument("--timeout",type=float,default=20.0);parser.add_argument("--evidence-json",default="");parser.add_argument("--self-check",action="store_true",help="Run local safety/manifest checks only; no network.");parser.add_argument("--anonymous-check",action="store_true",help="GET protected Development routes without credentials and require 401/403.");args=parser.parse_args()
    if args.self_check:return self_check()
    try:
        base_url=validate_base_url(args.base_url)
        if args.anonymous_check:evidence=run_anonymous_check(base_url,args.timeout)
        else:
            cookie=os.environ.get(SESSION_ENV,"").strip()
            if not cookie:raise AcceptanceError(f"{SESSION_ENV} is required for authenticated acceptance. Do not pass cookies/tokens on the command line or commit them to the repository.")
            evidence=run_authenticated(base_url,cookie,args.timeout)
    except AcceptanceError as error:print(f"RUNTIME ACCEPTANCE: REFUSED/FAILED — {error}",file=sys.stderr);return 2
    if args.evidence_json:write_evidence(args.evidence_json,evidence);print(f"Sanitized evidence: {args.evidence_json}")
    for row in evidence.get("checks",[]):print(f"{row['status']}: {row['check']} — {row['detail']}")
    overall=evidence.get("core_runtime") or evidence.get("overall") or "FAIL";print(f"RUNTIME ACCEPTANCE: {overall}")
    if "provider_readiness" in evidence:print("Provider readiness is reported separately; no payment/provider mutation was performed.")
    return 0 if overall=="PASS" else 1

if __name__=="__main__":raise SystemExit(main())
