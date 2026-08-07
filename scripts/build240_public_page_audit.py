#!/usr/bin/env python3
"""Build 240 public page audit: one H1, title/meta/canonical, crawlable links, image alt/assets and structured data."""
from __future__ import annotations
import json
import re
from html.parser import HTMLParser
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
BUILD = "Build 240"
OUTPUT = ROOT / "data/site/build240-public-page-audit.json"
EXCLUDED_PREFIXES = ("admin/", "bootstrap-admin/", "login/", "register/", "members/", "account-help/", "change-password/")

class AuditParser(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.h1_count = 0
        self.title = ""
        self.in_title = False
        self.meta_description = ""
        self.robots = ""
        self.canonical = ""
        self.links: list[str] = []
        self.images: list[dict[str, str]] = []
        self.structured_data_count = 0
    def handle_starttag(self, tag, attrs):
        data = dict(attrs)
        tag = tag.lower()
        if tag == "h1": self.h1_count += 1
        elif tag == "title": self.in_title = True
        elif tag == "meta":
            name = (data.get("name") or "").lower()
            if name == "description": self.meta_description = (data.get("content") or "").strip()
            elif name == "robots": self.robots = (data.get("content") or "").lower()
        elif tag == "link" and (data.get("rel") or "").lower() == "canonical": self.canonical = (data.get("href") or "").strip()
        elif tag == "a" and data.get("href"): self.links.append(data["href"].strip())
        elif tag == "img": self.images.append({"src": (data.get("src") or "").strip(), "alt": data.get("alt")})
        elif tag == "script" and (data.get("type") or "").lower() == "application/ld+json": self.structured_data_count += 1
    def handle_endtag(self, tag):
        if tag.lower() == "title": self.in_title = False
    def handle_data(self, data):
        if self.in_title: self.title += data

def route_for(path: Path) -> str:
    rel = path.relative_to(ROOT).as_posix()
    if rel == "index.html": return "/"
    if rel.endswith("/index.html"): return "/" + rel[:-10]
    return "/" + rel

def asset_exists(src: str) -> bool:
    if not src.startswith("/assets/"): return True
    clean = src.split("?",1)[0].split("#",1)[0].lstrip("/")
    return (ROOT / clean).is_file()

def main() -> int:
    audits=[]
    for path in sorted(ROOT.rglob("index.html")):
        rel=path.relative_to(ROOT).as_posix()
        if rel.startswith(EXCLUDED_PREFIXES): continue
        text=path.read_text(encoding="utf-8",errors="ignore")
        parser=AuditParser(); parser.feed(text)
        if "noindex" in parser.robots: continue
        missing_alt=sum(1 for image in parser.images if image["alt"] is None or not str(image["alt"]).strip())
        missing_assets=sum(1 for image in parser.images if image["src"] and not asset_exists(image["src"]))
        internal_links=[href for href in parser.links if href.startswith("/") and not href.startswith("//")]
        blockers=[]; warnings=[]
        if parser.h1_count != 1: blockers.append(f"Expected one H1; found {parser.h1_count}.")
        if not parser.title.strip(): blockers.append("Missing title.")
        if not parser.meta_description.strip(): warnings.append("Missing meta description.")
        if not parser.canonical.strip(): warnings.append("Missing canonical.")
        if missing_alt: blockers.append(f"{missing_alt} image(s) missing alt text.")
        if missing_assets: blockers.append(f"{missing_assets} local image asset(s) missing.")
        if not internal_links: warnings.append("No crawlable internal links found.")
        if parser.structured_data_count == 0: warnings.append("No JSON-LD structured data found.")
        status="failed" if blockers else "warning" if warnings else "passed"
        audits.append({
            "build_label":BUILD,"page_path":route_for(path),"source_file":rel,"audit_status":status,
            "h1_count":parser.h1_count,"title_text":parser.title.strip(),"meta_description_text":parser.meta_description,
            "canonical_url":parser.canonical,"internal_link_count":len(internal_links),"image_count":len(parser.images),
            "missing_alt_count":missing_alt,"missing_asset_count":missing_assets,"structured_data_count":parser.structured_data_count,
            "mobile_overflow_status":"requires_browser_check","blockers":blockers,"warnings":warnings,
            "notes":"; ".join(blockers+warnings)
        })
    summary={
        "build_label":BUILD,"audited_pages":len(audits),"passed":sum(r["audit_status"]=="passed" for r in audits),
        "warnings":sum(r["audit_status"]=="warning" for r in audits),"failed":sum(r["audit_status"]=="failed" for r in audits)
    }
    OUTPUT.parent.mkdir(parents=True,exist_ok=True)
    OUTPUT.write_text(json.dumps({"summary":summary,"rows":audits},indent=2,ensure_ascii=False)+"\n",encoding="utf-8")
    print(json.dumps(summary,indent=2))
    for row in audits:
        if row["audit_status"] != "passed": print(row["audit_status"].upper(),row["page_path"],row["notes"])
    return 1 if summary["failed"] else 0
if __name__ == "__main__": raise SystemExit(main())
