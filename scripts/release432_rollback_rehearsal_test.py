#!/usr/bin/env python3
"""Build 432: deterministic rollback rehearsal boundary tests (offline)."""
import importlib.util
from pathlib import Path
import unittest

spec=importlib.util.spec_from_file_location("rollback432",Path(__file__).with_name("release432_rollback_rehearsal.py"))
module=importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)
NOW="a"*40
OLDER="b"*40
T1="c"*40
T2="d"*40
RECEIPT={"status":"VERIFIED_PRODUCTION_RECEIPT","source_sha":OLDER,"cloudflare_deployment_id":"cf-old",
         "cloudflare_deployment_url":"https://old.devilndove-site.pages.dev","github_run_id":321}
RUN={"id":321,"head_sha":OLDER,"status":"completed","conclusion":"success","name":"Production Pages Deploy"}
LIVE={"source_sha":NOW,"branch":"main","workflow_run_id":"654"}

def inspect(**changes):
    args=dict(current_sha=NOW,candidate_sha=OLDER,current_tree=T1,candidate_tree=T2,
              candidate_ancestor=True,changed_files=["public/app.js"],receipt=RECEIPT,
              production_run=RUN,live=LIVE)
    args.update(changes)
    return module.assess(**args)

class Safety(unittest.TestCase):
    def test_eligible_evidence_still_needs_human_review(self):
        p=inspect()
        self.assertEqual(p["holds"],[])
        self.assertEqual(p["status"],"HOLD_FOR_MANUAL_RECOVERY_REVIEW")
        self.assertTrue(p["rehearsal_only"])
        self.assertFalse(p["deployment_executed"])
        self.assertFalse(p["rollback_executed"])
        self.assertEqual(p["r2_mutations"],0)
        self.assertIn("DO_NOT_RESTORE_D1_OR_OVERWRITE_PRODUCTION_BUSINESS_DATA",p["safety_boundaries"])
    def test_rejects_non_ancestral_target(self):
        self.assertIn("CANDIDATE_NOT_IN_CURRENT_HISTORY",inspect(candidate_ancestor=False)["holds"])
    def test_rejects_stale_current_live(self):
        self.assertIn("CURRENT_LIVE_VERSION_NOT_VERIFIED",inspect(live={"source_sha":OLDER,"branch":"main"})["holds"])
    def test_requires_success_exact_run(self):
        self.assertIn("INDEPENDENT_HISTORICAL_PRODUCTION_RUN_NOT_GREEN",inspect(production_run=None)["holds"])
        self.assertIn("INDEPENDENT_HISTORICAL_PRODUCTION_RUN_NOT_GREEN",inspect(production_run={**RUN,"head_sha":NOW})["holds"])
    def test_rejects_unbound_receipt(self):
        self.assertIn("HISTORICAL_RECEIPT_NOT_BOUND_TO_CANDIDATE",inspect(receipt={**RECEIPT,"source_sha":NOW})["holds"])
        self.assertIn("HISTORICAL_PRODUCTION_RECEIPT_NOT_PROVIDED",inspect(receipt=None)["holds"])
    def test_data_and_function_changes_are_flagged(self):
        p=inspect(changed_files=["migrations/001.sql","functions/api/catalog.js","wrangler.toml","assets/banner.webp"])
        self.assertIn("SCHEMA_OR_BINDING_DIFF_REQUIRES_MANUAL_DATA_REVIEW",p["holds"])
        self.assertIn("SERVER_FUNCTION_CHANGES_REQUIRE_OPERATOR_REVIEW",p["holds"])
        self.assertEqual(p["r2_mutations"],0)
    def test_git_diff_unavailable_fails_closed(self):
        p=inspect(changed_files=["UNKNOWN_GIT_DIFF"])
        self.assertIn("GIT_DIFF_UNAVAILABLE",p["holds"])

    def test_no_source_fails_closed(self):
        p=inspect(candidate_tree=None,candidate_ancestor=False)
        self.assertIn("GIT_TREE_NOT_VERIFIED",p["holds"])

if __name__=="__main__":
    unittest.main()
