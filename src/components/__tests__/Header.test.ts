/**
 * @file Header.test.ts
 * @description Unit tests for the rewritten Header (#164 nav overhaul).
 *
 * The Header now renders 6 routed top-level nav items matching the official
 * kaitai.tech structure: Home (router-link /), About Us (direct router-link
 * /about), News / Our Solutions / Join Us (each a NavigationDropdown submenu),
 * and Contact (router-link /contact). The logo is a router-link to "/" (no
 * # anchor). A mobile hamburger button toggles an off-canvas .nav-links panel.
 *
 * The dropdowns render via the REAL NavigationDropdown component (not stubbed)
 * so we assert the submenu structure too. router-link is stubbed so the Home
 * and Contact items render as <a href="...">.
 *
 * Test Categories:
 * - Rendering / structure (6 items, no # anchors)
 * - Logo (router-link to /)
 * - Top-level routed items (Home + Contact as <a>)
 * - Dropdown submenus (About / News / Solutions / Join Us)
 *   - item counts + labels via t()
 *   - Our Solutions grouped mega-menu (2 groups, 6 items)
 * - Mobile hamburger (aria-label, aria-expanded toggle, mobile-open class)
 * - Scroll behavior (scrolled class + listener cleanup)
 * - i18n (t('nav.home') = 'Home', etc.)
 * - Edge cases (multi-mount)
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mount, VueWrapper } from '@vue/test-utils'
import Header from '../Header.vue'

// useRouter is used by the real NavigationDropdown child; stub its push so
// submenu item clicks resolve without a live router instance. The mock
// replaces vue-router wholesale, so we use a custom inline router-link stub
// (the library RouterLinkStub depends on vue-router's real RouterLink).
const { pushMock, afterEachMock } = vi.hoisted(() => ({
  pushMock: vi.fn(),
  afterEachMock: vi.fn(() => vi.fn()), // afterEach returns an unsubscribe
}))
vi.mock('vue-router', () => ({
  useRouter: () => ({ push: pushMock, afterEach: afterEachMock }),
}))

// Inline router-link stub: renders <a :href="to"> with slotted text, mirroring
// the stub the rest of the suite uses for isolated view mounts.
const RouterLinkStub = {
  name: 'RouterLink',
  props: { to: { type: [String, Object], default: '' } },
  computed: {
    href() {
      return typeof this.to === 'string'
        ? this.to
        : (this.to && this.to.path) || ''
    },
  },
  template: '<a :href="href"><slot /></a>',
}

describe('Header.vue', () => {
  let wrapper: VueWrapper

  beforeEach(() => {
    Object.defineProperty(window, 'scrollY', {
      configurable: true,
      writable: true,
      value: 0,
    })
    pushMock.mockClear()
    wrapper = mount(Header, {
      global: {
        stubs: {
          'router-link': RouterLinkStub,
        },
      },
    })
  })

  afterEach(() => {
    wrapper.unmount()
  })

  // ============================================
  // Rendering / structure
  // ============================================
  describe('Rendering', () => {
    it('mounts without errors', () => {
      expect(wrapper.exists()).toBe(true)
    })

    it('renders a semantic <nav> element', () => {
      const nav = wrapper.find('nav')
      expect(nav.exists()).toBe(true)
      expect(nav.element.tagName.toLowerCase()).toBe('nav')
    })

    it('applies the `nav` class to the root nav', () => {
      expect(wrapper.find('nav.nav').exists()).toBe(true)
    })

    it('exposes the navbar via id="navbar"', () => {
      expect(wrapper.find('#navbar').exists()).toBe(true)
    })

    it('does not apply the scrolled class on initial mount', () => {
      expect(wrapper.find('nav').classes()).not.toContain('scrolled')
    })

    it('renders the logo link and the unordered link list', () => {
      expect(wrapper.find('.nav-logo').exists()).toBe(true)
      expect(wrapper.find('ul.nav-links').exists()).toBe(true)
    })

    it('renders exactly six top-level <li> entries', () => {
      expect(wrapper.findAll('ul.nav-links > li')).toHaveLength(6)
    })

    it('renders exactly two NavigationDropdown instances', () => {
      // Our Solutions / Join Us. (Home + About + News + Contact are direct router-links.)
      expect(wrapper.findAll('.nav-dropdown')).toHaveLength(2)
    })
  })

  // ============================================
  // Logo (now a router-link to "/")
  // ============================================
  describe('Logo', () => {
    it('renders the "K" base text in the logo', () => {
      // #351: brand is "KTech" (K<span class="accent">Tech</span>); visible-text
      // assertion guards against any regression to the old wrong brand markup.
      expect(wrapper.find('.nav-logo').text()).toContain('K')
    })

    it('renders the "Tech" accent text inside a span.accent', () => {
      const accent = wrapper.find('.nav-logo .accent')
      expect(accent.exists()).toBe(true)
      expect(accent.text()).toBe('Tech')
    })

    it('renders the full logo text as "KTech"', () => {
      // #351: nav-logo visible text must be exactly "KTech", never the old brand.
      expect(wrapper.find('.nav-logo').text()).toBe('KTech')
    })

    it('renders the logo as a router-link pointing at "/" (NOT a # anchor)', () => {
      const logo = wrapper.find('.nav-logo')
      // RouterLinkStub renders <a href="...">.
      expect(logo.element.tagName.toLowerCase()).toBe('a')
      expect(logo.attributes('href')).toBe('/')
    })
  })

  // ============================================
  // No dead # anchors anywhere in nav
  // ============================================
  describe('Dead-link audit', () => {
    it('renders ZERO anchor links with an href starting with "#"', () => {
      const hashAnchors = wrapper.findAll('nav a[href^="#"]')
      expect(hashAnchors).toHaveLength(0)
    })
  })

  // ============================================
  // Top-level routed items (Home + Contact)
  // ============================================
  describe('Routed top-level items', () => {
    it('renders Home as a router-link to "/" with the translated label', () => {
      // First <li> child of nav-links is Home.
      const home = wrapper.find('ul.nav-links > li:nth-child(1) a')
      expect(home.exists()).toBe(true)
      expect(home.attributes('href')).toBe('/')
      expect(home.text()).toBe(wrapper.vm.t('nav.home'))
    })

    it('renders Contact as a router-link to "/contact" with the translated label', () => {
      // Sixth <li> child of nav-links is Contact.
      const contact = wrapper.find('ul.nav-links > li:nth-child(6) a')
      expect(contact.exists()).toBe(true)
      expect(contact.attributes('href')).toBe('/contact')
      expect(contact.text()).toBe(wrapper.vm.t('nav.contact'))
    })

    it('renders About as a router-link to "/about" with the translated label', () => {
      // Second <li> child of nav-links is About (now a direct link, not a dropdown).
      const about = wrapper.find('ul.nav-links > li:nth-child(2) a')
      expect(about.exists()).toBe(true)
      expect(about.attributes('href')).toBe('/about')
      expect(about.text()).toBe(wrapper.vm.t('nav.aboutUs'))
    })

    it('renders Home with the English label "Home"', () => {
      expect(wrapper.vm.t('nav.home')).toBe('Home')
    })

    it('renders Contact with the English label "Contact"', () => {
      expect(wrapper.vm.t('nav.contact')).toBe('Contact')
    })
  })

  // ============================================
  // Dropdown submenus (real NavigationDropdown children)
  // ============================================
  describe('Dropdown submenus', () => {
    it('renders News as a direct router-link to /news with the translated label', () => {
      // Third <li> child of nav-links is News (now a direct link, not a dropdown).
      const news = wrapper.find('ul.nav-links > li:nth-child(3) a')
      expect(news.exists()).toBe(true)
      expect(news.attributes('href')).toBe('/news')
      expect(news.text()).toBe(wrapper.vm.t('nav.news'))
    }),

    it('opens the Join Us dropdown on click and lists 2 items with t() labels', async () => {
      await wrapper.findAll('.dropdown-trigger')[1].trigger('click')
      const items = wrapper.findAll('.dropdown-menu .dropdown-item')
      expect(items).toHaveLength(2)
      expect(items[0].text()).toBe(wrapper.vm.t('nav.submenu.joinUs'))
      expect(items[1].text()).toBe(wrapper.vm.t('nav.submenu.positionList'))
    })

    it('opens the Our Solutions dropdown on click and shows 6 items across 2 groups', async () => {
      await wrapper.findAll('.dropdown-trigger')[0].trigger('click')
      // 6 flat items total, 2 group headings.
      expect(wrapper.findAll('.dropdown-menu .dropdown-item')).toHaveLength(6)
      expect(wrapper.findAll('.dropdown-group')).toHaveLength(2)
      expect(wrapper.findAll('.dropdown-group-heading')).toHaveLength(2)
    })

    it('renders the two Our Solutions group headings via t()', async () => {
      await wrapper.findAll('.dropdown-trigger')[0].trigger('click')
      const headings = wrapper.findAll('.dropdown-group-heading')
      expect(headings[0].text()).toBe(wrapper.vm.t('nav.groups.banking'))
      expect(headings[1].text()).toBe(wrapper.vm.t('nav.groups.blockchainWeb3'))
    })

    it('renders the Our Solutions items in grouped order via t()', async () => {
      await wrapper.findAll('.dropdown-trigger')[0].trigger('click')
      const items = wrapper.findAll('.dropdown-menu .dropdown-item')
      // Banking group: retailLending, supplyChainFinance.
      expect(items[0].text()).toBe(wrapper.vm.t('nav.submenu.retailLending'))
      expect(items[1].text()).toBe(wrapper.vm.t('nav.submenu.supplyChainFinance'))
      // Blockchain & Web3 group: blockchain, crossBorderPayment,
      // digitalAssetCustody, stablecoin.
      expect(items[2].text()).toBe(wrapper.vm.t('nav.submenu.blockchain'))
      expect(items[3].text()).toBe(wrapper.vm.t('nav.submenu.crossBorderPayment'))
      expect(items[4].text()).toBe(wrapper.vm.t('nav.submenu.digitalAssetCustody'))
      expect(items[5].text()).toBe(wrapper.vm.t('nav.submenu.stablecoin'))
    })
  })

  // ============================================
  // Mobile hamburger
  // ============================================
  describe('Mobile hamburger', () => {
    it('renders a .nav-toggle button', () => {
      expect(wrapper.find('button.nav-toggle').exists()).toBe(true)
    })

    it('renders three .nav-toggle-bar spans inside the toggle', () => {
      expect(wrapper.findAll('.nav-toggle .nav-toggle-bar')).toHaveLength(3)
    })

    it('exposes an aria-label on the toggle reflecting the closed state', () => {
      expect(wrapper.find('.nav-toggle').attributes('aria-label')).toBe(
        wrapper.vm.t('nav.menu.open'),
      )
    })

    it('starts with aria-expanded="false"', () => {
      expect(wrapper.find('.nav-toggle').attributes('aria-expanded')).toBe('false')
    })

    it('flips aria-expanded to "true" on click', async () => {
      const toggle = wrapper.find('.nav-toggle')
      await toggle.trigger('click')
      expect(toggle.attributes('aria-expanded')).toBe('true')
    })

    it('flips aria-label to the close label when open', async () => {
      const toggle = wrapper.find('.nav-toggle')
      await toggle.trigger('click')
      expect(toggle.attributes('aria-label')).toBe(wrapper.vm.t('nav.menu.close'))
    })

    // #190: mobile-open class now lives on the .nav-mobile-dialog wrapper
    // (role=dialog moved off the <ul>).
    it('adds the mobile-open class to the drawer wrapper on toggle click', async () => {
      const dialog = wrapper.find('.nav-mobile-dialog')
      expect(dialog.classes()).not.toContain('mobile-open')
      await wrapper.find('.nav-toggle').trigger('click')
      expect(dialog.classes()).toContain('mobile-open')
    })

    it('removes the mobile-open class on a second toggle click', async () => {
      const toggle = wrapper.find('.nav-toggle')
      const dialog = wrapper.find('.nav-mobile-dialog')
      await toggle.trigger('click')
      await toggle.trigger('click')
      expect(dialog.classes()).not.toContain('mobile-open')
    })
  })

  // ============================================
  // Mobile drawer a11y (M3) — focus management + close-on-navigate
  // ============================================
  describe('Mobile drawer a11y (M3)', () => {
    // #190: role="dialog" moved OFF the <ul> onto a wrapping div. These M3
    // assertions now target the wrapper (role=dialog[aria-modal=true]) rather
    // than the <ul> directly, matching the corrected structure.
    it('exposes role="dialog" on the drawer wrapper', () => {
      expect(wrapper.find('[role="dialog"]').exists()).toBe(true)
    })

    it('exposes aria-modal="true" on the drawer wrapper', () => {
      expect(wrapper.find('[role="dialog"][aria-modal="true"]').exists()).toBe(true)
    })

    it('exposes a non-empty aria-label on the drawer wrapper', () => {
      const dialog = wrapper.find('[role="dialog"][aria-modal="true"]')
      expect(dialog.attributes('aria-label')).toBeTruthy()
    })

    it('moves focus into the panel when the drawer opens', async () => {
      // Mount with the panel attached to the document so .focus() is observable.
      const attached = mount(Header, {
        attachTo: document.body,
        global: { stubs: { 'router-link': RouterLinkStub } },
      })
      try {
        const aToggle = attached.find('.nav-toggle')
        const panel = attached.find('.nav-links').element as HTMLElement
        const firstFocusable = panel.querySelector(
          'a[href], button:not([disabled])',
        ) as HTMLElement
        const focusSpy = vi.spyOn(firstFocusable, 'focus')
        await aToggle.trigger('click')
        expect(focusSpy).toHaveBeenCalled()
      } finally {
        attached.unmount()
      }
    })

    it('restores focus to the hamburger when the drawer closes', async () => {
      const attached = mount(Header, {
        attachTo: document.body,
        global: { stubs: { 'router-link': RouterLinkStub } },
      })
      try {
        const aToggle = attached.find('.nav-toggle')
        const aToggleEl = aToggle.element as HTMLElement
        const focusSpy = vi.spyOn(aToggleEl, 'focus')

        await aToggle.trigger('click') // open
        await aToggle.trigger('click') // close
        expect(focusSpy).toHaveBeenCalled()
      } finally {
        attached.unmount()
      }
    })

    it('closes the drawer when a top-level nav link is clicked', async () => {
      const dialog = wrapper.find('.nav-mobile-dialog')
      await wrapper.find('.nav-toggle').trigger('click')
      expect(dialog.classes()).toContain('mobile-open')

      // Click the Home link (first top-level routed item).
      await wrapper.find('ul.nav-links > li:nth-child(1) a').trigger('click')
      expect(dialog.classes()).not.toContain('mobile-open')
    })

    it('closes the drawer on Escape and restores focus to the toggle', async () => {
      const attached = mount(Header, {
        attachTo: document.body,
        global: { stubs: { 'router-link': RouterLinkStub } },
      })
      try {
        const aToggle = attached.find('.nav-toggle')
        const aToggleEl = aToggle.element as HTMLElement
        const focusSpy = vi.spyOn(aToggleEl, 'focus')

        await aToggle.trigger('click')
        expect(attached.find('.nav-mobile-dialog').classes()).toContain('mobile-open')

        document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
        await attached.vm.$nextTick()
        expect(attached.find('.nav-mobile-dialog').classes()).not.toContain('mobile-open')
        expect(focusSpy).toHaveBeenCalled()
      } finally {
        attached.unmount()
      }
    })
  })

  // ============================================
  // Scroll behavior
  // ============================================
  describe('Scroll Behavior', () => {
    it('adds the scrolled class once scrollY exceeds 50', async () => {
      const nav = wrapper.find('nav')
      Object.defineProperty(window, 'scrollY', {
        configurable: true,
        writable: true,
        value: 51,
      })
      window.dispatchEvent(new Event('scroll'))
      await wrapper.vm.$nextTick()
      expect(nav.classes()).toContain('scrolled')
    })

    it('does not add the scrolled class when scrollY is exactly 50', async () => {
      const nav = wrapper.find('nav')
      Object.defineProperty(window, 'scrollY', {
        configurable: true,
        writable: true,
        value: 50,
      })
      window.dispatchEvent(new Event('scroll'))
      await wrapper.vm.$nextTick()
      expect(nav.classes()).not.toContain('scrolled')
    })

    it('removes the scrolled class when scrolling back above the threshold', async () => {
      const nav = wrapper.find('nav')
      Object.defineProperty(window, 'scrollY', {
        configurable: true,
        writable: true,
        value: 200,
      })
      window.dispatchEvent(new Event('scroll'))
      await wrapper.vm.$nextTick()
      expect(nav.classes()).toContain('scrolled')

      Object.defineProperty(window, 'scrollY', {
        configurable: true,
        writable: true,
        value: 0,
      })
      window.dispatchEvent(new Event('scroll'))
      await wrapper.vm.$nextTick()
      expect(nav.classes()).not.toContain('scrolled')
    })

    it('removes the scroll listener on unmount', async () => {
      const removeSpy = vi.spyOn(window, 'removeEventListener')
      wrapper.unmount()
      expect(removeSpy).toHaveBeenCalledWith('scroll', expect.any(Function))
      removeSpy.mockRestore()
      wrapper = mount(Header, {
        global: { stubs: { 'router-link': RouterLinkStub } },
      })
    })
  })

  // ============================================
  // Accessibility
  // ============================================
  describe('Accessibility', () => {
    it('uses a semantic <nav> landmark element', () => {
      expect(wrapper.find('nav').exists()).toBe(true)
    })

    it('exposes a stable id (navbar) for skip-link targeting', () => {
      expect(wrapper.find('#navbar').exists()).toBe(true)
    })

    it('the logo link and routed items render as focusable anchors', () => {
      // Logo + Home + About + News + Contact = 5 <a> (dropdowns render <button> triggers).
      const links = wrapper.findAll('nav a')
      expect(links.length).toBeGreaterThanOrEqual(5)
      links.forEach((link) => {
        expect(link.element.tagName.toLowerCase()).toBe('a')
      })
    })

    it('all top-level nav <a> have href attributes', () => {
      const links = wrapper.findAll('nav a')
      links.forEach((link) => {
        expect(link.attributes('href')).toBeTruthy()
      })
    })
  })

  // ============================================
  // i18n (shared useLanguage t)
  // ============================================
  describe('Internationalization (shared useLanguage t())', () => {
    it('exposes a translation function on the component instance', () => {
      expect(typeof wrapper.vm.t).toBe('function')
    })

    it('translates nav.home to the English label', () => {
      expect(wrapper.vm.t('nav.home')).toBe('Home')
    })

    it('translates nav.aboutUs to the English label', () => {
      expect(wrapper.vm.t('nav.aboutUs')).toBe('About Us')
    })

    it('translates nav.ourSolutions to the English label', () => {
      expect(wrapper.vm.t('nav.ourSolutions')).toBe('Our Solutions')
    })

    it('translates nav.joinUs to the English label', () => {
      expect(wrapper.vm.t('nav.joinUs')).toBe('Join Us')
    })

    it('translates nav.contact to the English label', () => {
      expect(wrapper.vm.t('nav.contact')).toBe('Contact')
    })

    it('translates nav.menu.open / nav.menu.close', () => {
      expect(wrapper.vm.t('nav.menu.open')).toBe('Open menu')
      expect(wrapper.vm.t('nav.menu.close')).toBe('Close menu')
    })

    it('returns the key as fallback for unknown keys', () => {
      expect(wrapper.vm.t('nav.unknown')).toBe('nav.unknown')
    })
  })

  // ============================================
  // Edge cases
  // ============================================
  describe('Edge Cases', () => {
    it('can be mounted and unmounted multiple times', () => {
      const wrappers = [
        mount(Header, { global: { stubs: { 'router-link': RouterLinkStub } } }),
        mount(Header, { global: { stubs: { 'router-link': RouterLinkStub } } }),
        mount(Header, { global: { stubs: { 'router-link': RouterLinkStub } } }),
      ]
      wrappers.forEach((w) => {
        expect(w.exists()).toBe(true)
        expect(w.text()).toContain('KTech')
        expect(w.findAll('ul.nav-links > li')).toHaveLength(6)
      })
      wrappers.forEach((w) => w.unmount())
    })

    it('renders correctly when remounted after unmount', () => {
      wrapper.unmount()
      const fresh = mount(Header, {
        global: { stubs: { 'router-link': RouterLinkStub } },
      })
      expect(fresh.find('.nav-logo').text()).toBe('KTech')
      expect(fresh.findAll('ul.nav-links > li')).toHaveLength(6)
      expect(fresh.findAll('ul.nav-links a[href^="#"]')).toHaveLength(0)
      fresh.unmount()
      wrapper = mount(Header, {
        global: { stubs: { 'router-link': RouterLinkStub } },
      })
    })

    it('handles rapid mount/unmount cycles without error', () => {
      for (let i = 0; i < 10; i++) {
        const w = mount(Header, {
          global: { stubs: { 'router-link': RouterLinkStub } },
        })
        expect(w.exists()).toBe(true)
        w.unmount()
      }
    })
  })

  // ============================================
  // Component Structure
  // ============================================
  describe('Component Structure', () => {
    it('renders the expected DOM hierarchy', () => {
      const nav = wrapper.find('nav.nav')
      expect(nav.find('.nav-logo').exists()).toBe(true)
      expect(nav.find('ul.nav-links').exists()).toBe(true)
      expect(nav.find('button.nav-toggle').exists()).toBe(true)
    })
  })

  // ============================================
  // #190 a11y: listitem + aria-allowed-role — move dialog role off the <ul>
  // Lighthouse flagged role="dialog" on <ul class="nav-links"> twice:
  //  - aria-allowed-role: dialog is not allowed on <ul>
  //  - listitem: the dialog role overrode the ul's implicit list role so <li>
  //    lost their list parent.
  // Fix: wrap the <ul> in a <div role="dialog" aria-modal="true" aria-label=...>
  // and strip those three attrs from the <ul>. These tests assert the corrected
  // structure; they FAIL on the old <ul role="dialog"> markup.
  // ============================================
  describe('#190 a11y: dialog role moved off nav <ul>', () => {
    it('ul.nav-links has NO role attribute (dialog no longer overrides list semantics)', () => {
      const ul = wrapper.find('ul.nav-links')
      expect(ul.exists()).toBe(true)
      expect(ul.attributes('role')).toBeUndefined()
    })

    it('ul.nav-links has NO aria-modal attribute', () => {
      const ul = wrapper.find('ul.nav-links')
      expect(ul.attributes('aria-modal')).toBeUndefined()
    })

    it('an element with role="dialog" + aria-modal="true" exists and is an ancestor of the <ul>', () => {
      const ul = wrapper.find('ul.nav-links')
      expect(ul.exists()).toBe(true)
      const dialogAncestor = ul.element.closest('[role="dialog"][aria-modal="true"]')
      expect(dialogAncestor, 'a role=dialog aria-modal=true ancestor must wrap the ul').not.toBeNull()
    })

    it('the dialog wrapper exposes a non-empty aria-label (focus-trap naming preserved)', () => {
      const dialog = wrapper.find('[role="dialog"][aria-modal="true"]')
      expect(dialog.exists()).toBe(true)
      expect(dialog.attributes('aria-label')).toBeTruthy()
    })

    it('the <ul> still renders its <li> children (list structure intact)', () => {
      expect(wrapper.findAll('ul.nav-links > li').length).toBeGreaterThanOrEqual(6)
    })
  })
})
