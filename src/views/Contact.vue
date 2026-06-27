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
            />
            <span v-if="errors.name" id="name-error" class="error-message" role="alert">
              {{ t('contact.form.validation.nameRequired') }}
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
            />
            <span v-if="errors.phone" id="phone-error" class="error-message" role="alert">
              {{ t('contact.form.validation.phoneRequired') }}
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
            />
            <span v-if="errors.email === 'invalid'" id="email-error" class="error-message" role="alert">
              {{ t('contact.form.validation.emailInvalid') }}
            </span>
            <span v-else-if="errors.email" id="email-error" class="error-message" role="alert">
              {{ t('contact.form.validation.emailRequired') }}
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
                required
              />
              <span>{{ t('contact.form.privacy') }}</span>
            </label>
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

const { t } = useLanguage()

// Form data
const formData = reactive({
  name: '',
  phone: '',
  company: '',
  email: '',
  privacy: false
})

// Form state
const errors = ref({})
const isSubmitting = ref(false)
const submitStatus = ref(null)

// Email validation regex
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

// Validate form
const validateForm = () => {
  errors.value = {}

  // Name validation
  if (!formData.name.trim()) {
    errors.value.name = true
  }

  // Phone validation
  if (!formData.phone.trim()) {
    errors.value.phone = true
  }

  // Company validation
  if (!formData.company.trim()) {
    errors.value.company = true
  }

  // Email validation
  if (!formData.email.trim()) {
    errors.value.email = 'required'
  } else if (!emailRegex.test(formData.email)) {
    errors.value.email = 'invalid'
  }

  // Privacy validation
  if (!formData.privacy) {
    errors.value.privacy = true
  }

  return Object.keys(errors.value).length === 0
}

// Handle form submit
const handleSubmit = () => {
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

  // Submit form
  isSubmitting.value = true

  // Simulate API call
  setTimeout(() => {
    isSubmitting.value = false
    submitStatus.value = {
      type: 'success',
      message: t('contact.form.success')
    }

    // Reset form
    formData.name = ''
    formData.phone = ''
    formData.company = ''
    formData.email = ''
    formData.privacy = false
  }, 1500)
}
</script>

<style scoped>
.contact {
  min-height: 100vh;
  background: linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 50%, #16213e 100%);
}

/* Hero Section */
.contact-hero {
  padding: 4rem 5% 2rem;
  text-align: center;
  background: rgba(0, 240, 255, 0.05);
  border-bottom: 1px solid rgba(0, 240, 255, 0.2);
}

.page-title {
  font-family: 'Orbitron', monospace;
  font-size: 3rem;
  font-weight: 700;
  color: #e0e0e0;
  letter-spacing: 0.2em;
  margin-bottom: 1rem;
}

.page-title .accent {
  color: #00f0ff;
  text-shadow: 0 0 20px rgba(0, 240, 255, 0.5);
}

.page-subtitle {
  font-family: 'Rajdhani', sans-serif;
  font-size: 1.2rem;
  color: #888;
}

/* Breadcrumb */
.breadcrumb {
  padding: 1rem 5%;
  font-family: 'Rajdhani', sans-serif;
  font-size: 0.9rem;
  color: #666;
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
  font-family: 'Orbitron', monospace;
  font-size: 1.5rem;
  color: #00f0ff;
  letter-spacing: 0.15em;
  margin-bottom: 2rem;
  text-shadow: 0 0 15px rgba(0, 240, 255, 0.4);
}

/* Contact Form */
.contact-form-section {
  background: rgba(26, 26, 46, 0.6);
  border: 1px solid rgba(0, 240, 255, 0.2);
  border-radius: 10px;
  padding: 2rem;
}

.form-group {
  margin-bottom: 1.5rem;
}

.form-label {
  display: block;
  font-family: 'Rajdhani', sans-serif;
  font-size: 0.9rem;
  font-weight: 600;
  color: #e0e0e0;
  margin-bottom: 0.5rem;
  text-transform: uppercase;
  letter-spacing: 0.1em;
}

.required {
  color: #00f0ff;
}

.form-input {
  width: 100%;
  padding: 0.75rem 1rem;
  font-family: 'Rajdhani', sans-serif;
  font-size: 1rem;
  color: #e0e0e0;
  background: rgba(10, 10, 20, 0.8);
  border: 1px solid rgba(0, 240, 255, 0.3);
  border-radius: 5px;
  transition: all 0.3s ease;
}

.form-input:focus {
  outline: none;
  border-color: #00f0ff;
  box-shadow: 0 0 15px rgba(0, 240, 255, 0.3);
}

.form-input.error {
  border-color: #ff4444;
  box-shadow: 0 0 10px rgba(255, 68, 68, 0.3);
}

.form-input::placeholder {
  color: #666;
}

.error-message {
  display: block;
  margin-top: 0.5rem;
  font-family: 'Rajdhani', sans-serif;
  font-size: 0.85rem;
  color: #ff4444;
}

.privacy-group {
  margin-bottom: 2rem;
}

.checkbox-label {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  font-family: 'Rajdhani', sans-serif;
  font-size: 0.9rem;
  color: #aaa;
  cursor: pointer;
}

.checkbox-label input[type="checkbox"] {
  margin-top: 0.25rem;
  accent-color: #00f0ff;
}

/* Submit Button */
.submit-button {
  width: 100%;
  padding: 1rem 2rem;
  font-family: 'Orbitron', monospace;
  font-size: 1rem;
  font-weight: 600;
  color: #00f0ff;
  background: rgba(0, 240, 255, 0.1);
  border: 2px solid #00f0ff;
  border-radius: 5px;
  cursor: pointer;
  text-transform: uppercase;
  letter-spacing: 0.15em;
  transition: all 0.3s ease;
}

.submit-button:hover:not(:disabled) {
  background: rgba(0, 240, 255, 0.2);
  box-shadow: 0 0 25px rgba(0, 240, 255, 0.4);
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
  font-family: 'Rajdhani', sans-serif;
  font-size: 0.95rem;
  border-radius: 5px;
  text-align: center;
}

.submit-message.success {
  color: #00ff88;
  background: rgba(0, 255, 136, 0.1);
  border: 1px solid rgba(0, 255, 136, 0.3);
}

.submit-message.error {
  color: #ff4444;
  background: rgba(255, 68, 68, 0.1);
  border: 1px solid rgba(255, 68, 68, 0.3);
}

/* Company Info Section */
.company-info-section {
  background: rgba(26, 26, 46, 0.6);
  border: 1px solid rgba(0, 240, 255, 0.2);
  border-radius: 10px;
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
  background: rgba(0, 240, 255, 0.05);
  border: 1px solid rgba(0, 240, 255, 0.15);
  border-radius: 8px;
  transition: all 0.3s ease;
}

.info-item:hover {
  border-color: rgba(0, 240, 255, 0.4);
  box-shadow: 0 0 20px rgba(0, 240, 255, 0.2);
  transform: translateY(-3px);
}

.info-icon {
  font-size: 2rem;
  margin-bottom: 0.75rem;
}

.info-item h3 {
  font-family: 'Rajdhani', sans-serif;
  font-size: 1rem;
  font-weight: 600;
  color: #e0e0e0;
  margin-bottom: 0.5rem;
  text-transform: uppercase;
  letter-spacing: 0.1em;
}

.info-item p {
  font-family: 'Rajdhani', sans-serif;
  font-size: 0.95rem;
  color: #aaa;
  line-height: 1.6;
}

.info-item a {
  color: #00f0ff;
  text-decoration: none;
  transition: color 0.3s ease;
}

.info-item a:hover {
  color: #00ffcc;
  text-decoration: underline;
}

.social-links {
  text-align: center;
  padding-top: 1.5rem;
  border-top: 1px solid rgba(0, 240, 255, 0.15);
}

.social-label {
  font-family: 'Rajdhani', sans-serif;
  font-size: 0.9rem;
  color: #666;
  text-transform: uppercase;
  letter-spacing: 0.15em;
}

/* Demo Section */
.demo-section {
  padding: 4rem 5%;
  background: rgba(0, 240, 255, 0.05);
  border-top: 1px solid rgba(0, 240, 255, 0.2);
}

.demo-content {
  max-width: 800px;
  margin: 0 auto;
  text-align: center;
}

.demo-title {
  font-family: 'Orbitron', monospace;
  font-size: 2rem;
  font-weight: 700;
  color: #00f0ff;
  letter-spacing: 0.15em;
  margin-bottom: 1.5rem;
  text-shadow: 0 0 20px rgba(0, 240, 255, 0.4);
}

.demo-description {
  font-family: 'Rajdhani', sans-serif;
  font-size: 1.1rem;
  color: #aaa;
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
  background: rgba(26, 26, 46, 0.6);
  border: 1px solid rgba(0, 240, 255, 0.2);
  border-radius: 8px;
  transition: all 0.3s ease;
}

.demo-feature:hover {
  border-color: rgba(0, 240, 255, 0.5);
  box-shadow: 0 0 25px rgba(0, 240, 255, 0.3);
  transform: translateY(-5px);
}

.feature-number {
  font-family: 'Orbitron', monospace;
  font-size: 2.5rem;
  font-weight: 700;
  color: #00f0ff;
  margin-bottom: 1rem;
  text-shadow: 0 0 15px rgba(0, 240, 255, 0.5);
}

.demo-feature h3 {
  font-family: 'Rajdhani', sans-serif;
  font-size: 1rem;
  font-weight: 600;
  color: #e0e0e0;
  text-transform: uppercase;
  letter-spacing: 0.1em;
}

.demo-button {
  padding: 1rem 3rem;
  font-family: 'Orbitron', monospace;
  font-size: 1.1rem;
  font-weight: 600;
  color: #00f0ff;
  background: rgba(0, 240, 255, 0.1);
  border: 2px solid #00f0ff;
  border-radius: 5px;
  cursor: pointer;
  text-transform: uppercase;
  letter-spacing: 0.15em;
  transition: all 0.3s ease;
}

.demo-button:hover {
  background: rgba(0, 240, 255, 0.2);
  box-shadow: 0 0 30px rgba(0, 240, 255, 0.5);
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
  background: linear-gradient(90deg, transparent, rgba(0, 240, 255, 0.2), transparent);
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
