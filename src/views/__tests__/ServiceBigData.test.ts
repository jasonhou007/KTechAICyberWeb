/**
 * @file ServiceBigData.test.ts
 * @description Unit tests for ServiceBigData component using Vitest
 * @covers src/views/ServiceBigData.vue
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import ServiceBigData from '../ServiceBigData.vue'

// Mock useLanguage composable
const mockTranslations = {
  'bigData.hero.title': 'Big Data & AI Solutions',
  'bigData.hero.subtitle': 'Transform Your Business with Intelligent Data Analytics',
  'bigData.hero.description': 'Harness the power of artificial intelligence and big data analytics to drive innovation, optimize operations, and unlock new opportunities for growth.',
  'bigData.features.title': 'Core Capabilities',
  'bigData.features.aiLearning': 'Deep Learning & AI',
  'bigData.features.aiLearningDesc': 'Advanced neural networks for pattern recognition and predictive modeling',
  'bigData.features.dataAnalytics': 'Big Data Analytics',
  'bigData.features.dataAnalyticsDesc': 'Process and analyze massive datasets in real-time',
  'bigData.features.machineLearning': 'Machine Learning',
  'bigData.features.machineLearningDesc': 'Custom ML models for business intelligence and automation',
  'bigData.features.cloudComputing': 'Cloud Computing',
  'bigData.features.cloudComputingDesc': 'Scalable cloud infrastructure for data processing',
  'bigData.features.predictiveAnalytics': 'Predictive Analytics',
  'bigData.features.predictiveAnalyticsDesc': 'Forecast trends and make data-driven decisions',
  'bigData.features.dataSecurity': 'Data Security',
  'bigData.features.dataSecurityDesc': 'Enterprise-grade security for sensitive information',
  'bigData.capabilities.title': 'Technical Expertise',
  'bigData.capabilities.dataProcessing': 'Data Processing & Engineering',
  'bigData.capabilities.dataProcessingDesc': 'End-to-end data pipeline solutions for processing petabytes of information',
  'bigData.capabilities.aiModels': 'AI Model Development',
  'bigData.capabilities.aiModelsDesc': 'Custom artificial intelligence models tailored to your business needs',
  'bigData.capabilities.naturalLanguage': 'Natural Language Processing',
  'bigData.capabilities.naturalLanguageDesc': 'Advanced NLP for sentiment analysis, chatbots, and document processing',
  'bigData.capabilities.computerVision': 'Computer Vision',
  'bigData.capabilities.computerVisionDesc': 'Image recognition and visual analytics for automated inspection',
  'bigData.useCases.title': 'Industry Solutions',
  'bigData.useCases.fintech': 'Financial Services',
  'bigData.useCases.fintechDesc': 'Risk assessment, fraud detection, and automated trading systems',
  'bigData.useCases.fintechBenefit1': 'Real-time fraud detection',
  'bigData.useCases.fintechBenefit2': 'Credit risk assessment',
  'bigData.useCases.fintechBenefit3': 'Algorithmic trading',
  'bigData.useCases.manufacturing': 'Manufacturing',
  'bigData.useCases.manufacturingDesc': 'Predictive maintenance, quality control, and supply chain optimization',
  'bigData.useCases.manufacturingBenefit1': 'Equipment monitoring',
  'bigData.useCases.manufacturingBenefit2': 'Quality assurance',
  'bigData.useCases.manufacturingBenefit3': 'Process optimization',
  'bigData.useCases.healthcare': 'Healthcare',
  'bigData.useCases.healthcareDesc': 'Patient diagnostics, drug discovery, and personalized treatment plans',
  'bigData.useCases.healthcareBenefit1': 'Medical imaging analysis',
  'bigData.useCases.healthcareBenefit2': 'Patient outcome prediction',
  'bigData.useCases.healthcareBenefit3': 'Drug development acceleration',
  'bigData.stats.title': 'Performance Metrics',
  'bigData.stats.uptime': 'System Uptime',
  'bigData.stats.records': 'Records Processed',
  'bigData.stats.latency': 'Processing Latency',
  'bigData.stats.models': 'AI Models Deployed',
  'bigData.cta.title': 'Ready to Transform Your Data?',
  'bigData.cta.description': "Let's discuss how our Big Data & AI solutions can drive your business forward.",
  'bigData.cta.primary': 'Contact Us',
  'bigData.cta.secondary': 'Learn More',
  'bigData.seo.title': 'Big Data & AI Solutions - KTech Fintech',
  'bigData.seo.description': 'Enterprise-grade big data analytics and artificial intelligence solutions.'
}

vi.mock('../../composables/useLanguage', () => ({
  useLanguage: vi.fn(() => ({
    t: (key: string) => mockTranslations[key] || key
  }))
}))

vi.mock('../../composables/useSkeleton', () => ({
  useSkeleton: vi.fn(() => ({
    isLoading: false
  }))
}))

describe('ServiceBigData Component', () => {
  let wrapper: any

  beforeEach(() => {
    wrapper = mount(ServiceBigData, {
      global: {
        stubs: {
          Transition: true
        }
      }
    })
  })

  describe('Component Rendering', () => {
    it('should render the component', () => {
      expect(wrapper.exists()).toBe(true)
    })

    it('should render main element with correct role', () => {
      const main = wrapper.find('main')
      expect(main.exists()).toBe(true)
      expect(main.attributes('role')).toBe('main')
    })

    it('should render hero section', () => {
      const hero = wrapper.find('.hero-section')
      expect(hero.exists()).toBe(true)
    })

    it('should render hero icon', () => {
      const icon = wrapper.find('.hero-icon')
      expect(icon.exists()).toBe(true)
      expect(icon.text()).toBe('☁️')
    })

    it('should render hero title', () => {
      const title = wrapper.find('#hero-title')
      expect(title.exists()).toBe(true)
      expect(title.text()).toBe('Big Data & AI Solutions')
    })

    it('should render hero subtitle', () => {
      const subtitle = wrapper.find('.hero-subtitle')
      expect(subtitle.exists()).toBe(true)
      expect(subtitle.text()).toBe('Transform Your Business with Intelligent Data Analytics')
    })
  })

  describe('Features Section', () => {
    it('should render features section', () => {
      const featuresSection = wrapper.find('.features-section')
      expect(featuresSection.exists()).toBe(true)
    })

    it('should render section title', () => {
      const title = wrapper.find('#features-title')
      expect(title.exists()).toBe(true)
      expect(title.text()).toBe('Core Capabilities')
    })

    it('should render all 6 feature cards', () => {
      const cards = wrapper.findAll('.feature-card')
      expect(cards).toHaveLength(6)
    })

    it('should render feature with icon, title, and description', () => {
      const firstCard = wrapper.findAll('.feature-card')[0]
      expect(firstCard.find('.feature-icon').exists()).toBe(true)
      expect(firstCard.find('.feature-title').exists()).toBe(true)
      expect(firstCard.find('.feature-description').exists()).toBe(true)
    })

    it('should render correct feature titles', () => {
      const titles = wrapper.findAll('.feature-title').map(el => el.text())
      expect(titles).toContain('Deep Learning & AI')
      expect(titles).toContain('Big Data Analytics')
      expect(titles).toContain('Machine Learning')
    })
  })

  describe('Capabilities Section', () => {
    it('should render capabilities section', () => {
      const capabilitiesSection = wrapper.find('.capabilities-section')
      expect(capabilitiesSection.exists()).toBe(true)
    })

    it('should render capabilities title', () => {
      const title = wrapper.find('#capabilities-title')
      expect(title.exists()).toBe(true)
      expect(title.text()).toBe('Technical Expertise')
    })

    it('should render all 4 capability items', () => {
      const items = wrapper.findAll('.capability-item')
      expect(items).toHaveLength(4)
    })

    it('should render capability with name and description', () => {
      const firstItem = wrapper.findAll('.capability-item')[0]
      expect(firstItem.find('.capability-name').exists()).toBe(true)
      expect(firstItem.find('.capability-description').exists()).toBe(true)
    })

    it('should render technology tags', () => {
      const firstItem = wrapper.findAll('.capability-item')[0]
      const techTags = firstItem.findAll('.tech-tag')
      expect(techTags.length).toBeGreaterThan(0)
    })
  })

  describe('Use Cases Section', () => {
    it('should render use cases section', () => {
      const useCasesSection = wrapper.find('.use-cases-section')
      expect(useCasesSection.exists()).toBe(true)
    })

    it('should render use cases title', () => {
      const title = wrapper.find('#use-cases-title')
      expect(title.exists()).toBe(true)
      expect(title.text()).toBe('Industry Solutions')
    })

    it('should render all 3 use case cards', () => {
      const cards = wrapper.findAll('.use-case-card')
      expect(cards).toHaveLength(3)
    })

    it('should render use case with benefits', () => {
      const firstCard = wrapper.findAll('.use-case-card')[0]
      const benefits = firstCard.findAll('.benefit-item')
      expect(benefits.length).toBe(3)
    })

    it('should render correct use case titles', () => {
      const titles = wrapper.findAll('.use-case-title').map(el => el.text())
      expect(titles).toContain('Financial Services')
      expect(titles).toContain('Manufacturing')
      expect(titles).toContain('Healthcare')
    })
  })

  describe('Statistics Section', () => {
    it('should render stats section', () => {
      const statsSection = wrapper.find('.stats-section')
      expect(statsSection.exists()).toBe(true)
    })

    it('should render all 4 stat items', () => {
      const stats = wrapper.findAll('.stat-item')
      expect(stats).toHaveLength(4)
    })

    it('should render stat with value and label', () => {
      const firstStat = wrapper.findAll('.stat-item')[0]
      expect(firstStat.find('.stat-value').exists()).toBe(true)
      expect(firstStat.find('.stat-label').exists()).toBe(true)
    })

    it('should render correct stat values', () => {
      const values = wrapper.findAll('.stat-value').map(el => el.text())
      expect(values).toContain('99.9%')
      expect(values).toContain('10M+')
      expect(values).toContain('<50ms')
      expect(values).toContain('50+')
    })
  })

  describe('CTA Section', () => {
    it('should render CTA section', () => {
      const ctaSection = wrapper.find('.cta-section')
      expect(ctaSection.exists()).toBe(true)
    })

    it('should render CTA title', () => {
      const title = wrapper.find('#cta-title')
      expect(title.exists()).toBe(true)
      expect(title.text()).toBe('Ready to Transform Your Data?')
    })

    it('should render CTA buttons', () => {
      const buttons = wrapper.findAll('.cta-button')
      expect(buttons).toHaveLength(2)
    })

    it('should render primary button with correct text', () => {
      const primaryButton = wrapper.findAll('.cta-button')[0]
      expect(primaryButton.text()).toBe('Contact Us')
      expect(primaryButton.classes()).toContain('primary')
    })

    it('should render secondary button with correct text', () => {
      const secondaryButton = wrapper.findAll('.cta-button')[1]
      expect(secondaryButton.text()).toBe('Learn More')
      expect(secondaryButton.classes()).toContain('secondary')
    })

    it('should have correct href on contact button', () => {
      const contactButton = wrapper.findAll('.cta-button')[0]
      expect(contactButton.attributes('href')).toBe('/contact')
    })

    it('should have correct href on learn more button', () => {
      const learnMoreButton = wrapper.findAll('.cta-button')[1]
      expect(learnMoreButton.attributes('href')).toBe('/about')
    })
  })

  describe('Accessibility', () => {
    it('should have proper ARIA labels', () => {
      expect(wrapper.find('#hero-title').exists()).toBe(true)
      expect(wrapper.find('#features-title').exists()).toBe(true)
      expect(wrapper.find('#capabilities-title').exists()).toBe(true)
      expect(wrapper.find('#use-cases-title').exists()).toBe(true)
      expect(wrapper.find('#stats-title').exists()).toBe(true)
      expect(wrapper.find('#cta-title').exists()).toBe(true)
    })

    it('should have aria-hidden on decorative icons', () => {
      const heroIcon = wrapper.find('.hero-icon')
      expect(heroIcon.attributes('aria-hidden')).toBe('true')
    })

    it('should have visually-hidden class for screen reader only content', () => {
      const statsTitle = wrapper.find('#stats-title')
      expect(statsTitle.classes()).toContain('visually-hidden')
    })

    it('should have proper semantic HTML structure', () => {
      expect(wrapper.find('main').exists()).toBe(true)
      expect(wrapper.findAll('section').length).toBeGreaterThan(0)
      expect(wrapper.findAll('article').length).toBeGreaterThan(0)
    })
  })

  describe('Data Structure', () => {
    it('should have correct number of features', async () => {
      await wrapper.vm.$nextTick()
      expect(wrapper.vm.features).toHaveLength(6)
    })

    it('should have correct number of capabilities', async () => {
      await wrapper.vm.$nextTick()
      expect(wrapper.vm.capabilities).toHaveLength(4)
    })

    it('should have correct number of use cases', async () => {
      await wrapper.vm.$nextTick()
      expect(wrapper.vm.useCases).toHaveLength(3)
    })

    it('should have correct number of stats', async () => {
      await wrapper.vm.$nextTick()
      expect(wrapper.vm.stats).toHaveLength(4)
    })
  })

  describe('Loading State', () => {
    it('should render skeleton when loading', async () => {
      const { useSkeleton } = await import('../../composables/useSkeleton')
      const mockSkeleton = vi.spyOn(await import('../../composables/useSkeleton'), 'useSkeleton')
      mockSkeleton.mockReturnValue({
        isLoading: true,
        isVisible: false,
        target: null,
        hasLoaded: false
      })

      const loadingWrapper = mount(ServiceBigData, {
        global: {
          stubs: {
            Transition: true
          }
        }
      })

      expect(loadingWrapper.find('.skeleton-container').exists()).toBe(true)
      expect(loadingWrapper.find('.skeleton-hero').exists()).toBe(true)
      expect(loadingWrapper.findAll('.skeleton-card').length).toBe(3)

      mockSkeleton.mockRestore()
    })
  })

  describe('SEO', () => {
    it('should set document title on mount', async () => {
      await flushPromises()
      expect(document.title).toBe('Big Data & AI Solutions - KTech Fintech')
    })
  })
})
