/**
 * #252 color-contrast E2E — ticket-named path.
 *
 * IMPORTANT: this top-level e2e/ directory is NOT collected by the canonical
 * playwright.config.ts (testDir = './tests/e2e'). The LIVE, runnable spec is
 * tests/e2e/252-color-contrast.spec.ts — it is the one CI + `npm run test:e2e`
 * execute. This file exists to honor the #252 ticket's literal requested path
 * AND to re-export the canonical tests, so that IF a future config points
 * testDir at e2e/, the same tests run from here without duplication.
 *
 * Why the split: the repo consolidated all collected E2E under tests/e2e/ in
 * #216 (see playwright.config.ts testDir). Top-level e2e/ holds pre-#216
 * legacy specs kept for reference but never collected. We follow the
 * convention rather than introduce a second collected dir.
 */
import './tests/e2e/252-color-contrast.spec.ts'
