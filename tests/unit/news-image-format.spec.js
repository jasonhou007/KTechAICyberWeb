import { describe, it, expect } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import newsData from '../../src/data/news.json'

/**
 * #278 — News image format integrity gate.
 *
 * 4 of 5 News images in public/images/news/ were SVGs mislabeled as .webp
 * (purpose-built cyberpunk vector art: gradients, grids, neon strokes, <text>
 * labels). The 5th (news-iso27001-official.webp) is a real 258x258 RIFF/WebP.
 *
 * This file-integration test reads the real bytes on disk (NOT mocked) and
 * asserts:
 *  - AC #4 — every news.json image path resolves to a file that exists under
 *    public/ (no 404 at runtime).
 *  - AC #5 — every image's filename extension matches its actual magic-byte
 *    format (RIFF/WEBP -> .webp, <svg / <?xml -> .svg). This is the regression
 *    that catches a future mislabel.
 *  - exactly one News image is a real raster (.webp); the rest are vector
 *    (.svg).
 *
 * It would FAIL on the pre-rename checkout (4 paths end .webp but the files
 * are SVGs) and pass once the files are `git mv`-ed to .svg + news.json is
 * updated.
 */

const ROOT = process.cwd()
const PUBLIC = path.join(ROOT, 'public')

/** Read a file under public/ as a Buffer. */
function readPublic(rel) {
  return fs.readFileSync(path.join(PUBLIC, rel))
}

/**
 * Classify a buffer by its magic bytes. Returns 'webp' | 'svg' | null.
 * - webp: bytes 0..3 === 'RIFF' && bytes 8..11 === 'WEBP'
 * - svg:  starts with '<svg' or '<?xml' (allowing a leading XML prolog)
 */
function classifyFormat(buf) {
  if (buf.length >= 12) {
    const riff = buf.slice(0, 4).toString('latin1')
    const webp = buf.slice(8, 12).toString('latin1')
    if (riff === 'RIFF' && webp === 'WEBP') return 'webp'
  }
  const head = buf.slice(0, 5).toString('latin1')
  if (head.startsWith('<svg')) return 'svg'
  if (head.startsWith('<?xml')) return 'svg'
  return null
}

describe('#278 — News image format integrity', () => {
  it('every news.json image path references an existing file under public/', () => {
    for (const article of newsData) {
      const rel = String(article.image).replace(/^\//, '')
      const abs = path.join(PUBLIC, rel)
      expect(
        fs.existsSync(abs),
        `news.json article ${article.id} image "${article.image}" not found at ${abs}`,
      ).toBe(true)
    }
  })

  it('every news image extension matches its actual magic-byte format', () => {
    for (const article of newsData) {
      const rel = String(article.image).replace(/^\//, '')
      const buf = readPublic(rel)
      const fmt = classifyFormat(buf)
      const ext = path.extname(article.image).toLowerCase()

      if (fmt === 'webp') {
        expect(ext, `article ${article.id}: file is a real RIFF/WebP but path is "${article.image}"`).toBe('.webp')
      } else if (fmt === 'svg') {
        expect(ext, `article ${article.id}: file is an SVG but path is "${article.image}"`).toBe('.svg')
      } else {
        // Fail loudly — catches a future format we have not accounted for.
        throw new Error(
          `article ${article.id}: "${article.image}" has unrecognized magic bytes ` +
          `(first 16 = ${JSON.stringify(buf.slice(0, 16).toString('latin1'))})`,
        )
      }
    }
  })

  it('the real raster is the only non-SVG News image', () => {
    const webpPaths = newsData
      .map((a) => a.image)
      .filter((p) => path.extname(p).toLowerCase() === '.webp')
    const svgPaths = newsData
      .map((a) => a.image)
      .filter((p) => path.extname(p).toLowerCase() === '.svg')

    expect(webpPaths, 'exactly one real raster (.webp) News image').toEqual([
      '/images/news/news-iso27001-official.webp',
    ])
    expect(svgPaths.length, 'the remaining News images are vector (.svg)').toBe(
      newsData.length - 1,
    )
  })
})
