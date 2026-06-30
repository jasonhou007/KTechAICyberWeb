/**
 * @file Contact-branches.test.ts
 * @description Branch-coverage tests for Contact.vue (#246 review)
 *
 * The Contact form's copy was corrected in ticket #246 (email, phone,
 * address values). This file targets the form's validation branches that
 * the main Contact.test.ts suite does not yet drive, so the local coverage
 * threshold is met deterministically:
 *
 *   - Blur the phone field with an invalid value (line 63 blur handler +
 *     the phone-invalid render branch reached via blur, not just submit).
 *   - Blur the company field while empty (line 89 blur handler).
 *   - Blur the subject field while on the placeholder (line 137 blur
 *     handler).
 *   - Submit a message longer than the 1000-char cap (the message-tooLong
 *     rule at line 374 + its render branch at line 174).
 *
 * These are real user paths through the SAME form whose copy #246 fixed,
 * not no-ops: each test drives the real DOM (setValue / trigger('blur') /
 * trigger('submit.prevent')) and asserts a user-visible error string.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mount, VueWrapper, flushPromises } from '@vue/test-utils'
import Contact from '../Contact.vue'

// Mirrors the contact.* keys so assertions see real translated copy.
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
  'contact.info.addressValue': '12F, Runhong Building T2, No. 75 Meiyuan Road, Shenzhen, China',
  'contact.info.email': 'Email',
  'contact.info.emailValue': 'KTECH@kaitaitech.cn',
  'contact.info.phone': 'Phone',
  'contact.info.phoneValue': '+86 755 36878020',
  'contact.info.wechat': 'WeChat',
  'contact.info.wechatValue': 'KTech Official WeChat',
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

const validInput = {
  name: 'Alice Zhang',
  phone: '+86 755 0000 0000',
  company: 'KTech',
  email: 'alice@example.com',
  subject: 'general',
  message: 'I would like a demo of your platform please.',
  privacy: true,
}

describe('Contact.vue branch coverage (#246)', () => {
  let wrapper: VueWrapper

  beforeEach(() => {
    vi.useFakeTimers()
    wrapper = mount(Contact)
  })

  afterEach(() => {
    wrapper.unmount()
    vi.useRealTimers()
  })

  // Fill every field with a valid value via the real DOM, optionally leaving
  // named fields for the test to override.
  const fillValidExcept = async (exclude: string[] = []) => {
    const set = async (selector: string, value: any) => {
      await wrapper.find(selector).setValue(value)
    }
    if (!exclude.includes('name')) await set('#name', validInput.name)
    if (!exclude.includes('phone')) await set('#phone', validInput.phone)
    if (!exclude.includes('company')) await set('#company', validInput.company)
    if (!exclude.includes('email')) await set('#email', validInput.email)
    if (!exclude.includes('subject')) await set('#subject', validInput.subject)
    if (!exclude.includes('message')) await set('#message', validInput.message)
    if (!exclude.includes('privacy')) await wrapper.find('#privacy').setValue(true)
    await flushPromises()
  }

  // ============================================
  // Blur handlers not yet driven (lines 63 / 89 / 137)
  // ============================================
  describe('per-field blur validation (remaining fields)', () => {
    it('flags an invalid phone on blur with the phoneInvalid message', async () => {
      // Line 63: @blur="handleBlur('phone')" — exercise the invalid path via
      // blur (the main suite only reaches phone-invalid through submit).
      await wrapper.find('#phone').setValue('abc')
      await wrapper.find('#phone').trigger('blur')
      await flushPromises()

      const error = wrapper.find('#phone-error')
      expect(error.exists()).toBe(true)
      expect(error.text()).toBe('Enter a valid phone number.')
      expect(wrapper.find('#phone').attributes('aria-invalid')).toBe('true')
    })

    it('flags an empty company on blur with the companyRequired message', async () => {
      // Line 89: @blur="handleBlur('company')".
      await wrapper.find('#company').setValue('')
      await wrapper.find('#company').trigger('blur')
      await flushPromises()

      const error = wrapper.find('#company-error')
      expect(error.exists()).toBe(true)
      expect(error.text()).toBe('Company is required.')
    })

    it('flags an unselected subject on blur with the subjectRequired message', async () => {
      // Line 137: @blur="handleBlur('subject')" — leave the disabled
      // placeholder selected, then blur.
      await wrapper.find('#subject').trigger('blur')
      await flushPromises()

      const error = wrapper.find('#subject-error')
      expect(error.exists()).toBe(true)
      expect(error.text()).toBe('Please select a subject.')
    })

    it('clears the phone error on blur once the phone becomes valid', async () => {
      // Mirror the name clear-on-blur test to prove the phone branch is
      // symmetric (invalid -> valid clears errors.value.phone).
      await wrapper.find('#phone').setValue('abc')
      await wrapper.find('#phone').trigger('blur')
      await flushPromises()
      expect(wrapper.find('#phone-error').exists()).toBe(true)

      await wrapper.find('#phone').setValue('+86 755 0000 0000')
      await wrapper.find('#phone').trigger('blur')
      await flushPromises()

      expect(wrapper.find('#phone-error').exists()).toBe(false)
      expect(wrapper.find('#phone').attributes('aria-invalid')).toBe('false')
    })
  })

  // ============================================
  // Message length upper bound (line 374 + render branch 174)
  // ============================================
  describe('message length upper bound', () => {
    it('rejects a message longer than 1000 characters on submit', async () => {
      // Line 374: `if (value.length > MESSAGE_MAX) return 'tooLong'`.
      // 1001 characters of content -> exceeds the 1000 cap.
      await fillValidExcept(['message'])
      await wrapper.find('#message').setValue('x'.repeat(1001))
      await wrapper.find('form').trigger('submit.prevent')
      await flushPromises()

      const error = wrapper.find('#message-error')
      expect(error.exists()).toBe(true)
      expect(error.text()).toBe('Message must be 1000 characters or fewer.')
    })

    it('flags an over-long message on blur', async () => {
      // Same rule, reached via the blur handler instead of submit.
      await wrapper.find('#message').setValue('x'.repeat(1001))
      await wrapper.find('#message').trigger('blur')
      await flushPromises()

      expect(wrapper.find('#message-error').text()).toBe(
        'Message must be 1000 characters or fewer.',
      )
    })
  })
})
