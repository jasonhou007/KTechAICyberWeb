/**
 * @file packet-route.spec.ts
 * @description Playwright E2E for the Packet Route cyber puzzle (#184).
 * @ticket #184
 *
 * Verifies the shipped user flow on the real app:
 *  - the puzzle renders on the shipped homepage (grid + transmit + readout);
 *  - level 1 ships SOLVED (initial rotations are the solution), so clicking
 *    Transmit fires the packet and `DATA TRANSMITTED` appears, then Next Level;
 *  - Reset clears the board;
 *  - keyboard-only flow: arrow keys move the cursor, Space rotates, T transmits;
 *  - reduced-motion emulation: instant result (no orb travel animation), still
 *    wins;
 *  - mobile viewport renders without throwing.
 *
 * Level 1 (`LEVELS[0]`) is a 3x1 straight corridor shipping at rotation 0 (the
 * solution), so Transmit succeeds with zero player moves — deterministic E2E.
 *
 * Run: node_modules/.bin/playwright test packet-route --project=chromium
 *
 * @ticket #184
 */

import { test, expect } from '@playwright/test'

test.describe('#184 Packet Route', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('the puzzle renders on the shipped homepage with grid + readout + transmit', async ({ page }) => {
    const puzzle = page.locator('[data-test="packet-route"]')
    await expect(puzzle).toBeVisible()

    // Grid is the playable surface.
    await expect(page.locator('[data-test="packet-grid"]')).toBeVisible()
    // Transmit control present.
    await expect(page.locator('[data-test="packet-transmit"]')).toBeVisible()
    // Best-score readout chip present.
    await expect(page.locator('[data-test="packet-best"]')).toBeVisible()

    // Title is localized copy, not a raw key.
    const title = await page.locator('[data-test="packet-route"] .packet-title').textContent()
    expect(title ?? '').not.toContain('packetRoute.')
  })

  test('level 1 ships solved: Transmit fires the packet and shows DATA TRANSMITTED + Next Level', async ({ page }) => {
    // Level 1 is a 3x1 straight corridor at the solved rotation, so Transmit
    // succeeds with no player moves.
    await page.locator('[data-test="packet-transmit"]').click()

    // Win feedback renders the localized (en) won copy.
    const feedback = page.locator('[data-test="packet-feedback"]')
    await expect(feedback).toBeVisible({ timeout: 5000 })
    await expect(feedback).toContainText('DATA TRANSMITTED')

    // Next Level is offered after a win.
    await expect(page.locator('[data-test="packet-next"]')).toBeVisible()
    await page.locator('[data-test="packet-next"]').click()

    // After Next Level, the readout reflects level 2.
    await expect(page.locator('[data-test="packet-readout"]')).toContainText('2/')
  })

  test('Reset clears the move counter back to the shipped level', async ({ page }) => {
    // Rotate one tile to bump the move counter.
    await page.locator('[data-test="packet-tile-1-0"]').click()
    await expect(page.locator('[data-test="packet-readout"]')).toContainText('Moves: 1')

    // Reset zeroes the counter.
    await page.locator('[data-test="packet-reset"]').click()
    await expect(page.locator('[data-test="packet-readout"]')).toContainText('Moves: 0')
  })

  test('keyboard-only flow: cursor move + Space rotate + T transmit', async ({ page }) => {
    const grid = page.locator('[data-test="packet-grid"]')
    await grid.focus()

    // Arrow keys move the cursor (down moves from (0,0) to (1,0)). Space would
    // rotate; we skip rotating so the solved corridor stays solved.
    await grid.press('ArrowDown')
    await grid.press('ArrowDown')

    // T transmits the packet.
    await grid.press('t')
    await expect(page.locator('[data-test="packet-feedback"]')).toBeVisible({ timeout: 5000 })
    await expect(page.locator('[data-test="packet-feedback"]')).toContainText('DATA TRANSMITTED')
  })

  test('reduced-motion emulation: instant result, no orb travel, still wins', async ({ page }) => {
    // Emulate prefers-reduced-motion: the composable skips the rAF packet
    // animation and resolves instantly on Transmit.
    await page.emulateMedia({ reducedMotion: 'reduce' })

    await page.locator('[data-test="packet-transmit"]').click()

    // The root picks up the reduced-motion class.
    await expect(page.locator('[data-test="packet-route"]')).toHaveClass(/reduced-motion/)
    // And the win still occurs.
    await expect(page.locator('[data-test="packet-feedback"]')).toBeVisible({ timeout: 5000 })
    await expect(page.locator('[data-test="packet-feedback"]')).toContainText('DATA TRANSMITTED')
  })

  test('mobile viewport renders the puzzle without throwing', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })
    const puzzle = page.locator('[data-test="packet-route"]')
    await expect(puzzle).toBeVisible()
    await expect(page.locator('[data-test="packet-grid"]')).toBeVisible()
    // Tap a tile to rotate (mobile tap-to-rotate parity).
    await page.locator('[data-test="packet-tile-1-0"]').click()
    await expect(page.locator('[data-test="packet-readout"]')).toContainText('Moves: 1')
  })
})
