/**
 * @file 475-services-self-driving.spec.ts
 * @description Playwright E2E for the Services Self-Driving demo (#475).
 *
 * Verifies the shipped user flow on the Services page:
 *  - AUTO-PLAY with ZERO interaction: load /services, do not click/hover/scroll,
 *    and assert data-current-phase changes AND data-loop-iteration increments
 *    on its own (service-specific AI pipeline).
 *  - REDUCED MOTION: under prefers-reduced-motion: reduce the demo renders the
 *    static key-frame summary (data-static="true") and the phase does NOT
 *    change over time.
 *  - CORRECT PAGE: the ambient layer is present on /services only (not global).
 *  - 6 PHASES: the service pipeline has 6 phases (not 8 like self-driving).
 *  - VISIBILITY: the demo is in-flow page content, not an occluded background.
 *
 * Run: node_modules/.bin/playwright test 475-services-self-driving --project=chromium
 *
 * @ticket #475
 */

import { test, expect } from '@playwright/test'

const BASE = '/KTechAICyberWeb/'

test.describe('#475 Services Self-Driving ambient demo', () => {
  test('auto-plays with ZERO interaction: phase changes + loop iteration increments', async ({ page }) => {
    // Load /services and wait for network idle
    await page.goto(`${BASE}services`, { waitUntil: 'networkidle' })

    const root = page.locator('[data-servicesselfdriving-root]')
    await expect(root).toBeVisible()

    // Snapshot the initial phase + iteration with no interaction.
    const firstPhase = await root.getAttribute('data-current-phase')
    const firstIter = await root.getAttribute('data-loop-iteration')
    expect(firstPhase).toBeTruthy()

    // Poll for a phase change within ~8s (service phase duration similar to self-driving)
    await expect
      .poll(async () => await root.getAttribute('data-current-phase'), {
        timeout: 8000,
      })
      .not.toBe(firstPhase)

    // The loop iteration must also increment (proves seamless wrap)
    await expect
      .poll(async () => Number(await root.getAttribute('data-loop-iteration')), {
        timeout: 30000,
      })
      .toBeGreaterThan(Number(firstIter))
  })

  test('reduced motion: renders the static key-frame and the phase does NOT change', async ({ browser }) => {
    const context = await browser.newContext({
      reducedMotion: 'reduce',
    } as any)
    const page = await context.newPage()
    await page.goto(`${BASE}services`, { waitUntil: 'networkidle' })

    const root = page.locator('[data-servicesselfdriving-root]')
    await expect(root).toBeVisible()

    // The static branch is active
    await expect(root).toHaveAttribute('data-static', 'true')

    // Snapshot the phase; it must NOT change over the next few seconds
    const phase = await root.getAttribute('data-current-phase')
    expect(phase).toBeTruthy()
    await page.waitForTimeout(5000)
    const laterPhase = await root.getAttribute('data-current-phase')
    expect(laterPhase).toBe(phase)

    await context.close()
  })

  test('page-specific: the ambient layer is present on /services (not global like self-driving)', async ({ page }) => {
    // Services page should have the services self-driving demo
    await page.goto(`${BASE}services`, { waitUntil: 'networkidle' })
    await expect(page.locator('[data-servicesselfdriving-root]')).toBeVisible()

    // Home page should have the self-driving demo (not services demo)
    await page.goto(BASE, { waitUntil: 'networkidle' })
    await expect(page.locator('[data-selfdriving-root]')).toBeVisible()
    await expect(page.locator('[data-servicesselfdriving-root]')).not.toBeVisible()

    // About page should have the self-driving demo (not services demo)
    await page.goto(`${BASE}about`, { waitUntil: 'networkidle' })
    await expect(page.locator('[data-selfdriving-root]')).toBeVisible()
    await expect(page.locator('[data-servicesselfdriving-root]')).not.toBeVisible()
  })

  test('service-specific pipeline: 6 phases (not 8 like self-driving)', async ({ page }) => {
    await page.goto(`${BASE}services`, { waitUntil: 'networkidle' })

    const root = page.locator('[data-servicesselfdriving-root]')
    await expect(root).toBeVisible()

    // Count pipeline cards - should be 6 for services pipeline
    const cards = root.locator('.pipeline-card')
    await expect(cards).toHaveCount(6)

    // Verify phase IDs are service-specific (should not include dev-pipeline phases)
    const phase = await root.getAttribute('data-current-phase')
    expect(phase).not.toBe('intake')
    expect(phase).not.toBe('triage')
    // Service phases should be one of the 6 defined phases
    const validPhases = ['dataIngestion', 'aiAnalysis', 'pipelineValidation', 'serviceExecution', 'resultDelivery', 'serviceComplete']
    expect(validPhases).toContain(phase)
  })

  test('visibility: the demo is in-flow page content, not an occluded background layer', async ({ page }) => {
    await page.goto(`${BASE}services`, { waitUntil: 'networkidle' })
    const root = page.locator('[data-servicesselfdriving-root]')
    await expect(root).toBeVisible()

    // Wait for the FSM to mount + the first phase to render the cards
    await page.waitForTimeout(2000)

    // Verify the demo is in document flow (not a fixed background)
    const flow = await root.evaluate((el) => {
      const cs = window.getComputedStyle(el as HTMLElement)
      const r = (el as HTMLElement).getBoundingClientRect()
      const position = cs.position
      const inFlow = position === 'static' || position === 'relative'
      return { position, inFlow, top: r.top, left: r.left, width: r.width, height: r.height }
    })
    expect(flow.inFlow).toBe(true)
    expect(flow.height).toBeGreaterThan(0)
    expect(flow.width).toBeGreaterThan(0)

    // The demo root's own center must be hit-testable as inside the demo
    await root.scrollIntoViewIfNeeded()
    const rootHitInDemo = await root.evaluate((el) => {
      const r = (el as HTMLElement).getBoundingClientRect()
      const top = document.elementFromPoint(
        Math.round(r.left + r.width / 2),
        Math.round(r.top + r.height / 2),
      )
      return top ? !!(el as HTMLElement).contains(top) : false
    })
    expect(rootHitInDemo).toBe(true)

    // The demo must render at least one pipeline card
    const cardCount = await root.locator('.pipeline-card').count()
    expect(cardCount).toBeGreaterThan(0)
  })

  test('has proper aria labeling for landmark navigation', async ({ page }) => {
    await page.goto(`${BASE}services`, { waitUntil: 'networkidle' })

    const root = page.locator('[data-servicesselfdriving-root]')
    await expect(root).toBeVisible()

    // Should have aria-label for screen readers
    const ariaLabel = await root.getAttribute('aria-label')
    expect(ariaLabel).toBeTruthy()
    expect(ariaLabel).not.toContain('servicesSelfDriving')
  })

  test('renders scanlines containment within the demo scope', async ({ page }) => {
    await page.goto(`${BASE}services`, { waitUntil: 'networkidle' })

    const root = page.locator('[data-servicesselfdriving-root]')
    await expect(root).toBeVisible()

    // The scanlines-scope wrapper should exist
    const scope = root.locator('.services-self-driving-scanlines-scope')
    await expect(scope).toBeVisible()

    // Scanlines should be contained within the scope
    await expect(scope.locator('.scanlines')).toHaveCount(1)
  })

  test('service-specific heading and content render correctly', async ({ page }) => {
    await page.goto(`${BASE}services`, { waitUntil: 'networkidle' })

    const root = page.locator('[data-servicesselfdriving-root]')
    await expect(root).toBeVisible()

    // Service-specific heading should exist
    const heading = root.locator('.services-self-driving-heading')
    await expect(heading).toBeVisible()
    const headingText = await heading.textContent()
    expect(headingText).toBeTruthy()
    expect(headingText).not.toContain('.')
    // Should contain service/AI related terms
    const lower = headingText!.toLowerCase()
    expect(
      lower.includes('pipeline') || lower.includes('service') || lower.includes('ai')
    ).toBe(true)
  })
})
