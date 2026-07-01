/**
 * @file Home.test.ts
 * @description Unit tests for Home view — KTech official-site content parity.
 *
 * Drives the REAL useLanguage composable (translations are statically bundled
 * in src/locales/{en,zh}.json, so no fetch / no mock is needed). All assertions
 * pin the actual KTech copy and the cyberpunk visual language. A raw-key
 * regression guard and a zh-locale toggle test ensure no `home.*` placeholder
 * ever leaks to the DOM and that the Chinese catalog is exercised.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { mount, VueWrapper } from '@vue/test-utils'
import { createRouter, createMemoryHistory } from 'vue-router'
import fs from 'node:fs'
import path from 'node:path'
import { useLanguage } from '../../composables/useLanguage.js'
import Home from '../Home.vue'

// A minimal in-memory router so <router-link to="/about"> resolves into a real
// <a href="/about"> anchor we can assert against (matches the production setup).
const buildRouter = () =>
  createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/', component: Home },
      { path: '/about', component: { template: '<div>About</div>' } },
    ],
  })

describe('Home.vue', () => {
  let wrapper: VueWrapper

  beforeEach(() => {
    // Pin the default language for deterministic content assertions.
    useLanguage().setLanguage('en')
  })

  afterEach(() => {
    if (wrapper) wrapper.unmount()
    useLanguage().setLanguage('en')
  })

  // Mount with a real in-memory router so <router-link to="/about"> resolves
  // to a real <a href="/about"> anchor.
  const mountHome = () => {
    wrapper = mount(Home, { global: { plugins: [buildRouter()] } })
    return wrapper
  }

  describe('Cyberpunk structure', () => {
    beforeEach(() => {
      wrapper = mountHome()
    })

    it('renders the .home root', () => {
      expect(wrapper.find('.home').exists()).toBe(true)
    })

    it('renders exactly two layered grid backgrounds', () => {
      expect(wrapper.findAll('.grid-bg').length).toBe(2)
      expect(wrapper.find('.grid-bg-2').exists()).toBe(true)
    })

    it('renders the cyber header as the radial-pulse carrier inside .home', () => {
      // The hero ::before radial-gradient pulse (About's pattern) needs a real
      // structural carrier element. header.cyber-header is that carrier.
      const header = wrapper.find('.home header.cyber-header')
      expect(header.exists()).toBe(true)
    })

    it('renders the cyber header with neon title — glitch-text DROPPED (#224)', () => {
      // #224 removed the neon flicker / glitch animation. The h1 keeps neon-text
      // but must NOT carry glitch-text (the ::before/::after carrier).
      const header = wrapper.find('header.cyber-header')
      expect(header.exists()).toBe(true)
      const h1 = header.find('h1.neon-text')
      expect(h1.exists()).toBe(true)
      expect(h1.classes()).not.toContain('glitch-text')
    })

    it('no longer carries the data-text attribute that fed the glitch pseudos (#224)', () => {
      const title = wrapper.find('h1.neon-text')
      expect(title.attributes('data-text')).toBeUndefined()
    })

    it('renders a subtitle eyebrow', () => {
      expect(wrapper.find('.subtitle').exists()).toBe(true)
    })

    it('reuses .cyber-card for the hero intro', () => {
      expect(wrapper.find('.cyber-card').exists()).toBe(true)
    })

    it('wraps the What We Do block in a .section with .section-title.neon-text', () => {
      const whatwedo = wrapper.find('.whatwedo')
      expect(whatwedo.exists()).toBe(true)
      expect(whatwedo.classes()).toContain('section')
      const heading = whatwedo.find('h2.section-title.neon-text')
      expect(heading.exists()).toBe(true)
    })

    it('applies cyber-card + hover-lift to every solution card', () => {
      const cards = wrapper.findAll('.solution-card')
      expect(cards.length).toBe(6)
      cards.forEach((card) => {
        expect(card.classes()).toContain('cyber-card')
        expect(card.classes()).toContain('hover-lift')
      })
    })

    it('keeps the neon-border CTA control', () => {
      const cta = wrapper.find('.cta')
      expect(cta.exists()).toBe(true)
      expect(cta.find('.cyber-button.neon-border').exists()).toBe(true)
    })

    it('uses a single semantic h1', () => {
      expect(wrapper.findAll('h1').length).toBe(1)
    })

    it('uses semantic <header> and <section> landmarks', () => {
      expect(wrapper.find('header').exists()).toBe(true)
      expect(wrapper.findAll('section').length).toBeGreaterThan(0)
    })
  })

  describe('Hero content (en)', () => {
    beforeEach(() => {
      wrapper = mountHome()
    })

    it('H1 contains the official KTech mission title', () => {
      expect(wrapper.find('h1').text()).toContain(
        'Leading Fintech Company in China ASEAN Region',
      )
    })

    it('glitch data-text is GONE — h1 has no data-text binding (#224)', () => {
      // #224 removed the :data-text binding that fed the glitch ::before/::after
      // pseudo-elements via attr(data-text).
      expect(wrapper.find('h1.neon-text').attributes('data-text')).toBeUndefined()
    })

    it('subtitle is the official eyebrow', () => {
      expect(wrapper.find('.subtitle').text()).toBe('Better fintech for customers')
    })

    it('first hero paragraph carries the China-ASEAN mission line (#224)', () => {
      // #224 A2 replaced the KBank/Shenzhen regulator paragraph with the
      // China-ASEAN fintech mission line (exact issue wording).
      const firstP = wrapper.find('.cyber-card p.hero-description')
      const text = firstP.exists() ? firstP.text() : wrapper.find('.cyber-card p').text()
      expect(text).toContain('China-ASEAN')
      expect(text).toContain('leading fintech company')
    })

    it('second hero paragraph carries the better-financial-tech mission clause (#224)', () => {
      const paragraphs = wrapper.findAll('.cyber-card p')
      expect(paragraphs.length).toBeGreaterThanOrEqual(2)
      const second = paragraphs[1].text()
      expect(second).toContain('better financial-service technology')
    })

    it('CTA reads "Learn more" and links to /about', () => {
      const cta = wrapper.find('.cta')
      expect(cta.text()).toContain('Learn more')
      const link = cta.find('a[href="/about"]')
      expect(link.exists()).toBe(true)
    })
  })

  describe('Our Business section (en) — #224 rebrand of What We Do', () => {
    beforeEach(() => {
      wrapper = mountHome()
    })

    it('renders the rebranded section heading "Our Business"', () => {
      // #224 A1: "What We Do" -> "Our Business" (en). zh heading already
      // "我们的业务" (no change). The card grid is unchanged.
      expect(wrapper.text()).toContain('Our Business')
      expect(wrapper.text()).not.toContain('What We Do')
    })

    it('renders both group labels', () => {
      const text = wrapper.text()
      expect(text).toContain('Blockchain & Web3')
      expect(text).toContain('Banking Solution')
    })

    it('renders exactly six solution cards', () => {
      expect(wrapper.findAll('.solution-card').length).toBe(6)
    })

    it('Group 1: Regulated Public Blockchain', () => {
      const text = wrapper.text()
      expect(text).toContain('Regulated Public Blockchain')
      expect(text).toContain('Regulation-friendly blockchain infrastructure')
    })

    it('Group 1: Cross Border Payment', () => {
      const text = wrapper.text()
      expect(text).toContain('Cross Border Payment')
      expect(text).toContain('Multi-rail cross-border payment solution')
    })

    it('Group 1: Digital Asset Custody', () => {
      const text = wrapper.text()
      expect(text).toContain('Digital Asset Custody')
      expect(text).toContain('Bank-grade secure digital asset custody solution')
    })

    it('Group 1: Stablecoin', () => {
      const text = wrapper.text()
      expect(text).toContain('Stablecoin')
      expect(text).toContain('Compliance-ready stablecoin solution')
    })

    it('Group 2: Retail Lending', () => {
      const text = wrapper.text()
      expect(text).toContain('Retail Lending')
      expect(text).toContain('Unified IT solution provider for retail lending')
    })

    it('Group 2: Supply Chain Finance', () => {
      const text = wrapper.text()
      expect(text).toContain('Supply Chain Finance')
      expect(text).toContain('Advanced online supply chain financial solutions')
    })

    it('every solution card exposes a title and description', () => {
      wrapper.findAll('.solution-card').forEach((card) => {
        expect(card.find('h4').exists()).toBe(true)
        expect(card.find('p').exists()).toBe(true)
        expect(card.find('h4').text().length).toBeGreaterThan(0)
        expect(card.find('p').text().length).toBeGreaterThan(0)
      })
    })
  })

  describe('Stats block removed', () => {
    beforeEach(() => {
      wrapper = mountHome()
    })

    it('does not render the fabricated stats container', () => {
      expect(wrapper.find('.stats').exists()).toBe(false)
    })

    it('does not render any stat items', () => {
      expect(wrapper.findAll('.stat').length).toBe(0)
      expect(wrapper.findAll('.stat-value').length).toBe(0)
    })

    it('does not surface the fabricated SaaS numbers', () => {
      const text = wrapper.text()
      expect(text).not.toContain('99.9%')
      expect(text).not.toContain('1M+')
      expect(text).not.toContain('50ms')
    })
  })

  describe('i18n regression guards', () => {
    it('never renders a raw home.* placeholder key', () => {
      wrapper = mountHome()
      const text = wrapper.text()
      // Keys render glued to other text, so do NOT use \b here — match the
      // literal "home." prefix followed by at least one segment char.
      const rawKeyPattern = /home\.[a-zA-Z][a-zA-Z0-9.]*/g
      expect(text.match(rawKeyPattern)).toBeNull()
    })

    it('renders the zh catalog when the language is toggled', () => {
      const { setLanguage } = useLanguage()
      setLanguage('zh')
      wrapper = mountHome()
      const text = wrapper.text()
      expect(text).toContain('致力于成为中国—东盟地区领先的金融科技公司')
      expect(text).toContain('受监管的公共区块链')
      expect(text).toContain('了解更多')
    })
  })

  // ============================================
  // Parallax (AC #177) — visual gate. These source-level assertions make the
  // test RED if the parallax CSS or the useParallax wiring is deleted. They
  // complement the composable unit tests by pinning that Home actually opts in.
  // ============================================
  describe('Parallax (AC #177)', () => {
    const homeSource = fs.readFileSync(
      path.resolve(process.cwd(), 'src', 'views', 'Home.vue'),
      'utf-8',
    )

    it('Home uses useParallax (parity with About)', () => {
      expect(homeSource).toMatch(/from\s+['"]\.\.\/composables\/useParallax['"]/)
      expect(homeSource).toMatch(/useParallax\s*\(/)
    })

    it('Home wires useParallax with the grid + hero layers', () => {
      // The three Home parallax layers per the approved plan.
      expect(homeSource).toContain('.grid-bg')
      expect(homeSource).toContain('.grid-bg-2')
      expect(homeSource).toContain('.cyber-header')
      // Intensity numbers must be present (grid 12, overlay 6, hero 20).
      expect(homeSource).toMatch(/intensity:\s*12/)
      expect(homeSource).toMatch(/intensity:\s*6/)
      expect(homeSource).toMatch(/intensity:\s*20/)
    })

    it('Home binds the enabled ref to the root (dead-reactive-state guard)', () => {
      // rootRef on the root + enabled consumed via a data-attr binding.
      expect(homeSource).toMatch(/ref=["']rootRef["']/)
      expect(homeSource).toMatch(/data-parallax/)
    })

    it('Home parallax CSS source is present (will-change on grid/hero layers)', () => {
      // Deleting the parallax-targeted will-change rule makes this RED.
      expect(homeSource).toMatch(/will-change:\s*transform/)
      // Hero layer must carry a transition (no keyframe conflict there).
      expect(homeSource).toMatch(/\.cyber-header[^{]*\{[^}]*transition:\s*transform/s)
    })

    it('Home does NOT add a transform transition to .grid-bg-2 (keyframe conflict)', () => {
      // The gridMove keyframe already drives .grid-bg-2's transform; a transition
      // would fight it. Assert the scoped style keeps transition OUT of that rule.
      const grid2Block = homeSource.match(/\.grid-bg-2\s*\{([^}]*)\}/)
      expect(grid2Block).not.toBeNull()
      expect(grid2Block![1]).not.toMatch(/transition:\s*transform/)
    })
  })

  // ============================================
  // Packet Route is fully removed from Home (#223).
  // The puzzle mini-game was deleted as off-direction (#223). This gate asserts
  // Home.vue no longer imports, mounts, references, or renders any PacketRoute
  // artifact — proving the deletion is honest (no dangling imports / wrappers /
  // data-test hooks left behind). Mirrors the CyberOpsHud gate style (inverted).
  // RED-TEST PROOF: against the pre-#223 source every assertion below FAILS
  // (import present, section present, [data-test="packet-route"] present).
  // ============================================
  describe('Packet Route is fully removed from Home (#223)', () => {
    const homeSource = fs.readFileSync(
      path.resolve(process.cwd(), 'src', 'views', 'Home.vue'),
      'utf-8',
    )

    it('Home no longer imports PacketRoute', () => {
      expect(homeSource).not.toMatch(/from\s+['"]\.\.\/components\/PacketRoute\.vue['"]/)
    })

    it('Home no longer mounts PacketRoute or wraps it in .packet-route-section', () => {
      expect(homeSource).not.toMatch(/<PacketRoute\b/)
      expect(homeSource).not.toMatch(/packet-route-section/)
    })

    it('does not render [data-test="packet-route"] or [data-test="packet-grid"]', () => {
      wrapper = mountHome()
      expect(wrapper.find('[data-test="packet-route"]').exists()).toBe(false)
      expect(wrapper.find('[data-test="packet-grid"]').exists()).toBe(false)
    })

    it('renders no raw packetRoute.* key and no "Packet Route" title copy', () => {
      wrapper = mountHome()
      expect(wrapper.text()).not.toMatch(/packetRoute\.[a-zA-Z]/)
      expect(wrapper.text()).not.toContain('Packet Route')
    })
  })

  // ============================================
  // #224 — lazy-mount below-the-fold modules.
  // The 5 heavy interactive components (NeuralTerminal, NeuralCore,
  // SolutionForge, CyberOpsHud, NeonPulse) previously mounted EAGERLY on Home,
  // spinning up ~4 simultaneous rAF loops + ~43 CSS animations from initial
  // load despite being below the fold — the runtime lag source. #224 wraps each
  // in <LazySection> + defineAsyncComponent so they only mount when scrolled
  // into view. These source-level gates make the test RED if the lazy wiring is
  // reverted to static imports.
  // ============================================
  describe('#224 lazy-mounts below-the-fold modules', () => {
    const homeSource = fs.readFileSync(
      path.resolve(process.cwd(), 'src', 'views', 'Home.vue'),
      'utf-8',
    )

    // #254 — NeonPulse is removed from Home entirely. The component file, its
    // /pulse route, its own tests, useAudioPulse, and the pulse.* i18n namespace
    // all STAY (the component is still visitable at /pulse). Only the Home mount
    // is gone. This source-gate proves the removal in the live shipped Home.vue
    // and is RED before the removal lands.
    it('#254 does NOT mount NeonPulse on Home (AC1/AC2)', () => {
      expect(homeSource).not.toMatch(/<NeonPulse\b/)
      expect(homeSource).not.toMatch(/\(\)\s*=>\s*import\(['"][^'"]*NeonPulse\.vue['"]\)/)
      expect(homeSource).not.toMatch(/retryKeys\.neonPulse/)
    })

    it('converts the 5 heavy components to defineAsyncComponent', () => {
      // defineAsyncComponent is the Vue 3 primitive that yields a code-split
      // chunk + defers module evaluation until first render.
      expect(homeSource).toMatch(/defineAsyncComponent/)
      // Each of the 5 modules is dynamically imported.
      expect(homeSource).toMatch(/\(\)\s*=>\s*import\(['"][^'"]*NeuralTerminal\.vue['"]\)/)
      expect(homeSource).toMatch(/\(\)\s*=>\s*import\(['"][^'"]*NeuralCore\.vue['"]\)/)
      expect(homeSource).toMatch(/\(\)\s*=>\s*import\(['"][^'"]*SolutionForge\.vue['"]\)/)
      expect(homeSource).toMatch(/\(\)\s*=>\s*import\(['"][^'"]*CyberOpsHud\.vue['"]\)/)
      expect(homeSource).toMatch(/\(\)\s*=>\s*import\(['"][^'"]*NeonPulse\.vue['"]\)/)
    })

    it('drops the eager static imports of the 5 heavy components', () => {
      // The old eager imports looked like `import X from '../components/X.vue'`.
      // They must be gone — only the dynamic import form is allowed now.
      expect(homeSource).not.toMatch(/from\s+['"]\.\.\/components\/NeuralTerminal\.vue['"]/)
      expect(homeSource).not.toMatch(/from\s+['"]\.\.\/components\/NeuralCore\.vue['"]/)
      expect(homeSource).not.toMatch(/from\s+['"]\.\.\/components\/SolutionForge\.vue['"]/)
      expect(homeSource).not.toMatch(/from\s+['"]\.\.\/components\/CyberOpsHud\.vue['"]/)
      expect(homeSource).not.toMatch(/from\s+['"]\.\.\/components\/NeonPulse\.vue['"]/)
    })

    it('wraps each heavy component in <LazySection>', () => {
      // LazySection is the wrapper that defers mount until intersection.
      expect(homeSource).toMatch(/from\s+['"]\.\.\/components\/LazySection\.vue['"]/)
      expect(homeSource).toMatch(/<LazySection\b/)
      // All lazy modules wrapped. #224 wrapped the 5 heavy interactive modules;
      // #206 added the ambient SettlementStream as a 6th lazy-mounted child
      // (its rAF/interval must not spin before the user scrolls near it). Count
      // opening tags in the <template> region only (the import statement
      // `import LazySection from ...` would otherwise inflate the count). Match
      // the template usage form: <LazySection followed by a space + attribute
      // (class/data-test), which only appears in markup.
      const template = homeSource.match(/<template>([\s\S]*?)<\/template>/)
      expect(template, 'Home.vue must have a <template>').not.toBeNull()
      const matches = template![1].match(/<LazySection\b/g) || []
      expect(matches.length).toBe(6)
    })

    it('keeps the card catalogs unchanged (blockchain 4 + banking 2 = 6 cards)', () => {
      // #224 A1: the Our Business section reuses the existing card grid — no
      // duplicate section, no collapsing of banking into the blockchain group.
      const bc = homeSource.match(/key:\s*'(?:publicchain|crossborder|custody|stablechain|stablecoin)'/g) || []
      expect(bc.length).toBe(4)
      const bk = homeSource.match(/key:\s*'(?:retaillending|supplychain)'/g) || []
      expect(bk.length).toBe(2)
    })
  })

  // ============================================
  // #232 — chunk-load error hardening for the 5 lazy sections.
  // When a lazy chunk fails to fetch (deploy skew / CDN drop / ad-blocker), the
  // section used to go blank with no feedback or retry. #232 wires an
  // errorComponent (AsyncLoadError) + onError retry (<=2 attempts) + timeout:
  // 8000 to each of the 5 hardened sections, plus a user-facing Reload path
  // backed by a :key-bump remount. These source-level gates make the test RED
  // if the hardening is reverted to the simple defineAsyncComponent(() => ...)
  // form, OR if it is (incorrectly) widened to the out-of-scope modules.
  // ============================================
  describe('#232 chunk-load error hardening', () => {
    const homeSource = fs.readFileSync(
      path.resolve(process.cwd(), 'src', 'views', 'Home.vue'),
      'utf-8',
    )

    it('imports AsyncLoadError', () => {
      // The shared error affordance must be statically imported (entry chunk)
      // so it is available the instant a lazy section fails.
      expect(homeSource).toMatch(
        /from\s+['"]\.\.\/components\/AsyncLoadError\.vue['"]/,
      )
    })

    it('converts the 5 lazy loaders to options form with errorComponent + onError + timeout: 8000', () => {
      // Generic options-form gate: 5 occurrences of defineAsyncComponent({ ...
      const optionsForm = homeSource.match(/defineAsyncComponent\(\s*\{/g) || []
      expect(optionsForm.length).toBe(5)
      // Each carries the shared error affordance, the retry policy, and the
      // 8s timeout.
      expect(homeSource).toMatch(/errorComponent:\s*AsyncLoadError/)
      expect(homeSource).toMatch(/timeout:\s*8000/)
      expect(homeSource).toMatch(/onError:\s*retryChunkLoad/)
      // The shared retry handler is defined module-scope.
      expect(homeSource).toMatch(
        /const\s+retryChunkLoad\s*=\s*\([^)]*\)\s*=>\s*\{[^}]*attempts\s*<=\s*2[^}]*\}/,
      )
    })

    it('all 5 named sections use the hardened form', () => {
      // One regex per section: the options form must wrap each named loader.
      const re = (name: string) =>
        new RegExp(
          `const\\s+${name}\\s*=\\s*defineAsyncComponent\\(\\s*\\{[\\s\\S]*?errorComponent:\\s*AsyncLoadError[\\s\\S]*?\\}`,
        )
      expect(homeSource).toMatch(re('NeuralTerminal'))
      expect(homeSource).toMatch(re('NeuralCore'))
      expect(homeSource).toMatch(re('SolutionForge'))
      expect(homeSource).toMatch(re('CyberOpsHud'))
      expect(homeSource).toMatch(re('NeonPulse'))
    })

    it('does NOT widen hardening to SettlementStream or SelfDrivingDemo', () => {
      // Scope fence (iter-22): these two stay in simple form — out of scope.
      // They must NOT be options-form, and must NOT reference AsyncLoadError.
      expect(homeSource).toMatch(
        /const\s+SettlementStream\s*=\s*defineAsyncComponent\(\s*\(\)\s*=>\s*import\(['"][^'"]*SettlementStream\.vue['"]\)\s*\)/,
      )
      expect(homeSource).toMatch(
        /const\s+SelfDrivingDemo\s*=\s*defineAsyncComponent\(\s*\(\)\s*=>\s*import\(['"][^'"]*SelfDrivingDemo\.vue['"]\)\s*\)/,
      )
      // Neither name appears in an options-form declaration.
      const settlementOpts = homeSource.match(
        /SettlementStream[\s\S]{0,80}defineAsyncComponent\(\s*\{|defineAsyncComponent\(\s*\{[\s\S]{0,40}SettlementStream[\s\S]{0,120}errorComponent/,
      )
      expect(settlementOpts, 'SettlementStream must stay simple-form').toBeNull()
      const selfDrivingOpts = homeSource.match(
        /SelfDrivingDemo[\s\S]{0,80}defineAsyncComponent\(\s*\{|defineAsyncComponent\(\s*\{[\s\S]{0,40}SelfDrivingDemo[\s\S]{0,120}errorComponent/,
      )
      expect(selfDrivingOpts, 'SelfDrivingDemo must stay simple-form').toBeNull()
    })

    it('wires the user-facing Reload path: :key + @retry on each hardened section', () => {
      // The AsyncLoadError Retry button reaches back up via @retry -> bumpRetry
      // -> retryKeys bump -> :key change -> async boundary remount -> loader
      // re-runs. Each of the 5 sections must bind BOTH :key (from retryKeys)
      // and @retry (to bumpRetry).
      const reKey = (k: string) =>
        new RegExp(`:key="[^"]*\\$\\{retryKeys\\.${k}\\}[^"]*"`)
      const reRetry = (k: string) => new RegExp(`@retry="bumpRetry\\('${k}'\\)"`)
      const sections: Array<[string, string]> = [
        ['neuralTerminal', 'NeuralTerminal'],
        ['neuralCore', 'NeuralCore'],
        ['solutionForge', 'SolutionForge'],
        ['cyberOpsHud', 'CyberOpsHud'],
        ['neonPulse', 'NeonPulse'],
      ]
      for (const [key, _name] of sections) {
        expect(homeSource, `:key for ${key}`).toMatch(reKey(key))
        expect(homeSource, `@retry for ${key}`).toMatch(reRetry(key))
      }
      // retryKeys covers exactly the 5 sections + bumpRetry increments.
      expect(homeSource).toMatch(/const\s+retryKeys\s*=\s*ref\(\{/)
      expect(homeSource).toMatch(/const\s+bumpRetry\s*=/)
    })
  })
})
