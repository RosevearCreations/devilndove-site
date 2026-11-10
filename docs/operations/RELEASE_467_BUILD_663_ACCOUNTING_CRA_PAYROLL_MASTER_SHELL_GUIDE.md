# Release 467 Build 663 — Accounting, Canadian Sales Tax & Payroll Readiness

## Original source application

The existing [Accounting workspace](https://devilndove.com/admin/accounting/) gains a **CRA & Payroll Readiness** card. A verified Accounting Admin chooses a source period and explicitly requests a read-only comparison:

- Accounting's original accounting_order_records service: **all-time, not month-filtered** booked, paid, outstanding, nominal recorded tax-liability cents, and record count. Currency composition is **not independently verified**, so these figures are not labelled CAD cash or reconciled to the selected tax month. The new response never exposes customer names, email or order identifiers.
- The original accounting_reconciliation_reviews sales-tax worksheet: review state, collected/input/net amounts and evidence counts. A worksheet is **not** a CRA GST/HST filing.
- Payroll: no independently verified employee roster, employee/contractor classification, CRA payroll account, wages, deductions, remittances or T4 authority is claimed. Workshop time and Admin actor IDs are **not** proof of employment.

Missing source tables/columns produce **unknown / HOLD**, never synthetic zero-valued financial records. No request-time DDL, invoice edit, journal, provider charge, GST/HST registration, government filing, worker access grant or payroll action is introduced. This is a review of existing Accounting authority, not a second ledger.

## Canadian field and owner acceptance

1. Log in as a verified Accounting Admin, open Accounting, select an actual YYYY-MM month, and inspect the source summary and original sales-tax worksheet. Confirm financial amounts against genuine issued invoices, payments/refunds, reconciliation and close.
2. With our accountant, confirm the legal business and GST/HST registration status, taxability/place of supply of actual products, invoice disclosures, reporting period, input tax credit documents and whether collection/remittance is required.
3. Independently determine whether any real person is employed or is a self-employed contractor/owner maker. Only if required, validate the employer payroll program account, employee documentation, deductions, remittances and T4 steps. Do not convert Build 662 task minutes into pay.
4. Inspect positive Accounting Admin access and genuine separate non-Admin denial on original devices. Record distinct field evidence and owner decisions; do not call an automated test a worker or accountant signoff.
5. Perform no CRA submission or provider payout unless there is separately verified business authority, consent and accountant/regulatory acceptance.

## Official CRA sources (reviewed 9 November 2026)

- [GST/HST registration and the small-supplier rules](https://www.canada.ca/en/revenue-agency/services/tax/businesses/topics/gst-hst-businesses/when-register-charge.html).
- [GST/HST charging, place of supply and invoices](https://www.canada.ca/en/revenue-agency/services/tax/businesses/topics/gst-hst-businesses/charge-collect-which-rate.html).
- [GST/HST supporting records](https://www.canada.ca/en/revenue-agency/services/tax/businesses/topics/gst-hst-businesses/calculate-prepare-report/gst-hst-records-keep.html).
- [Determine if a payroll account is needed](https://www.canada.ca/en/revenue-agency/services/tax/businesses/topics/payroll/open-manage-payroll-account/determine-need-register.html).
- [Set up real employee payroll records](https://www.canada.ca/en/revenue-agency/services/tax/businesses/topics/payroll/set-up-new-employee.html).

The general small-supplier GST/HST threshold must be assessed over both a single quarter and the preceding four quarters, with associated taxable supplies and exceptions considered. Our partial Accounting totals cannot decide legal registration status.

## Our Master Shell responsibilities

**Source / reporting slave:** Devil n Dove is an independently owned-business shell, source ID devilndove, repository RosevearCreations/devilndove-site. It owns actual Product, Creative Project, workshop, inventory, Orders and Finance. The label “slave” describes reporting to suite-level masters only; it does not authorize Master Sysop or other businesses to change source data.

**Master 1 — AI Data Platform:** suite-wide intelligence, evidence freshness, module completion, security and analytics. **Master 2 — Rosevear Comms Hub:** authorized communications, incidents and operator follow-up. Ree and Jack's Master Sysop identities are outside the Devil n Dove business Admin login.

| Peer application | Intended relationship | Devil n Dove source-verified status |
| --- | --- | --- |
| AI Data Platform | Approved signed health/release/module evidence into Master registry | **HOLD**; local Build 655 preparatory register, but not independent signed enrollment |
| Rosevear Comms Hub | Consented minimized incident/workflow references and operator receipts | **HOLD**; original QL-364 handler exists, but signed TEST and permanent grant unverified |
| Rosie Dazzlers | Separate owned business, shown only under Master oversight | No direct cross-business record grant |
| Yard Workers | Landscaping SaaS source platform shell, not each tenant | No direct Devil n Dove record grant |
| iCamp | Campground SaaS platform shell, not Camp Rosevear tenant | No direct Devil n Dove record grant |
| Rosevear AI Hub | Independent local hardware/runtime health source under Master oversight | No independently signed cross-source connection proven |

The [current source discovery manifest](../../.well-known/rosevear-integration-manifest.json) says source_role business_shell, audience rosevear-master, but contains an **old revision**, no verified origin, no signer key and connection_state DISCONNECTED / HOLD. The guarded QL-336 shell endpoint returns HOLD without private source trust. Legacy V1 endpoints advertise read-only health/capabilities, with event publishing and cross-app commands disabled. Software deployment GREEN does not prove a Master Shell connection.

## Connection procedure requiring original owner approval

1. AI Data/Comms/Ree/Jack ratify the exact source registry, version, event field maps, source/audience/tenant grants and source origin. Re-pin the manifest to a verified current protected main commit.
2. Enroll the real Devil n Dove source signer, original issuer/witness, owner consent and QL-364 one-use private TEST. Verify signatures, replay denial, source identity and evidence custody independently.
3. AI Data accepts only approved signed health, promoted-release, readiness and evidence events under the master V1 envelope, with fresh expiry and ratified module requirements. Aggregation remains owned by AI Data.
4. Comms separately approves consent-scoped incident/workflow routes and acknowledgements. Customer/finance/payroll notes never cross automatically.
5. Verify negative role/tenant tests, one-to-one and fan-out contracts, outage/replay/expiry handling, fresh source status and human owner approval before calling the source CONNECTED. TEST readiness is not a permanent grant.

Build 663 activates **no** publisher, cross-app commands, background heartbeat or customer notification. See [Build 655 source readiness](RELEASE_467_BUILD_655_MASTER_SHELL_SOURCE_READINESS.md), [Build 654 Master Shell assessment](RELEASE_467_BUILD_654_MASTER_SHELL_ASSESSMENT.md), the [Comms QL-365D six-app handoff](https://github.com/RosevearCreations/rosevear-comms-hub/blob/main/docs/handoffs/QL365D_SIX_APP_COMMS_ATTACHMENT_VALIDATION_HANDOFF.md), and the [AI Data Master V1 envelope](https://github.com/RosevearCreations/ai-data-platform/blob/main/docs/BUILD_335_MASTER_SHELL_CONTRACT_V1_CORRELATION_EVENT_ENVELOPE.md) for the existing source acceptance boundaries.
