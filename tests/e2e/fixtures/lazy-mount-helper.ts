import type { Page, Locator } from '@playwright/test'
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

/**
 * Force-click a static button/radio whose SIBLING infinite animation (canvas,
 * CSS spin, metric ticker) keeps webkit/Mobile Safari's actionability stability
 * check ("element is not stable") timing out, and do so deterministically.
 *
 * Background (#244): plain `click()` times out at the stability gate because the
 * target's bounding box never stops moving (a sibling animates forever). Plain
 * `click({ force: true })` skips that gate — but it also skips Playwright's
 * retry-on-no-effect loop, so under combined-suite browser-engine load the
 * synthetic dispatch is occasionally dropped or the async Vue handler resolves
 * just past the assertion window, producing a flaky failure. This helper keeps
 * `force: true` (so the impossible stability gate is never entered) AND wraps it
 * in a small retry loop that re-clicks until the caller-supplied `effect`
 * predicate holds — eliminating both failure modes.
 *
 * Contract: this ONLY changes HOW the click is dispatched (forced + retried), not
 * WHAT the calling spec asserts. The `effect` predicate MUST be the exact
 * user-visible consequence the click is supposed to produce (result card
 * rendered, toast raised, radio checked, status flipped) — the same condition the
 * spec would assert on the next line anyway. Behaviour under test is unchanged.
 *
 * @param locator  The static click target (button/radio) — must already be
 *                 attached+visible (call `expect(locator).toBeVisible()` first).
 * @param effect   Async predicate returning true once the click's user-visible
 *                 effect has landed. Re-checked after every attempt.
 * @param attempts   Max force-click attempts. Each attempt force-clicks then
 *                   waits `settleMs` for the async handler + Vue render before
 *                   re-checking `effect`. Default 4.
 * @param settleMs   Per-attempt settle gap (ms) before re-checking `effect`.
 *                   Default 700 (cheap idempotent toggles: chips, radios,
 *                   pulse-button, dismiss, tabs). Use ~2500 for EXPENSIVE async
 *                   actions whose effect takes that long to converge (forge
 *                   re-forge, reroll, AudioContext engage) — a gap shorter than
 *                   the action's convergence time makes each retry RE-TRIGGER the
 *                   action (re-clicking reroll restarts its ~2s re-forge), so the
 *                   effect never lands; a gap longer than convergence lets the
 *                   first click's effect complete before any retry is considered.
 * @param nativeFallback When true (default false), on every other attempt ALSO
 *                       fire a native DOM `el.click()`. Required for Mobile Safari
 *                       targets whose Vue `@click.stop` handler does not receive
 *                       Playwright's synthetic force-click (verified: HUD tabs).
 *                       Do NOT enable for expensive idempotent actions (forge
 *                       reroll) — the native re-click re-triggers the async cycle
 *                       each retry and prevents convergence; the HUD tabs (a
 *                       cheap emit→prop update) tolerate it fine.
 * @throws if `effect` never holds within `attempts` tries.
 */
export async function forceClick(
  locator: Locator,
  effect: () => Promise<boolean>,
  attempts = 4,
  settleMs = 700,
  nativeFallback = false,
): Promise<void> {
  for (let i = 0; i < attempts; i++) {
    // force: true = skip the actionability stability gate (the whole point — the
    // sibling animation makes it impossible). Swallow per-attempt click errors so
    // a transient dispatch miss does not abort; the retry + effect predicate is
    // the source of truth.
    await locator.click({ force: true }).catch(() => {})
    // Settle gap: lets the async click handler resolve and Vue re-render before
    // re-checking. MUST be ≥ the action's convergence time for expensive async
    // actions (see settleMs doc above) or each retry re-triggers it.
    await locator.page().waitForTimeout(settleMs)
    if (await effect()) return
    // Mobile Safari fallback (#244, opt-in): Playwright's force-click dispatches
    // a synthetic pointer-event sequence that on Mobile Safari does NOT reliably
    // produce the trusted `click` a Vue `@click.stop` handler listens for
    // (verified: a native el.click() flips the HUD event-feed tab where
    // force-click does not). When `nativeFallback` is set, on every other
    // attempt also fire a native DOM click() so the Vue handler is reached
    // regardless of the engine's synthetic-event quirks. OPT-IN because a native
    // click() on an idempotent-but-expensive action (e.g. forge reroll) would
    // re-trigger its full async cycle each retry and never converge; the HUD
    // tabs (a cheap emit→prop update) tolerate it fine.
    if (nativeFallback && i % 2 === 1) {
      await locator.evaluate((el) => (el as HTMLElement).click()).catch(() => {})
      await locator.page().waitForTimeout(settleMs)
      if (await effect()) return
    }
  }
  throw new Error(
    `forceClick: effect not observed after ${attempts} attempts (target may be unresponsive)`,
  )
}
