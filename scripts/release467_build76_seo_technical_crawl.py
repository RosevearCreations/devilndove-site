#!/usr/bin/env python3
"""Release 467 Build 76 — crawl every checked-in public HTML route and enforce technical SEO convergence."""
from __future__ import annotations

import json
import re
import sys
import xml.etree.ElementTree as ET
from collections import defaultdict
from dataclasses import dataclass, field
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urljoin, urlsplit

ROOT = Path(__file__).resolve().parents[1]
PRODUCTION_ORIGIN = "https://devilndove.com"
SITEMAP_PATH = ROOT / "sitemap.xml"
ROBOTS_PATH = ROOT / "robots.txt"

# Product Detail is a dynamic template. Individual slug canonicals are generated at runtime,
# so the template itself must remain technically sound but is intentionally not a sitemap URL.
DYNAMIC_TEMPLATE_ROUTES = {"/shop/product/"}
REQUIRED_SOCIAL_META = (
    "og:site_name",
    "og:type",
    "og:title",
    "og:description",
    "og:url",
    "og:image",
    "twitter:card",
)
SKIP_TOP_LEVEL = {
    ".git",
    ".github",
    "admin",
    "assets",
    "css",
    "data",
    "docs",
    "functions",
    "migrations",
    "node_modules",
    "public",
    "scripts",
    "test",
    "tests",
    "vendor",
}
FAIL: list[str] = []


def clean(value: object) -> str:
    return re.sub(r"\s+", " ", str(value or "")).strip()


def route_for(path: Path) -> str:
    rel = path.relative_to(ROOT).as_posix()
    if rel == "index.html":
        return "/"
    if rel.endswith("/index.html"):
        return "/" + rel[: -len("index.html")]
    return "/" + rel


def expected_canonical(route: str) -> str:
    return f"{PRODUCTION_ORIGIN}{route}"


def normalize_internal_href(source_route: str, href: str) -> str | None:
    href = clean(href)
    if not href or href.startswith(("#", "mailto:", "tel:", "javascript:", "data:")):
        return None
    absolute = urljoin(f"{PRODUCTION_ORIGIN}{source_route}", href)
    parts = urlsplit(absolute)
    if parts.scheme not in {"http", "https"} or parts.netloc not in {"devilndove.com", "www.devilndove.com"}:
        return None
    path = parts.path or "/"
    if not path.startswith("/"):
        path = "/" + path
    if path.endswith("/index.html"):
        path = path[: -len("index.html")]
    return path


class SeoParser(HTMLParser):
    def __init__(self) -> None:
        super().__init__(convert_charrefs=True)
        self.title_parts: list[str] = []
        self.in_title = False
        self.h1_count = 0
        self.meta: list[dict[str, str]] = []
        self.links: list[dict[str, str]] = []
        self.anchors: list[str] = []
        self.jsonld_raw: list[str] = []
        self._jsonld_parts: list[str] | None = None

    def handle_starttag(self, tag: str, attrs) -> None:
        values = {str(k).lower(): str(v or "") for k, v in attrs}
        tag = tag.lower()
        if tag == "title":
            self.in_title = True
        elif tag == "h1":
            self.h1_count += 1
        elif tag == "meta":
            self.meta.append(values)
        elif tag == "link":
            self.links.append(values)
        elif tag == "a":
            self.anchors.append(values.get("href", ""))
        elif tag == "script" and values.get("type", "").lower() == "application/ld+json":
            self._jsonld_parts = []

    def handle_endtag(self, tag: str) -> None:
        tag = tag.lower()
        if tag == "title":
            self.in_title = False
        elif tag == "script" and self._jsonld_parts is not None:
            self.jsonld_raw.append("".join(self._jsonld_parts).strip())
            self._jsonld_parts = None

    def handle_data(self, data: str) -> None:
        if self.in_title:
            self.title_parts.append(data)
        if self._jsonld_parts is not None:
            self._jsonld_parts.append(data)

    @property
    def title(self) -> str:
        return clean("".join(self.title_parts))

    def meta_value(self, key: str) -> str:
        wanted = key.lower()
        for row in self.meta:
            candidate = (row.get("name") or row.get("property") or "").lower()
            if candidate == wanted:
                return clean(row.get("content"))
        return ""

    def canonical_values(self) -> list[str]:
        output: list[str] = []
        for row in self.links:
            rel = {part.lower() for part in clean(row.get("rel")).split()}
            if "canonical" in rel:
                output.append(clean(row.get("href")))
        return output


@dataclass
class RouteAudit:
    path: Path
    route: str
    parser: SeoParser
    robots: str
    indexable: bool
    noindex: bool
    canonical: str
    internal_targets: set[str] = field(default_factory=set)
    jsonld_types: set[str] = field(default_factory=set)


def public_html_paths() -> list[Path]:
    paths: list[Path] = []
    for path in sorted(ROOT.rglob("*.html")):
        rel = path.relative_to(ROOT)
        if rel.parts and rel.parts[0] in SKIP_TOP_LEVEL:
            continue
        text = path.read_text(encoding="utf-8", errors="replace")
        if not re.search(r"<html(?:\s|>)", text, re.I):
            continue
        paths.append(path)
    return paths


def walk_json(value):
    if isinstance(value, dict):
        yield value
        for child in value.values():
            yield from walk_json(child)
    elif isinstance(value, list):
        for child in value:
            yield from walk_json(child)


def parse_jsonld(audit: RouteAudit) -> None:
    valid = 0
    context_seen = False
    for raw in audit.parser.jsonld_raw:
        if not raw:
            continue
        try:
            payload = json.loads(raw)
        except Exception as error:
            FAIL.append(f"{audit.route}: invalid JSON-LD ({error})")
            continue
        valid += 1
        for row in walk_json(payload):
            context = row.get("@context")
            if isinstance(context, str) and "schema.org" in context:
                context_seen = True
            raw_type = row.get("@type")
            if isinstance(raw_type, list):
                audit.jsonld_types.update(clean(item) for item in raw_type if clean(item))
            elif clean(raw_type):
                audit.jsonld_types.add(clean(raw_type))
    if audit.indexable:
        if valid < 1:
            FAIL.append(f"{audit.route}: indexable route missing valid JSON-LD")
        elif not context_seen:
            FAIL.append(f"{audit.route}: JSON-LD missing schema.org @context")


def audit_route(path: Path) -> RouteAudit:
    source = path.read_text(encoding="utf-8", errors="replace")
    parser = SeoParser()
    parser.feed(source)
    route = route_for(path)
    robots = parser.meta_value("robots").lower().replace(" ", "")
    noindex = "noindex" in robots
    canonicals = parser.canonical_values()
    canonical = canonicals[0] if len(canonicals) == 1 else ""
    indexable = not noindex and canonical.startswith(f"{PRODUCTION_ORIGIN}/")
    audit = RouteAudit(path, route, parser, robots, indexable, noindex, canonical)

    if parser.h1_count != 1:
        FAIL.append(f"{route}: exactly one source H1 required (found {parser.h1_count})")
    if len(parser.title) < 10:
        FAIL.append(f"{route}: title is missing or under 10 characters")
    if not robots:
        FAIL.append(f"{route}: explicit robots index/noindex authority is missing")
    if len(canonicals) > 1:
        FAIL.append(f"{route}: duplicate canonical tags found ({len(canonicals)})")
    if canonical and ("pages.dev" in canonical or not canonical.startswith(f"{PRODUCTION_ORIGIN}/")):
        FAIL.append(f"{route}: canonical must use the Production devilndove.com origin")

    audit.internal_targets = {
        target
        for href in parser.anchors
        if (target := normalize_internal_href(route, href)) is not None
    }

    if indexable:
        if "index" not in robots or "follow" not in robots:
            FAIL.append(f"{route}: indexable route must explicitly declare index,follow")
        expected = expected_canonical(route)
        if canonical != expected:
            FAIL.append(f"{route}: canonical must be exactly {expected}; found {canonical or 'missing'}")
        description = parser.meta_value("description")
        if len(description) < 40:
            FAIL.append(f"{route}: meta description is missing or under 40 characters")
        for key in REQUIRED_SOCIAL_META:
            if not parser.meta_value(key):
                FAIL.append(f"{route}: missing {key}")
        og_url = parser.meta_value("og:url")
        if og_url and og_url != canonical:
            FAIL.append(f"{route}: og:url must match canonical")
        if len(audit.internal_targets) < 2:
            FAIL.append(f"{route}: fewer than two crawlable internal links")
    elif not noindex:
        FAIL.append(f"{route}: public HTML route is neither explicit noindex nor Production-canonical indexable")

    parse_jsonld(audit)
    return audit


def sitemap_urls() -> list[str]:
    try:
        root = ET.parse(SITEMAP_PATH).getroot()
    except Exception as error:
        FAIL.append(f"sitemap.xml is invalid XML: {error}")
        return []
    namespace = {"sm": "http://www.sitemaps.org/schemas/sitemap/0.9"}
    values = [clean(node.text) for node in root.findall("sm:url/sm:loc", namespace) if clean(node.text)]
    if len(values) != len(set(values)):
        FAIL.append("sitemap.xml contains duplicate <loc> entries")
    for value in values:
        parts = urlsplit(value)
        if parts.scheme != "https" or parts.netloc != "devilndove.com" or parts.query or parts.fragment:
            FAIL.append(f"sitemap.xml contains non-canonical URL: {value}")
    return values


def main() -> None:
    paths = public_html_paths()
    audits = [audit_route(path) for path in paths]
    indexable = {audit.route for audit in audits if audit.indexable}
    noindex = {audit.route for audit in audits if audit.noindex}

    sitemap = sitemap_urls()
    sitemap_routes = {
        urlsplit(value).path or "/"
        for value in sitemap
        if value.startswith(PRODUCTION_ORIGIN)
    }
    expected_sitemap = indexable - DYNAMIC_TEMPLATE_ROUTES

    missing = sorted(expected_sitemap - sitemap_routes)
    extra = sorted(sitemap_routes - expected_sitemap)
    if missing:
        FAIL.append("sitemap.xml missing indexable routes: " + ", ".join(missing))
    if extra:
        FAIL.append("sitemap.xml includes non-indexable/unknown routes: " + ", ".join(extra))
    leaked_noindex = sorted(sitemap_routes & noindex)
    if leaked_noindex:
        FAIL.append("sitemap.xml includes noindex routes: " + ", ".join(leaked_noindex))

    robots = ROBOTS_PATH.read_text(encoding="utf-8", errors="replace") if ROBOTS_PATH.exists() else ""
    if "User-agent: *" not in robots:
        FAIL.append("robots.txt missing wildcard user-agent authority")
    if "Sitemap: https://devilndove.com/sitemap.xml" not in robots:
        FAIL.append("robots.txt missing canonical sitemap declaration")
    if re.search(r"Disallow:\s*/(?:shop|collections|collages|creations)(?:/|\s|$)", robots, re.I):
        FAIL.append("robots.txt blocks a principal public discovery route")

    inbound: dict[str, set[str]] = defaultdict(set)
    internal_edges = 0
    for audit in audits:
        if not audit.indexable:
            continue
        for target in audit.internal_targets:
            normalized = target if target.endswith("/") or "." in Path(target).name else target + "/"
            if normalized in indexable:
                inbound[normalized].add(audit.route)
                internal_edges += 1
    orphaned = sorted(
        route for route in expected_sitemap
        if route != "/" and not (inbound.get(route, set()) - {route})
    )
    if orphaned:
        FAIL.append("indexable sitemap routes without an inbound link from another indexable page: " + ", ".join(orphaned))

    if len(paths) < 20:
        FAIL.append(f"public HTML crawl scope unexpectedly small: {len(paths)} documents")
    if len(indexable) < 20:
        FAIL.append(f"indexable public route scope unexpectedly small: {len(indexable)} routes")

    print("RELEASE 467 BUILD 76 SEO TECHNICAL CRAWL")
    print(f"public_html_documents={len(paths)}")
    print(f"indexable_routes={len(indexable)}")
    print(f"noindex_routes={len(noindex)}")
    print(f"sitemap_routes={len(sitemap_routes)}")
    print(f"internal_indexable_edges={internal_edges}")
    print("one_h1=ENFORCED")
    print("canonical_production_origin=ENFORCED")
    print("robots_index_noindex=ENFORCED")
    print("sitemap_parity=ENFORCED")
    print("metadata_open_graph_twitter=ENFORCED")
    print("jsonld_schema_context=ENFORCED")
    print("internal_link_coverage=ENFORCED")
    print("dynamic_product_template_sitemap_exception=EXPLICIT")

    if FAIL:
        print("RELEASE 467 BUILD 76 SEO TECHNICAL CRAWL: FAIL")
        for index, item in enumerate(FAIL, 1):
            print(f"{index:03d}. FAIL — {item}")
        raise SystemExit(1)
    print("RELEASE 467 BUILD 76 SEO TECHNICAL CRAWL: PASS")


if __name__ == "__main__":
    main()
