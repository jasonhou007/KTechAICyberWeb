/**
 * @file StatusReadout.test.ts
 * @description Unit tests for the StatusReadout component (#203, MEDIUM-2).
 * @ticket #203
 *
 * Drives the REAL component (no composable mocking) with the REAL useLanguage
 * so localized copy actually renders. Asserts user-visible DOM, not internals:
 *  - the cycle readout interpolates {n} with loopIteration (1-indexed).
 *  - MEDIUM-2: phaseLine narrates the live phase. The earlier PHASE_LINE map
 *    only covered 4 of 8 phases (planner/coder/security/evaluator), so the
 *    phase narration silently vanished for intake/triage/merger/resolved —
 *    dead reactive state in disguise. These tests assert EVERY phase surfaces
 *    a non-empty, localized narration line (no raw key leakage), in BOTH en
 *    and zh, so the readout always narrates the current stage.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { useLanguage } from '@/composables/useLanguage'
import StatusReadout from '../StatusReadout.vue'

const ALL_PHASES = [
  'intake',
  'triage',
  'planner',
  'coder',
  'security',
  'evaluator',
  'merger',
  'resolved',
] as const

describe('StatusReadout', () => {
  beforeEach(() => {
    // useLanguage has no matchMedia dependency, but stub defensively in case a
    // future import pulls one in.
    vi.stubGlobal('matchMedia', (query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addEventListener: () => {},
      removeEventListener: () => {},
      addListener: () => {},
      removeListener: () => {},
      dispatchEvent: () => false,
    }))
  })
  afterEach(() => {
    vi.unstubAllGlobals()
    const { setLanguage } = useLanguage()
    setLanguage('en')
  })

  it('renders the cycle readout with {n} interpolated as loopIteration+1', () => {
    const wrapper = mount(StatusReadout, {
      props: { loopIteration: 3, phaseId: 'intake', readoutKey: 'cycling' },
    })
    // cycling = "CYCLE {n}" -> 1-indexed -> "CYCLE 4"
    expect(wrapper.find('.status-readout-cycle').text()).toContain('CYCLE 4')
  })

  it('falls back to the readoutKey copy when {n} is absent (merged)', () => {
    const wrapper = mount(StatusReadout, {
      props: { loopIteration: 0, phaseId: 'resolved', readoutKey: 'merged' },
    })
    // merged has no {n} placeholder, so the raw merged copy renders verbatim.
    expect(wrapper.find('.status-readout-cycle').text()).toMatch(/MERGED/i)
  })

  // -------------------------------------------------------------------------
  // MEDIUM-2: phaseLine narrates the live phase for EVERY phase
  // -------------------------------------------------------------------------

  it('MEDIUM-2: the phase narration line renders for EVERY phase (en)', () => {
    const { setLanguage } = useLanguage()
    setLanguage('en')
    for (const phaseId of ALL_PHASES) {
      const wrapper = mount(StatusReadout, {
        props: { loopIteration: 0, phaseId, readoutKey: 'cycling' },
      })
      const line = wrapper.find('.status-readout-line')
      expect(
        line.exists(),
        `phase narration line must render for phase "${phaseId}"`,
      ).toBe(true)
      const text = line.text()
      // Must be non-empty localized prose, NOT a raw dotted key leak.
      expect(text.length).toBeGreaterThan(0)
      expect(text).not.toMatch(/selfDriving\./)
      // The narration must carry the phase marker for traceability.
      expect(line.attributes('data-phase-narration')).toBe(phaseId)
      wrapper.unmount()
    }
  })

  it('MEDIUM-2: the phase narration line renders for EVERY phase (zh)', () => {
    const { setLanguage } = useLanguage()
    setLanguage('zh')
    for (const phaseId of ALL_PHASES) {
      const wrapper = mount(StatusReadout, {
        props: { loopIteration: 0, phaseId, readoutKey: 'cycling' },
      })
      const line = wrapper.find('.status-readout-line')
      expect(
        line.exists(),
        `phase narration line must render for phase "${phaseId}" in zh`,
      ).toBe(true)
      const text = line.text()
      expect(text.length).toBeGreaterThan(0)
      expect(text).not.toMatch(/selfDriving\./)
      // zh copy is CJK — assert it is not English fallback for the status-backed
      // phases (intake/triage/merger/resolved pull phases.<id>.status which is
      // CJK in zh). The streaming-backed phases are latin console lines in both
      // locales by design, so only assert CJK on the status-backed set.
      if (['intake', 'triage', 'merger', 'resolved'].includes(phaseId)) {
        expect(text).toMatch(/[一-鿿]/)
      }
      wrapper.unmount()
    }
  })

  it('MEDIUM-2: the streaming-backed phases narrate the dedicated console line (en)', () => {
    const { setLanguage } = useLanguage()
    setLanguage('en')
    const cases = [
      ['planner', 'planner:'],
      ['coder', 'coder:'],
      ['security', 'security:'],
      ['evaluator', 'evaluator:'],
    ] as const
    for (const [phaseId, prefix] of cases) {
      const wrapper = mount(StatusReadout, {
        props: { loopIteration: 0, phaseId, readoutKey: 'cycling' },
      })
      expect(wrapper.find('.status-readout-line').text()).toContain(prefix)
      wrapper.unmount()
    }
  })

  it('MEDIUM-2: a phase narration line renders real localized copy (snapshot of intake)', () => {
    // Concrete expected value for one phase, so a regression to the empty-
    // string map would fail loudly with a diff.
    const { setLanguage } = useLanguage()
    setLanguage('en')
    const wrapper = mount(StatusReadout, {
      props: { loopIteration: 0, phaseId: 'intake', readoutKey: 'cycling' },
    })
    // intake -> selfDriving.phases.intake.status = "New issue received"
    expect(wrapper.find('.status-readout-line').text()).toBe('New issue received')
  })

  it('MEDIUM-2: an unknown phaseId yields no narration line (defensive v-if)', () => {
    const wrapper = mount(StatusReadout, {
      props: { loopIteration: 0, phaseId: 'nope', readoutKey: 'cycling' },
    })
    expect(wrapper.find('.status-readout-line').exists()).toBe(false)
  })
})
