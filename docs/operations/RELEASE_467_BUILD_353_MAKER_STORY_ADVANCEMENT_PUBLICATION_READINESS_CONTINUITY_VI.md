# Release 467 Build 353 — Maker Story Advancement & Publication Readiness Continuity VI

Build 353 succeeds exact Build 352 Development/Production GREEN and re-measures all five active Creative Projects without automatic advancement.

## Maker Story boundary
- Factual result/lesson evidence remains required.
- Story review, public-candidate choice, copy approval/locking and publication remain explicit human actions.
- Public media rights remain separate and are never inferred from story readiness.
- Provider/social publication remains closed.

## Admin-home hang repair
- Cached/provisional identity may render static navigation but cannot start Seller Daily live D1 reads.
- Live Seller Daily data starts only after dd:auth-verified confirms an administrator.
- /api/auth/me is bounded to 6 seconds and degrades safely while retaining cached identity.
- Context-help observer startup is deferred on lean Admin routes, including /admin/.

## Etsy Development OAuth repair
- Etsy authorization remains exact-Development-host only; Production stays closed.
- OAUTH_PROVIDER_AUTHORIZATION_MODE=development-explicit is part of the Development configuration.
- Dedicated OAUTH_TOKEN_ENCRYPTION_KEY_V1 remains preferred. If absent, Etsy only may use a domain-separated AES-256 key derived from the already configured ETSY_SHARED_SECRET. Derived ciphertext is tagged e1 so a future dedicated key does not make existing Etsy ciphertext unreadable.
- Secret/token values are never emitted and listing writes/publication remain locked.

Next: Build 354 — Content Adoption & Discovery Outcomes Renewal IX.
