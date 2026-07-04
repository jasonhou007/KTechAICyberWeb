/**
 * @file tests/unit/346-perf-news-no-loading-delay.spec.js
 * @description Source-of-fix gate for Issue #346 Commit 2 — remove the
 * artificial 300ms loading-delay `setTimeout` in /news.
 *
 * Diagnosis (from #346 mobile LCP capture): /news LCP=3778ms (score 86).
 * The /news route gates its first paint behind `setTimeout(() => {
 *   articles.value = newsData; isLoading.value = false }, 300)` — a
 * "simulated loading delay for better UX" that adds a flat 300ms to the
 * LCP critical path with zero UX benefit (the skeleton slot in NewsList
 * only matters when there is real async latency to mask; news.json is a
 * static import, so it resolves synchronously).
 *
 * The fix: initialize `articles` and `isLoading` synchronously. The refs
 * stay (NewsList's skeleton slot still uses isLoading as a prop, and tests
 * may assert its shape), but no `setTimeout` may flip them.
 *
 * @ticket #346
 */
import { describe, it, expect, beforeAll } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(__dirname, '..', '..')
const NEWS_PATH = resolve(ROOT, 'src/views/News.vue')

describe('#346 Commit 2 — News.vue has no artificial setTimeout loading delay', () => {
  let src
  let stripped
  beforeAll(() => {
    src = readFileSync(NEWS_PATH, 'utf-8')
    stripped = src
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .replace(/\/\/.*$/gm, '')
  })

  it('no setTimeout(...isLoading...) — no artificial delay flipping isLoading', () => {
    // A setTimeout whose body (within ~200 chars, multi-line) assigns isLoading.
    const isLoadingDelay = /setTimeout\([\s\S]{0,200}isLoading/
    expect(
      stripped,
      'News.vue has a setTimeout that flips isLoading — that 300ms delay is on the LCP critical path (#346)',
    ).not.toMatch(isLoadingDelay)
  })

  it('no setTimeout(...articles.value = ...) — no artificial delay before data', () => {
    const articlesDelay = /setTimeout\([\s\S]{0,200}articles\.value\s*=/
    expect(
      stripped,
      'News.vue has a setTimeout that assigns articles.value — that 300ms delay is on the LCP critical path (#346)',
    ).not.toMatch(articlesDelay)
  })

  it('still references articles and isLoading (refs stay for skeleton semantics)', () => {
    expect(stripped, 'articles ref must remain').toMatch(/\barticles\b/)
    expect(stripped, 'isLoading ref must remain').toMatch(/\bisLoading\b/)
  })

  it('still imports newsData (data source stays)', () => {
    expect(stripped, 'newsData import must remain').toMatch(/import\s+newsData\s+from/)
  })
})
