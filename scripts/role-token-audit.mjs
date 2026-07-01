#!/usr/bin/env node
/**
 * role-token-audit.mjs — Issue #286 secondary-text role-token uniformity.
 *
 * Walks every .vue <style> block under src/views, extracts every
 * `color: var(--text-secondary)` and `color: var(--text-muted)` declaration
 * (brace-counted, comment-stripped), classifies each site by its selector
 * keyword into ONE of five semantic roles, and emits a tab-separated matrix:
 *
 *   file<TAB>line<TAB>selector<TAB>current-token<TAB>target-token<TAB>[role]
 *
 * Roles (#286):
 *   section-subtitle -> var(--text-section-subtitle)  hero/section/overview
 *   card-meta        -> var(--text-card-meta)         card/section body copy
 *   list-label       -> var(--text-list-label)        stat/step/filter labels
 *   caption          -> var(--text-caption)           caption/helper/empty/breadcrumb/cta-line
 *   timestamp        -> var(--text-timestamp)         date/time/meta
 *
 * Classification is selector-keyword based; when a selector is ambiguous the
 * closest semantic role wins (the reasoning is encoded inline below). The
 * resulting matrix drives the 110 token swaps and is mirrored verbatim into
 * COLOR_ROLE_MAP.md.
 *
 * Usage: node scripts/role-token-audit.mjs
 */
import { readFileSync, readdirSync } from 'node:fs'
import { resolve } from 'node:path'

const ROOT = process.cwd()
const VIEWS = resolve(ROOT, 'src/views')

const TOKEN = {
  'section-subtitle': '--text-section-subtitle',
  'card-meta': '--text-card-meta',
  'list-label': '--text-list-label',
  'caption': '--text-caption',
  'timestamp': '--text-timestamp'
}

/**
 * Classify a (possibly compound) selector into one role. Takes the last
 * simple-selector segment as the primary signal, with keyword fallbacks.
 */
function classify(sel) {
  const s = sel.toLowerCase()
  // Split on descendant/child combinators ONLY (not the ::pseudo boundary),
  // so ".form-input::placeholder" stays as one segment.
  const segs = s.split(/[>\s+~]+/).filter(Boolean)
  const last = (segs[segs.length - 1] || s).trim()
  // Descendant compound: e.g. ".content-card p", ".hero .cyber-card p",
  // ".service-card:hover .service-features li". For body-copy <p>/<li>/<span>
  // we classify by the PARENT simple-selector (.content-card, .service-features).
  const parent = segs.length >= 2 ? segs[segs.length - 2].replace(/:hover$/, '').trim() : ''

  // Pseudo-element helpers (placeholder, blockquote :deep) -> caption.
  if (last.endsWith('::placeholder') || last.endsWith(':deep(blockquote)')) return 'caption'

  // --- timestamp (dates/times/meta) ---
  if (/(^|[_-])(date|dates|time|timestamp|related-date)([_-]|$)/.test(last)) return 'timestamp'
  if (last.endsWith('__meta') || last.endsWith('__date') || last.endsWith('__meta-item') ||
      last.endsWith('-meta') || last === '.page-meta') return 'timestamp'

  // --- list-label (labels) ---
  if (last === '.stat-label' || last.endsWith('__stat-label') || last.endsWith('-stat-label')) return 'list-label'
  if (last.endsWith('__filter') || last.endsWith('filter-active')) return 'list-label'
  if (/filter-search label$/.test(s) || /filter-group label$/.test(s)) return 'list-label'
  if (last.endsWith('__step') || last.endsWith('-step')) return 'list-label' // step label
  if (last.endsWith('-label') || last.endsWith('__label') ||
      last === '.checkbox-label' || last === '.social-label' || last === '.group-label') return 'list-label'

  // --- caption (captions/helpers/empty/breadcrumb/cta-line/short-bullets) ---
  if (last === '.news-detail__caption' || last.endsWith('-caption') || last.endsWith('__caption')) return 'caption'
  if (last.endsWith('helper') || last.endsWith('-helper') || last.endsWith('__helper')) return 'caption'
  if (last.endsWith('empty-message') || last.endsWith('empty-state')) return 'caption'
  if (last.includes('breadcrumb') && !last.endsWith('__breadcrumb-separator-fail')) return 'caption'
  if (last === '.demo-description') return 'caption'
  if (last.endsWith('cta-description') || last.endsWith('__cta-description')) return 'caption'
  if (last === '.cta p' || last === '.cta-content p') return 'caption' // cta supporting line
  if (last === '.note') return 'caption'
  if (last === '.news-detail__markdown :deep(blockquote)') return 'caption'
  if (last === '.position-modal__list li') return 'caption' // short bullet list -> caption tier
  if (last === '.benefit-item span') return 'caption'
  if (last === '.breadcrumb .separator' || last.endsWith('-separator')) return 'caption'

  // --- section-subtitle (subtitles/overview/not-found/page-level) ---
  if (last === '.subtitle' || last.endsWith('__subtitle') || last.endsWith('-subtitle') ||
      last === '.hero-subtitle' || last === '.page-subtitle') return 'section-subtitle'
  if (last === '.section-description') return 'section-subtitle'
  if (last.endsWith('overview-text') || last.endsWith('__overview-text')) return 'section-subtitle'
  if (last === '.news-detail__not-found-text' || last === '.message') return 'section-subtitle'

  // --- card-meta (card/section body copy + legal body) ---
  if (last.endsWith('card-description') || last.endsWith('__card-description') ||
      last.endsWith('feature-description') || last.endsWith('benefit-description') ||
      last.endsWith('step-description')) return 'card-meta'
  if (last === '.position-card__description') return 'card-meta'
  if (last === '.disclaimer') return 'card-meta' // legal body copy

  // Descendant compound selectors: <p>/<li>/<span> inside a container.
  if (last === 'p' || last === 'li' || last === 'span' || last === '::placeholder' ||
      last === ':deep(blockquote)') {
    // Parent-keyword -> role decision table.
    if (last === '::placeholder' || last === ':deep(blockquote)') return 'caption'
    if (last === 'span') return 'caption' // benefit-item span etc. = short supporting text
    // <p>/<li> parents:
    if (parent.endsWith('-card') || parent.endsWith('__card') ||
        parent === '.cyber-card' || parent === '.solution-card' ||
        parent === '.content-card' || parent === '.overview-card' ||
        parent === '.feature-card' || parent === '.benefit-item' ||
        parent === '.info-item' || parent === '.capability-card' ||
        parent === '.step-content' || parent === '.process-step' ||
        parent === '.culture-card' || parent === '.benefit-card' ||
        parent === '.feature-content' || parent === '.cta-card' ||
        parent === '.position-modal__section') return 'card-meta'
    if (parent === '.content-block' || parent === '.item-list' ||
        parent === '.service-features' || parent === '.service-card:hover .service-features') return 'card-meta'
    if (parent === '.cta' || parent === '.cta-content') return 'caption' // cta supporting line
    if (parent === '.position-modal__list') return 'caption' // short bullet list
    // Fallback: any other <p>/<li> body copy is card-meta (prose body tier).
    return 'card-meta'
  }

  if (last === '.separator') return 'caption' // breadcrumb .separator
  if (last === '.breadcrumb') return 'caption'

  return 'UNCLASSIFIED:' + last + (parent ? '|parent=' + parent : '')
}

// ---------- CSS extraction with original-line tracking ----------
function stripComments(src) {
  return src
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/\/\/[^\n]*/g, '')
}

const files = readdirSync(VIEWS).filter(f => f.endsWith('.vue')).sort()
const rows = []

for (const f of files) {
  const raw = readFileSync(resolve(VIEWS, f), 'utf-8')
  const blockMatches = [...raw.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/g)]
  const blocks = blockMatches.map(m => m[1])
  // 1-based line in `raw` where each block's first content char lives
  const blockStarts = blockMatches.map(m =>
    raw.slice(0, m.index + m[0].indexOf(m[1])).split('\n').length
  )

  // concatenate blocks with a parallel char->original-line map
  let combined = ''
  const lineMap = []
  blocks.forEach((blk, bi) => {
    const start = blockStarts[bi]
    blk.split('\n').forEach((ln, idx) => {
      const orig = start + idx
      for (let c = 0; c < ln.length; c++) lineMap.push(orig)
      lineMap.push(orig) // for the '\n' we append below
    })
    combined += blk + '\n'
  })

  // strip comments but PRESERVE newlines (replace non-newline with space) so
  // the char offsets / line map remain valid.
  const padded = combined
    .replace(/\/\*[\s\S]*?\*\//g, s => s.replace(/[^\n]/g, ' '))
    .replace(/\/\/[^\n]*/g, s => s.replace(/[^\n]/g, ' '))

  let i = 0
  const n = padded.length
  while (i < n) {
    const brace = padded.indexOf('{', i)
    if (brace === -1) break
    const selRaw = padded.slice(i, brace).trim()
    let depth = 1
    let j = brace + 1
    while (j < n && depth > 0) {
      if (padded[j] === '{') depth++
      else if (padded[j] === '}') depth--
      j++
    }
    const body = padded.slice(brace + 1, j - 1)

    const handle = (selector, bodyText, baseChar) => {
      const re = /color:\s*var\(--text-(secondary|muted)\)/g
      let m
      while ((m = re.exec(bodyText)) !== null) {
        const absChar = baseChar + m.index
        rows.push({
          file: f,
          line: lineMap[absChar],
          selector,
          from: m[1],
          role: classify(selector)
        })
      }
    }

    if (selRaw.startsWith('@media') || selRaw.startsWith('@supports')) {
      // recurse one level into the @media body
      let k = 0
      const nb = body.length
      while (k < nb) {
        const b2 = body.indexOf('{', k)
        if (b2 === -1) break
        const sel2 = body.slice(k, b2).trim()
        let d2 = 1
        let l2 = b2 + 1
        while (l2 < nb && d2 > 0) {
          if (body[l2] === '{') d2++
          else if (body[l2] === '}') d2--
          l2++
        }
        const body2 = body.slice(b2 + 1, l2 - 1)
        if (sel2 && !sel2.startsWith('@')) handle(sel2, body2, brace + 1 + b2 + 1)
        k = l2
      }
    } else if (selRaw && !selRaw.startsWith('@')) {
      handle(selRaw, body, brace + 1)
    }
    i = j
  }
}

rows.sort((a, b) => a.file.localeCompare(b.file) || a.line - b.line)

for (const r of rows) {
  const tok = TOKEN[r.role] || ('??' + r.role)
  console.log(`${r.file}\tL${r.line}\t${r.selector}\tvar(--text-${r.from})\tvar(${tok})\t[${r.role}]`)
}

const counts = {}
for (const r of rows) counts[r.role] = (counts[r.role] || 0) + 1
const unclassified = rows.filter(r => r.role.startsWith('UNCLASSIFIED'))
process.stderr.write(`TOTAL ${rows.length}\n`)
process.stderr.write(`COUNTS ${JSON.stringify(counts)}\n`)
process.stderr.write(`UNCLASSIFIED ${unclassified.length} ${JSON.stringify(unclassified.map(r => r.selector))}\n`)
