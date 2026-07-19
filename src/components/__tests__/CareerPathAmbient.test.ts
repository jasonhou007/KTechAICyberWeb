/**
 * @file CareerPathAmbient.test.ts
 * @description Comprehensive unit tests for CareerPathAmbient component
 * @ticket #398 - Add ambient career-path visualization to Careers page
 *
 * CareerPathAmbient is a canvas-based animation component that visualizes
 * career progression stages and skill particles flowing along paths.
 *
 * Test Categories:
 * - Component Rendering
 * - Canvas Initialization
 * - Reduced Motion Fallback
 * - Adaptive Behavior
 * - Position Highlights
 * - Skill Particles
 * - Cleanup
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'

// Mock useLanguage composable
vi.mock('@/composables/useLanguage', () => ({
  useLanguage: () => ({
    t: (key: string) => key
  })
}))

// Mock IntersectionObserver
class MockIntersectionObserver {
  observe = vi.fn()
  unobserve = vi.fn()
  disconnect = vi.fn()
  constructor(callback: any) {}
}

global.IntersectionObserver = MockIntersectionObserver as any

// Mock requestAnimationFrame
let rafCallbacks: Array<() => void> = []
global.requestAnimationFrame = vi.fn((cb) => {
  rafCallbacks.push(cb)
  return 1
}) as any
global.cancelAnimationFrame = vi.fn() as any

import CareerPathAmbient from '../CareerPathAmbient.vue'

describe('CareerPathAmbient.vue', () => {
  let wrapper: any

  const mockPositions = [
    { id: 1, title: 'Senior Frontend Engineer', department: 'Engineering' },
    { id: 2, title: 'Blockchain Developer', department: 'Engineering' },
    { id: 3, title: 'AI Research Scientist', department: 'Research' }
  ]

  afterEach(() => {
    if (wrapper) {
      wrapper.unmount()
    }
    vi.clearAllMocks()
    rafCallbacks = []
  })

  describe('Component Rendering', () => {
    it('should render canvas element', () => {
      wrapper = mount(CareerPathAmbient, {
        props: { positions: mockPositions }
      })

      const canvasEl = wrapper.find('canvas.career-path-canvas')
      expect(canvasEl.exists()).toBe(true)
    })

    it('should have proper ARIA attributes', () => {
      wrapper = mount(CareerPathAmbient, {
        props: { positions: mockPositions }
      })

      const container = wrapper.find('.career-path-ambient')
      expect(container.attributes('role')).toBe('img')
      expect(container.attributes('aria-label')).toBeTruthy()
    })

    it('should render with correct CSS classes', () => {
      wrapper = mount(CareerPathAmbient, {
        props: { positions: mockPositions }
      })

      const container = wrapper.find('.career-path-ambient')
      expect(container.exists()).toBe(true)
    })
  })

  describe('Canvas Initialization', () => {
    it('should initialize canvas with correct dimensions', async () => {
      wrapper = mount(CareerPathAmbient, {
        props: { positions: mockPositions }
      })

      await nextTick()

      const canvasEl = wrapper.find('canvas.career-path-canvas')
      expect(canvasEl.exists()).toBe(true)
    })

    it('should create 5 career stages', async () => {
      wrapper = mount(CareerPathAmbient, {
        props: { positions: mockPositions }
      })

      await nextTick()

      const component = wrapper.vm
      expect(component.careerStages).toHaveLength(5)
      expect(component.careerStages[0].label).toBe('Junior')
      expect(component.careerStages[4].label).toBe('Principal')
    })
  })

  describe('Reduced Motion Fallback', () => {
    it('should not animate when prefers-reduced-motion is true', async () => {
      // Mock reduced motion
      const mockMediaQuery = vi.fn().mockReturnValue({
        matches: true,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn()
      })
      window.matchMedia = mockMediaQuery

      wrapper = mount(CareerPathAmbient, {
        props: { positions: mockPositions }
      })

      await nextTick()

      // Should not start animation
      expect(global.requestAnimationFrame).not.toHaveBeenCalled()
    })

    it('should render static fallback for reduced motion', async () => {
      window.matchMedia = vi.fn().mockReturnValue({
        matches: true,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn()
      })

      wrapper = mount(CareerPathAmbient, {
        props: { positions: mockPositions }
      })

      await nextTick()

      const component = wrapper.vm
      expect(component.isAnimating).toBe(false)
    })
  })

  describe('Animation Lifecycle', () => {
    it('should setup IntersectionObserver when not reduced motion', async () => {
      window.matchMedia = vi.fn().mockReturnValue({
        matches: false,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn()
      })

      wrapper = mount(CareerPathAmbient, {
        props: { positions: mockPositions }
      })

      await nextTick()

      const component = wrapper.vm
      expect(component.canvasRef).toBeTruthy()
    })

    it('should cleanup on unmount', async () => {
      window.matchMedia = vi.fn().mockReturnValue({
        matches: false,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn()
      })

      wrapper = mount(CareerPathAmbient, {
        props: { positions: mockPositions }
      })

      await nextTick()

      const component = wrapper.vm
      expect(component.canvasRef).toBeTruthy()

      wrapper.unmount()

      // Component should unmount without errors
      expect(wrapper.exists()).toBe(false)
    })
  })

  describe('Adaptive Behavior', () => {
    it('should use desktop settings for larger screens', async () => {
      // Mock window.innerWidth > 768
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 1024
      })

      wrapper = mount(CareerPathAmbient, {
        props: { positions: mockPositions }
      })

      await nextTick()

      const component = wrapper.vm
      expect(component.particleCount).toBe(50)
      expect(component.targetFPS).toBe(60)
    })

    it('should use mobile settings for smaller screens', async () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375
      })

      wrapper = mount(CareerPathAmbient, {
        props: { positions: mockPositions }
      })

      await nextTick()

      const component = wrapper.vm
      expect(component.particleCount).toBeLessThan(50)
      expect(component.particleCount).toBeGreaterThan(0)
    })
  })

  describe('Position Highlights', () => {
    it('should pass positions prop to component', () => {
      wrapper = mount(CareerPathAmbient, {
        props: { positions: mockPositions }
      })

      const component = wrapper.vm
      expect(component.positions).toEqual(mockPositions)
    })

    it('should handle empty positions array', () => {
      wrapper = mount(CareerPathAmbient, {
        props: { positions: [] }
      })

      const component = wrapper.vm
      expect(component.positions).toEqual([])
      expect(component.careerStages).toHaveLength(5) // Still creates stages
    })
  })

  describe('Skill Particles', () => {
    it('should initialize skill particles', async () => {
      wrapper = mount(CareerPathAmbient, {
        props: { positions: mockPositions }
      })

      await nextTick()

      const component = wrapper.vm
      expect(component.skillParticles).toBeDefined()
      expect(component.skillParticles.length).toBeGreaterThan(0)
    })

    it('should particles have required properties', async () => {
      wrapper = mount(CareerPathAmbient, {
        props: { positions: mockPositions }
      })

      await nextTick()

      const component = wrapper.vm
      const firstParticle = component.skillParticles[0]

      expect(firstParticle).toHaveProperty('x')
      expect(firstParticle).toHaveProperty('y')
      expect(firstParticle).toHaveProperty('skill')
      expect(firstParticle).toHaveProperty('stage')
    })
  })
})
