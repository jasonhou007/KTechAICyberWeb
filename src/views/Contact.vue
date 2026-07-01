<template>
  <div class="contact">
    <!-- Hero Section -->
    <section class="contact-hero">
      <h1 class="page-title">{{ t('contact.title') }} <span class="accent">{{ t('contact.titleAccent') }}</span></h1>
      <p class="page-subtitle">{{ t('contact.subtitle') }}</p>
    </section>

    <!-- Breadcrumb -->
    <nav class="breadcrumb" aria-label="Breadcrumb">
      <span>{{ t('contact.breadcrumb') }}</span>
    </nav>

    <!-- Main Content -->
    <div class="contact-content">
      <!-- Contact Form Section -->
      <section class="contact-form-section">
        <h2 class="section-title">{{ t('contact.form.title') }}</h2>

        <form @submit.prevent="handleSubmit" class="contact-form" novalidate>
          <!-- Name Field -->
          <div class="form-group">
            <label for="name" class="form-label">
              {{ t('contact.form.name') }} <span class="required" aria-label="required">*</span>
            </label>
            <input
              id="name"
              v-model="formData.name"
              type="text"
              name="name"
              class="form-input"
              :class="{ 'error': errors.name }"
              :placeholder="t('contact.form.namePlaceholder')"
              :aria-invalid="errors.name ? 'true' : 'false'"
              :aria-describedby="errors.name ? 'name-error' : undefined"
              required
              @blur="handleBlur('name')"
            />
            <span v-if="errors.name === 'required'" id="name-error" class="error-message" role="alert">
              {{ t('contact.form.validation.nameRequired') }}
            </span>
            <span v-else-if="errors.name === 'tooShort'" id="name-error" class="error-message" role="alert">
              {{ t('contact.form.validation.nameTooShort') }}
            </span>
          </div>

          <!-- Phone Field -->
          <div class="form-group">
            <label for="phone" class="form-label">
              {{ t('contact.form.phone') }} <span class="required" aria-label="required">*</span>
            </label>
            <input
              id="phone"
              v-model="formData.phone"
              type="tel"
              name="phone"
              class="form-input"
              :class="{ 'error': errors.phone }"
              :placeholder="t('contact.form.phonePlaceholder')"
              :aria-invalid="errors.phone ? 'true' : 'false'"
              :aria-describedby="errors.phone ? 'phone-error' : undefined"
              required
              @blur="handleBlur('phone')"
            />
            <span v-if="errors.phone === 'required'" id="phone-error" class="error-message" role="alert">
              {{ t('contact.form.validation.phoneRequired') }}
            </span>
            <span v-else-if="errors.phone === 'invalid'" id="phone-error" class="error-message" role="alert">
              {{ t('contact.form.validation.phoneInvalid') }}
            </span>
          </div>

          <!-- Company Field -->
          <div class="form-group">
            <label for="company" class="form-label">
              {{ t('contact.form.company') }} <span class="required" aria-label="required">*</span>
            </label>
            <input
              id="company"
              v-model="formData.company"
              type="text"
              name="company"
              class="form-input"
              :class="{ 'error': errors.company }"
              :placeholder="t('contact.form.companyPlaceholder')"
              :aria-invalid="errors.company ? 'true' : 'false'"
              :aria-describedby="errors.company ? 'company-error' : undefined"
              required
              @blur="handleBlur('company')"
            />
            <span v-if="errors.company" id="company-error" class="error-message" role="alert">
              {{ t('contact.form.validation.companyRequired') }}
            </span>
          </div>


          <!-- Email Field -->
          <div class="form-group">
            <label for="email" class="form-label">
              {{ t('contact.form.email') }} <span class="required" aria-label="required">*</span>
            </label>
            <input
              id="email"
              v-model="formData.email"
              type="email"
              name="email"
              class="form-input"
              :class="{ 'error': errors.email }"
              :placeholder="t('contact.form.emailPlaceholder')"
              :aria-invalid="errors.email ? 'true' : 'false'"
              :aria-describedby="errors.email ? 'email-error' : undefined"
              required
              @blur="handleBlur('email')"
            />
            <span v-if="errors.email === 'invalid'" id="email-error" class="error-message" role="alert">
              {{ t('contact.form.validation.emailInvalid') }}
            </span>
            <span v-else-if="errors.email" id="email-error" class="error-message" role="alert">
              {{ t('contact.form.validation.emailRequired') }}
            </span>
          </div>

          <!-- Subject Field -->
          <div class="form-group">
            <label for="subject" class="form-label">
              {{ t('contact.form.subject') }} <span class="required" aria-label="required">*</span>
            </label>
            <select
              id="subject"
              v-model="formData.subject"
              name="subject"
              class="form-input"
              :class="{ 'error': errors.subject }"
              :aria-invalid="errors.subject ? 'true' : 'false'"
              :aria-describedby="errors.subject ? 'subject-error' : undefined"
              required
              @blur="handleBlur('subject')"
            >
              <option value="" disabled>{{ t('contact.form.subjectPlaceholder') }}</option>
              <option v-for="opt in subjectOptions" :key="opt.value" :value="opt.value">
                {{ t(opt.labelKey) }}
              </option>
            </select>
            <span v-if="errors.subject === 'required'" id="subject-error" class="error-message" role="alert">
              {{ t('contact.form.validation.subjectRequired') }}
            </span>
          </div>

          <!-- Message Field -->
          <div class="form-group">
            <label for="message" class="form-label">
              {{ t('contact.form.message') }} <span class="required" aria-label="required">*</span>
            </label>
            <textarea
              id="message"
              v-model="formData.message"
              name="message"
              class="form-input form-textarea"
              :class="{ 'error': errors.message }"
              :placeholder="t('contact.form.messagePlaceholder')"
              :minlength="MESSAGE_MIN"
              :maxlength="MESSAGE_MAX"
              :aria-invalid="errors.message ? 'true' : 'false'"
              :aria-describedby="errors.message ? 'message-error' : undefined"
              required
              @blur="handleBlur('message')"
            ></textarea>
            <span v-if="errors.message === 'required'" id="message-error" class="error-message" role="alert">
              {{ t('contact.form.validation.messageRequired') }}
            </span>
            <span v-else-if="errors.message === 'tooShort'" id="message-error" class="error-message" role="alert">
              {{ t('contact.form.validation.messageTooShort') }}
            </span>
            <span v-else-if="errors.message === 'tooLong'" id="message-error" class="error-message" role="alert">
              {{ t('contact.form.validation.messageTooLong') }}
            </span>
          </div>

          <!-- Privacy Policy -->
          <div class="form-group privacy-group">
            <label for="privacy" class="checkbox-label">
              <input
                id="privacy"
                v-model="formData.privacy"
                type="checkbox"
                name="privacy"
                :aria-invalid="errors.privacy ? 'true' : 'false'"
                :aria-describedby="errors.privacy ? 'privacy-error' : undefined"
                required
              />
              <span>{{ t('contact.form.privacy') }}</span>
            </label>
            <span v-if="errors.privacy" id="privacy-error" class="error-message" role="alert">
              {{ t('contact.form.validation.privacyRequired') }}
            </span>
          </div>

          <!-- Submit Button -->
          <button
            type="submit"
            class="submit-button cyber-button"
            :disabled="isSubmitting"
            :aria-label="t('contact.form.submit')"
          >
            <span v-if="!isSubmitting">{{ t('contact.form.submit') }}</span>
            <span v-else>{{ t('contact.form.submitting') }}</span>
          </button>

          <!-- Success/Error Messages -->
          <div v-if="submitStatus" class="submit-message" :class="submitStatus.type" role="alert">
            {{ submitStatus.message }}
          </div>
        </form>
      </section>

      <!-- Company Information Section -->
      <section class="company-info-section">
        <h2 class="section-title">{{ t('contact.info.title') }}</h2>

        <div class="info-grid">
          <!-- Address -->
          <div class="info-item">
            <div class="info-icon" aria-hidden="true">📍</div>
            <h3>{{ t('contact.info.address') }}</h3>
            <p>{{ t('contact.info.addressValue') }}</p>
          </div>

          <!-- Email -->
          <div class="info-item">
            <div class="info-icon" aria-hidden="true">📧</div>
            <h3>{{ t('contact.info.email') }}</h3>
            <p><a :href="`mailto:${t('contact.info.emailValue')}`">{{ t('contact.info.emailValue') }}</a></p>
          </div>

          <!-- Phone -->
          <div class="info-item">
            <div class="info-icon" aria-hidden="true">📞</div>
            <h3>{{ t('contact.info.phone') }}</h3>
            <p><a :href="`tel:${t('contact.info.phoneValue').replace(/[^+\d]/g, '')}`">{{ t('contact.info.phoneValue') }}</a></p>
          </div>

          <!-- WeChat -->
          <div class="info-item">
            <div class="info-icon" aria-hidden="true">💬</div>
            <h3>{{ t('contact.info.wechat') }}</h3>
            <p>{{ t('contact.info.wechatValue') }}</p>
          </div>
        </div>

        <!-- Social Links -->
        <div class="social-links">
          <span class="social-label">{{ t('contact.info.social') }}</span>
        </div>
      </section>
    </div>

    <!-- Request Demo Section -->
    <section class="demo-section">
      <div class="demo-content">
        <h2 class="demo-title">{{ t('contact.demo.title') }}</h2>
        <p class="demo-description">{{ t('contact.demo.description') }}</p>

        <div class="demo-features">
          <div class="demo-feature">
            <div class="feature-number">01</div>
            <h3>{{ t('contact.demo.consultant') }}</h3>
          </div>
          <div class="demo-feature">
            <div class="feature-number">02</div>
            <h3>{{ t('contact.demo.solution') }}</h3>
          </div>
          <div class="demo-feature">
            <div class="feature-number">03</div>
            <h3>{{ t('contact.demo.consulting') }}</h3>
          </div>
        </div>

        <button class="demo-button cyber-button" :aria-label="t('contact.demo.button')">
          {{ t('contact.demo.button') }}
        </button>
      </div>
    </section>
  </div>
</template>

<script setup>
/**
 * @component Contact
 * @description Contact page with form, company information, and demo request section
 *
 * Features:
 * - Contact form with validation
 * - Company information display
 * - Request demo section
 * - Bilingual support (EN/Chinese)
 * - Cyberpunk styling
 */

import { ref, reactive } from 'vue'
import { useLanguage } from '../composables/useLanguage'
import { contactConfig } from '../config/contact'

const { t } = useLanguage()

// Allowed subject values, kept in sync with the i18n labels and the
// <select> options in the template.
const subjectOptions = [
  { value: 'general', labelKey: 'contact.form.subjectGeneral' },
  { value: 'partnership', labelKey: 'contact.form.subjectPartnership' },
  { value: 'support', labelKey: 'contact.form.subjectSupport' },
  { value: 'other', labelKey: 'contact.form.subjectOther' },
]

// Message length bounds (issue #13 AC §1: min 10, max 1000).
const MESSAGE_MIN = 10
const MESSAGE_MAX = 1000

// Form data
const formData = reactive({
  name: '',
  phone: '',
  company: '',
  email: '',
  subject: '',
  message: '',
  privacy: false
})

// Form state
const errors = ref({})
const isSubmitting = ref(false)
const submitStatus = ref(null)

// Email validation regex
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
// Phone: lenient — allow digits, spaces, parentheses, + and hyphens, at least
// 7 characters. This accepts realistic numbers like "+86 755 0000 0000",
// "(415) 555-1212", or "0044 20 7946 0958" while still rejecting pure garbage.
const phoneRegex = /^[\d\s()+-]{7,}$/

// Rules for each field. Each validator returns an error CODE ('required',
// 'tooShort', 'invalid', ...) or null when valid. Centralising the per-field
// rules lets us run a single field on @blur and the whole form on submit.
const fieldValidators = {
  name: (value) => {
    const v = value.trim()
    if (!v) return 'required'
    if (v.length < 2) return 'tooShort'
    return null
  },
  phone: (value) => {
    const v = value.trim()
    if (!v) return 'required'
    if (!phoneRegex.test(v)) return 'invalid'
    return null
  },
  company: (value) => {
    if (!value.trim()) return 'required'
    return null
  },
  email: (value) => {
    const v = value.trim()
    if (!v) return 'required'
    if (!emailRegex.test(v)) return 'invalid'
    return null
  },
  subject: (value) => {
    if (!value) return 'required'
    return null
  },
  message: (value) => {
    const v = value.trim()
    if (!v) return 'required'
    if (v.length < MESSAGE_MIN) return 'tooShort'
    if (value.length > MESSAGE_MAX) return 'tooLong'
    return null
  },
  privacy: (value) => {
    if (!value) return 'required'
    return null
  },
}

// Validate a single field by name. Re-runs that field's rule, stores the
// resulting error code (or clears it), and returns the error code. Used as
// the @blur handler so the user gets immediate per-field feedback (issue #13
// AC §2: "field validation on blur").
const validateField = (field) => {
  const validator = fieldValidators[field]
  if (!validator) return null
  const code = validator(formData[field])
  if (code) {
    errors.value[field] = code
  } else {
    // Clear this field's error as soon as it becomes valid.
    delete errors.value[field]
  }
  return code
}

// Handle a field @blur event. Validates just that field.
const handleBlur = (field) => {
  validateField(field)
}

// Validate the whole form by running every field's rule. Returns true when
// the form is valid. Used by the submit handler.
const validateForm = () => {
  const next = {}
  for (const field of Object.keys(fieldValidators)) {
    const code = fieldValidators[field](formData[field])
    if (code) next[field] = code
  }
  errors.value = next
  return Object.keys(next).length === 0
}

// Reset every field of the form back to its initial empty value. Kept as a
// helper so both the real-submit success path and any future callers stay in
// sync with the full field list in `formData`.
const resetForm = () => {
  formData.name = ''
  formData.phone = ''
  formData.company = ''
  formData.email = ''
  formData.subject = ''
  formData.message = ''
  formData.privacy = false
}

// POST the validated form payload to the configured static-site form backend
// (Formspree / FormSubmit / Web3Forms / getform). Returns true on a 2xx
// response, false otherwise. Throws on network failure so the caller can map
// it to a user-facing error. See issue #270 AC §1, §2.
const postToBackend = async (endpoint, payload) => {
  const res = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify(payload),
  })
  return res.ok
}

// Handle form submit (issue #270: must NOT fake success).
//  - If a form-backend endpoint is configured → real fetch POST, and the
//    reported success/error reflects the genuine network result.
//  - If no endpoint is configured → show a clear DEMO notice instead of
//    fabricating a success message.
const handleSubmit = async () => {
  // Clear previous status
  submitStatus.value = null

  // Validate form
  if (!validateForm()) {
    submitStatus.value = {
      type: 'error',
      message: t('contact.form.error')
    }
    return
  }

  const endpoint = contactConfig && contactConfig.endpoint

  // Demo mode: no backend wired up. Be honest — do NOT pretend success.
  if (!endpoint) {
    submitStatus.value = {
      type: 'demo',
      message: t('contact.form.demoNotice', { email: (contactConfig && contactConfig.demoEmail) || '' })
    }
    return
  }

  // Real submission path.
  isSubmitting.value = true
  try {
    const ok = await postToBackend(endpoint, { ...formData })
    isSubmitting.value = false
    if (ok) {
      submitStatus.value = {
        type: 'success',
        message: t('contact.form.success')
      }
      // Reset form only after a genuinely successful submission.
      resetForm()
    } else {
      submitStatus.value = {
        type: 'error',
        message: t('contact.form.submitError')
      }
    }
  } catch (err) {
    // Network failure / offline / DNS — surface a real error, never success.
    isSubmitting.value = false
    submitStatus.value = {
      type: 'error',
      message: t('contact.form.submitError')
    }
  }
}
</script>

<style scoped>
.contact {
  min-height: 100vh;
  background: linear-gradient(135deg, var(--bg-gradient-start) 0%, var(--bg-gradient-mid) 50%, var(--bg-gradient-end) 100%);
}

/* Hero Section */
.contact-hero {
  padding: 4rem 5% 2rem;
  text-align: center;
  background: var(--accent-cyan-alpha-05);
  border-bottom: 1px solid var(--accent-cyan-alpha-20);
}

.page-title {
  font-family: var(--font-display);
  font-size: 3rem;
  font-weight: 700;
  color: var(--text-primary);
  letter-spacing: 0.2em;
  margin-bottom: 1rem;
}

.page-title .accent {
  color: var(--cyan);
  text-shadow: 0 0 20px var(--accent-cyan-alpha-50);
}

.page-subtitle {
  font-family: var(--font-body);
  font-size: 1.2rem;
  color: var(--text-section-subtitle);
}

/* Breadcrumb */
.breadcrumb {
  padding: 1rem 5%;
  font-family: var(--font-body);
  font-size: 0.9rem;
  color: var(--text-caption);
}

/* Main Content */
.contact-content {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 3rem;
  padding: 4rem 5%;
  max-width: 1400px;
  margin: 0 auto;
}

/* Section Title */
.section-title {
  font-family: var(--font-display);
  font-size: 1.5rem;
  color: var(--cyan);
  letter-spacing: 0.15em;
  margin-bottom: 2rem;
  text-shadow: 0 0 15px var(--accent-cyan-alpha-40);
}

/* Contact Form */
.contact-form-section {
  background: var(--surface-elevated);
  border: 1px solid var(--accent-cyan-alpha-20);
  border-radius: var(--radius-lg);
  padding: 2rem;
}

.form-group {
  margin-bottom: 1.5rem;
}

.form-label {
  display: block;
  font-family: var(--font-body);
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 0.5rem;
  text-transform: uppercase;
  letter-spacing: 0.1em;
}

.required {
  color: var(--cyan);
}

.form-input {
  width: 100%;
  padding: 0.75rem 1rem;
  font-family: var(--font-body);
  font-size: 1rem;
  color: var(--text-primary);
  background: rgba(10, 10, 20, 0.8);
  border: 1px solid var(--accent-cyan-alpha-30);
  border-radius: var(--radius-sm);
  transition: all 0.3s ease;
}

.form-input:focus {
  outline: none;
  border-color: var(--cyan);
  box-shadow: 0 0 15px var(--accent-cyan-alpha-30);
}

.form-input.error {
  border-color: var(--status-error);
  box-shadow: 0 0 10px rgba(255, 68, 68, 0.3);
}

.form-input::placeholder {
  color: var(--text-caption);
}

/* Select: keep native affordance but match the cyber input look. */
select.form-input {
  appearance: none;
  -webkit-appearance: none;
  background-image: linear-gradient(45deg, transparent 50%, var(--cyan) 50%),
    linear-gradient(135deg, var(--cyan) 50%, transparent 50%);
  background-position: calc(100% - 1.2rem) center, calc(100% - 0.8rem) center;
  background-size: 0.4rem 0.4rem, 0.4rem 0.4rem;
  background-repeat: no-repeat;
  padding-right: 2.5rem;
}

select.form-input option {
  color: var(--text-primary);
  background: var(--bg-primary);
}

/* Textarea: multiline variant of the cyber input. */
.form-textarea {
  min-height: 8rem;
  resize: vertical;
  font-family: var(--font-body);
  line-height: 1.5;
}

.error-message {
  display: block;
  margin-top: 0.5rem;
  font-family: var(--font-body);
  font-size: 0.85rem;
  color: var(--status-error);
}

.privacy-group {
  margin-bottom: 2rem;
}

.checkbox-label {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  font-family: var(--font-body);
  font-size: 0.9rem;
  color: var(--text-list-label);
  cursor: pointer;
}

.checkbox-label input[type="checkbox"] {
  margin-top: 0.25rem;
  accent-color: var(--cyan);
}

/* Submit Button */
.submit-button {
  width: 100%;
  padding: 1rem 2rem;
  font-family: var(--font-display);
  font-size: 1rem;
  font-weight: 600;
  color: var(--cyan);
  background: var(--accent-cyan-alpha-10);
  border: 2px solid var(--cyan);
  border-radius: var(--radius-sm);
  cursor: pointer;
  text-transform: uppercase;
  letter-spacing: 0.15em;
  transition: all 0.3s ease;
}

.submit-button:hover:not(:disabled) {
  background: var(--accent-cyan-alpha-20);
  box-shadow: 0 0 25px var(--accent-cyan-alpha-40);
  transform: translateY(-2px);
}

.submit-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* Submit Message */
.submit-message {
  margin-top: 1.5rem;
  padding: 1rem;
  font-family: var(--font-body);
  font-size: 0.95rem;
  border-radius: var(--radius-sm);
  text-align: center;
}

.submit-message.success {
  color: var(--cyan);
  background: var(--accent-cyan-alpha-10);
  border: 1px solid var(--accent-cyan-alpha-30);
}

.submit-message.error {
  color: var(--status-error);
  background: rgba(255, 68, 68, 0.1);
  border: 1px solid rgba(255, 68, 68, 0.3);
}

/* Demo notice (issue #270): shown when no form backend is configured, so the
   user is told honestly that nothing was sent. Uses the warning tone to
   distinguish it from a real success. */
.submit-message.demo {
  color: var(--status-warning);
  background: rgba(255, 204, 0, 0.1);
  border: 1px solid rgba(255, 204, 0, 0.3);
}

/* Company Info Section */
.company-info-section {
  background: var(--surface-elevated);
  border: 1px solid var(--accent-cyan-alpha-20);
  border-radius: var(--radius-lg);
  padding: 2rem;
}

.info-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.info-item {
  padding: 1.5rem;
  background: var(--accent-cyan-alpha-05);
  border: 1px solid var(--accent-cyan-alpha-15);
  border-radius: var(--radius-md);
  transition: all 0.3s ease;
}

.info-item:hover {
  border-color: var(--accent-cyan-alpha-40);
  box-shadow: 0 0 20px var(--accent-cyan-alpha-20);
  transform: translateY(-3px);
}

.info-icon {
  font-size: 2rem;
  margin-bottom: 0.75rem;
}

.info-item h3 {
  font-family: var(--font-body);
  font-size: 1rem;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 0.5rem;
  text-transform: uppercase;
  letter-spacing: 0.1em;
}

.info-item p {
  font-family: var(--font-body);
  font-size: 0.95rem;
  color: var(--text-card-meta);
  line-height: 1.6;
}

.info-item a {
  color: var(--cyan);
  text-decoration: none;
  transition: color 0.3s ease;
}

.info-item a:hover {
  color: var(--cyan);
  text-decoration: underline;
}

.social-links {
  text-align: center;
  padding-top: 1.5rem;
  border-top: 1px solid var(--accent-cyan-alpha-15);
}

.social-label {
  font-family: var(--font-body);
  font-size: 0.9rem;
  color: var(--text-list-label);
  text-transform: uppercase;
  letter-spacing: 0.15em;
}

/* Demo Section */
.demo-section {
  padding: 4rem 5%;
  background: var(--accent-cyan-alpha-05);
  border-top: 1px solid var(--accent-cyan-alpha-20);
}

.demo-content {
  max-width: 800px;
  margin: 0 auto;
  text-align: center;
}

.demo-title {
  font-family: var(--font-display);
  font-size: 2rem;
  font-weight: 700;
  color: var(--cyan);
  letter-spacing: 0.15em;
  margin-bottom: 1.5rem;
  text-shadow: 0 0 20px var(--accent-cyan-alpha-40);
}

.demo-description {
  font-family: var(--font-body);
  font-size: 1.1rem;
  color: var(--text-caption);
  line-height: 1.8;
  margin-bottom: 3rem;
}

.demo-features {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 2rem;
  margin-bottom: 3rem;
}

.demo-feature {
  text-align: center;
  padding: 1.5rem;
  background: var(--surface-elevated);
  border: 1px solid var(--accent-cyan-alpha-20);
  border-radius: var(--radius-md);
  transition: all 0.3s ease;
}

.demo-feature:hover {
  border-color: var(--accent-cyan-alpha-50);
  box-shadow: 0 0 25px var(--accent-cyan-alpha-30);
  transform: translateY(-5px);
}

.feature-number {
  font-family: var(--font-display);
  font-size: 2.5rem;
  font-weight: 700;
  color: var(--cyan);
  margin-bottom: 1rem;
  text-shadow: 0 0 15px var(--accent-cyan-alpha-50);
}

.demo-feature h3 {
  font-family: var(--font-body);
  font-size: 1rem;
  font-weight: 600;
  color: var(--text-primary);
  text-transform: uppercase;
  letter-spacing: 0.1em;
}

.demo-button {
  padding: 1rem 3rem;
  font-family: var(--font-display);
  font-size: 1.1rem;
  font-weight: 600;
  color: var(--cyan);
  background: var(--accent-cyan-alpha-10);
  border: 2px solid var(--cyan);
  border-radius: var(--radius-sm);
  cursor: pointer;
  text-transform: uppercase;
  letter-spacing: 0.15em;
  transition: all 0.3s ease;
}

.demo-button:hover {
  background: var(--accent-cyan-alpha-20);
  box-shadow: 0 0 30px var(--accent-cyan-alpha-50);
  transform: scale(1.05);
}

/* Cyberpunk Button Base */
.cyber-button {
  position: relative;
  overflow: hidden;
}

.cyber-button::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, var(--accent-cyan-alpha-20), transparent);
  transition: left 0.5s ease;
}

.cyber-button:hover::before {
  left: 100%;
}

/* Responsive Design */
@media (max-width: 1024px) {
  .contact-content {
    grid-template-columns: 1fr;
    gap: 2rem;
  }

  .info-grid {
    grid-template-columns: 1fr;
  }

  .demo-features {
    grid-template-columns: 1fr;
    gap: 1.5rem;
  }
}

@media (max-width: 768px) {
  .page-title {
    font-size: 2rem;
  }

  .contact-hero {
    padding: 3rem 5% 1.5rem;
  }

  .contact-content {
    padding: 2rem 5%;
  }

  .demo-section {
    padding: 3rem 5%;
  }

  .demo-title {
    font-size: 1.5rem;
  }

  .contact-form-section,
  .company-info-section {
    padding: 1.5rem;
  }
}
</style>
