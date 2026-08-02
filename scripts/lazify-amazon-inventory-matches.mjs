import fs from 'node:fs';
import path from 'node:path';
import url from 'node:url';
import zlib from 'node:zlib';

const root = path.resolve(path.dirname(url.fileURLToPath(import.meta.url)), '..');
const target = path.join(root, 'functions/api/admin/_amazonInventoryMatches.js');
const source = fs.readFileSync(target, 'utf8');

if (source.includes('const AMAZON_INVENTORY_MATCHES_GZIP_BY_AREA = {')) {
  console.log('Amazon inventory match payload is already compressed and demand-loaded.');
  process.exit(0);
}

function readRowsByArea(input) {
  const original = input.match(/export const AMAZON_INVENTORY_MATCHES = (\[[\s\S]*?\]);\n\n/);
  if (original) return { rows: JSON.parse(original[1]), payload_match: original };

  const lazy = input.match(/const AMAZON_INVENTORY_MATCHES_JSON_BY_AREA = \{([\s\S]*?)\n\};\n\nfunction normalizeKey/);
  if (!lazy) throw new Error('Could not locate the embedded Amazon inventory match payload.');

  const rows = [];
  for (const area of ['supplies', 'toolshed']) {
    const encoded = lazy[1].match(new RegExp(`\\n\\s*"${area}":\\s*('[^\\n]*')`));
    if (!encoded) throw new Error(`Could not locate the ${area} Amazon payload.`);
    const json = Function(`"use strict"; return (${encoded[1]});`)();
    rows.push(...JSON.parse(json));
  }
  return { rows, payload_match: lazy, lazy_payload: true };
}

const { rows, payload_match: payloadMatch, lazy_payload: lazyPayload } = readRowsByArea(source);
if (!Array.isArray(rows) || !rows.length) throw new Error('Amazon inventory match array is empty or invalid.');

const groups = new Map();
for (const row of rows) {
  const area = String(row?.inventory_area || '').trim().toLowerCase();
  if (!area) throw new Error('Amazon inventory match row is missing inventory_area.');
  if (!groups.has(area)) groups.set(area, []);
  groups.get(area).push(row);
}

const payloadDeclaration = [
  '// Build 233: keep the private one-time Amazon CSV reference compressed at Worker startup.',
  '// Only an authenticated inventory route expands its requested area.',
  'const AMAZON_INVENTORY_MATCHES_GZIP_BY_AREA = {',
  ...[...groups.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([area, items]) => {
    const json = JSON.stringify(items);
    const compressed = zlib.gzipSync(Buffer.from(json), { level: 9 }).toString('base64');
    return `  ${JSON.stringify(area)}: ${JSON.stringify(compressed)},`;
  }),
  '};',
  ''
].join('\n');

let next;
if (lazyPayload) {
  next = source.replace(payloadMatch[0], `${payloadDeclaration}\nfunction normalizeKey`);
} else {
  next = source.replace(payloadMatch[0], payloadDeclaration);
}

const registryStart = next.indexOf('const AMAZON_MATCH_REGISTRIES');
const eagerRegistryStart = next.indexOf('const MATCH_BY_AREA_INDEX');
const start = registryStart >= 0 ? registryStart : eagerRegistryStart;
const registryEnd = next.indexOf('\nfunction parseRecord', start);
if (start < 0 || registryEnd < 0) throw new Error('Could not locate Amazon match registry functions.');

const demandLoadedRegistry = `const AMAZON_MATCH_REGISTRIES = new Map();
const AMAZON_MATCH_LOADS = new Map();

function decodeBase64(value) {
  const binary = atob(value);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index);
  return bytes;
}

async function expandAmazonMatchRows(encoded) {
  if (typeof DecompressionStream !== 'function') {
    throw new Error('This Worker runtime does not support gzip payload expansion.');
  }
  const stream = new Blob([decodeBase64(encoded)]).stream().pipeThrough(new DecompressionStream('gzip'));
  return JSON.parse(await new Response(stream).text());
}

async function getAmazonMatchRegistry(areaKey) {
  if (AMAZON_MATCH_REGISTRIES.has(areaKey)) return AMAZON_MATCH_REGISTRIES.get(areaKey);
  if (AMAZON_MATCH_LOADS.has(areaKey)) return AMAZON_MATCH_LOADS.get(areaKey);
  const encoded = AMAZON_INVENTORY_MATCHES_GZIP_BY_AREA[areaKey];
  if (!encoded) return null;

  const loading = expandAmazonMatchRows(encoded).then((areaRows) => {
    const byIndex = new Map(areaRows.map((row) => [Number(row.inventory_index || 0), row]));
    const byName = new Map();
    for (const row of areaRows) {
      const key = normalizeKey(row.inventory_name);
      if (key && !byName.has(key)) byName.set(key, row);
    }
    const registry = { byIndex, byName };
    AMAZON_MATCH_REGISTRIES.set(areaKey, registry);
    AMAZON_MATCH_LOADS.delete(areaKey);
    return registry;
  }).catch((error) => {
    AMAZON_MATCH_LOADS.delete(areaKey);
    throw error;
  });
  AMAZON_MATCH_LOADS.set(areaKey, loading);
  return loading;
}

export async function getAmazonInventoryMatch(area, index, inventoryName = '') {
  const areaKey = normalizeKey(area);
  const registry = await getAmazonMatchRegistry(areaKey);
  if (!registry) return null;
  const byIndex = registry.byIndex.get(Number(index || 0));
  if (byIndex) return byIndex;
  return registry.byName.get(normalizeKey(inventoryName)) || null;
}
`;

next = `${next.slice(0, start)}${demandLoadedRegistry}${next.slice(registryEnd)}`;
fs.writeFileSync(target, next, 'utf8');
console.log(`Compressed and demand-loaded ${rows.length} Amazon reference rows across ${groups.size} areas.`);
