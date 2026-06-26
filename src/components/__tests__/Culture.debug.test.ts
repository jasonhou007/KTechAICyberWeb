/**
 * Debug test for Culture component
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { ref } from 'vue'
import Culture from '../Culture.vue'

// Mock @vueuse/core BEFORE importing component
vi.mock('@vueuse/core', () => ({
  useIntersectionObserver: vi.fn(() => vi.fn()),
}))

// We'll create new refs for each test to ensure proper isolation
let mockIsLoading, mockHasLoaded, mockTarget, mockIsVisible

// Mock function that creates refs based on current test state
const createMockState = (isLoading) => {
  mockIsLoading = ref(isLoading)
  mockHasLoaded = ref(!isLoading)
  mockTarget = ref(null)
  mockIsVisible = ref(!isLoading)
}

vi.mock('../composables/useSkeleton', () => ({
  useSkeleton: vi.fn(() => ({
    isLoading: mockIsLoading,
    hasLoaded: mockHasLoaded,
    target: mockTarget,
    isVisible: mockIsVisible,
  })),
}))

describe('Culture Debug', () => {
  it('debug: test with loading state (true)', () => {
    // Keep the default loading state (true)
    mockIsLoading.value = true
    mockHasLoaded.value = false
    mockIsVisible.value = false

    const wrapper = mount(Culture, {
      global: {
        stubs: {
          SkeletonCard: {
            template: '<div class="skeleton-stub">Skeleton</div>',
            props: ['isLoading', 'index']
          },
        }
      }
    })

    console.log('=== HTML OUTPUT (isLoading = true) ===')
    console.log(wrapper.html())
    console.log('Has .skeleton-grid:', wrapper.find('.skeleton-grid').exists())
    console.log('Has skeleton cards:', wrapper.findAll('.skeleton-stub').length)
    console.log('mockIsLoading.value:', mockIsLoading.value)

    expect(wrapper.find('.skeleton-grid').exists()).toBe(true)
  })

  it('debug: test with non-loading state (false)', () => {
    // Change to non-loading state
    mockIsLoading.value = false
    mockHasLoaded.value = true
    mockIsVisible.value = true

    const wrapper = mount(Culture, {
      global: {
        stubs: {
          SkeletonCard: {
            template: '<div class="skeleton-stub">Skeleton</div>',
            props: ['isLoading', 'index']
          },
        }
      }
    })

    console.log('=== HTML OUTPUT (isLoading = false) ===')
    console.log(wrapper.html())
    console.log('Has .content-wrapper:', wrapper.find('.content-wrapper').exists())
    console.log('Has .skeleton-grid:', wrapper.find('.skeleton-grid').exists())
    console.log('mockIsLoading.value:', mockIsLoading.value)

    // This should show content, not skeleton
    expect(wrapper.exists()).toBe(true)
  })
})
