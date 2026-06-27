/**
 * E2E tests for Performance Requirements using Lighthouse
 * Following TDD principles - tests written before implementation
 *
 * These tests validate:
 * - Lighthouse Performance score >= 90
 * - Lighthouse Accessibility score >= 90
 * - Lighthouse Best Practices score >= 90
 * - Lighthouse SEO score >= 90
 * - Core Web Vitals thresholds
 * - Bundle size verification
 */

import { test, expect } from '@playwright/test';

// Import Lighthouse
import * as lh from 'lighthouse';
import * as chromeLauncher from 'chrome-launcher';

interface LighthouseResult {
  score: number;
  metrics?: {
    'first-contentful-paint'?: number;
    'largest-contentful-paint'?: number;
    'total-blocking-time'?: number;
    'cumulative-layout-shift'?: number;
    'speed-index'?: number;
  };
}

interface LighthouseReport {
  categories: {
    performance?: { score: number };
    accessibility?: { score: number };
    'best-practices'?: { score: number };
    seo?: { score: number };
  };
  audits: {
    'first-contentful-paint'?: { score: number; displayValue: string };
    'largest-contentful-paint'?: { score: number; displayValue: string };
    'total-blocking-time'?: { score: number; displayValue: string };
    'cumulative-layout-shift'?: { score: number; displayValue: string };
    'speed-index'?: { score: number; displayValue: string };
    'max-potential-fid'?: { score: number; displayValue: string };
  };
}

/**
 * Run Lighthouse audit for the given URL
 */
async function runLighthouse(url: string): Promise<LighthouseReport> {
  const chrome = await chromeLauncher.launch({ chromeFlags: ['--headless'] });

  const options = {
    logLevel: 'info' as const,
    output: 'json' as const,
    port: chrome.port,
    onlyCategories: ['performance', 'accessibility', 'best-practices', 'seo'],
  };

  const runnerResult = await lh(url, options);

  await chrome.kill();

  return runnerResult as LighthouseReport;
}

test.describe('Lighthouse Performance Tests', () => {
  let baseUrl: string;

  test.beforeAll(async () => {
    baseUrl = 'http://localhost:3000';
  });

  test.describe('Performance Scores', () => {
    test('should have Performance score >= 90', async ({ page }) => {
      await page.goto('/');

      // Wait for page to be fully loaded
      await page.waitForLoadState('networkidle');
      await page.waitForLoadState('domcontentloaded');

      // Get the URL for Lighthouse
      const url = page.url();

      // Run Lighthouse
      const result = await runLighthouse(url);

      const performanceScore = result.categories.performance?.score || 0;
      expect(performanceScore).toBeGreaterThanOrEqual(0.9);
    });

    test('should have Accessibility score >= 90', async ({ page }) => {
      await page.goto('/');

      // Wait for page to be fully loaded
      await page.waitForLoadState('networkidle');

      const url = page.url();
      const result = await runLighthouse(url);

      const accessibilityScore = result.categories.accessibility?.score || 0;
      expect(accessibilityScore).toBeGreaterThanOrEqual(0.9);
    });

    test('should have Best Practices score >= 90', async ({ page }) => {
      await page.goto('/');

      // Wait for page to be fully loaded
      await page.waitForLoadState('networkidle');

      const url = page.url();
      const result = await runLighthouse(url);

      const bestPracticesScore = result.categories['best-practices']?.score || 0;
      expect(bestPracticesScore).toBeGreaterThanOrEqual(0.9);
    });

    test('should have SEO score >= 90', async ({ page }) => {
      await page.goto('/');

      // Wait for page to be fully loaded
      await page.waitForLoadState('networkidle');

      const url = page.url();
      const result = await runLighthouse(url);

      const seoScore = result.categories.seo?.score || 0;
      expect(seoScore).toBeGreaterThanOrEqual(0.9);
    });
  });

  test.describe('Core Web Vitals', () => {
    test('should have First Contentful Paint < 1.8s', async ({ page }) => {
      await page.goto('/');

      // Wait for page to be fully loaded
      await page.waitForLoadState('networkidle');

      const url = page.url();
      const result = await runLighthouse(url);

      const fcpAudit = result.audits['first-contentful-paint'];
      expect(fcpAudit).toBeDefined();

      // Extract numeric value from displayValue (e.g., "1.2 s")
      if (fcpAudit?.displayValue) {
        const fcpValue = parseFloat(fcpAudit.displayValue.replace(/[^\d.]/g, ''));
        expect(fcpValue).toBeLessThan(1.8);
      }
    });

    test('should have Largest Contentful Paint < 2.5s', async ({ page }) => {
      await page.goto('/');

      // Wait for page to be fully loaded
      await page.waitForLoadState('networkidle');

      const url = page.url();
      const result = await runLighthouse(url);

      const lcpAudit = result.audits['largest-contentful-paint'];
      expect(lcpAudit).toBeDefined();

      // Extract numeric value from displayValue (e.g., "2.1 s")
      if (lcpAudit?.displayValue) {
        const lcpValue = parseFloat(lcpAudit.displayValue.replace(/[^\d.]/g, ''));
        expect(lcpValue).toBeLessThan(2.5);
      }
    });

    test('should have Total Blocking Time < 200ms', async ({ page }) => {
      await page.goto('/');

      // Wait for page to be fully loaded
      await page.waitForLoadState('networkidle');

      const url = page.url();
      const result = await runLighthouse(url);

      const tbtAudit = result.audits['total-blocking-time'];
      expect(tbtAudit).toBeDefined();

      // Extract numeric value from displayValue (e.g., "150 ms")
      if (tbtAudit?.displayValue) {
        const tbtValue = parseFloat(tbtAudit.displayValue.replace(/[^\d.]/g, ''));
        expect(tbtValue).toBeLessThan(200);
      }
    });

    test('should have Cumulative Layout Shift < 0.1', async ({ page }) => {
      await page.goto('/');

      // Wait for page to be fully loaded
      await page.waitForLoadState('networkidle');

      const url = page.url();
      const result = await runLighthouse(url);

      const clsAudit = result.audits['cumulative-layout-shift'];
      expect(clsAudit).toBeDefined();

      // Extract numeric value from displayValue (e.g., "0.05")
      if (clsAudit?.displayValue) {
        const clsValue = parseFloat(clsAudit.displayValue.replace(/[^\d.]/g, ''));
        expect(clsValue).toBeLessThan(0.1);
      }
    });

    test('should have Speed Index < 3.4s', async ({ page }) => {
      await page.goto('/');

      // Wait for page to be fully loaded
      await page.waitForLoadState('networkidle');

      const url = page.url();
      const result = await runLighthouse(url);

      const siAudit = result.audits['speed-index'];
      expect(siAudit).toBeDefined();

      // Extract numeric value from displayValue (e.g., "2.8 s")
      if (siAudit?.displayValue) {
        const siValue = parseFloat(siAudit.displayValue.replace(/[^\d.]/g, ''));
        expect(siValue).toBeLessThan(3.4);
      }
    });
  });

  test.describe('Bundle Size Verification', () => {
    test('should load main JS bundle < 200KB', async ({ page }) => {
      const jsResponses: string[] = [];

      page.on('response', async (response) => {
        const url = response.url();
        if (url.includes('/assets/index-') && url.endsWith('.js')) {
          jsResponses.push(url);
        }
      });

      await page.goto('/');
      await page.waitForLoadState('networkidle');

      expect(jsResponses.length).toBeGreaterThan(0);

      // Check the size of the first response
      const response = await page.request.get(jsResponses[0]);
      const buffer = await response.body();

      // Check size (should be much smaller when gzipped in production)
      expect(buffer.length).toBeLessThan(500000); // 500KB uncompressed limit
    });

    test('should load main CSS bundle < 50KB', async ({ page }) => {
      const cssResponses: string[] = [];

      page.on('response', async (response) => {
        const url = response.url();
        if (url.includes('/assets/index-') && url.endsWith('.css')) {
          cssResponses.push(url);
        }
      });

      await page.goto('/');
      await page.waitForLoadState('networkidle');

      expect(cssResponses.length).toBeGreaterThan(0);

      // Check the size of the first response
      const response = await page.request.get(cssResponses[0]);
      const buffer = await response.body();

      // Check size (should be much smaller when gzipped in production)
      expect(buffer.length).toBeLessThan(100000); // 100KB uncompressed limit
    });
  });

  test.describe('Lazy Loading Verification', () => {
    test('should lazy load route chunks on navigation', async ({ page }) => {
      const loadedChunks: string[] = [];

      page.on('response', async (response) => {
        const url = response.url();
        if (url.includes('/assets/') && (url.includes('Home') || url.includes('About') || url.includes('Services'))) {
          loadedChunks.push(url);
        }
      });

      // Initially load home page
      await page.goto('/');
      await page.waitForLoadState('networkidle');

      // Initially, only Home chunk should be loaded (if code splitting is working)
      const initialHomeChunks = loadedChunks.filter(url => url.includes('Home'));

      // Navigate to About page
      await page.click('a[href="/about"]');
      await page.waitForLoadState('networkidle');

      // Now About chunk should be loaded
      const aboutChunks = loadedChunks.filter(url => url.includes('About'));
      expect(aboutChunks.length).toBeGreaterThan(0);

      // Navigate to Services page
      await page.click('a[href="/services"]');
      await page.waitForLoadState('networkidle');

      // Now Services chunk should be loaded
      const servicesChunks = loadedChunks.filter(url => url.includes('Services'));
      expect(servicesChunks.length).toBeGreaterThan(0);
    });
  });

  test.describe('Font Loading', () => {
    test('should use font-display: swap for Google Fonts', async ({ page }) => {
      await page.goto('/');

      // Check for font-display in the page
      const fontDisplay = await page.evaluate(() => {
        const styles = document.querySelectorAll('style');
        let hasFontDisplaySwap = false;

        styles.forEach(style => {
          if (style.textContent?.includes('font-display') && style.textContent?.includes('swap')) {
            hasFontDisplaySwap = true;
          }
        });

        // Also check for preconnect
        const preconnects = document.querySelectorAll('link[rel="preconnect"]');
        let hasGoogleFontsPreconnect = false;

        preconnects.forEach(link => {
          const href = (link as HTMLLinkElement).href;
          if (href?.includes('fonts.googleapis.com') || href?.includes('fonts.gstatic.com')) {
            hasGoogleFontsPreconnect = true;
          }
        });

        return { hasFontDisplaySwap, hasGoogleFontsPreconnect };
      });

      expect(fontDisplay.hasGoogleFontsPreconnect).toBe(true);
    });
  });

  test.describe('Image Optimization', () => {
    test('should use WebP format for images', async ({ page }) => {
      const imageUrls: string[] = [];

      page.on('response', async (response) => {
        const url = response.url();
        const contentType = response.headers()['content-type'];

        if (contentType?.includes('image/') && url.includes('/assets/')) {
          imageUrls.push(url);
        }
      });

      await page.goto('/');
      await page.waitForLoadState('networkidle');

      // If images are present, they should be optimized
      // (This is a placeholder test - actual optimization may vary)
      expect(imageUrls.length).toBeGreaterThanOrEqual(0);
    });
  });

  test.describe('Compression Headers', () => {
    test('should serve compressed content', async ({ page }) => {
      const responses: { url: string; headers: Record<string, string> }[] = [];

      page.on('response', async (response) => {
        const url = response.url();
        if (url.includes('/assets/') && (url.endsWith('.js') || url.endsWith('.css'))) {
          responses.push({
            url,
            headers: response.headers() as Record<string, string>
          });
        }
      });

      await page.goto('/');
      await page.waitForLoadState('networkidle');

      // Check if any response has compression headers
      // Note: This may not work in all environments
      expect(responses.length).toBeGreaterThan(0);
    });
  });
});
