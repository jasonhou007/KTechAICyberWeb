/**
 * #263 — Generate the SEO/OG/favicon asset bundle into public/.
 *
 * Regen path. Run:  `node scripts/generate-seo-assets.mjs`
 *
 * Produces (all under public/, idempotent — re-running overwrites):
 *   - og-image.jpg          (1200×630 JPEG)   — OpenGraph preview
 *   - twitter-image.jpg     (1200×630 JPEG)   — Twitter card preview
 *   - apple-touch-icon.png  (180×180 PNG)
 *   - icon-192.png          (192×192 PNG)     — PWA manifest icon
 *   - icon-512.png          (512×512 PNG)     — PWA manifest icon
 *   - logo.png              (512×512 PNG)     — JSON-LD Organization logo
 *   - favicon.svg           (SVG)             — canonical vector source
 *   - favicon.ico           (multi-size ICO)  — 16/32/48 PNG-in-ICO
 *
 * Tooling: Playwright Chromium rasterizes a single hand-authored inline SVG
 * at each target viewport. No external image deps; deterministic output.
 *
 * IP attestation — ORIGINAL primitives only, mirrors the #198 AboutIcon.vue
 * approach (see public/ASSETS_NOTICE.md):
 *   - NO third-party bank wordmark or official logo path data. (The forbidden
 *     tokens are deliberately NOT spelled out in this source so that a source
 *     grep cannot false-positive on the attestation comment itself.)
 *   - The "KTech" string rendered below is the project's own abbreviated name
 *     (matching the manifest short_name), NOT any external trademark.
 *   - All motifs are original geometric primitives (rect / circle / line /
 *     polyline / path) on a #0a0a0a bg with the project cyan #00ffcc.
 *   - The "circuit grid" + concentric rings + scanline are abstract cyber
 *     decoration, not derived from any third-party logo or path data.
 */

import { chromium } from 'playwright'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const PUBLIC_DIR = path.join(__dirname, '..', 'public')

const CYAN = '#00ffcc'
const CYAN_DIM = '#0a3a36'
const BG = '#0a0a0a'
const TEXT = '#e6fffb'

// ---------------------------------------------------------------------------
// SVG SOURCES
// ---------------------------------------------------------------------------

/**
 * The square "mark" — used for all square icons (favicon variants, PWA icons,
 * apple-touch-icon, logo). 512×512 viewBox, scales cleanly at any size.
 * Original cyber primitives: corner brackets, concentric rings, circuit nodes,
 * a scanline, and the "KTech" wordmark + a stylized K monogram.
 */
function squareSvg() {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <radialGradient id="bg" cx="50%" cy="42%" r="75%">
      <stop offset="0%" stop-color="${'#0e1a1a'}"/>
      <stop offset="100%" stop-color="${BG}"/>
    </radialGradient>
  </defs>
  <rect width="512" height="512" fill="url(#bg)"/>

  <!-- corner brackets -->
  <g fill="none" stroke="${CYAN}" stroke-width="6" stroke-linecap="square">
    <polyline points="40,96 40,40 96,40"/>
    <polyline points="416,40 472,40 472,96"/>
    <polyline points="472,416 472,472 416,472"/>
    <polyline points="96,472 40,472 40,416"/>
  </g>

  <!-- concentric rings -->
  <g fill="none" stroke="${CYAN_DIM}" stroke-width="2">
    <circle cx="256" cy="220" r="150"/>
    <circle cx="256" cy="220" r="118"/>
  </g>
  <circle cx="256" cy="220" r="86" fill="none" stroke="${CYAN}" stroke-width="3" opacity="0.85"/>

  <!-- circuit nodes around outer ring -->
  <g fill="${CYAN}">
    <circle cx="256" cy="70"  r="6"/>
    <circle cx="406" cy="220" r="6"/>
    <circle cx="256" cy="370" r="6"/>
    <circle cx="106" cy="220" r="6"/>
  </g>
  <g stroke="${CYAN}" stroke-width="2" opacity="0.7">
    <line x1="256" y1="70"  x2="256" y2="40"/>
    <line x1="406" y1="220" x2="472" y2="220"/>
    <line x1="256" y1="370" x2="256" y2="472"/>
    <line x1="106" y1="220" x2="40"  y2="220"/>
  </g>

  <!-- K monogram (original geometric construction — NOT a third-party logo) -->
  <g stroke="${CYAN}" stroke-width="14" stroke-linecap="round" stroke-linejoin="round" fill="none">
    <line x1="200" y1="150" x2="200" y2="290"/>
    <polyline points="200,220 270,150 240,195 290,290"/>
  </g>

  <!-- scanline -->
  <line x1="40" y1="430" x2="472" y2="430" stroke="${CYAN}" stroke-width="2" opacity="0.5"/>

  <!-- wordmark -->
  <text x="256" y="478" text-anchor="middle"
        font-family="'Helvetica Neue', Helvetica, Arial, sans-serif"
        font-size="46" font-weight="700" letter-spacing="10"
        fill="${CYAN}">KTech</text>
</svg>`
}

/**
 * The wide banner — 1200×630 for og-image + twitter-image. Same mark on the
 * left, a headline + tagline + URL on the right, framed by a circuit motif.
 */
function bannerSvg() {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 630" width="1200" height="630">
  <defs>
    <radialGradient id="bg" cx="32%" cy="42%" r="80%">
      <stop offset="0%" stop-color="${'#0e1a1a'}"/>
      <stop offset="100%" stop-color="${BG}"/>
    </radialGradient>
    <linearGradient id="bar" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="${CYAN}" stop-opacity="0"/>
      <stop offset="50%" stop-color="${CYAN}" stop-opacity="0.9"/>
      <stop offset="100%" stop-color="${CYAN}" stop-opacity="0"/>
    </linearGradient>
  </defs>

  <rect width="1200" height="630" fill="url(#bg)"/>

  <!-- background circuit grid -->
  <g stroke="${CYAN_DIM}" stroke-width="1" opacity="0.55">
    ${Array.from({ length: 11 }, (_, i) =>
      `<line x1="0" y1="${60 + i * 50}" x2="1200" y2="${60 + i * 50}" stroke-dasharray="2 14"/>`
    ).join('')}
    ${Array.from({ length: 23 }, (_, i) =>
      `<line x1="${60 + i * 50}" y1="0" x2="${60 + i * 50}" y2="630" stroke-dasharray="2 14"/>`
    ).join('')}
  </g>

  <!-- outer frame -->
  <rect x="24" y="24" width="1152" height="582" fill="none" stroke="${CYAN}" stroke-width="2" opacity="0.55"/>
  <g fill="none" stroke="${CYAN}" stroke-width="4">
    <polyline points="40,80 40,40 80,40"/>
    <polyline points="1120,40 1160,40 1160,80"/>
    <polyline points="1160,550 1160,590 1120,590"/>
    <polyline points="80,590 40,590 40,550"/>
  </g>

  <!-- mark (reuse monogram + ring) on the left -->
  <g transform="translate(120, 165) scale(0.6)">
    <circle cx="256" cy="256" r="150" fill="none" stroke="${CYAN_DIM}" stroke-width="2"/>
    <circle cx="256" cy="256" r="118" fill="none" stroke="${CYAN_DIM}" stroke-width="2"/>
    <circle cx="256" cy="256" r="86"  fill="none" stroke="${CYAN}" stroke-width="3" opacity="0.85"/>
    <g fill="${CYAN}">
      <circle cx="256" cy="106" r="6"/>
      <circle cx="406" cy="256" r="6"/>
      <circle cx="256" cy="406" r="6"/>
      <circle cx="106" cy="256" r="6"/>
    </g>
    <g stroke="${CYAN}" stroke-width="14" stroke-linecap="round" stroke-linejoin="round" fill="none">
      <line x1="200" y1="186" x2="200" y2="326"/>
      <polyline points="200,256 270,186 240,231 290,326"/>
    </g>
  </g>

  <!-- right-side copy -->
  <g font-family="'Helvetica Neue', Helvetica, Arial, sans-serif">
    <text x="540" y="250" font-size="96" font-weight="800" letter-spacing="6" fill="${CYAN}">KTech</text>
    <text x="544" y="306" font-size="34" font-weight="500" letter-spacing="3" fill="${TEXT}">Fintech Cyber Platform</text>
    <line x1="544" y1="336" x2="1100" y2="336" stroke="${CYAN}" stroke-width="1.5" opacity="0.6"/>
    <text x="544" y="384" font-size="26" font-weight="400" fill="${TEXT}" opacity="0.85">
      Fintech solutions: blockchain, supply-chain
    </text>
    <text x="544" y="420" font-size="26" font-weight="400" fill="${TEXT}" opacity="0.85">
      finance, retail credit, project management
    </text>
    <text x="544" y="500" font-size="22" font-weight="600" letter-spacing="2" fill="${CYAN}">
      jasonhou007.github.io/KTechAICyberWeb
    </text>
  </g>

  <!-- top + bottom accent bars -->
  <rect x="24" y="22" width="1152" height="3" fill="url(#bar)"/>
  <rect x="24" y="605" width="1152" height="3" fill="url(#bar)"/>
</svg>`
}

// ---------------------------------------------------------------------------
// Rasterization helpers
// ---------------------------------------------------------------------------

async function svgToBuffer(page, svgString, { width, height, type, quality }) {
  await page.setViewportSize({ width, height })
  await page.setContent(svgString, { waitUntil: 'load' })
  const buf = await page.screenshot({ type, quality, omitBackground: false })
  return buf
}

/**
 * Build a multi-image ICO from an array of PNG buffers. PNG-in-ICO is the
 * universally-supported modern form (no need for legacy BMP encoding).
 *
 * Layout:
 *   ICONDIR (6 bytes):  reserved=0x0000, type=0x0001, count=N
 *   ICONDIRENTRY (16 bytes each) × N:  w, h, colorCount, reserved, planes,
 *                                     bitCount, size, offset
 *   PNG blob × N (concatenated)
 */
function buildIco(pngBlobs) {
  const HEADER_LEN = 6
  const ENTRY_LEN = 16
  const dirLen = HEADER_LEN + ENTRY_LEN * pngBlobs.length
  // compute offsets
  let totalSize = dirLen
  const sizes = pngBlobs.map((b) => b.length)
  for (const s of sizes) totalSize += s

  const out = Buffer.alloc(totalSize)
  // ICONDIR
  out.writeUInt16LE(0x0000, 0) // reserved
  out.writeUInt16LE(0x0001, 2) // type = icon
  out.writeUInt16LE(pngBlobs.length, 4) // count

  let dataOffset = dirLen
  pngBlobs.forEach((png, i) => {
    // ICONDIRENTRY fields
    const byteWidth = png.readUInt32BE(16)  // PNG IHDR width  (0 → 256 in ICO)
    const byteHeight = png.readUInt32BE(20) // PNG IHDR height
    const entryOff = HEADER_LEN + i * ENTRY_LEN
    out.writeUInt8(byteWidth >= 256 ? 0 : byteWidth, entryOff + 0)
    out.writeUInt8(byteHeight >= 256 ? 0 : byteHeight, entryOff + 1)
    out.writeUInt8(0, entryOff + 2)    // colorCount (0 = >=256)
    out.writeUInt8(0, entryOff + 3)    // reserved
    out.writeUInt16LE(1, entryOff + 4) // planes
    out.writeUInt16LE(32, entryOff + 6) // bitCount
    out.writeUInt32LE(png.length, entryOff + 8)  // size
    out.writeUInt32LE(dataOffset, entryOff + 12) // offset
    png.copy(out, dataOffset)
    dataOffset += png.length
  })
  return out
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  if (!fs.existsSync(PUBLIC_DIR)) fs.mkdirSync(PUBLIC_DIR, { recursive: true })

  const square = squareSvg()
  const banner = bannerSvg()
  // Persist the canonical SVG source as favicon.svg.
  fs.writeFileSync(path.join(PUBLIC_DIR, 'favicon.svg'), square, 'utf8')
  console.log('wrote favicon.svg')

  const browser = await chromium.launch()
  const ctx = await browser.newContext({ deviceScaleFactor: 1 })
  const page = await ctx.newPage()

  try {
    // --- wide banners (1200×630) ---
    const og = await svgToBuffer(page, banner, { width: 1200, height: 630, type: 'jpeg', quality: 92 })
    fs.writeFileSync(path.join(PUBLIC_DIR, 'og-image.jpg'), og)
    fs.writeFileSync(path.join(PUBLIC_DIR, 'twitter-image.jpg'), og)
    console.log(`wrote og-image.jpg (${og.length} bytes) + twitter-image.jpg`)

    // --- square PNGs ---
    const png180 = await svgToBuffer(page, square, { width: 180, height: 180, type: 'png' })
    fs.writeFileSync(path.join(PUBLIC_DIR, 'apple-touch-icon.png'), png180)
    console.log(`wrote apple-touch-icon.png (${png180.length} bytes)`)

    const png192 = await svgToBuffer(page, square, { width: 192, height: 192, type: 'png' })
    fs.writeFileSync(path.join(PUBLIC_DIR, 'icon-192.png'), png192)
    console.log(`wrote icon-192.png (${png192.length} bytes)`)

    const png512 = await svgToBuffer(page, square, { width: 512, height: 512, type: 'png' })
    fs.writeFileSync(path.join(PUBLIC_DIR, 'icon-512.png'), png512)
    fs.writeFileSync(path.join(PUBLIC_DIR, 'logo.png'), png512)
    console.log(`wrote icon-512.png + logo.png (${png512.length} bytes)`)

    // --- favicon.ico (16/32/48 PNG-in-ICO) ---
    const png16 = await svgToBuffer(page, square, { width: 16, height: 16, type: 'png' })
    const png32 = await svgToBuffer(page, square, { width: 32, height: 32, type: 'png' })
    const png48 = await svgToBuffer(page, square, { width: 48, height: 48, type: 'png' })
    const ico = buildIco([png16, png32, png48])
    fs.writeFileSync(path.join(PUBLIC_DIR, 'favicon.ico'), ico)
    console.log(`wrote favicon.ico (${ico.length} bytes, 3 sizes)`)
  } finally {
    await browser.close()
  }

  console.log('\nDone. 8 assets under public/.')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
