/**
 * @file tests/unit/302-extract-metrics.spec.js
 * @description Unit tests for the Lighthouse metric-extraction helper that
 * backs Issue #302's runtime verification (deferred from #253).
 *
 * The helper takes a raw Lighthouse result JSON object and returns the
 * {lcp, inp, cls, tti, performanceScore, formFactor, finalUrl} tuple that the
 * 302-lighthouse-capture harness writes to metrics-summary.json. Every cited
 * perf number in IMPLEMENTATION_SUMMARY.md must trace through this helper to a
 * saved JSON whose configSettings.formFactor matches the claim (iter-16
 * perf-honesty gate), so the extraction logic itself must be correct — these
 * tests pin it.
 *
 * Lighthouse's metric audit IDs are stable across LH 10+:
 *  - LCP  : audits['largest-contentful-paint'].numericValue
 *  - CLS  : audits['cumulative-layout-shift'].numericValue
 *  - TBT  : audits['total-blocking-time'].numericValue
 *  - TTI  : audits['metrics'].details.items[0].tti
 *           (fallback: audits['experimental-interactive'].numericValue)
 *  - INP  : audits['metrics/interaction-to-next-paint'].numericValue
 *           (absent on lab presets that do not collect INP → null)
 *  - score: categories.performance.score * 100
 *
 * @ticket #302
 */
import { describe, it, expect } from 'vitest'
import { extractMetrics } from '../../scripts/302-extract-metrics.mjs'

/**
 * Minimal synthetic Lighthouse fixture. Only the fields the helper reads are
 * populated; everything else is omitted so the test asserts the helper does
 * NOT depend on extraneous shape. Numeric values are chosen to be distinct so
 * a swapped-audit-id bug would surface (lcp=1200 ≠ cls=0.05 ≠ tbt=50).
 */
function makeFixture({ formFactor = 'desktop', withInp = true } = {}) {
  const audits = {
    'largest-contentful-paint': { numericValue: 1200 },
    'cumulative-layout-shift': { numericValue: 0.05 },
    'total-blocking-time': { numericValue: 50 },
    'experimental-interactive': { numericValue: 2100 },
    metrics: {
      details: {
        items: [
          {
            observedFirstContentfulPaintTs: 0,
            firstContentfulPaint: 800,
            largestContentfulPaint: 1200,
            firstContentfulPaintTs: 0,
            cumulativeLayoutShift: 0.05,
            totalBlockingTime: 50,
            tti: 1900, // <- the canonical TTI slot
            maxPotentialFID: 50,
            speedIndex: 1300,
          },
        ],
      },
    },
  }
  if (withInp) {
    audits['metrics/interaction-to-next-paint'] = { numericValue: 90 }
  }
  return {
    finalUrl: 'http://localhost:4173/about',
    configSettings: { formFactor },
    categories: {
      performance: { score: 0.95 },
    },
    audits,
  }
}

describe('extractMetrics (Issue #302 Lighthouse helper)', () => {
  it('parses a synthetic desktop fixture correctly', () => {
    const m = extractMetrics(makeFixture())
    expect(m.lcp).toBe(1200)
    expect(m.cls).toBe(0.05)
    expect(m.tbt).toBe(50) // surfaced via the same helper for the summary
    expect(m.tti).toBe(1900) // from audits.metrics.details.items[0].tti
    expect(m.inp).toBe(90) // from metrics/interaction-to-next-paint
    expect(m.performanceScore).toBe(95) // 0.95 * 100
    expect(m.formFactor).toBe('desktop')
    expect(m.finalUrl).toBe('http://localhost:4173/about')
  })

  it('falls back to experimental-interactive when metrics.details.items[0].tti is missing', () => {
    const fx = makeFixture()
    // Remove the canonical TTI slot — helper must fall through to
    // experimental-interactive.numericValue (2100 in the fixture).
    delete fx.audits.metrics.details.items[0].tti
    const m = extractMetrics(fx)
    expect(m.tti).toBe(2100)
  })

  it('reads configSettings.formFactor (desktop / mobile)', () => {
    expect(extractMetrics(makeFixture({ formFactor: 'desktop' })).formFactor).toBe('desktop')
    expect(extractMetrics(makeFixture({ formFactor: 'mobile' })).formFactor).toBe('mobile')
  })

  it('throws on missing categories.performance', () => {
    const fx = makeFixture()
    delete fx.categories.performance
    expect(() => extractMetrics(fx)).toThrow(/performance/i)
  })

  it('returns inp:null when the INP audit is absent (lab preset without INP)', () => {
    // Lighthouse lab presets historically did not collect INP; the helper must
    // not crash and must surface null so the summary verdict can mark it n/a
    // rather than fabricating a 0.
    const m = extractMetrics(makeFixture({ withInp: false }))
    expect(m.inp).toBeNull()
    // other metrics still extract normally
    expect(m.lcp).toBe(1200)
    expect(m.cls).toBe(0.05)
  })
})
