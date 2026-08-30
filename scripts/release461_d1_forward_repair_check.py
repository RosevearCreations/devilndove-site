#!/usr/bin/env python3
"""Read-only classifier for the exact Release 461 Development structural drift repair."""
from __future__ import annotations

import argparse
import importlib.util
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
MANIFEST_MODULE = ROOT / 'scripts/release461_d1_acceptance_manifest.py'
REPAIR = ROOT / 'migrations/dev/20260830_runtime_schema_structural_forward_repair.sql'

spec = importlib.util.spec_from_file_location('release461_manifest', MANIFEST_MODULE)
module = importlib.util.module_from_spec(spec)
assert spec and spec.loader
spec.loader.exec_module(module)

ALLOWED = (
    re.compile(r"^accounting_fixed_assets: missing required columns \['location_note'\]$"),
    re.compile(r"^custom_request_fulfillment_prompts: missing required columns \['body_text', 'consent_question_text', 'customer_response_note', 'prompt_token', 'prompt_type', 'public_response_status', 'public_use_scope', 'responded_at', 'review_text', 'subject'\]$"),
    re.compile(r"^custom_request_payment_links: missing required columns \['checkout_redirect_url', 'external_share_status', 'gate_status', 'order_id', 'payment_id', 'preferred_provider'\]$"),
    re.compile(r"^custom_requests: missing required columns \['browser_session_token', 'visitor_token'\]$"),
    re.compile(r"^idx_accounting_gifi_review_notes_year: existing signature .* does not match required .*$"),
    re.compile(r"^idx_accounting_journal_entries_source: existing signature .* does not match required .*$"),
    re.compile(r"^idx_accounting_period_closures_period: existing signature .* does not match required .*$"),
    re.compile(r"^idx_custom_candle_soap_specs_request: existing signature .* does not match required .*$"),
)


def load(path: str):
    return json.loads(Path(path).read_text(encoding='utf-8'))


def missing_count(manifest, schema):
    master = module.sqlite_master_rows(schema)
    tables = sum(1 for name in manifest['tables'] if ('table', name) not in master)
    indexes = sum(1 for name in manifest['indexes'] if ('index', name) not in master)
    return tables + indexes


def classify(manifest, schema):
    try:
        report = module.check_schema(manifest, schema, require_converged=False)
        return {
            'safe': True,
            'repair_required': False,
            'converged': bool(report['converged']),
            'missing_object_count': int(report['missing_object_count']),
            'drift': [],
        }
    except RuntimeError as exc:
        message = str(exc)
        prefix = 'Release 461 D1 structural drift requires a dedicated forward repair:\n- '
        if not message.startswith(prefix):
            raise
        drift = message[len(prefix):].split('\n- ')
        unmatched = [line for line in drift if not any(pattern.fullmatch(line) for pattern in ALLOWED)]
        matched = [pattern for pattern in ALLOWED if any(pattern.fullmatch(line) for line in drift)]
        safe = not unmatched and len(drift) == len(ALLOWED) and len(matched) == len(ALLOWED)
        return {
            'safe': safe,
            'repair_required': safe,
            'converged': False,
            'missing_object_count': missing_count(manifest, schema),
            'drift': drift,
            'unexpected_drift': unmatched,
            'expected_repair_signature_complete': safe,
        }


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--manifest', required=True)
    parser.add_argument('--schema-json', required=True)
    parser.add_argument('--output')
    args = parser.parse_args()
    if not REPAIR.is_file():
        raise SystemExit('STOP: dedicated Release 461 structural forward repair file is missing.')
    manifest = load(args.manifest)
    schema = load(args.schema_json)
    result = classify(manifest, schema)
    text = json.dumps(result, indent=2, sort_keys=True) + '\n'
    if args.output:
        Path(args.output).write_text(text, encoding='utf-8')
    else:
        print(text, end='')
    if not result['safe']:
        print('STOP: Development D1 drift is not the exact reviewed Release 461 repair signature.')
        return 2
    print('RELEASE 461 DEVELOPMENT D1 FORWARD-REPAIR PREFLIGHT: PASS')
    print('Repair required:', 'YES' if result['repair_required'] else 'NO')
    print('Release 461 objects still missing:', result['missing_object_count'])
    print('D1 mutation by classifier: NONE')
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
