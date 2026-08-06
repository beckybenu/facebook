# Kestrel

Marketing site for **Kestrel**, a fictional AI infrastructure company that runs
large models on dedicated GPUs with predictable latency, per-token
observability, and reproducible serving.

It is a single self-contained static page. No build step: open `index.html` in a
browser, or serve the folder with any static server.

```bash
python3 -m http.server --directory kestrel 8080
# then open http://localhost:8080
```

## Files

| File | Purpose |
| --- | --- |
| `index.html` | Page markup |
| `styles.css` | All styles, OKLCH design tokens, light + auto-dark theme |
| `main.js` | Scroll reveal via IntersectionObserver (no scroll listeners) |

External dependencies load at runtime in the visitor's browser: IBM Plex Sans /
Mono (Google Fonts) and Phosphor icons. Both degrade to system fonts and no
icons if unavailable.

## Design notes

Built with the [`design-taste`](../.claude/skills/design-taste) skill. The brief
was read before building, and the three intensity dials were set deliberately:

- **Design read:** product landing page for an AI infrastructure company,
  audience is engineering leaders shipping AI features, precise instrument-grade
  language, editorial-technical system (ink on paper, mono data labels, one rust
  accent). Chosen against the SaaS-purple-glow and terminal-dark reflexes.
- **Dials:** DESIGN_VARIANCE 6, MOTION_INTENSITY 3, VISUAL_DENSITY 4.
- **Type:** IBM Plex Sans for display and body (weight contrast), IBM Plex Mono
  for data and labels. No Inter, no reflex serif.
- **Color:** one locked rust accent in OKLCH, neutrals tinted slightly cool. No
  pure black or white. WCAG AA verified in both light and dark (contrast audited
  with a canvas sRGB readback, every muted label above 4.5:1).
- **Theme:** one theme locked per view, with a full-page auto dark inversion via
  `prefers-color-scheme`.
- **Motion:** opacity and transform only, ease-out curves under 300ms, buttons
  respond to `:active`, and everything has a `prefers-reduced-motion` fallback.

### Anti-slop choices

- Real content SVGs only: a latency line chart from data, a request-trace
  waterfall, and a labeled architecture diagram. No fake div screenshots, no
  sketchy illustrations.
- No numbered section eyebrows, no decorative status dots, no gradient text, no
  side-stripe cards, no glassmorphism.
- Two pricing plans (one emphasized) instead of three identical feature cards.
- Organic numbers (47.2 ms p50, 116 ms p99, 99.9% target), invented but
  plausible customer names, and zero em-dashes anywhere on the page.
