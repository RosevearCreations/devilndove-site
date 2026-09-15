#!/usr/bin/env python3
from pathlib import Path

R = Path(__file__).resolve().parents[1]

# The original repair regex expected its intermediate Build-156 label, while the repository
# correctly still carries the sealed Build-154 summary. Normalize only that temporary match
# target inside the Actions workspace; the main repair immediately replaces the whole card.
it_page = R / 'admin/it/index.html'
text = it_page.read_text(encoding='utf-8')
old = '<strong>Build 154 Products Worker Resource Hotfix:</strong>'
new = '<strong>Build 156 Products Worker Resource Hotfix:</strong>'
if old in text:
    text = text.replace(old, new, 1)
elif new not in text:
    raise SystemExit('I.T. summary compatibility target not found')
it_page.write_text(text, encoding='utf-8')

# The main repair owns the final forward-compatible Build-155 migration assertion. A manual
# safety correction may already have made that assertion forward-compatible; normalize it to
# the exact historical form expected by the one-shot migration, which then converts it back
# to prefix semantics in the same transaction.
gate = R / 'scripts/release467_build155_gate.py'
text = gate.read_text(encoding='utf-8')
manual = """    historical_baseline = [
        '0001_release464_migration_authority.sql',
        '0002_release464_operational_acceptance.sql',
        '0003_release464_business_growth.sql',
        '0004_release465_storefront_quality.sql',
    ]
    req(files[:4] == historical_baseline,
        f'Build 155 historical canonical migration baseline drifted: {files[:4]}')
    req(len(files) >= 4,
        f'Build 155 requires its original four canonical migrations; current stream is {files}')"""
expected = """    req(files == [
        '0001_release464_migration_authority.sql',
        '0002_release464_operational_acceptance.sql',
        '0003_release464_business_growth.sql',
        '0004_release465_storefront_quality.sql',
    ], f'canonical migration stream drifted: {files}')"""
repair_output = """    build155_baseline = [
        '0001_release464_migration_authority.sql',
        '0002_release464_operational_acceptance.sql',
        '0003_release464_business_growth.sql',
        '0004_release465_storefront_quality.sql',
    ]
    req(files[:4] == build155_baseline, f'Build 155 canonical migration baseline drifted: {files[:4]}')"""
if manual in text:
    text = text.replace(manual, expected, 1)
elif expected not in text and repair_output not in text:
    raise SystemExit('Build 155 migration compatibility target not found')
gate.write_text(text, encoding='utf-8')

print('Build 156 authority compatibility pre-step staged')
