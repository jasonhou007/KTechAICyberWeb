/**
 * @file PositionList.test.ts
 * @description Comprehensive unit tests for the Position List view component
 * @ticket #57 - TEST-010: Position List Component Unit Tests - TDD with Vitest
 *
 * Test Categories:
 * - Rendering Tests: Component mount, breadcrumb, header, sidebar, grid, empty state
 * - Search Functionality Tests: search input and filtering by title/keyword
 * - Filter Functionality Tests: department/location/type filters and combinations
 * - Position Card Tests: card structure and content
 * - Modal Tests: position detail open/close
 * - Accessibility Tests: headings, ARIA, labels, roles
 * - i18n Tests: translation function behavior and key usage
 * - Styling Tests: cyberpunk theme classes
 * - Edge Cases: empty data, no-match filters, clear filters
 *
 * The view dynamically imports ../data/positions.json on mount. The view loads
 * the real data file (8 positions: all fulltime; departments engineering/
 * product/design; locations shanghai/beijing/bangkok/remote). useLanguage is
 * mocked so translations are predictable strings.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mount, VueWrapper, flushPromises } from '@vue/test-utils'
import { createRouter, createMemoryHistory } from 'vue-router'

// Mock translations — only the keys the view actually references need values.
const mockTranslations: Record<string, string> = {
  'nav.home': 'Home',
  'positions.title': 'Job Openings',
  'positions.subtitle': 'Join Our Team',
  'positions.searchPlaceholder': 'Search jobs',
  'positions.filters.title': 'Filters',
  'positions.filters.department': 'Department',
  'positions.filters.location': 'Location',
  'positions.filters.type': 'Employment Type',
  'positions.filters.activeFilters': 'active',
  'positions.filters.clearAll': 'Clear All',
  'positions.departments.all': 'All Departments',
  'positions.departments.engineering': 'Engineering',
  'positions.departments.product': 'Product',
  'positions.departments.design': 'Design',
  'positions.departments.marketing': 'Marketing',
  'positions.departments.sales': 'Sales',
  'positions.locations.all': 'All Locations',
  'positions.locations.bangkok': 'Bangkok',
  'positions.locations.shanghai': 'Shanghai',
  'positions.locations.beijing': 'Beijing',
  'positions.locations.remote': 'Remote',
  'positions.types.all': 'All Types',
  'positions.types.fulltime': 'Full-time',
  'positions.types.parttime': 'Part-time',
  'positions.types.contract': 'Contract',
  'positions.types.internship': 'Internship',
  'positions.cards.posted': 'Posted',
  'positions.cards.viewDetails': 'View Details',
  'positions.detail.backToList': 'Back to list',
  'positions.detail.description': 'Description',
  'positions.detail.responsibilities': 'Responsibilities',
  'positions.detail.requirements': 'Requirements',
  'positions.detail.benefits': 'Benefits',
  'positions.detail.culture': 'Culture',
  'positions.detail.applyNow': 'Apply Now',
  'positions.detail.share': 'Share',
  'positions.empty.noPositions': 'No positions available',
  'positions.empty.title': 'No matches found',
  'positions.empty.message': 'Try adjusting your filters',
}

vi.mock('../../composables/useLanguage', () => {
  return {
    useLanguage: () => ({
      currentLanguage: { value: 'en' },
      languageDisplay: { value: 'EN' },
      isEnglish: { value: true },
      initLanguage: vi.fn(),
      setLanguage: vi.fn(),
      toggleLanguage: vi.fn(),
      t: (key: string) => mockTranslations[key] || key,
    }),
  }
})

import PositionList from '../PositionList.vue'

// The real data file ships 8 positions. We assert against this known dataset
// (see src/data/positions.json) rather than a mock, because the view loads it
// via a dynamic import() that is not intercepted by vi.mock in this setup.
const TOTAL_POSITIONS = 8

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

const mountComponent = async () => {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/', component: { template: '<div>Home</div>' } },
      { path: '/join-us', component: { template: '<div>Join</div>' } },
      { path: '/join-us/positions', component: PositionList },
    ],
  })

  const wrapper = mount(PositionList, {
    global: {
      plugins: [router],
      stubs: {
        // Stub router-link so it renders its slot text without needing a real
        // route resolve; the genuine integration is asserted separately.
        RouterLink: {
          template: '<a :href="to"><slot /></a>',
          props: ['to'],
        },
      },
    },
  })

  // Allow the onMounted dynamic import() of positions.json to resolve.
  // The view's onMounted does `await import('../data/positions.json')`; a real
  // setTimeout macrotask is required for the import promise chain to settle
  // deterministically — flushPromises() alone races the dynamic import.
  await flushPromises()
  await sleep(50)
  await flushPromises()
  await wrapper.vm.$nextTick()
  return { wrapper, router }
}

describe('PositionList.vue', () => {
  let wrapper: VueWrapper
  let router: any

  beforeEach(async () => {
    const result = await mountComponent()
    wrapper = result.wrapper
    router = result.router
  })

  afterEach(() => {
    if (wrapper) {
      wrapper.unmount()
    }
    // Reset body overflow that the modal may have set.
    document.body.style.overflow = ''
  })

  // ============================================
  // Rendering Tests
  // ============================================
  describe('Rendering', () => {
    it('renders the root .position-list container', () => {
      expect(wrapper.find('.position-list').exists()).toBe(true)
    })

    it('renders the breadcrumb navigation', () => {
      const breadcrumb = wrapper.find('.position-list__breadcrumb')
      expect(breadcrumb.exists()).toBe(true)
      expect(breadcrumb.attributes('aria-label')).toBe('Breadcrumb')
    })

    it('renders the page header with title and subtitle', () => {
      const header = wrapper.find('.position-list__header')
      expect(header.exists()).toBe(true)
      expect(header.find('h1').text()).toBe('Job Openings')
      expect(header.find('.position-list__title-accent').text()).toBe(
        'Join Our Team',
      )
    })

    it('renders the filters sidebar', () => {
      expect(wrapper.find('.position-list__filters').exists()).toBe(true)
      expect(wrapper.find('.filter-section').exists()).toBe(true)
      expect(wrapper.find('.filter-title').text()).toBe('Filters')
    })

    it('renders the positions content main region', () => {
      expect(wrapper.find('.position-list__content').exists()).toBe(true)
    })

    it('renders the grid with a list role when positions exist', () => {
      const grid = wrapper.find('.position-list__grid')
      expect(grid.exists()).toBe(true)
      expect(grid.attributes('role')).toBe('list')
    })

    it('renders one position card per loaded position', () => {
      expect(wrapper.findAll('.position-card')).toHaveLength(TOTAL_POSITIONS)
    })

    it('marks each card with the listitem role', () => {
      wrapper.findAll('.position-card').forEach((card) => {
        expect(card.attributes('role')).toBe('listitem')
      })
    })
  })

  // ============================================
  // Breadcrumb Tests
  // ============================================
  describe('Breadcrumb', () => {
    it('renders Home and Join Us links plus current page', () => {
      const links = wrapper.findAll('.breadcrumb-link')
      expect(links).toHaveLength(2)
      expect(links[0].text()).toBe('Home')
      expect(links[1].text()).toBe('Join Us')
      expect(wrapper.find('.breadcrumb-current').text()).toBe('Job Openings')
    })

    it('renders separators between breadcrumb items', () => {
      const separators = wrapper.findAll('.breadcrumb-separator')
      expect(separators).toHaveLength(2)
    })
  })

  // ============================================
  // Filter Sidebar Tests
  // ============================================
  describe('Filter Sidebar', () => {
    it('renders the search input with an associated label', () => {
      const search = wrapper.find('#search-input')
      expect(search.exists()).toBe(true)
      expect(search.attributes('placeholder')).toBe('Search jobs')
      const label = wrapper.find('label[for="search-input"]')
      expect(label.exists()).toBe(true)
    })

    it('renders the department select with all options', () => {
      const select = wrapper.find('#department-select')
      expect(select.exists()).toBe(true)
      const options = select.findAll('option')
      // all + 5 departments
      expect(options).toHaveLength(6)
      expect(options[0].attributes('value')).toBe('')
      expect(options[0].text()).toBe('All Departments')
    })

    it('renders the location select with all options', () => {
      const select = wrapper.find('#location-select')
      expect(select.exists()).toBe(true)
      const options = select.findAll('option')
      // all + 4 locations
      expect(options).toHaveLength(5)
    })

    it('renders the employment type select with all options', () => {
      const select = wrapper.find('#type-select')
      expect(select.exists()).toBe(true)
      const options = select.findAll('option')
      // all + 4 types
      expect(options).toHaveLength(5)
    })

    it('labels each filter control with a for/id pairing', () => {
      expect(wrapper.find('label[for="department-select"]').exists()).toBe(
        true,
      )
      expect(wrapper.find('label[for="location-select"]').exists()).toBe(true)
      expect(wrapper.find('label[for="type-select"]').exists()).toBe(true)
    })

    it('does not show the active-filters bar when nothing is filtered', () => {
      expect(wrapper.find('.filter-active').exists()).toBe(false)
    })
  })

  // ============================================
  // Search Functionality Tests
  // ============================================
  describe('Search Functionality', () => {
    it('updates searchQuery reactively as the user types', async () => {
      const search = wrapper.find('#search-input')
      await search.setValue('Frontend')
      expect((wrapper.vm as any).searchQuery).toBe('Frontend')
    })

    it('filters positions by English title on search', async () => {
      await wrapper.find('#search-input').setValue('Frontend')
      await wrapper.vm.$nextTick()
      const cards = wrapper.findAll('.position-card')
      expect(cards).toHaveLength(1)
      expect(cards[0].find('.position-card__title').text()).toBe(
        'Frontend Developer',
      )
    })

    it('search is case-insensitive', async () => {
      await wrapper.find('#search-input').setValue('frontend')
      await wrapper.vm.$nextTick()
      expect(wrapper.findAll('.position-card')).toHaveLength(1)
    })

    it('matches "Developer" against multiple engineering roles', async () => {
      // Frontend, Backend, Full Stack Developers all contain "Developer"
      await wrapper.find('#search-input').setValue('Developer')
      await wrapper.vm.$nextTick()
      expect(wrapper.findAll('.position-card').length).toBe(3)
    })

    it('shows the active-filters bar with a count while searching', async () => {
      await wrapper.find('#search-input').setValue('Developer')
      await wrapper.vm.$nextTick()
      const active = wrapper.find('.filter-active')
      expect(active.exists()).toBe(true)
      expect(active.text()).toContain('3')
    })

    it('shows the empty state when search matches nothing', async () => {
      await wrapper.find('#search-input').setValue('zzznomatch')
      await wrapper.vm.$nextTick()
      expect(wrapper.find('.position-list__empty').exists()).toBe(true)
      expect(wrapper.find('.empty-title').text()).toBe('No matches found')
    })
  })

  // ============================================
  // Filter Functionality Tests
  // ============================================
  describe('Filter Functionality', () => {
    it('filters by department', async () => {
      await wrapper.find('#department-select').setValue('product')
      await wrapper.vm.$nextTick()
      const cards = wrapper.findAll('.position-card')
      expect(cards).toHaveLength(1)
      expect(cards[0].find('.position-card__title').text()).toBe(
        'Product Manager',
      )
    })

    it('filters by location (shanghai has 3 roles)', async () => {
      await wrapper.find('#location-select').setValue('shanghai')
      await wrapper.vm.$nextTick()
      // Frontend, Full Stack, QA Engineers are in shanghai
      expect(wrapper.findAll('.position-card').length).toBe(3)
    })

    it('filters by employment type (all positions are fulltime)', async () => {
      await wrapper.find('#type-select').setValue('fulltime')
      await wrapper.vm.$nextTick()
      expect(wrapper.findAll('.position-card').length).toBe(TOTAL_POSITIONS)
    })

    it('filters by employment type with no matches (contract)', async () => {
      await wrapper.find('#type-select').setValue('contract')
      await wrapper.vm.$nextTick()
      expect(wrapper.findAll('.position-card')).toHaveLength(0)
      expect(wrapper.find('.position-list__empty').exists()).toBe(true)
    })

    it('applies multiple filters simultaneously (AND logic)', async () => {
      // engineering + beijing => DevOps Engineer only
      await wrapper.find('#department-select').setValue('engineering')
      await wrapper.find('#location-select').setValue('beijing')
      await wrapper.vm.$nextTick()
      const cards = wrapper.findAll('.position-card')
      expect(cards).toHaveLength(1)
      expect(cards[0].find('.position-card__title').text()).toBe(
        'DevOps Engineer',
      )
    })

    it('combines search and filter together', async () => {
      await wrapper.find('#search-input').setValue('Developer')
      await wrapper.find('#department-select').setValue('engineering')
      await wrapper.vm.$nextTick()
      // Frontend, Backend, Full Stack are engineering Developers (QA is "Engineer")
      expect(wrapper.findAll('.position-card').length).toBe(3)
    })

    it('shows the clear-all button when filters are active', async () => {
      await wrapper.find('#department-select').setValue('design')
      await wrapper.vm.$nextTick()
      expect(wrapper.find('.filter-clear').exists()).toBe(true)
      expect(wrapper.find('.filter-clear').text()).toBe('Clear All')
    })

    it('resets all filters when clear-all is clicked', async () => {
      await wrapper.find('#search-input').setValue('Frontend')
      await wrapper.find('#department-select').setValue('engineering')
      await wrapper.find('#location-select').setValue('shanghai')
      await wrapper.vm.$nextTick()

      await wrapper.find('.filter-clear').trigger('click')
      await wrapper.vm.$nextTick()

      expect((wrapper.vm as any).searchQuery).toBe('')
      expect((wrapper.vm as any).selectedDepartment).toBe('')
      expect((wrapper.vm as any).selectedLocation).toBe('')
      expect((wrapper.vm as any).selectedType).toBe('')
      expect(wrapper.findAll('.position-card')).toHaveLength(TOTAL_POSITIONS)
      expect(wrapper.find('.filter-active').exists()).toBe(false)
    })

    it('clears filters from the empty-state action button too', async () => {
      await wrapper.find('#search-input').setValue('zzz')
      await wrapper.vm.$nextTick()
      expect(wrapper.find('.empty-action').exists()).toBe(true)
      await wrapper.find('.empty-action').trigger('click')
      await wrapper.vm.$nextTick()
      expect((wrapper.vm as any).searchQuery).toBe('')
    })
  })

  // ============================================
  // Position Card Tests
  // ============================================
  describe('Position Cards', () => {
    it('renders the job title as an h3', () => {
      const card = wrapper.findAll('.position-card')[0]
      const title = card.find('.position-card__title')
      expect(title.exists()).toBe(true)
      expect(title.element.tagName.toLowerCase()).toBe('h3')
      expect(title.text()).toBe('Frontend Developer')
    })

    it('renders department, location (with icon), and posted date metadata', () => {
      const card = wrapper.findAll('.position-card')[0]
      const metaItems = card.findAll('.position-card__meta-item')
      expect(metaItems).toHaveLength(3)
      expect(metaItems[0].text()).toBe('Engineering')
      expect(metaItems[1].find('.position-card__icon').exists()).toBe(true)
      expect(metaItems[1].text()).toContain('Shanghai')
      expect(metaItems[2].text()).toContain('Posted')
    })

    it('renders a description (within the 120-char truncation limit)', () => {
      const card = wrapper.findAll('.position-card')[0]
      const desc = card.find('.position-card__description')
      expect(desc.exists()).toBe(true)
      // Real Frontend Developer description is 118 chars => not truncated.
      expect(desc.text().endsWith('...')).toBe(false)
    })

    it('renders salary and an uppercased type badge in the footer', () => {
      const card = wrapper.findAll('.position-card')[0]
      expect(card.find('.position-card__salary').text()).toBe(
        '¥25,000 - ¥40,000',
      )
      expect(card.find('.position-card__badge').text()).toBe('FULLTIME')
    })

    it('renders a View Details action button on each card', () => {
      wrapper.findAll('.position-card').forEach((card) => {
        const action = card.find('.position-card__action')
        expect(action.exists()).toBe(true)
        expect(action.text()).toBe('View Details')
        expect(action.attributes('aria-label')).toContain('View Details')
        expect(action.attributes('aria-label')).toContain('-')
      })
    })

    it('formats the posted date as a localized short date', () => {
      const card = wrapper.findAll('.position-card')[0]
      const postedItem = card.findAll('.position-card__meta-item')[2]
      // postedDate for position 1 is 2025-05-15
      expect(postedItem.text()).toContain('2025')
    })
  })

  // ============================================
  // Position Detail Modal Tests
  // ============================================
  describe('Position Detail Modal', () => {
    it('opens the modal when a card action is clicked', async () => {
      expect(wrapper.find('.position-modal').exists()).toBe(false)
      await wrapper.findAll('.position-card__action')[0].trigger('click')
      await wrapper.vm.$nextTick()
      expect(wrapper.find('.position-modal').exists()).toBe(true)
    })

    it('locks body scroll when the modal opens', async () => {
      await wrapper.findAll('.position-card__action')[0].trigger('click')
      await wrapper.vm.$nextTick()
      expect(document.body.style.overflow).toBe('hidden')
    })

    it('renders the modal as a dialog with aria-modal', async () => {
      await wrapper.findAll('.position-card__action')[0].trigger('click')
      await wrapper.vm.$nextTick()
      const modal = wrapper.find('.position-modal')
      expect(modal.attributes('role')).toBe('dialog')
      expect(modal.attributes('aria-modal')).toBe('true')
    })

    it('displays the title, department, location and salary in the modal', async () => {
      await wrapper.findAll('.position-card__action')[0].trigger('click')
      await wrapper.vm.$nextTick()
      const modal = wrapper.find('.position-modal')
      expect(modal.find('.position-modal__title').text()).toBe(
        'Frontend Developer',
      )
      const meta = modal.find('.position-modal__meta')
      expect(meta.text()).toContain('Engineering')
      expect(meta.text()).toContain('Shanghai')
      expect(meta.text()).toContain('¥25,000 - ¥40,000')
    })

    it('renders description, responsibilities, requirements, benefits and culture sections', async () => {
      await wrapper.findAll('.position-card__action')[0].trigger('click')
      await wrapper.vm.$nextTick()
      const sections = wrapper.findAll('.position-modal__section')
      expect(sections).toHaveLength(5)
      const headings = sections.map((s) => s.find('h3').text())
      expect(headings).toEqual([
        'Description',
        'Responsibilities',
        'Requirements',
        'Benefits',
        'Culture',
      ])
    })

    it('renders list items for responsibilities, requirements and benefits', async () => {
      await wrapper.findAll('.position-card__action')[0].trigger('click')
      await wrapper.vm.$nextTick()
      // Frontend Developer: responsibilities=4, requirements=4, benefits=4
      const items = wrapper.findAll('.position-modal__list li')
      expect(items.length).toBe(12)
    })

    it('renders the Apply Now and Share action buttons', async () => {
      await wrapper.findAll('.position-card__action')[0].trigger('click')
      await wrapper.vm.$nextTick()
      expect(wrapper.find('.position-modal__apply').text()).toBe('Apply Now')
      expect(wrapper.find('.position-modal__share').text()).toBe('Share')
    })

    it('closes the modal when the close button is clicked and restores scroll', async () => {
      await wrapper.findAll('.position-card__action')[0].trigger('click')
      await wrapper.vm.$nextTick()
      expect(wrapper.find('.position-modal').exists()).toBe(true)

      await wrapper.find('.position-modal__close').trigger('click')
      await wrapper.vm.$nextTick()
      expect(wrapper.find('.position-modal').exists()).toBe(false)
      expect(document.body.style.overflow).toBe('')
    })

    it('closes the modal when the overlay is clicked', async () => {
      await wrapper.findAll('.position-card__action')[0].trigger('click')
      await wrapper.vm.$nextTick()
      await wrapper.find('.position-modal__overlay').trigger('click')
      await wrapper.vm.$nextTick()
      expect(wrapper.find('.position-modal').exists()).toBe(false)
    })

    it('gives the close button an accessible aria-label', async () => {
      await wrapper.findAll('.position-card__action')[0].trigger('click')
      await wrapper.vm.$nextTick()
      expect(
        wrapper.find('.position-modal__close').attributes('aria-label'),
      ).toBe('Back to list')
    })
  })

  // ============================================
  // Accessibility Tests
  // ============================================
  describe('Accessibility', () => {
    it('uses exactly one h1 for the page title', () => {
      expect(wrapper.findAll('h1')).toHaveLength(1)
    })

    it('uses h2 for the filter heading', () => {
      const h2 = wrapper.find('.filter-title')
      expect(h2.element.tagName.toLowerCase()).toBe('h2')
    })

    it('uses h3 for each position card title', () => {
      wrapper.findAll('.position-card__title').forEach((title) => {
        expect(title.element.tagName.toLowerCase()).toBe('h3')
      })
    })

    it('renders the empty state with role=status and aria-live', async () => {
      await wrapper.find('#search-input').setValue('zzz')
      await wrapper.vm.$nextTick()
      const empty = wrapper.find('.position-list__empty')
      expect(empty.attributes('role')).toBe('status')
      expect(empty.attributes('aria-live')).toBe('polite')
    })

    it('uses a nav landmark with aria-label for the breadcrumb', () => {
      const nav = wrapper.find('nav.position-list__breadcrumb')
      expect(nav.exists()).toBe(true)
      expect(nav.attributes('aria-label')).toBe('Breadcrumb')
    })

    it('uses an aside landmark for the filters sidebar', () => {
      expect(wrapper.find('aside.position-list__filters').exists()).toBe(true)
    })

    it('uses a main landmark for the positions content', () => {
      expect(wrapper.find('main.position-list__content').exists()).toBe(true)
    })

    it('provides accessible labels for all interactive filter controls', () => {
      const inputs = [
        'search-input',
        'department-select',
        'location-select',
        'type-select',
      ]
      inputs.forEach((id) => {
        expect(wrapper.find(`label[for="${id}"]`).exists()).toBe(true)
      })
    })
  })

  // ============================================
  // Internationalization Tests
  // ============================================
  describe('Internationalization', () => {
    it('exposes a translation function on the component instance', () => {
      expect(typeof (wrapper.vm as any).t).toBe('function')
    })

    it('translates the page title and subtitle', () => {
      expect(wrapper.find('.position-list__title').text()).toBe('Job Openings')
      expect(wrapper.find('.position-list__title-accent').text()).toBe(
        'Join Our Team',
      )
    })

    it('translates the filter section heading and labels', () => {
      expect(wrapper.find('.filter-title').text()).toBe('Filters')
      expect(wrapper.find('label[for="department-select"]').text()).toBe(
        'Department',
      )
      expect(wrapper.find('label[for="location-select"]').text()).toBe(
        'Location',
      )
      expect(wrapper.find('label[for="type-select"]').text()).toBe(
        'Employment Type',
      )
    })

    it('translates the View Details action text', () => {
      const action = wrapper.findAll('.position-card__action')[0]
      expect(action.text()).toBe('View Details')
    })

    it('translates the empty state messages', async () => {
      await wrapper.find('#search-input').setValue('zzz')
      await wrapper.vm.$nextTick()
      expect(wrapper.find('.empty-title').text()).toBe('No matches found')
      expect(wrapper.find('.empty-message').text()).toBe(
        'Try adjusting your filters',
      )
    })

    it('falls back to the key for unknown translations', () => {
      const result = (wrapper.vm as any).t('positions.unknown.key')
      expect(result).toBe('positions.unknown.key')
    })
  })

  // ============================================
  // Cyberpunk Styling Tests
  // ============================================
  describe('Cyberpunk Styling', () => {
    it('applies position-card class to each card', () => {
      wrapper.findAll('.position-card').forEach((card) => {
        expect(card.classes()).toContain('position-card')
      })
    })

    it('applies the filter-section cyber container', () => {
      expect(wrapper.find('.filter-section').exists()).toBe(true)
    })

    it('applies neon-styled action buttons', () => {
      const action = wrapper.findAll('.position-card__action')[0]
      expect(action.classes()).toContain('position-card__action')
    })

    it('renders the modal with an overlay layer', async () => {
      await wrapper.findAll('.position-card__action')[0].trigger('click')
      await wrapper.vm.$nextTick()
      expect(wrapper.find('.position-modal__overlay').exists()).toBe(true)
    })
  })

  // ============================================
  // Edge Cases
  // ============================================
  describe('Edge Cases', () => {
    it('shows the filtered empty state when no position matches a filter', async () => {
      // No position is "contract" type => empty state with message + action.
      await wrapper.find('#type-select').setValue('contract')
      await wrapper.vm.$nextTick()
      expect(wrapper.find('.position-list__empty').exists()).toBe(true)
      expect(wrapper.find('.empty-title').text()).toBe('No matches found')
      expect(wrapper.find('.empty-message').exists()).toBe(true)
      expect(wrapper.find('.empty-action').exists()).toBe(true)
    })

    it('shows the empty state with clear action when a search matches nothing', async () => {
      await wrapper.find('#search-input').setValue('nomatchatall')
      await wrapper.vm.$nextTick()
      expect(wrapper.find('.empty-action').exists()).toBe(true)
    })

    it('clears to full list via the empty-state action', async () => {
      await wrapper.find('#type-select').setValue('contract')
      await wrapper.vm.$nextTick()
      await wrapper.find('.empty-action').trigger('click')
      await wrapper.vm.$nextTick()
      expect((wrapper.vm as any).selectedType).toBe('')
      expect(wrapper.findAll('.position-card')).toHaveLength(TOTAL_POSITIONS)
    })

    it('renders consistently across multiple mounts', async () => {
      const a = await mountComponent()
      const b = await mountComponent()
      expect(a.wrapper.findAll('.position-card').length).toBe(
        b.wrapper.findAll('.position-card').length,
      )
      a.wrapper.unmount()
      b.wrapper.unmount()
    })

    it('renders without console errors', async () => {
      const consoleSpy = vi.spyOn(console, 'error')
      const { wrapper: w } = await mountComponent()
      expect(consoleSpy).not.toHaveBeenCalled()
      w.unmount()
      consoleSpy.mockRestore()
    })
  })
})
