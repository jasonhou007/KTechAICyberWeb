<template>
  <section class="contact-form-container">
    <div class="contact-header">
      <h2 class="contact-title">{{ t('contact.title') }}</h2>
      <p class="contact-subtitle">{{ t('contact.subtitle') }}</p>
    </div>

    <form
      class="contact-form"
      @submit.prevent="handleSubmit"
      novalidate
    >
      <div class="form-group">
        <label for="name" class="form-label">
          {{ t('contact.form.name') }} <span class="required">*</span>
        </label>
        <input
          id="name"
          v-model="formData.name"
          type="text"
          class="form-input"
          :class="{ 'error': errors.name, 'touched': touched.name }"
          :aria-invalid="errors.name ? 'true' : 'false'"
          :aria-describedby="errors.name ? 'name-error' : undefined"
          @blur="validateField('name')"
          @input="clearError('name')"
          required
        />
        <span
          v-if="errors.name"
          id="name-error"
          class="error-message"
          role="alert"
          aria-live="polite"
        >
          {{ errors.name }}
        </span>
      </div>

      <div class="form-group">
        <label for="email" class="form-label">
          {{ t('contact.form.email') }} <span class="required">*</span>
        </label>
        <input
          id="email"
          v-model="formData.email"
          type="email"
          class="form-input"
          :class="{ 'error': errors.email, 'touched': touched.email }"
          :aria-invalid="errors.email ? 'true' : 'false'"
          :aria-describedby="errors.email ? 'email-error' : undefined"
          @blur="validateField('email')"
          @input="clearError('email')"
          required
        />
        <span
          v-if="errors.email"
          id="email-error"
          class="error-message"
          role="alert"
          aria-live="polite"
        >
          {{ errors.email }}
        </span>
      </div>

      <div class="form-group">
        <label for="subject" class="form-label">
          {{ t('contact.form.subject') }} <span class="required">*</span>
        </label>
        <input
          id="subject"
          v-model="formData.subject"
          type="text"
          class="form-input"
          :class="{ 'error': errors.subject, 'touched': touched.subject }"
          :aria-invalid="errors.subject ? 'true' : 'false'"
          :aria-describedby="errors.subject ? 'subject-error' : undefined"
          @blur="validateField('subject')"
          @input="clearError('subject')"
          required
        />
        <span
          v-if="errors.subject"
          id="subject-error"
          class="error-message"
          role="alert"
          aria-live="polite"
        >
          {{ errors.subject }}
        </span>
      </div>

      <div class="form-group">
        <label for="message" class="form-label">
          {{ t('contact.form.message') }} <span class="required">*</span>
        </label>
        <textarea
          id="message"
          v-model="formData.message"
          class="form-textarea"
          :class="{ 'error': errors.message, 'touched': touched.message }"
          :aria-invalid="errors.message ? 'true' : 'false'"
          :aria-describedby="errors.message ? 'message-error' : undefined"
          rows="5"
          @blur="validateField('message')"
          @input="clearError('message')"
          required
        ></textarea>
        <span
          v-if="errors.message"
          id="message-error"
          class="error-message"
          role="alert"
          aria-live="polite"
        >
          {{ errors.message }}
        </span>
      </div>

      <div
        v-if="submitStatus.message"
        class="status-message"
        :class="submitStatus.type"
        role="status"
        aria-live="polite"
      >
        {{ submitStatus.message }}
      </div>

      <button
        type="submit"
        class="submit-button"
        :disabled="isSubmitting"
        :aria-busy="isSubmitting"
      >
        <span v-if="isSubmitting" class="button-spinner"></span>
        {{ isSubmitting ? t('contact.form.submitting') : t('contact.form.submit') }}
      </button>
    </form>
  </section>
</template>

<script setup>
import { reactive, ref, onMounted } from 'vue'
import { useLanguageStore } from '../stores/language'

const languageStore = useLanguageStore()
const { t, initLanguage } = languageStore

// Initialize language on component mount
onMounted(() => {
  initLanguage()
})

// Form data state
const formData = reactive({
  name: '',
  email: '',
  subject: '',
  message: ''
})

// Error tracking
const errors = reactive({
  name: '',
  email: '',
  subject: '',
  message: ''
})

// Track touched fields for validation timing
const touched = reactive({
  name: false,
  email: false,
  subject: false,
  message: false
})

// Submission state
const isSubmitting = ref(false)
const submitStatus = reactive({
  message: '',
  type: '' // 'success' or 'error'
})

// Email validation regex
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

// Field validators
const validators = {
  name: (value) => {
    const trimmed = value.trim()
    if (trimmed.length === 0) {
      return t('contact.form.validation.nameRequired')
    }
    if (trimmed.length < 2) {
      return t('contact.form.validation.nameRequired')
    }
    return ''
  },
  email: (value) => {
    const trimmed = value.trim()
    if (trimmed.length === 0) {
      return t('contact.form.validation.emailRequired')
    }
    if (!emailRegex.test(trimmed)) {
      return t('contact.form.validation.emailRequired')
    }
    return ''
  },
  subject: (value) => {
    const trimmed = value.trim()
    if (trimmed.length === 0) {
      return t('contact.form.validation.subjectRequired')
    }
    if (trimmed.length < 3) {
      return t('contact.form.validation.subjectRequired')
    }
    return ''
  },
  message: (value) => {
    const trimmed = value.trim()
    if (trimmed.length === 0) {
      return t('contact.form.validation.messageRequired')
    }
    if (trimmed.length < 10) {
      return t('contact.form.validation.messageRequired')
    }
    return ''
  }
}

// Validate a single field
function validateField(fieldName) {
  touched[fieldName] = true
  const validator = validators[fieldName]
  if (validator) {
    errors[fieldName] = validator(formData[fieldName])
  }
}

// Clear error for a field on input
function clearError(fieldName) {
  if (errors[fieldName]) {
    errors[fieldName] = ''
  }
}

// Validate all fields
function validateAllFields() {
  let isValid = true
  Object.keys(validators).forEach(fieldName => {
    touched[fieldName] = true
    const error = validators[fieldName](formData[fieldName])
    errors[fieldName] = error
    if (error) {
      isValid = false
    }
  })
  return isValid
}

// Reset form after successful submission
function resetForm() {
  formData.name = ''
  formData.email = ''
  formData.subject = ''
  formData.message = ''

  Object.keys(errors).forEach(key => {
    errors[key] = ''
  })
  Object.keys(touched).forEach(key => {
    touched[key] = false
  })
}

// Handle form submission
async function handleSubmit() {
  // Clear previous status
  submitStatus.message = ''
  submitStatus.type = ''

  // Validate all fields
  if (!validateAllFields()) {
    return
  }

  isSubmitting.value = true

  try {
    // API endpoint placeholder - console log for testing
    console.log('Form submitted:', {
      name: formData.name,
      email: formData.email,
      subject: formData.subject,
      message: formData.message,
      timestamp: new Date().toISOString()
    })

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500))

    // Success response
    submitStatus.message = t('contact.form.success')
    submitStatus.type = 'success'
    resetForm()

    // Clear success message after 5 seconds
    setTimeout(() => {
      submitStatus.message = ''
      submitStatus.type = ''
    }, 5000)

  } catch (error) {
    console.error('Form submission error:', error)
    submitStatus.message = t('contact.form.error')
    submitStatus.type = 'error'
  } finally {
    isSubmitting.value = false
  }
}
</script>

<style scoped>
.contact-form-container {
  max-width: 600px;
  margin: 0 auto;
  padding: 2rem;
  background: rgba(10, 10, 15, 0.8);
  border: 1px solid rgba(0, 240, 255, 0.2);
  border-radius: 10px;
  backdrop-filter: blur(10px);
}

.contact-header {
  text-align: center;
  margin-bottom: 2rem;
}

.contact-title {
  font-family: 'Rajdhani', sans-serif;
  font-size: 2rem;
  font-weight: 700;
  color: #00f0ff;
  text-transform: uppercase;
  letter-spacing: 0.2em;
  margin-bottom: 0.5rem;
  text-shadow: 0 0 10px rgba(0, 240, 255, 0.5);
}

.contact-subtitle {
  font-family: 'Rajdhani', sans-serif;
  font-size: 1.1rem;
  color: #e0e0e0;
  letter-spacing: 0.1em;
}

.contact-form {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.form-label {
  font-family: 'Rajdhani', sans-serif;
  font-size: 0.9rem;
  font-weight: 500;
  color: #e0e0e0;
  text-transform: uppercase;
  letter-spacing: 0.1em;
}

.required {
  color: #ff00ff;
}

.form-input,
.form-textarea {
  padding: 0.75rem 1rem;
  background: rgba(0, 0, 0, 0.5);
  border: 1px solid rgba(0, 255, 136, 0.3);
  border-radius: 5px;
  color: #e0e0e0;
  font-family: 'Rajdhani', sans-serif;
  font-size: 1rem;
  transition: all 0.3s ease;
}

.form-input:focus,
.form-textarea:focus {
  outline: none;
  border-color: rgba(0, 255, 136, 0.6);
  box-shadow: 0 0 15px rgba(0, 255, 136, 0.4);
}

.form-input:hover,
.form-textarea:hover {
  border-color: rgba(0, 255, 136, 0.5);
}

.form-input.error,
.form-textarea.error {
  border-color: #ff00ff;
  box-shadow: 0 0 10px rgba(255, 0, 255, 0.3);
}

.form-input.error:focus,
.form-textarea.error:focus {
  border-color: #ff00ff;
  box-shadow: 0 0 15px rgba(255, 0, 255, 0.4);
}

.form-textarea {
  resize: vertical;
  min-height: 100px;
}

.error-message {
  font-family: 'Rajdhani', sans-serif;
  font-size: 0.85rem;
  color: #ff00ff;
  text-shadow: 0 0 5px rgba(255, 0, 255, 0.5);
  margin-top: 0.25rem;
}

.status-message {
  padding: 1rem;
  border-radius: 5px;
  font-family: 'Rajdhani', sans-serif;
  font-size: 0.95rem;
  text-align: center;
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(-10px); }
  to { opacity: 1; transform: translateY(0); }
}

.status-message.success {
  background: rgba(0, 255, 136, 0.1);
  border: 1px solid rgba(0, 255, 136, 0.4);
  color: #00ff88;
  text-shadow: 0 0 5px rgba(0, 255, 136, 0.5);
}

.status-message.error {
  background: rgba(255, 0, 255, 0.1);
  border: 1px solid rgba(255, 0, 255, 0.4);
  color: #ff00ff;
  text-shadow: 0 0 5px rgba(255, 0, 255, 0.5);
}

.submit-button {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 1rem 2rem;
  background: rgba(0, 240, 255, 0.1);
  border: 1px solid rgba(0, 240, 255, 0.4);
  border-radius: 5px;
  color: #00f0ff;
  font-family: 'Rajdhani', sans-serif;
  font-size: 1rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.15em;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}

.submit-button:hover:not(:disabled) {
  background: rgba(0, 240, 255, 0.2);
  box-shadow: 0 0 20px rgba(0, 240, 255, 0.5);
  transform: translateY(-2px);
}

.submit-button:focus-visible {
  outline: 2px solid #00f0ff;
  outline-offset: 2px;
}

.submit-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.submit-button::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(
    90deg,
    transparent,
    rgba(0, 240, 255, 0.2),
    transparent
  );
  transition: left 0.5s ease;
}

.submit-button:hover::before {
  left: 100%;
}

.button-spinner {
  width: 16px;
  height: 16px;
  border: 2px solid rgba(0, 240, 255, 0.3);
  border-top-color: #00f0ff;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* Responsive design */
@media (max-width: 768px) {
  .contact-form-container {
    padding: 1.5rem;
  }

  .contact-title {
    font-size: 1.5rem;
  }

  .contact-subtitle {
    font-size: 1rem;
  }

  .form-input,
  .form-textarea {
    font-size: 0.95rem;
  }

  .submit-button {
    padding: 0.875rem 1.5rem;
    font-size: 0.95rem;
  }
}

@media (max-width: 480px) {
  .contact-form-container {
    padding: 1rem;
  }

  .contact-title {
    font-size: 1.25rem;
  }

  .form-label {
    font-size: 0.85rem;
  }
}

/* Respect reduced-motion preference */
@media (prefers-reduced-motion: reduce) {
  .form-input,
  .form-textarea,
  .submit-button,
  .status-message {
    transition: none;
    animation: none;
  }

  .submit-button:hover:not(:disabled) {
    transform: none;
  }
}
</style>
