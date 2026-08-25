#!/usr/bin/env python3
"""Windows-safe launcher for Build 417 live read-only D1 mapping.

Wrangler can emit Unicode status glyphs that are not representable by the
Windows CP-1252 console encoding. Configure replacement-safe stdout/stderr
before importing and running the canonical Build 417 mapper.

This launcher does not alter Build 417 SQL, D1 targets, or read-only guards.
"""
from __future__ import annotations

import sys


for stream in (sys.stdout, sys.stderr):
    if hasattr(stream, 'reconfigure'):
        try:
            stream.reconfigure(errors='replace')
        except Exception:
            pass

from build417_live_readonly_schema_data_mapping import main


if __name__ == '__main__':
    raise SystemExit(main())
