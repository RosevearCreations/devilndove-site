#!/usr/bin/env python3
"""Build 418 live read-only semantic schema classification.

Build 417 proved that Development/Production business anchors are largely aligned,
but 54 common tables have different stored CREATE TABLE text. Build 418 classifies
those differences using live column, foreign-key, and explicit-index signatures.
It also aggregates the three one-sided tables and CAIP upload metadata delta.

This helper is read-only. It cannot apply migrations or copy data.
"""
from __future__ import annotations

from collections import defaultdict
import json
import os
from pathlib import Path
import re
import shutil
import subprocess
import sys
import tempfile

for stream in (sys.stdout, sys.stderr):
    if hasattr(stream, 'reconfigure'):
        try:
            stream.reconfigure(errors='replace')
        except Exception:
            pass

ROOT = Path(__file__).resolve().parents[1]
DEV_CONFIG = ROOT / 'wrangler.toml'
DEV_PROJECT = 'devilndove-site-dev'
DEV_DATABASE = 'devilndove-dev'
DEV_DATABASE_ID = 'dbc1615b-dcbe-4951-973b-b47c99c73bfa'
PROD_PROJECT = 'devilndove-site'
PROD_DATABASE = 'devilndove-prod'
PROD_DATABASE_ID = '0dc8fa3e-319c-45f7-a515-34c8acd89fcf'
COMPATIBILITY_DATE = '2026-04-08'
MAX_COMMAND_CHARS = 6800

SPECIAL_TABLES = ('__sql_test', 'search_query_terms', 'gift_card_lookup_lockouts')
MUTATION_RE = re.compile(
    r'\b(?:INSERT|UPDATE|DELETE|REPLACE|CREATE|ALTER|DROP|TRUNCATE|VACUUM|ATTACH|DETACH|'
    r'REINDEX|ANALYZE|BEGIN|COMMIT|ROLLBACK|SAVEPOINT|RELEASE)\b', re.I
)
SAFE_STATEMENT_RE = re.compile(r'^\s*(?:SELECT\b|PRAGMA\s+(?:table_list\b|table_info\b|table_xinfo\b|foreign_key_list\b|foreign_key_check\b))', re.I)
IDENTIFIER_RE = re.compile(r'^[A-Za-z_][A-Za-z0-9_]*$')
AUTH_ENV_NAMES = (
    'CLOUDFLARE_API_TOKEN','CLOUDFLARE_ACCOUNT_ID','CLOUDFLARE_API_KEY','CLOUDFLARE_EMAIL',
    'CF_API_TOKEN','CF_ACCOUNT_ID','CF_API_KEY','CF_EMAIL',
)


def fail(message: str, code: int = 1) -> None:
    print(f'\nBUILD 418 LIVE SEMANTIC CLASSIFICATION: FAIL — {message}', file=sys.stderr)
    raise SystemExit(code)


def run_capture(args: list[str]) -> subprocess.CompletedProcess[str]:
    return subprocess.run(
        args, cwd=ROOT, text=True, encoding='utf-8', errors='replace',
        stdout=subprocess.PIPE, stderr=subprocess.STDOUT,
        env={**os.environ, 'NO_COLOR':'1', 'FORCE_COLOR':'0', 'PYTHONIOENCODING':'utf-8'},
        check=False,
    )


def current_branch() -> str:
    result = run_capture(['git','branch','--show-current'])
    if result.returncode != 0:
        fail(result.stdout or 'Unable to determine current branch.')
    return result.stdout.strip()


def npx_path() -> str:
    return shutil.which('npx.cmd') or shutil.which('npx') or fail('npx was not found on PATH.')


def validate_dev_pin() -> None:
    if current_branch() != 'dev':
        fail('current branch must be dev.')
    text = DEV_CONFIG.read_text(encoding='utf-8') if DEV_CONFIG.exists() else ''
    for required in (
        f'name = "{DEV_PROJECT}"',
        f'database_name = "{DEV_DATABASE}"',
        f'database_id = "{DEV_DATABASE_ID}"',
    ):
        if required not in text:
            fail('wrangler.toml is not pinned to the expected Development target.')


def readonly_config(project: str, database: str, database_id: str) -> str:
    return (
        f'name = "{project}"\n'
        f'compatibility_date = "{COMPATIBILITY_DATE}"\n\n'
        '[[d1_databases]]\n'
        'binding = "DB"\n'
        f'database_name = "{database}"\n'
        f'database_id = "{database_id}"\n'
    )


def split_sql(sql: str) -> list[str]:
    return [part.strip() for part in sql.split(';') if part.strip()]


def assert_read_only(sql: str) -> None:
    if len(sql) > MAX_COMMAND_CHARS:
        fail(f'read-only SQL command exceeds {MAX_COMMAND_CHARS} characters.')
    if MUTATION_RE.search(sql):
        fail(f'SQL guard rejected mutation-capable token in: {sql[:180]}')
    statements = split_sql(sql)
    if not statements:
        fail('empty SQL command rejected.')
    for statement in statements:
        if not SAFE_STATEMENT_RE.match(statement):
            fail(f'SQL guard rejected statement: {statement[:180]}')


def command(npx: str, config: Path, sql: str) -> list[str]:
    assert_read_only(sql)
    return [npx,'wrangler','d1','execute','DB','--remote','--config',str(config),'--yes','--command',sql]


def parse_payload(output: str) -> list[dict]:
    decoder = json.JSONDecoder()
    for index, ch in enumerate(output):
        if ch != '[':
            continue
        try:
            value, _ = decoder.raw_decode(output[index:])
        except json.JSONDecodeError:
            continue
        if isinstance(value, list) and all(isinstance(item, dict) for item in value):
            if any('results' in item or 'success' in item for item in value):
                return value
    return []


def query_rows(npx: str, config: Path, sql: str, label: str) -> list[dict]:
    result = run_capture(command(npx, config, sql))
    if result.returncode != 0:
        print(result.stdout, end='' if (result.stdout or '').endswith('\n') else '\n')
        lower = (result.stdout or '').lower()
        if 'code: 7403' in lower or 'not valid or is not authorized to access this service' in lower:
            configured = [name for name in AUTH_ENV_NAMES if str(os.environ.get(name,'')).strip()]
            suffix = f' Environment overrides detected: {", ".join(configured)}.' if configured else ''
            fail(f'{label} blocked by Cloudflare authorization (7403).{suffix}')
        fail(f'{label} failed with exit code {result.returncode}.')
    payload = parse_payload(result.stdout or '')
    if not payload:
        print(result.stdout, end='' if (result.stdout or '').endswith('\n') else '\n')
        fail(f'{label} returned no parseable Wrangler result payload.')
    rows: list[dict] = []
    for item in payload:
        values = item.get('results')
        if isinstance(values, list):
            rows.extend(row for row in values if isinstance(row, dict))
    return rows


def normalize_sql(value: object) -> str:
    return re.sub(r'\s+', ' ', str(value or '').strip()).lower()


def inventory(npx: str, config: Path, label: str) -> dict[str, str]:
    sql = "SELECT name,COALESCE(sql,'') AS create_sql FROM sqlite_schema WHERE type='table' AND name NOT LIKE 'sqlite_%' AND name NOT LIKE '_cf_%' ORDER BY name;"
    rows = query_rows(npx, config, sql, f'{label} TABLE INVENTORY')
    return {
        str(row.get('name') or ''): str(row.get('create_sql') or '')
        for row in rows
        if IDENTIFIER_RE.fullmatch(str(row.get('name') or ''))
    }


def batch_statements(statements: list[str]) -> list[str]:
    batches: list[str] = []
    current = ''
    for statement in statements:
        candidate = current + statement
        if current and len(candidate) > MAX_COMMAND_CHARS:
            batches.append(current)
            current = statement
        else:
            current = candidate
    if current:
        batches.append(current)
    return batches


def quote_literal(value: str) -> str:
    return "'" + value.replace("'", "''") + "'"


def load_column_rows(npx: str, config: Path, tables: list[str], label: str) -> dict[str, list[dict]]:
    statements = []
    for table in tables:
        if not IDENTIFIER_RE.fullmatch(table):
            fail(f'unsafe table identifier: {table!r}')
        lit = quote_literal(table)
        statements.append(
            f'SELECT {lit} AS table_name,cid,name,type,"notnull" AS notnull_value,dflt_value,pk,hidden '
            f'FROM pragma_table_xinfo({lit}) ORDER BY cid;'
        )
    grouped: dict[str, list[dict]] = defaultdict(list)
    for number, sql in enumerate(batch_statements(statements), start=1):
        for row in query_rows(npx, config, sql, f'{label} COLUMN SIGNATURE BATCH {number}'):
            grouped[str(row.get('table_name') or '')].append(row)
    return grouped


def load_fk_rows(npx: str, config: Path, tables: list[str], label: str) -> dict[str, list[dict]]:
    statements = []
    for table in tables:
        lit = quote_literal(table)
        statements.append(
            f'SELECT {lit} AS table_name,id,seq,"table" AS target_table,"from" AS from_column,"to" AS to_column,'
            f'on_update,on_delete,match FROM pragma_foreign_key_list({lit}) ORDER BY id,seq;'
        )
    grouped: dict[str, list[dict]] = defaultdict(list)
    for number, sql in enumerate(batch_statements(statements), start=1):
        for row in query_rows(npx, config, sql, f'{label} FOREIGN KEY BATCH {number}'):
            grouped[str(row.get('table_name') or '')].append(row)
    return grouped


def load_index_rows(npx: str, config: Path, label: str) -> dict[str, list[str]]:
    sql = "SELECT tbl_name AS table_name,COALESCE(sql,'') AS index_sql FROM sqlite_schema WHERE type='index' AND sql IS NOT NULL AND tbl_name NOT LIKE 'sqlite_%' AND tbl_name NOT LIKE '_cf_%' ORDER BY tbl_name,name;"
    grouped: dict[str, list[str]] = defaultdict(list)
    for row in query_rows(npx, config, sql, f'{label} EXPLICIT INDEX INVENTORY'):
        table = str(row.get('table_name') or '')
        if IDENTIFIER_RE.fullmatch(table):
            grouped[table].append(str(row.get('index_sql') or ''))
    return grouped


def column_signature(rows: list[dict]) -> list[tuple]:
    result = []
    for row in sorted(rows, key=lambda item: int(item.get('cid') or 0)):
        result.append((
            str(row.get('name') or '').lower(),
            normalize_sql(row.get('type')),
            int(row.get('notnull_value') or 0),
            normalize_sql(row.get('dflt_value')),
            int(row.get('pk') or 0),
            int(row.get('hidden') or 0),
        ))
    return result


def fk_signature(rows: list[dict]) -> list[tuple]:
    return sorted((
        str(row.get('from_column') or '').lower(),
        str(row.get('target_table') or '').lower(),
        str(row.get('to_column') or '').lower(),
        normalize_sql(row.get('on_update')),
        normalize_sql(row.get('on_delete')),
        normalize_sql(row.get('match')),
    ) for row in rows)


def canonical_index(sql: str) -> str:
    value = normalize_sql(sql).replace('`','').replace('"','')
    value = value.replace('[','').replace(']','')
    value = re.sub(r'^create\s+(unique\s+)?index\s+(?:if\s+not\s+exists\s+)?[^ ]+\s+on\s+',
                   lambda m: 'create unique index on ' if m.group(1) else 'create index on ', value)
    return value


def index_signature(rows: list[str]) -> list[str]:
    return sorted(canonical_index(row) for row in rows if str(row or '').strip())


def column_diff(dev_rows: list[dict], prod_rows: list[dict]) -> tuple[list[str], list[str], list[str]]:
    dev = {item[0]: item for item in column_signature(dev_rows)}
    prod = {item[0]: item for item in column_signature(prod_rows)}
    dev_only = sorted(set(dev) - set(prod))
    prod_only = sorted(set(prod) - set(dev))
    changed = sorted(name for name in set(dev) & set(prod) if dev[name] != prod[name])
    return dev_only, prod_only, changed


def special_counts(npx: str, config: Path, inv: dict[str,str], label: str) -> dict[str, int | None]:
    statements = []
    for table in SPECIAL_TABLES:
        if table in inv:
            statements.append(f"SELECT {quote_literal(table)} AS table_name,COUNT(*) AS row_count FROM \"{table}\";")
    result = {table: None for table in SPECIAL_TABLES}
    if statements:
        for row in query_rows(npx, config, ''.join(statements), f'{label} ONE-SIDED TABLE COUNTS'):
            table = str(row.get('table_name') or '')
            if table in result:
                result[table] = int(row.get('row_count') or 0)
    return result


def caip_aggregate(npx: str, config: Path, inv: dict[str,str], label: str) -> list[dict]:
    if 'caip_media_upload_files' not in inv:
        return []
    sql = (
        "SELECT upload_status,storage_provider,bucket_alias,COUNT(*) AS row_count,"
        "COALESCE(SUM(file_size_bytes),0) AS total_bytes,"
        "SUM(CASE WHEN creative_asset_id IS NOT NULL THEN 1 ELSE 0 END) AS linked_asset_rows,"
        "SUM(CASE WHEN COALESCE(object_key,'')<>'' THEN 1 ELSE 0 END) AS object_key_rows "
        "FROM caip_media_upload_files GROUP BY upload_status,storage_provider,bucket_alias "
        "ORDER BY upload_status,storage_provider,bucket_alias;"
    )
    return query_rows(npx, config, sql, f'{label} CAIP AGGREGATE')


def source_refs(table: str) -> list[str]:
    roots = [ROOT / 'functions', ROOT / 'public', ROOT / 'admin']
    files = list(ROOT.glob('*.js')) + list(ROOT.glob('database*.sql'))
    for base in roots:
        if base.exists():
            files.extend(path for path in base.rglob('*') if path.is_file() and path.suffix.lower() in {'.js','.mjs','.sql','.html'})
    refs = []
    for path in files:
        rel = path.relative_to(ROOT).as_posix()
        if rel.startswith('docs/archive/') or 'build417_' in rel.lower() or 'build418_' in rel.lower():
            continue
        try:
            if table in path.read_text(encoding='utf-8', errors='replace'):
                refs.append(rel)
        except OSError:
            continue
    return sorted(set(refs))


def human_bytes(value: object) -> str:
    try:
        size = int(value or 0)
    except (TypeError, ValueError):
        size = 0
    units = ['B','KiB','MiB','GiB','TiB']
    amount = float(size)
    for unit in units:
        if amount < 1024 or unit == units[-1]:
            return f'{amount:.1f} {unit}'
        amount /= 1024
    return f'{size} B'


def main() -> int:
    if len(sys.argv) != 2 or sys.argv[1] != '--run':
        print('BUILD 418 LIVE READ-ONLY SEMANTIC SCHEMA CLASSIFICATION')
        print('Run explicitly with:')
        print('  python scripts/build418_live_semantic_schema_classification.py --run')
        return 2

    validate_dev_pin()
    npx = npx_path()
    print('BUILD 418 LIVE READ-ONLY SEMANTIC SCHEMA CLASSIFICATION')
    print(f'Git branch: {current_branch()}')
    print(f'Development target: {DEV_DATABASE} ({DEV_DATABASE_ID})')
    print(f'Production target:  {PROD_DATABASE} ({PROD_DATABASE_ID})')
    print('SQL guard: SELECT / inspection-only PRAGMA — PASS')
    print('PRODUCTION MUTATION CAPABILITY IN THIS HELPER: NONE')

    identity = run_capture([npx,'wrangler','whoami'])
    print('\n=== WRANGLER IDENTITY ===')
    print(identity.stdout, end='' if identity.stdout.endswith('\n') else '\n')
    if identity.returncode != 0:
        fail('Wrangler is not authenticated.')

    with tempfile.TemporaryDirectory(prefix='dd-build418-') as temp_dir:
        temp = Path(temp_dir)
        dev_cfg = temp / 'dev.toml'
        prod_cfg = temp / 'prod.toml'
        dev_cfg.write_text(readonly_config(DEV_PROJECT,DEV_DATABASE,DEV_DATABASE_ID), encoding='utf-8')
        prod_cfg.write_text(readonly_config(PROD_PROJECT,PROD_DATABASE,PROD_DATABASE_ID), encoding='utf-8')

        dev_inv = inventory(npx, dev_cfg, 'DEVELOPMENT')
        prod_inv = inventory(npx, prod_cfg, 'PRODUCTION')
        common = sorted(set(dev_inv) & set(prod_inv))
        create_diff = [table for table in common if normalize_sql(dev_inv[table]) != normalize_sql(prod_inv[table])]

        print('\n=== BUILD 417 BASELINE RECONFIRMATION ===')
        print(f'Development user tables: {len(dev_inv)}')
        print(f'Production user tables: {len(prod_inv)}')
        print(f'Common tables: {len(common)}')
        print(f'CREATE-SQL-different common tables: {len(create_diff)}')

        dev_cols = load_column_rows(npx, dev_cfg, create_diff, 'DEVELOPMENT')
        prod_cols = load_column_rows(npx, prod_cfg, create_diff, 'PRODUCTION')
        dev_fks = load_fk_rows(npx, dev_cfg, create_diff, 'DEVELOPMENT')
        prod_fks = load_fk_rows(npx, prod_cfg, create_diff, 'PRODUCTION')
        dev_indexes = load_index_rows(npx, dev_cfg, 'DEVELOPMENT')
        prod_indexes = load_index_rows(npx, prod_cfg, 'PRODUCTION')

        core_same = []
        core_diff = []
        detail = {}
        for table in create_diff:
            cols_same = column_signature(dev_cols.get(table,[])) == column_signature(prod_cols.get(table,[]))
            fks_same = fk_signature(dev_fks.get(table,[])) == fk_signature(prod_fks.get(table,[]))
            idx_same = index_signature(dev_indexes.get(table,[])) == index_signature(prod_indexes.get(table,[]))
            if cols_same and fks_same and idx_same:
                core_same.append(table)
            else:
                core_diff.append(table)
                dev_only_cols, prod_only_cols, changed_cols = column_diff(dev_cols.get(table,[]), prod_cols.get(table,[]))
                detail[table] = {
                    'dev_only_cols': dev_only_cols,
                    'prod_only_cols': prod_only_cols,
                    'changed_cols': changed_cols,
                    'fk_diff': not fks_same,
                    'index_diff': not idx_same,
                }

        print('\n=== SEMANTIC SCHEMA CLASSIFICATION ===')
        print(f'CREATE-SQL differences inspected: {len(create_diff)}')
        print(f'Core semantic signatures identical (columns + FKs + explicit indexes): {len(core_same)}')
        for table in core_same:
            print(f'  - {table}')
        print(f'Core semantic signatures different: {len(core_diff)}')
        for table in core_diff:
            item = detail[table]
            print(f'  - {table}')
            print('      Development-only columns:', ', '.join(item['dev_only_cols']) if item['dev_only_cols'] else 'none')
            print('      Production-only columns:', ', '.join(item['prod_only_cols']) if item['prod_only_cols'] else 'none')
            print('      Changed column attributes:', ', '.join(item['changed_cols']) if item['changed_cols'] else 'none')
            print('      Foreign-key signature differs:', 'yes' if item['fk_diff'] else 'no')
            print('      Explicit-index signature differs:', 'yes' if item['index_diff'] else 'no')
        print('NOTE: tables in the core-identical group may still have CHECK/inline-constraint text differences; they are definition-review items, not proven drift.')

        dev_special = special_counts(npx, dev_cfg, dev_inv, 'DEVELOPMENT')
        prod_special = special_counts(npx, prod_cfg, prod_inv, 'PRODUCTION')
        print('\n=== ONE-SIDED TABLE CLASSIFICATION EVIDENCE ===')
        for table in SPECIAL_TABLES:
            dev_value = 'MISSING' if dev_special[table] is None else str(dev_special[table])
            prod_value = 'MISSING' if prod_special[table] is None else str(prod_special[table])
            refs = source_refs(table)
            print(f'{table}: development={dev_value} production={prod_value}')
            print('  current-source refs:', ', '.join(refs) if refs else 'none found')

        print('\n=== CAIP UPLOAD METADATA AGGREGATE ===')
        for label, rows in (
            ('DEVELOPMENT', caip_aggregate(npx, dev_cfg, dev_inv, 'DEVELOPMENT')),
            ('PRODUCTION', caip_aggregate(npx, prod_cfg, prod_inv, 'PRODUCTION')),
        ):
            print(label)
            if not rows:
                print('  - no rows')
                continue
            for row in rows:
                print(
                    '  - status={status} provider={provider} bucket={bucket} rows={rows} bytes={bytes} linked_assets={linked} object_keys={keys}'.format(
                        status=str(row.get('upload_status') or ''),
                        provider=str(row.get('storage_provider') or ''),
                        bucket=str(row.get('bucket_alias') or ''),
                        rows=int(row.get('row_count') or 0),
                        bytes=human_bytes(row.get('total_bytes')),
                        linked=int(row.get('linked_asset_rows') or 0),
                        keys=int(row.get('object_key_rows') or 0),
                    )
                )

    print('\nBUILD 418 LIVE READ-ONLY SEMANTIC SCHEMA CLASSIFICATION: EVIDENCE COMPLETE')
    print('No migration or data mutation was executed.')
    print('PRODUCTION PROMOTION: CLOSED')
    print('PRODUCTION DATA COPY: CLOSED')
    print('NEXT: classify core semantic drift, one-sided-table authority, and CAIP R2/D1 portability before any Production mutation.')
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
