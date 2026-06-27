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
 *   1. createWebHistory is called with import.meta.env.BASE_URL (the Vite base
 *      '/KTechAICyberWeb/'). Without it, the router stripped the subpath in
 *      production and matched no route -> blank page.
 *   2. A catch-all (/:pathMatch(.*)*) route exists so unmatched paths render
 *      NotFound instead of a blank <router-view>.
 *
 * If either contract regresses, the production site goes blank again, so this
 * test must fail in that case.
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
  it('creates the history with import.meta.env.BASE_URL', () => {
    // The bug was createWebHistory invoked with no argument. The fix passes
    // the Vite base. Assert the call shape directly so a regression (dropping
    // the argument) fails this test. We strip line/block comments first so the
    // contract is checked against code, not prose (the comments explaining the
    // bug also mention the no-arg form).
    const codeOnly = mainSource
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .replace(/\/\/.*$/gm, '')
    expect(codeOnly).toContain('createWebHistory(import.meta.env.BASE_URL)')
    expect(codeOnly).not.toMatch(/createWebHistory\(\s*\)/)
  })

  it('registers a catch-all NotFound route', () => {
    // vue-router 4 catch-all syntax. Prevents blank page on unmatched paths.
    expect(mainSource).toMatch(/pathMatch\(\.\*\)\*/)
    expect(mainSource).toMatch(/name:\s*['"]not-found['"]/)
    expect(mainSource).toMatch(/NotFound/)
  })
})
