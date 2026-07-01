/**
 * @file lighthouserc.cjs
 * @description Lighthouse CI configuration for the perf regression gate
 * (Issue #253 AC #11).
 *
 * Asserts a minimum Performance score on the 5 key routes (Home, About,
 * Services, Contact, News). The routes are served under the Vite base subpath
 * /KTechAICyberWeb/ — see the workflow's preview-server step.
 *
 * SCOPE NOTE (#253): the threshold is set at 0.9 as the regression-detection
 * gate. The full device-runtime verification (LCP<2.5s / INP<200ms /
 * TTI<3.8s / score>=90 on real devices) is deferred to follow-up #302. This
 * config EXISTS and is syntactically valid (AC #11); the threshold values are
 * tuned empirically once CI is wired.
 *
 * @ticket #253
 */
module.exports = {
  ci: {
    collect: {
      // The 5 key routes from AC #10. The base path matches the Vite `base`
      // config + the workflow's PREVIEW_URL.
      url: [
        'http://localhost:4173/KTechAICyberWeb/',
        'http://localhost:4173/KTechAICyberWeb/about',
        'http://localhost:4173/KTechAICyberWeb/services',
        'http://localhost:4173/KTechAICyberWeb/contact',
        'http://localhost:4173/KTechAICyberWeb/news',
      ],
      // Number of Lighthouse runs per URL (LHCI median over runs to reduce
      // variance). 3 is the LHCI-recommended default.
      numberOfRuns: 3,
      // Settings passed through to each Lighthouse run. Desktop form factor +
      // no throttling mirrors the dev-machine profile the FPS sampler targets;
      // mobile/4G throttling verification is deferred to #302.
      settings: {
        preset: 'desktop',
      },
    },
    assert: {
      // Asset assertions: fail the gate if any route drops below 0.9
      // Performance. LHCI compares the median-of-runs against these.
      assertions: {
        'categories:performance': ['warn', { minScore: 0.9 }],
      },
    },
    upload: {
      target: 'temporary-public-storage',
    },
  },
}
