#!/usr/bin/env python3
"""Release 466 read-only Production SEO crawler.

The crawler measures live Production without mutating it. By default SEO defects are
reported as evidence rather than failing the process; --fail-on-seo-errors can be used
later as a Production promotion gate.
"""
from __future__ import annotations

import argparse
import json
import re
import time
import urllib.error
import urllib.request
import xml.etree.ElementTree as ET
from collections import Counter, deque
from dataclasses import asdict, dataclass
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urljoin, urlparse, urlunparse

USER_AGENT = "DevilDove-Release466-SEO-Crawler/1.0"
UTILITY_PATHS = {
    "/cart/", "/checkout/", "/checkout/confirmation/", "/privacy/", "/terms/",
    "/data-deletion/", "/social-connections/",
}
SKIP_SUFFIXES = ('.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.ico', '.pdf', '.zip', '.mp4', '.webm', '.css', '.js', '.xml', '.txt')


class HtmlSignals(HTMLParser):
    def __init__(self) -> None:
        super().__init__(convert_charrefs=True)
        self.title_parts: list[str] = []
        self.in_title = False
        self.h1 = 0
        self.meta: list[dict[str, str]] = []
        self.links: list[dict[str, str]] = []
        self.jsonld_raw: list[str] = []
        self._jsonld: list[str] | None = None

    def handle_starttag(self, tag, attrs):
        values = {str(k).lower(): str(v or '') for k, v in attrs}
        tag = tag.lower()
        if tag == 'title': self.in_title = True
        elif tag == 'h1': self.h1 += 1
        elif tag == 'meta': self.meta.append(values)
        elif tag == 'link': self.links.append(values)
        elif tag == 'a': self.links.append(values)
        elif tag == 'script' and values.get('type', '').lower() == 'application/ld+json': self._jsonld = []

    def handle_endtag(self, tag):
        if tag.lower() == 'title': self.in_title = False
        elif tag.lower() == 'script' and self._jsonld is not None:
            self.jsonld_raw.append(''.join(self._jsonld).strip())
            self._jsonld = None

    def handle_data(self, data):
        if self.in_title: self.title_parts.append(data)
        if self._jsonld is not None: self._jsonld.append(data)

    @property
    def title(self) -> str:
        return ' '.join(''.join(self.title_parts).split())

    def metas(self, key: str, value: str) -> list[str]:
        return [row.get('content', '').strip() for row in self.meta if row.get(key, '').lower() == value.lower()]

    def canonicals(self) -> list[str]:
        return [row.get('href', '').strip() for row in self.links if 'canonical' in row.get('rel', '').lower().split()]

    def anchors(self) -> list[str]:
        return [row.get('href', '').strip() for row in self.links if row.get('href') and 'canonical' not in row.get('rel', '').lower().split()]


@dataclass
class PageResult:
    url: str
    path: str
    status: int
    elapsed_ms: int
    bytes: int
    content_type: str
    final_url: str
    title: str
    h1_count: int
    canonical: str
    meta_description_length: int
    robots: str
    jsonld_blocks: int
    indexable_candidate: bool


def clean_url(url: str) -> str:
    parsed = urlparse(url)
    path = parsed.path or '/'
    if not path.endswith('/') and not Path(path).suffix: path += '/'
    return urlunparse((parsed.scheme.lower(), parsed.netloc.lower(), path, '', '', ''))


def fetch(url: str, attempts: int = 2) -> tuple[int, bytes, str, str, int]:
    last: Exception | None = None
    for attempt in range(attempts):
        started = time.perf_counter()
        try:
            request = urllib.request.Request(url, headers={'User-Agent': USER_AGENT, 'Accept': 'text/html,application/xhtml+xml,*/*;q=0.5'}, method='GET')
            with urllib.request.urlopen(request, timeout=25) as response:
                body = response.read(3_000_000)
                return int(response.status), body, response.headers.get('content-type', ''), response.geturl(), round((time.perf_counter() - started) * 1000)
        except urllib.error.HTTPError as exc:
            return int(exc.code), exc.read(512_000), exc.headers.get('content-type', ''), exc.geturl(), round((time.perf_counter() - started) * 1000)
        except Exception as exc:
            last = exc
            if attempt + 1 < attempts: time.sleep(1.5)
    raise RuntimeError(str(last))


def issue(issues: list[dict], severity: str, code: str, url: str, detail: str) -> None:
    issues.append({'severity': severity, 'code': code, 'url': url, 'detail': detail[:800]})


def sitemap_urls(base: str, issues: list[dict]) -> list[str]:
    sitemap = urljoin(base, '/sitemap.xml')
    try:
        status, body, _, final, _ = fetch(sitemap)
        if status != 200:
            issue(issues, 'error', 'sitemap_http', sitemap, f'status={status} final={final}')
            return [base]
        root = ET.fromstring(body.decode('utf-8', errors='replace'))
        urls = [node.text.strip() for node in root.findall('.//{*}loc') if node.text and node.text.strip()]
        return list(dict.fromkeys(urls)) or [base]
    except Exception as exc:
        issue(issues, 'error', 'sitemap_parse', sitemap, str(exc))
        return [base]


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument('--base-url', default='https://devilndove.com/')
    parser.add_argument('--output', default='')
    parser.add_argument('--max-pages', type=int, default=180)
    parser.add_argument('--fail-on-seo-errors', action='store_true')
    args = parser.parse_args()

    base = clean_url(args.base_url)
    origin = f"{urlparse(base).scheme}://{urlparse(base).netloc}"
    host = (urlparse(base).hostname or '').lower()
    issues: list[dict] = []
    seeds = sitemap_urls(base, issues)
    queue = deque(clean_url(url) for url in seeds)
    queued = set(queue)
    sitemap_set = set(queue)
    results: list[PageResult] = []
    titles: dict[str, list[str]] = {}
    canonicals: dict[str, list[str]] = {}

    while queue and len(results) < max(1, args.max_pages):
        url = queue.popleft()
        parsed = urlparse(url)
        if (parsed.hostname or '').lower() != host: continue
        if parsed.path.lower().endswith(SKIP_SUFFIXES): continue
        try:
            status, body, content_type, final_url, elapsed_ms = fetch(url)
        except Exception as exc:
            issue(issues, 'error', 'request_failed', url, str(exc))
            continue
        if not (200 <= status < 400):
            issue(issues, 'error', 'http_status', url, f'status={status}')
            continue
        if (urlparse(final_url).hostname or '').lower() != host:
            issue(issues, 'error', 'external_redirect', url, final_url)
            continue
        if 'text/html' not in content_type.lower() and not body.lstrip().lower().startswith(b'<!doctype html'):
            issue(issues, 'warning', 'non_html_page', url, content_type)
            continue

        html = body.decode('utf-8', errors='replace')
        doc = HtmlSignals(); doc.feed(html)
        path = urlparse(clean_url(final_url)).path or '/'
        robots = ','.join(doc.metas('name', 'robots')).lower().replace(' ', '')
        description = doc.metas('name', 'description')
        canonical_values = doc.canonicals()
        canonical = canonical_values[0] if len(canonical_values) == 1 else ''
        utility = path in UTILITY_PATHS
        indexable = 'noindex' not in robots and not utility

        if doc.h1 != 1: issue(issues, 'error', 'h1_count', url, f'expected=1 actual={doc.h1}')
        if not doc.title or len(doc.title) < 15: issue(issues, 'error', 'title_missing_or_shallow', url, f'length={len(doc.title)}')
        if len(description) != 1: issue(issues, 'error', 'meta_description_count', url, f'count={len(description)}')
        elif indexable and not 70 <= len(description[0]) <= 220: issue(issues, 'warning', 'meta_description_length', url, f'length={len(description[0])}')
        if len(canonical_values) != 1: issue(issues, 'error', 'canonical_count', url, f'count={len(canonical_values)}')
        elif canonical:
            cp = urlparse(canonical)
            if cp.scheme != 'https' or (cp.hostname or '').lower() != host or cp.query or cp.fragment:
                issue(issues, 'error', 'canonical_invalid', url, canonical)
        if utility and url in sitemap_set:
            issue(issues, 'warning', 'utility_in_sitemap', url, 'Utility/legal/transaction page is present in sitemap; review indexing intent.')
        if indexable and 'index' not in robots:
            issue(issues, 'warning', 'robots_index_implicit', url, robots or 'robots meta absent')

        valid_jsonld = 0
        for raw in doc.jsonld_raw:
            if not raw: continue
            try: json.loads(raw); valid_jsonld += 1
            except Exception as exc: issue(issues, 'error', 'jsonld_invalid', url, str(exc))
        if indexable and valid_jsonld == 0: issue(issues, 'warning', 'jsonld_missing', url, 'No valid JSON-LD block found.')

        result = PageResult(url, path, status, elapsed_ms, len(body), content_type, final_url, doc.title, doc.h1, canonical, len(description[0]) if len(description) == 1 else 0, robots, valid_jsonld, indexable)
        results.append(result)
        if doc.title: titles.setdefault(doc.title.lower(), []).append(url)
        if canonical: canonicals.setdefault(canonical.lower(), []).append(url)

        for href in doc.anchors():
            if not href or href.startswith(('#', 'mailto:', 'tel:', 'javascript:', 'data:')): continue
            try: candidate = clean_url(urljoin(final_url, href))
            except Exception: continue
            cp = urlparse(candidate)
            if (cp.hostname or '').lower() != host or cp.path.lower().endswith(SKIP_SUFFIXES): continue
            if candidate not in queued and len(queued) < args.max_pages * 3:
                queued.add(candidate); queue.append(candidate)

    for title, urls in titles.items():
        if len(urls) > 1: issue(issues, 'warning', 'duplicate_title', urls[0], f'{len(urls)} pages: {urls[:6]}')
    for canonical, urls in canonicals.items():
        unique = sorted(set(urls))
        if len(unique) > 1: issue(issues, 'error', 'duplicate_canonical', unique[0], f'{len(unique)} pages declare {canonical}: {unique[:6]}')

    counts = Counter(row['severity'] for row in issues)
    report = {
        'release': 466,
        'build': 2,
        'crawler': 'production_seo',
        'base_url': base,
        'read_only': True,
        'pages_crawled': len(results),
        'sitemap_urls': len(sitemap_set),
        'discovered_urls': len(queued),
        'issue_counts': {key: int(counts.get(key, 0)) for key in ('error', 'warning', 'info')},
        'issues': issues,
        'pages': [asdict(row) for row in results],
        'production_mutations': 0,
    }
    print(json.dumps(report, indent=2, sort_keys=True))
    if args.output:
        output = Path(args.output); output.parent.mkdir(parents=True, exist_ok=True)
        output.write_text(json.dumps(report, indent=2, sort_keys=True) + '\n', encoding='utf-8')
    if not results:
        return 2
    if args.fail_on_seo_errors and counts.get('error', 0):
        return 1
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
