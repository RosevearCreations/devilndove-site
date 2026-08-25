#!/usr/bin/env python3
"""Resilient launcher for Build 418 live read-only semantic classification.

This launcher skips the non-essential `wrangler whoami` preflight, because that
command can hang on Windows even when authenticated D1 commands work normally.
The first live D1 SELECT becomes the authentication check instead.

It also places a 120-second fail-closed timeout around subprocess calls. This does
not change Build 418 SQL, target database UUIDs, or read-only guards.
"""
from __future__ import annotations

import os
import subprocess
import sys

import build418_live_semantic_schema_classification as base


for stream in (sys.stdout, sys.stderr):
    if hasattr(stream, 'reconfigure'):
        try:
            stream.reconfigure(errors='replace')
        except Exception:
            pass


def resilient_run_capture(args: list[str]) -> subprocess.CompletedProcess[str]:
    normalized = [str(value).lower() for value in args]
    if len(normalized) >= 3 and 'wrangler' in normalized and 'whoami' in normalized:
        return subprocess.CompletedProcess(
            args=args,
            returncode=0,
            stdout=(
                'WRANGLER IDENTITY PREFLIGHT: SKIPPED\n'
                'Reason: `wrangler whoami` can block on Windows; the first read-only D1 SELECT is the live authentication check.\n'
            ),
        )

    try:
        return subprocess.run(
            args,
            cwd=base.ROOT,
            text=True,
            encoding='utf-8',
            errors='replace',
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
            env={
                **os.environ,
                'NO_COLOR': '1',
                'FORCE_COLOR': '0',
                'PYTHONIOENCODING': 'utf-8',
            },
            timeout=120,
            check=False,
        )
    except subprocess.TimeoutExpired as exc:
        output = exc.stdout or ''
        if isinstance(output, bytes):
            output = output.decode('utf-8', errors='replace')
        command_text = ' '.join(str(value) for value in args[:4])
        return subprocess.CompletedProcess(
            args=args,
            returncode=124,
            stdout=(
                f'{output}\nBUILD 418 SUBPROCESS TIMEOUT after 120 seconds: {command_text}\n'
                'No mutation SQL exists in this Build 418 path.\n'
            ),
        )


base.run_capture = resilient_run_capture


if __name__ == '__main__':
    raise SystemExit(base.main())
