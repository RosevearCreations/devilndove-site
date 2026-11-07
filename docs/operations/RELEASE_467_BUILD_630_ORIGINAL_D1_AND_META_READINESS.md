# Build 630 — Original bound D1 migration readback, actual archive GET and signed owner readiness

**The software release can be GREEN while original external Meta and Comms trust remain HOLD.**
This build adds **Admin section 51** and `GET/POST /api/admin/trust-original-readiness-630`.
It reads the **currently bound, live Cloudflare D1 database**, verifies the actual
SQLite table definitions, column names, four append-only triggers and real
`d1_migrations` history entries for **0052–0064**. It does not change D1 schema,
enroll credentials, sign for the original owner, or automatically send an HTTPS request.

The deployed D1 binding's original account and database ID **cannot be inferred**
from `sqlite_master`, so the report intentionally declares
`original_database_identity_independently_attested:false` even if all SQL checks
pass. The actual owner must separately confirm the binding in Cloudflare.

## Owner-supervised D1 walkthrough

1. On the **original source operator's device**, sign in to the **correct Cloudflare
   account** using the local Wrangler browser authorization; never send us a token.
   Confirm the account, D1 **database name and ID**, deployment environment and
   backup/restore option directly in Cloudflare before acting.
2. From a clean, current `devilndove-site` checkout inspect `wrangler.toml`
   and `migrations/canonical`. The checked-in config names development database
   `devilndove-dev` (ID `dbc1615b-dcbe-4951-973b-b47c99c73bfa`);
   **do not assume this is the Production D1 binding**. Confirm Production
   separately in Pages/Workers environment settings.
3. Check migration history **read-only** using the specific original verified
   database identity, e.g. from PowerShell at the repo root:

   ```powershell
   npx wrangler whoami
   npx wrangler d1 migrations list devilndove-dev --remote
   npx wrangler d1 execute devilndove-dev --remote --command "SELECT name FROM sqlite_master WHERE name IN ('dd629_original_meta_archive_readbacks','dd629_original_meta_go_live_decisions')"
   ```

   These commands are for the **confirmed development database only**; the
   readback endpoint itself does not require the owner to paste credentials.
4. If migrations **0052–0064** are not recorded, **stop**. Obtain a fresh
   backup/restore bookmark, review the SQL files in `migrations/proposed`, obtain
   explicit original-owner authorization, then have the authorized operator
   arrange sequential **development-first** Wrangler migration application with
   proper migration history. No `CREATE TABLE` in Build 630 or GitHub CI applies
   these proposals. Validate Development before independently approving Production.
5. In Devil n Dove **Admin section 51**, click **READ ONLY: Verify deployed D1
   migration schema, triggers and Wrangler history**. The result lists precisely
   missing schema elements and migration filenames. A valid original-host account
   still needs to be independently confirmed on the owner's device.
6. Revisit **Admin sections 44–50** for an unexpired original issuer/witness/owner
   evidence chain, genuine Meta Page-ID single-GET receipt, saved three-party 627
   and 628 packets and the **two original public HTTPS archive URLs**.
   Tests, invented receipts and public GitHub copies do not qualify.
7. With real signed custody, current original authorization and a verified
   live D1 schema/ledger, enter the exact immutable `custody_sha256`, check the
   **explicit consent for TWO external archive HTTPS GETs**, enter owner admin
   step-up and click **Owner-supervised FIRST GENUINE independent archive byte GETs**.
   This delegates to the existing Build 629 one-time byte-comparison operation.
   It fails without the real public archives or if any byte differs. It records
   **one** immutable success only if both raw packets match the same original
   signed 627 packet.
8. In **section 50**, prepare a fresh unsigned owner readiness decision; have the
   original independent `ISSUER`, `WITNESS` and `OWNER` separately verify and sign
   the **same** short-lived payload using their own original private keys. Record
   the actual public signatures under the Build 629 immutable decision table.
   A missing, HOLD, replayed or expired decision remains HOLD.
9. Back in **section 51**, click **Reconcile latest ORIGINAL owner-signed Meta
   readiness with bound live D1**. This checks actual migration history, saved
   two-host byte receipt, original 627/628 source and the **latest** signed 629
   decision. The result is a readiness statement only; it **never opens a Meta
   channel or starts publication**. A later signed HOLD supersedes an older approve.

## Separate Comms authentication: do not confuse with Meta

Rosevear Comms Hub is a separate trust system. Ree's original source owner
Windows host `DESKTOP-AE894KC` (`C:\Users\ree`), Jack's independent master
owner laptop `TEMPLAR` (`C:\Users\jfros`), their separate Ed25519 authorities,
the private Supabase-enrolled receiver and source-owned QL-364 one-use GET each
need their **own original evidence**. GitHub code promotion does not enroll them.

Read the Comms Hub source documentation:

- `docs/build-records/QL-340B_OFFLINE_OWNER_SIGNING_AND_FIELD_HANDSHAKE.md`
- `runtimes/hub-relay/ql357-windows-owner-activation.ps1 -Status`
- `runtimes/hub-relay/ql362-windows-source-owner-handoff.ps1 -Status`
- `docs/QL364_SOURCE_OWNED_HEALTH_DISTRIBUTION.md`

On both devices, inspect the **clean** original Comms repo first, pull `main` only
if clean, then invoke the status scripts, never the live action parameters without
independent trust and original-owner consent. Only the source and master public
candidates may cross devices; private PEM, signing passphrases, Supabase DB
credential, OAuth tokens and customer data must never enter chat or GitHub.

For ChatGPT to access Rosevear Comms as an external tool, a **separately
authenticated scoped MCP interface** (or supported private Secure MCP Tunnel)
must first be installed as a trusted ChatGPT plugin. The current internal Comms
receiver is not itself evidence that such a ChatGPT MCP connection exists.

## Verification and failure boundaries

- `GET` performs only authenticated, `no-store` original D1 introspection and
  returns real missing 0052–0064 ledger/schema objects. It never calls Meta.
- `POST` rejects non-admin, cross-origin, missing hash, missing password,
  incomplete migration history and unapproved HTTPS archive fetching.
- Both permitted `POST` operations delegate to the original Build 629
  issuer/witness/owner verification and step-up logic: one-time archive fetch
  or independently reverify the **latest** signed decision. No substitute signer
  and no autonomous go-live.
- Tests include a genuine SQLite-created `sqlite_master` and `PRAGMA` snapshot,
  all thirteen migration records, missing migration, altered immutable trigger,
  missing signed-decision column and unauthorized HTTP access; test fixtures are
  not original D1, original archive or original Meta provider proof.
- Returned `original_meta_read_only_readiness_certified:true` may only mean
  the **separate** short-lived, signed owner **readiness** is current. Every
  response still reports `connected:false`, `publishing_enabled:false`,
  `provider_get_performed:false`, `migration_auto_applied:false`, and `HOLD`.
- The measured runtime footprint increases from the merged Build 629 baseline
  of **1,837 files / 18,395,500 bytes** to **1,839 files / 18,412,181 bytes**.
  The reviewed cap advances narrowly to **1,839 files / 18,413,000 bytes**;
  the individual JS/CSS/HTML caps and all protected quality/migration gates
  are unchanged.

```sh
node --test scripts/release467_build630_original_migration_meta_readback.test.mjs
node scripts/release467_build609_ci_bundle.mjs
python3 scripts/migration_policy_gate.py
python3 scripts/release465_performance_budget_gate.py
python3 scripts/current_application_quality_gate.py
```

Sources: [Cloudflare D1 Wrangler commands](https://developers.cloudflare.com/d1/wrangler-commands/),
[D1 migrations](https://developers.cloudflare.com/d1/reference/migrations/),
[OpenAI custom MCP server setup](https://developers.openai.com/api/docs/guides/custom-mcp-server),
[OpenAI private MCP tunnel](https://developers.openai.com/api/docs/guides/tools-connectors-mcp).
