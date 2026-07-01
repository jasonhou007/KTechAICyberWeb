/**
 * @file App.nav-wiring.test.ts
 * @description Shipped-app verification that Header is actually wired into
 * App.vue (#164 nav overhaul — the gate the prior iteration skipped).
 *
 * WHY THIS TEST EXISTS:
 * The #164 nav overhaul (PR #169) shipped Header.vue rewritten with the 6
 * routed nav items + dropdowns + mobile hamburger, but Header was NEVER
 * mounted in App.vue — App.vue kept rendering its old inline 4-link nav
 * (`.cyber-nav`). The entire overhaul (+ the a11y revise) was dead code, and
 * no test caught it because Header was only ever tested in ISOLATION. Every
 * Header unit test passed while the shipped app showed the pre-overhaul nav.
 *
 * This test closes that gap: it mounts the REAL App.vue with a REAL router
 * and the REAL child components (Header, LanguageSwitcher, SkipLink are NOT
 * mocked), then asserts that text which ONLY exists inside Header.vue
 * actually reaches the DOM. If anyone reverts the wiring (removes
 * <Header /> from App.vue), this test fails — the dropdown trigger labels
 * "Our Solutions" / "Join Us" would vanish from the rendered App.
 *
 * #239: the dark/light ThemeToggle was removed and the site is locked to
 * dark. The toolbar slot must still render the language toggle (proves the
 * EN/中文 switch survived the wiring) AND must NOT render a theme toggle
 * (proves the toggle was actually deleted, not just visually hidden).
 *
 * Test that would FAIL if Header weren't wired:
 *   - "Our Solutions" and "Join Us" dropdown triggers render (these strings
 *     live exclusively in Header.vue's submenu definitions).
 *   - nav#navbar (Header's root element) is present.
 *   - The toolbar slot renders the language toggle (button.language-switcher)
 *     and does NOT render a theme toggle (#239).
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createRouter, createMemoryHistory, type Router } from 'vue-router'

// useHead registers reactive <head> tags; stub it so App.setup() doesn't need
// a real head manager. This is the ONLY App dependency we mock — everything
// else (Header, the toggles, i18n, the router) is real.
vi.mock('@vueuse/head', () => ({
  useHead: () => {},
}))

// SEO helpers compute head meta from the route; the assertions below are about
// nav DOM, not meta tags, so we don't need real SEO values. Stubbing avoids
// coupling this test to the SEO module's shape.
vi.mock('../utils/seo', () => ({
  getRouteMeta: () => ({
    title: 't', description: 'd', keywords: 'k',
    ogType: 'website', ogLocale: 'en', ogSiteName: 's', ogUrl: 'u',
    ogImage: 'i', twitterCard: 'summary', twitterSite: 's', twitterImage: 'i',
    canonical: 'c',
  }),
  getStructuredData: () => [],
}))

// Minimal route table — only the routes the nav links to need to resolve so
// <router-link to="/..."> renders a real href. The components are placeholders
// because this test asserts the NAV (App shell), not the routed views.
const routes = [
  { path: '/', component: { template: '<div data-testid="route-home"></div>' } },
  { path: '/about', component: { template: '<div></div>' } },
  { path: '/news', component: { template: '<div></div>' } },
  { path: '/services/cross-border-payment', component: { template: '<div></div>' } },
  { path: '/join-us', component: { template: '<div></div>' } },
  { path: '/careers', component: { template: '<div></div>' } },
  { path: '/contact', component: { template: '<div></div>' } },
]

const buildRouter = (): Router =>
  createRouter({
    history: createMemoryHistory(),
    routes,
  })

const App = (await import('../App.vue')).default

describe('App.vue -> Header nav wiring (#164 shipped-app gate)', () => {
  let pinia: ReturnType<typeof createPinia>

  beforeEach(() => {
    localStorage.clear()
    pinia = createPinia()
    setActivePinia(pinia)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  const mountApp = async () => {
    const router = buildRouter()
    await router.push('/')
    await router.isReady()
    const wrapper = mount(App, { global: { plugins: [pinia, router] } })
    // Let the real useLanguage + onMounted (initLanguage) settle.
    await flushPromises()
    await wrapper.vm.$nextTick()
    return wrapper
  }

  it('renders Header\'s nav#navbar in the shipped App (not the old .cyber-nav)', async () => {
    const wrapper = await mountApp()
    // Header's root element is <nav id="navbar">. If Header were unwired,
    // this would be absent and the old .cyber-nav would still be present.
    expect(wrapper.find('nav#navbar').exists()).toBe(true)
    expect(wrapper.find('.cyber-nav').exists()).toBe(false)
  })

  it('renders the 6 routed top-level nav items (Home + Contact as links)', async () => {
    const wrapper = await mountApp()
    // Header renders exactly 6 <li> children inside ul.nav-links.
    const items = wrapper.findAll('nav#navbar ul.nav-links > li')
    expect(items).toHaveLength(6)
    // First li > a is Home (router-link to "/"), sixth li > a is Contact.
    const homeHref = items[0].find('a').attributes('href')
    const contactHref = items[5].find('a').attributes('href')
    expect(homeHref).toBe('/')
    expect(contactHref).toBe('/contact')
  })

  it('renders the "Our Solutions" and "Join Us" dropdown triggers — text that ONLY exists in Header.vue', async () => {
    // This is the core regression gate. "Our Solutions" and "Join Us" are
    // dropdown trigger labels defined in Header.vue. If App.vue stops wiring
    // <Header />, these strings disappear from the rendered App entirely.
    const wrapper = await mountApp()
    const triggerTexts = wrapper
      .findAll('nav#navbar .dropdown-trigger')
      .map((b) => b.text())

    expect(triggerTexts).toEqual(
      expect.arrayContaining(['Our Solutions ▼', 'Join Us ▼']),
    )
    // 2 dropdown triggers remain (Our Solutions / Join Us). Home + About + News
    // + Contact are now direct router-links (#255 About, #256 News).
    expect(wrapper.findAll('nav#navbar .dropdown-trigger')).toHaveLength(2)
  })

  it('renders the KTech brand logo from Header (KAI<span>TECH</span>)', async () => {
    const wrapper = await mountApp()
    const logo = wrapper.find('nav#navbar .nav-logo')
    expect(logo.exists()).toBe(true)
    expect(logo.text()).toBe('KAITECH')
    // The brand is a router-link to "/" (no # anchor).
    expect(logo.attributes('href')).toBe('/')
  })

  it('keeps the language toggle and drops the theme toggle in the nav toolbar (#239 dark lock)', async () => {
    // #239: ThemeToggle.vue was deleted. The toolbar slot MUST still render
    // the real LanguageSwitcher (button.language-switcher) AND must NOT render
    // a theme toggle (button.theme-toggle). If anyone re-adds a
    // <ThemeToggle /> to the slot, this test fails on the absence assertion.
    const wrapper = await mountApp()
    const toolbar = wrapper.find('nav#navbar .nav-toolbar')
    expect(toolbar.exists()).toBe(true)
    // Real LanguageSwitcher renders button.language-switcher.
    expect(toolbar.find('button.language-switcher').exists()).toBe(true)
    // #239: the theme toggle is gone — it must NOT render.
    expect(toolbar.find('button.theme-toggle').exists()).toBe(false)
  })

  // --------------------------------------------------------------------------
  // #240 — RUM beacon removed from the shipped footer (live-DOM proof).
  // This mounts the REAL App (no child mocked) and asserts the footer does
  // NOT render the performance-monitoring dashboard. The footer itself must
  // still render (proves we didn't accidentally delete the whole footer).
  // RED-TEST PROOF: re-adding <RumDashboard v-if="rumMounted"> to App.vue
  // makes the .rum-dashboard assertion fail.
  // --------------------------------------------------------------------------
  it('does NOT render the RUM dashboard in the shipped footer (#240 removal)', async () => {
    const wrapper = await mountApp()
    // The footer must still exist (we only removed the RUM child, not the
    // footer region itself).
    expect(wrapper.find('footer.cyber-footer').exists()).toBe(true)
    // No RUM dashboard artifact reaches the live DOM.
    expect(wrapper.find('.rum-dashboard').exists()).toBe(false)
    expect(wrapper.find('.footer-rum').exists()).toBe(false)
    expect(wrapper.find('[data-test="rum-toggle"]').exists()).toBe(false)
    expect(wrapper.find('[data-test="rum-region"]').exists()).toBe(false)
    // The status dot + status text remain (the footer-status wrapper is
    // intact, just without the RUM child).
    expect(wrapper.find('footer.cyber-footer .status-dot').exists()).toBe(true)
  })
})
