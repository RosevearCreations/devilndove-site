# Operator Testing Surface Policy

Effective with Release 467 Build 354, manual interactive testing is performed directly on **https://devilndove.com/** after an exact GREEN Development tree is promoted to main. The Cloudflare Preview URL is not the normal operator/manual testing surface. Development and canonical Preview remain automated release-proof surfaces.

Etsy OAuth connection acceptance is initiated from **https://devilndove.com/admin/it-integrations/** and uses **https://devilndove.com/api/social/oauth/etsy/callback** as the required redirect URI. Connecting Etsy does not authorize listing creation, editing, activation, deactivation, draft writes or publication. This policy remains the default until the operator explicitly changes it.
