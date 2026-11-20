#!/usr/bin/env python3
"""Non-mutating Build742 recovery-page asset + Service Worker source gate."""
from html.parser import HTMLParser
from pathlib import Path
import re

root=Path(__file__).resolve().parents[1]
page=(root/"account-help/index.html").read_text(encoding="utf-8")
sw=(root/"sw.js").read_text(encoding="utf-8")
reset=(root/"functions/api/auth/recovery-734.js").read_text(encoding="utf-8")

class Parse(HTMLParser):
    def __init__(self):
        super().__init__()
        self.scripts=[]
    def handle_starttag(self, tag, attrs):
        if tag=="script":
            self.scripts.append(dict(attrs).get("src"))
p=Parse();p.feed(page)
assert "brand-v3-editorial-banners-226-235.js" not in page, "Retired missing script still referenced"
assert all(not x or x.startswith("/") for x in p.scripts), "Local recovery page must not load arbitrary third-party scripts"
paths=[x.split("?",1)[0].lstrip("/") for x in p.scripts if x]
assert paths and all((root/path).is_file() for path in paths), "Recovery references missing JS: "+", ".join(x for x in paths if not (root/x).is_file())
assert "public/js/account-help.js" in paths, "Actual original account-help JS missing"
assert "public/js/auth.js" in paths, "Authentication controller missing"
assert "public/js/site-auth-ui.js" in paths, "Session UI missing"
assert "id=\"forgotPasswordForm\"" in page and "id=\"accountHelpMessage\"" in page, "Working form/status elements missing"
assert "/public/js/account-help.js" in sw.split("AUTH_CRITICAL_ASSETS = new Set(",1)[1].split(");",1)[0], "Recovery JS must bypass stale Service Worker cache"
assert "if(shouldBypassCache(url))return;" in sw, "Direct network bypass missing"
assert "url.pathname.startsWith('/media/')" in sw, "Keep existing media privacy protections"
assert "canonicalResetLink734(request,raw)" in reset, "Dev reset URL isolation lost"
assert "dev.devilndove-site.pages.dev" in reset, "Dev origin no longer allowed for password reset"
assert not re.search(r"<script[^>]+src=\"https?://",page,re.I), "Recovery page scripts must stay local"
print("BUILD742 RECOVERY SCRIPT: PASS — all local scripts exist, retired reference removed, reset script bypasses Service Worker, Dev reset URL isolated, no remote script injection.")
