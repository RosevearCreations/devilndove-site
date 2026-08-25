#!/usr/bin/env python3
"""Build 420 index-semantic normalization helpers.

Used by parity evidence tooling to avoid treating formatting-only CREATE INDEX
text differences as structural drift. This module performs no I/O and never
contacts Cloudflare.
"""
from __future__ import annotations

import re


def normalize_index_sql(sql: str) -> str:
    """Return a conservative semantic form for an explicit CREATE INDEX.

    Normalizes only syntax that is semantically irrelevant for our parity use:
    - case and repeated whitespace;
    - identifier quote styles already accepted by SQLite;
    - generated/legacy explicit index names;
    - spaces around parentheses and commas;
    - explicit ASC because ASC is SQLite's default ordering.

    UNIQUE, DESC, indexed-expression text, column order and predicates are kept.
    """
    value = re.sub(r'\s+', ' ', str(sql or '').strip()).lower()
    value = value.replace('`', '').replace('"', '').replace('[', '').replace(']', '')
    value = re.sub(
        r'^create\s+(unique\s+)?index\s+(?:if\s+not\s+exists\s+)?[^ ]+\s+on\s+',
        lambda match: 'create unique index on ' if match.group(1) else 'create index on ',
        value,
    )
    value = re.sub(r'\s*\(\s*', '(', value)
    value = re.sub(r'\s*\)\s*', ')', value)
    value = re.sub(r'\s*,\s*', ',', value)
    value = re.sub(r'\s+asc(?=,|\))', '', value)
    value = re.sub(r'\s+', ' ', value).strip()
    return value


def index_signature(rows: list[str]) -> list[str]:
    return sorted(
        normalize_index_sql(row)
        for row in rows
        if str(row or '').strip()
    )
