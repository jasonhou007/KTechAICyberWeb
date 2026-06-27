/**
 * Accessibility Utilities
 * Provides helper functions for focus management, ARIA attributes,
 * and other accessibility-related functionality
 */

/**
 * Focus Trap Utility
 * Traps focus within a container element (modals, loading screens, etc.)
 */
export class FocusTrap {
  constructor(container) {
    this.container = container
    this.focusableElements = []
    this.firstFocusableElement = null
    this.lastFocusableElement = null
    this.previousActiveElement = null
    this.handleKeyDown = this.handleKeyDown.bind(this)
  }

  /**
   * Get all focusable elements within the container
   */
  getFocusableElements() {
    const focusableSelectors = [
      'a[href]',
      'button:not([disabled])',
      'textarea:not([disabled])',
      'input:not([disabled])',
      'select:not([disabled])',
      '[tabindex]:not([tabindex="-1"])',
      '[contenteditable="true"]'
    ].join(', ')

    return Array.from(this.container.querySelectorAll(focusableSelectors))
  }

  /**
   * Activate the focus trap
   */
  activate() {
    // Save the currently focused element
    this.previousActiveElement = document.activeElement

    // Get all focusable elements
    this.focusableElements = this.getFocusableElements()

    if (this.focusableElements.length > 0) {
      this.firstFocusableElement = this.focusableElements[0]
      this.lastFocusableElement = this.focusableElements[this.focusableElements.length - 1]

      // Focus the first element
      this.firstFocusableElement.focus()
    }

    // Add event listener
    document.addEventListener('keydown', this.handleKeyDown)
  }

  /**
   * Deactivate the focus trap
   */
  deactivate() {
    // Remove event listener
    document.removeEventListener('keydown', this.handleKeyDown)

    // Return focus to the previous element
    if (this.previousActiveElement) {
      this.previousActiveElement.focus()
    }
  }

  /**
   * Handle keyboard navigation
   */
  handleKeyDown(event) {
    if (event.key !== 'Tab') return

    // Shift + Tab
    if (event.shiftKey) {
      if (document.activeElement === this.firstFocusableElement) {
        event.preventDefault()
        this.lastFocusableElement.focus()
      }
    }
    // Tab only
    else {
      if (document.activeElement === this.lastFocusableElement) {
        event.preventDefault()
        this.firstFocusableElement.focus()
      }
    }
  }
}

/**
 * Create a focus trap for a container
 */
export function createFocusTrap(container) {
  return new FocusTrap(container)
}

/**
 * ARIA Utility Functions
 */

/**
 * Set ARIA attributes on an element
 */
export function setAria(element, attributes) {
  if (!element) return

  Object.entries(attributes).forEach(([key, value]) => {
    if (value === null) {
      element.removeAttribute(key)
    } else {
      element.setAttribute(key, String(value))
    }
  })
}

/**
 * Update HTML lang attribute
 */
export function updateHtmlLang(langCode) {
  const html = document.documentElement
  if (html) {
    html.lang = langCode
  }
}

/**
 * Get appropriate lang code for i18n
 */
export function getHtmlLangCode(i18nLang) {
  const langMap = {
    'en': 'en',
    'zh': 'zh-CN'
  }
  return langMap[i18nLang] || i18nLang
}

/**
 * Screen Reader Announcements
 */

/**
 * Announce a message to screen readers
 */
export function announceToScreenReader(message, priority = 'polite') {
  // Remove existing announcers of the same priority
  const existingAnnouncer = document.querySelector(`[aria-live="${priority}"].a11y-announcer`)
  if (existingAnnouncer) {
    existingAnnouncer.remove()
  }

  // Create new announcer
  const announcer = document.createElement('div')
  announcer.setAttribute('role', 'status')
  announcer.setAttribute('aria-live', priority)
  announcer.setAttribute('aria-atomic', 'true')
  announcer.className = 'a11y-announcer sr-only'
  announcer.textContent = message

  document.body.appendChild(announcer)

  // Remove after announcement (with timeout for screen readers to pick it up)
  setTimeout(() => {
    if (announcer.parentNode) {
      announcer.remove()
    }
  }, 1000)
}

/**
 * Announce a polite message
 */
export function announcePolite(message) {
  announceToScreenReader(message, 'polite')
}

/**
 * Announce an assertive message
 */
export function announceAssertive(message) {
  announceToScreenReader(message, 'assertive')
}

/**
 * Focus Management Utilities
 */

/**
 * Move focus to an element
 */
export function focusElement(selectorOrElement) {
  const element = typeof selectorOrElement === 'string'
    ? document.querySelector(selectorOrElement)
    : selectorOrElement

  if (element) {
    // Use setTimeout to ensure the DOM is ready
    setTimeout(() => {
      element.focus({
        preventScroll: false
      })
    }, 0)
  }
}

/**
 * Check if an element is focusable
 */
export function isFocusable(element) {
  if (!element || element.disabled) {
    return false
  }

  const focusableTags = ['BUTTON', 'INPUT', 'SELECT', 'TEXTAREA', 'A']
  const isFocusableTag = focusableTags.includes(element.tagName)
  const hasTabIndex = element.getAttribute('tabindex') !== null

  return isFocusableTag || hasTabIndex
}

/**
 * Get the first focusable element in a container
 */
export function getFirstFocusable(container) {
  const focusable = new FocusTrap(container)
  const elements = focusable.getFocusableElements()
  return elements.length > 0 ? elements[0] : null
}

/**
 * Keyboard Navigation Utilities
 */

/**
 * Handle keyboard shortcuts
 */
export function createKeyboardHandler(keyMap) {
  return (event) => {
    const key = event.key
    const handler = keyMap[key]

    if (handler) {
      event.preventDefault()
      handler(event)
    }
  }
}

/**
 * Check if user prefers reduced motion
 */
export function prefersReducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

/**
 * Check if user prefers high contrast
 */
export function prefersHighContrast() {
  return window.matchMedia('(prefers-contrast: high)').matches
}

/**
 * Accessibility Testing Utilities
 */

/**
 * Log accessibility information for debugging
 */
export function logAccessibilityInfo(element) {
  if (!element) return

  const info = {
    tagName: element.tagName,
    id: element.id,
    className: element.className,
    role: element.getAttribute('role'),
    ariaLabel: element.getAttribute('aria-label'),
    ariaLabelledby: element.getAttribute('aria-labelledby'),
    ariaDescribedby: element.getAttribute('aria-describedby'),
    tabIndex: element.getAttribute('tabindex'),
    isFocusable: isFocusable(element)
  }

  console.log('Accessibility Info:', info)
  return info
}

/**
 * Vue 3 Composable: Use Focus Trap
 */
export function useFocusTrap() {
  let trap = null

  const activateTrap = (container) => {
    if (container) {
      trap = new FocusTrap(container)
      trap.activate()
    }
  }

  const deactivateTrap = () => {
    if (trap) {
      trap.deactivate()
      trap = null
    }
  }

  return {
    activateTrap,
    deactivateTrap
  }
}

/**
 * Vue 3 Composable: Use ARIA
 */
export function useAria() {
  const setAriaProps = (element, props) => {
    setAria(element, props)
  }

  return {
    setAriaProps,
    updateLang: updateHtmlLang,
    getLangCode: getHtmlLangCode,
    announce: announcePolite,
    announceAssertive
  }
}

/**
 * Default export
 */
export default {
  FocusTrap,
  createFocusTrap,
  setAria,
  updateHtmlLang,
  getHtmlLangCode,
  announceToScreenReader,
  announcePolite,
  announceAssertive,
  focusElement,
  isFocusable,
  getFirstFocusable,
  createKeyboardHandler,
  prefersReducedMotion,
  prefersHighContrast,
  logAccessibilityInfo,
  useFocusTrap,
  useAria
}
