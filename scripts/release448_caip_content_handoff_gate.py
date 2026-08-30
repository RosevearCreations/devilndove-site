#!/usr/bin/env python3
"""Release 448 carried-forward fresh-schema gate for reviewed CAIP -> Content Studio handoff."""
from pathlib import Path
import json,re,sqlite3,tempfile
ROOT=Path(__file__).resolve().parents[1]
FILES=['database_full_schema.sql','database_platform_convergence.sql','database_release448_product_lineage.sql','database_release448_media_it.sql','database_release448_storefront_merchandising.sql','database_release448_caip_content_handoff.sql']
REQUIRED={'creative_projects','content_projects','creative_media_evidence_ranges','creative_story_evidence','creative_story_segments','creative_story_segment_evidence_links','caip_content_handoffs','caip_content_handoff_evidence'}
for f in FILES:
 if not (ROOT/f).exists():raise SystemExit(f'FAIL — missing CAIP handoff composition input: {f}')
with tempfile.NamedTemporaryFile(suffix='.sqlite') as tmp:
 db=sqlite3.connect(tmp.name);db.execute('PRAGMA foreign_keys=ON')
 for f in FILES:
  try:db.executescript((ROOT/f).read_text(encoding='utf-8'))
  except Exception as e:raise SystemExit(f'FAIL — {f} did not compose for CAIP handoff: {e}')
 tables={r[0] for r in db.execute("SELECT name FROM sqlite_master WHERE type='table'")}
 missing=sorted(REQUIRED-tables)
 if missing:raise SystemExit(f'FAIL — CAIP handoff parent/current tables missing from fresh composition: {missing}')
 if db.execute('PRAGMA foreign_key_check').fetchall():raise SystemExit('FAIL — CAIP handoff introduced foreign-key violations')
 cols={r[1] for r in db.execute('PRAGMA table_info(caip_content_handoffs)')}
 for col in ['creative_project_id','content_project_id','handoff_status','approved_marker_count','package_json']:
  if col not in cols:raise SystemExit(f'FAIL — caip_content_handoffs missing {col}')
api_path=ROOT/'functions/api/admin/_caipContentHandoffLegacy.js'
if not api_path.exists():api_path=ROOT/'functions/api/admin/caip-content-handoff.js'
api=api_path.read_text(encoding='utf-8')
wrapper=(ROOT/'functions/api/admin/caip-content-handoff.js').read_text(encoding='utf-8')
if api_path.name=='_caipContentHandoffLegacy.js' and "from './_caipContentHandoffLegacy.js'" not in wrapper:raise SystemExit('FAIL — Release 461 wrapper no longer retains the reviewed CAIP handoff implementation')
page=(ROOT/'admin/caip-content-handoff/index.html').read_text(encoding='utf-8')
review=(ROOT/'functions/api/admin/caip-evidence-review.js').read_text(encoding='utf-8')
secure=(ROOT/'functions/api/admin/creative-asset-review.js').read_text(encoding='utf-8')
content=(ROOT/'functions/api/admin/content-studio.js').read_text(encoding='utf-8')
for required in ["r.marker_status='active'","r.review_status='approved'","e.review_status='approved'","e.verification_status<>'rejected'",'source_media_copied:false','publication_active:false']:
 if required not in api:raise SystemExit(f'FAIL — CAIP handoff review-first invariant missing: {required}')
if '<h1>CAIP → Content Studio</h1>' not in page:raise SystemExit('FAIL — CAIP handoff workspace missing its single H1')
if len(re.findall(r'<h1(?:\\s|>)',page,re.I))!=1:raise SystemExit('FAIL — CAIP handoff workspace must expose exactly one H1')
if 'Build 439 • Master Creative Automation' in (ROOT/'admin/creative-assets/index.html').read_text(encoding='utf-8'):raise SystemExit('FAIL — CAIP admin still presents Build 439 as current')
if "X-DND-CAIP-Review', '439'" in secure:raise SystemExit('FAIL — secure CAIP review still presents Build 439 outwardly')
if "Unsupported Build 439" in review:raise SystemExit('FAIL — CAIP evidence API still presents Build 439 as live contract')
if "return json({ ok: false, build: 355" in content or "return json({ ok: true, message: 'Content Automation Studio saved.', build:" in content:raise SystemExit('FAIL — Content Studio still presents a historical build as live response identity')
if 'provenance_build: 355' not in content:raise SystemExit('FAIL — Content Studio historical implementation provenance was lost')
release=json.loads((ROOT/'development-release.json').read_text(encoding='utf-8'));current=int(release.get('release') or 0)
if current<448:raise SystemExit('FAIL — current release cannot predate Release 448 CAIP authority')
history={x.get('release'):x for x in release.get('release_history',[])}
if current>448 and not str(history.get(448,{}).get('state','')).startswith('complete_'):raise SystemExit('FAIL — Release 448 completed authority missing from later release history')
print('RELEASE 448 CAIP CONTENT HANDOFF: CARRIED FORWARD PASS')
print('Approved temporal marker + approved story evidence eligibility: ENFORCED')
print('Source media copying/provider execution/publication: DISABLED')
print('Fresh Release 448 CAIP parent authority: PRESENT')
print(f'Current outward release: {current}')