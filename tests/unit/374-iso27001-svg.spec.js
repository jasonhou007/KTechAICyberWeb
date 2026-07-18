/**
 * @file tests/unit/374-iso27001-svg.spec.js
 * @description Contract gate for Issue #374: replace the ISO 27001 news
 * article image (news-iso27001-official.webp, a 258x258 raster) with a
 * purpose-built SVG illustration (iso27001-shield.svg, 800x450) matching the
 * sibling cyberpunk news SVGs (fintech-conference.svg / iso-certification.svg
 * house conventions: width/height root attrs, dark gradient background, cyan
 * grid pattern, neon strokes, Arial <text>).
 *
 * The webp raster is deleted in this same PR; a grep-gate below asserts no
 * live source file still references it.
 *
 * @ticket #374
 */
import { describe, it, expect } from 'vitest'
import { readFileSync, existsSync, readdirSync, statSync } from 'node:fs'
import { resolve, dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(__dirname, '..', '..')
const SVG_PATH = resolve(ROOT, 'public/images/news/iso27001-shield.svg')
const NEWS_JSON_PATH = resolve(ROOT, 'src/data/news.json')

const SVG_REL_PATH = '/images/news/iso27001-shield.svg'
const REMOVED_BASENAME = 'news-iso27001-official'

/** Recursively collect files under a directory. */
function collectFiles(dir) {
  const out = []
  for (const entry of readdirSync(dir)) {
    if (entry === 'node_modules' || entry.startsWith('.')) continue
    const abs = join(dir, entry)
    if (statSync(abs).isDirectory()) out.push(...collectFiles(abs))
    else out.push(abs)
  }
  return out
}

describe('#374 — iso27001-shield.svg illustration', () => {
  it('the SVG file exists and starts with <svg or <?xml (magic-byte format gate)', () => {
    expect(existsSync(SVG_PATH), `missing ${SVG_PATH}`).toBe(true)
    const head = readFileSync(SVG_PATH, 'utf-8').slice(0, 5)
    expect(
      head.startsWith('<svg') || head.startsWith('<?xml'),
      `iso27001-shield.svg does not look like an SVG (head=${JSON.stringify(head)})`,
    ).toBe(true)
  })

  it('the SVG root declares width="800" height="450" (sibling house convention, no viewBox)', () => {
    const src = readFileSync(SVG_PATH, 'utf-8')
    expect(src).toMatch(/<svg[^>]*width="800"/)
    expect(src).toMatch(/<svg[^>]*height="450"/)
  })

  it('the SVG uses the house palette and carries the ISO 27001 label', () => {
    const src = readFileSync(SVG_PATH, 'utf-8')
    expect(src).toContain('#0a0a0f')
    expect(src).toContain('#1a1a2e')
    expect(src).toContain('#00f0ff')
    expect(src).toContain('ISO 27001')
  })

  it('news.json article ktech-achieves-iso27001-certification points at the new SVG', () => {
    const news = JSON.parse(readFileSync(NEWS_JSON_PATH, 'utf-8'))
    const article = news.find((a) => a.slug === 'ktech-achieves-iso27001-certification')
    expect(article, 'iso27001 article not found in news.json').toBeTruthy()
    expect(article.image).toBe(SVG_REL_PATH)
  })

  it('grep-gate: no live source file references the removed news-iso27001-official raster', () => {
    const targets = [
      ...collectFiles(resolve(ROOT, 'src')),
      ...collectFiles(resolve(ROOT, 'tests')),
      resolve(ROOT, 'index.html'),
    ]
    const offenders = []
    for (const file of targets) {
      // This spec names the removed basename in its own assertions by design.
      if (file === fileURLToPath(import.meta.url)) continue
      const src = readFileSync(file, 'utf-8')
      // The 334 spec's fixture-comment exclusion: it mentions the old name in
      // a comment explaining the fixture replacement, not as a live path.
      const lines = src.split('\n').filter((line, i) => {
        if (!line.includes(REMOVED_BASENAME)) return false
        if (file.endsWith('334-perf-image-priority.spec.js')) {
          const trimmed = line.trim()
          if (trimmed.startsWith('//') || trimmed.startsWith('*')) return false
        }
        return true
      })
      if (lines.length > 0) offenders.push(`${file}: ${lines.length} hit(s)`)
    }
    expect(
      offenders,
      `stale references to ${REMOVED_BASENAME} found:\n${offenders.join('\n')}`,
    ).toEqual([])
  })
})
