#!/usr/bin/env python3
"""Emit compact machine-readable evidence for the current Development system gate."""
from __future__ import annotations
import argparse, hashlib, json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def file_sha256(path):
    return hashlib.sha256((ROOT / path).read_bytes()).hexdigest()


def source_metrics():
    roots = ['functions', 'public/js', 'js', 'css', 'admin', 'shop', 'collections', 'collages']
    count = total = 0
    for name in roots:
        root = ROOT / name
        if not root.exists():
            continue
        for path in root.rglob('*'):
            if path.is_file() and path.suffix.lower() in {'.js', '.mjs', '.css', '.html'}:
                count += 1
                total += path.stat().st_size
    return {'runtime_source_files': count, 'runtime_source_bytes': total}


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--output', default='current-regression-evidence.json')
    parser.add_argument('--source-sha', default='')
    parser.add_argument('--preview-url', default='')
    parser.add_argument('--d1-authority', default='')
    args = parser.parse_args()

    pointer = json.loads((ROOT / 'current-development-authority.json').read_text(encoding='utf-8'))
    release = json.loads((ROOT / 'development-release.json').read_text(encoding='utf-8'))
    manifest = json.loads((ROOT / 'migrations/canonical/manifest.json').read_text(encoding='utf-8'))
    historical = {}
    for label, path in (
        ('release465_build1', 'release465-build1-storefront-quality.json'),
        ('release465_build2', 'release465-build2-inventory-creator-intelligence.json'),
        ('release465_build3', 'release465-build3-financial-it-hardening.json'),
    ):
        historical[label] = json.loads((ROOT / path).read_text(encoding='utf-8')).get('state')

    d1 = {}
    if args.d1_authority and Path(args.d1_authority).is_file():
        d1 = json.loads(Path(args.d1_authority).read_text(encoding='utf-8'))

    production = pointer.get('production_checkpoint') or {}
    out = {
        'kind': 'current-regression-evidence.json',
        'release': int(pointer.get('release') or 0),
        'build': int(pointer.get('build') or 0),
        'title': pointer.get('title'),
        'current_authority_state': pointer.get('state'),
        'source_sha': args.source_sha,
        'preview_url': args.preview_url,
        'convergence_state': release.get('convergence_state'),
        'production_baseline': {
            'build': production.get('build'),
            'main_sha': production.get('main_sha'),
            'tree_sha': production.get('tree_sha'),
            'production_pages_deploy_run': production.get('production_pages_deploy_run'),
            'state': production.get('state'),
        },
        'historical_regression_prerequisites': historical,
        'canonical_migration_count': len(manifest.get('migrations', [])),
        'canonical_migrations': [item.get('file') for item in manifest.get('migrations', [])],
        'migration_manifest_sha256': file_sha256('migrations/canonical/manifest.json'),
        'performance_budget_sha256': file_sha256('release465-performance-budget.json'),
        'source_metrics': source_metrics(),
        'd1_authority': d1,
        'safety': {
            'provider_execution': False,
            'provider_publication': False,
            'inventory_mutation': False,
            'accounting_posting': False,
            'production_mutation': False,
            'raw_r2_delete': False,
            'request_time_schema_ddl': False,
        },
    }
    Path(args.output).write_text(json.dumps(out, indent=2, sort_keys=True) + '\n', encoding='utf-8')
    print(json.dumps(out, indent=2, sort_keys=True))


if __name__ == '__main__':
    main()
