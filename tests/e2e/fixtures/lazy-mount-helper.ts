import type { Page } from '@playwright/test'
import { expect } from '@playwright/test'

/**
 * @file lazy-mount-helper.ts
 * @description Shared E2E helper that mounts a #224 lazy-mounted below-the-fold
 * module BEFORE a spec queries the inner component.
 *
 * Background: #224 wrapped 5 heavy Home modules in <LazySection>, which mounts
 * the inner component only after its sentinel intersects the viewport
 * (IntersectionObserver, rootMargin 200px) OR receives focus. The pre-existing
 * component E2E specs (#161/#179/#180/#182/#186) do page.goto('/') then
 * immediately expect([data-test="..."]).toBeVisible(), assuming eager mount —
 * they time out under lazy-mount because the inner component is not in the DOM
 * yet.
 *
 * Mount strategy — focus-driven (PRIMARY):
 *   LazySection attaches a `focusin` listener to its wrapper element (added in
 *   #224 review commit 5b8731b for WCAG 2.1.1) that mounts the slot when focus
 *   enters the wrapper — the keyboard/AT path that works WITHOUT scrolling.
 *   We set tabindex=-1 on the wrapper, focus it, and dispatch a focusin event.
 *   This mounts the target in place, with zero page scrolling and zero
 *   side-effects on OTHER sections. That matters because:
 *     - Scroll-mounting the bottom-most sections requires a top-to-bottom
 *       scroll cascade (each unmounted wrapper is only a 200px placeholder; the
 *       browser's max-scroll cannot bring the last sentinel within rootMargin
 *       until earlier sections mount and grow the document).
 *     - Mounting sibling sections via that cascade can leave their positioned
 *       children on screen — e.g. NeuralCore's pointer-event-capturing SVG
 *       overlaps NeuralTerminal's `position: fixed` launcher at certain scroll
 *       offsets, intercepting the launcher click.
 *   The focusin path sidesteps both problems: only the target mounts, the page
 *   does not scroll, and no sibling overlays appear.
 *
 * Fallback — scroll cascade:
 *   If the focusin path does not mount the target within a short poll window
 *   (e.g. a future refactor drops the focusin listener), we fall back to the
 *   canonical scroll-into-view + IO-callback pattern validated in
 *   224-home-overhaul.spec.ts "below-the-fold modules" test: scroll the wrapper
 *   center into view with behavior:'instant' and auto-retry on the inner hook.
 *
 * Contract: this ONLY triggers the mount. It does NOT click anything inside the
 * module, change any input, or alter what the calling spec asserts. The
 * component behavior under test is unchanged.
 *
 * Usage:
 *   await mountLazySection(page, 'lazy-cyber-ops-hud', 'cyber-ops-hud')
 *
 * @ticket #224 (blast-radius follow-up)
 */

// The full set of #224 lazy wrappers on Home, in DOM order. Used only by the
// scroll-cascade fallback so it can walk earlier sections (growing the page)
// before scrolling the target.
const LAZY_WRAPPERS = [
  'lazy-neural-terminal',
  'lazy-neural-core',
  'lazy-solution-forge',
  'lazy-cyber-ops-hud',
  'lazy-neon-pulse',
] as const

/**
 * Focus-driven mount: trigger LazySection's focusin listener to mount the slot
 * without scrolling. Resolves true if the target inner hook appeared in the DOM
 * within `timeoutMs`, false otherwise.
 */
async function tryFocusMount(
  page: Page,
  wrapperDataTest: string,
  innerHook: string,
  timeoutMs = 1500,
): Promise<boolean> {
  const wrapper = page.locator(`[data-test="${wrapperDataTest}"]`).first()
  if ((await wrapper.count()) === 0) return false
  // Make the wrapper focusable + dispatch focusin. The LazySection focusin
  // listener (idempotent with the IO path via mountSlot) flips isVisible -> true
  // and unobserves, so the slot renders on the next Vue tick.
  // CRITICAL: pass { preventScroll: true } to focus(). The browser's default
  // focus behavior scrolls the element into view, which (for below-the-fold
  // wrappers) brings sibling sentinels into the IO rootMargin and mounts them
  // too — defeating the whole point of the focus path (mount ONLY the target).
  await wrapper.evaluate((el) => {
    el.setAttribute('tabindex', '-1')
    ;(el as HTMLElement).focus({ preventScroll: true })
    el.dispatchEvent(new FocusEvent('focusin', { bubbles: true }))
  })
  try {
    await page.waitForFunction(
      (hook: string) => document.querySelector(`[data-test="${hook}"]`) !== null,
      innerHook,
      { timeout: timeoutMs },
    )
    return true
  } catch {
    return false
  }
}

/**
 * Scroll-cascade fallback mount: scroll earlier wrappers (to grow the page)
 * then the target wrapper into view, relying on the IntersectionObserver.
 */
async function scrollCascadeMount(
  page: Page,
  wrapperDataTest: string,
  innerHook: string,
): Promise<void> {
  const targetIdx = LAZY_WRAPPERS.indexOf(
    wrapperDataTest as (typeof LAZY_WRAPPERS)[number],
  )
  const walkCount = targetIdx === -1 ? LAZY_WRAPPERS.length : targetIdx + 1
  for (let i = 0; i < walkCount; i++) {
    const w = LAZY_WRAPPERS[i]
    const locator = page.locator(`[data-test="${w}"]`)
    if ((await locator.count()) === 0) continue
    await locator.first().evaluate((el) =>
      el.scrollIntoView({ block: 'center', behavior: 'instant' as ScrollBehavior }),
    )
    try {
      await page.waitForFunction(
        (wrapperSel: string) => {
          const el = document.querySelector(wrapperSel)
          if (!el) return false
          return Array.from(el.children).some(
            (c) => !c.classList.contains('lazy-section__sentinel'),
          )
        },
        `[data-test="${w}"]`,
        { timeout: 2000 },
      )
    } catch {
      // A wrapper that never mounts within the poll window should not abort
      // the cascade — continue so the target still gets its chance.
    }
  }
}

/**
 * Mount the lazy wrapper's inner component, then wait for it to be visible.
 *
 * @param page             Playwright Page.
 * @param wrapperDataTest  The `data-test` attribute on the <LazySection>
 *                         wrapper (e.g. 'lazy-cyber-ops-hud').
 * @param innerHook        The `data-test` attribute the inner component emits
 *                         (e.g. 'cyber-ops-hud', 'neural-launcher').
 */
export async function mountLazySection(
  page: Page,
  wrapperDataTest: string,
  innerHook: string,
): Promise<void> {
  // 1. PRIMARY: focus-driven mount (no scroll, no sibling overlays).
  const focused = await tryFocusMount(page, wrapperDataTest, innerHook)
  // 2. FALLBACK: scroll cascade + IO callback (canonical 224-home-overhaul
  //    pattern), used only if the focusin path did not mount the target.
  if (!focused) {
    await scrollCascadeMount(page, wrapperDataTest, innerHook)
  }
  // 3. Position the target on-screen for any hover/click the spec performs
  //    next — BUT only if the inner element is in normal document flow. The
  //    focusin path mounts without scrolling, so an in-flow section can sit
  //    below the fold and Playwright's actionability checks (hover/click) race
  //    the auto-scroll under parallel workers. A `position: fixed` inner element
  //    (e.g. NeuralTerminal's floating launcher) is always on-screen regardless
  //    of scroll, and scrolling its wrapper would only risk mounting sibling
  //    sections whose positioned children overlay it — so for fixed elements we
  //    skip the scroll entirely.
  const inner = page.locator(`[data-test="${innerHook}"]`).first()
  if ((await inner.count()) > 0) {
    const isFixed = await inner.evaluate((el) => {
      const cs = window.getComputedStyle(el)
      return cs.position === 'fixed' || cs.position === 'sticky'
    })
    if (!isFixed) {
      const wrapper = page.locator(`[data-test="${wrapperDataTest}"]`)
      if ((await wrapper.count()) > 0) {
        await wrapper.first().evaluate((el) =>
          el.scrollIntoView({ block: 'center', behavior: 'instant' as ScrollBehavior }),
        )
      }
    }
  }
  // 4. Auto-retry up to the default expect timeout for the inner component to
  //    be visible. This is the final convergence guarantee and tolerates any
  //    residual Vue render latency without a fixed waitForTimeout.
  await expect(inner).toBeVisible()
}
