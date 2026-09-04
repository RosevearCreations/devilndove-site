#!/usr/bin/env python3
"""Run the release-neutral current application quality gates."""
from pathlib import Path
import subprocess, sys

ROOT = Path(__file__).resolve().parents[1]
for script in (
    'current_help_hygiene_gate.py',
    'current_search_quality_gate.py',
    'current_responsive_layout_gate.py',
    'current_packaging_safe_area_gate.py',
    'current_packaging_material_intelligence_gate.py',
    'current_packaging_label_composition_gate.py',
    'current_packaging_label_production_gate.py',
    'current_it_release_truth_gate.py',
    'current_system_gate_provenance_gate.py',
    'current_production_promotion_provenance_gate.py',
    'current_reliability_truth_gate.py',
    'current_deployment_preflight_truth_gate.py',
    'current_accounting_schema_authority_gate.py',
    'current_product_numbering_schema_authority_gate.py',
    'current_product_social_automation_schema_authority_gate.py',
):
    subprocess.run([sys.executable, str(ROOT / 'scripts' / script)], cwd=ROOT, check=True)
print('CURRENT APPLICATION QUALITY GATE: PASS')
