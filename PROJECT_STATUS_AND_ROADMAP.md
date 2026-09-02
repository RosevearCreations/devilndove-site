# Devil n Dove — Project Status and Roadmap

## Current Development

**Release 467 Build 21 — Release State, Branch & CI Hygiene Convergence** is the active Development candidate.

Its exact green predecessor is **Build 20 — Workshop Tool & Equipment Readiness Command Center**:

- `dev`: `7b38af543400a81593a8dc1b7caa4ad9a43033ea`
- tree: `550272841e764d77fc21297abede3d4cae1aaea0`
- System Gate `33688666947` — SUCCESS
- Build 20 Proof `33688733720` — SUCCESS

Build 20 completed the bounded internal operations sequence with a read-only workshop readiness projection over existing Tool Lifecycle and Inventory authority.

## Production

Production is also **Release 467 Build 20**:

- `main`: `055cbc973c667b35a209c7ea207779089f6fed3a`
- tree: `550272841e764d77fc21297abede3d4cae1aaea0`
- Production Pages Deploy `33688892602` — SUCCESS

Build 21 does not authorize a Production promotion. Production remains on Build 20 unless a later deliberate promotion is explicitly approved and independently proven.

## Build 21 objective

Build 21 closes release/repository governance drift without changing application behavior:

- synchronize `current-development-authority.json`, handoff, roadmap, sanity and Markdown index;
- retain exact Build 20 Development and Production provenance;
- make `main` and `dev` the only persistent core branches;
- prune merged non-core branches safely;
- archive the two known unique legacy branch tips before deletion;
- retain unknown unmerged branches with warnings;
- make Builds 16–20 proof workflows manual historical checks instead of automatic fanout;
- retain canonical System Gate plus Build 21 proof as current automatic validation.

Canonical migrations remain exactly `0001`–`0004`. No runtime application files, D1/R2 business data, provider state or Cloudflare Access policy are changed by Build 21.

## Current operating architecture

The administrator application remains grouped into Storefront, Creator, Finance and I.T. workspaces while runtime permission authority remains Storefront, Creators, Socials, Financials and I.T. Build 10 remains the I.T. technical first stop; Build 11 remains the daily cross-business operations first stop.

Builds 14–20 remain retained authorities for Product quality, Storefront/SEO parity, Custom Request/Made Today, Creator/Content completeness, Order Fulfillment/Customer Care, Inventory Replenishment/Procurement Readiness and Workshop Tool/Equipment Readiness.

## External lanes

These remain **HOLD_EXTERNAL** unless independently proven with current evidence:

- Cloudflare Access service-token acceptance;
- Stripe Development acceptance;
- PayPal sandbox acceptance;
- Social/OAuth acceptance.

CAIP private-media acceptance remains evidence-dependent. Source-green status never substitutes for provider/runtime acceptance.

## Business and safety policies retained

- Canada-only fulfillment remains authoritative.
- U.S. sales/shipping suspension remains intact.
- exactly one H1 remains required on public pages.
- provider execution/publication is closed unless explicitly opened by the owning acceptance authority.
- Production business data is owned by Production and must never be blindly replaced from Development.
- schema changes must use canonical migrations; request-time DDL remains prohibited.

## Next roadmap after Build 21

Once Build 21 is Development GREEN, select the next bounded product/business improvement from the current application rather than reopening completed Build 14–20 work. External acceptance lanes may be addressed deliberately when credentials/session/operator authorization are available; otherwise they remain HOLD_EXTERNAL without blocking safe internal development.

Do not move Build 21 to `main` automatically. Production currently remains Build 20 at `055cbc973c667b35a209c7ea207779089f6fed3a` / tree `550272841e764d77fc21297abede3d4cae1aaea0`, Production Pages Deploy `33688892602` SUCCESS.
