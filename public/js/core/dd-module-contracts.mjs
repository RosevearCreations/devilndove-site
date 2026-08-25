// Devil n Dove Build 339 cross-module contract catalog.
// Inventory post/reverse remain Inventory-owned and Creative-consumer-enabled.
// Accounting read extraction now includes sales-tax filing, fixed-assets and evidence readiness reads.

export const BUILD = 339;

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
  contract('inventory-cost', 'inventory', ['catalog', 'accounting'], 'Read authoritative current Inventory cost facts and optional cost-history evidence for pricing and finance.', { status: 'implemented', route: '/api/admin/contracts/inventory-cost', authorityRoute: '/api/admin/contracts/inventory-cost', authorityAction: 'read-current-cost', implementationState: 'implemented-read-only-current-cost' }),
  contract('inventory-post', 'inventory', ['creative'], 'Post reviewed physical material usage through Inventory authority.', { status: 'implemented', kind: 'mutation', route: '/api/admin/contracts/inventory-post', authorityRoute: '/api/admin/contracts/inventory-post', authorityAction: 'reviewed-creative-usage', implementationState: 'implemented-creative-consumer-enabled', consumerWritesReady: true }),
  contract('inventory-reverse', 'inventory', ['creative'], 'Reverse posted usage only through a compensating Inventory movement tied to the original movement.', { status: 'implemented', kind: 'mutation', route: '/api/admin/contracts/inventory-reverse', authorityRoute: '/api/admin/contracts/inventory-reverse', implementationState: 'implemented-creative-consumer-enabled', requiresOriginalMovementId: true, requiresCreativePostingId: true, confirmationText: 'REVERSE INVENTORY', compensatingMovementOnly: true, directStockAddBackAllowed: false, consumerWritesReady: true }),
  contract('creative-projects', 'creative', ['caip', 'content'], 'Read canonical Creative Process project identity and reviewed project facts.'),
  contract('caip-evidence', 'caip', ['content'], 'Read reviewed CAIP evidence/story references without exposing private-media internals.'),
  contract('content-media', 'content', ['public', 'catalog', 'packaging'], 'Select or read approved media references managed by Content authority.', { status: 'implemented', route: '/api/admin/contracts/content-media' }),
  contract('content-deliverables', 'content', ['marketing'], 'Read reviewed Content Studio deliverables ready for downstream distribution.'),
  contract('marketing-seo', 'marketing', ['public', 'catalog'], 'Read/apply reviewed SEO and public-discovery presentation rules.'),
  contract('accounting-read', 'accounting', ['operations'], 'Read bounded order-linked Accounting financial/payment state required by business operations.', { status: 'implemented', route: '/api/admin/contracts/accounting-read', authorityRoute: '/api/admin/contracts/accounting-read', authorityAction: 'read-order-financial-state', implementationState: 'implemented-read-only-order-financial-state' }),
  contract('accounting-expenses-read', 'accounting', ['operations'], 'Read Accounting expense records and attachment counts without request-time schema mutation.', { status: 'implemented', route: '/api/admin/contracts/accounting-expenses-read', authorityRoute: '/api/admin/contracts/accounting-expenses-read', authorityAction: 'read-accounting-expenses', implementationState: 'implemented-read-only-accounting-expenses' }),
  contract('accounting-writeoffs-read', 'accounting', ['operations'], 'Read Accounting write-off records without request-time schema mutation.', { status: 'implemented', route: '/api/admin/contracts/accounting-writeoffs-read', authorityRoute: '/api/admin/contracts/accounting-writeoffs-read', authorityAction: 'read-accounting-writeoffs', implementationState: 'implemented-read-only-accounting-writeoffs' }),
  contract('accounting-general-ledger-read', 'accounting', ['operations'], 'Read General Ledger account and GIFI review state without request-time schema mutation.', { status: 'implemented', route: '/api/admin/contracts/accounting-general-ledger-read', authorityRoute: '/api/admin/contracts/accounting-general-ledger-read', authorityAction: 'read-accounting-general-ledger', implementationState: 'implemented-read-only-accounting-general-ledger' }),
  contract('accounting-summary-read', 'accounting', ['operations'], 'Read Accounting summary totals and recent order-linked records without request-time schema mutation.', { status: 'implemented', route: '/api/admin/contracts/accounting-summary-read', authorityRoute: '/api/admin/contracts/accounting-summary-read', authorityAction: 'read-accounting-summary', implementationState: 'implemented-read-only-accounting-summary' }),
  contract('accounting-overhead-allocations-read', 'accounting', ['operations'], 'Read monthly Accounting overhead allocations without request-time schema mutation.', { status: 'implemented', route: '/api/admin/contracts/accounting-overhead-allocations-read', authorityRoute: '/api/admin/contracts/accounting-overhead-allocations-read', authorityAction: 'read-accounting-overhead-allocations', implementationState: 'implemented-read-only-accounting-overhead-allocations' }),
  contract('accounting-overhead-product-allocations-read', 'accounting', ['operations'], 'Read overhead allocations assigned to products without request-time schema mutation.', { status: 'implemented', route: '/api/admin/contracts/accounting-overhead-product-allocations-read', authorityRoute: '/api/admin/contracts/accounting-overhead-product-allocations-read', authorityAction: 'read-accounting-overhead-product-allocations', implementationState: 'implemented-read-only-accounting-overhead-product-allocations' }),
  contract('accounting-product-costs-read', 'accounting', ['operations', 'catalog'], 'Read historical Accounting product-cost records without request-time schema mutation.', { status: 'implemented', route: '/api/admin/contracts/accounting-product-costs-read', authorityRoute: '/api/admin/contracts/accounting-product-costs-read', authorityAction: 'read-accounting-product-costs', implementationState: 'implemented-read-only-accounting-product-costs' }),
  contract('accounting-profit-loss-read', 'accounting', ['accounting'], 'Read the monthly Accounting profit/loss overview used by the Accounting application page without request-time schema mutation.', { status: 'implemented', route: '/api/admin/contracts/accounting-profit-loss-read', authorityRoute: '/api/admin/contracts/accounting-profit-loss-read', authorityAction: 'read-accounting-profit-loss', implementationState: 'implemented-read-only-accounting-profit-loss' }),
  contract('accounting-item-costing-read', 'accounting', ['accounting'], 'Read monthly estimated item costing and recognized rough COGS without request-time schema mutation.', { status: 'implemented', route: '/api/admin/contracts/accounting-item-costing-read', authorityRoute: '/api/admin/contracts/accounting-item-costing-read', authorityAction: 'read-accounting-item-costing', implementationState: 'implemented-read-only-accounting-item-costing' }),
  contract('accounting-journal-read', 'accounting', ['accounting'], 'Read monthly Accounting journal entries and lines without request-time schema mutation.', { status: 'implemented', route: '/api/admin/contracts/accounting-journal-read', authorityRoute: '/api/admin/contracts/accounting-journal-read', authorityAction: 'read-accounting-journal', implementationState: 'implemented-read-only-accounting-journal' }),
  contract('accounting-gifi-notes-read', 'accounting', ['accounting'], 'Read year-specific Accounting GIFI review notes without request-time schema mutation.', { status: 'implemented', route: '/api/admin/contracts/accounting-gifi-notes-read', authorityRoute: '/api/admin/contracts/accounting-gifi-notes-read', authorityAction: 'read-accounting-gifi-notes', implementationState: 'implemented-read-only-accounting-gifi-notes' }),
  contract('accounting-gifi-summary-read', 'accounting', ['accounting'], 'Read year-specific GIFI staging and mapping readiness without request-time schema mutation.', { status: 'implemented', route: '/api/admin/contracts/accounting-gifi-summary-read', authorityRoute: '/api/admin/contracts/accounting-gifi-summary-read', authorityAction: 'read-accounting-gifi-summary', implementationState: 'implemented-read-only-accounting-gifi-summary' }),
  contract('accounting-period-locks-read', 'accounting', ['accounting'], 'Read Accounting period lock/close state without creating closure, attachment, or import schema.', { status: 'implemented', route: '/api/admin/contracts/accounting-period-locks-read', authorityRoute: '/api/admin/contracts/accounting-period-locks-read', authorityAction: 'read-accounting-period-locks', implementationState: 'implemented-read-only-accounting-period-locks' }),
  contract('accounting-attachments-read', 'accounting', ['accounting'], 'Read Accounting attachment metadata without request-time table or index creation.', { status: 'implemented', route: '/api/admin/contracts/accounting-attachments-read', authorityRoute: '/api/admin/contracts/accounting-attachments-read', authorityAction: 'read-accounting-attachments', implementationState: 'implemented-read-only-accounting-attachments' }),
  contract('accounting-vendors-read', 'accounting', ['accounting'], 'Read Accounting vendor master data without request-time table or index creation.', { status: 'implemented', route: '/api/admin/contracts/accounting-vendors-read', authorityRoute: '/api/admin/contracts/accounting-vendors-read', authorityAction: 'read-accounting-vendors', implementationState: 'implemented-read-only-accounting-vendors' }),
  contract('accounting-recurring-expense-rules-read', 'accounting', ['accounting'], 'Read recurring Accounting expense rules and due state without request-time schema mutation.', { status: 'implemented', route: '/api/admin/contracts/accounting-recurring-expense-rules-read', authorityRoute: '/api/admin/contracts/accounting-recurring-expense-rules-read', authorityAction: 'read-accounting-recurring-expense-rules', implementationState: 'implemented-read-only-accounting-recurring-expense-rules' }),
  contract('accounting-statement-provider-profiles-read', 'accounting', ['accounting'], 'Read statement provider mappings with in-memory defaults without seeding D1 during GET.', { status: 'implemented', route: '/api/admin/contracts/accounting-statement-provider-profiles-read', authorityRoute: '/api/admin/contracts/accounting-statement-provider-profiles-read', authorityAction: 'read-accounting-statement-provider-profiles', implementationState: 'implemented-read-only-accounting-statement-provider-profiles' }),
  contract('accounting-statement-imports-read', 'accounting', ['accounting'], 'Read Accounting statement imports, import rows, exceptions and provider-profile references without request-time schema mutation or default seeding.', { status: 'implemented', route: '/api/admin/contracts/accounting-statement-imports-read', authorityRoute: '/api/admin/contracts/accounting-statement-imports-read', authorityAction: 'read-accounting-statement-imports', implementationState: 'implemented-read-only-accounting-statement-imports' }),
  contract('accounting-reconciliation-exceptions-read', 'accounting', ['accounting'], 'Read reconciliation exception queue state without request-time statement/import schema creation.', { status: 'implemented', route: '/api/admin/contracts/accounting-reconciliation-exceptions-read', authorityRoute: '/api/admin/contracts/accounting-reconciliation-exceptions-read', authorityAction: 'read-accounting-reconciliation-exceptions', implementationState: 'implemented-read-only-accounting-reconciliation-exceptions' }),
  contract('accounting-vendor-statements-read', 'accounting', ['accounting'], 'Read vendor statement attachment summaries through the non-mutating Accounting attachment authority.', { status: 'implemented', route: '/api/admin/contracts/accounting-vendor-statements-read', authorityRoute: '/api/admin/contracts/accounting-vendor-statements-read', authorityAction: 'read-accounting-vendor-statements', implementationState: 'implemented-read-only-accounting-vendor-statements' }),
  contract('accounting-sales-tax-filing-read', 'accounting', ['accounting'], 'Read the sales-tax filing worksheet without ensuring reconciliation schema during GET.', { status: 'implemented', route: '/api/admin/contracts/accounting-sales-tax-filing-read', authorityRoute: '/api/admin/contracts/accounting-sales-tax-filing-read', authorityAction: 'read-accounting-sales-tax-filing', implementationState: 'implemented-read-only-accounting-sales-tax-filing' }),
  contract('accounting-fixed-assets-read', 'accounting', ['accounting'], 'Read Accounting fixed assets without creating the fixed-assets table during GET.', { status: 'implemented', route: '/api/admin/contracts/accounting-fixed-assets-read', authorityRoute: '/api/admin/contracts/accounting-fixed-assets-read', authorityAction: 'read-accounting-fixed-assets', implementationState: 'implemented-read-only-accounting-fixed-assets' }),
  contract('accounting-evidence-check-read', 'accounting', ['accounting'], 'Read accountant-evidence readiness with explicit schema readiness and no request-time mutation.', { status: 'implemented', route: '/api/admin/contracts/accounting-evidence-check-read', authorityRoute: '/api/admin/contracts/accounting-evidence-check-read', authorityAction: 'read-accounting-evidence-check', implementationState: 'implemented-read-only-accounting-evidence-check' }),
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
    if (item.kind === 'mutation' && item.consumerWritesReady && !item.route) errors.push(`Mutation contract ${item.id} is marked consumer-ready without a dedicated contract route.`);
    if (item.compensatingMovementOnly && !item.requiresOriginalMovementId) errors.push(`Compensating contract ${item.id} must require the original movement id.`);
    if (item.id === 'inventory-reverse' && item.directStockAddBackAllowed) errors.push('inventory-reverse cannot permit direct stock add-back.');
    if (item.id === 'inventory-reverse' && item.status === 'implemented' && !item.requiresCreativePostingId) errors.push('implemented inventory-reverse must require the current Creative posting id until generic reversal provenance exists.');
    if (item.id === 'inventory-reverse' && item.status === 'implemented' && item.confirmationText !== 'REVERSE INVENTORY') errors.push('implemented inventory-reverse must retain explicit typed confirmation.');
    for (const consumer of item.consumers) if (!modules.has(consumer)) errors.push(`Contract ${item.id} has unknown consumer ${consumer}`);
  }
  for (const definition of modules.values()) {
    for (const capability of definition.consumes || []) {
      const declared = byId.get(capability);
      if (!declared) { errors.push(`${definition.id} consumes undeclared contract ${capability}`); continue; }
      if (!declared.consumers.includes(definition.id)) errors.push(`${definition.id} is not an allowed consumer of ${capability}`);
    }
  }
  return Object.freeze({ ok: errors.length === 0, errors: Object.freeze(errors) });
}

export function moduleContract(contractId, contracts = DD_MODULE_CONTRACTS) {
  return contracts.find((item) => item.id === String(contractId || '').trim()) || null;
}
