# 06 — Intelligence and Story Model

## Current deterministic analysis

Build 201 uses no external AI. It creates a transparent score from recorded metadata:

- source-selected/featured state;
- source media type;
- recorded selection/merchandising score;
- dimensions when recorded;
- recorded image/variant role;
- source safety and CAIP restriction state.

It produces component scores:

- **Technical** — whether metadata suggests an asset may be technically useful;
- **Story** — whether order/role/type makes an asset useful in a narrative;
- **Reuse** — whether source safety and CAIP rights allow a reviewer to consider it;
- **Review** — a weighted indicator, never a quality guarantee;
- **Confidence** — confidence in available metadata, not in the visual/content truth.

Each record includes reasons and is labelled a review aid.

## Future intelligence contract

A provider result must include:

```json
{
  "provider": "provider-name",
  "model_or_recipe": "version",
  "run_id": "correlation-id",
  "input_asset_fingerprint": "stable-source-fingerprint",
  "purpose": "transcript|scene-tags|technical-probe|copy-draft",
  "output": {},
  "evidence": [],
  "confidence": 0,
  "requires_human_review": true,
  "cost": {"unit": "", "amount": 0},
  "data_handling": {"private_transfer": false, "retention": ""}
}
```

No provider output may overwrite a human fact, product field, rights state, or locked editorial copy automatically.

## Story model

CAIP treats story as an evidence-linked sequence, not a single generated paragraph:

1. **Hook** — show the finished piece or an accurate project view.
2. **Context** — why/what the source record says this project is.
3. **Details** — materials/process/condition/finish only when evidence supports it.
4. **Proof/media** — selected source references, never generic placeholders.
5. **Next step** — only a verified listing, custom-request, educational, or follow action.

Every segment has evidence keys. The editor can lock wording. Content Studio then turns that controlled input into channel-specific deliverables, and Release Board retains public-release authority.

## Recommendation model

A role recommendation answers “what may be worth reviewing for this role?” It does not decide “what is best,” “what is truthful,” “what will perform,” or “what can be published.”

Current roles: website hero, gallery lead/detail, YouTube thumbnail candidate, short-video opening/supporting clip. Future roles can add product carousel, marketplace listing, knowledge-base illustration, before/after pair, and accessible description candidate only with purpose-specific review rules.
