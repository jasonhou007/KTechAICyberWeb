# #224 Baseline (measured 2026-06-30, origin/main @ 8375ae2, desktop formFactor)

## Lighthouse desktop (preset=desktop, saved: lighthouse-baseline.json)
- formFactor: desktop, screenEmulation.mobile: false (1350x940) — iter-16 device-class match VERIFIED
- Performance: 98 | Accessibility: 97 | Best Practices: 96
- LCP: 0.75s | TBT: 0ms | CLS: 0.073 | FCP: 0.75s | SI: 0.9s
- DOM size: 362 elements

## Bundle (vite build)
- Entry chunk index-DhAnvNxk.js: 187.94 kB (gzip 74.01 kB)
- vendor.js: 105.64 kB (gzip 41.13 kB)
- index.css: 66.48 kB (gzip 11.73 kB)
- TOTAL JS across all chunks: 456.9 kB

## Animation/rAF inventory (RUNTIME cost — the real lag source)
5 heavy below-the-fold components mount EAGERLY on Home (all always-on):
- NeuralTerminal (14 anims/7 kf, 2 setInterval, 5 setTimeout)
- NeuralCore (6 anims/4 kf, uses useNeuralNet rAF loop)
- SolutionForge (11 anims/4 kf, 2 setTimeout)
- CyberOpsHud (3 anims/1 kf, setTimeout)
- NeonPulse (3 anims/1 kf, canvas + useAudioPulse rAF)
- Home.vue itself (6 anims/5 kf incl. glitch 0.3s infinite FLICKER)
- useParallax mousemove rAF (2 handlers)

= 4+ simultaneous rAF loops, 2 intervals, ~43 CSS animations, ~22 keyframes,
  ALL running from initial load despite being below the fold.

## HONEST FRAMING (iter-16 perf-honesty gate)
Load-time Lighthouse is already 98/97/96 — NO headroom to "improve" there.
The user-reported lag ("太卡了") is a RUNTIME scroll/fps problem from the
simultaneous always-on animations, NOT a load problem. Perf improvement target:
runtime animation cost (lazy-mount below-the-fold, throttle offscreen rAF),
PLUS removing the flicker (glitch 0.3s infinite → default off/calm),
PLUS the content overhaul (Our Business + China-ASEAN mission).
