# Release 467 Build 435 — Brand V3 Theme Tokens & Accessibility

## Standard visual contract

Build 435 retains the seven owner-approved Devil n Dove Brand V3 colours: navy `#1a1230`, royal `#2e1b55`, purple `#5a3a8c`, lavender `#8b6aa9`, gold `#d4af37`, ivory `#f5e6d3`, charcoal `#0e0b14`. Those colours are not replaced by a generic or new theme.

The installed Brand V3 palette is now explicitly named **Standard** through `--dd-v3-standard-*` semantic CSS custom properties in `css/brand-v3-theme.css`. Tokens define background, panel, raised panel, body and secondary text, border, keyboard focus, links, gold accent, action gradients, radius and minimum 44-pixel button/navigation touch targets. The aliases keep a clean boundary for future owner-approved themes, but **Build 435 does not implement a theme switcher or silently change the selected theme.**

### Accessibility acceptance contract

- Visible `:focus-visible` for links, native/form buttons and inputs, summary, tabs and keyboard-focusable elements; panel `:focus-within` border.
- Readable disabled states and placeholder copy; inputs never exceed the available card width.
- Linked content is visibly underlined outside button-style controls so meaning does not rely on colour alone.
- At least 44px vertical targets for navigation links and primary/common buttons; wraps rather than creating wide menus on narrow screens.
- Dark-surface text, secondary text, primary action labels and important accents are checked by executable WCAG-style relative-luminance contrast calculations against real declared palette tokens.
- Reduced-motion handling removes most transitions and animated effects when requested. Forced-colours and `prefers-contrast:more` media rules reinforce focus/border cues.
- Mobile breakpoints at 740px and 540px protect navigation, cards and forms. Real Product/media photographs remain from owner data; no generated image or CSS replacement is introduced.

### Exact regression

`node --test scripts/release467_build435_accessibility.test.mjs` checks the palette, meaningful aliases, minimum target token, luminance/contrast (AA 4.5:1 for body and controls, 3:1 for focus/gold accents), focus states, responsive/reduced motion, and all **three** middleware theme-injection paths. It runs in Current Application Quality Proof and dedicated `Release 467 Build 435 Standard Theme Accessibility` workflow.

A CSS source contract is **not** a replacement for manual assistive-technology/browser acceptance. Before signing off the live release, keyboard-tab through Search, Shop, Product pages, Tools/Supplies and Admin; confirm actual focused controls, real mobile widths, input labels, error announcements, and that no overlay hides a focused element. Test forced colours and reduced-motion settings where available.

### Deployment and safety

The shared middleware source now requests `/css/brand-v3-theme.css?v=435-standard-accessibility` in its standard, storefront-fast and Admin/static injection locations. Preserve any owner-placed Media Studio imagery, inventory, product prices, orders, D1/R2, payment workflow, U.S. shipping suspension and Etsy OAuth/provider state.

GREEN requires the four successful **exact-dev-SHA** Development workflows, Preview proof, protected Cloudflare Production Pages Deploy success, live `https://devilndove.com/release-version.json` matching the new exact main SHA and production smoke evidence. Neither a merged PR nor a passing style source test alone establishes Production GREEN.

**Next queued:** Build 436 — Admin Artwork & Media Content Studio Reliability, documented in `docs/operations/RELEASE_467_BUILD_429_438_ROADMAP.md`.
