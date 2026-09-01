#!/usr/bin/env python3
"""Release 466 Build 5 — four-module admin cockpit source gate."""

from __future__ import annotations

import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
ADMIN = ROOT / "admin"
MANIFEST = ROOT / "data" / "admin-navigation-modules.json"
INDEX = ADMIN / "index.html"
EXPECTED_MODULES = ["storefront", "creator", "finance", "it"]
EXPECTED_HREFS = [f"/admin/{key}/" for key in EXPECTED_MODULES]
PRESERVED_RUNTIME_AUTHORITIES = ["storefront", "creators", "socials", "financials", "it"]
HUB_DIRS = set(EXPECTED_MODULES)


def fail(message: str) -> None:
    raise SystemExit(f"RELEASE 466 BUILD 5 GATE: FAIL — {message}")


def require(condition: bool, message: str) -> None:
    if not condition:
        fail(message)


def read(path: Path) -> str:
    require(path.is_file(), f"missing required file: {path.relative_to(ROOT)}")
    return path.read_text(encoding="utf-8")


def admin_route_to_path(href: str) -> Path:
    require(href.startswith("/admin/") and href.endswith("/"), f"invalid admin route: {href}")
    relative = href.removeprefix("/admin/").strip("/")
    require(relative, f"operational route cannot be admin root: {href}")
    return ADMIN / relative / "index.html"


def index_path_to_route(path: Path) -> str:
    relative = path.parent.relative_to(ADMIN).as_posix().strip("/")
    require(relative, f"admin root cannot be treated as an operational route: {path}")
    return f"/admin/{relative}/"


def main() -> None:
    manifest = json.loads(read(MANIFEST))
    require(manifest.get("release") == 466, "navigation manifest release must be 466")
    require(manifest.get("build") == 5, "navigation manifest build must be 5")
    require(manifest.get("navigation_model") == "four-module-admin-cockpit", "unexpected navigation model")
    require(manifest.get("runtime_authorities_preserved") == PRESERVED_RUNTIME_AUTHORITIES, "runtime module authorities must remain unchanged")

    modules = manifest.get("modules")
    require(isinstance(modules, list) and len(modules) == 4, "manifest must define exactly four navigation modules")
    keys = [module.get("key") for module in modules]
    hrefs = [module.get("href") for module in modules]
    require(keys == EXPECTED_MODULES, f"module order/keys must be {EXPECTED_MODULES}")
    require(hrefs == EXPECTED_HREFS, f"module hrefs must be {EXPECTED_HREFS}")

    assigned_routes: list[str] = []
    for module in modules:
        sections = module.get("sections")
        require(isinstance(sections, list) and sections, f"{module.get('key')} must contain sections")
        for section in sections:
            links = section.get("links")
            require(isinstance(links, list) and links, f"{module.get('key')} section {section.get('label')} must contain links")
            for link in links:
                href = link.get("href")
                label = link.get("label")
                require(isinstance(label, str) and label.strip(), f"missing label for route {href}")
                require(isinstance(href, str), f"invalid href under {module.get('key')}")
                target = admin_route_to_path(href)
                require(target.is_file(), f"manifest route has no page: {href}")
                assigned_routes.append(href)

    duplicates = sorted({route for route in assigned_routes if assigned_routes.count(route) > 1})
    require(not duplicates, f"routes assigned to more than one primary workspace: {duplicates}")

    operational_routes = []
    for path in ADMIN.rglob("index.html"):
        if path == INDEX:
            continue
        relative_parts = path.parent.relative_to(ADMIN).parts
        if relative_parts and relative_parts[0] in HUB_DIRS:
            continue
        operational_routes.append(index_path_to_route(path))
    operational_routes = sorted(operational_routes)

    missing = sorted(set(operational_routes) - set(assigned_routes))
    unknown = sorted(set(assigned_routes) - set(operational_routes))
    require(not missing, f"admin workspaces missing a primary module assignment: {missing}")
    require(not unknown, f"manifest references unknown admin workspaces: {unknown}")

    index_html = read(INDEX)
    cards = re.findall(r'data-admin-module-card="([^"]+)"[^>]*href="([^"]+)"', index_html)
    require(len(cards) == 4, f"admin root must expose exactly four module cards, found {len(cards)}")
    require([key for key, _ in cards] == EXPECTED_MODULES, "admin root module card order drifted")
    require([href for _, href in cards] == EXPECTED_HREFS, "admin root module card hrefs drifted")
    require(len(re.findall(r"<h1(?:\s|>)", index_html, flags=re.I)) == 1, "admin root must contain exactly one H1")

    root_admin_links = re.findall(r'href="(/admin/[^\"]*)"', index_html)
    allowed_root_links = {"/admin/", *EXPECTED_HREFS}
    unexpected_root_links = sorted({href for href in root_admin_links if href not in allowed_root_links})
    require(not unexpected_root_links, f"admin root was re-cluttered with direct operational links: {unexpected_root_links}")

    retired_dashboard_scripts = [
        "admin-dashboard-summary.js",
        "admin-today-tasks.js",
        "admin-dashboard-smoke-badges.js",
        "admin-dashboard-preflight-badge.js",
        "admin-dashboard-notification-actions.js",
    ]
    for script in retired_dashboard_scripts:
        require(script not in index_html, f"admin root must not auto-load retired clutter script: {script}")

    for key in EXPECTED_MODULES:
        hub = ADMIN / key / "index.html"
        html = read(hub)
        require(f'data-admin-module-hub="{key}"' in html, f"{key} hub missing module identity")
        require('id="adminModuleHubMount"' in html, f"{key} hub missing shared navigation mount")
        require('/public/js/admin-module-hub.js?v=466' in html, f"{key} hub missing shared navigation renderer")
        require(len(re.findall(r"<h1(?:\s|>)", html, flags=re.I)) == 1, f"{key} hub must contain exactly one H1")

    renderer = read(ROOT / "public" / "js" / "admin-module-hub.js")
    require("/data/admin-navigation-modules.json" in renderer, "hub renderer must use canonical navigation manifest")
    require("window.DDAdminNavigationManifest" in renderer, "hub renderer must expose loaded navigation authority for diagnostics")

    print("RELEASE 466 BUILD 5 ADMIN FOUR-MODULE COCKPIT: PASS")
    print(f"Navigation modules: {len(modules)}")
    print(f"Assigned existing admin workspaces: {len(assigned_routes)}")
    print("Nested admin workspaces: COVERED")
    print("Runtime authorities preserved: Storefront, Creators, Socials, Financials, I.T.")
    print("Production mutation: ZERO")
    print("Schema change: NONE")


if __name__ == "__main__":
    main()
