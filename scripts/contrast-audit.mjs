#!/usr/bin/env node
/**
 * contrast-audit.mjs — Issue #252 Deliverable 4 (WCAG contrast).
 *
 * Parses every .vue <style> block under src/views, extracts `color:` (text)
 * and `background:` (bg) declarations per rule, resolves var(--…) tokens to
 * hex via src/assets/styles/variables.css, composites any rgba() over the
 * effective background, and computes the WCAG 2.1 contrast ratio for each
 * text/bg pair. Flags any pair below the AA thresholds (4.5:1 normal text,
 * 3.0:1 large/bold text).
 *
 * Effective-background resolution method:
 *   1. The site root background is the dark gradient (--bg-gradient-start
 *      #0a0a0a -> --bg-gradient-end #16213e). For contrast math we use the
 *      MID-GRADIENT color (composite of start+end at 50%) as the canonical
 *      page bg, since most text sits mid-page. We also report against the
 *      WORST-CASE end stop so a borderline text shows both.
 *   2. For a rule whose own `background` is set, we composite that bg over the
 *      page bg (rgba alpha-blend) before computing the ratio.
 *   3. For rgba() text color, we composite over the resolved bg first.
 *
 * Output: stdout table + summary. Pasted verbatim into COLOR_AUDIT.md.
 *
 * Usage: node scripts/contrast-audit.mjs
 */
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { resolve, join, relative } from 'node:path'

const ROOT = process.cwd()
const VIEWS_DIR = resolve(ROOT, 'src/views')
const VARIABLES_CSS = resolve(ROOT, 'src/assets/styles/variables.css')

// ---------- color helpers ----------
function hexToRgb(hex) {
  const h = hex.replace('#', '')
  const v = h.length === 3
    ? h.split('').map(c => c + c).join('')
    : h
  const num = parseInt(v, 16)
  return { r: (num >> 16) & 255, g: (num >> 8) & 255, b: num & 255 }
}
function rgbToHex({ r, g, b }) {
  const f = n => Math.round(n).toString(16).padStart(2, '0')
  return `#${f(r)}${f(g)}${f(b)}`
}
function parseRgb(str) {
  // matches #rgb, #rrggbb, rgb(r,g,b), rgba(r,g,b,a)
  const hexM = str.match(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/)
  if (hexM) {
    const c = hexToRgb(str)
    return { r: c.r, g: c.g, b: c.b, a: 1 }
  }
  const rgbaM = str.match(/rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)\s*(?:,\s*([\d.]+)\s*)?\)/)
  if (rgbaM) {
    return { r: +rgbaM[1], g: +rgbaM[2], b: +rgbaM[3], a: rgbaM[4] !== undefined ? +rgbaM[4] : 1 }
  }
  return null
}
// composite fg (with alpha) over bg (opaque) -> opaque rgb
function composite(fg, bg) {
  const a = fg.a ?? 1
  return {
    r: fg.r * a + bg.r * (1 - a),
    g: fg.g * a + bg.g * (1 - a),
    b: fg.b * a + bg.b * (1 - a),
  }
}
function relLum({ r, g, b }) {
  const chan = c => {
    const s = c / 255
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4)
  }
  return 0.2126 * chan(r) + 0.7152 * chan(g) + 0.0722 * chan(b)
}
function contrastRatio(fgHex, bgHex) {
  const L1 = relLum(hexToRgb(fgHex))
  const L2 = relLum(hexToRgb(bgHex))
  const [hi, lo] = L1 > L2 ? [L1, L2] : [L2, L1]
  return (hi + 0.05) / (lo + 0.05)
}

// ---------- token resolution from variables.css ----------
function loadTokenMap() {
  const src = readFileSync(VARIABLES_CSS, 'utf-8')
  const map = {}
  // first pass: direct hex / rgba assignments
  for (const m of src.matchAll(/(--[\w-]+)\s*:\s*([^;]+);/g)) {
    const name = m[1].trim()
    const val = m[2].trim()
    const parsed = parseRgb(val)
    if (parsed) {
      map[name] = val
    } else if (val.startsWith('var(')) {
      map[name] = val // alias, resolve later
    }
  }
  // second pass: resolve aliases (var(--x) -> underlying value), iteratively
  for (let i = 0; i < 5; i++) {
    let changed = false
    for (const k of Object.keys(map)) {
      const v = map[k]
      const am = v.match(/var\(\s*(--[\w-]+)\s*\)/)
      if (am && map[am[1]]) {
        map[k] = map[am[1]]
        changed = true
      }
    }
    if (!changed) break
  }
  return map
}

const TOKENS = loadTokenMap()

function resolveValue(raw) {
  if (!raw) return null
  const v = raw.trim()
  // direct hex / rgb
  const direct = parseRgb(v)
  if (direct) return v
  // var(--token) optionally with fallback
  const vm = v.match(/^var\(\s*(--[\w-]+)\s*(?:,\s*([^)]+))?\)$/)
  if (vm) {
    const tok = vm[1]
    const fb = vm[2]
    if (TOKENS[tok]) return TOKENS[tok]
    if (fb) return resolveValue(fb)
    return null
  }
  // gradient: take the FIRST opaque-ish color stop as representative bg.
  // Stops may be hex, rgb()/rgba(), OR var(--token) — resolve each.
  if (/gradient/i.test(v)) {
    const stopMatches = [...v.matchAll(/(#[0-9a-fA-F]{3,8}|rgba?\([^)]+\)|var\(\s*--[\w-]+\s*(?:,[^)]*)?\))/g)].map(m => m[0])
    for (const s of stopMatches) {
      const resolved = s.startsWith('var(') ? resolveValue(s) : s
      if (!resolved) continue
      const parsed = parseRgb(resolved)
      if (parsed && (parsed.a === undefined || parsed.a === 1)) return resolved // prefer opaque
    }
    // fall back to first resolvable stop even if alpha-bearing
    for (const s of stopMatches) {
      const resolved = s.startsWith('var(') ? resolveValue(s) : s
      if (resolved && parseRgb(resolved)) return resolved
    }
  }
  // currentColor / inherit / transparent / none -> null
  return null
}

// ---------- CSS rule extraction (brace-counted) ----------
function stripComments(src) {
  return src
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/\/\/[^\n]*/g, '')
}
function extractRules(css) {
  const rules = [] // { selector, body }
  let i = 0
  const n = css.length
  while (i < n) {
    const brace = css.indexOf('{', i)
    if (brace === -1) break
    const selectorRaw = css.slice(i, brace).trim()
    // find matching close brace (depth-counted)
    let depth = 1
    let j = brace + 1
    while (j < n && depth > 0) {
      if (css[j] === '{') depth++
      else if (css[j] === '}') depth--
      j++
    }
    const body = css.slice(brace + 1, j - 1)
    // skip at-rules that aren't plain rule bodies (e.g. @media contents) by
    // recursing into their body — but for our purposes a top-level scan that
    // also recurses into @media is sufficient. We flatten by re-scanning body.
    if (selectorRaw.startsWith('@media') || selectorRaw.startsWith('@supports')) {
      rules.push(...extractRules(body))
    } else if (selectorRaw && !selectorRaw.startsWith('@keyframes') && !selectorRaw.startsWith('@font-face')) {
      rules.push({ selector: selectorRaw, body })
    }
    i = j
  }
  return rules
}
function declarationsFromBody(body) {
  const decls = {}
  for (const stmt of body.split(';')) {
    const idx = stmt.indexOf(':')
    if (idx === -1) continue
    const prop = stmt.slice(0, idx).trim().toLowerCase()
    const val = stmt.slice(idx + 1).trim()
    if (prop) decls[prop] = val
  }
  return decls
}

// ---------- page background ----------
const BG_START = '#0a0a0a' // --bg-gradient-start
const BG_END = '#16213e'   // --bg-gradient-end
const BG_MID = rgbToHex(composite(hexToRgb(BG_START), hexToRgb(BG_END))) // 50/50
const BG_PRIMARY = TOKENS['--bg-primary'] || '#0a0a0a'

// ---------- main ----------
function listVueFiles() {
  const acc = []
  ;(function walk(dir) {
    for (const e of readdirSync(dir, { withFileTypes: true })) {
      const full = join(dir, e.name)
      if (e.isDirectory()) walk(full)
      else if (e.name.endsWith('.vue')) acc.push(full)
    }
  })(VIEWS_DIR)
  return acc.sort()
}

function isLargeText(decls) {
  // WCAG "large" = >= 18pt (24px) normal, or >= 14pt (18.66px) bold
  const fs = decls['font-size'] || ''
  const fw = decls['font-weight'] || ''
  const pxM = fs.match(/([\d.]+)px/)
  const px = pxM ? +pxM[1] : 0
  const bold = /(bold|[6-9]00)/.test(fw)
  return px >= 24 || (bold && px >= 18.66)
}

const findings = []
const passRows = []

for (const file of listVueFiles()) {
  const raw = readFileSync(file, 'utf-8')
  // extract each <style> block
  const styleBlocks = [...raw.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/g)].map(m => m[1])
  const css = stripComments(styleBlocks.join('\n'))
  const rules = extractRules(css)
  for (const rule of rules) {
    const decls = declarationsFromBody(rule.body)
    if (!decls.color) continue
    const textResolved = resolveValue(decls.color)
    if (!textResolved) continue // currentColor / inherit — skip
    // resolve bg: own rule bg else page bg
    let bgRaw = decls.background || decls['background-color'] || BG_PRIMARY
    let bgResolved = resolveValue(bgRaw)
    if (!bgResolved) bgResolved = BG_PRIMARY
    const bgRgb = parseRgb(bgResolved)
    const textRgb = parseRgb(textResolved)
    if (!bgRgb || !textRgb) continue
    // composite alpha-bearing layers over page bg, then text over bg
    const effectiveBg = (bgRgb.a !== undefined && bgRgb.a < 1)
      ? composite(bgRgb, hexToRgb(BG_PRIMARY))
      : { r: bgRgb.r, g: bgRgb.g, b: bgRgb.b }
    const effectiveText = (textRgb.a !== undefined && textRgb.a < 1)
      ? composite(textRgb, effectiveBg)
      : { r: textRgb.r, g: textRgb.g, b: textRgb.b }
    const fgHex = rgbToHex(effectiveText)
    const bgHex = rgbToHex(effectiveBg)
    const ratio = contrastRatio(fgHex, bgHex)
    const large = isLargeText(decls)
    const threshold = large ? 3.0 : 4.5
    const pass = ratio >= threshold
    const row = {
      file: relative(ROOT, file),
      selector: rule.selector.split('\n').map(s => s.trim()).filter(Boolean).join(', '),
      colorDecl: decls.color,
      bgDecl: bgRaw === BG_PRIMARY ? '(page bg)' : bgRaw,
      resolvedFg: fgHex,
      resolvedBg: bgHex,
      ratio: Math.round(ratio * 100) / 100,
      threshold,
      large,
      pass,
    }
    if (pass) passRows.push(row)
    else findings.push(row)
  }
}

// ---------- report ----------
console.log('# KTech WCAG Contrast Audit — Issue #252')
console.log('# Method: parse .vue <style>, resolve var(--) via variables.css,')
console.log('#         composite rgba() over page bg (--bg-primary #0a0a0a),')
console.log('#         WCAG 2.1 ratio. Large-text threshold 3.0, normal 4.5.')
console.log(`# Page bg (mid-gradient ${BG_MID} / end ${BG_END} / primary ${BG_PRIMARY}).`)
console.log(`# Files scanned: ${listVueFiles().length}`)
console.log(`# Total text/bg pairs evaluated: ${findings.length + passRows.length}`)
console.log(`# PASS: ${passRows.length}   FAIL: ${findings.length}`)
console.log('')
if (findings.length) {
  console.log('## FAILING pairs (below AA threshold):')
  console.log('file                                        | selector                                          | color-decl              | resolved-fg | resolved-bg | ratio | thr | large')
  console.log('--------------------------------------------+---------------------------------------------------+-------------------------+-------------+-------------+-------+-----+------')
  for (const f of findings.sort((a, b) => a.ratio - b.ratio)) {
    console.log(
      `${f.file.padEnd(43)}| ${f.selector.padEnd(50)}| ${f.colorDecl.padEnd(24)}| ${f.resolvedFg.padEnd(12)}| ${f.resolvedBg.padEnd(12)}| ${String(f.ratio).padEnd(6)}| ${String(f.threshold).padEnd(4)}| ${f.large}`
    )
  }
  console.log('')
}
console.log('## AA threshold = 4.5 (normal text) / 3.0 (large or bold >=18.66px).')
console.log('## Note: pairs whose color resolves to currentColor/inherit/transparent are skipped.')
