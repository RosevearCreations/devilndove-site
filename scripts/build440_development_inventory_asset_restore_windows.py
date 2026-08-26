#!/usr/bin/env python3
"""Build 440 Windows-safe launcher for the guarded Development Tool/Supply R2 restore.

Why this exists:
Wrangler/Node can abort on Windows when launched from Python with stdout/stderr backed
by anonymous pipes (UV_HANDLE_CLOSING). The core Build 440 restore intentionally uses a
small Wrangler helper. This launcher replaces only that helper so Wrangler writes to
ordinary temporary files instead of Python pipes.

Safety authority remains in build440_development_inventory_asset_restore.py:
- Development branch/D1/R2 hard pins
- exact 498 current-D1 restore scope
- public source size/SHA verification before writes
- no existing Dev object overwrite
- post-write size/SHA verification
- no Production R2 mutation
- no D1 mutation

On Windows the R2 apply phase is additionally serialized to one Wrangler process at a
time. Public source downloads still use the requested bounded worker count.
"""
from __future__ import annotations

import os
from pathlib import Path
import subprocess
import sys
import tempfile
import uuid

import build440_development_inventory_asset_restore as core


def windows_file_redirect_wrangler(
    args: list[str], *, timeout: int = 180
) -> subprocess.CompletedProcess[str]:
    """Run Wrangler without stdout/stderr PIPE handles on Windows."""
    cmd = [
        core.npx_executable(),
        "--yes",
        f"wrangler@{core.WRANGLER_VERSION}",
        *args,
    ]

    io_root = Path(tempfile.gettempdir()) / "devilndove-build440-r2-restore" / "wrangler-stdio"
    io_root.mkdir(parents=True, exist_ok=True)
    token = uuid.uuid4().hex
    stdout_path = io_root / f"{token}.stdout.txt"
    stderr_path = io_root / f"{token}.stderr.txt"

    env = {
        **os.environ,
        "NO_COLOR": "1",
        "FORCE_COLOR": "0",
        "WRANGLER_SEND_METRICS": "false",
    }

    try:
        with stdout_path.open("wb") as stdout_handle, stderr_path.open("wb") as stderr_handle:
            completed = subprocess.run(
                cmd,
                cwd=core.ROOT,
                stdout=stdout_handle,
                stderr=stderr_handle,
                check=False,
                timeout=timeout,
                env=env,
            )

        stdout = stdout_path.read_text(encoding="utf-8", errors="replace") if stdout_path.exists() else ""
        stderr = stderr_path.read_text(encoding="utf-8", errors="replace") if stderr_path.exists() else ""
        return subprocess.CompletedProcess(
            args=cmd,
            returncode=completed.returncode,
            stdout=stdout,
            stderr=stderr,
        )
    finally:
        stdout_path.unlink(missing_ok=True)
        stderr_path.unlink(missing_ok=True)


def windows_serial_apply(assets, workers: int) -> None:
    """Avoid multiple concurrent Wrangler/Node processes during Windows R2 mutation."""
    if workers != 1:
        core.log(
            f"Windows Wrangler safety: R2 apply concurrency reduced from {workers} to 1; "
            "public source verification remains bounded/parallel."
        )
    return ORIGINAL_APPLY_RESTORE(assets, workers=1)


ORIGINAL_APPLY_RESTORE = core.apply_restore


def main() -> int:
    if os.name != "nt":
        core.log(
            "Windows compatibility launcher used on a non-Windows host; "
            "file-redirection mode is still safe."
        )

    core.wrangler = windows_file_redirect_wrangler
    core.apply_restore = windows_serial_apply
    return core.main()


if __name__ == "__main__":
    raise SystemExit(main())
