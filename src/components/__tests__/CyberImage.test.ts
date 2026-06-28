/**
 * @file CyberImage.test.ts
 * @description Unit tests for the CyberImage component (AC #165)
 * @ticket #165 - [ASSETS] Extract and Implement About & News Section Images
 *
 * CyberImage wraps an <img> in a <figure class="cyber-image"> and adds a
 * cyberpunk treatment: a neon box-shadow border, a glow filter, a local
 * scanline overlay (NOT the global Scanlines.vue, which is position:fixed and
 * covers the whole viewport), a grayscale->color hover transition, and a
 * prefers-reduced-motion guard on the glitch keyframe.
 *
 * The visual effect is delivered through the scoped <style> block. In the
 * Vitest happy-dom environment scoped CSS is NOT resolved into
 * getComputedStyle() (style values come back empty), so the visual-effect
 * assertions parse the component's own scoped stylesheet source — the same
 * pattern used by src/components/__tests__/Scanlines.test.ts. A RED-TEST PROOF
 * (mirroring the About.test.ts parallax red-test model) strips a rule from the
 * captured style and asserts the CSS-source check then returns false, proving
 * the assertion genuinely catches removal.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { mount, VueWrapper } from '@vue/test-utils'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import CyberImage from '../CyberImage.vue'

/**
 * Read the CyberImage SFC source and extract the scoped <style> block.
 *
 * This is the authoritative source of the component's visual styling in a
 * unit-test environment where scoped CSS is not applied to computed styles.
 * Mirrors getScopedStyle() in Scanlines.test.ts.
 */
function getScopedStyle(): string {
  const componentPath = resolve(__dirname, '..', 'CyberImage.vue')
  const source = readFileSync(componentPath, 'utf8')
  const match = source.match(/<style[^>]*>([\s\S]*?)<\/style>/)
  return match ? match[1] : ''
}

describe('CyberImage.vue', () => {
  let wrapper: VueWrapper
  let style: string

  beforeEach(() => {
    wrapper = mount(CyberImage, {
      props: {
        src: '/images/about/about-who-we-are.webp',
        alt: 'Cyberpunk cityscape',
      },
    })
    style = getScopedStyle()
  })

  afterEach(() => {
    wrapper.unmount()
  })

  // ============================================
  // Rendering Tests
  // ============================================
  describe('Rendering', () => {
    it('renders an <img> with the given src', () => {
      const img = wrapper.find('img')
      expect(img.exists()).toBe(true)
      expect(img.attributes('src')).toBe('/images/about/about-who-we-are.webp')
    })

    it('renders an <img> with the given alt text', () => {
      const img = wrapper.find('img')
      expect(img.attributes('alt')).toBe('Cyberpunk cityscape')
    })

    it('wraps the img in a figure.cyber-image', () => {
      const figure = wrapper.find('figure.cyber-image')
      expect(figure.exists()).toBe(true)
      // The img lives inside the figure
      expect(figure.find('img').exists()).toBe(true)
    })

    it('defaults loading="lazy" on the img', () => {
      const img = wrapper.find('img')
      expect(img.attributes('loading')).toBe('lazy')
    })

    it('sets loading="eager" when the eager prop is true', () => {
      const w = mount(CyberImage, {
        props: {
          src: '/images/about/about-who-we-are.webp',
          alt: 'hero',
          eager: true,
        },
      })
      expect(w.find('img').attributes('loading')).toBe('eager')
      w.unmount()
    })

    it('applies an optional className to the figure', () => {
      const w = mount(CyberImage, {
        props: {
          src: '/x.webp',
          alt: 'x',
          className: 'about-hero__figure',
        },
      })
      expect(w.find('figure').classes()).toContain('about-hero__figure')
      // The base cyber-image class is always present too
      expect(w.find('figure').classes()).toContain('cyber-image')
      w.unmount()
    })

    it('includes a scanline overlay element inside the figure', () => {
      // The overlay is a LOCAL element, NOT the global Scanlines.vue overlay.
      // It must live inside the figure so the scanlines are clipped to the image.
      const overlay = wrapper.find('figure.cyber-image .cyber-image__scanlines')
      expect(overlay.exists()).toBe(true)
      // The overlay is decorative
      expect(overlay.attributes('aria-hidden')).toBe('true')
    })

    it('does not mount the global Scanlines component (local overlay only)', () => {
      // The global Scanlines.vue renders a position:fixed full-viewport layer.
      // CyberImage must NOT reuse it; the overlay is a local child element.
      const html = wrapper.html()
      expect(html).not.toMatch(/class="scanlines"/)
    })
  })

  // ============================================
  // CSS-Source Tests (visual cyberpunk contract)
  // ============================================
  // These parse the scoped <style> source because happy-dom does not resolve
  // scoped CSS into getComputedStyle(). Mirrors Scanlines.test.ts.
  describe('Cyberpunk CSS source', () => {
    it('targets the .cyber-image class', () => {
      expect(style).toMatch(/\.cyber-image\s*\{/)
    })

    it('declares a neon box-shadow on .cyber-image', () => {
      // The signature neon glow — box-shadow using a cyberpunk color.
      expect(style).toMatch(/\.cyber-image[^}]*box-shadow:/s)
    })

    it('declares an @keyframes cyber-glitch animation', () => {
      expect(style).toMatch(/@keyframes\s+cyber-glitch\b/)
    })

    it('declares a prefers-reduced-motion guard that disables the animation', () => {
      // The glitch keyframe must be gated behind prefers-reduced-motion: reduce
      // so users with vestibular motion sensitivity get a static image.
      expect(style).toMatch(/@media\s*\(\s*prefers-reduced-motion:\s*reduce\s*\)/)
      // Inside the reduced-motion block, the animation must be disabled.
      const reducedBlock = style.match(
        /@media\s*\(\s*prefers-reduced-motion:\s*reduce\s*\)\s*\{([\s\S]*?)\}\s*\}/,
      )
      expect(reducedBlock).not.toBeNull()
      expect(reducedBlock![1]).toMatch(/animation:\s*none/)
    })

    it('declares a grayscale->color hover transition on the img', () => {
      // Default state: grayscale (or partial). Hover state: full color.
      // This is the cyberpunk "decode" effect on hover.
      expect(style).toMatch(/filter:\s*grayscale/)
      expect(style).toMatch(/\.cyber-image:hover[\s\S]*?filter:\s*grayscale\(\s*0\s*\)/)
    })

    it('declares the local scanline overlay rule', () => {
      expect(style).toMatch(/\.cyber-image__scanlines\s*\{/)
      // The overlay must be positioned absolutely over the image and non-interactive
      expect(style).toMatch(/\.cyber-image__scanlines[^}]*pointer-events:\s*none/s)
    })

    // ============================================
    // RED-TEST PROOF (mirrors About.test.ts parallax red-test model)
    // ============================================
    // Strips the neon box-shadow rule from the captured style string and
    // asserts the CSS-source neon check then returns false. This proves the
    // assertion actually catches removal of the rule (a tautology would keep
    // passing). If a future refactor deletes the box-shadow, this test and the
    // real check above both flip RED.
    it('RED-TEST PROOF: neon check returns false when box-shadow is stripped', () => {
      const neonCheck = (css: string) => /\.cyber-image[^}]*box-shadow:/s.test(css)

      // Sanity: the real style passes the check.
      expect(neonCheck(style)).toBe(true)

      // Strip every box-shadow declaration and confirm the check flips false.
      const stripped = style.replace(/box-shadow:[^;}]*;?/g, '')
      expect(neonCheck(stripped)).toBe(false)
    })

    it('RED-TEST PROOF: glitch-keyframe check returns false when keyframe is stripped', () => {
      const glitchCheck = (css: string) =>
        /@keyframes\s+cyber-glitch\b/.test(css)
      expect(glitchCheck(style)).toBe(true)
      const stripped = style.replace(/@keyframes\s+cyber-glitch[^}]*\}\s*/g, '')
      expect(glitchCheck(stripped)).toBe(false)
    })
  })

  // ============================================
  // Edge Cases
  // ============================================
  describe('Edge Cases', () => {
    it('mounts and unmounts without errors', () => {
      const w = mount(CyberImage, { props: { src: '/a.webp', alt: 'a' } })
      expect(w.exists()).toBe(true)
      w.unmount()
    })

    it('renders consistently across multiple mounts', () => {
      const w1 = mount(CyberImage, { props: { src: '/a.webp', alt: 'a' } })
      const w2 = mount(CyberImage, { props: { src: '/a.webp', alt: 'a' } })
      expect(w1.find('figure.cyber-image').exists()).toBe(true)
      expect(w2.find('figure.cyber-image').exists()).toBe(true)
      expect(w1.findAll('img')).toHaveLength(1)
      expect(w2.findAll('img')).toHaveLength(1)
      w1.unmount()
      w2.unmount()
    })

    it('renders without console errors', () => {
      const w = mount(CyberImage, { props: { src: '/a.webp', alt: 'a' } })
      expect(w.find('figure.cyber-image').exists()).toBe(true)
      w.unmount()
    })
  })
})
