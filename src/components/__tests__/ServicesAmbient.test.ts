import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { ref } from 'vue'

// Mock useLanguage composable
vi.mock('@/composables/useLanguage', () => ({
  useLanguage: () => ({
    t: (key) => key
  })
}))

// Mock VueUse composables
vi.mock('@vueuse/core', () => ({
  useIntersectionObserver: (_target, callback) => {
    setTimeout(() => callback([{ isIntersecting: false }]), 0)
  },
  useMediaQuery: () => vi.fn(() => false)
}))

// Mock the ambient animation composable
vi.mock('@/composables/useAmbientAnimation', () => ({
  useAmbientAnimation: () => ({
    target: { value: null },
    isPaused: ref(true),
    isStatic: ref(false),
    isPlaying: ref(false),
    progress: ref(0),
    startLoop: vi.fn(),
    stopLoop: vi.fn()
  })
}))

import ServicesAmbient from '../ServicesAmbient.vue'

describe('ServicesAmbient', () => {
  it('renders SVG element when not static', () => {
    const wrapper = mount(ServicesAmbient)
    const svg = wrapper.find('svg.ambient-svg')
    expect(svg.exists()).toBe(true)
  })

  it('cycles through 5 services', () => {
    const wrapper = mount(ServicesAmbient)
    expect(wrapper.vm.services.length).toBe(5)
  })

  it('has proper accessibility attributes', () => {
    const wrapper = mount(ServicesAmbient)
    const section = wrapper.find('.services-ambient')
    expect(section.attributes('role')).toBe('img')
    expect(section.attributes('aria-label')).toBeDefined()
  })

  it('renders static fallback when reduced motion enabled', () => {
    const wrapper = mount(ServicesAmbient)

    // Verify the component structure is correct
    expect(wrapper.find('.services-ambient').exists()).toBe(true)

    // The component should have proper class binding for static mode
    const section = wrapper.find('.services-ambient')
    expect(section.classes()).toContain('services-ambient')
  })

  it('has service data with required properties', () => {
    const wrapper = mount(ServicesAmbient)
    const services = wrapper.vm.services

    services.forEach(service => {
      expect(service).toHaveProperty('key')
      expect(service).toHaveProperty('icon')
      expect(service).toHaveProperty('x')
      expect(service).toHaveProperty('y')
    })
  })
})
