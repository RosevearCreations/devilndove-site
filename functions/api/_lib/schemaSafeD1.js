// Release 464 runtime D1 schema-safety firewall.
//
// Healthy runtime code may read/write business data and inspect schema, but it may not
// create/alter/drop schema. Historical "ensure schema" calls are converted to successful
// non-mutating prepared-statement results so a healthy converged database keeps working.
// If required schema is actually missing, the subsequent real query fails closed instead
// of repairing Production during a request.

const GUARDED = new WeakMap();
const BLOCKED_STATEMENT = Symbol('dndBlockedSchemaStatement');

const SCHEMA_MUTATION = /^\s*(?:--[^\n]*\n\s*|\/\*[\s\S]*?\*\/\s*)*(?:CREATE\s+(?:TEMP(?:ORARY)?\s+)?(?:TABLE|INDEX|TRIGGER|VIEW)\b|ALTER\s+TABLE\b|DROP\s+(?:TABLE|INDEX|TRIGGER|VIEW)\b|VACUUM\b|REINDEX\b)/i;

function normalizedSql(sql) {
  return String(sql ?? '').replace(/^\uFEFF/, '');
}

export function isRuntimeSchemaMutationSql(sql) {
  return SCHEMA_MUTATION.test(normalizedSql(sql));
}

function blockedMeta(sql) {
  return {
    duration: 0,
    changes: 0,
    last_row_id: 0,
    changed_db: false,
    size_after: 0,
    rows_read: 0,
    rows_written: 0,
    runtime_schema_mutation_blocked: true,
    schema_statement: normalizedSql(sql).trim().slice(0, 96),
  };
}

function blockedStatement(sql) {
  const state = {
    [BLOCKED_STATEMENT]: true,
    __dndSchemaMutationSql: normalizedSql(sql),
    bind() { return state; },
    async first() { return null; },
    async run() { return { success: true, meta: blockedMeta(sql) }; },
    async all() { return { success: true, results: [], meta: blockedMeta(sql) }; },
    async raw(options = {}) {
      return options && options.columnNames ? [[]] : [];
    },
  };
  return state;
}

function isBlockedStatement(value) {
  return Boolean(value && value[BLOCKED_STATEMENT]);
}

async function safeBatch(target, statements) {
  const list = Array.isArray(statements) ? statements : [];
  const live = [];
  const livePositions = [];
  const output = new Array(list.length);
  list.forEach((statement, index) => {
    if (isBlockedStatement(statement)) {
      output[index] = { success: true, results: [], meta: blockedMeta(statement.__dndSchemaMutationSql) };
    } else {
      live.push(statement);
      livePositions.push(index);
    }
  });
  if (live.length) {
    const liveResults = await target.batch(live);
    livePositions.forEach((position, index) => { output[position] = liveResults[index]; });
  }
  return output;
}

function guardedSession(session) {
  return createSchemaSafeD1(session);
}

export function createSchemaSafeD1(database) {
  if (!database || (typeof database !== 'object' && typeof database !== 'function')) return database;
  if (GUARDED.has(database)) return GUARDED.get(database);

  const proxy = new Proxy(database, {
    get(target, property, receiver) {
      if (property === '__dndSchemaSafe') return true;
      if (property === 'prepare') {
        return (sql) => isRuntimeSchemaMutationSql(sql) ? blockedStatement(sql) : target.prepare(sql);
      }
      if (property === 'exec') {
        return async (sql) => {
          const text = normalizedSql(sql);
          // exec may contain more than one statement; reject if a schema mutation appears
          // at the beginning of any semicolon-delimited statement.
          const pieces = text.split(';').map((part) => part.trim()).filter(Boolean);
          if (pieces.some((part) => isRuntimeSchemaMutationSql(part))) {
            const error = new Error('Runtime D1 schema mutation is forbidden. Use migrations/canonical through scripts/d1_migrate.py.');
            error.code = 'runtime_schema_mutation_forbidden';
            throw error;
          }
          return target.exec(sql);
        };
      }
      if (property === 'batch') return (statements) => safeBatch(target, statements);
      if (property === 'withSession' && typeof target.withSession === 'function') {
        return (...args) => guardedSession(target.withSession(...args));
      }
      const value = Reflect.get(target, property, receiver);
      return typeof value === 'function' ? value.bind(target) : value;
    },
  });
  GUARDED.set(database, proxy);
  return proxy;
}
