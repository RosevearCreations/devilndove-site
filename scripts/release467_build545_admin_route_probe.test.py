"""No live site, credentials or business data required."""
import importlib.util
import unittest
import urllib.error
from pathlib import Path

SOURCE = Path(__file__).with_name("production_admin_route_probe_545.py")
spec = importlib.util.spec_from_file_location("admin_probe_545", SOURCE)
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)


class ProbeTests(unittest.TestCase):
    def test_all_routes_read_only_and_content_verified(self):
        seen = []

        def fetch(url):
            seen.append(url)
            marker = next(value for route, value in module.ROUTES.values() if url.endswith(route))
            return 200, b"<!doctype html><html>" + marker

        result = module.probe("https://devilndove.com/", fetch=fetch, pause=lambda _: None)
        self.assertEqual(result["status"], "PASS")
        self.assertEqual(len(seen), 4)
        self.assertTrue(all("api/" not in url for url in seen))

    def test_origin_timeout_recovers_on_next_get(self):
        hits = {}

        def fetch(url):
            count = hits.get(url, 0)
            hits[url] = count + 1
            if count == 0:
                raise urllib.error.HTTPError(url, 524, "A timeout occurred", {}, None)
            marker = next(value for route, value in module.ROUTES.values() if url.endswith(route))
            return 200, marker

        result = module.probe("https://devilndove.com/", fetch=fetch, pause=lambda _: None)
        self.assertEqual(result["status"], "PASS")
        self.assertTrue(all(row["attempts"] == 2 for row in result["routes"].values()))

    def test_persistent_timeout_fails_when_critical_routes_unavailable(self):
        def fail(url):
            raise urllib.error.HTTPError(url, 524, "Origin timeout", {}, None)

        result = module.probe("https://devilndove.com/", attempts=2, fetch=fail, pause=lambda _: None)
        self.assertEqual(result["status"], "FAIL")
        self.assertIn("admin_home", result["degraded_routes"])
        self.assertTrue(all("524" in row["last_error"] for row in result["routes"].values()))

    def test_known_product_editor_timeout_is_honestly_reported_without_blocking_admin_release(self):
        def fetch(url):
            if "product-editor/" in url:
                raise urllib.error.HTTPError(url, 524, "Origin timeout", {}, None)
            marker = next(value for route, value in module.ROUTES.values() if url.endswith(route))
            return 200, marker

        result = module.probe("https://devilndove.com/", attempts=2, fetch=fetch, pause=lambda _: None)
        self.assertEqual(result["status"], "PASS")
        self.assertEqual(result["degraded_routes"], ["product_editor_shell"])
        self.assertIn("524", result["routes"]["product_editor_shell"]["last_error"])

    def test_empty_or_wrong_page_cannot_pass(self):
        result = module.probe("https://devilndove.com/", attempts=1,
                              fetch=lambda _: (200, b"<html>wrong-page</html>"), pause=lambda _: None)
        self.assertEqual(result["status"], "FAIL")


if __name__ == "__main__":
    unittest.main()
