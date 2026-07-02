/**
 * #301 — Per-route og/twitter image asset-existence guard.
 *
 * seo.js (lines 130-156) already references 11 per-route image URLs:
 *   og-image-{home,about,news,privacy,terms,default}.jpg      (6 files)
 *   twitter-image-{home,about,news,privacy,terms}.jpg         (5 files)
 *
 * twitter-image-default.jpg is INTENTIONALLY ABSENT — seo.js:175 falls the
 * unknown-route twitter image back to og-image-default.jpg (asserted in
 * seo.test.ts:225-226). Do NOT add twitter-image-default.jpg here.
 *
 * This guard opens each JPG, verifies the JPEG magic bytes (FF D8), then parses
 * the SOF0 (0xFFC0) marker to read the 2-byte height + width and asserts each
 * file is exactly 1200x630. The point is to fail loudly if a generation /
 * deploy step regresses dimensions or drops a file — `existsSync` alone would
 * not catch a wrong-size or zero-byte stub.
 *
 * No native deps (no sharp/PIL) — a ~15-line inline JPEG header parser.
 */
import { describe, it, expect } from 'vitest'
import { readFileSync } from 'fs'
import { resolve } from 'path'

// vitest runs from the repo root, so process.cwd() is the website root.
const publicDir = resolve(process.cwd(), 'public')

const EXPECTED_FILES = [
  // 6 og-images
  'og-image-home.jpg',
  'og-image-about.jpg',
  'og-image-news.jpg',
  'og-image-privacy.jpg',
  'og-image-terms.jpg',
  'og-image-default.jpg',
  // 5 twitter-images (NO twitter-image-default.jpg — orphan, see header)
  'twitter-image-home.jpg',
  'twitter-image-about.jpg',
  'twitter-image-news.jpg',
  'twitter-image-privacy.jpg',
  'twitter-image-terms.jpg'
]

/**
 * Inline JPEG dimension parser. Walks the JPEG markers from the SOI until it
 * finds the first SOF marker (Start Of Frame, baseline 0xFFC0..0xFFCF excluding
 * the 4-byte-marker exceptions 0xFFC4/C8/CC which are DHT/JPG/DAC not frames),
 * then reads the 2-byte big-endian height + width immediately after.
 *
 * Returns { width, height }.
 */
function jpegDimensions(buf) {
  if (!(buf[0] === 0xff && buf[1] === 0xd8)) {
    throw new Error('not a JPEG (missing FF D8 SOI magic)')
  }
  let i = 2
  while (i < buf.length) {
    // every marker is 0xFF followed by a non-0xFF byte
    if (buf[i] !== 0xff) {
      i += 1
      continue
    }
    let marker = buf[i + 1]
    // skip fill bytes 0xFF
    while (marker === 0xff) marker = buf[i + 1]
    i += 2

    // SOI / EOI / RSTn have no length payload
    if (marker === 0xd8 || marker === 0xd9 || (marker >= 0xd0 && marker <= 0xd7)) {
      continue
    }

    // SOFn (Start Of Frame, baseline + progressive): 0xFFC0..0xFFCF, but
    // 0xC4=DHT, 0xC8=JPG, 0xCC=DAC are not frames.
    if (marker >= 0xc0 && marker <= 0xcf && marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc) {
      // layout after 0xFFC0: [len:2][precision:1][height:2][width:2]
      const height = buf.readUInt16BE(i + 3)
      const width = buf.readUInt16BE(i + 5)
      return { width, height }
    }

    // otherwise this marker carries a 2-byte big-endian length (incl. the 2 len bytes)
    const segLen = buf.readUInt16BE(i)
    i += segLen
  }
  throw new Error('no SOF marker found in JPEG')
}

describe('#301 per-route og/twitter image assets', () => {
  it('has exactly 11 expected per-route image files (no more, no less)', () => {
    // This documents the contract inline; the it.each below opens each file.
    expect(EXPECTED_FILES).toHaveLength(11)
    // unique
    expect(new Set(EXPECTED_FILES).size).toBe(11)
  })

  it.each(EXPECTED_FILES)('$s exists in public/ as a 1200x630 JPEG', (filename) => {
    const filePath = resolve(publicDir, filename)
    const buf = readFileSync(filePath)

    // JPEG magic bytes
    expect(buf[0]).toBe(0xff)
    expect(buf[1]).toBe(0xd8)

    // non-trivial byte size (>20KB — catches a stub / half-written file)
    expect(buf.length).toBeGreaterThan(20000)

    // dimensions
    const { width, height } = jpegDimensions(buf)
    expect(width).toBe(1200)
    expect(height).toBe(630)
  })

  it('does NOT ship an orphan twitter-image-default.jpg (seo.js falls twitter back to og-image-default for unknown routes)', () => {
    // seo.js:175 specific.twitterImage || specific.ogImage || og-image-default.jpg
    // and seo.test.ts:225-226 asserts BOTH og and twitter default to
    // og-image-default.jpg for the unknown route. So twitter-image-default.jpg
    // is intentionally never referenced — guard against accidental introduction.
    let exists = true
    try {
      readFileSync(resolve(publicDir, 'twitter-image-default.jpg'))
    } catch {
      exists = false
    }
    expect(exists).toBe(false)
  })
})
