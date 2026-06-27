/**
 * @file NavigationDropdown.test.ts
 * @description Comprehensive unit tests for NavigationDropdown component
 * @ticket #59 - TEST-012: Navigation Dropdown Menus Unit Tests - TDD with Vitest
 *
 * The component renders a button trigger + a v-if dropdown menu of items. It
 * uses useRouter() for navigation, opens on click, opens/closes on
 * mouseenter/mouseleave when innerWidth > 768, closes on outside click and on
 * Escape, rotates the arrow 180° when open, and calls router.push on item
 * click before closing. Its `t()` is internal (no vue-i18n).
 *
 * Test Categories:
 * - Rendering / structure (closed & open)
 * - Props (label, items)
 * - Toggle / click interactions
 * - Mouseenter / mouseleave (desktop vs mobile)
 * - Navigation (router.push on item click)
 * - Click-outside & Escape keydown
 * - Arrow rotation
 * - Accessibility (aria-expanded, aria-haspopup, aria-label)
 * - i18n (internal t)
 * - Edge cases
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mount, VueWrapper } from '@vue/test-utils'

// Router push spy exposed via a mocked useRouter() so the component's
// navigateTo() handler resolves without a full router instance. RouterLink
// is stubbed via global.stubs (below) so the submenu items render as
// focusable <a :href="route"> elements — the M1 fix makes each item a
// <router-link>. Using vi.hoisted keeps the stub + spy accessible inside the
// hoisted vi.mock factory.
const { pushMock, RouterLinkStub } = vi.hoisted(() => {
  const push = vi.fn()
  const stub = {
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
  return { pushMock: push, RouterLinkStub: stub }
})
vi.mock('vue-router', () => ({
  useRouter: () => ({ push: pushMock }),
}))

import NavigationDropdown from '../NavigationDropdown.vue'

const baseItems = [
  { key: 'about', label: 'nav.about', route: '/about' },
  { key: 'group', label: 'nav.group', route: '/group' },
]

function createWrapper(props: Record<string, unknown> = {}) {
  return mount(NavigationDropdown, {
    props: {
      label: 'About Us',
      items: baseItems,
      ...props,
    },
    global: {
      stubs: {
        RouterLink: RouterLinkStub,
      },
    },
  })
}

describe('NavigationDropdown.vue', () => {
  let wrapper: VueWrapper

  beforeEach(() => {
    pushMock.mockClear()
    // Default to a desktop viewport.
    Object.defineProperty(window, 'innerWidth', {
      configurable: true,
      writable: true,
      value: 1024,
    })
    wrapper = createWrapper()
  })

  afterEach(() => {
    wrapper.unmount()
  })

  // ============================================
  // Rendering — closed state
  // ============================================
  describe('Rendering (closed)', () => {
    it('mounts without errors', () => {
      expect(wrapper.exists()).toBe(true)
    })

    it('renders the root .nav-dropdown container', () => {
      expect(wrapper.find('.nav-dropdown').exists()).toBe(true)
    })

    it('renders a button trigger', () => {
      const trigger = wrapper.find('button.dropdown-trigger')
      expect(trigger.exists()).toBe(true)
      expect(trigger.element.tagName.toLowerCase()).toBe('button')
    })

    it('renders the label prop text inside the trigger', () => {
      expect(wrapper.find('.dropdown-trigger').text()).toContain('About Us')
    })

    it('renders the dropdown arrow indicator', () => {
      expect(wrapper.find('.dropdown-arrow').exists()).toBe(true)
      expect(wrapper.find('.dropdown-arrow').text()).toBe('▼')
    })

    it('does not render the dropdown menu when closed', () => {
      expect(wrapper.find('.dropdown-menu').exists()).toBe(false)
    })

    it('does not apply the open class to the arrow when closed', () => {
      expect(wrapper.find('.dropdown-arrow').classes()).not.toContain('open')
    })
  })

  // ============================================
  // Props
  // ============================================
  describe('Props', () => {
    it('requires the label prop', () => {
      // Mounted with label: 'About Us'.
      expect(wrapper.find('.dropdown-trigger').text()).toContain('About Us')
    })

    it('defaults items to an empty array when not provided', () => {
      const noItems = createWrapper({ items: undefined })
      // Open the dropdown; menu renders but has no items.
      noItems.find('.dropdown-trigger').trigger('click')
      expect(noItems.findAll('.dropdown-item')).toHaveLength(0)
      noItems.unmount()
    })

    it('renders one dropdown item per provided item when open', async () => {
      await wrapper.find('.dropdown-trigger').trigger('click')
      const items = wrapper.findAll('.dropdown-item')
      expect(items).toHaveLength(2)
    })

    it('renders the translated label of each item via t(item.label)', async () => {
      await wrapper.find('.dropdown-trigger').trigger('click')
      const items = wrapper.findAll('.dropdown-item')
      // nav.about resolves via the shared locale; nav.group is not a real key
      // and falls through to the key itself.
      expect(items[0].text()).toBe('About')
      expect(items[1].text()).toBe('nav.group')
    })
  })

  // ============================================
  // Toggle / click
  // ============================================
  describe('Toggle Behavior', () => {
    it('opens the menu when the trigger is clicked', async () => {
      await wrapper.find('.dropdown-trigger').trigger('click')
      expect(wrapper.find('.dropdown-menu').exists()).toBe(true)
      expect(wrapper.find('.dropdown-arrow').classes()).toContain('open')
    })

    it('closes the menu when the trigger is clicked again', async () => {
      const trigger = wrapper.find('.dropdown-trigger')
      await trigger.trigger('click')
      expect(wrapper.find('.dropdown-menu').exists()).toBe(true)

      await trigger.trigger('click')
      expect(wrapper.find('.dropdown-menu').exists()).toBe(false)
      expect(wrapper.find('.dropdown-arrow').classes()).not.toContain('open')
    })

    it('reflects open state through isOpen ref after toggle', async () => {
      expect(wrapper.vm.isOpen).toBe(false)
      await wrapper.find('.dropdown-trigger').trigger('click')
      expect(wrapper.vm.isOpen).toBe(true)
    })
  })

  // ============================================
  // Mouseenter / mouseleave (desktop only)
  // ============================================
  describe('Hover Behavior', () => {
    it('opens on mouseenter at desktop widths', async () => {
      await wrapper.find('.nav-dropdown').trigger('mouseenter')
      expect(wrapper.find('.dropdown-menu').exists()).toBe(true)
      expect(wrapper.vm.isOpen).toBe(true)
    })

    it('closes on mouseleave at desktop widths', async () => {
      const root = wrapper.find('.nav-dropdown')
      await root.trigger('mouseenter')
      await root.trigger('mouseleave')
      expect(wrapper.find('.dropdown-menu').exists()).toBe(false)
      expect(wrapper.vm.isOpen).toBe(false)
    })

    it('does not open on mouseenter at mobile widths (<=768)', async () => {
      Object.defineProperty(window, 'innerWidth', {
        configurable: true,
        writable: true,
        value: 480,
      })
      await wrapper.find('.nav-dropdown').trigger('mouseenter')
      expect(wrapper.find('.dropdown-menu').exists()).toBe(false)
    })

    it('does not close on mouseleave at mobile widths (<=768)', async () => {
      // Force-open via click first, then mouseleave at mobile width.
      await wrapper.find('.dropdown-trigger').trigger('click')
      Object.defineProperty(window, 'innerWidth', {
        configurable: true,
        writable: true,
        value: 768,
      })
      await wrapper.find('.nav-dropdown').trigger('mouseleave')
      expect(wrapper.vm.isOpen).toBe(true)
    })
  })

  // ============================================
  // Navigation
  // ============================================
  // After M1, items are <router-link> rendered as <a :href="route">. Clicking
  // a link is a native navigation (not router.push), so we assert the
  // user-visible effect: each item exposes the correct href, and clicking an
  // item closes the menu. The href IS the navigation contract.
  describe('Navigation', () => {
    it('renders each item as an <a> with the correct route href and closes on click', async () => {
      await wrapper.find('.dropdown-trigger').trigger('click')
      const items = wrapper.findAll('.dropdown-item')
      expect(items[0].element.tagName.toLowerCase()).toBe('a')
      expect(items[0].attributes('href')).toBe('/about')
      expect(items[1].attributes('href')).toBe('/group')

      await items[0].trigger('click')
      expect(wrapper.vm.isOpen).toBe(false)
    })

    it('renders a distinct href per item route', async () => {
      await wrapper.find('.dropdown-trigger').trigger('click')
      const items = wrapper.findAll('.dropdown-item')
      expect(items[0].attributes('href')).toBe('/about')
      expect(items[1].attributes('href')).toBe('/group')
    })
  })

  // ============================================
  // Click outside
  // ============================================
  describe('Click Outside', () => {
    it('closes the menu when a click lands outside the trigger', async () => {
      await wrapper.find('.dropdown-trigger').trigger('click')
      expect(wrapper.vm.isOpen).toBe(true)

      // Simulate a click on the document body (outside the trigger ref).
      document.body.dispatchEvent(
        new MouseEvent('click', { bubbles: true }),
      )
      await wrapper.vm.$nextTick()
      expect(wrapper.vm.isOpen).toBe(false)
    })

    it('does not invoke the outside-close path when the click is inside the trigger', async () => {
      // Open the menu, then simulate a document click whose target is the
      // trigger element. The component's handleClickOutside guards with
      // !triggerRef.contains(target), so isOpen must stay true.
      await wrapper.find('.dropdown-trigger').trigger('click')
      expect(wrapper.vm.isOpen).toBe(true)

      const triggerEl = wrapper.find('.dropdown-trigger').element
      const evt = new MouseEvent('click', { bubbles: true })
      Object.defineProperty(evt, 'target', { value: triggerEl })
      document.dispatchEvent(evt)
      await wrapper.vm.$nextTick()
      expect(wrapper.vm.isOpen).toBe(true)
    })

    it('removes the document click listener on unmount', () => {
      const removeSpy = vi.spyOn(document, 'removeEventListener')
      wrapper.unmount()
      expect(removeSpy).toHaveBeenCalledWith('click', expect.any(Function))
      expect(removeSpy).toHaveBeenCalledWith('keydown', expect.any(Function))
      removeSpy.mockRestore()
      // Restore a live wrapper for the shared afterEach.
      wrapper = createWrapper()
    })
  })

  // ============================================
  // Keyboard
  // ============================================
  describe('Keyboard Navigation', () => {
    it('closes the menu on Escape when open', async () => {
      await wrapper.find('.dropdown-trigger').trigger('click')
      expect(wrapper.vm.isOpen).toBe(true)

      document.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'Escape' }),
      )
      await wrapper.vm.$nextTick()
      expect(wrapper.vm.isOpen).toBe(false)
    })

    it('returns focus to the trigger after Escape closes the menu', async () => {
      await wrapper.find('.dropdown-trigger').trigger('click')
      const triggerEl = wrapper.find('.dropdown-trigger').element as HTMLElement
      const focusSpy = vi.spyOn(triggerEl, 'focus')

      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
      await wrapper.vm.$nextTick()

      expect(focusSpy).toHaveBeenCalled()
      focusSpy.mockRestore()
    })

    it('does nothing on Escape when the menu is already closed', async () => {
      // Closed by default; Escape should not error or change state.
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
      await wrapper.vm.$nextTick()
      expect(wrapper.vm.isOpen).toBe(false)
    })
  })

  // ============================================
  // Arrow rotation
  // ============================================
  describe('Arrow Rotation', () => {
    it('adds the open class to the arrow when open', async () => {
      const arrow = wrapper.find('.dropdown-arrow')
      expect(arrow.classes()).not.toContain('open')

      await wrapper.find('.dropdown-trigger').trigger('click')
      expect(wrapper.find('.dropdown-arrow').classes()).toContain('open')
    })

    it('removes the open class from the arrow when closed again', async () => {
      const trigger = wrapper.find('.dropdown-trigger')
      await trigger.trigger('click')
      expect(wrapper.find('.dropdown-arrow').classes()).toContain('open')

      await trigger.trigger('click')
      expect(wrapper.find('.dropdown-arrow').classes()).not.toContain('open')
    })
  })

  // ============================================
  // Accessibility — M2: aria-expanded / aria-haspopup live on the TRIGGER
  // button (not the wrapper div), per WCAG disclosure/menu pattern. The
  // trigger also exposes aria-controls pointing at the menu's id.
  // ============================================
  describe('Accessibility', () => {
    it('sets aria-haspopup="menu" on the TRIGGER button (not the wrapper)', () => {
      expect(
        wrapper.find('.dropdown-trigger').attributes('aria-haspopup'),
      ).toBe('menu')
      // The wrapper div must NOT carry the aria attributes anymore.
      expect(wrapper.find('.nav-dropdown').attributes('aria-haspopup')).toBe(
        undefined,
      )
    })

    it('reflects isOpen through aria-expanded on the TRIGGER button', async () => {
      const trigger = wrapper.find('.dropdown-trigger')
      expect(trigger.attributes('aria-expanded')).toBe('false')
      expect(wrapper.find('.nav-dropdown').attributes('aria-expanded')).toBe(
        undefined,
      )

      await wrapper.find('.dropdown-trigger').trigger('click')
      expect(
        wrapper.find('.dropdown-trigger').attributes('aria-expanded'),
      ).toBe('true')
    })

    it('exposes aria-controls on the trigger pointing at the menu id', async () => {
      const trigger = wrapper.find('.dropdown-trigger')
      const controls = trigger.attributes('aria-controls')
      expect(controls).toBeTruthy()

      await wrapper.find('.dropdown-trigger').trigger('click')
      const menu = wrapper.find('.dropdown-menu')
      expect(menu.attributes('id')).toBe(controls)
    })

    it('uses the close-label aria-label when open', async () => {
      await wrapper.find('.dropdown-trigger').trigger('click')
      expect(wrapper.find('.dropdown-trigger').attributes('aria-label')).toBe(
        'Close menu',
      )
    })

    it('uses the open-label aria-label when closed', () => {
      expect(wrapper.find('.dropdown-trigger').attributes('aria-label')).toBe(
        'Open menu',
      )
    })

    it('uses a real <button> for the trigger (keyboard reachable)', () => {
      expect(
        wrapper.find('.dropdown-trigger').element.tagName.toLowerCase(),
      ).toBe('button')
    })
  })

  // ============================================
  // i18n (shared useLanguage t)
  // ============================================
  describe('Internationalization (shared useLanguage t())', () => {
    it('exposes a translation function on the component instance', () => {
      expect(typeof wrapper.vm.t).toBe('function')
    })

    it('translates nav.dropdown.open to "Open menu"', () => {
      expect(wrapper.vm.t('nav.dropdown.open')).toBe('Open menu')
    })

    it('translates nav.dropdown.close to "Close menu"', () => {
      expect(wrapper.vm.t('nav.dropdown.close')).toBe('Close menu')
    })

    it('falls back to the key for unknown keys', () => {
      expect(wrapper.vm.t('nav.unknown')).toBe('nav.unknown')
    })

    it('returns empty string for an empty key', () => {
      expect(wrapper.vm.t('')).toBe('')
    })
  })

  // ============================================
  // Grouped mode (groups prop) — mega-menu
  // ============================================
  describe('Grouped mode (groups prop)', () => {
    const groupedProps = {
      items: undefined,
      groups: [
        {
          groupLabel: 'nav.groups.banking',
          items: [
            { key: 'retail', label: 'nav.submenu.retailLending', route: '/services/retail-lending' },
            { key: 'supply', label: 'nav.submenu.supplyChainFinance', route: '/services/supply-chain-finance' },
          ],
        },
        {
          groupLabel: 'nav.groups.blockchainWeb3',
          items: [
            { key: 'blockchain', label: 'nav.submenu.blockchain', route: '/services/blockchain' },
            { key: 'crossBorder', label: 'nav.submenu.crossBorderPayment', route: '/services/cross-border-payment' },
            { key: 'custody', label: 'nav.submenu.digitalAssetCustody', route: '/services/digital-asset-custody' },
            { key: 'stablecoin', label: 'nav.submenu.stablecoin', route: '/services/stablecoin' },
          ],
        },
      ],
    }

    function createGroupedWrapper() {
      return mount(NavigationDropdown, {
        props: {
          label: 'Our Solutions',
          ...groupedProps,
        },
        global: {
          stubs: {
            RouterLink: RouterLinkStub,
          },
        },
      })
    }

    it('mounts in grouped mode without errors', () => {
      const w = createGroupedWrapper()
      expect(w.exists()).toBe(true)
      expect(w.find('.dropdown-trigger').text()).toContain('Our Solutions')
      w.unmount()
    })

    it('renders one .dropdown-group per provided group when open', async () => {
      const w = createGroupedWrapper()
      await w.find('.dropdown-trigger').trigger('click')
      const groups = w.findAll('.dropdown-group')
      expect(groups).toHaveLength(2)
      w.unmount()
    })

    it('renders a .dropdown-group-heading per group with translated label', async () => {
      const w = createGroupedWrapper()
      await w.find('.dropdown-trigger').trigger('click')
      const headings = w.findAll('.dropdown-group-heading')
      expect(headings).toHaveLength(2)
      // The heading text is the output of t(group.groupLabel).
      expect(headings[0].text()).toBe(w.vm.t('nav.groups.banking'))
      expect(headings[1].text()).toBe(w.vm.t('nav.groups.blockchainWeb3'))
      w.unmount()
    })

    it('renders a flat list of all items across groups when open', async () => {
      const w = createGroupedWrapper()
      await w.find('.dropdown-trigger').trigger('click')
      // 2 + 4 = 6 items total.
      expect(w.findAll('.dropdown-item')).toHaveLength(6)
      w.unmount()
    })

    it('renders each item label via t(item.label)', async () => {
      const w = createGroupedWrapper()
      await w.find('.dropdown-trigger').trigger('click')
      const items = w.findAll('.dropdown-item')
      expect(items[0].text()).toBe(w.vm.t('nav.submenu.retailLending'))
      expect(items[5].text()).toBe(w.vm.t('nav.submenu.stablecoin'))
      w.unmount()
    })

    it('renders the clicked group item as an <a> with the correct route href and closes', async () => {
      const w = createGroupedWrapper()
      await w.find('.dropdown-trigger').trigger('click')
      // Group1 has 2 items (indexes 0,1); group2 has 4 items (indexes 2-5).
      // Cross-border-payment is the 2nd item of group2 -> index 3.
      const items = w.findAll('.dropdown-item')
      expect(items[3].element.tagName.toLowerCase()).toBe('a')
      expect(items[3].attributes('href')).toBe('/services/cross-border-payment')
      await items[3].trigger('click')
      expect(w.vm.isOpen).toBe(false)
      w.unmount()
    })

    it('toggles open/closed via the trigger like flat mode', async () => {
      const w = createGroupedWrapper()
      const trigger = w.find('.dropdown-trigger')
      await trigger.trigger('click')
      expect(w.find('.dropdown-menu').exists()).toBe(true)
      await trigger.trigger('click')
      expect(w.find('.dropdown-menu').exists()).toBe(false)
      w.unmount()
    })

    it('closes on Escape when open (grouped mode)', async () => {
      const w = createGroupedWrapper()
      await w.find('.dropdown-trigger').trigger('click')
      expect(w.vm.isOpen).toBe(true)

      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
      await w.vm.$nextTick()
      expect(w.vm.isOpen).toBe(false)
      w.unmount()
    })

    it('does not render flat .dropdown-item entries when only groups are provided', async () => {
      // items is undefined, so the flat v-for must not emit any items.
      const w = createGroupedWrapper()
      await w.find('.dropdown-trigger').trigger('click')
      // All 6 .dropdown-item elements live inside .dropdown-group.
      const loose = w.findAll('.dropdown-menu > .dropdown-item')
      expect(loose).toHaveLength(0)
      w.unmount()
    })
  })

  // ============================================
  // Keyboard Operability (AC7 — WCAG 2.1 AA)
  // ============================================
  // This is the regression test that SHOULD have caught M1: dropdown items
  // shipped as <div> (not focusable), so a keyboard user could open the menu
  // but never reach or activate an item. Each assertion below drives the real
  // DOM and would FAIL against the pre-revision component.
  describe('Keyboard Operability (AC7)', () => {
    it('renders submenu items as focusable elements (a/button), not bare divs', async () => {
      await wrapper.find('.dropdown-trigger').trigger('click')
      const items = wrapper.findAll('.dropdown-item')
      const focusableTags = ['a', 'button']
      items.forEach((item) => {
        const tag = item.element.tagName.toLowerCase()
        expect(focusableTags).toContain(tag)
      })
    })

    it('exposes role="menu" on the open menu and role="menuitem" on each item', async () => {
      await wrapper.find('.dropdown-trigger').trigger('click')
      expect(wrapper.find('.dropdown-menu').attributes('role')).toBe('menu')
      wrapper.findAll('.dropdown-item').forEach((item) => {
        expect(item.attributes('role')).toBe('menuitem')
      })
    })

    it('closes the menu when an item is activated via Enter key', async () => {
      await wrapper.find('.dropdown-trigger').trigger('click')
      const firstItem = wrapper.findAll('.dropdown-item')[0]
      // The router-link handles navigation on Enter; the component closes.
      await firstItem.trigger('keydown', { key: 'Enter' })
      expect(wrapper.vm.isOpen).toBe(false)
    })

    it('closes the menu when an item is activated via Space key', async () => {
      await wrapper.find('.dropdown-trigger').trigger('click')
      const firstItem = wrapper.findAll('.dropdown-item')[0]
      await firstItem.trigger('keydown', { key: ' ' })
      expect(wrapper.vm.isOpen).toBe(false)
    })

    it('moves focus to the next item on ArrowDown', async () => {
      await wrapper.find('.dropdown-trigger').trigger('click')
      const items = wrapper.findAll('.dropdown-item')
      const focusSpy0 = vi.spyOn(items[0].element as HTMLElement, 'focus')
      const focusSpy1 = vi.spyOn(items[1].element as HTMLElement, 'focus')

      // ArrowDown on item 0 should focus item 1.
      await items[0].trigger('keydown', { key: 'ArrowDown' })
      expect(focusSpy1).toHaveBeenCalled()
      focusSpy0.mockRestore()
      focusSpy1.mockRestore()
    })

    it('moves focus to the previous item on ArrowUp', async () => {
      await wrapper.find('.dropdown-trigger').trigger('click')
      const items = wrapper.findAll('.dropdown-item')
      const focusSpy0 = vi.spyOn(items[0].element as HTMLElement, 'focus')

      // ArrowUp on item 1 should wrap/focus item 0.
      await items[1].trigger('keydown', { key: 'ArrowUp' })
      expect(focusSpy0).toHaveBeenCalled()
      focusSpy0.mockRestore()
    })

    it('renders each item as a router-link with the correct href (active-route highlight, AC6)', async () => {
      await wrapper.find('.dropdown-trigger').trigger('click')
      const items = wrapper.findAll('.dropdown-item')
      // RouterLink renders <a :href="route">. The stub here is the inline
      // RouterLinkStub-like rendering; with the real vue-router mock we expect
      // <a> with the item route as href.
      items.forEach((item, idx) => {
        expect(item.element.tagName.toLowerCase()).toBe('a')
        expect(item.attributes('href')).toBe(baseItems[idx].route)
      })
    })
  })

  // ============================================
  // Edge cases
  // ============================================
  describe('Edge Cases', () => {
    it('handles an empty items array without error', async () => {
      const empty = createWrapper({ items: [] })
      await empty.find('.dropdown-trigger').trigger('click')
      expect(empty.findAll('.dropdown-item')).toHaveLength(0)
      empty.unmount()
    })

    it('can be mounted and unmounted multiple times', () => {
      const wrappers = [createWrapper(), createWrapper(), createWrapper()]
      wrappers.forEach((w) => {
        expect(w.exists()).toBe(true)
        expect(w.find('.dropdown-trigger').text()).toContain('About Us')
      })
      wrappers.forEach((w) => w.unmount())
    })

    it('handles rapid mount/unmount cycles without error', () => {
      for (let i = 0; i < 10; i++) {
        const w = createWrapper()
        expect(w.exists()).toBe(true)
        w.unmount()
      }
    })

    it('cleans up all document listeners across repeated mounts', () => {
      const removeSpy = vi.spyOn(document, 'removeEventListener')
      for (let i = 0; i < 3; i++) {
        const w = createWrapper()
        w.unmount()
      }
      // Each mount adds + removes one click + one keydown listener.
      expect(removeSpy.mock.calls.filter((c) => c[0] === 'click').length).toBe(
        3,
      )
      expect(
        removeSpy.mock.calls.filter((c) => c[0] === 'keydown').length,
      ).toBe(3)
      removeSpy.mockRestore()
    })
  })
})
