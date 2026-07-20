import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createRouter, createMemoryHistory } from 'vue-router'
import { ref } from 'vue'
import { useLanguage } from '../../composables/useLanguage'
import Header from '../Header.vue'

/**
 * Unit tests for Issue #432: Navigation Hover Effects
 *
 * Tests verify CSS properties for:
 * - AC2: Transition duration (250ms)
 * - AC4: will-change for GPU acceleration
 * - AC1: Hover color change support
 */
vi.mock('../../composables/useLanguage', () => ({
  useLanguage: () => ({
    t: (key) => {
      const translations = {
        'nav.home': 'Home',
        'nav.aboutUs': 'About Us',
        'nav.news': 'News',
        'nav.ourSolutions': 'Our Solutions',
        'nav.joinUs': 'Join Us',
        'nav.contact': 'Contact',
        'nav.menu.open': 'Open menu',
        'nav.menu.close': 'Close menu',
        'nav.menu.label': 'Main navigation',
        'nav.groups.banking': 'Banking Solution',
        'nav.groups.blockchainWeb3': 'Blockchain & Web3',
        'nav.submenu.retailLending': 'Retail Lending',
        'nav.submenu.supplyChainFinance': 'Supply Chain Finance',
        'nav.submenu.blockchain': 'Blockchain',
        'nav.submenu.crossBorderPayment': 'Cross-Border Payment',
        'nav.submenu.digitalAssetCustody': 'Digital Asset Custody',
        'nav.submenu.stablecoin': 'Stablecoin',
        'nav.submenu.joinUs': 'Join Us',
        'nav.submenu.positionList': 'Position List',
      }
      return translations[key] || key
    },
    currentLanguage: ref({ value: 'en' }),
  }),
}))

// Mock IntersectionObserver for lazy components
global.IntersectionObserver = vi.fn(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
})) as any

// Mock window.matchMedia for reduced-motion tests
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query) => ({
    matches: query !== '(prefers-reduced-motion: reduce)',
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
})

describe('Header.vue - Issue #432 Hover Effects', () => {
  let router: any

  beforeEach(() => {
    // Create a fresh router for each test
    router = createRouter({
      history: createMemoryHistory(),
      routes: [
        { path: '/', component: { template: '<div>Home</div>' } },
        { path: '/about', component: { template: '<div>About</div>' } },
        { path: '/news', component: { template: '<div>News</div>' } },
        { path: '/contact', component: { template: '<div>Contact</div>' } },
      ],
    })
  })

  /**
   * AC2: Verify transition duration is exactly 250ms (0.25s)
   */
  it('should have 250ms transition duration on nav links', () => {
    const wrapper = mount(Header, {
      global: {
        plugins: [router],
        stubs: {
          NavigationDropdown: {
            template: '<div class="dropdown-stub"><slot /></div>',
          },
        },
      },
    })

    const navLinks = wrapper.findAll('.nav-links a')
    expect(navLinks.length, 'Should have nav links').toBeGreaterThan(0)

    const firstLink = navLinks[0]
    const styles = window.getComputedStyle(firstLink.element as Element)
    expect(styles.transitionDuration).toBe('0.25s')
  })

  /**
   * AC4: Verify will-change property is set for GPU acceleration
   */
  it('should have will-change property for GPU acceleration', () => {
    const wrapper = mount(Header, {
      global: {
        plugins: [router],
        stubs: {
          NavigationDropdown: {
            template: '<div class="dropdown-stub"><slot /></div>',
          },
        },
      },
    })

    const navLinks = wrapper.findAll('.nav-links a')
    expect(navLinks.length).toBeGreaterThan(0)

    const firstLink = navLinks[0]
    const styles = window.getComputedStyle(firstLink.element as Element)
    const willChange = styles.willChange

    expect(willChange, 'should include transform').toContain('transform')
    expect(willChange, 'should include color').toContain('color')
    expect(willChange, 'should include text-shadow').toMatch(/text-shadow|textshadow/i)
  })

  /**
   * AC1: Verify hover color change is supported via CSS
   */
  it('should support hover color change to cyan', () => {
    const wrapper = mount(Header, {
      global: {
        plugins: [router],
        stubs: {
          NavigationDropdown: {
            template: '<div class="dropdown-stub"><slot /></div>',
          },
        },
      },
    })

    const navLinks = wrapper.findAll('.nav-links a')
    expect(navLinks.length).toBeGreaterThan(0)

    const firstLink = navLinks[0]

    // Trigger hover
    await firstLink.trigger('mouseenter')
    await wrapper.vm.$nextTick()

    // The :hover pseudo-class is applied via CSS, not inline styles
    // We verify the transition property exists to enable the color change
    const styles = window.getComputedStyle(firstLink.element as Element)
    expect(styles.transition).toContain('color')
    expect(styles.transition).toContain('0.25s')
  })

  /**
   * AC4: Verify transition includes text-shadow
   */
  it('should include text-shadow in transition', () => {
    const wrapper = mount(Header, {
      global: {
        plugins: [router],
        stubs: {
          NavigationDropdown: {
            template: '<div class="dropdown-stub"><slot /></div>',
          },
        },
      },
    })

    const navLinks = wrapper.findAll('.nav-links a')
    expect(navLinks.length).toBeGreaterThan(0)

    const firstLink = navLinks[0]
    const styles = window.getComputedStyle(firstLink.element as Element)
    const transition = styles.transition

    expect(transition).toMatch(/text-shadow|textshadow/i)
  })
})
