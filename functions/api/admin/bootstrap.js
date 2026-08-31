// Legacy runtime database bootstrap retired by Release 464.
// The Production/Development schemas are already converged and all future schema changes
// are forward migrations under migrations/canonical.
export async function onRequest() {
  return new Response(JSON.stringify({
    ok: false,
    error: 'Runtime database bootstrap is retired. D1 schema changes must use the canonical repository migration applicator.',
    code: 'runtime_database_bootstrap_retired',
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
