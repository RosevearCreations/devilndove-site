# Devil n Dove — Project Status and Roadmap

## Current release

**Release 467 Build 30 — Admin Account Security + Release-State Cleanup is GREEN in Development and Production.**

Accepted Development runtime: `873d9819332a92d9eb7b0eea7ea99c311bb7734d`, tree `4d3a1720bf09aba0fdba0f5927314f3ef1b56bea`; System Gate `33781662628`, Build 30 Proof `33781662644`, Branch Hygiene `33781662638` SUCCESS.

Final Development closure source: `0c056b9fc87164f63f1828212d62de288c3f3ff1`, tree `07c7e9e542dfa7fcb0e93c1e1c5e270a295129ff`; exact closure System Gate `33782423050` SUCCESS.

Accepted Production runtime: `main` `239fff2fc24529cfe5d1d0883ee8d7f0d6d411eb`, tree `07c7e9e542dfa7fcb0e93c1e1c5e270a295129ff`; Production Pages Deploy `33782747132` SUCCESS. Production proved the exact Development tree, preserved business counts, applied/proved canonical migrations, verified isolated D1 and Production bindings, deployed exact main SHA, passed public smoke, and preserved promotion proof.

Build 30 adds user-directory password administration, temporary-password generation/copy/reveal, member Account eye controls, audited admin resets without requiring the prior password, and optional target-session invalidation. Stored existing passwords remain unreadable because only one-way hashes are retained.

I.T./Admin readiness treats superseded GREEN tests/preflights as historical evidence rather than recurring open requirements. Explicit external HOLD lanes remain visible as deferred work and are not falsely marked passed.

Canonical migrations remain exactly `0001`–`0004`.

## Next

Start Build 31 from the synchronized Build 30 authority descendant. Select the next bounded business/application gap from current evidence; do not reopen completed preflight prerequisites or external HOLD lanes merely to create scope.
