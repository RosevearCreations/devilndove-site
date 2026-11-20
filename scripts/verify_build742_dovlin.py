#!/usr/bin/env python3
"""Build 742 source-only Dovlin release acceptance. No customer, payment, storage or network writes."""
from __future__ import annotations
import json
from pathlib import Path

ROOT=Path(__file__).resolve().parent.parent
BASE=ROOT/"dovlin"
seed=json.loads((BASE/"data/collection_seed.json").read_text(encoding="utf-8"))
manifest=json.loads((BASE/"data/asset_manifest.json").read_text(encoding="utf-8"))

def require(ok, message):
    if not ok:
        raise SystemExit("DOVLIN SOURCE GATE: FAIL — "+message)

plush=seed["featured_plush"]
concepts=seed["shop_concepts"]
colours=seed["colour_lab"]
source_assets=manifest["uploaded_assets"]
require(len(plush)==10 and len({p["slug"] for p in plush})==10,"ten unique planned plush concepts")
require(len(concepts)==38 and len({p["id"] for p in concepts})==38,"38 unique workshop concepts")
require(len(colours)==20,"20 future colour studies")
require(len(source_assets)==48,"48 source-indexed art assets")
require(len(manifest["cropped_colourways"])==20,"20 original colour crops")
require(all(p["status"]=="concept_only" and p.get("price") is None and p.get("inventory") is None for p in concepts),"concepts have no sales price or inventory")
require(all(p["commercial_status"]=="concept_only" for p in source_assets),"source imagery is not sellable stock")
require(all(p["state"] in {"concept_only","prototype_planned"} for p in plush),"plushes are not declared live sellable")
require({p["name"] for p in plush if p.get("art_match")=="provisional_approximation"}=={"Burgundy Shadow","Ivory Dove","Silver Moon"},"provisional art match labels remain intact")
approved=(BASE/"The_Legend_of_Dovlin_APPROVED.txt").read_text(encoding="utf-8")
require(seed["canonical_story"].strip() in approved,"approved legend must be reproduced verbatim")
page=(BASE/"index.html").read_text(encoding="utf-8")
require("concept_only" in (BASE/"data/collection_seed.json").read_text(encoding="utf-8"),"concept publication state retained")
require("application/ld+json" in page and "og:site_name" in page and "twitter:card" in page,"public route has accessible SEO metadata")
require("id=\"dovlinLightbox\"" in page and "aria-label" in page,"keyboard image gallery required")
require("https://devilndove.com/dovlin/" in (ROOT/"sitemap.xml").read_text(encoding="utf-8"),"canonical sitemap route required")
require("/dovlin/" in (ROOT/"index.html").read_text(encoding="utf-8"),"home nav entry required")
image_refs=[]
image_refs.extend([seed["hero_image"]])
image_refs.extend([p["art"] for p in plush])
image_refs.extend([p["image"] for p in colours])
image_refs.extend([p["image"] for p in concepts])
image_refs.extend([p["thumb"] for p in concepts])
image_refs.extend([p["site_image"] for p in source_assets])
image_refs.extend([p["thumbnail"] for p in source_assets])
image_refs.extend([p["image"] for p in seed["original_colourway_sheets"]])
for ref in sorted(set(image_refs)):
    require(not ref.startswith("/") and ".." not in Path(ref).parts, "image path is relative and path-safe: "+ref)
    path=BASE/ref
    require(path.is_file(), "missing source image: "+ref)
    data=path.read_bytes()
    require(len(data)>2048 and data[0:4]==b"RIFF" and data[8:12]==b"WEBP","bad or empty WebP asset: "+ref)
require((BASE/"Dovlin_Collectors_Passport_CONCEPT.pdf").read_bytes().startswith(b"%PDF"),"collector passport original PDF missing")
print("DOVLIN SOURCE GATE: PASS — 10 planned plush, 38 concept pieces, 20 colour cards, 48 source art originals, source provenance, asset bytes, concept-only checkout protection, exact legend, navigation/SEO, and accessible gallery labels.")
print("NOTE: image pixel fidelity against the owner's original ZIP, device browser performance, and production preview remain separate mandatory acceptance gates.")
