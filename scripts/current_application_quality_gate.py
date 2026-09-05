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
    'current_grey_hair_media_intelligence_gate.py',
    'current_grey_hair_sync_alignment_gate.py',
    'current_grey_hair_story_edit_planning_gate.py',
    'current_grey_hair_production_acceptance_gate.py',
    'current_grey_hair_content_studio_handoff_gate.py',
    'current_content_studio_schema_readiness_gate.py',
    'current_content_render_readiness_gate.py',
    'current_content_generated_review_state_gate.py',
    'current_authority_restart_integrity_gate.py',
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