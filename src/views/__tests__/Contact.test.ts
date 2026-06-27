/**
 * @file Contact.test.ts
 * @description Unit tests for the Contact view (#13 - FEAT-004 form validation)
 *
 * Tests drive the REAL DOM (setValue / trigger) and assert user-visible
 * effects (rendered error text, aria attributes, submit banner) — never
 * vm.formData. Each acceptance criterion has a test that would fail if the
 * feature were missing:
 *   - All required fields incl. subject dropdown + message textarea (#13 §1)
 *   - Validation on blur, errors clear when valid (#13 §2)
 *   - Lenient phone regex (separators, the company number) (#13 §1)
 *   - Email format, name min-length, message min/max length (#13 §1)
 *   - Submit blocked while invalid; success resets the form (#13 §3)
 *   - Accessible errors (aria-invalid / aria-describedby / role=alert) (#13 §5)
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mount, VueWrapper, flushPromises } from '@vue/test-utils'
import Contact from '../Contact.vue'

/**
 * Deterministic i18n mock. Mirrors the contact.* keys so tests can assert on
 * real translated strings instead of raw keys (JoinUs/News test style).
 */
const dictionary: Record<string, string> = {
  'contact.title': 'Contact',
  'contact.titleAccent': 'Us',
  'contact.subtitle': 'Reach out',
  'contact.breadcrumb': 'Home / Contact',
  'contact.form.title': 'Send Us a Message',
  'contact.form.name': 'Name',
  'contact.form.namePlaceholder': 'Your full name',
  'contact.form.phone': 'Phone',
  'contact.form.phonePlaceholder': 'Your phone number',
  'contact.form.company': 'Company',
  'contact.form.companyPlaceholder': 'Your company name',
  'contact.form.email': 'Email',
  'contact.form.emailPlaceholder': 'you@example.com',
  'contact.form.subject': 'Subject',
  'contact.form.subjectPlaceholder': 'Select a subject',
  'contact.form.subjectGeneral': 'General Inquiry',
  'contact.form.subjectPartnership': 'Partnership',
  'contact.form.subjectSupport': 'Support',
  'contact.form.subjectOther': 'Other',
  'contact.form.message': 'Message',
  'contact.form.messagePlaceholder': 'Tell us about your project',
  'contact.form.privacy': 'I agree to the privacy policy',
  'contact.form.submit': 'Submit',
  'contact.form.submitting': 'Submitting...',
  'contact.form.success': 'Thank you!',
  'contact.form.error': 'Please fix the errors above.',
  'contact.form.validation.nameRequired': 'Name is required.',
  'contact.form.validation.nameTooShort': 'Name must be at least 2 characters.',
  'contact.form.validation.phoneRequired': 'Phone is required.',
  'contact.form.validation.phoneInvalid': 'Enter a valid phone number.',
  'contact.form.validation.companyRequired': 'Company is required.',
  'contact.form.validation.emailRequired': 'Email is required.',
  'contact.form.validation.emailInvalid': 'Please enter a valid email address.',
  'contact.form.validation.subjectRequired': 'Please select a subject.',
  'contact.form.validation.messageRequired': 'Message is required.',
  'contact.form.validation.messageTooShort': 'Message must be at least 10 characters.',
  'contact.form.validation.messageTooLong': 'Message must be 1000 characters or fewer.',
  'contact.form.validation.privacyRequired': 'You must agree to the privacy policy.',
  'contact.info.title': 'Company Information',
  'contact.info.address': 'Address',
  'contact.info.addressValue': 'Shenzhen',
  'contact.info.email': 'Email',
  'contact.info.emailValue': 'contact@ktech.fintech',
  'contact.info.phone': 'Phone',
  'contact.info.phoneValue': '+86 755 0000 0000',
  'contact.info.wechat': 'WeChat',
  'contact.info.wechatValue': 'ktech-official',
  'contact.info.social': 'Follow Us',
  'contact.demo.title': 'Request a Demo',
  'contact.demo.description': 'See our platform.',
  'contact.demo.consultant': 'Consultation',
  'contact.demo.solution': 'Solution',
  'contact.demo.consulting': 'Consulting',
  'contact.demo.button': 'Request Demo',
}

vi.mock('../../composables/useLanguage', () => ({
  useLanguage: () => ({
    t: (key: string) => dictionary[key] ?? key,
  }),
}))

// A complete, valid payload. Tests start from this and mutate ONE field to
// exercise a specific rule, driving the value through the real input.
const validInput = {
  name: 'Alice Zhang',
  phone: '+86 755 0000 0000',
  company: 'KTech',
  email: 'alice@example.com',
  subject: 'general',
  message: 'I would like a demo of your platform please.',
  privacy: true,
}

describe('Contact.vue (FEAT-004 form validation)', () => {
  let wrapper: VueWrapper

  beforeEach(() => {
    vi.useFakeTimers()
    wrapper = mount(Contact)
  })

  afterEach(() => {
    wrapper.unmount()
    vi.useRealTimers()
  })

  // Helper: fill every field with a valid value via the real DOM, then leave
  // ONE field for the test to override. Driving setValue keeps the test honest
  // — if the template wiring (v-model / @blur) breaks, the test fails.
  const fillValidExcept = async (exclude: string[] = []) => {
    const set = async (selector: string, value: any) => {
      const el = wrapper.find(selector)
      await el.setValue(value)
    }
    if (!exclude.includes('name')) await set('#name', validInput.name)
    if (!exclude.includes('phone')) await set('#phone', validInput.phone)
    if (!exclude.includes('company')) await set('#company', validInput.company)
    if (!exclude.includes('email')) await set('#email', validInput.email)
    if (!exclude.includes('subject')) await set('#subject', validInput.subject)
    if (!exclude.includes('message')) await set('#message', validInput.message)
    if (!exclude.includes('privacy')) {
      await wrapper.find('#privacy').setValue(true)
    }
    await flushPromises()
  }

  // ============================================
  // Structure
  // ============================================
  describe('Structure', () => {
    it('mounts and renders the form', () => {
      expect(wrapper.find('form.contact-form').exists()).toBe(true)
    })

    it('renders all required inputs with associated labels', () => {
      for (const id of ['name', 'phone', 'company', 'email', 'subject', 'message', 'privacy']) {
        const input = wrapper.find(`#${id}`)
        expect(input.exists(), `input #${id} should exist`).toBe(true)
        const label = wrapper.find(`label[for="${id}"]`)
        expect(label.exists(), `label for ${id} should exist`).toBe(true)
      }
    })

    it('renders the subject dropdown with exactly the four required options', () => {
      const options = wrapper.find('#subject').findAll('option')
      // First is the disabled placeholder; the next four are the AC options.
      const values = options.map((o) => o.attributes('value'))
      expect(values).toEqual(['', 'general', 'partnership', 'support', 'other'])
      expect(options[1].text()).toBe('General Inquiry')
      expect(options[2].text()).toBe('Partnership')
      expect(options[3].text()).toBe('Support')
      expect(options[4].text()).toBe('Other')
    })

    it('renders the message textarea with min 10 / max 1000 length bounds', () => {
      const msg = wrapper.find('#message')
      expect(msg.element.tagName.toLowerCase()).toBe('textarea')
      expect(msg.attributes('minlength')).toBe('10')
      expect(msg.attributes('maxlength')).toBe('1000')
    })
  })

  // ============================================
  // Required-field validation (on submit)
  // ============================================
  describe('Required fields (submit)', () => {
    it('flags empty name as required with an accessible error', async () => {
      await wrapper.find('form').trigger('submit.prevent')
      await flushPromises()

      const nameInput = wrapper.find('#name')
      expect(nameInput.attributes('aria-invalid')).toBe('true')
      expect(nameInput.attributes('aria-describedby')).toBe('name-error')
      const error = wrapper.find('#name-error')
      expect(error.exists()).toBe(true)
      expect(error.attributes('role')).toBe('alert')
      expect(error.text()).toBe('Name is required.')
    })

    it('flags empty phone, company, email, subject, message as required on submit', async () => {
      await wrapper.find('form').trigger('submit.prevent')
      await flushPromises()

      expect(wrapper.find('#phone-error').text()).toBe('Phone is required.')
      expect(wrapper.find('#company-error').text()).toBe('Company is required.')
      expect(wrapper.find('#email-error').text()).toBe('Email is required.')
      expect(wrapper.find('#subject-error').text()).toBe('Please select a subject.')
      expect(wrapper.find('#message-error').text()).toBe('Message is required.')
    })

    it('flags the privacy checkbox as required when unchecked', async () => {
      await wrapper.find('form').trigger('submit.prevent')
      await flushPromises()

      const error = wrapper.find('#privacy-error')
      expect(error.exists()).toBe(true)
      expect(error.text()).toBe('You must agree to the privacy policy.')
    })
  })

  // ============================================
  // Validation on blur (issue #13 AC §2)
  // ============================================
  describe('Blur validation', () => {
    it('validates a single field on blur and shows its error', async () => {
      // Type then blur an empty name (no submit).
      await wrapper.find('#name').setValue('')
      await wrapper.find('#name').trigger('blur')
      await flushPromises()

      expect(wrapper.find('#name-error').text()).toBe('Name is required.')
      expect(wrapper.find('#name').attributes('aria-invalid')).toBe('true')
    })

    it('clears the field error on blur once the field becomes valid', async () => {
      await wrapper.find('#name').setValue('')
      await wrapper.find('#name').trigger('blur')
      await flushPromises()
      expect(wrapper.find('#name-error').exists()).toBe(true)

      // Fix it and blur again.
      await wrapper.find('#name').setValue('Alice')
      await wrapper.find('#name').trigger('blur')
      await flushPromises()

      expect(wrapper.find('#name-error').exists()).toBe(false)
      expect(wrapper.find('#name').attributes('aria-invalid')).toBe('false')
    })

    it('shows the email-format error on blur of an invalid email', async () => {
      await wrapper.find('#email').setValue('not-an-email')
      await wrapper.find('#email').trigger('blur')
      await flushPromises()

      expect(wrapper.find('#email-error').text()).toBe(
        'Please enter a valid email address.',
      )
    })

    it('shows the message-too-short error on blur', async () => {
      await wrapper.find('#message').setValue('short')
      await wrapper.find('#message').trigger('blur')
      await flushPromises()

      expect(wrapper.find('#message-error').text()).toBe(
        'Message must be at least 10 characters.',
      )
    })
  })

  // ============================================
  // Field-specific rules
  // ============================================
  describe('Field-specific rules', () => {
    it('rejects a one-character name as too short', async () => {
      await fillValidExcept(['name'])
      await wrapper.find('#name').setValue('A')
      await wrapper.find('form').trigger('submit.prevent')
      await flushPromises()

      expect(wrapper.find('#name-error').text()).toBe(
        'Name must be at least 2 characters.',
      )
    })

    it('rejects an invalid email format', async () => {
      await fillValidExcept(['email'])
      await wrapper.find('#email').setValue('not-an-email')
      await wrapper.find('form').trigger('submit.prevent')
      await flushPromises()

      expect(wrapper.find('#email-error').text()).toBe(
        'Please enter a valid email address.',
      )
      const emailInput = wrapper.find('#email')
      expect(emailInput.attributes('aria-invalid')).toBe('true')
      expect(emailInput.attributes('aria-describedby')).toBe('email-error')
    })

    it('rejects a subject that is still on the placeholder option', async () => {
      await fillValidExcept(['subject'])
      // Leave subject on "" (the disabled placeholder).
      await wrapper.find('form').trigger('submit.prevent')
      await flushPromises()

      expect(wrapper.find('#subject-error').text()).toBe(
        'Please select a subject.',
      )
    })

    it('rejects a message shorter than 10 characters', async () => {
      await fillValidExcept(['message'])
      await wrapper.find('#message').setValue('too short')
      await wrapper.find('form').trigger('submit.prevent')
      await flushPromises()

      expect(wrapper.find('#message-error').text()).toBe(
        'Message must be at least 10 characters.',
      )
    })
  })

  // ============================================
  // Phone regex — lenient, accepts separators (#13 §1)
  // ============================================
  describe('Phone validation (lenient regex)', () => {
    const cases: Array<[string, string]> = [
      ['the company number with spaces', '+86 755 0000 0000'],
      ['US-style with parentheses + hyphens', '(415) 555-1212'],
      ['hyphen-separated', '0044-20-7946-0958'],
      ['plain digits', '13800138000'],
      ['leading plus, no spaces', '+867550000000'],
    ]

    for (const [label, phone] of cases) {
      it(`accepts ${label}: "${phone}"`, async () => {
        await fillValidExcept(['phone'])
        await wrapper.find('#phone').setValue(phone)
        await wrapper.find('form').trigger('submit.prevent')
        await flushPromises()

        expect(wrapper.find('#phone-error').exists(), `phone "${phone}" should be valid`).toBe(false)
      })
    }

    it('rejects a phone with letters', async () => {
      await fillValidExcept(['phone'])
      await wrapper.find('#phone').setValue('123abc')
      await wrapper.find('form').trigger('submit.prevent')
      await flushPromises()

      expect(wrapper.find('#phone-error').text()).toBe('Enter a valid phone number.')
    })

    it('rejects a phone that is too short (< 7 chars)', async () => {
      await fillValidExcept(['phone'])
      await wrapper.find('#phone').setValue('123')
      await wrapper.find('form').trigger('submit.prevent')
      await flushPromises()

      expect(wrapper.find('#phone-error').exists()).toBe(true)
    })
  })

  // ============================================
  // Submit blocking + success
  // ============================================
  describe('Submission', () => {
    it('does not show a success message when the form is invalid', async () => {
      await wrapper.find('form').trigger('submit.prevent')
      await flushPromises()

      const messages = wrapper.findAll('.submit-message')
      expect(messages.length).toBe(1)
      expect(messages[0].classes()).toContain('error')
      expect((wrapper.vm as any).submitStatus.type).toBe('error')
    })

    it('submits successfully when valid and resets the form', async () => {
      await fillValidExcept()
      await wrapper.find('form').trigger('submit.prevent')
      await flushPromises()

      // Loading state engaged.
      expect((wrapper.vm as any).isSubmitting).toBe(true)
      expect(wrapper.find('button[type="submit"]').attributes('disabled')).toBeDefined()

      // Resolve the mock API timer.
      vi.advanceTimersByTime(2000)
      await flushPromises()

      expect((wrapper.vm as any).submitStatus.type).toBe('success')
      // Form reset (every field back to empty / unchecked).
      const vm = wrapper.vm as any
      expect(vm.formData.name).toBe('')
      expect(vm.formData.email).toBe('')
      expect(vm.formData.subject).toBe('')
      expect(vm.formData.message).toBe('')
      expect(vm.formData.privacy).toBe(false)
    })

    it('clears field errors before re-validating on each submit', async () => {
      await wrapper.find('form').trigger('submit.prevent')
      await flushPromises()
      expect(wrapper.find('#name-error').exists()).toBe(true)

      // Fix every field and resubmit.
      await fillValidExcept()
      await wrapper.find('form').trigger('submit.prevent')
      await flushPromises()

      expect(wrapper.find('#name-error').exists()).toBe(false)
    })
  })
})
