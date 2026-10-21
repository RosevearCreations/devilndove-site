import unittest
from release430_production_receipt import receipt

SHA = "a" * 40
CONTROL = {
    "status": "PASS", "source_sha": SHA, "environment": "production",
    "branch": "main", "project": "devilndove-site",
    "deployment_id": "cf-example-id", "deployment_url": "https://1234.devilndove-site.pages.dev",
    "commit_hash": SHA,
}
SMOKE = {"status": "PASS", "checks": {"home": {"status": 200}, "sitemap_routes": {"status": "PASS"}}}


class ReceiptTest(unittest.TestCase):
    def test_valid(self):
        r = receipt(SHA, "123", CONTROL, SMOKE)
        self.assertEqual(r["status"], "VERIFIED_PRODUCTION_RECEIPT")
        self.assertEqual(r["source_sha"], SHA)
        self.assertEqual(r["github_run_id"], 123)
        self.assertFalse(r["live_html_contains_exact_sha"])

    def test_fail_closed(self):
        for changes in [
            {"source_sha": "b" * 40}, {"status": "FAIL"}, {"deployment_id": ""},
            {"environment": "preview"}, {"branch": "dev"}, {"commit_hash": "b" * 40},
        ]:
            with self.subTest(changes=changes):
                with self.assertRaises(ValueError):
                    receipt(SHA, "123", {**CONTROL, **changes}, SMOKE)
        with self.assertRaises(ValueError):
            receipt(SHA, "123", CONTROL, {"status": "FAIL", "checks": {}})
        with self.assertRaises(ValueError):
            receipt(SHA, "0", CONTROL, SMOKE)


if __name__ == "__main__":
    unittest.main()
