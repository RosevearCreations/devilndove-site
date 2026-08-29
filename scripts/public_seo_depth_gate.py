#!/usr/bin/env python3
"""Protect SEO depth on the primary public Storefront discovery pages.

This complements public_seo_gate.py. It deliberately focuses on high-value static
commerce/discovery pages where canonical, description, social preview and JSON-LD
signals are expected to be stable source authority.
"""
from __future__ import annotations

import json
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urlsplit

ROOT = Path(__file__).resolve().parents[1]
PAGES = {
    'index.html': ('https://devilndove.com/', {'Organization', 'LocalBusiness', 'WebSite'}),
    'shop/index.html': ('https://devilndove.com/shop/', {'CollectionPage'}),
    'collections/index.html': ('https://devilndove.com/collections/', {'CollectionPage'}),
    'collages/index.html': ('https://devilndove.com/collages/', {'CollectionPage'}),
}


class Document(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.title_parts = []
        self.in_title = False
        self.h1_count = 0
        self.meta = []
        self.links = []
        self.scripts = []
        self.current_script = None

    def handle_starttag(self, tag, attrs):
        values = {str(k).lower(): str(v or '') for k, v in attrs}
        tag = tag.lower()
        if tag == 'title':
            self.in_title = True
        elif tag == 'h1':
            self.h1_count += 1
        elif tag == 'meta':
            self.meta.append(values)
        elif tag == 'link':
            self.links.append(values)
        elif tag == 'script' and values.get('type', '').lower() == 'application/ld+json':
            self.current_script = []

    def handle_endtag(self, tag):
        tag = tag.lower()
        if tag == 'title':
            self.in_title = False
        elif tag == 'script' and self.current_script is not None:
            self.scripts.append(''.join(self.current_script).strip())
            self.current_script = None

    def handle_data(self, data):
        if self.in_title:
            self.title_parts.append(data)
        if self.current_script is not None:
            self.current_script.append(data)

    @property
    def title(self):
        return ' '.join(''.join(self.title_parts).split())


def meta_values(doc, *, name=None, prop=None):
    key = 'name' if name is not None else 'property'
    target = (name if name is not None else prop).lower()
    return [row.get('content', '').strip() for row in doc.meta if row.get(key, '').lower() == target]


def canonical_values(doc):
    return [row.get('href', '').strip() for row in doc.links if 'canonical' in row.get('rel', '').lower().split()]


def walk_json(value):
    if isinstance(value, dict):
        yield value
        for child in value.values():
            yield from walk_json(child)
    elif isinstance(value, list):
        for child in value:
            yield from walk_json(child)


def jsonld_evidence(doc):
    docs = []
    errors = []
    for raw in doc.scripts:
        if not raw:
            continue
        try:
            docs.append(json.loads(raw))
        except Exception as error:
            errors.append(str(error))
    rows = [row for payload in docs for row in walk_json(payload)]
    types = set()
    urls = set()
    for row in rows:
        raw_type = row.get('@type')
        if isinstance(raw_type, list):
            types.update(str(value) for value in raw_type)
        elif raw_type:
            types.add(str(raw_type))
        if row.get('url'):
            urls.add(str(row.get('url')))
    return docs, errors, types, urls


def main():
    failures = []
    for rel, (expected_url, expected_types) in PAGES.items():
        path = ROOT / rel
        if not path.exists():
            failures.append(f'{rel}: public SEO authority file missing')
            continue
        doc = Document()
        doc.feed(path.read_text(encoding='utf-8', errors='replace'))

        if doc.h1_count != 1:
            failures.append(f'{rel}: expected exactly one source H1, found {doc.h1_count}')
        if not doc.title or len(doc.title) < 20:
            failures.append(f'{rel}: title is missing or too shallow')

        descriptions = meta_values(doc, name='description')
        if len(descriptions) != 1:
            failures.append(f'{rel}: expected one meta description, found {len(descriptions)}')
        elif not 70 <= len(descriptions[0]) <= 220:
            failures.append(f'{rel}: meta description length {len(descriptions[0])} is outside 70–220 characters')

        robots = ','.join(meta_values(doc, name='robots')).lower().replace(' ', '')
        if 'noindex' in robots or 'index' not in robots or 'follow' not in robots:
            failures.append(f'{rel}: public robots authority must remain index,follow')

        canonicals = canonical_values(doc)
        if canonicals != [expected_url]:
            failures.append(f'{rel}: canonical must be exactly {expected_url!r}; found {canonicals!r}')
        else:
            parts = urlsplit(canonicals[0])
            if parts.scheme != 'https' or parts.netloc != 'devilndove.com' or parts.query or parts.fragment:
                failures.append(f'{rel}: canonical must be clean HTTPS devilndove.com without query/fragment')

        required_og = ('og:site_name', 'og:type', 'og:title', 'og:description', 'og:url', 'og:image')
        for key in required_og:
            values = meta_values(doc, prop=key)
            if len(values) != 1 or not values[0]:
                failures.append(f'{rel}: missing/duplicate {key}')
        og_url = meta_values(doc, prop='og:url')
        if og_url and og_url[0] != expected_url:
            failures.append(f'{rel}: og:url must match canonical URL')
        if not meta_values(doc, name='twitter:card'):
            failures.append(f'{rel}: twitter:card is missing')

        structured, json_errors, types, urls = jsonld_evidence(doc)
        if json_errors:
            failures.append(f'{rel}: invalid JSON-LD: {json_errors[0]}')
        if not structured:
            failures.append(f'{rel}: JSON-LD structured data is missing')
        if expected_url not in urls:
            failures.append(f'{rel}: JSON-LD does not declare canonical page URL {expected_url}')
        if not (types & expected_types):
            failures.append(f'{rel}: JSON-LD expected one of {sorted(expected_types)}, found {sorted(types)}')

    print('PUBLIC SEO DEPTH GATE')
    print('Primary pages: Home / Shop / Collections / Collages')
    print('Signals: one H1 + title + description + index/follow + clean canonical + Open Graph + Twitter card + JSON-LD')
    if failures:
        for index, failure in enumerate(failures, 1):
            print(f'{index:03d}. FAIL — {failure}')
        raise SystemExit(1)
    print('PUBLIC SEO DEPTH GATE: PASS')


if __name__ == '__main__':
    main()
