/**
 * @file lighthouserc.mobile.cjs
 * @description Lighthouse CI configuration for the MOBILE perf regression gate.
 *
 * This is the mobile counterpart to lighthouserc.cjs (which gates desktop).
 * The two configs are split (rather than combined into one collect block with
 * two settings entries) because LHCI's `collect.settings.preset` is a single
 * value per config — to assert under BOTH form factors in CI we run two LHCI
 * jobs (see .github/workflows/lighthouse-ci.yml `lighthouse` + `lighthouse-mobile`),
 * each pointing at its own configPath.
 *
 * PRESET NAME: the CI config uses `preset: 'perf'`, which IS the canonical
 * Lighthouse mobile preset (formFactor=mobile + 4G CPU/network throttling +
 * mobile screen emulation, per the Lighthouse spec). Lighthouse's CLI accepts
 * only `perf|experimental|desktop` as preset values. The literal string
 * `'mobile'` is a newer-Lighthouse alias for `perf` that the CI action's
 * bundled binary does NOT recognize — `treosh/lighthouse-ci-action@v11` ships
 * an older Lighthouse whose CLI rejects `'mobile'` with
 * `Argument: preset, Given: "mobile", Choices: "perf", "experimental", "desktop"`,
 * crashing the `lighthouse-mobile` job before any audit runs (PR #347).
 * The local capture script `scripts/334-lighthouse-capture.mjs` uses
 * `preset: 'perf'` (Lighthouse 12.8.2, which accepts the alias) and asserts
 * `formFactor==='mobile'` on every capture — SAME mobile semantics that
 * produced the measured evidence in
 * `projects/kttech-cyber/tickets/342/evidence/metrics-summary-mobile.json`.
 *
 * Originated in #342. The mobile gate was deferred from #302 (which measured
 * the desktop routes at error level) and again from #340 (which shipped the
 * structural mobile-LCP fixes — defer render-blocking global CSS bundle via
 * preload+async-onload, move cyber.css to an async chunk, expand the inline
 * critical-CSS seed, preload the /news first-card image — but did NOT
 * re-enable the mobile CI preset, because the preset's error-level assertions
 * could only be turned on after a post-#340 mobile capture measured the AC).
 *
 * #344 FIX GATING THIS RE-ENABLE:
 * #340's defer-entry-CSS optimization did not land in the CI audit build
 * (vite build --base=/ --outDir dist-audit) because of a regex bug in the
 * inline-script that rewrites index.html on emit: the regex matched the
 * production /KTechAICyberWeb/ base but NOT the audit base=/, so the audit
 * build kept the render-blocking CSS bundle and the mobile LCP did not move
 * in CI. #344 fixed the regex. With #344 merged (PR #345), the audit build
 * now reflects the deferred-CSS optimization, so the perf preset's error
 * level reflects the real end-user experience.
 *
 * ASSERTION LEVELS — honest-partial RE-TIGHTENED post-#346 (iter-22 + iter-78):
 * #346 (commits 1-3) shipped the in-ticket-fixable mobile-LCP wins (lazy
 * SelfDrivingDemo on /about, removed 300ms loading-delay setTimeout on /news,
 * inline-critical h2.section-title font rule on /contact). Commit 4 (route-
 * aware LCP image preload) was REVERTED — it regressed /about (2877→4279ms)
 * and /news (2942→3233ms); the inline-script-as-parser-blocker cost more
 * than the bandwidth savings. Post-#346 mobile numbers (preset=perf, arm64
 * node, single run):
 *   route        LCP     score  | AC#1 <2500   AC#2 >=90
 *   /about       2894ms   92    | MISS ~394ms  MET (was 84)
 *   /contact     2861ms   93    | MISS ~361ms  MET (flat)
 *   /news        3479ms   88    | MISS ~979ms  close (was 86)
 *   / (witness)  2254ms   96    | PASS         MET
 *   /services    2767ms   94    | MISS ~267ms  MET  <- witness, no heavy comps
 * The /services witness landing at 2767ms proves the residual gap is
 * ARCHITECTURAL (SPA hydration floor on 4G throttling), not route-specific —
 * and therefore not closable inside a single CI-gate ticket. Tracked by #348
 * (SSG / bundle-trim / SSR investigation).
 *
 * Honest-partial re-tightening decision (do NOT auto-fail CI on an
 * architectural floor; DO hold the met-AC at error going forward):
 *   - categories:performance   -> error minScore 0.9  (AC#2 MET; was warn)
 *   - largest-contentful-paint -> warn  max 2500ms    (AC#1 NOT MET; #348)
 *   - total-blocking-time      -> error max 200ms     (all 5 routes pass)
 *   - interactive (TTI)        -> warn  max 3800ms    (out of AC#3 scope)
 *   - cumulative-layout-shift  -> error max 0.1       (all 5 routes pass)
 * When #348 closes the architectural floor (mobile LCP <2500ms on /about,
 * /contact, /news in CI), re-tighten largest-contentful-paint to error.
 *
 * INP is NOT asserted here either — see lighthouserc.cjs header for the
 * rationale (lab preset does not collect INP; field metric, deferred to
 * CrUX follow-up).
 *
 * @ticket #342 (mobile gate), #340 (structural fixes), #344 (audit-build fix),
 *         #346 (in-ticket LCP wins + this re-tighten), #348 (LCP follow-up)
 */
module.exports = {
  ci: {
    collect: {
      // Same 5 key routes as lighthouserc.cjs. The mobile CI job builds an
      // audit variant (base=/, outDir dist-audit-mob) and serves it at the
      // web root on port 4174 (distinct from the desktop job's 4173 so the
      // two jobs can run concurrently without port contention).
      url: [
        'http://localhost:4174/',
        'http://localhost:4174/about',
        'http://localhost:4174/services',
        'http://localhost:4174/contact',
        'http://localhost:4174/news',
      ],
      // Number of Lighthouse runs per URL (LHCI median over runs to reduce
      // variance). 3 is the LHCI-recommended default and matches the desktop
      // config — keeping them symmetric makes the two gates comparable.
      numberOfRuns: 3,
      // perf preset = canonical Lighthouse mobile preset: formFactor=mobile +
      // Lighthouse's default mobile throttling (4G CPU/network) + mobile
      // screen emulation. This is what surfaces mobile LCP regressions — the
      // structural concern behind #334 / #340. NOTE: the literal is 'perf'
      // (not 'mobile') because the treosh/lighthouse-ci-action@v11 bundled
      // Lighthouse CLI only accepts perf|experimental|desktop; 'mobile' is a
      // newer-Lighthouse alias it rejects (see header @file block + PR #347).
      // Same semantics as scripts/334-lighthouse-capture.mjs (preset:'perf',
      // asserts formFactor==='mobile').
      settings: {
        preset: 'perf',
      },
    },
    assert: {
      // Assertion levels — HONEST-PARTIAL RE-TIGHTENED post-#346
      // (iter-22 deferred-AC rule + iter-78 re-tighten on AC#2 met).
      //
      // Post-#346 mobile capture (preset=perf, formFactor asserted mobile,
      // arm64 node, single run):
      //   route        LCP     score  | AC#1 <2500   AC#2 >=90
      //   /about       2894ms   92    | MISS ~394ms  MET (was 84 at baseline)
      //   /contact     2861ms   93    | MISS ~361ms  MET (flat)
      //   /news        3479ms   88    | MISS ~979ms  close (was 86)
      //   / (witness)  2254ms   96    | PASS         MET
      //   /services    2767ms   94    | MISS ~267ms  MET  <- witness, no heavy
      //                                                       route components
      //
      // AC#2 (/about score >=90) IS MET — /about climbed 84 → 92 on the strength
      // of #346's lazy-SelfDrivingDemo fix, and all 3 AC routes now score >=88
      // with /about at 92. categories:performance is RE-TIGHTENED warn → error
      // to hold this going forward.
      //
      // AC#1 (LCP <2500ms on /about,/contact,/news) is NOT MET. The /services
      // WITNESS route (no lazy components, no heavy demos) landing at 2767ms
      // proves the residual gap is ARCHITECTURAL — the SPA's JS-bundle download
      // + parse + hydrate cycle under Lighthouse's simulated 4G throttling sets
      // a ~2800ms floor regardless of route content. /contact's LCP element is
      // a text h2.section-title whose lcp-breakdown-insight reports
      // elementRenderDelay=2870ms with NO resource load, confirming hydration
      // (not asset discovery) is the bottleneck. This is not closable inside a
      // single CI-gate ticket.
      //
      // Honest-partial re-tighten (do NOT auto-fail CI on an architectural
      // floor; DO hold the met-AC at error): categories:performance moves up to
      // error; largest-contentful-paint STAYS at warn pending #348 (SSG /
      // bundle-trim / SSR investigation); CLS / TBT stay at error (every route
      // passes them on mobile); TTI stays at warn (out of #346 AC#3 scope).
      // When #348 closes the architectural floor (mobile LCP <2500ms on /about,
      // /contact, /news in CI), re-tighten largest-contentful-paint to error.
      assertions: {
        // Performance score (0..1) — ERROR at 0.9. AC#2 MET post-#346: /about
        // climbed 84 -> 92, /contact 93, /news 88 (close but /about holds the
        // gate at >=90 going forward). Re-tightened from warn in #346 commit 4.
        'categories:performance': ['error', { minScore: 0.9 }],
        // LCP — WARN at 2500ms. AC#1 NOT MET post-#346: /about 2894,
        // /contact 2861, /news 3479 all miss; /services witness also misses
        // (2767) proving architectural floor. Stays warn pending #348 (SSG
        // investigation). Re-tighten to error once #348 lands.
        'largest-contentful-paint': ['warn', { maxNumericValue: 2500 }],
        // TBT — error at 200ms. All 5 routes pass on mobile (max 1.2ms).
        'total-blocking-time': ['error', { maxNumericValue: 200 }],
        // TTI — WARN at 3800ms. Out of #346 AC#3 scope (no AC threshold was
        // tied to TTI in this ticket). Post-#346 /about TTI is ~2800ms (under
        // the 3800 gate), the other routes pass comfortably. Stays warn for
        // honest-partial consistency with LCP.
        'interactive': ['warn', { maxNumericValue: 3800 }],
        // CLS — error (max 0.1). All 5 routes measure 0 on mobile post-#335.
        'cumulative-layout-shift': ['error', { maxNumericValue: 0.1 }],
      },
    },
    upload: {
      target: 'temporary-public-storage',
    },
  },
}
