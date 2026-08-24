// Devil n Dove Build 316 cross-module contract catalog.
// Inventory post/reverse remain Inventory-owned and Creative-consumer-enabled.
// Build 311 owns current Inventory cost reads; Build 312 adds bounded Accounting order reads;
// Build 316 adds an Accounting-owned expenses read contract without moving expense writes.

export const BUILD = 316;

function contract(id, owner, consumers, description, options = {}) {
  const status = options.status === 'implemented' ? 'implemented' : 'declared';
  const kind = options.kind === 'mutation' ? 'mutation' : 'read';
  return Object.freeze({
    id,
    owner,
    consumers: Object.freeze([...consumers]),
    description,
    status,
    kind,
    route: String(options.route || '').trim() || null,
    authorityRoute: String(options.authorityRoute || '').trim() || null,
    authorityAction: String(options.authorityAction || '').trim() || null,
    implementationState: String(options.implementationState || '').trim() || (status === 'implemented' ? 'implemented' : 'declared'),
    requiresOriginalMovementId: Boolean(options.requiresOriginalMovementId),
    requiresCreativePostingId: Boolean(options.requiresCreativePostingId),
    confirmationText: String(options.confirmationText || '').trim() || null,
    compensatingMovementOnly: Boolean(options.compensatingMovementOnly),
    directStockAddBackAllowed: options.directStockAddBackAllowed === true,
    consumerWritesReady: options.consumerWritesReady === true,
  });
}

export const DD_MODULE_CONTRACTS = Object.freeze([
  contract('catalog-read', 'catalog', ['public', 'operations', 'packaging', 'marketing', 'accounting'], 'Read stable product/catalog identity and presentation facts.', { status: 'implemented', route: '/api/admin/contracts/catalog-read' }),
  contract('inventory-read', 'inventory', ['operations', 'creative', 'packaging'], 'Read inventory identity, source and reusable material facts without mutating stock.', { status: 'implemented', route: '/api/admin/contracts/inventory-read' }),
  contract('inventory-cost', 'inventory', ['catalog', 'accounting'], 'Read authoritative current Inventory cost facts and optional cost-history evidence for pricing and finance.', {
    status: 'implemented',
    route: '/api/admin/contracts/inventory-cost',
    authorityRoute: '/api/admin/contracts/inventory-cost',
    authorityAction: 'read-current-cost',
    implementationState: 'implemented-read-only-current-cost',
  }),
  contract('inventory-post', 'inventory', ['creative'], 'Post reviewed physical material usage through Inventory authority.', {
    status: 'implemented',
    kind: 'mutation',
    route: '/api/admin/contracts/inventory-post',
    authorityRoute: '/api/admin/contracts/inventory-post',
    authorityAction: 'reviewed-creative-usage',
    implementationState: 'implemented-creative-consumer-enabled',
    consumerWritesReady: true,
  }),
  contract('inventory-reverse', 'inventory', ['creative'], 'Reverse posted usage only through a compensating Inventory movement tied to the original movement.', {
    status: 'implemented',
    kind: 'mutation',
    route: '/api/admin/contracts/inventory-reverse',
    authorityRoute: '/api/admin/contracts/inventory-reverse',
    implementationState: 'implemented-creative-consumer-enabled',
    requiresOriginalMovementId: true,
    requiresCreativePostingId: true,
    confirmationText: 'REVERSE INVENTORY',
    compensatingMovementOnly: true,
    directStockAddBackAllowed: false,
    consumerWritesReady: true,
  }),
  contract('creative-projects', 'creative', ['caip', 'content'], 'Read canonical Creative Process project identity and reviewed project facts.'),
  contract('caip-evidence', 'caip', ['content'], 'Read reviewed CAIP evidence/story references without exposing private-media internals.'),
  contract('content-media', 'content', ['public', 'catalog', 'packaging'], 'Select or read approved media references managed by Content authority.', { status: 'implemented', route: '/api/admin/contracts/content-media' }),
  contract('content-deliverables', 'content', ['marketing'], 'Read reviewed Content Studio deliverables ready for downstream distribution.'),
  contract('marketing-seo', 'marketing', ['public', 'catalog'], 'Read/apply reviewed SEO and public-discovery presentation rules.'),
  contract('accounting-read', 'accounting', ['operations'], 'Read bounded order-linked Accounting financial/payment state required by business operations.', {
    status: 'implemented',
    route: '/api/admin/contracts/accounting-read',
    authorityRoute: '/api/admin/contracts/accounting-read',
    authorityAction: 'read-order-financial-state',
    implementationState: 'implemented-read-only-order-financial-state',
  }),
  contract('accounting-expenses-read', 'accounting', ['operations'], 'Read Accounting expense records and attachment counts without request-time schema mutation.', {
    status: 'implemented',
    route: '/api/admin/contracts/accounting-expenses-read',
    authorityRoute: '/api/admin/contracts/accounting-expenses-read',
    authorityAction: 'read-accounting-expenses',
    implementationState: 'implemented-read-only-accounting-expenses',
  }),
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
    if (item.kind === 'mutation' && item.consumerWritesReady && !item.route) {
      errors.push(`Mutation contract ${item.id} is marked consumer-ready without a dedicated contract route.`);
    }
    if (item.compensatingMovementOnly && !item.requiresOriginalMovementId) {
      errors.push(`Compensating contract ${item.id} must require the original movement id.`);
    }
    if (item.id === 'inventory-reverse' && item.directStockAddBackAllowed) {
      errors.push('inventory-reverse cannot permit direct stock add-back.');
    }
    if (item.id === 'inventory-reverse' && item.status === 'implemented' && !item.requiresCreativePostingId) {
      errors.push('implemented inventory-reverse must require the current Creative posting id until generic reversal provenance exists.');
    }
    if (item.id === 'inventory-reverse' && item.status === 'implemented' && item.confirmationText !== 'REVERSE INVENTORY') {
      errors.push('implemented inventory-reverse must retain explicit typed confirmation.');
    }
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
