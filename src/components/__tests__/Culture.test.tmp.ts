import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { ref } from 'vue'
import Culture from '../Culture.vue'

vi.mock('@vueuse/core', () => ({
  useIntersectionObserver: vi.fn(() => vi.fn()),
}))

const mockIsLoading = ref(false)
const mockHasLoaded = ref(true)
const mockTarget = ref(null)
const mockIsVisible = ref(true)

vi.mock('../composables/useSkeleton', () => ({
  useSkeleton: vi.fn(() => {
    console.log('useSkeleton mock called, returning:', {
      isLoading: mockIsLoading,
      isLoadingValue: mockIsLoading.value
    })
    return {
      isLoading: mockIsLoading,
      hasLoaded: mockHasLoaded,
      target: mockTarget,
      isVisible: mockIsVisible,
    }
  }),
}))

describe('Culture Debug Final', () => {
  it('should render content when isLoading is false', () => {
    console.log('Before mount - mockIsLoading.value:', mockIsLoading.value)

    const wrapper = mount(Culture, {
      global: {
        stubs: {
          SkeletonCard: {
            template: '<div class="skeleton-stub">Skeleton</div>',
            props: ['isLoading', 'index']
          }
        }
      }
    })

    console.log('After mount - mockIsLoading.value:', mockIsLoading.value)
    console.log('HTML:', wrapper.html())

    expect(wrapper.find('.content-wrapper').exists()).toBe(true)
  })
})
