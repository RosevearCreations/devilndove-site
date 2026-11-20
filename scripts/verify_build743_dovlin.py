#!/usr/bin/env python3
"""Build 743: fail-closed Dovlin gallery, material, and immutable art-source gate.
Only source file reads and local JS parse. No user records, network calls, credentials,
D1, R2, inventory, order, payment, or publication mutations.
"""
import hashlib
import json
import re
import subprocess
from pathlib import Path
from html.parser import HTMLParser

ROOT=Path(__file__).resolve().parents[1]
DOVLIN=ROOT/"dovlin"
source=json.loads((DOVLIN/"data/collection_seed.json").read_text(encoding="utf-8"))
evidence=json.loads((DOVLIN/"data/gallery_material_evidence.json").read_text(encoding="utf-8"))
art=json.loads((DOVLIN/"data/asset_manifest.json").read_text(encoding="utf-8"))
failures=[]

def check(condition,reason):
    if not condition:failures.append(reason)

def git_blob(path):
    body=path.read_bytes()
    return hashlib.sha1(b"blob "+str(len(body)).encode("ascii")+b"\0"+body).hexdigest()

check(evidence.get("schema_version")=="dovlin-gallery-material-evidence-1.0","unexpected evidence schema")
check(evidence.get("approval_state")=="pending_original_asset_visual_comparison","original-image visual signoff is mandatory")
records=evidence.get("records",[])
check(len(records)==68,"must provide exactly 68 independently described design concepts")
check(len({r.get("id") for r in records})==68,"each image evidence record must have a unique identity")
types={k:sum(1 for x in records if x.get("record_type")==k) for k in ("plush_concept","workshop_concept","colour_study")}
check(types=={"plush_concept":10,"workshop_concept":38,"colour_study":20},"complete source concept categories")
indexed={x.get("id"):x for x in records}
check({x["id"] for x in records if x.get("provisional_art_match")}=={"plush/burgundy-shadow","plush/ivory-dove","plush/silver-moon"},"all three approximate character artworks must remain provisional")
check(len(art["uploaded_assets"])==48 and len(art["cropped_colourways"])==20,"do not lose Build 742 approved source mapping")
check("The Legend of Dovlin" not in source.get("title","") or bool(source.get("canonical_story")),"legend must remain approved")
legend=(DOVLIN/"The_Legend_of_Dovlin_APPROVED.txt").read_text(encoding="utf-8")
check(source["canonical_story"].strip() in legend,"exact approved Dovlin legend must not change")

for plush in source["featured_plush"]:
    expected=indexed.get("plush/"+plush["slug"],{})
    check(expected.get("name")==plush["name"] and expected.get("source_webp")==plush["art"],"plush source match: "+plush["slug"])
for item in source["shop_concepts"]:
    expected=indexed.get("workshop/"+item["id"],{})
    check(expected.get("name")==item["title"] and expected.get("source_webp")==item["image"],"workshop source match: "+item["id"])
for position,item in enumerate(source["colour_lab"],start=1):
    expected=indexed.get("colour/"+str(position).zfill(2),{})
    check(expected.get("name")==item["name"] and expected.get("source_webp")==item["image"],"colour study source match: "+str(position))

for item in records:
    ident=item.get("id","unknown")
    source_ref=item.get("source_webp","")
    check(bool(re.fullmatch(r"assets/[a-zA-Z0-9_-]+\.webp",source_ref)), "unsafe/non-local image path "+ident)
    path=DOVLIN/source_ref
    if path.is_file():
        check(path.stat().st_size>2048 and path.read_bytes()[:4]==b"RIFF" and path.read_bytes()[8:12]==b"WEBP","missing/corrupt WebP "+ident)
        check(git_blob(path)==item.get("source_git_blob_sha"),"art source changed without record revision "+ident)
    else:
        check(False,"missing art asset "+ident)
    check(item.get("source_status")=="source_indexed_unverified_against_original_zip", "claimed source approval without original ZIP "+ident)
    check(item.get("visual_geometry_review")=="pending_owner_original_comparison","character line review improperly preapproved "+ident)
    check(item.get("product_publication_state")=="concept_only" and item.get("sellable") is False,"concept accidentally sellable "+ident)
    check(item.get("approved_sku") is None and item.get("approved_inventory_quantity") is None,"phantom stock/SKU "+ident)
    material=item.get("physical_material_evidence",{})
    check(material.get("actual_physical_sample") is False,"invented physical sample "+ident)
    check(all(material.get(k) is None for k in (
        "material_specification","supplier_or_lot","measured_dimensions",
        "safety_and_care_assessment","production_bom_revision","independent_evidence_reference"
    )),"unsupported material claims "+ident)
    review=item.get("review",{})
    check(all(review.get(k) is None for k in ("owner_approval","independent_reviewer","approved_asset_sha","approved_material_evidence")),"invented approvals "+ident)

master=evidence.get("master_character_reference",{})
master_file=DOVLIN/"assets/44_original-crimson-master-art.webp"
check(master.get("source_webp")=="assets/44_original-crimson-master-art.webp" and git_blob(master_file)==master.get("source_git_blob_sha"),"master character image hash not pinned")
check(master.get("geometry_approval")=="not_independently_reverified","no fabricated character geometry approval")
page=(DOVLIN/"gallery/index.html").read_text(encoding="utf-8")
landing=(DOVLIN/"index.html").read_text(encoding="utf-8")
check('<meta name="robots" content="noindex,follow">' in page, "material evidence gallery must be noindex while acceptance HOLD")
check('href="/dovlin/gallery/"' in landing,"Dovlin concept page must expose evidence route")
check('id="galleryGrid"' in page and 'id="recordDialog"' in page,"accessible gallery and detail dialog must exist")
check('type="search"' in page and 'role="status"' in page and 'aria-live="polite"' in page,"keyboard/search/status affordances missing")
check('textContent' in page and 'createDocumentFragment' in page and '.showModal()' in page,"safe DOM rendering required")
check('.innerHTML' not in page and 'document.write' not in page,"gallery must not inject untrusted HTML")
check('fetch(\'../data/gallery_material_evidence.json\',{credentials:\'omit\'' in page,"read-only local evidence source required")
check('application/ld+json' in page and '<h1>' in page,"original page semantics missing")
check("No items are currently for sale" in page or "no items for sale" in page.lower(),"must disclose concept-only state")
check('href="/dovlin/gallery/"' in landing and '/dovlin/' in (ROOT/"index.html").read_text(encoding="utf-8"),"do not replace existing store navigation")
scripts=re.findall(r"<script(?:\s[^>]*)?>(.*?)</script>",page,flags=re.I|re.S)
js=[body for body in scripts if "(() =>" in body]
check(len(js)==1,"expected one isolated gallery script")
if js:
    test=subprocess.run(["node","--check"],input=js[0],text=True,capture_output=True,check=False)
    check(test.returncode==0,"gallery JavaScript syntax: "+test.stderr.strip()[:250])

if failures:
    print("BUILD 743 DOVLIN EVIDENCE: FAIL")
    for f in failures:print(" -",f)
    raise SystemExit(1)
print("BUILD 743 DOVLIN EVIDENCE: PASS — 68 source-pinned concepts (10 plush, 38 workshop, 20 colours), byte-verified WebPs, held material claims, no phantom stock, three provisional names, exact legend, keyboard gallery and local-only read.")
print("HOLD remains: original owner-source image comparison, authenticated Development acceptance, independent physical-material evidence, signed publication approval and eventual production.")
