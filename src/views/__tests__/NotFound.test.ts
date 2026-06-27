/**
 * @file NotFound.test.ts
 * @description Unit tests for the NotFound (404) view
 * @ticket #140 - Fix production blank page (router base prefix + NotFound)
 *
 * Drives the real component via the DOM. useLanguage returns the key as
 * fallback in the test env, so we assert on keys / structure, not copy.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mount, VueWrapper } from '@vue/test-utils'
import { RouterLinkStub } from '@vue/test-utils'

// vi.mock paths resolve relative to the TEST file. NotFound.vue imports
// useLanguage from '../i18n' (the barrel at src/i18n/index.js), so from this
// test file that module is '../../i18n'. Mocking the barrel keeps the mock in
// sync with the component's actual import.
vi.mock('../../i18n', () => {
  const translations: Record<string, string> = {
    'notFound.code': '404',
    'notFound.title': 'Page Not Found',
    'notFound.message': 'The page you are looking for does not exist.',
    'notFound.home': 'Back to Home'
  }
  return {
    useLanguage: () => ({
      t: (key: string) => translations[key] || key,
      currentLanguage: { value: 'en' },
      languageDisplay: { value: 'EN' },
      isEnglish: { value: true },
      initLanguage: vi.fn(),
      setLanguage: vi.fn(),
      toggleLanguage: vi.fn()
    }),
    initLanguage: vi.fn()
  }
})

import NotFound from '../NotFound.vue'

describe('NotFound.vue', () => {
  let wrapper: VueWrapper

  beforeEach(() => {
    wrapper = mount(NotFound, {
      global: {
        stubs: { RouterLink: RouterLinkStub }
      }
    })
  })

  afterEach(() => {
    wrapper.unmount()
  })

  describe('Rendering', () => {
    it('mounts without errors', () => {
      expect(wrapper.exists()).toBe(true)
    })

    it('renders the .not-found root container', () => {
      expect(wrapper.find('.not-found').exists()).toBe(true)
    })

    it('renders a 404 status code', () => {
      expect(wrapper.text()).toContain('404')
    })

    it('renders a heading', () => {
      expect(wrapper.find('.not-found h1').exists()).toBe(true)
    })
  })

  describe('Navigation', () => {
    it('renders a link back to home', () => {
      const link = wrapper.findComponent(RouterLinkStub)
      expect(link.exists()).toBe(true)
      expect(link.props('to')).toBe('/')
    })
  })

  describe('Accessibility', () => {
    it('uses a landmark-friendly root element', () => {
      // role="main" on the root lets the 404 land in the page's main region
      expect(wrapper.find('.not-found').attributes('role')).toBe('main')
    })
  })
})
