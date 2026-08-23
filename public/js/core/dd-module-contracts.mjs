// Devil n Dove Build 284 cross-module contract catalog.
// Implemented read contracts expose stable owner-side API boundaries. Declared
// contracts remain architectural promises until their owner provides a service.

function contract(id, owner, consumers, description, options = {}) {
  return Object.freeze({
    id,
    owner,
    consumers: Object.freeze([...consumers]),
    description,
    status: options.status === 'implemented' ? 'implemented' : 'declared',
    route: String(options.route || '').trim() || null,
  });
}

export const DD_MODULE_CONTRACTS = Object.freeze([
  contract('catalog-read', 'catalog', ['public', 'operations', 'packaging', 'marketing', 'accounting'], 'Read stable product/catalog identity and presentation facts.', { status: 'implemented', route: '/api/admin/contracts/catalog-read' }),
  contract('inventory-read', 'inventory', ['operations', 'creative', 'packaging'], 'Read inventory identity, source and reusable material facts without mutating stock.', { status: 'implemented', route: '/api/admin/contracts/inventory-read' }),
  contract('inventory-cost', 'inventory', ['catalog', 'accounting'], 'Read authoritative inventory cost facts for pricing and finance.'),
  contract('inventory-post', 'inventory', ['creative'], 'Post reviewed physical material usage through Inventory authority.'),
  contract('inventory-reverse', 'inventory', ['creative'], 'Reverse posted usage through compensating Inventory movements.'),
  contract('creative-projects', 'creative', ['caip', 'content'], 'Read canonical Creative Process project identity and reviewed project facts.'),
  contract('caip-evidence', 'caip', ['content'], 'Read reviewed CAIP evidence/story references without exposing private-media internals.'),
  contract('content-media', 'content', ['public', 'catalog', 'packaging'], 'Select or read approved media references managed by Content authority.', { status: 'implemented', route: '/api/admin/contracts/content-media' }),
  contract('content-deliverables', 'content', ['marketing'], 'Read reviewed Content Studio deliverables ready for downstream distribution.'),
  contract('marketing-seo', 'marketing', ['public', 'catalog'], 'Read/apply reviewed SEO and public-discovery presentation rules.'),
  contract('accounting-read', 'accounting', ['operations'], 'Read bounded financial/payment state required by business operations.'),
  contract('platform-health', 'platform', ['admin'], 'Read bounded runtime/schema/release health for administrator presentation.'),
]);

export function validateModuleContracts(definitions, contracts = DD_MODULE_CONTRACTS) {
  const modules = new Map((definitions || []).map((definition) => [definition.id, definition]));
  const byId = new Map();
  const errors = [];

  for (const item of contracts) {
    if (byId.has(item.id)) errors.push(`Duplicate contract: ${item.id}`);
    byId.set(item.id, item);
    if (!modules.has(item.owner)) errors.push(`Contract ${item.id} has unknown owner ${item.owner}`);
    if (item.status === 'implemented' && !item.route) errors.push(`Implemented contract ${item.id} has no route.`);
    for (const consumer of item.consumers) {
      if (!modules.has(consumer)) errors.push(`Contract ${item.id} has unknown consumer ${consumer}`);
    }
  }

  for (const definition of modules.values()) {
    for (const capability of definition.consumes || []) {
      const declared = byId.get(capability);
      if (!declared) {
        errors.push(`${definition.id} consumes undeclared contract ${capability}`);
        continue;
      }
      if (!declared.consumers.includes(definition.id)) {
        errors.push(`${definition.id} is not an allowed consumer of ${capability}`);
      }
    }
  }

  return Object.freeze({ ok: errors.length === 0, errors: Object.freeze(errors) });
}

export function moduleContract(contractId, contracts = DD_MODULE_CONTRACTS) {
  return contracts.find((item) => item.id === String(contractId || '').trim()) || null;
}
