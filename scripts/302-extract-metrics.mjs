/**
 * @file scripts/302-extract-metrics.mjs
 * @description Lighthouse metric-extraction helper for Issue #302's runtime
 * verification (deferred from #253).
 *
 * Input : a raw Lighthouse result JSON object (the top-level object Lighthouse
 *         writes to --output-path=json).
 * Output: { lcp, inp, cls, tbt, tti, performanceScore, formFactor, finalUrl }
 *
 * Every cited perf number in IMPLEMENTATION_SUMMARY.md / metrics-summary.json
 * flows through this helper so the trace from claim -> saved JSON is
 * mechanical. The capture harness additionally asserts that
 * configSettings.formFactor in the saved JSON matches the preset's expected
 * device (iter-16 perf-honesty gate) BEFORE this extraction runs.
 *
 * Audit IDs are stable across Lighthouse 10+ (verified against the LH 12 JSON
 * the capture harness produces in this environment):
 *   LCP  : audits['largest-contentful-paint'].numericValue
 *   CLS  : audits['cumulative-layout-shift'].numericValue
 *   TBT  : audits['total-blocking-time'].numericValue
 *   TTI  : audits['metrics'].details.items[0].tti
 *          (fallback: audits['experimental-interactive'].numericValue — the
 *           legacy TTI slot before Lighthouse folded TTI under metrics)
 *   INP  : audits['metrics/interaction-to-next-paint'].numericValue
 *          (absent on lab presets that do not collect INP -> null, NOT 0)
 *   score: categories.performance.score * 100  (LH scores are 0..1)
 *
 * @ticket #302
 */

/**
 * Extract the Core Web Vitals + TTI + Performance score from a Lighthouse
 * result object. Pure function — no I/O — so it is unit-testable in isolation.
 *
 * @param {object} lh - raw Lighthouse result JSON
 * @returns {{
 *   lcp: number,
 *   cls: number,
 *   tbt: number,
 *   tti: number,
 *   inp: number|null,
 *   performanceScore: number,
 *   formFactor: string,
 *   finalUrl: string,
 * }}
 */
export function extractMetrics(lh) {
  if (!lh || !lh.categories || typeof lh.categories.performance === 'undefined') {
    throw new Error(
      'extractMetrics: input is missing categories.performance — cannot derive Performance score',
    )
  }

  const audits = lh.audits || {}

  // LCP, CLS, TBT — straight numericValue reads. Cast to Number so a JSON
  // reload does not leave them as strings.
  const lcp = Number(audits['largest-contentful-paint']?.numericValue)
  const cls = Number(audits['cumulative-layout-shift']?.numericValue)
  const tbt = Number(audits['total-blocking-time']?.numericValue)

  // TTI — prefer the canonical metrics.details.items[0].tti slot; fall back to
  // the legacy experimental-interactive audit. Both are present on LH 12+
  // desktop runs; the fallback covers lab presets that drop the metrics table.
  const ttiFromMetrics = audits.metrics?.details?.items?.[0]?.tti
  const tti = Number.isFinite(ttiFromMetrics)
    ? Number(ttiFromMetrics)
    : Number(audits['experimental-interactive']?.numericValue)

  // INP — interaction-to-next-paint is a field/Core-Web-Vital metric. Lighthouse
  // lab runs surface it under metrics/interaction-to-next-paint when collected,
  // but some presets omit it entirely. We MUST return null (not 0) on absence so
  // the summary's verdict logic marks INP n/a rather than reporting a fake 0.
  const inpAudit = audits['metrics/interaction-to-next-paint']
  const inp = inpAudit && typeof inpAudit.numericValue === 'number'
    ? Number(inpAudit.numericValue)
    : null

  // Performance score is 0..1 in the JSON; the AC and thresholds are expressed
  // on the 0..100 Lighthouse UI scale.
  const performanceScore = Math.round(lh.categories.performance.score * 100)

  return {
    lcp,
    cls,
    tbt,
    tti,
    inp,
    performanceScore,
    formFactor: lh.configSettings?.formFactor ?? 'unknown',
    finalUrl: lh.finalUrl ?? '',
  }
}
