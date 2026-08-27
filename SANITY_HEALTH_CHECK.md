# Sanity Health Check — Development Build 443

Build 443 is current. Build 442 closed its exact Development source/Windows/Cloudflare checkpoint at `b8868c9b77ad12de4fee4984274fe80e1d096613`; unfinished work is represented only as current Build 443 HOLDs.

## Canonical source gate

```bash
python scripts/build443_current_sanity_check.py
python scripts/build440_product_inventory_tools_source_gate.py
node --check functions/api/home-carousel.js
node --check functions/api/admin/home-carousel.js
node --check public/js/home-carousel.js
node --check public/js/admin-home-carousel.js
git diff --check
```

## Current state

- Carousel schema/API/editor/runtime/local regression: **source GREEN candidate**
- Static Home hero when schema/API/slides/first image is unavailable: **required fail-safe**
- Carousel Development D1/live acceptance: **CAR-443-H1 HOLD**
- I.T. D1/Phase B: **IT-443-H1/H2 HOLD**
- Stripe/PayPal: **PAY-443-H1/H2 HOLD**
- CAIP private media: **CAIP-443-H1 HOLD**
- Separate live Production: **CLOSED**

CI may test source but must never apply D1 or mutate providers/Production.
