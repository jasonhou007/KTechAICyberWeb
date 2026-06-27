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
// navigateTo() handler resolves without a full router instance.
const pushMock = vi.fn()
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
  describe('Navigation', () => {
    it('calls router.push with the item route and closes on item click', async () => {
      await wrapper.find('.dropdown-trigger').trigger('click')
      const firstItem = wrapper.findAll('.dropdown-item')[0]
      await firstItem.trigger('click')

      expect(pushMock).toHaveBeenCalledTimes(1)
      expect(pushMock).toHaveBeenCalledWith('/about')
      expect(wrapper.vm.isOpen).toBe(false)
    })

    it('navigates to each item route independently', async () => {
      await wrapper.find('.dropdown-trigger').trigger('click')

      // Re-open between clicks because clicking an item closes the menu.
      await wrapper.findAll('.dropdown-item')[1].trigger('click')
      expect(pushMock).toHaveBeenLastCalledWith('/group')

      await wrapper.find('.dropdown-trigger').trigger('click')
      await wrapper.findAll('.dropdown-item')[0].trigger('click')
      expect(pushMock).toHaveBeenLastCalledWith('/about')
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
  // Accessibility
  // ============================================
  describe('Accessibility', () => {
    it('sets aria-haspopup="true" on the root container', () => {
      expect(wrapper.find('.nav-dropdown').attributes('aria-haspopup')).toBe(
        'true',
      )
    })

    it('reflects isOpen through aria-expanded on the root container', async () => {
      const root = wrapper.find('.nav-dropdown')
      expect(root.attributes('aria-expanded')).toBe('false')

      await wrapper.find('.dropdown-trigger').trigger('click')
      expect(wrapper.find('.nav-dropdown').attributes('aria-expanded')).toBe(
        'true',
      )
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

    it('calls router.push with the clicked group item route and closes', async () => {
      const w = createGroupedWrapper()
      await w.find('.dropdown-trigger').trigger('click')
      // Group1 has 2 items (indexes 0,1); group2 has 4 items (indexes 2-5).
      // Cross-border-payment is the 2nd item of group2 -> index 3.
      const items = w.findAll('.dropdown-item')
      await items[3].trigger('click')
      expect(pushMock).toHaveBeenCalledTimes(1)
      expect(pushMock).toHaveBeenCalledWith('/services/cross-border-payment')
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
