import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import NavigationDropdown from '../../src/components/NavigationDropdown.vue'
import { createRouter, createMemoryHistory } from 'vue-router'

describe('NavigationDropdown.vue', () => {
  let router
  let wrapper

  const mockItems = [
    { key: 'about', label: 'About Us', route: '/about' },
    { key: 'news', label: 'News', route: '/news' }
  ]

  beforeEach(() => {
    router = createRouter({
      history: createMemoryHistory(),
      routes: [
        { path: '/about', component: { template: '<div>About</div>' } },
        { path: '/news', component: { template: '<div>News</div>' } }
      ]
    })
  })

  describe('Rendering', () => {
    it('should mount without errors', () => {
      wrapper = mount(NavigationDropdown, {
        props: { label: 'Test', items: mockItems },
        global: { plugins: [router] }
      })
      expect(wrapper.exists()).toBe(true)
    })

    it('renders trigger button', () => {
      wrapper = mount(NavigationDropdown, {
        props: { label: 'Test', items: mockItems },
        global: { plugins: [router] }
      })
      expect(wrapper.find('.dropdown-trigger').exists()).toBe(true)
    })

    it('displays label correctly', () => {
      wrapper = mount(NavigationDropdown, {
        props: { label: 'Services', items: mockItems },
        global: { plugins: [router] }
      })
      expect(wrapper.text()).toContain('Services')
    })
  })

  describe('Dropdown Menu', () => {
    it('starts closed', () => {
      wrapper = mount(NavigationDropdown, {
        props: { label: 'Test', items: mockItems },
        global: { plugins: [router] }
      })
      expect(wrapper.find('.dropdown-menu').exists()).toBe(false)
    })

    it('opens on click', async () => {
      wrapper = mount(NavigationDropdown, {
        props: { label: 'Test', items: mockItems },
        global: { plugins: [router] }
      })
      await wrapper.find('.dropdown-trigger').trigger('click')
      expect(wrapper.find('.dropdown-menu').exists()).toBe(true)
    })

    it('closes on second click', async () => {
      wrapper = mount(NavigationDropdown, {
        props: { label: 'Test', items: mockItems },
        global: { plugins: [router] }
      })
      await wrapper.find('.dropdown-trigger').trigger('click')
      await wrapper.find('.dropdown-trigger').trigger('click')
      expect(wrapper.find('.dropdown-menu').exists()).toBe(false)
    })

    it('displays menu items', async () => {
      wrapper = mount(NavigationDropdown, {
        props: { label: 'Test', items: mockItems },
        global: { plugins: [router] }
      })
      await wrapper.find('.dropdown-trigger').trigger('click')
      expect(wrapper.findAll('.dropdown-item').length).toBe(2)
    })
  })

  // M2 (#164 review): aria-expanded / aria-haspopup live on the TRIGGER
  // button (WCAG disclosure/menu pattern), not the wrapper .nav-dropdown div.
  // The earlier assertions against .nav-dropdown encoded the pre-revision bug
  // and broke once the attributes moved to their correct element.
  describe('Accessibility', () => {
    it('exposes aria-expanded on the TRIGGER button (not the wrapper)', () => {
      wrapper = mount(NavigationDropdown, {
        props: { label: 'Test', items: mockItems },
        global: { plugins: [router] }
      })
      expect(wrapper.find('.dropdown-trigger').attributes('aria-expanded')).toBe('false')
      // The wrapper div must no longer carry the attribute.
      expect(wrapper.find('.nav-dropdown').attributes('aria-expanded')).toBeUndefined()
    })

    it('updates aria-expanded on the trigger when opened', async () => {
      wrapper = mount(NavigationDropdown, {
        props: { label: 'Test', items: mockItems },
        global: { plugins: [router] }
      })
      await wrapper.find('.dropdown-trigger').trigger('click')
      expect(wrapper.find('.dropdown-trigger').attributes('aria-expanded')).toBe('true')
    })

    it('exposes aria-haspopup="menu" on the TRIGGER button (not the wrapper)', () => {
      wrapper = mount(NavigationDropdown, {
        props: { label: 'Test', items: mockItems },
        global: { plugins: [router] }
      })
      expect(wrapper.find('.dropdown-trigger').attributes('aria-haspopup')).toBe('menu')
      expect(wrapper.find('.nav-dropdown').attributes('aria-haspopup')).toBeUndefined()
    })

    it('exposes aria-controls on the trigger pointing at the menu id', async () => {
      wrapper = mount(NavigationDropdown, {
        props: { label: 'Test', items: mockItems },
        global: { plugins: [router] }
      })
      const controls = wrapper.find('.dropdown-trigger').attributes('aria-controls')
      expect(controls).toBeTruthy()
      await wrapper.find('.dropdown-trigger').trigger('click')
      expect(wrapper.find('.dropdown-menu').attributes('id')).toBe(controls)
    })
  })

  describe('Navigation', () => {
    it('navigates to route on item click', async () => {
      wrapper = mount(NavigationDropdown, {
        props: { label: 'Test', items: mockItems },
        global: { plugins: [router] }
      })
      await wrapper.find('.dropdown-trigger').trigger('click')
      await wrapper.findAll('.dropdown-item')[0].trigger('click')
      await router.isReady()
      // Navigation function is called with correct route
      expect(wrapper.find('.dropdown-menu').exists()).toBe(false)
    })

    it('closes menu after navigation', async () => {
      wrapper = mount(NavigationDropdown, {
        props: { label: 'Test', items: mockItems },
        global: { plugins: [router] }
      })
      await wrapper.find('.dropdown-trigger').trigger('click')
      await wrapper.findAll('.dropdown-item')[0].trigger('click')
      expect(wrapper.find('.dropdown-menu').exists()).toBe(false)
    })
  })
})
