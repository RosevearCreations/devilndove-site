import argparse
import concurrent.futures
import json
import pathlib
import time
import urllib.error
import urllib.request

import movie_r2_live_restore as base

TRANSIENT_HTTP = {
    429,
    500, 502, 503, 504,
    520, 521, 522, 523, 524, 525, 526, 527, 530,
}
MAX_ATTEMPTS = 10
BATCH_SIZE = 2


def log(*args):
    print(*args, flush=True)


def deterministic_guard(url, token, rows):
    """Prove token/key/body locks without depending on whether a key already exists."""
    for _ in range(40):
        status, _ = base.post_bridge(
            url, "wrong-token", "movies/not-authorized.jpg", b"blocked", timeout=30
        )
        if status == 403:
            break
        time.sleep(3)
    else:
        raise RuntimeError("Recovery bridge did not become ready")

    status, _ = base.post_bridge(
        url, token, "movies/not-authorized.jpg", b"blocked", timeout=30
    )
    assert status == 403, status

    key = rows[0]["key"]
    req = urllib.request.Request(
        url,
        data=b"deliberately-wrong-body",
        method="POST",
        headers={
            "Content-Type": "image/jpeg",
            "Cache-Control": "no-store",
            "x-movie-recovery-token": token,
            "x-recovery-key": key,
            "x-recovery-probe": "hash-lock",
            "User-Agent": "dnd-movie-r2-recovery/3.1",
        },
    )
    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            status = int(resp.status)
            payload = json.loads(resp.read().decode("utf-8"))
    except urllib.error.HTTPError as exc:
        status = int(exc.code)
        raw = exc.read().decode("utf-8", "replace")
        try:
            payload = json.loads(raw)
        except Exception:
            payload = {"raw": raw[:1000]}

    assert status == 422, (status, payload)
    assert payload.get("probe") is True, payload
    assert payload.get("error") == "body hash not authorized", payload
    log("HASH_LOCK_GUARD=PASS write_free_probe=true")


def resilient_restore(rows, url, token):
    """Restore in tiny recorded batches so transient Cloudflare failures are resumable."""

    def one(row):
        body = pathlib.Path(row["local_file"]).read_bytes()
        history = []
        for attempt in range(MAX_ATTEMPTS):
            try:
                status, payload = base.post_bridge(url, token, row["key"], body)
            except Exception as exc:
                history.append({"attempt": attempt + 1, "http_status": 0, "error": repr(exc)})
                if attempt < MAX_ATTEMPTS - 1:
                    wait = min(30, 1.5 * (2 ** min(attempt, 5)))
                    time.sleep(wait)
                    continue
                return {
                    "key": row["key"],
                    "http_status": 0,
                    "error": repr(exc),
                    "attempts": attempt + 1,
                    "retry_history": history,
                }

            if status in TRANSIENT_HTTP:
                history.append({
                    "attempt": attempt + 1,
                    "http_status": status,
                    "error": payload.get("error") or payload.get("raw") or "transient response",
                })
                if attempt < MAX_ATTEMPTS - 1:
                    wait = min(30, 1.5 * (2 ** min(attempt, 5)))
                    time.sleep(wait)
                    continue

            return {
                "key": row["key"],
                "http_status": status,
                **payload,
                "attempts": attempt + 1,
                "retry_history": history,
            }

    results = []
    proof = base.PROOF

    for start in range(0, len(rows), BATCH_SIZE):
        batch = rows[start:start + BATCH_SIZE]
        with concurrent.futures.ThreadPoolExecutor(max_workers=BATCH_SIZE) as pool:
            batch_results = list(pool.map(one, batch))

        results.extend(batch_results)
        (proof / "write-results.partial.json").write_text(
            json.dumps(results, indent=2), encoding="utf-8"
        )

        failures = [
            result for result in batch_results
            if result.get("http_status") != 200
            or not result.get("ok")
            or result.get("state") not in ("restored", "already_exact")
        ]
        if failures:
            (proof / "write-results.json").write_text(
                json.dumps(results, indent=2), encoding="utf-8"
            )
            raise RuntimeError(
                f"Recovery failed closed after {len(results)} recorded objects; "
                + json.dumps(failures[0])[:1400]
            )

        processed = len(results)
        if processed % 100 == 0 or processed == len(rows):
            log(
                "processed", processed, "/", len(rows),
                "restored=", sum(x.get("state") == "restored" for x in results),
                "already_exact=", sum(x.get("state") == "already_exact" for x in results),
                "retried=", sum(bool(x.get("retry_history")) for x in results),
            )

    assert len(results) == len(rows) == 2608
    results.sort(key=lambda row: row["key"])
    (proof / "write-results.json").write_text(
        json.dumps(results, indent=2), encoding="utf-8"
    )
    summary = {
        "total": len(results),
        "restored": sum(x.get("state") == "restored" for x in results),
        "already_exact": sum(x.get("state") == "already_exact" for x in results),
        "retried_objects": sum(bool(x.get("retry_history")) for x in results),
        "conflicts": sum(x.get("state") == "conflict" for x in results),
        "quarantined_invalid": 8,
        "d1_mutation": False,
        "r2_delete": False,
        "overwrite_allowed": False,
        "batch_size": BATCH_SIZE,
        "max_attempts_per_object": MAX_ATTEMPTS,
        "transient_http_codes": sorted(TRANSIENT_HTTP),
        "hash_guard": "write_free_probe",
    }
    (proof / "restore-summary.json").write_text(
        json.dumps(summary, indent=2), encoding="utf-8"
    )
    log(json.dumps(summary, indent=2))


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--base-url", required=True)
    args = parser.parse_args()
    base.prove_guard = deterministic_guard
    base.restore = resilient_restore
    base.upload(args.base_url)


if __name__ == "__main__":
    main()
