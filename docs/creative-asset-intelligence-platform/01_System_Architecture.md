# 01 — System Architecture

## Design choice: a control plane, not a second asset store

CAIP is a control plane layered on top of existing Devil n Dove records. Original bytes remain in their existing homes. This is important for R2 cost/control, existing storefront links, content-media protection, and recoverability.

```text
                    ┌───────────────────────────┐
                    │ Existing product / consent │
                    │ / media / R2 source truth  │
                    └─────────────┬─────────────┘
                                  │
                     product approval / refresh
                                  │
                    ┌─────────────▼─────────────┐
                    │ Content Automation Studio │
                    │ package, selection, plan  │
                    └─────────────┬─────────────┘
                                  │ reference-only sync
┌─────────────────────────────────▼─────────────────────────────────┐
│ CAIP control plane                                                  │
│ identity · asset registry · source safety · review metadata        │
│ deterministic analysis · evidence ledger · story spine             │
│ reuse recommendations · policy decisions · runs/events/manifests  │
└───────────────────────┬───────────────────────────────┬──────────┘
                        │                               │
                   human review                    approved future adapters
                        │                               │
        ┌───────────────▼──────────────┐    ┌──────────▼──────────┐
        │ Content Release Board / Queue │    │ renderer / OAuth /   │
        │ explicit release authority    │    │ private transfer jobs│
        └──────────────────────────────┘    └─────────────────────┘
```

## Components

### 1. Source adapters

Build 201 has a Content Studio adapter. It reads `content_projects` and `content_project_media`. Future adapters must use the same contract: stable source ID, canonical URL/object identifier, source safety/consent state, media type, metadata, and immutable provenance.

### 2. Creative project identity

`creative_projects` turns one Content Studio package into one CAIP project. It can later represent a custom order, detailing job, education piece, collection, or campaign without redesigning the entire system.

### 3. Canonical asset registry

`creative_assets` is a source reference registry. It tracks source IDs, URLs, logical CAIP paths, source fingerprints, source safety, CAIP rights restriction, asset status, tags, and notes. The logical path is a naming convention, **not** a copied object path.

### 4. Intelligence execution plane

`creative_asset_analyses` and `creative_intelligence_runs` hold deterministic metadata review today. Future AI providers must use the run contract: input snapshot, provider/version, output evidence, confidence, failure state, cost/usage data, human-review flag, and reproducibility keys.

### 5. Narrative provenance plane

`creative_story_evidence` stores actual source-backed statements. `creative_story_segments` assembles only those statements into editable narrative phases. The segment never becomes public just because it exists.

### 6. Decision plane

`creative_policy_decisions`, `creative_asset_recommendations`, and `creative_project_events` capture why CAIP suggested something, whether a human accepted/rejected it, and what changed over time.

### 7. Delivery plane

CAIP supplies reviewed inputs to existing Content Studio, Content Release Board, Social Queue, and future renderer/platform adapters. It is intentionally not a delivery executor.

## Integration rules

- Content Studio remains the media-selection/source-safety authority.
- CAIP public-use state cannot exceed source public authority.
- Release Board remains the public website release authority.
- The Social Queue remains its existing channel-review authority.
- Product records remain catalog truth; CAIP does not write catalog facts back automatically.
- Any future provider runs must be additive and recoverable; a provider outage cannot prevent product operations or delete source media.
