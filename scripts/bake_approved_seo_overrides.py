#!/usr/bin/env python3
"""Bake reviewed SEO overrides into static HTML before deploy.

Input: data/site/seo-page-overrides.json
Shape:
{
  "overrides": [
    {"path":"/gallery/", "title":"...", "meta_description":"...", "internal_link_note":"...", "status":"approved"}
  ]
}

The script is intentionally no-network and safe for GitHub/Cloudflare workflows. It updates
<title>, meta description, and adds/updates a small internal-link note section before the footer.
"""
from __future__ import annotations

import json
import re
from html import escape
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OVERRIDES = ROOT / "data" / "site" / "seo-page-overrides.json"


def page_file(path_value: str) -> Path | None:
    path = (path_value or "/").strip()
    if not path.startswith("/"):
        path = "/" + path
    if path == "/":
        return ROOT / "index.html"
    if path.endswith("/"):
        return ROOT / path.lstrip("/") / "index.html"
    candidate = ROOT / path.lstrip("/")
    if candidate.suffix.lower() == ".html":
        return candidate
    return candidate / "index.html"


def replace_title(html: str, title: str) -> str:
    if not title:
        return html
    new = f"<title>{escape(title, quote=False)}</title>"
    if re.search(r"<title>.*?</title>", html, flags=re.I | re.S):
        return re.sub(r"<title>.*?</title>", new, html, count=1, flags=re.I | re.S)
    return html.replace("</head>", f"  {new}\n</head>", 1)


def replace_description(html: str, description: str) -> str:
    if not description:
        return html
    content = escape(description, quote=True)
    tag = f'<meta name="description" content="{content}" />'
    if re.search(r'<meta\s+name=["\']description["\'][^>]*>', html, flags=re.I):
        return re.sub(r'<meta\s+name=["\']description["\'][^>]*>', tag, html, count=1, flags=re.I)
    return html.replace("</head>", f"  {tag}\n</head>", 1)


def upsert_internal_note(html: str, note: str) -> str:
    if not note:
        return html
    block = (
        '<section id="seoPageOverrideNote" class="card seo-page-override-note" style="margin-top:18px">\n'
        '  <h2 style="margin-top:0">Helpful links and browsing notes</h2>\n'
        f'  <p class="small">{escape(note)}</p>\n'
        '</section>'
    )
    pattern = r'<section\s+id=["\']seoPageOverrideNote["\'][\s\S]*?</section>'
    if re.search(pattern, html, flags=re.I):
        return re.sub(pattern, block, html, count=1, flags=re.I)
    footer_match = re.search(r'(<(?:div|footer)[^>]*class=["\'][^"\']*footer[^"\']*["\'][^>]*>)', html, flags=re.I)
    if footer_match:
        return html[:footer_match.start()] + block + "\n" + html[footer_match.start():]
    return html.replace("</body>", block + "\n</body>", 1)


def main() -> int:
    if not OVERRIDES.exists():
        print("No SEO override file found; nothing to bake.")
        return 0
    data = json.loads(OVERRIDES.read_text(encoding="utf-8"))
    changed = []
    for row in data.get("overrides", []):
        status = str(row.get("status") or row.get("review_status") or "approved").lower()
        if status not in {"approved", "applied", "published"}:
            continue
        target = page_file(str(row.get("path") or row.get("page_path") or "/"))
        if not target or not target.exists():
            print(f"SKIP missing page: {row.get('path')}")
            continue
        html = target.read_text(encoding="utf-8")
        original = html
        html = replace_title(html, str(row.get("title") or row.get("approved_title") or "").strip())
        html = replace_description(html, str(row.get("meta_description") or row.get("approved_meta_description") or "").strip())
        html = upsert_internal_note(html, str(row.get("internal_link_note") or row.get("approved_internal_link_note") or "").strip())
        if html != original:
            target.write_text(html, encoding="utf-8")
            changed.append(str(target.relative_to(ROOT)))
    print(f"Baked SEO overrides into {len(changed)} page(s).")
    for path in changed:
        print(f" - {path}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
