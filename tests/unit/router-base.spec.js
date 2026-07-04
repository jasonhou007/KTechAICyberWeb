/**
 * @file router-base.spec.js
 * @description Regression test for the production blank-page bug (#140).
 * @ticket #140
 *
 * The router config lives inline in src/main.js, which is a side-effectful
 * entry file (it creates the app, installs plugins, and mounts to #app) and is
 * excluded from the coverage gate. Importing it in a unit test would try to
 * mount the whole SPA. Instead this test pins the two source-level contracts
 * that fix #140:
 *
 *   1. The router base is set from import.meta.env.BASE_URL (the Vite base
 *      '/KTechAICyberWeb/'). Without it, the router stripped the subpath in
 *      production and matched no route -> blank page.
 *   2. A catch-all (/:pathMatch(.*)*) route exists so unmatched paths render
 *      NotFound instead of a blank <router-view>.
 *
 * If either contract regresses, the production site goes blank again, so this
 * test must fail in that case.
 *
 * #348 update: the entry was refactored from `createApp().use(router).mount()`
 * to the vite-ssg `ViteSSG(App, { routes, base }, fn)` form so the 5 marketing
 * routes can be pre-rendered at build time. The base-prefix contract is
 * PRESERVED — vite-ssg internally creates the router history with the same
 * `base` value (see vite-ssg source: createRouterHistory takes
 * options.base and creates createWebHistory(base)). The contract assertion is
 * updated to recognize EITHER form (the legacy createWebHistory literal OR the
 * vite-ssg options.base form); both preserve the production subpath.
 */
import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

// Vitest runs with cwd at the project root, so resolve from there. (Avoid
// import.meta.url, which is not a file: URL under the happy-dom env.)
const mainSource = readFileSync(
  resolve(process.cwd(), 'src/main.js'),
  'utf8'
)

describe('Router base prefix contract (#140)', () => {
  it('sets the router base from import.meta.env.BASE_URL', () => {
    // The bug was the router history created with no base argument. The fix
    // passes the Vite base. Assert the literal `import.meta.env.BASE_URL` is
    // the value passed to whichever form the entry uses:
    //   - Pre-#348: createWebHistory(import.meta.env.BASE_URL)
    //   - Post-#348 (vite-ssg): ViteSSG(App, { routes, base: import.meta.env.BASE_URL }, fn)
    // Both forms preserve the production subpath '/KTechAICyberWeb/'.
    //
    // We strip line/block comments first so the contract is checked against
    // code, not prose (the comments explaining the bug also mention the
    // no-arg form).
    const codeOnly = mainSource
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .replace(/\/\/.*$/gm, '')
    // The base value MUST be import.meta.env.BASE_URL in some call shape.
    expect(codeOnly).toMatch(/import\.meta\.env\.BASE_URL/)
    // The regression shapes — a history/router created with NO base argument.
    // `createWebHistory()` (legacy form, no arg) regressed #140.
    // `base: ''` or omitted base (vite-ssg form) would also regress it.
    expect(codeOnly).not.toMatch(/createWebHistory\(\s*\)/)
    expect(codeOnly).not.toMatch(/base:\s*['"]['"]/)
  })

  it('registers a catch-all NotFound route', () => {
    // vue-router 4 catch-all syntax. Prevents blank page on unmatched paths.
    expect(mainSource).toMatch(/pathMatch\(\.\*\)\*/)
    expect(mainSource).toMatch(/name:\s*['"]not-found['"]/)
    expect(mainSource).toMatch(/NotFound/)
  })
})
