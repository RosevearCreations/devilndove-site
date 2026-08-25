#!/usr/bin/env python3
"""Windows-resilient launcher for Build 418 live read-only semantic classification.

This launcher skips the non-essential `wrangler whoami` preflight, because that
command can hang on Windows even when authenticated D1 commands work normally.
The first live D1 SELECT becomes the authentication check instead.

It also starts each subprocess in its own process group and, on Windows, kills
the complete child process tree if a timeout is reached. This avoids a timed-out
`npx.cmd` parent leaving its Node/Wrangler child alive with the output pipe open.

This launcher does not change Build 418 SQL, target database UUIDs, or read-only
guards.
"""
from __future__ import annotations

import os
import subprocess
import sys
import time

import build418_live_semantic_schema_classification as base


for stream in (sys.stdout, sys.stderr):
    if hasattr(stream, 'reconfigure'):
        try:
            stream.reconfigure(errors='replace')
        except Exception:
            pass


QUERY_TIMEOUT_SECONDS = 90
KILL_WAIT_SECONDS = 15


def _is_wrangler_whoami(args: list[str]) -> bool:
    normalized = [str(value).lower() for value in args]
    return 'wrangler' in normalized and 'whoami' in normalized


def _terminate_process_tree(proc: subprocess.Popen[str]) -> None:
    if proc.poll() is not None:
        return

    if os.name == 'nt':
        subprocess.run(
            ['taskkill', '/PID', str(proc.pid), '/T', '/F'],
            cwd=base.ROOT,
            text=True,
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
            check=False,
        )
    else:
        try:
            proc.kill()
        except ProcessLookupError:
            pass


def resilient_run_capture(args: list[str]) -> subprocess.CompletedProcess[str]:
    if _is_wrangler_whoami(args):
        return subprocess.CompletedProcess(
            args=args,
            returncode=0,
            stdout=(
                'WRANGLER IDENTITY PREFLIGHT: SKIPPED\n'
                'Reason: `wrangler whoami` can block on Windows; the first read-only D1 SELECT is the live authentication check.\n'
            ),
        )

    creationflags = 0
    if os.name == 'nt' and hasattr(subprocess, 'CREATE_NEW_PROCESS_GROUP'):
        creationflags = subprocess.CREATE_NEW_PROCESS_GROUP

    proc = subprocess.Popen(
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
        creationflags=creationflags,
    )

    try:
        stdout, _ = proc.communicate(timeout=QUERY_TIMEOUT_SECONDS)
        return subprocess.CompletedProcess(args=args, returncode=proc.returncode, stdout=stdout or '')
    except subprocess.TimeoutExpired as exc:
        partial = exc.stdout or ''
        if isinstance(partial, bytes):
            partial = partial.decode('utf-8', errors='replace')

        _terminate_process_tree(proc)
        try:
            remainder, _ = proc.communicate(timeout=KILL_WAIT_SECONDS)
        except subprocess.TimeoutExpired:
            remainder = ''

        command_text = ' '.join(str(value) for value in args[:5])
        return subprocess.CompletedProcess(
            args=args,
            returncode=124,
            stdout=(
                f'{partial}{remainder or ""}\n'
                f'BUILD 418 SUBPROCESS TIMEOUT after {QUERY_TIMEOUT_SECONDS} seconds: {command_text}\n'
                'The complete child process tree was terminated.\n'
                'No mutation SQL exists in this Build 418 path.\n'
            ),
        )


_original_query_rows = base.query_rows


def visible_query_rows(npx: str, config, sql: str, label: str):
    print(f'BUILD 418 QUERY START: {label}', flush=True)
    started = time.monotonic()
    try:
        rows = _original_query_rows(npx, config, sql, label)
    except BaseException:
        elapsed = time.monotonic() - started
        print(f'BUILD 418 QUERY FAILED: {label} ({elapsed:.1f}s)', flush=True)
        raise
    elapsed = time.monotonic() - started
    print(f'BUILD 418 QUERY PASS: {label} ({elapsed:.1f}s)', flush=True)
    return rows


base.run_capture = resilient_run_capture
base.query_rows = visible_query_rows


if __name__ == '__main__':
    raise SystemExit(base.main())
