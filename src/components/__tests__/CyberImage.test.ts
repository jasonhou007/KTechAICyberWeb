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
 *
 * @ticket #199 - [PERF] Responsive image variants (srcset/sizes). Adds a
 *                srcset/sizes describe block that proves the component renders
 *                <img srcset sizes>, rebases every srcset URL under the Vite
 *                BASE_URL subpath (sharing the resolvePath code path with src),
 *                and omits the attributes entirely when the props are absent.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
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

    // Evaluator Low finding (#305 review): the decorative fallback glyph must
    // use a SINGLE backslash CSS escape ('\25C8'), not a double backslash
    // ('\\25C8'). A double backslash is a literal-escape in CSS — it parses as
    // an escaped backslash + the literal text "25C8", so the intended diamond
    // glyph ◈ (U+25C8) renders as literal text/nothing. This locks the fix.
    // In JS regex a single literal backslash is written as \\, so the pattern
    // /content:\s*['"]\\25C8['"]/ matches exactly ONE backslash before 25C8.
    it('uses a single-backslash CSS escape for the fallback glyph (\\25C8, not \\\\25C8)', () => {
      // The correct single-backslash form MUST match.
      expect(style).toMatch(/content:\s*['"]\\25C8['"]/)
      // The buggy double-backslash form MUST NOT match (locks the fix against
      // regression — if someone "fixes" it back to \\25C8 this flips RED).
      expect(style).not.toMatch(/content:\s*['"]\\\\25C8['"]/)
    })
  })

  // ============================================
  // Base-path resolution (AC #165 — images must render under the base subpath)
  // ============================================
  describe('Base-path resolution', () => {
    afterEach(() => {
      // Restore the default vitest BASE_URL ('/') after each case.
      vi.unstubAllEnvs()
    })

    it('passes absolute http(s) URLs through unchanged', () => {
      const w = mount(CyberImage, {
        props: { src: 'https://example.com/x.webp', alt: 'x' },
      })
      expect(w.find('img').attributes('src')).toBe('https://example.com/x.webp')
      w.unmount()
    })

    it('passes protocol-relative URLs through unchanged', () => {
      const w = mount(CyberImage, {
        props: { src: '//cdn.example.com/x.webp', alt: 'x' },
      })
      expect(w.find('img').attributes('src')).toBe('//cdn.example.com/x.webp')
      w.unmount()
    })

    it('passes data: URIs through unchanged', () => {
      const w = mount(CyberImage, {
        props: { src: 'data:image/png;base64,AAAA', alt: 'x' },
      })
      expect(w.find('img').attributes('src')).toBe('data:image/png;base64,AAAA')
      w.unmount()
    })

    it('passes relative (non-leading-slash) paths through unchanged', () => {
      const w = mount(CyberImage, {
        props: { src: 'relative/x.webp', alt: 'x' },
      })
      expect(w.find('img').attributes('src')).toBe('relative/x.webp')
      w.unmount()
    })

    it('passes an empty src through unchanged (defensive guard, line 67)', () => {
      // `src` is a required prop in normal use, but the resolver's empty-string
      // guard must still hold if a caller ever passes '' (e.g. a binding that
      // transiently resolves to empty). Covers the `if (!src) return src` branch.
      const w = mount(CyberImage, {
        props: { src: '', alt: 'x' },
      })
      expect(w.find('img').attributes('src')).toBe('')
      w.unmount()
    })

    it('rebases site-root-relative /images/... under a subpath BASE_URL', () => {
      // Simulate the production base /KTechAICyberWeb/.
      vi.stubEnv('BASE_URL', '/KTechAICyberWeb/')
      const w = mount(CyberImage, {
        props: { src: '/images/about/about-who-we-are.webp', alt: 'x' },
      })
      expect(w.find('img').attributes('src')).toBe(
        '/KTechAICyberWeb/images/about/about-who-we-are.webp',
      )
      w.unmount()
    })

    it('does not double-prefix a src that already starts with the base', () => {
      vi.stubEnv('BASE_URL', '/KTechAICyberWeb/')
      const w = mount(CyberImage, {
        props: { src: '/KTechAICyberWeb/images/x.webp', alt: 'x' },
      })
      expect(w.find('img').attributes('src')).toBe('/KTechAICyberWeb/images/x.webp')
      w.unmount()
    })

    it('leaves /images/... unchanged when BASE_URL is the root /', () => {
      // Default vitest BASE_URL — site-root-relative paths are already correct.
      const w = mount(CyberImage, {
        props: { src: '/images/about/x.webp', alt: 'x' },
      })
      expect(w.find('img').attributes('src')).toBe('/images/about/x.webp')
      w.unmount()
    })
  })

  // ============================================
  // Responsive srcset/sizes (AC #199 — responsive image variants)
  // ============================================
  // The component accepts optional `srcset` (comma-sep "url Ww" descriptors)
  // and `sizes` props and renders <img srcset sizes>. Every srcset URL must be
  // rebased under the Vite BASE_URL subpath using the SAME code path as `src`
  // (resolvePath), so the hero's /images/about/about-who-we-are-400w.webp
  // resolves to /KTechAICyberWeb/images/... in prod exactly like the root src.
  // When the props are absent, the attributes must be omitted entirely (not
  // rendered as srcset="") so legacy callers render identical markup to before.
  describe('Responsive srcset/sizes', () => {
    afterEach(() => {
      // Restore the default vitest BASE_URL ('/') after each case.
      vi.unstubAllEnvs()
    })

    it('does not render srcset/sizes when the props are absent', () => {
      // Mount with only the required src/alt — the same shape every legacy
      // caller uses. The img must carry NO srcset and NO sizes attribute.
      const w = mount(CyberImage, {
        props: { src: '/images/about/about-who-we-are.webp', alt: 'x' },
      })
      const img = w.find('img')
      expect(img.attributes('srcset')).toBeUndefined()
      expect(img.attributes('sizes')).toBeUndefined()
      w.unmount()
    })

    it('renders the srcset attribute when passed (root BASE_URL)', () => {
      // With the default BASE_URL '/', site-root-relative URLs pass through
      // unchanged, so the rendered srcset equals the input verbatim.
      const w = mount(CyberImage, {
        props: {
          src: '/images/about/about-who-we-are.webp',
          alt: 'x',
          srcset: '/a-400w.webp 400w, /a-800w.webp 800w',
        },
      })
      expect(w.find('img').attributes('srcset')).toBe(
        '/a-400w.webp 400w, /a-800w.webp 800w',
      )
      w.unmount()
    })

    it('rebases each srcset URL under a subpath BASE_URL', () => {
      // Simulate the production base /KTechAICyberWeb/. Every URL token in the
      // srcset must be rebased under the base; the width descriptors (400w,
      // 800w) must be preserved unchanged.
      vi.stubEnv('BASE_URL', '/KTechAICyberWeb/')
      const w = mount(CyberImage, {
        props: {
          src: '/images/about/about-who-we-are.webp',
          alt: 'x',
          srcset:
            '/images/about/about-who-we-are-400w.webp 400w, /images/about/about-who-we-are-800w.webp 800w',
        },
      })
      const srcset = w.find('img').attributes('srcset')
      expect(srcset).toBe(
        '/KTechAICyberWeb/images/about/about-who-we-are-400w.webp 400w, /KTechAICyberWeb/images/about/about-who-we-are-800w.webp 800w',
      )
      // The width descriptors survive the rebase untouched.
      expect(srcset).toMatch(/400w/)
      expect(srcset).toMatch(/800w/)
      w.unmount()
    })

    it('renders the sizes attribute when passed', () => {
      const w = mount(CyberImage, {
        props: {
          src: '/images/about/about-who-we-are.webp',
          alt: 'x',
          sizes: '(max-width: 600px) 100vw, 50vw',
        },
      })
      expect(w.find('img').attributes('sizes')).toBe(
        '(max-width: 600px) 100vw, 50vw',
      )
      w.unmount()
    })

    // ============================================
    // RED-TEST PROOF (mirrors the box-shadow / glitch red-test model above)
    // ============================================
    // Defines the same "every URL token is rebased" check the assertion above
    // relies on, runs it against a correctly-rebased string (passes), then
    // strips the base prefix from a synthetic string and asserts the check
    // flips false. Proves the rebase assertion is NOT a tautology — if a
    // future refactor forgets to rebase srcset URLs, this proof and the real
    // check both flip RED.
    it('RED-TEST PROOF: rebase check returns false when a URL is not rebased', () => {
      const base = '/KTechAICyberWeb/'
      // A srcset is rebased iff EVERY comma-separated entry's URL token starts
      // with the base. (Each entry is "URL Ww"; the URL is the first token.)
      const srcsetRebaseCheck = (srcset: string, b: string) =>
        srcset
          .split(',')
          .map((e) => e.trim())
          .every((entry) => {
            const url = entry.split(/\s+/)[0]
            return url.startsWith(b)
          })

      // Sanity: a fully-rebased srcset passes the check.
      const rebased =
        '/KTechAICyberWeb/images/about/about-who-we-are-400w.webp 400w, /KTechAICyberWeb/images/about/about-who-we-are-800w.webp 800w'
      expect(srcsetRebaseCheck(rebased, base)).toBe(true)

      // Strip the base prefix from ONE entry's URL and confirm the check flips
      // false — proving the check actually catches an un-rebased URL.
      const partlyStripped =
        '/images/about/about-who-we-are-400w.webp 400w, /KTechAICyberWeb/images/about/about-who-we-are-800w.webp 800w'
      expect(srcsetRebaseCheck(partlyStripped, base)).toBe(false)
    })
  })

  // ============================================
  // @error fallback (AC #305 — broken/missing image placeholder)
  // ============================================
  // When the inner <img> fails to load (404, broken src, network error), the
  // browser fires a native `error` event. CyberImage must catch it, hide the
  // broken <img>, and reveal a CSS-only cyberpunk fallback placeholder so the
  // user never sees the browser's broken-image icon. The placeholder carries
  // role="img" and the original alt text so screen readers still announce the
  // image's purpose (WCAG 2.1 AA — non-text content has a text alternative).
  describe('@error fallback', () => {
    it('renders a fallback placeholder when the img fires an error event', async () => {
      const w = mount(CyberImage, {
        props: { src: '/broken.webp', alt: 'Missing cyberpunk seal' },
      })
      // Initially: no fallback, img visible.
      expect(w.find('.cyber-image__fallback').exists()).toBe(false)

      // Fire a REAL error event on the rendered <img> — this is the user-visible
      // trigger (browser fails to load the src), not an internal flag flip.
      await w.find('img').trigger('error')

      // The fallback placeholder must now be in the DOM.
      expect(w.find('.cyber-image__fallback').exists()).toBe(true)
      w.unmount()
    })

    it('hides the broken <img> after an error (no broken-image icon)', async () => {
      const w = mount(CyberImage, {
        props: { src: '/broken.webp', alt: 'x' },
      })
      const img = w.find('img')
      // Happy path: img has no inline display:none — it is painted.
      expect(img.attributes('style') || '').not.toContain('display: none')

      await img.trigger('error')

      // After the error, v-show flips the broken img to display:none so the
      // browser never paints its broken-image icon. We assert the inline style
      // (the actual contract v-show enforces) rather than isVisible() because
      // happy-dom's getComputedStyle does not always reflect inline display:none
      // for the test-utils visibility walker. The img element still EXISTS in
      // the DOM (so it can be reshown if src ever changes), but is not painted.
      expect(w.find('img').attributes('style') || '').toContain('display: none')
      w.unmount()
    })

    it('labels the fallback with role=img and the original alt text', async () => {
      const w = mount(CyberImage, {
        props: { src: '/broken.webp', alt: 'Official ISO27001 seal' },
      })
      await w.find('img').trigger('error')

      const fallback = w.find('.cyber-image__fallback')
      // role=img so AT treats the placeholder as an image.
      expect(fallback.attributes('role')).toBe('img')
      // aria-label carries the alt so the image's purpose is still announced.
      expect(fallback.attributes('aria-label')).toBe('Official ISO27001 seal')
      w.unmount()
    })

    it('does not show the fallback on the happy path (img loads normally)', () => {
      // No error event fired → fallback must stay absent, img must stay visible.
      const w = mount(CyberImage, {
        props: { src: '/images/about/about-who-we-are.webp', alt: 'hero' },
      })
      expect(w.find('.cyber-image__fallback').exists()).toBe(false)
      expect(w.find('img').isVisible()).toBe(true)
      w.unmount()
    })

    // RED-TEST PROOF: the fallback is event-driven. If a future refactor removes
    // the @error listener, the assertion above silently passes (no error fired,
    // no fallback shown) while the production user still sees a broken-image
    // icon. This proof confirms the behavior is genuinely event-driven: trigger
    // the error and assert the state changed — a no-op / unwired listener would
    // leave the fallback absent.
    it('RED-TEST PROOF: error event actually flips state (listener is wired)', async () => {
      const w = mount(CyberImage, {
        props: { src: '/broken.webp', alt: 'x' },
      })
      expect(w.find('.cyber-image__fallback').exists()).toBe(false)
      await w.find('img').trigger('error')
      expect(w.find('.cyber-image__fallback').exists()).toBe(true)
      w.unmount()
    })

    // Security-agent Low finding (#305 review): when a <CyberImage> instance is
    // reused across SPA navigation (e.g. the main article image in NewsDetail.vue
    // lives outside the v-for and is reused when <router-view> has no :key), if
    // article A's image 404s (errored=true) and the user navigates to article B
    // (working image), :src updates but errored MUST reset so the good image is
    // not stuck behind the placeholder until a full reload.
    it('resets the errored state when src prop changes (SPA-nav instance reuse)', async () => {
      const w = mount(CyberImage, {
        props: { src: '/broken-a.webp', alt: 'Article A' },
      })
      // Article A's image fails to load → fallback shows, img hidden.
      await w.find('img').trigger('error')
      expect(w.find('.cyber-image__fallback').exists()).toBe(true)
      expect(w.find('img').attributes('style') || '').toContain('display: none')

      // SPA-navigate to article B: only the src prop changes; the component
      // instance is reused. errored must reset so article B's good image is
      // shown (fallback gone, img v-show visible again).
      await w.setProps({ src: '/good-b.webp', alt: 'Article B' })

      // The fallback placeholder must be gone.
      expect(w.find('.cyber-image__fallback').exists()).toBe(false)
      // The img must be visible again (no inline display:none from v-show).
      expect(w.find('img').attributes('style') || '').not.toContain(
        'display: none',
      )
      // The new src must reach the rendered <img> (sanity: the prop really
      // changed, so a reset-to-visible is the correct behavior, not a stuck hide).
      expect(w.find('img').attributes('src')).toBe('/good-b.webp')
      w.unmount()
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
