/**
 * @file NewsFilter.test.ts
 * @description Comprehensive unit tests for NewsFilter component
 * @ticket #60 - TEST-013: News Section Component Unit Tests - TDD with Vitest
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mount, VueWrapper } from '@vue/test-utils'
import NewsFilter from '../NewsFilter.vue'

// Mock ../../i18n path (src/i18n.js) as used in the component
vi.mock('../../i18n', () => ({
  useLanguage: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        'news.filter': 'Filter by category',
        'news.categories.all': 'All',
        'news.categories.company': 'Company News',
        'news.categories.industry': 'Industry Insights',
        'news.categories.technology': 'Technology Updates',
        'news.categories.events': 'Events',
      }
      return translations[key] || key
    },
  }),
}))

describe('NewsFilter.vue', () => {
  let wrapper: VueWrapper

  afterEach(() => {
    if (wrapper) wrapper.unmount()
  })

  describe('Rendering', () => {
    it('should mount without errors', () => {
      wrapper = mount(NewsFilter, {
        props: { selectedCategory: 'All' },
      })
      expect(wrapper.exists()).toBe(true)
    })

    it('renders div tag with correct class', () => {
      wrapper = mount(NewsFilter, {
        props: { selectedCategory: 'All' },
      })
      const filterDiv = wrapper.find('div.news-filter')
      expect(filterDiv.exists()).toBe(true)
    })

    it('has correct aria-label', () => {
      wrapper = mount(NewsFilter, {
        props: { selectedCategory: 'All' },
      })
      const filterDiv = wrapper.find('div.news-filter')
      expect(filterDiv.attributes('aria-label')).toBe('Filter by category')
    })

    it('has sr-only heading', () => {
      wrapper = mount(NewsFilter, {
        props: { selectedCategory: 'All' },
      })
      const heading = wrapper.find('#filter-heading')
      expect(heading.exists()).toBe(true)
      expect(heading.classes()).toContain('sr-only')
    })
  })

  describe('Props', () => {
    it('accepts selectedCategory prop', () => {
      wrapper = mount(NewsFilter, {
        props: { selectedCategory: 'Company News' },
      })
      expect(wrapper.props('selectedCategory')).toBe('Company News')
    })

    it('has default selectedCategory value of All', () => {
      wrapper = mount(NewsFilter, {
        props: {},
      })
      expect(wrapper.props('selectedCategory')).toBe('All')
    })
  })

  describe('Filter Buttons', () => {
    beforeEach(() => {
      wrapper = mount(NewsFilter, {
        props: { selectedCategory: 'All' },
      })
    })

    it('renders correct number of filter buttons', () => {
      const buttons = wrapper.findAll('.news-filter__button')
      expect(buttons.length).toBe(5)
    })

    it('displays all category names', () => {
      const buttons = wrapper.findAll('.news-filter__button')
      expect(buttons[0].text()).toBe('All')
      expect(buttons[1].text()).toBe('Company News')
      expect(buttons[2].text()).toBe('Industry Insights')
      expect(buttons[3].text()).toBe('Technology Updates')
      expect(buttons[4].text()).toBe('Events')
    })

    it('marks selected category with active class', () => {
      wrapper = mount(NewsFilter, {
        props: { selectedCategory: 'Company News' },
      })
      const buttons = wrapper.findAll('.news-filter__button')
      expect(buttons[1].classes()).toContain('news-filter__button--active')
    })

    it('does not mark unselected categories as active', () => {
      wrapper = mount(NewsFilter, {
        props: { selectedCategory: 'All' },
      })
      const buttons = wrapper.findAll('.news-filter__button')
      expect(buttons[1].classes()).not.toContain('news-filter__button--active')
      expect(buttons[2].classes()).not.toContain('news-filter__button--active')
    })
  })

  describe('Event Emissions', () => {
    it('emits filter-change event when button is clicked', async () => {
      wrapper = mount(NewsFilter, {
        props: { selectedCategory: 'All' },
      })
      const buttons = wrapper.findAll('.news-filter__button')
      await buttons[1].trigger('click')
      expect(wrapper.emitted('filter-change')).toBeTruthy()
      expect(wrapper.emitted('filter-change')?.[0]).toEqual(['Company News'])
    })

    it('emits correct category for each button', async () => {
      wrapper = mount(NewsFilter, {
        props: { selectedCategory: 'All' },
      })
      const buttons = wrapper.findAll('.news-filter__button')

      await buttons[0].trigger('click')
      expect(wrapper.emitted('filter-change')?.[0]).toEqual(['All'])

      await buttons[2].trigger('click')
      expect(wrapper.emitted('filter-change')?.[1]).toEqual(['Industry Insights'])

      await buttons[4].trigger('click')
      expect(wrapper.emitted('filter-change')?.[2]).toEqual(['Events'])
    })

    it('emits event with category payload', async () => {
      wrapper = mount(NewsFilter, {
        props: { selectedCategory: 'All' },
      })
      const buttons = wrapper.findAll('.news-filter__button')
      await buttons[3].trigger('click')
      expect(wrapper.emitted('filter-change')?.[0][0]).toBe('Technology Updates')
    })
  })

  describe('Internationalization', () => {
    it('translates filter aria-label', () => {
      wrapper = mount(NewsFilter, {
        props: { selectedCategory: 'All' },
      })
      const filterDiv = wrapper.find('div.news-filter')
      expect(filterDiv.attributes('aria-label')).toBe('Filter by category')
    })

    it('translates all category correctly', () => {
      wrapper = mount(NewsFilter, {
        props: { selectedCategory: 'All' },
      })
      const buttons = wrapper.findAll('.news-filter__button')
      expect(buttons[0].text()).toBe('All')
    })

    it('translates company category', () => {
      wrapper = mount(NewsFilter, {
        props: { selectedCategory: 'Company News' },
      })
      const buttons = wrapper.findAll('.news-filter__button')
      expect(buttons[1].text()).toBe('Company News')
    })

    it('translates industry category', () => {
      wrapper = mount(NewsFilter, {
        props: { selectedCategory: 'Industry Insights' },
      })
      const buttons = wrapper.findAll('.news-filter__button')
      expect(buttons[2].text()).toBe('Industry Insights')
    })

    it('translates technology category', () => {
      wrapper = mount(NewsFilter, {
        props: { selectedCategory: 'Technology Updates' },
      })
      const buttons = wrapper.findAll('.news-filter__button')
      expect(buttons[3].text()).toBe('Technology Updates')
    })

    it('translates events category', () => {
      wrapper = mount(NewsFilter, {
        props: { selectedCategory: 'Events' },
      })
      const buttons = wrapper.findAll('.news-filter__button')
      expect(buttons[4].text()).toBe('Events')
    })
  })

  describe('Cyberpunk Styling', () => {
    beforeEach(() => {
      wrapper = mount(NewsFilter, {
        props: { selectedCategory: 'All' },
      })
    })

    it('has correct CSS class on div element', () => {
      const filterDiv = wrapper.find('div.news-filter')
      expect(filterDiv.classes()).toContain('news-filter')
    })

    it('buttons have correct styling class', () => {
      const buttons = wrapper.findAll('.news-filter__button')
      buttons.forEach(button => {
        expect(button.classes()).toContain('news-filter__button')
      })
    })

    it('active button has active class', () => {
      wrapper = mount(NewsFilter, {
        props: { selectedCategory: 'Industry Insights' },
      })
      const buttons = wrapper.findAll('.news-filter__button')
      expect(buttons[2].classes()).toContain('news-filter__button--active')
    })
  })

  describe('Accessibility', () => {
    beforeEach(() => {
      wrapper = mount(NewsFilter, {
        props: { selectedCategory: 'All' },
      })
    })

    it('uses semantic div with role region', () => {
      const filterDiv = wrapper.find('div.news-filter')
      expect(filterDiv.exists()).toBe(true)
      expect(filterDiv.attributes('role')).toBe('region')
    })

    it('has proper aria-label', () => {
      const filterDiv = wrapper.find('div.news-filter')
      expect(filterDiv.attributes('aria-label')).toBe('Filter by category')
    })

    it('buttons are proper button elements', () => {
      const buttons = wrapper.findAll('.news-filter__button')
      buttons.forEach(button => {
        expect(button.element.tagName.toLowerCase()).toBe('button')
      })
    })

    it('active button has aria-pressed="true"', () => {
      wrapper = mount(NewsFilter, {
        props: { selectedCategory: 'Company News' },
      })
      const buttons = wrapper.findAll('.news-filter__button')
      expect(buttons[1].attributes('aria-pressed')).toBe('true')
    })

    it('inactive button has aria-pressed="false"', () => {
      wrapper = mount(NewsFilter, {
        props: { selectedCategory: 'All' },
      })
      const buttons = wrapper.findAll('.news-filter__button')
      expect(buttons[1].attributes('aria-pressed')).toBe('false')
    })

    it('all buttons have aria-pressed attribute', () => {
      const buttons = wrapper.findAll('.news-filter__button')
      buttons.forEach(button => {
        expect(button.attributes('aria-pressed')).toBeDefined()
      })
    })

    it('buttons have accessible labels', () => {
      const buttons = wrapper.findAll('.news-filter__button')
      expect(buttons[0].attributes('aria-label')).toBe('Filter by All')
      expect(buttons[1].attributes('aria-label')).toBe('Filter by Company News')
    })

    it('buttons container has role group', () => {
      const buttonsDiv = wrapper.find('.news-filter__buttons')
      expect(buttonsDiv.attributes('role')).toBe('group')
    })

    it('buttons container has aria-labelledby', () => {
      const buttonsDiv = wrapper.find('.news-filter__buttons')
      expect(buttonsDiv.attributes('aria-labelledby')).toBe('filter-heading')
    })
  })

  describe('Interactive States', () => {
    it('updates active class when selectedCategory changes', async () => {
      wrapper = mount(NewsFilter, {
        props: { selectedCategory: 'All' },
      })
      let buttons = wrapper.findAll('.news-filter__button')
      expect(buttons[0].classes()).toContain('news-filter__button--active')

      await wrapper.setProps({ selectedCategory: 'Technology Updates' })
      buttons = wrapper.findAll('.news-filter__button')
      expect(buttons[0].classes()).not.toContain('news-filter__button--active')
      expect(buttons[3].classes()).toContain('news-filter__button--active')
    })

    it('updates aria-pressed when selectedCategory changes', async () => {
      wrapper = mount(NewsFilter, {
        props: { selectedCategory: 'All' },
      })
      let buttons = wrapper.findAll('.news-filter__button')
      expect(buttons[0].attributes('aria-pressed')).toBe('true')

      await wrapper.setProps({ selectedCategory: 'Events' })
      buttons = wrapper.findAll('.news-filter__button')
      expect(buttons[0].attributes('aria-pressed')).toBe('false')
      expect(buttons[4].attributes('aria-pressed')).toBe('true')
    })
  })

  describe('Edge Cases', () => {
    it('handles null selectedCategory gracefully', () => {
      wrapper = mount(NewsFilter, {
        props: { selectedCategory: null as any },
      })
      expect(wrapper.props('selectedCategory')).toBe(null)
    })

    it('can be mounted and unmounted multiple times', () => {
      const wrappers = [
        mount(NewsFilter, {
          props: { selectedCategory: 'All' },
        }),
        mount(NewsFilter, {
          props: { selectedCategory: 'All' },
        }),
      ]
      wrappers.forEach(w => expect(w.exists()).toBe(true))
      wrappers.forEach(w => w.unmount())
    })
  })

  describe('Component Structure', () => {
    beforeEach(() => {
      wrapper = mount(NewsFilter, {
        props: { selectedCategory: 'All' },
      })
    })

    it('has correct DOM hierarchy', () => {
      const filterDiv = wrapper.find('div.news-filter')
      const heading = filterDiv.find('#filter-heading')
      const buttonsDiv = filterDiv.find('.news-filter__buttons')
      const buttons = buttonsDiv.findAll('.news-filter__button')
      expect(filterDiv.exists()).toBe(true)
      expect(heading.exists()).toBe(true)
      expect(buttonsDiv.exists()).toBe(true)
      expect(buttons.length).toBe(5)
    })

    it('all major sections are present', () => {
      const filterDiv = wrapper.find('div.news-filter')
      const buttonsDiv = wrapper.find('.news-filter__buttons')
      expect(filterDiv.exists()).toBe(true)
      expect(buttonsDiv.exists()).toBe(true)
    })

    it('maintains consistent component structure', () => {
      const filterDiv = wrapper.find('div.news-filter')
      const buttons = wrapper.findAll('.news-filter__button')
      expect(filterDiv.classes()).toContain('news-filter')
      buttons.forEach(button => {
        expect(button.classes()).toContain('news-filter__button')
      })
    })
  })

  describe('Responsive Behavior', () => {
    beforeEach(() => {
      wrapper = mount(NewsFilter, {
        props: { selectedCategory: 'All' },
      })
    })

    it('div adapts to different screen sizes', () => {
      const filterDiv = wrapper.find('div.news-filter')
      expect(filterDiv.exists()).toBe(true)
    })

    it('buttons maintain proper spacing', () => {
      const buttons = wrapper.findAll('.news-filter__button')
      expect(buttons.length).toBe(5)
    })
  })

  describe('Reactive Updates', () => {
    it('re-renders when selectedCategory prop changes', async () => {
      wrapper = mount(NewsFilter, {
        props: { selectedCategory: 'All' },
      })
      let buttons = wrapper.findAll('.news-filter__button')
      expect(buttons[0].classes()).toContain('news-filter__button--active')

      await wrapper.setProps({ selectedCategory: 'Technology Updates' })
      buttons = wrapper.findAll('.news-filter__button')
      expect(buttons[3].classes()).toContain('news-filter__button--active')
    })
  })
})
