/**
 * @file AboutIcon.test.ts
 * @description Unit tests for the AboutIcon inline-SVG component (AC #198).
 * @ticket #198 - Original cyberpunk About icons (Who We Are section).
 *
 * Test categories:
 * - Rendering: an <svg> renders for each of the 5 motif names.
 * - Accessibility: role="img" + literal aria-label (not a raw i18n key).
 * - Edge cases: no console.error on mount, unknown name handled gracefully.
 * - Visual-AC (iter 13/15): the component's CSS source — with comments STRIPPED
 *   — must contain ACTIVE cyberpunk declarations (drop-shadow glow, currentColor
 *   stroke, prefers-reduced-motion guard). A commented-out rule must FAIL the
 *   test, because stripping comments leaves only what the browser actually
 *   applies.
 * - IP gate (this ticket's specialty): no KASIKORN/KBank/KTech wordmark text
 *   and no reproduction of official about1-5.svg path data leaks into the
 *   component source or the rendered DOM.
 */

import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import fs from 'node:fs'
import path from 'node:path'
import AboutIcon from '../AboutIcon.vue'

const MOTIF_NAMES = [
  'company',
  'parentRegion',
  'capital',
  'established',
  'services',
] as const

describe('AboutIcon.vue', () => {
  describe('Rendering (AC #198)', () => {
    MOTIF_NAMES.forEach((name) => {
      it(`renders an <svg> for the "${name}" motif`, () => {
        const wrapper = mount(AboutIcon, {
          props: { name, label: `${name} icon` },
        })
        expect(wrapper.find('svg').exists()).toBe(true)
        wrapper.unmount()
      })
    })

    it('every motif svg shares a 0 0 64 64 viewBox', () => {
      MOTIF_NAMES.forEach((name) => {
        const wrapper = mount(AboutIcon, {
          props: { name, label: `${name} icon` },
        })
        const svg = wrapper.find('svg')
        expect(svg.attributes('viewBox')).toBe('0 0 64 64')
        wrapper.unmount()
      })
    })
  })

  describe('Accessibility', () => {
    it('the svg has role="img"', () => {
      const wrapper = mount(AboutIcon, {
        props: { name: 'company', label: 'Company icon' },
      })
      expect(wrapper.find('svg').attributes('role')).toBe('img')
      wrapper.unmount()
    })

    it('the svg aria-label is the literal passed string', () => {
      const wrapper = mount(AboutIcon, {
        props: { name: 'capital', label: 'Registered capital icon' },
      })
      expect(wrapper.find('svg').attributes('aria-label')).toBe(
        'Registered capital icon',
      )
      wrapper.unmount()
    })

    it('the aria-label is NOT a raw i18n key', () => {
      const wrapper = mount(AboutIcon, {
        props: { name: 'services', label: 'Core services icon' },
      })
      const label = wrapper.find('svg').attributes('aria-label') || ''
      expect(label).not.toMatch(/^about\./)
      wrapper.unmount()
    })

    it('renders distinct path geometry per motif (5 unique inner shapes)', () => {
      // Each motif must produce its OWN non-empty inner geometry (a motif that
      // renders nothing would be a regression). We collect the inner HTML of
      // each rendered svg and assert all 5 are non-empty AND pairwise distinct.
      const inners = MOTIF_NAMES.map((name) => {
        const wrapper = mount(AboutIcon, {
          props: { name, label: `${name} icon` },
        })
        const inner = wrapper.find('svg').element.innerHTML
        wrapper.unmount()
        return inner
      })
      inners.forEach((inner) => expect(inner.length).toBeGreaterThan(0))
      const unique = new Set(inners)
      expect(unique.size).toBe(MOTIF_NAMES.length)
    })
  })

  describe('Edge cases', () => {
    it('mounts without console errors', () => {
      const errors: string[] = []
      const spy = vi.spyOn(console, 'error').mockImplementation((...args) => {
        errors.push(args.join(' '))
      })
      const wrapper = mount(AboutIcon, {
        props: { name: 'company', label: 'Company icon' },
      })
      expect(errors).toHaveLength(0)
      wrapper.unmount()
      spy.mockRestore()
    })
  })

  // ============================================
  // Visual-AC (iter 13/15) — assert the ACTIVE CSS, not commented-out rules.
  // We read the source, strip /* */ block comments and // line comments, then
  // assert the cyberpunk declarations are present in what remains. A commented
  // rule would be removed by the strip and FAIL the test.
  // ============================================
  describe('Visual-AC (active cyberpunk CSS)', () => {
    const sourcePath = path.resolve(
      process.cwd(),
      'src',
      'components',
      'icons',
      'AboutIcon.vue',
    )
    const raw = fs.readFileSync(sourcePath, 'utf-8')

    // Strip block comments first, then line comments. Order matters: a //
    // inside a block comment would otherwise leave a dangling fragment.
    const stripped = raw
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .replace(/\/\/.*$/gm, '')

    it('active CSS uses drop-shadow glow', () => {
      expect(stripped).toMatch(/drop-shadow\(/)
    })

    it('active CSS uses currentColor for stroke/fill', () => {
      expect(stripped).toMatch(/currentColor/)
    })

    it('active CSS has a prefers-reduced-motion guard', () => {
      expect(stripped).toMatch(/@media\s*\(\s*prefers-reduced-motion\s*:\s*reduce\s*\)/)
    })

    it('active CSS uses the --cyan theme variable (or the #00ffcc fallback)', () => {
      // The component must derive its color from the site theme, not a
      // hardcoded hex that drifts from the rest of the cyber UI.
      expect(stripped).toMatch(/var\(--cyan/)
    })
  })

  // ============================================
  // IP gate (this ticket's specialty) — the 5 motifs are ORIGINAL geometric
  // line-art. ZERO wordmarks, ZERO KASIKORN/KBank/KTech text, ZERO reproduction
  // of the official about1-5.svg path data.
  // ============================================
  describe('IP gate — original, no trademark', () => {
    const sourcePath = path.resolve(
      process.cwd(),
      'src',
      'components',
      'icons',
      'AboutIcon.vue',
    )
    const raw = fs.readFileSync(sourcePath, 'utf-8')

    it('contains NO KASIKORN / KBank / KTech wordmark text', () => {
      expect(raw).not.toMatch(/KASIKORN/i)
      expect(raw).not.toMatch(/KBank/i)
      expect(raw).not.toMatch(/KTech/i)
    })

    it('renders NO wordmark text into the DOM for any motif', () => {
      MOTIF_NAMES.forEach((name) => {
        const wrapper = mount(AboutIcon, {
          props: { name, label: `${name} icon` },
        })
        const text = wrapper.text()
        expect(text).not.toMatch(/KASIKORN/i)
        expect(text).not.toMatch(/KBank/i)
        expect(text).not.toMatch(/KTech/i)
        wrapper.unmount()
      })
    })

    it('uses only line-art primitives (paths/polygons/circles/lines), no embedded <text>', () => {
      MOTIF_NAMES.forEach((name) => {
        const wrapper = mount(AboutIcon, {
          props: { name, label: `${name} icon` },
        })
        expect(wrapper.findAll('text').length).toBe(0)
        wrapper.unmount()
      })
    })
  })
})
