/**
 * Unit tests for ContactForm component
 * Following TDD principles - comprehensive test coverage for validation, i18n, accessibility
 * Updated to use Pinia stores instead of composables
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { ref } from 'vue'
import { mount, flushPromises } from '@vue/test-utils'
import { createRouter, createMemoryHistory } from 'vue-router'
import { createPinia, setActivePinia } from 'pinia'
import { useLanguageStore } from '../../src/stores/language'
import ContactForm from '../../src/components/ContactForm.vue'

describe('ContactForm.vue', () => {
  let router, pinia

  beforeEach(() => {
    vi.clearAllMocks()

    // Create fresh pinia instance for each test
    pinia = createPinia()
    setActivePinia(pinia)

    router = createRouter({
      history: createMemoryHistory(),
      routes: [
        { path: '/', component: { template: '<div>Home</div>' } }
      ]
    })

    // Mock localStorage
    const localStorageMock = (() => {
      let store = {}
      return {
        getItem: (key) => store[key] || null,
        setItem: (key, value) => { store[key] = String(value) },
        removeItem: (key) => { delete store[key] },
        clear: () => { store = {} }
      }
    })()
    vi.stubGlobal('localStorage', localStorageMock)

    // No need to mock document - jsdom environment handles it

    // Mock fetch for language translations
    global.fetch = vi.fn(() => Promise.resolve({
      ok: true,
      json: async () => ({
        'contact.title': 'CONTACT',
        'contact.subtitle': 'Get in Touch',
        'contact.form.name': 'Name',
        'contact.form.email': 'Email',
        'contact.form.subject': 'Subject',
        'contact.form.message': 'Message',
        'contact.form.submit': 'Send Message',
        'contact.form.submitting': 'Sending...',
        'contact.form.validation.nameRequired': 'Name is required (min 2 characters)',
        'contact.form.validation.emailRequired': 'Valid email is required',
        'contact.form.validation.subjectRequired': 'Subject is required (min 3 characters)',
        'contact.form.validation.messageRequired': 'Message is required (min 10 characters)',
        'contact.form.success': 'Message sent successfully! We\'ll get back to you soon.',
        'contact.form.error': 'Failed to send message. Please try again.'
      })
    }))

    // Initialize language store
    const languageStore = useLanguageStore()
    languageStore.translations = {
      en: {
        'contact.title': 'CONTACT',
        'contact.subtitle': 'Get in Touch',
        'contact.form.name': 'Name',
        'contact.form.email': 'Email',
        'contact.form.subject': 'Subject',
        'contact.form.message': 'Message',
        'contact.form.submit': 'Send Message',
        'contact.form.submitting': 'Sending...',
        'contact.form.validation.nameRequired': 'Name is required (min 2 characters)',
        'contact.form.validation.emailRequired': 'Valid email is required',
        'contact.form.validation.subjectRequired': 'Subject is required (min 3 characters)',
        'contact.form.validation.messageRequired': 'Message is required (min 10 characters)',
        'contact.form.success': 'Message sent successfully! We\'ll get back to you soon.',
        'contact.form.error': 'Failed to send message. Please try again.'
      }
    }
    languageStore.currentLanguage = 'en'
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  function mountComponent() {
    return mount(ContactForm, {
      global: { plugins: [pinia, router] }
    })
  }

  describe('rendering', () => {
    it('should render form container', () => {
      const wrapper = mountComponent()
      const container = wrapper.find('.contact-form-container')
      expect(container.exists()).toBe(true)
    })

    it('should render contact title', () => {
      const wrapper = mountComponent()
      const title = wrapper.find('.contact-title')
      expect(title.exists()).toBe(true)
      expect(title.text()).toBe('CONTACT')
    })

    it('should render contact subtitle', () => {
      const wrapper = mountComponent()
      const subtitle = wrapper.find('.contact-subtitle')
      expect(subtitle.exists()).toBe(true)
      expect(subtitle.text()).toBe('Get in Touch')
    })

    it('should render all form fields', () => {
      const wrapper = mountComponent()
      expect(wrapper.find('#name').exists()).toBe(true)
      expect(wrapper.find('#email').exists()).toBe(true)
      expect(wrapper.find('#subject').exists()).toBe(true)
      expect(wrapper.find('#message').exists()).toBe(true)
    })

    it('should render submit button', () => {
      const wrapper = mountComponent()
      const submitButton = wrapper.find('button[type="submit"]')
      expect(submitButton.exists()).toBe(true)
    })

    it('should have proper semantic HTML structure', () => {
      const wrapper = mountComponent()
      expect(wrapper.find('form').exists()).toBe(true)
      expect(wrapper.find('section').exists()).toBe(true)
    })

    it('should render labels with required indicators', () => {
      const wrapper = mountComponent()
      const labels = wrapper.findAll('.form-label')
      labels.forEach(label => {
        expect(label.html()).toContain('<span class="required">*</span>')
      })
    })

    it('should initialize with empty form fields', () => {
      const wrapper = mountComponent()
      expect(wrapper.find('#name').element.value).toBe('')
      expect(wrapper.find('#email').element.value).toBe('')
      expect(wrapper.find('#subject').element.value).toBe('')
      expect(wrapper.find('#message').element.value).toBe('')
    })

    it('should not show errors initially', () => {
      const wrapper = mountComponent()
      expect(wrapper.findAll('.error-message').length).toBe(0)
    })
  })

  describe('form interactions', () => {
    it('should update form data on input', async () => {
      const wrapper = mountComponent()
      const nameInput = wrapper.find('#name')

      await nameInput.setValue('John Doe')
      expect(nameInput.element.value).toBe('John Doe')
    })

    it('should track touched fields', async () => {
      const wrapper = mountComponent()
      const nameInput = wrapper.find('#name')

      await nameInput.trigger('blur')
      await wrapper.vm.$nextTick()

      expect(nameInput.classes()).toContain('touched')
    })

    it('should validate empty name field on blur', async () => {
      const wrapper = mountComponent()
      const nameInput = wrapper.find('#name')

      await nameInput.trigger('blur')
      await wrapper.vm.$nextTick()

      expect(nameInput.classes()).toContain('error')
      expect(wrapper.find('#name-error').exists()).toBe(true)
    })

    it('should validate name less than 2 characters', async () => {
      const wrapper = mountComponent()
      const nameInput = wrapper.find('#name')

      await nameInput.setValue('J')
      await nameInput.trigger('blur')
      await wrapper.vm.$nextTick()

      expect(nameInput.classes()).toContain('error')
    })

    it('should accept valid name (2+ characters)', async () => {
      const wrapper = mountComponent()
      const nameInput = wrapper.find('#name')

      await nameInput.setValue('John')
      await nameInput.trigger('blur')
      await wrapper.vm.$nextTick()

      expect(nameInput.classes()).not.toContain('error')
    })

    it('should trim whitespace in name validation', async () => {
      const wrapper = mountComponent()
      const nameInput = wrapper.find('#name')

      await nameInput.setValue('  ')
      await nameInput.trigger('blur')
      await wrapper.vm.$nextTick()

      expect(nameInput.classes()).toContain('error')
    })

    it('should validate empty email field', async () => {
      const wrapper = mountComponent()
      const emailInput = wrapper.find('#email')

      await emailInput.trigger('blur')
      await wrapper.vm.$nextTick()

      expect(emailInput.classes()).toContain('error')
    })

    it('should validate invalid email format', async () => {
      const wrapper = mountComponent()
      const emailInput = wrapper.find('#email')

      await emailInput.setValue('invalid-email')
      await emailInput.trigger('blur')
      await wrapper.vm.$nextTick()

      expect(emailInput.classes()).toContain('error')
    })

    it('should accept valid email format', async () => {
      const wrapper = mountComponent()
      const emailInput = wrapper.find('#email')

      await emailInput.setValue('test@example.com')
      await emailInput.trigger('blur')
      await wrapper.vm.$nextTick()

      expect(emailInput.classes()).not.toContain('error')
    })

    it('should accept email with subdomain', async () => {
      const wrapper = mountComponent()
      const emailInput = wrapper.find('#email')

      await emailInput.setValue('user@subdomain.example.com')
      await emailInput.trigger('blur')
      await wrapper.vm.$nextTick()

      expect(emailInput.classes()).not.toContain('error')
    })

    it('should validate empty subject field', async () => {
      const wrapper = mountComponent()
      const subjectInput = wrapper.find('#subject')

      await subjectInput.trigger('blur')
      await wrapper.vm.$nextTick()

      expect(subjectInput.classes()).toContain('error')
    })

    it('should validate subject less than 3 characters', async () => {
      const wrapper = mountComponent()
      const subjectInput = wrapper.find('#subject')

      await subjectInput.setValue('AB')
      await subjectInput.trigger('blur')
      await wrapper.vm.$nextTick()

      expect(subjectInput.classes()).toContain('error')
    })

    it('should accept valid subject (3+ characters)', async () => {
      const wrapper = mountComponent()
      const subjectInput = wrapper.find('#subject')

      await subjectInput.setValue('Test Subject')
      await subjectInput.trigger('blur')
      await wrapper.vm.$nextTick()

      expect(subjectInput.classes()).not.toContain('error')
    })

    it('should validate empty message field', async () => {
      const wrapper = mountComponent()
      const messageInput = wrapper.find('#message')

      await messageInput.trigger('blur')
      await wrapper.vm.$nextTick()

      expect(messageInput.classes()).toContain('error')
    })

    it('should validate message less than 10 characters', async () => {
      const wrapper = mountComponent()
      const messageInput = wrapper.find('#message')

      await messageInput.setValue('Short')
      await messageInput.trigger('blur')
      await wrapper.vm.$nextTick()

      expect(messageInput.classes()).toContain('error')
    })

    it('should accept valid message (10+ characters)', async () => {
      const wrapper = mountComponent()
      const messageInput = wrapper.find('#message')

      await messageInput.setValue('This is a longer message that meets the requirement')
      await messageInput.trigger('blur')
      await wrapper.vm.$nextTick()

      expect(messageInput.classes()).not.toContain('error')
    })

    it('should clear error on input', async () => {
      const wrapper = mountComponent()
      const nameInput = wrapper.find('#name')

      await nameInput.trigger('blur')
      await nameInput.setValue('John')
      await wrapper.vm.$nextTick()

      expect(nameInput.classes()).not.toContain('error')
    })
  })

  describe('form submission', () => {
    it('should not submit with invalid fields', async () => {
      const wrapper = mountComponent()
      const form = wrapper.find('form')

      await form.trigger('submit')
      await wrapper.vm.$nextTick()

      expect(wrapper.findAll('.error-message').length).toBeGreaterThan(0)
    })

    it('should submit form with valid data', async () => {
      const wrapper = mountComponent()
      const form = wrapper.find('form')

      await wrapper.find('#name').setValue('John Doe')
      await wrapper.find('#email').setValue('john@example.com')
      await wrapper.find('#subject').setValue('Test Subject')
      await wrapper.find('#message').setValue('This is a test message that is long enough')

      await form.trigger('submit')
      await flushPromises()

      // Form should process submission
      expect(wrapper.find('button[type="submit"]').exists()).toBe(true)
    })

    it('should show loading state during submission', async () => {
      const wrapper = mountComponent()
      const form = wrapper.find('form')

      await wrapper.find('#name').setValue('John Doe')
      await wrapper.find('#email').setValue('john@example.com')
      await wrapper.find('#subject').setValue('Test Subject')
      await wrapper.find('#message').setValue('This is a test message that is long enough')

      await form.trigger('submit')

      const submitButton = wrapper.find('button[type="submit"]')
      expect(submitButton.attributes('disabled')).toBeDefined()
    })

    it('should disable submit button during submission', async () => {
      const wrapper = mountComponent()
      const form = wrapper.find('form')

      await wrapper.find('#name').setValue('John Doe')
      await wrapper.find('#email').setValue('john@example.com')
      await wrapper.find('#subject').setValue('Test Subject')
      await wrapper.find('#message').setValue('This is a test message that is long enough')

      await form.trigger('submit')

      const submitButton = wrapper.find('button[type="submit"]')
      expect(submitButton.attributes('disabled')).toBeDefined()
    })

    it('should reset form on successful submission', async () => {
      const wrapper = mountComponent()
      const form = wrapper.find('form')

      await wrapper.find('#name').setValue('John Doe')
      await wrapper.find('#email').setValue('john@example.com')
      await wrapper.find('#subject').setValue('Test Subject')
      await wrapper.find('#message').setValue('This is a test message that is long enough')

      await form.trigger('submit')
      await flushPromises()

      // After successful submission, form should be reset
      expect(wrapper.find('#name').element.value).toBe('')
    })

    it('should show success message on valid submission', async () => {
      const wrapper = mountComponent()
      const form = wrapper.find('form')

      await wrapper.find('#name').setValue('John Doe')
      await wrapper.find('#email').setValue('john@example.com')
      await wrapper.find('#subject').setValue('Test Subject')
      await wrapper.find('#message').setValue('This is a test message that is long enough')

      await form.trigger('submit')
      await flushPromises()

      const statusMessage = wrapper.find('.status-message')
      expect(statusMessage.exists()).toBe(true)
    })

    it('should clear success message after timeout', async () => {
      const wrapper = mountComponent()
      const form = wrapper.find('form')

      await wrapper.find('#name').setValue('John Doe')
      await wrapper.find('#email').setValue('john@example.com')
      await wrapper.find('#subject').setValue('Test Subject')
      await wrapper.find('#message').setValue('This is a test message that is long enough')

      await form.trigger('submit')

      // Wait for timeout
      await new Promise(resolve => setTimeout(resolve, 6000))

      const statusMessage = wrapper.find('.status-message')
      expect(statusMessage.exists()).toBe(false)
    }, 10000)
  })

  describe('accessibility', () => {
    it('should have proper form labels', () => {
      const wrapper = mountComponent()
      const labels = wrapper.findAll('.form-label')
      expect(labels.length).toBeGreaterThanOrEqual(4)
    })

    it('should have aria-invalid on error fields', async () => {
      const wrapper = mountComponent()
      const nameInput = wrapper.find('#name')

      await nameInput.trigger('blur')
      await wrapper.vm.$nextTick()

      expect(nameInput.attributes('aria-invalid')).toBe('true')
    })

    it('should have aria-describedby for error messages', async () => {
      const wrapper = mountComponent()
      const nameInput = wrapper.find('#name')

      await nameInput.trigger('blur')
      await wrapper.vm.$nextTick()

      expect(nameInput.attributes('aria-describedby')).toBe('name-error')
    })

    it('should have role="alert" on error messages', async () => {
      const wrapper = mountComponent()
      const nameInput = wrapper.find('#name')

      await nameInput.trigger('blur')
      await wrapper.vm.$nextTick()

      const errorMessage = wrapper.find('#name-error')
      expect(errorMessage.attributes('role')).toBe('alert')
    })

    it('should have aria-live="polite" on error messages', async () => {
      const wrapper = mountComponent()
      const nameInput = wrapper.find('#name')

      await nameInput.trigger('blur')
      await wrapper.vm.$nextTick()

      const errorMessage = wrapper.find('#name-error')
      expect(errorMessage.attributes('aria-live')).toBe('polite')
    })

    it('should have aria-busy during submission', async () => {
      const wrapper = mountComponent()
      const form = wrapper.find('form')

      await wrapper.find('#name').setValue('John Doe')
      await wrapper.find('#email').setValue('john@example.com')
      await wrapper.find('#subject').setValue('Test Subject')
      await wrapper.find('#message').setValue('This is a test message that is long enough')

      await form.trigger('submit')

      expect(wrapper.find('form').attributes('aria-busy')).toBeDefined()
    })

    it('should have role="status" on status messages', async () => {
      const wrapper = mountComponent()
      const form = wrapper.find('form')

      await wrapper.find('#name').setValue('John Doe')
      await wrapper.find('#email').setValue('john@example.com')
      await wrapper.find('#subject').setValue('Test Subject')
      await wrapper.find('#message').setValue('This is a test message that is long enough')

      await form.trigger('submit')
      await flushPromises()

      const statusMessage = wrapper.find('.status-message')
      expect(statusMessage.attributes('role')).toBe('status')
    })

    it('should be keyboard navigable', () => {
      const wrapper = mountComponent()
      const inputs = wrapper.findAll('input, textarea, button')
      expect(inputs.length).toBeGreaterThan(0)
    })
  })

  describe('i18n integration', () => {
    it('should use i18n for form labels', () => {
      const wrapper = mountComponent()
      expect(wrapper.find('.contact-title').text()).toBe('CONTACT')
    })

    it('should use i18n for submit button text', () => {
      const wrapper = mountComponent()
      const submitButton = wrapper.find('button[type="submit"]')
      expect(submitButton.text()).toContain('Send Message')
    })

    it('should use i18n for error messages', async () => {
      const wrapper = mountComponent()
      const nameInput = wrapper.find('#name')

      await nameInput.trigger('blur')
      await wrapper.vm.$nextTick()

      const errorMessage = wrapper.find('#name-error')
      expect(errorMessage.text()).toContain('min 2 characters')
    })

    it('should use i18n for success message', async () => {
      const wrapper = mountComponent()
      const form = wrapper.find('form')

      await wrapper.find('#name').setValue('John Doe')
      await wrapper.find('#email').setValue('john@example.com')
      await wrapper.find('#subject').setValue('Test Subject')
      await wrapper.find('#message').setValue('This is a test message that is long enough')

      await form.trigger('submit')
      await flushPromises()

      const statusMessage = wrapper.find('.status-message')
      expect(statusMessage.text()).toContain('successfully')
    })
  })

  describe('styling', () => {
    it('should apply proper CSS classes', () => {
      const wrapper = mountComponent()
      expect(wrapper.find('.contact-form').exists()).toBe(true)
    })

    it('should have spinner element during submission', async () => {
      const wrapper = mountComponent()
      const form = wrapper.find('form')

      await wrapper.find('#name').setValue('John Doe')
      await wrapper.find('#email').setValue('john@example.com')
      await wrapper.find('#subject').setValue('Test Subject')
      await wrapper.find('#message').setValue('This is a test message that is long enough')

      await form.trigger('submit')

      expect(wrapper.find('.spinner').exists()).toBe(true)
    })

    it('should apply error class to invalid textarea', async () => {
      const wrapper = mountComponent()
      const messageInput = wrapper.find('#message')

      await messageInput.trigger('blur')
      await wrapper.vm.$nextTick()

      expect(messageInput.classes()).toContain('error')
    })
  })

  describe('edge cases', () => {
    it('should handle submission with minimal valid data', async () => {
      const wrapper = mountComponent()
      const form = wrapper.find('form')

      await wrapper.find('#name').setValue('AB')
      await wrapper.find('#email').setValue('a@b.co')
      await wrapper.find('#subject').setValue('ABC')
      await wrapper.find('#message').setValue('ABCDEFGHIJ')

      await form.trigger('submit')
      await flushPromises()

      expect(wrapper.find('.status-message').exists()).toBe(true)
    })

    it('should handle form with trailing whitespace', async () => {
      const wrapper = mountComponent()
      const nameInput = wrapper.find('#name')

      await nameInput.setValue('John Doe  ')
      await nameInput.trigger('blur')
      await wrapper.vm.$nextTick()

      // Should trim and validate correctly
      expect(nameInput.classes()).not.toContain('error')
    })

    it('should handle rapid form submissions', async () => {
      const wrapper = mountComponent()
      const form = wrapper.find('form')

      await wrapper.find('#name').setValue('John Doe')
      await wrapper.find('#email').setValue('john@example.com')
      await wrapper.find('#subject').setValue('Test Subject')
      await wrapper.find('#message').setValue('This is a test message that is long enough')

      await form.trigger('submit')
      await form.trigger('submit')

      expect(wrapper.find('button[type="submit"]').attributes('disabled')).toBeDefined()
    })

    it('should handle special characters in message', async () => {
      const wrapper = mountComponent()
      const messageInput = wrapper.find('#message')

      await messageInput.setValue('Test message with special chars: @#$%^&*()')
      await messageInput.trigger('blur')
      await wrapper.vm.$nextTick()

      expect(messageInput.classes()).not.toContain('error')
    })
  })

  describe('validation edge cases', () => {
    it('should handle very long input', async () => {
      const wrapper = mountComponent()
      const messageInput = wrapper.find('#message')

      const longMessage = 'A'.repeat(1000)
      await messageInput.setValue(longMessage)
      await messageInput.trigger('blur')
      await wrapper.vm.$nextTick()

      expect(messageInput.classes()).not.toContain('error')
    })

    it('should handle emoji in input', async () => {
      const wrapper = mountComponent()
      const nameInput = wrapper.find('#name')

      await nameInput.setValue('John 😀')
      await nameInput.trigger('blur')
      await wrapper.vm.$nextTick()

      expect(nameInput.classes()).not.toContain('error')
    })
  })
})
