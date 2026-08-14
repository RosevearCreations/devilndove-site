# Historical Build Evidence

This folder contains retired Build-specific validation, changed-file, testing, lifecycle and file-manifest Markdown records. They are preserved traceability evidence only and must not override the two current cross-project authorities at the repository root:

1. `AI_HANDOFF.md`
2. `PROJECT_STATUS_AND_ROADMAP.md`

## Build 248 archive rule

Build 248 removed superseded `BUILD*.md` duplicates from the repository root. Only the **current Build** changed-files/validation Markdown pair should remain at root. When a later Build becomes current, move the previous current release Markdown pair here rather than leaving multiple competing “current” release summaries at root.

Numbered SQL migrations remain at the repository root because migration order, deployment and D1 recovery depend on their stable filenames. Specialist design/reference documents may retain an older Build number when that number identifies a fixed specialist baseline rather than current application state.
