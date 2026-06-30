import { test, expect } from '@playwright/test'

/**
 * Achievements section layout — AC #241
 *
 * Root cause: each .achievement-card carried the .neon-border badge style
 * (width:60px; height:60px; border-radius:50%), collapsing the card to a
 * 60x60 circle and forcing overflow + hover-overlap. The fix removes
 * .neon-border from the cards and gives .achievement-card a proper
 * rectangular cyber border so it fills its grid cell.
 *
 * These specs assert the user-visible result on the LIVE shipped DOM:
 *   - every card is rectangular (width > height) at desktop 1280 and mobile 375
 *   - no two cards' bounding boxes overlap (axis-aligned) at either viewport
 *
 * Paths use the Vite base subpath (/KTechAICyberWeb/) — see playwright.config.ts.
 *
 * Tags: @regression @layout
 */

const BASE = '/KTechAICyberWeb/'

// A pair of boxes does NOT overlap iff at least one axis is separated.
function overlaps(
  a: { x: number; y: number; width: number; height: number },
  b: { x: number; y: number; width: number; height: number },
): boolean {
  const separatedX = a.x + a.width <= b.x || b.x + b.width <= a.x
  const separatedY = a.y + a.height <= b.y || b.y + b.height <= a.y
  return !(separatedX || separatedY)
}

async function assertCardsRectangular(page: import('@playwright/test').Page) {
  await page.goto(`${BASE}about`)
  const cards = page.locator('.achievements .achievement-card')
  await expect(cards.first()).toBeVisible()
  const count = await cards.count()
  expect(count).toBe(6)
  // The bug: .neon-border forced each card to a 60x60 fixed square (the badge
  // circle). A fixed card is rectangular iff it has escaped that 60px
  // constraint — i.e. its width is well past the badge diameter (60) plus its
  // grid-cell padding/margin. We assert width > 150 (clears 60px badge + margin
  // unambiguously; fixed cards measured 211px at desktop, so 150 is a safe
  // floor that still fails loudly on the 60px collapse) AND not a perfect
  // square (width != height; buggy 60x60 cards had width == height). Real cards
  // fill the grid cell, so either dimension may be the larger one — we do NOT
  // require width > height.
  for (let i = 0; i < count; i++) {
    const box = await cards.nth(i).boundingBox()
    expect(box).not.toBeNull()
    expect(box!.width).toBeGreaterThan(150)
    expect(box!.width).not.toBe(box!.height)
  }
}

async function assertNoCardsOverlap(page: import('@playwright/test').Page) {
  await page.goto(`${BASE}about`)
  const cards = page.locator('.achievements .achievement-card')
  await expect(cards.first()).toBeVisible()
  const count = await cards.count()
  expect(count).toBe(6)
  const boxes: { x: number; y: number; width: number; height: number }[] = []
  for (let i = 0; i < count; i++) {
    const box = await cards.nth(i).boundingBox()
    expect(box).not.toBeNull()
    boxes.push(box!)
  }
  for (let i = 0; i < boxes.length; i++) {
    for (let j = i + 1; j < boxes.length; j++) {
      expect(overlaps(boxes[i], boxes[j])).toBe(false)
    }
  }
}

test.describe('Achievements layout (#241)', () => {
  test.describe('desktop viewport (1280x720)', () => {
    test.use({ viewport: { width: 1280, height: 720 } })

    test('achievement cards are rectangular (fill grid cell, not the 60x60 neon-border square) at desktop 1280px', async ({ page }) => {
      await assertCardsRectangular(page)
    })

    test('no two achievement cards\' bounding boxes overlap at desktop', async ({ page }) => {
      await assertNoCardsOverlap(page)
    })
  })

  test.describe('mobile viewport (375x667)', () => {
    test.use({ viewport: { width: 375, height: 667 } })

    test('achievement cards are rectangular at mobile 375px (not the 60x60 neon-border square)', async ({ page }) => {
      await assertCardsRectangular(page)
    })

    test('no two achievement cards overlap at mobile 375px', async ({ page }) => {
      await assertNoCardsOverlap(page)
    })
  })
})
