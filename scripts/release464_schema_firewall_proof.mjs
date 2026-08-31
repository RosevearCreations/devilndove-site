import assert from 'node:assert/strict';
import { createSchemaSafeD1, isRuntimeSchemaMutationSql } from '../functions/api/_lib/schemaSafeD1.js';
import { getDb } from '../functions/api/_lib/adminAudit.js';

const calls = [];

function statement(sql) {
  const state = {
    sql,
    values: [],
    bind(...values) { state.values = values; return state; },
    async first() { calls.push(['first', sql, state.values]); return { ok: 1 }; },
    async run() { calls.push(['run', sql, state.values]); return { success: true, meta: { changes: 1 } }; },
    async all() { calls.push(['all', sql, state.values]); return { success: true, results: [{ ok: 1 }] }; },
    async raw() { calls.push(['raw', sql, state.values]); return [[1]]; },
  };
  return state;
}

const rawDb = {
  prepare(sql) { calls.push(['prepare', sql]); return statement(sql); },
  async exec(sql) { calls.push(['exec', sql]); return { count: 1, duration: 1 }; },
  async batch(items) { calls.push(['batch', items.length]); return Promise.all(items.map((item) => item.run())); },
};

assert.equal(isRuntimeSchemaMutationSql('CREATE TABLE demo(id INTEGER);'), true);
assert.equal(isRuntimeSchemaMutationSql(' ALTER TABLE demo ADD COLUMN note TEXT;'), true);
assert.equal(isRuntimeSchemaMutationSql('DROP INDEX idx_demo;'), true);
assert.equal(isRuntimeSchemaMutationSql('SELECT * FROM demo;'), false);
assert.equal(isRuntimeSchemaMutationSql('INSERT INTO demo(id) VALUES (1);'), false);

const db = createSchemaSafeD1(rawDb);
assert.equal(db.__dndSchemaSafe, true);
assert.equal(getDb({ DB: rawDb }).__dndSchemaSafe, true);

// Ordinary reads and business-data writes still reach D1.
const read = await db.prepare('SELECT 1 AS ok;').first();
assert.equal(read.ok, 1);
await db.prepare('INSERT INTO demo(id) VALUES (?);').bind(7).run();
assert.ok(calls.some((row) => row[0] === 'prepare' && row[1] === 'SELECT 1 AS ok;'));
assert.ok(calls.some((row) => row[0] === 'prepare' && row[1].startsWith('INSERT INTO demo')));

// Historical ensure-DDL is a successful non-mutating prepared statement.
const beforeCreatePrepareCount = calls.filter((row) => row[0] === 'prepare').length;
const createResult = await db.prepare('CREATE TABLE IF NOT EXISTS demo(id INTEGER);').run();
assert.equal(createResult.success, true);
assert.equal(createResult.meta.runtime_schema_mutation_blocked, true);
assert.equal(calls.filter((row) => row[0] === 'prepare').length, beforeCreatePrepareCount);

const alterResult = await db.prepare('ALTER TABLE demo ADD COLUMN note TEXT;').run();
assert.equal(alterResult.meta.runtime_schema_mutation_blocked, true);

// exec() is stricter because it may contain multiple statements: schema DDL is rejected.
await assert.rejects(
  () => db.exec('SELECT 1; CREATE INDEX idx_demo ON demo(id);'),
  (error) => error?.code === 'runtime_schema_mutation_forbidden',
);

// A batch containing a historical ensure statement preserves result ordering but only
// sends the genuine business-data statement to the raw D1 binding.
const rawPrepareBeforeBatch = calls.filter((row) => row[0] === 'prepare').length;
const batchResults = await db.batch([
  db.prepare('CREATE INDEX IF NOT EXISTS idx_demo ON demo(id);'),
  db.prepare('UPDATE demo SET id = id WHERE id = 7;'),
]);
assert.equal(batchResults.length, 2);
assert.equal(batchResults[0].meta.runtime_schema_mutation_blocked, true);
assert.equal(calls.filter((row) => row[0] === 'prepare').length, rawPrepareBeforeBatch + 1);

console.log('RELEASE 464 RUNTIME D1 SCHEMA FIREWALL: PASS');
console.log('Schema DDL through prepare(): NON-MUTATING');
console.log('Schema DDL through exec(): REJECTED');
console.log('Business reads/writes: PRESERVED');
console.log('Shared getDb(): GUARDED');
