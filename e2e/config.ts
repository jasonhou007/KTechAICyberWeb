/**
 * Playwright E2E Test Configuration
 *
 * This file contains shared configuration for E2E tests
 */

export const testConfig = {
  baseURL: 'http://localhost:5173',
  timeout: 30000,
  retries: process.env.CI ? 2 : 0,
};

export const viewportSizes = {
  desktop: { width: 1920, height: 1080 },
  laptop: { width: 1366, height: 768 },
  tablet: { width: 768, height: 1024 },
  mobile: { width: 375, height: 667 },
};

export const pages = {
  home: '/',
  about: '/about',
};

export const selectors = {
  nav: '.cyber-nav',
  navLinks: '.nav-links a',
  homeLink: '.nav-links a[href="/"]',
  aboutLink: '.nav-links a[href="/about"]',
  mainContent: '.main-content',
  footer: '.cyber-footer',
  statusDot: '.status-dot',
  h1: 'h1',
  cyberCard: '.cyber-card',
  featureCards: '.feature-card',
  stats: '.stats',
  statValue: '.stat-value',
  ctaButton: '.cyber-button',
  gridBg: '.grid-bg',
};

export const expectedText = {
  h1: 'KTech AI',
  subtitle: 'Cyberpunk Intelligence Systems',
  ctaButton: 'Get Started',
  footer: 'All systems operational',
  featureTitles: ['AI Models', 'Real-time', 'Secure'],
};
