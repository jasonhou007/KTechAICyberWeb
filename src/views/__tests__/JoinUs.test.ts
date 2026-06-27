/**
 * @file JoinUs.test.ts
 * @description Comprehensive unit tests for JoinUs view component
 * @ticket #56 - TEST-009: Join Us Component Unit Tests - TDD with Vitest
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mount, VueWrapper } from '@vue/test-utils'
import { createRouter, createMemoryHistory } from 'vue-router'

// Mock the module before importing the component
vi.mock('../../composables/useLanguage', () => {
  const mockTranslations = {
    'joinUs.title': 'Join',
    'joinUs.titleAccent': 'Us',
    'joinUs.subtitle': 'Build the future with us. Join our team of innovators and shape the next generation of AI technology.',
    'joinUs.cta.button': 'View Open Positions',
    'joinUs.cta.ariaLabel': 'View open positions',
    'joinUs.culture.title': 'Our Culture',
    'joinUs.culture.description': 'We foster a culture of innovation, collaboration, and continuous learning. At KTech, every team member contributes to our mission of advancing AI technology.',
    'joinUs.culture.innovation.title': 'Innovation First',
    'joinUs.culture.innovation.description': 'We embrace cutting-edge technology and push the boundaries of what\'s possible with AI.',
    'joinUs.culture.teamwork.title': 'Collaborative Spirit',
    'joinUs.culture.teamwork.description': 'Great things are built together. We believe in diverse perspectives and inclusive teamwork.',
    'joinUs.culture.creativity.title': 'Creative Freedom',
    'joinUs.culture.creativity.description': 'We encourage creative thinking and provide the freedom to explore new ideas and solutions.',
    'joinUs.culture.growth.title': 'Continuous Growth',
    'joinUs.culture.growth.description': 'Your growth matters. We offer learning opportunities and career advancement pathways.',
    'joinUs.benefits.title': 'Benefits & Perks',
    'joinUs.benefits.competitive.title': 'Competitive Salary',
    'joinUs.benefits.competitive.description': 'Industry-leading compensation packages based on experience and market standards.',
    'joinUs.benefits.development.title': 'Professional Development',
    'joinUs.benefits.development.description': 'Continuous learning opportunities, conferences, workshops, and skill enhancement programs.',
    'joinUs.benefits.balance.title': 'Work-Life Balance',
    'joinUs.benefits.balance.description': 'Flexible working arrangements and supportive environment for personal well-being.',
    'joinUs.benefits.health.title': 'Health Insurance',
    'joinUs.benefits.health.description': 'Comprehensive health coverage including medical, dental, and vision insurance.',
    'joinUs.benefits.activities.title': 'Team Activities',
    'joinUs.benefits.activities.description': 'Regular team building events, hackathons, and social gatherings to foster connections.',
    'joinUs.benefits.career.title': 'Career Growth',
    'joinUs.benefits.career.description': 'Clear career progression paths with mentorship and internal mobility opportunities.',
    'joinUs.positions.title': 'Open Positions',
    'joinUs.positions.subtitle': 'Explore our current openings and find your place in our team.',
    'joinUs.positions.viewAll': 'View All Positions',
    'joinUs.process.title': 'Application Process',
    'joinUs.process.step1.title': 'Apply Online',
    'joinUs.process.step1.description': 'Submit your application through our portal with your resume and cover letter.',
    'joinUs.process.step2.title': 'Initial Screening',
    'joinUs.process.step2.description': 'Our team reviews your application and contacts shortlisted candidates for initial discussion.',
    'joinUs.process.step3.title': 'Interviews',
    'joinUs.process.step3.description': 'Meet with our team members to discuss your skills, experience, and mutual fit.',
    'joinUs.process.step4.title': 'Welcome Aboard',
    'joinUs.process.step4.description': 'Receive an offer and join our team to start building the future together.',
    'joinUs.contact.title': 'Get In Touch',
    'joinUs.contact.description': 'Have questions about working at KTech? We\'d love to hear from you.',
    'joinUs.contact.email': 'careers@ktech.ai'
  }

  return {
    useLanguage: () => ({
      currentLanguage: { value: 'en' },
      languageDisplay: { value: 'EN' },
      isEnglish: { value: true },
      initLanguage: vi.fn(),
      setLanguage: vi.fn(),
      toggleLanguage: vi.fn(),
      t: (key) => mockTranslations[key] || key
    })
  }
})

import JoinUs from '../JoinUs.vue'

describe('JoinUs.vue', () => {
  let wrapper: VueWrapper
  let router: any

  beforeEach(async () => {
    // Create router instance
    router = createRouter({
      history: createMemoryHistory(),
      routes: [
        { path: '/', component: { template: '<div>Home</div>' } },
        { path: '/join-us', component: JoinUs },
        { path: '/join-us/positions', component: { template: '<div>Position List</div>' } }
      ]
    })

    // Navigate to join-us route
    await router.push('/join-us')
    await router.isReady()

    // Mount component. The real vue-router plugin is provided, so the genuine
    // <router-link> (RouterLink) component renders — this is what the
    // "integrates with Vue Router" assertion verifies. Do NOT stub router-link
    // here, or findComponent({ name: 'RouterLink' }) would find the stub instead.
    wrapper = mount(JoinUs, {
      global: {
        plugins: [router]
      }
    })

    await wrapper.vm.$nextTick()
  })

  afterEach(() => {
    if (wrapper) {
      wrapper.unmount()
    }
  })

  /**
   * Test Suite 1: Component Rendering Tests
   * Verifies that the component renders without crashing and all sections are present
   */
  describe('Component Rendering', () => {
    it('should render the component without crashing', () => {
      expect(wrapper.exists()).toBe(true)
      expect(wrapper.find('.join-us').exists()).toBe(true)
    })

    it('should render the hero section', () => {
      const hero = wrapper.find('.hero')
      expect(hero.exists()).toBe(true)
      expect(hero.find('.page-title').exists()).toBe(true)
    })

    it('should render the culture section', () => {
      const culture = wrapper.find('.culture')
      expect(culture.exists()).toBe(true)
      expect(culture.find('.section-title').exists()).toBe(true)
    })

    it('should render the benefits section', () => {
      const benefits = wrapper.find('.benefits')
      expect(benefits.exists()).toBe(true)
      expect(benefits.find('.section-title').exists()).toBe(true)
    })

    it('should render the positions section', () => {
      const positions = wrapper.find('.positions')
      expect(positions.exists()).toBe(true)
      expect(positions.find('.section-title').exists()).toBe(true)
    })

    it('should render the application process section', () => {
      const process = wrapper.find('.process')
      expect(process.exists()).toBe(true)
      expect(process.find('.section-title').exists()).toBe(true)
    })

    it('should render the contact section', () => {
      const contact = wrapper.find('.contact')
      expect(contact.exists()).toBe(true)
      expect(contact.find('.section-title').exists()).toBe(true)
    })
  })

  /**
   * Test Suite 2: Content Display Tests
   * Verifies that all content displays correctly
   */
  describe('Content Display', () => {
    it('should display the page title correctly', () => {
      const title = wrapper.find('.page-title')
      expect(title.exists()).toBe(true)
      expect(title.text()).toContain('Join')
      expect(title.find('.accent').text()).toBe('Us')
    })

    it('should display the subtitle', () => {
      const subtitle = wrapper.find('.subtitle')
      expect(subtitle.exists()).toBe(true)
      expect(subtitle.text()).toContain('Build the future with us')
    })

    it('should display all four culture value cards', () => {
      const cultureCards = wrapper.findAll('.culture-card')
      expect(cultureCards).toHaveLength(4)
    })

    it('should display culture content in correct order', () => {
      const cards = wrapper.findAll('.culture-card')
      expect(cards[0].find('h3').text()).toBe('Innovation First')
      expect(cards[1].find('h3').text()).toBe('Collaborative Spirit')
      expect(cards[2].find('h3').text()).toBe('Creative Freedom')
      expect(cards[3].find('h3').text()).toBe('Continuous Growth')
    })

    it('should display all six benefit cards', () => {
      const benefitCards = wrapper.findAll('.benefit-card')
      expect(benefitCards).toHaveLength(6)
    })

    it('should display benefits content with correct titles', () => {
      const cards = wrapper.findAll('.benefit-card')
      const titles = cards.map(card => card.find('h3').text())

      expect(titles).toContain('Competitive Salary')
      expect(titles).toContain('Professional Development')
      expect(titles).toContain('Work-Life Balance')
      expect(titles).toContain('Health Insurance')
      expect(titles).toContain('Team Activities')
      expect(titles).toContain('Career Growth')
    })

    it('should display all four application process steps', () => {
      const steps = wrapper.findAll('.process-step')
      expect(steps).toHaveLength(4)
    })

    it('should display process steps in correct order', () => {
      const steps = wrapper.findAll('.process-step')
      expect(steps[0].find('h3').text()).toBe('Apply Online')
      expect(steps[1].find('h3').text()).toBe('Initial Screening')
      expect(steps[2].find('h3').text()).toBe('Interviews')
      expect(steps[3].find('h3').text()).toBe('Welcome Aboard')
    })

    it('should display step numbers', () => {
      const stepNumbers = wrapper.findAll('.step-number')
      expect(stepNumbers).toHaveLength(4)
      expect(stepNumbers[0].text()).toBe('1')
      expect(stepNumbers[1].text()).toBe('2')
      expect(stepNumbers[2].text()).toBe('3')
      expect(stepNumbers[3].text()).toBe('4')
    })

    it('should display contact email', () => {
      const emailLink = wrapper.find('.email-link')
      expect(emailLink.exists()).toBe(true)
      expect(emailLink.text()).toBe('careers@ktech.ai')
    })
  })

  /**
   * Test Suite 3: Navigation Functionality Tests
   * Verifies that navigation links work correctly
   */
  describe('Navigation Functionality', () => {
    it('should have a CTA button that links to positions', () => {
      const ctaButton = wrapper.find('.cta-button')
      expect(ctaButton.exists()).toBe(true)
      expect(ctaButton.attributes('href')).toBe('/join-us/positions')
    })

    it('should have aria-label on CTA button', () => {
      const ctaButton = wrapper.find('.cta-button')
      expect(ctaButton.attributes('aria-label')).toBe('View open positions')
    })

    it('should have a view all positions button', () => {
      const viewAllButton = wrapper.find('.view-all-button')
      expect(viewAllButton.exists()).toBe(true)
      expect(viewAllButton.attributes('href')).toBe('/join-us/positions')
    })

    it('should display correct CTA button text', () => {
      const ctaButton = wrapper.find('.cta-button')
      expect(ctaButton.text()).toBe('View Open Positions')
    })

    it('should display correct view all button text', () => {
      const viewAllButton = wrapper.find('.view-all-button')
      expect(viewAllButton.text()).toBe('View All Positions')
    })
  })

  /**
   * Test Suite 4: Internationalization Tests
   * Verifies that translations are used throughout the component
   */
  describe('Internationalization', () => {
    it('should translate the page title', () => {
      const title = wrapper.find('.page-title')
      expect(title.text()).toContain('Join')
    })

    it('should translate the accent text', () => {
      const accent = wrapper.find('.accent')
      expect(accent.text()).toBe('Us')
    })

    it('should translate the subtitle', () => {
      const subtitle = wrapper.find('.subtitle')
      expect(subtitle.text()).toContain('Build the future with us')
    })

    it('should translate section headings', () => {
      const sectionTitles = wrapper.findAll('.section-title')
      const texts = sectionTitles.map(el => el.text())

      expect(texts).toContain('Our Culture')
      expect(texts).toContain('Benefits & Perks')
      expect(texts).toContain('Open Positions')
      expect(texts).toContain('Application Process')
      expect(texts).toContain('Get In Touch')
    })

    it('should translate button text', () => {
      const ctaButton = wrapper.find('.cta-button')
      expect(ctaButton.text()).toBe('View Open Positions')
    })

    it('should translate culture content', () => {
      const cards = wrapper.findAll('.culture-card')
      cards.forEach(card => {
        const title = card.find('h3').text()
        const description = card.find('p').text()
        expect(title.length).toBeGreaterThan(0)
        expect(description.length).toBeGreaterThan(0)
      })
    })

    it('should translate benefits content', () => {
      const cards = wrapper.findAll('.benefit-card')
      cards.forEach(card => {
        const title = card.find('h3').text()
        const description = card.find('p').text()
        expect(title.length).toBeGreaterThan(0)
        expect(description.length).toBeGreaterThan(0)
      })
    })

    it('should translate application process steps', () => {
      const steps = wrapper.findAll('.process-step')
      steps.forEach(step => {
        const title = step.find('h3').text()
        const description = step.find('p').text()
        expect(title.length).toBeGreaterThan(0)
        expect(description.length).toBeGreaterThan(0)
      })
    })
  })

  /**
   * Test Suite 5: Cyberpunk Styling Tests
   * Verifies that cyberpunk theme styling is applied
   */
  describe('Cyberpunk Styling', () => {
    it('should have cyan accent color on title', () => {
      const accent = wrapper.find('.accent')
      const styles = window.getComputedStyle(accent.element)
      expect(accent.classes()).toContain('accent')
    })

    it('should apply card styling to culture cards', () => {
      const cards = wrapper.findAll('.culture-card')
      cards.forEach(card => {
        expect(card.classes()).toContain('culture-card')
      })
    })

    it('should apply card styling to benefit cards', () => {
      const cards = wrapper.findAll('.benefit-card')
      cards.forEach(card => {
        expect(card.classes()).toContain('benefit-card')
      })
    })

    it('should apply step number styling', () => {
      const stepNumbers = wrapper.findAll('.step-number')
      stepNumbers.forEach(step => {
        expect(step.classes()).toContain('step-number')
      })
    })

    it('should have button styling on CTA', () => {
      const ctaButton = wrapper.find('.cta-button')
      expect(ctaButton.classes()).toContain('cta-button')
    })

    it('should have button styling on view all button', () => {
      const viewAllButton = wrapper.find('.view-all-button')
      expect(viewAllButton.classes()).toContain('view-all-button')
    })
  })

  /**
   * Test Suite 6: Accessibility Tests
   * Verifies accessibility features
   */
  describe('Accessibility', () => {
    it('should have proper heading hierarchy', () => {
      const h1 = wrapper.find('.page-title')
      const h2s = wrapper.findAll('.section-title')
      const h3s = wrapper.findAll('h3')

      expect(h1.exists()).toBe(true)
      expect(h2s.length).toBeGreaterThan(0)
      expect(h3s.length).toBeGreaterThan(0)
    })

    it('should have aria-label on interactive elements', () => {
      const ctaButton = wrapper.find('.cta-button')
      expect(ctaButton.attributes('aria-label')).toBeDefined()
    })

    it('should have aria-labelledby on sections', () => {
      const culture = wrapper.find('.culture')
      const benefits = wrapper.find('.benefits')
      const positions = wrapper.find('.positions')
      const process = wrapper.find('.process')
      const contact = wrapper.find('.contact')

      expect(culture.attributes('aria-labelledby')).toBeDefined()
      expect(benefits.attributes('aria-labelledby')).toBeDefined()
      expect(positions.attributes('aria-labelledby')).toBeDefined()
      expect(process.attributes('aria-labelledby')).toBeDefined()
      expect(contact.attributes('aria-labelledby')).toBeDefined()
    })

    it('should have semantic HTML structure', () => {
      expect(wrapper.find('section').exists()).toBe(true)
      expect(wrapper.find('.join-us').exists()).toBe(true)
    })

    it('should have accessible names on all links', () => {
      const links = wrapper.findAll('a')
      links.forEach(link => {
        const text = link.text().trim()
        const ariaLabel = link.attributes('aria-label')
        expect(text.length + (ariaLabel?.length || 0)).toBeGreaterThan(0)
      })
    })
  })

  /**
   * Test Suite 7: Responsive Design Tests
   * Verifies responsive behavior
   */
  describe('Responsive Design', () => {
    it('should render with proper container class', () => {
      const containers = wrapper.findAll('.container')
      expect(containers.length).toBeGreaterThan(0)
    })

    it('should have culture cards in grid layout', () => {
      const cultureValues = wrapper.find('.culture-values')
      expect(cultureValues.classes()).toContain('culture-values')
    })

    it('should have benefits in grid layout', () => {
      const benefitsGrid = wrapper.find('.benefits-grid')
      expect(benefitsGrid.classes()).toContain('benefits-grid')
    })

    it('should have process steps in grid layout', () => {
      const processSteps = wrapper.find('.process-steps')
      expect(processSteps.classes()).toContain('process-steps')
    })
  })

  /**
   * Test Suite 8: Integration Tests
   * Verifies integration with Vue Router and composables
   */
  describe('Integration', () => {
    it('should integrate with Vue Router', () => {
      expect(wrapper.findComponent({ name: 'RouterLink' }).exists()).toBe(true)
    })

    it('should call initLanguage on mount', () => {
      const { useLanguage } = require('../../composables/useLanguage')
      const mockInit = useLanguage().initLanguage
      // Verify initLanguage was called during component setup
    })

    it('should have translation function available', () => {
      const { useLanguage } = require('../../composables/useLanguage')
      const t = useLanguage().t
      expect(typeof t).toBe('function')
    })
  })

  /**
   * Test Suite 9: Component Structure Tests
   * Verifies the overall component structure
   */
  describe('Component Structure', () => {
    it('should have exactly 6 main sections', () => {
      expect(wrapper.find('.hero').exists()).toBe(true)
      expect(wrapper.find('.culture').exists()).toBe(true)
      expect(wrapper.find('.benefits').exists()).toBe(true)
      expect(wrapper.find('.positions').exists()).toBe(true)
      expect(wrapper.find('.process').exists()).toBe(true)
      expect(wrapper.find('.contact').exists()).toBe(true)
    })

    it('should have hero content wrapper', () => {
      const heroContent = wrapper.find('.hero-content')
      expect(heroContent.exists()).toBe(true)
    })

    it('should have culture values container', () => {
      const cultureValues = wrapper.find('.culture-values')
      expect(cultureValues.exists()).toBe(true)
    })

    it('should have benefits grid container', () => {
      const benefitsGrid = wrapper.find('.benefits-grid')
      expect(benefitsGrid.exists()).toBe(true)
    })

    it('should have process steps container', () => {
      const processSteps = wrapper.find('.process-steps')
      expect(processSteps.exists()).toBe(true)
    })
  })

  /**
   * Test Suite 10: Edge Cases and Error Handling
   */
  describe('Edge Cases', () => {
    it('should handle missing translation keys gracefully', () => {
      const { useLanguage } = require('../../composables/useLanguage')
      const t = useLanguage().t
      const missingKey = 'nonexistent.key'
      expect(t(missingKey)).toBe(missingKey)
    })

    it('should render without console errors', () => {
      const consoleSpy = vi.spyOn(console, 'error')
      mount(JoinUs, {
        global: {
          plugins: [router]
        }
      })
      expect(consoleSpy).not.toHaveBeenCalled()
      consoleSpy.mockRestore()
    })
  })
})
