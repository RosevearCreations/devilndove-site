#!/usr/bin/env python3
"""Build 439 local-only provider fail-closed rerun regression.

Proves that rerunning the focused Build 439 migration forces its two metadata-only
provider profiles back to disabled with zero execution budget. No Cloudflare, D1,
R2 or external provider access occurs.
"""
from __future__ import annotations

import sqlite3

from build439_caip_temporal_evidence_review_test import MIGRATION, base_schema

PROVIDERS = ('caip_frame_builder', 'caip_audio_extractor')


def main() -> int:
    migration = MIGRATION.read_text(encoding='utf-8')
    conn = sqlite3.connect(':memory:')
    try:
        base_schema(conn)
        conn.executescript(migration)

        initial = conn.execute(
            "SELECT provider_key,lifecycle_status,default_budget_cap_cents "
            "FROM creative_provider_profiles "
            "WHERE provider_key IN (?,?) ORDER BY provider_key",
            PROVIDERS,
        ).fetchall()
        if len(initial) != 2 or any(status != 'disabled' or budget != 0 for _, status, budget in initial):
            raise AssertionError(f'initial provider seed is not disabled/zero-budget: {initial!r}')

        # Simulate unsafe pre-existing drift and prove a Build 439 rerun closes it again.
        conn.execute(
            "UPDATE creative_provider_profiles "
            "SET lifecycle_status='enabled', default_budget_cap_cents=50000 "
            "WHERE provider_key IN (?,?)",
            PROVIDERS,
        )
        conn.executescript(migration)

        after_rerun = conn.execute(
            "SELECT provider_key,lifecycle_status,default_budget_cap_cents "
            "FROM creative_provider_profiles "
            "WHERE provider_key IN (?,?) ORDER BY provider_key",
            PROVIDERS,
        ).fetchall()
        ledger_count = conn.execute(
            "SELECT COUNT(*) FROM schema_migration_ledger "
            "WHERE migration_key='build_439_caip_temporal_evidence_review'"
        ).fetchone()[0]

        assert len(after_rerun) == 2, after_rerun
        assert all(status == 'disabled' and budget == 0 for _, status, budget in after_rerun), after_rerun
        assert ledger_count == 1, ledger_count

        print('BUILD 439 PROVIDER FAIL-CLOSED RERUN REGRESSION')
        print('Cloudflare/D1/R2/provider access: NONE')
        print('01. PASS — initial Build 439 provider profiles are disabled with zero budget')
        print('02. PASS — simulated enabled/high-budget drift is closed by migration rerun')
        print('03. PASS — migration ledger remains rerun-safe / single authority')
        print('BUILD 439 PROVIDER FAIL-CLOSED RERUN REGRESSION: PASS (3/3)')
        print('Provider execution: DISABLED / FAIL-CLOSED')
        print('PRODUCTION PROMOTION: CLOSED')
        return 0
    finally:
        conn.close()


if __name__ == '__main__':
    raise SystemExit(main())
