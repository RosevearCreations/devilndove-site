#!/usr/bin/env python3
"""Offline regression coverage for exact Development workflow evidence lookup."""

import io
import json
import os
import unittest
from unittest.mock import patch

from scripts.main_promotion_gate import Stop, workflow_green


SHA = "a" * 40
WORKFLOW = "system-gate.yml"


def run(**overrides):
    evidence = {
        "id": 8675309,
        "head_sha": SHA,
        "head_branch": "dev",
        "event": "push",
        "path": ".github/workflows/system-gate.yml@refs/heads/dev",
        "status": "completed",
        "conclusion": "success",
        "updated_at": "2026-10-22T15:00:00Z",
        "html_url": "https://github.com/RosevearCreations/devilndove-site/actions/runs/8675309",
    }
    evidence.update(overrides)
    return evidence


class WorkflowGreenTests(unittest.TestCase):
    def lookup(self, runs, fallback_runs=None):
        urls = []

        def fetch(request, timeout):
            urls.append(request.full_url)
            selected = (fallback_runs if fallback_runs is not None else runs) if "/actions/workflows/" in request.full_url else runs
            return io.BytesIO(json.dumps({
                "total_count": len(selected),
                "workflow_runs": selected,
            }).encode("utf-8"))

        with patch.dict(os.environ, {"GITHUB_TOKEN": "test-token", "GITHUB_REPOSITORY": "RosevearCreations/devilndove-site"}):
            with patch("scripts.main_promotion_gate.urllib.request.urlopen", side_effect=fetch):
                result = workflow_green(SHA, WORKFLOW)
        self.assertIn("/actions/runs?", urls[0])
        self.assertIn("head_sha=" + SHA, urls[0])
        return result

    def test_accepts_exact_successful_push_evidence(self):
        result = self.lookup([
            run(id=1, event="pull_request"),
            run(id=2, head_branch="main"),
            run(id=3, head_sha="b" * 40),
            run(id=4, path=".github/workflows/unrelated.yml"),
            run(id=5, conclusion="failure"),
            run(id=6),
        ])
        self.assertEqual(6, result["run_id"])

    def test_falls_back_when_sha_filtered_list_omits_the_success(self):
        result = self.lookup([run(conclusion="failure")], fallback_runs=[run(id=42)])
        self.assertEqual(42, result["run_id"])

    def test_does_not_scan_unrelated_historical_runs(self):
        urls = []

        def fetch(request, timeout):
            urls.append(request.full_url)
            return io.BytesIO(json.dumps({"total_count": 2500, "workflow_runs": []}).encode("utf-8"))

        with patch.dict(os.environ, {"GITHUB_TOKEN": "test-token", "GITHUB_REPOSITORY": "RosevearCreations/devilndove-site"}):
            with patch("scripts.main_promotion_gate.urllib.request.urlopen", side_effect=fetch):
                with self.assertRaisesRegex(Stop, "no successful system-gate.yml run"):
                    workflow_green(SHA, WORKFLOW)
        self.assertEqual(2, len(urls))
        self.assertTrue(all("head_sha=" + SHA in url for url in urls))

    def test_rejects_only_irrelevant_successes(self):
        with self.assertRaisesRegex(Stop, "no successful system-gate.yml run"):
            self.lookup([
                run(event="pull_request"),
                run(head_branch="main"),
                run(head_sha="b" * 40),
                run(path=".github/workflows/unrelated.yml"),
                run(conclusion="failure"),
            ])

    def test_rejects_incomplete_or_running_evidence(self):
        with self.assertRaisesRegex(Stop, "no successful system-gate.yml run"):
            self.lookup([run(status="in_progress", conclusion="success")])

    def test_missing_authentication_fails_closed(self):
        with patch.dict(os.environ, {"GITHUB_TOKEN": ""}):
            with self.assertRaisesRegex(Stop, "GITHUB_TOKEN is required"):
                workflow_green(SHA, WORKFLOW)


if __name__ == "__main__":
    unittest.main()
