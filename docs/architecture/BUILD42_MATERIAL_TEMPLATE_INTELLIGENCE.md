# Release 467 Build 42 — Material Template Intelligence

## Purpose

Build 42 extends the existing Packaging Studio Material Library rather than creating a second material system. Purchased/source material templates remain the reusable authority for supplier identity, source evidence, Master INCI rows, fragrance-allergen review, benefits and claims.

## New reusable intelligence

Each saved Master INCI row may now carry one inherited print policy:

- `required` — inherited as printable and required by default;
- `print_default` — inherited as printable by default;
- `optional` — inherited but non-printing by default;
- `internal_only` — inherited for internal evidence only and non-printing by default.

Each row also carries review-first provenance:

- `needs_review`;
- `supplier_declared`;
- `supplier_verified`;
- `owner_verified`;
- `internal_note`.

These states describe evidence provenance only. They do not replace cosmetic, bilingual, ingredient, allergen or other regulatory review.

## Inheritance behavior

When Packaging Studio applies a source-material template to an open label, Build 42 normalizes the resulting structured ingredient rows before returning success:

1. canonicalize INCI identity;
2. remove duplicate inherited rows deterministically;
3. preserve the most complete existing row data;
4. apply the strongest inherited print policy when the same INCI appears through more than one attached source;
5. perform a fresh authoritative Packaging read-back before the editor receives the final success payload.

The established Packaging domain service remains responsible for attaching the source and performing the original base-replacement/additive-append behavior. Build 42 is additive and does not duplicate that business rule.

## Build 42 / Build 43 boundary

Build 42 owns **reusable material-template defaults** and deterministic inheritance. Build 43 will own **per-label composition and overrides**, including the label-specific "What Will Print" view. Build 42 therefore never silently converts a template default into a permanent label-level override.

## Data and infrastructure boundary

Build 42 introduces **no schema migration** and performs **no request-time DDL**. It reuses:

- `packaging_source_material_templates.master_inci_json` for structured per-template ingredient intelligence;
- `packaging_content_library.metadata_json` for reusable content provenance/policy projection;
- existing `packaging_project_ingredients` rows for normalized inherited label content.

No R2, provider, Access, `main`, Production, or Production data mutation belongs to Build 42.

## Runtime files

- `functions/api/admin/packaging-material-intelligence.js`
- `public/js/admin-packaging-material-intelligence-v42.js`
- `public/js/admin-packaging-compatibility-v301.js` — additive loader/status projection only
- `scripts/current_packaging_material_intelligence_gate.py`

## Forward gate

`Current Application Quality Proof` requires the Material Template Intelligence gate. The gate rejects missing policy/provenance states, lost dedup/read-back behavior, Build 42 schema migrations, request-time DDL, loss of the Packaging compatibility loader, or collapse of the Build 42/43 responsibility boundary.
