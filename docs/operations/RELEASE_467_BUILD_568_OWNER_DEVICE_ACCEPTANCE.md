# Release 467 • Build 568 — Owner Device Acceptance & Targeted Admin Corrections

## Evidence-backed scope

The owner has not supplied a new device screenshot or explicit acceptance decision for this build. A read-only browser inspection of the live Product Editor (desktop Chrome, 1363 × 936 viewport) found a concrete layout issue: a decorative second Product Editor banner took **226 px** above the real Product title/identity hero, so the four-area form began near the bottom of the initial viewport. The owner already has the functional hero, and the duplicate banner is only artwork.

Source CSS review identified two additional narrow-screen issues:

1. Set 17 image banners forced their art to at least **820 px** below 740 px screen width. This could require horizontal scrolling to read the entire artwork on a phone.
2. The adaptive seller dock is fixed at the bottom below 760 px, while Search and Resume used independent fixed bottom offsets of 10 and 60 px. Those launchers could cover dock actions instead of clearing them.

## Targeted correction

| Target | Change | Boundary |
| --- | --- | --- |
| Product Editor only | Hide the redundant Set 17 banner; keep the real Product title, form, identity, Save and all four areas | Other nine Set 17 Admin pages retain their artwork |
| Set 17 artwork on small screens | Remove the 820 px forced width; fit the complete image within available screen width | No image text is cut off; decorative image remains `aria-hidden` |
| Seller adaptive shell at 760 px and below | Reposition Search and Resume above the bottom dock, preserve side spacing, and add enough page-bottom scroll clearance | The selector requires `#ddAdaptiveShell.dd-seller-shell`; buyer controls unchanged |
| Cache propagation | Revise Set 17 CSS links on its ten existing Admin pages and all three adaptive-shell stylesheet references in middleware | No authentication, API, D1, R2, inventory or provider write paths altered |

The Product Entry 2.0 contract from Build 567 remains intact: Details, Recipe, Photos, Destinations, a local Save Product, exact Etsy listing verification and explicit manual channel handoff.

## Owner acceptance — not inferred

| Review item | Status |
| --- | --- |
| Static and focused UI source contracts | Automated checks required in CI |
| Read-only desktop Product Editor inspection | Observed duplicate banner and tested targeted source correction |
| Phone/tablet physical rendering and touch navigation | **PENDING owner sign-off** |
| Authenticated saved-Product/Etsy remote identity and photo review | **PENDING owner sign-off** |
| External publication, payment, provider upload or D1 operation | **Not performed** |

No authenticated owner device interaction, provider write, remote Product save or personal sign-off was performed by this build. Production release GREEN establishes deployment and resource integrity only. The owner must still review the experience on their real devices.

## Release gates

- New Build 568 source regression verifies scoped banner retirement, mobile art fit, seller-dock offset/clearance, cache-busted references, Product/Channel contract preservation and no false provider claims.
- Run the inherited Build 500–568 tests and deterministic Admin inventory `--check`.
- Require Development System Gate (including Preview deploy), Application Quality, I.T. Runtime and Branch Hygiene GREEN before the exact `dev → main` merge.
- Require Production Pages Deploy, live `/release-version.json` with `build=568` / exact `main` SHA, resource HTTP/readback and independent Production Live Resource Integrity Proof GREEN.

## Next queued

**Build 569 — Admin Device Feedback Closure & Owner-Safe Acceptance Readback.** Incorporate the owner's actual desktop/phone observations, close only confirmed residual issues and retain unverified channel work behind explicit approval.
