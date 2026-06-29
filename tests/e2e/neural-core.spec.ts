/**
 * @file neural-core.spec.ts
 * @description Playwright E2E for the AI Core neural-network visualizer (#179).
 *
 * Verifies the shipped user flow on the real app:
 *  - hovering a node highlights >=1 connected synapse + reveals a tooltip, and
 *  - clicking Run Inference propagates a pulse and lands a decoded readout
 *    whose text is a localized verdict (APPROVE/REVIEW/FLAG) + a confidence
 *    percentage, never a raw i18n key.
 *
 * Run: node_modules/.bin/playwright test neural-core --project=chromium
 * (playwright.config.ts sets baseURL = http://localhost:3000/KTechAICyberWeb)
 *
 * @ticket #179
 */

import { test, expect } from '@playwright/test'
import { mountLazySection } from './fixtures/lazy-mount-helper'

test.describe('#179 AI Core neural-network visualizer', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    // #224: NeuralCore is lazy-mounted inside <LazySection>; scroll it into
    // view so the inner component mounts before any query. Behavior unchanged.
    await mountLazySection(page, 'lazy-neural-core', 'neural-core')
  })

  test('the neural core renders on the shipped homepage', async ({ page }) => {
    const core = page.locator('[data-test="neural-core"]')
    await expect(core).toBeVisible()
    // The graph degrades on mobile (max-width: 768px) from the 13-node desktop
    // layout to a 7-node mobile layout (NeuralCore mobile-degrade, AC4). The
    // node-count floor must therefore track the viewport, otherwise the same
    // assertion that passes on Desktop Chrome fails on Mobile Chrome.
    const vw = page.viewportSize()
    const isMobile = !!vw && vw.width <= 768
    const minNodes = isMobile ? 6 : 12
    // >=3 labeled layers on both viewports.
    const layerCount = await page.locator('[data-test="neural-layer-label"]').count()
    expect(layerCount).toBeGreaterThanOrEqual(3)
    const nodeCount = await page.locator('[data-test="neural-node"]').count()
    expect(nodeCount).toBeGreaterThanOrEqual(minNodes)
    const synapseCount = await page.locator('[data-test="neural-synapse"]').count()
    expect(synapseCount).toBeGreaterThanOrEqual(1)
  })

  test('hovering a node highlights connected synapses + shows a tooltip', async ({ page }) => {
    const node = page.locator('[data-test="neural-node"]').first()
    await node.hover()

    // At least one synapse gains the highlighted class.
    const highlighted = page.locator('[data-test="neural-synapse"].highlighted')
    await expect(highlighted.first()).toBeVisible()
    const highlightedCount = await highlighted.count()
    expect(highlightedCount).toBeGreaterThanOrEqual(1)

    // The tooltip is visible and carries a localized layer label (not a raw
    // i18n key).
    const tooltip = page.locator('[data-test="neural-tooltip"]')
    await expect(tooltip).toBeVisible()
    const text = await tooltip.textContent()
    expect(text).toBeTruthy()
    expect(text!).not.toContain('neural.')
  })

  test('Run Inference propagates a pulse and decodes a benign verdict readout', async ({ page }) => {
    const runButton = page.locator('[data-test="neural-run-inference"]')
    await expect(runButton).toBeVisible()
    await runButton.click()

    // The readout renders after the inference run completes.
    const readout = page.locator('[data-test="neural-readout"]')
    await expect(readout).toBeVisible({ timeout: 5000 })

    const text = (await readout.textContent()) ?? ''
    // Localized verdict word from the deterministic pool.
    expect(/APPROVE|REVIEW|FLAG/.test(text)).toBe(true)
    // Confidence percentage present.
    expect(text).toContain('%')
    // Never a raw i18n key.
    expect(text).not.toContain('neural.readout')
  })

  test('keyboard-only: focus a node, then focus the Run Inference button + Enter', async ({ page }) => {
    // Nodes are keyboard-reachable via tabindex=0. Focus the first node
    // directly (we are not Tab-walking from the page top, which a pre-existing
    // Header focus-trap loops within the nav) and assert it is focusable.
    const node = page.locator('[data-test="neural-node"]').first()
    await node.focus()
    await expect(node).toBeFocused()

    // The Run Inference button is keyboard-operable: focus + Enter triggers it.
    const runButton = page.locator('[data-test="neural-run-inference"]')
    await runButton.focus()
    await expect(runButton).toBeFocused()
    await page.keyboard.press('Enter')

    const readout = page.locator('[data-test="neural-readout"]')
    await expect(readout).toBeVisible({ timeout: 5000 })
    const text = (await readout.textContent()) ?? ''
    expect(/APPROVE|REVIEW|FLAG/.test(text)).toBe(true)
  })
})
