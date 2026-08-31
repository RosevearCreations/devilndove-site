// Legacy runtime migration endpoint retired by Release 464.
// Schema mutation is repository-owned and may only run through scripts/d1_migrate.py.
export async function onRequest() {
  return new Response(JSON.stringify({
    ok: false,
    error: 'This runtime migration endpoint has been retired. Use migrations/canonical through the guarded D1 migration applicator.',
    code: 'runtime_migration_endpoint_retired',
    canonical_migration_path: 'migrations/canonical',
    applicator: 'scripts/d1_migrate.py',
    runtime_schema_mutation_allowed: false,
  }), {
    status: 410,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff',
    },
  });
}
