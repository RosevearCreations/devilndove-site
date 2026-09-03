# Devil n Dove — Project Status and Roadmap

## Current Development

**Release 467 Build 30 — Admin Account Security + Release-State Cleanup is DEVELOPMENT GREEN.**

Accepted runtime: `873d9819332a92d9eb7b0eea7ea99c311bb7734d`, tree `4d3a1720bf09aba0fdba0f5927314f3ef1b56bea`; System Gate `33781662628`, Build 30 Proof `33781662644`, Branch Hygiene `33781662638` SUCCESS.

Build 30 adds user-directory password administration, temporary-password generation/copy/reveal, member Account eye controls, audited admin resets without requiring the prior password, and optional target-session invalidation. Existing stored passwords remain unreadable because only one-way hashes are retained.

The I.T./Admin readiness surfaces now treat superseded GREEN checks as historical evidence instead of recurring open requirements. Explicit external HOLD lanes remain visible as deferred work and are not falsely marked passed.

Production remains Build 20 until the separately requested Build 30 promotion is merged and independently verified. Canonical migrations remain exactly `0001`–`0004`.

## Next

Complete the explicitly requested Build 30 Production promotion from this exact GREEN Development descendant, verify Production independently, synchronize Production evidence back into both persistent branches, then begin Build 31 from the clean synchronized authority.
