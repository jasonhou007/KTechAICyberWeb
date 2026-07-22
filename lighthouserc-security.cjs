// Lighthouse CI configuration for security-focused auditing
// Issue #457 - Security Hardening
// This config focuses on security, performance, and accessibility

module.exports = {
  ci: {
    collect: {
      startServerCommand: 'npm run build && npx serve -s dist -l 4175',
      url: ['http://localhost:4175/'],
      numberOfRuns: 3,
      settings: {
        onlyCategories: ['security', 'performance', 'accessibility'],
        // Security-specific audits
        audits: [
          // Security
          'response-status-code',
          'security-header',
          'mixed-content',
          'redirects-http',
          'xss-protection',
          'no-vulnerable-libraries',
          'password-inputs-can-be-pasted-to',
          'errors-in-console',
          'https',
          'is-on-https',
          'password-inputs-are-visible-on-focus',

          // Performance (basic checks)
          'total-blocking-time',
          'cumulative-layout-shift',
          'largest-contentful-paint',
          'speed-index',
          'first-contentful-paint',
          'interactive',

          // Accessibility
          'color-contrast',
          'image-alt',
          'label',
          'link-name',
          'bypass',
        ],
      },
    },
    assert: {
      assertions: {
        // Security assertions - must have perfect security score
        'categories:security': ['error', { minScore: 0.9 }], // 90+ required

        // Security header checks
        'security-header': ['error', { minLength: 5 }], // At least 5 security headers

        // Basic performance thresholds (relaxed for security focus)
        'categories:performance': ['warn', { minScore: 0.6 }], // 60+ warning

        // Accessibility thresholds
        'categories:accessibility': ['warn', { minScore: 0.8 }], // 80+ warning
      },
    },
    upload: {
      target: 'temporary-public-storage',
    },
  },
};
