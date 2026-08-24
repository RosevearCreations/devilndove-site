# Build 299 Validation — Packaging Print Source Consistency

Status: **Development candidate — live browser proof required**

Base: `3a19ebc263a206acd22e6490327ffa32567e4a8a` (completed Build 298 parity)

## Local regression

After pulling `dev`:

```bash
python scripts/build299_packaging_print_source_consistency_test.py
```

Expected final lines:

```text
BUILD 299 PACKAGING PRINT SOURCE CONSISTENCY: PASS
No Cloudflare resource was contacted.
```

## Development browser proof

Open the Development Packaging Studio, hard-refresh once, then open an existing Packaging project.

### 1. Controller status

```js
console.table(window.DDPackagingPrintSource?.getStatus?.());
```

Expected before printing a saved historical version:

```text
build                                  299
state                                  active
defaultSource                          project-draft
lastPrintSource                        project-draft
savedVersionPrintCount                 0
lastVersionId                          0
lastVersionStatus                      0
lastVersionError                       ""
artifactPath                           /api/admin/packaging-version-artifact
savedVersionsImmutable                 true
historicalVersionMustBeExplicitlySelected true
```

### 2. Normal project-save / draft-print proof

1. Make a harmless reversible Packaging wording change.
2. Click **Save project**.
3. Open **Print Test**.
4. Confirm the first selector now reads **Print source / evidence version** and is set to **Project draft**.
5. Click **Print optimized 8.5 × 11 sheet**.

Expected:

- the generated sheet reflects the current project details;
- no request is made to `/api/admin/packaging-version-artifact` because the proven mature-editor draft print handler remains authoritative;
- no request is made to `/api/admin/packaging-studio`;
- normal Save remains `POST /api/admin/packaging-write -> 200`.

### 3. Immutable saved-version proof

If the project already has a saved review version, select one explicitly in **Print source / evidence version**, clear Network, then click **Print optimized 8.5 × 11 sheet**.

Expected Network request:

```text
GET /api/admin/packaging-version-artifact?packaging_project_id=<id>&packaging_project_version_id=<id> -> 200
```

The printed sheet must show that historical version exactly even if the live Project draft has since changed.

Then run:

```js
console.table(window.DDPackagingPrintSource?.getStatus?.());
```

Expected semantic result:

```text
build                    299
state                    active
lastPrintSource          saved-review-version
savedVersionPrintCount   >= 1
lastVersionId            > 0
lastVersionStatus        200
lastVersionError         ""
```

### 4. Version immutability check

After printing a saved review version, return to the Versions tab. No new version should have been created and the selected version number/created date must remain unchanged. Build 299 reads the stored SVG; it never updates the historical row.

## Safety boundary

Build 299 must preserve:

- mature editor Build 298 source unchanged;
- Build 298 native read/write client unchanged;
- Build 297 compatibility defenses still loaded;
- Build 293/286 Packaging read authority unchanged;
- Build 292/291 Packaging write authority unchanged;
- Build 294 retired-route tombstone unchanged;
- no SQL/schema changes;
- no Cloudflare binding/config changes;
- no R2 changes;
- no real Production contact.

Do not resume browser-compatibility retirement until both draft-print and saved-version-print proofs pass in Development.
