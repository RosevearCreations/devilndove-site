#!/usr/bin/env python3
"""Build 429 deterministic release diagnostic checks, no network required."""
import importlib.util
from pathlib import Path
import unittest

spec = importlib.util.spec_from_file_location("release429", Path(__file__).with_name("release429_release_status.py"))
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)
SHA = "a" * 40


def make_get(kind):
    def get(url, token):
        if kind == "api_error":
            raise ValueError("unavailable")
        if kind == "empty":
            return {"workflow_runs": []}
        if kind == "wrong_sha":
            return {"workflow_runs": [{"head_sha": "b" * 40, "head_branch": "dev", "status": "completed", "conclusion": "success"}]}
        if kind == "failed":
            return {"workflow_runs": [{"head_sha": SHA, "head_branch": "dev", "id": 5, "status": "completed", "conclusion": "failure", "html_url": "https://github.com/example"}]}
        return {"workflow_runs": [{"head_sha": SHA, "head_branch": "dev", "id": 9, "status": "completed", "conclusion": "success", "html_url": "https://github.com/example"}]}
    return get


class DiagnosticTests(unittest.TestCase):
    def test_green(self):
        r = module.check("owner/repo", SHA, "", get=make_get("green"))
        self.assertEqual(r["status"], "READY_FOR_PROTECTED_PRODUCTION_GATE")
        self.assertEqual(len(r["checks"]), 4)
        self.assertTrue(all(item["status"] == "GREEN" for item in r["checks"]))

    def test_fail_closed(self):
        for kind, label in [("empty", "MISSING"), ("failed", "HOLD"), ("wrong_sha", "MISSING"), ("api_error", "UNKNOWN")]:
            with self.subTest(kind=kind):
                r = module.check("owner/repo", SHA, "", get=make_get(kind))
                self.assertEqual(r["status"], "HOLD")
                self.assertTrue(all(item["status"] == label for item in r["checks"]))


if __name__ == "__main__":
    unittest.main()
