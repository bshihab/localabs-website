# Localabs — Marketing Site

## What's in this bundle

```
design_handoff_marketing_site/
├── index.html        ← single-page site (one file, no framework)
├── styles.css        ← all styling (CSS custom properties at :root)
├── script.js         ← scroll-tied dark transition + reveal anims + FAQ
├── assets/           ← logo + iPhone screenshots referenced from index.html
│   ├── logo-full.png         (chip + heart, used in nav/hero/footer + favicon)
│   ├── logo-chip.png         (chip only, in features bento decoration)
│   ├── logo-heart.png        (white heart on transparent)
│   ├── dashboard-hero.png    (Hypertension Visit screen — hero phone + Read step)
│   ├── upload-report.png     (Scan step phone)
│   ├── ask-localabs.png      (Ask step phone)
│   ├── scan-history.png      (legacy report history screen)
│   ├── scan-viewer.png       (lasso/selection viewer)
│   ├── walking.png           (Walking + running trend)
│   ├── trends.png            (Health Trends overview)
│   ├── profile.png           (Medical Profile / on-device engine — Privacy phone)
│   └── edit-profile.png      (Edit Profile sheet — currently unused)
└── README.md         ← this file
```

## Architecture at a glance

**Single-page** marketing site, ~9000px tall. Sections in order:

1. **Hero** — pinned-glass nav, animated orb mesh, floating chip-with-heart logo, iPhone screenshot, dynamic-island-style "MedGemma 4B · loaded on-device" glow pill.
2. **Press strip** — trusted-stack chips (Apple Vision OCR, HealthKit, MedGemma 4B, llama.cpp, Hugging Face).
3. **Promise** — short hook section ("Lab reports were written *for doctors*").
4. **Stats** — 4-up counter (4B params, 0 servers, 5 sections, ~12s).
5. **How it works** — 3 compact glass tiles (Scan / Read / Ask) with iPhone screenshots.
6. **Features bento** — 7-tile asymmetric grid (on-device, Apple Health context, history, memory, scanner, age-adjusted norms, lasso, free-and-iOS).
7. **Privacy** — *the dark band*. As the user scrolls into it, `--dark` interpolates 0 → 1 and the entire page (background, text, glass cards) shifts to a deep navy theme. As they scroll out the bottom it reverses back to light. 5-tile glass grid + floating shield + the Medical Profile iPhone screenshot.
8. **Trends** — back to light. Phone screenshot + metric tiles.
9. **FAQ** — 7 single-open accordion items with smooth max-height transitions.
10. **Final CTA** — App Store badge.
11. **Footer** — Product / Open source / Contact columns + disclaimer.

### Key implementation notes

- **No framework, no build.** Vanilla HTML + CSS + ~120 lines of JS.
- **Design tokens** live as CSS custom properties at `:root` in `styles.css`. The dark transition works by interpolating those tokens through `color-mix(in oklab, …)` driven by a single scalar `--dark` (0..1) on `:root`, which JS updates on scroll.
- **Fonts:** prefers system San Francisco (`-apple-system, "SF Pro Display", "SF Pro Text", "SF Mono"`), with Inter / Inter Tight / JetBrains Mono as Google-Fonts fallbacks for non-Apple devices. The Google Fonts link in `<head>` can be removed if you don't care about non-Apple fallback quality.
- **Animations:**
  - Scroll-tied dark mode (`script.js#update()` — bell-curve fade-in + fade-out around the `.privacy-anchor` element).
  - `IntersectionObserver` reveals on `.reveal` items, with an immediate-visible fallback so anything above the fold appears without waiting on IO.
  - Pointer-parallax on the hero stage (only when `pointer: fine`).
  - Pulsing dot sparkles (`.float-spark`), gradient orbs, dynamic-island glow pill, glowing feature icons.
- **FAQ accordion:** the `<details>` UA `display:none` is overridden so `.body` can `max-height` transition; JS wires single-open behaviour.
- **Responsive:** breakpoints at 1024 / 920 / 680 / 420. Tested for iPhone (≤430px) and iPad portrait (≤810px).
- **No analytics, no third-party scripts, no telemetry.** Stays true to the app's privacy story. If you add any later, add them deliberately.

### Files to edit when you want to change things

| What | Where |
|---|---|
| Hero headline + CTA | `index.html` § `<section class="hero">` |
| Brand colors | `styles.css` `:root { --blue-* }` |
| Where dark mode starts/ends | `script.js` `update()` — adjust `fadeIn` / `fadeOut` numerators |
| Adding a new section | Insert before `<section class="privacy">` for light, after for either light again |
| Footer links | `index.html` § `<footer class="footer">` |
| Replacing screenshots | drop new PNGs into `assets/` and update `<img src>` paths in `index.html` |

### Known sharp edges

- The CSS uses `color-mix(in oklab, …)` and `oklch()` — supported in all evergreen browsers since mid-2023. If you need to support IE/old Safari, you'll need to add fallback colors.
- `backdrop-filter` is required for the glass look; it's universally supported now except in Firefox without the layout.css.backdrop-filter.enabled flag (default on since Firefox 103).
- The favicon uses a transparent PNG with the heart-chip. If you want a true `.ico`, generate one from `assets/logo-full.png` and replace the `<link rel="icon">` in `<head>`.

### Contact

Built by Bilal Shihab — [support@localabs.app](mailto:support@localabs.app) — [linkedin.com/in/bilalshihab](https://linkedin.com/in/bilalshihab).
