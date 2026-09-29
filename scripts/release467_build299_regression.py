#!/usr/bin/env python3
from pathlib import Path
import sys
R=Path(__file__).resolve().parents[1];F=[]
def t(p):return (R/p).read_text(encoding='utf-8',errors='replace')
def q(ok,msg):
    if not ok:F.append(msg)
helper=t('functions/api/_lib/schemaColumnSnapshot.js')
products=t('functions/api/products.js')
detail=t('functions/api/product-detail.js')
featured=t('functions/api/featured-products.js')
universal=t('functions/api/admin/universal-search.js')
creations=t('functions/api/creations.js')
journal=t('functions/api/workshop-journal.js')
caps=t('functions/api/capabilities.js')
for token in ('loadSchemaColumnSnapshot','pragma_table_info','snapshots=new WeakMap','UNION ALL'):
    q(token in helper,'schema snapshot helper missing '+token)
q('PRAGMA table_info' not in products,'Products retained per-table PRAGMA introspection')
q('PRAGMA table_info' not in detail and 'sqlite_master' not in detail,'Product Detail retained hot-path schema probes')
q('PRAGMA table_info' not in featured and 'sqlite_master' not in featured,'Featured Products retained schema fan-out')
q('PRAGMA table_info' not in universal and 'sqlite_master' not in universal,'Universal Search retained schema fan-out')
q("referenceLike" in universal and "normalized}%" in universal,'Universal Search reference-like prefix mode missing')
q("schema_snapshot:'single_statement_v299'" in universal,'Universal Search diagnostics missing schema snapshot proof')
q('sqlite_master' not in creations and "? = '' OR" not in creations,'Creations retained preflight/empty-search scan pattern')
q('sqlite_master' not in journal,'Workshop Journal retained table preflight')
q('sqlite_master' not in caps,'Capabilities retained table preflight')
for path in ('auth-login.js','catalog-items.js','health.js','image-derivative.js','movies.js','paypal-return.js','site-search-event.js','stripe-return.js'):
    q(not (R/path).exists(),'obsolete duplicate root API still present: '+path)
for path in ('functions/api/auth-login.js','functions/api/catalog-items.js','functions/api/health.js','functions/api/image-derivative.js','functions/api/movies.js','functions/api/paypal-return.js','functions/api/site-search-event.js','functions/api/stripe-return.js'):
    q((R/path).exists(),'canonical API copy missing: '+path)
sql=t('scripts/release467_build299_measurement.sql').upper()
for forbidden in (' INSERT ',' UPDATE ',' DELETE ',' CREATE ',' ALTER ',' DROP ',' REPLACE '):
    q(forbidden not in ' '+sql+' ','measurement SQL is not read-only: '+forbidden.strip())
q(sql.count('EXPLAIN QUERY PLAN')>=4,'measurement SQL missing query-plan evidence')
q('INVENTORY_WORKSTATION_MEMBERSHIPS' in sql,'measurement SQL missing workstation batch evidence')
print('RELEASE 467 BUILD 299 D1 QUERY EFFICIENCY + CANONICAL RUNTIME/REPOSITORY CLEANUP')
if F:
    print('FAIL');[print('-',x) for x in F];sys.exit(1)
print('PASS')
print('Schema introspection: BATCHED')
print('Public preflight probes: REMOVED FROM SELECTED HOT PATHS')
print('Duplicate root API copies: REMOVED')
print('Provider measurement SQL: READ ONLY')
