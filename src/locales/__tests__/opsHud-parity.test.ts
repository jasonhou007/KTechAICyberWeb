/**
 * @file opsHud-parity.test.ts
 * @description Focused i18n parity gate for the Cyber Ops HUD (#182).
 * @ticket #182
 *
 * The global locale-parity.test.ts already guards total en/zh leaf-key parity.
 * This test additionally pins the `opsHud` namespace structure so a future edit
 * that adds a key to one locale but not the other flips RED here with a focused
 * diff (not buried among 980+ keys), and asserts the category tab labels + the
 * pulse/anomaly copy resolve to real localized values in BOTH locales.
 */

import { describe, it, expect } from 'vitest'
import en from '../en.json'
import zh from '../zh.json'

function leafKeys(obj: unknown, prefix = ''): string[] {
  if (obj === null || typeof obj !== 'object') return []
  if (Array.isArray(obj)) return []
  const out: string[] = []
  for (const [k, v] of Object.entries(obj as Record<string, unknown>)) {
    const path = prefix ? `${prefix}.${k}` : k
    if (v !== null && typeof v === 'object' && !Array.isArray(v)) {
      out.push(...leafKeys(v, path))
    } else {
      out.push(path)
    }
  }
  return out
}

function resolve(obj: unknown, key: string): unknown {
  return key.split('.').reduce<unknown>((acc, seg) => {
    if (acc !== null && typeof acc === 'object' && seg in (acc as object)) {
      return (acc as Record<string, unknown>)[seg]
    }
    return undefined
  }, obj)
}

describe('opsHud namespace parity (en + zh) — #182', () => {
  const enKeys = leafKeys(en.opsHud).sort()
  const zhKeys = leafKeys(zh.opsHud).sort()

  it('en.opsHud and zh.opsHud have the SAME set of leaf keys', () => {
    const enSet = new Set(enKeys)
    const zhSet = new Set(zhKeys)
    const missingFromZh = enKeys.filter((k) => !zhSet.has(k))
    const missingFromEn = zhKeys.filter((k) => !enSet.has(k))
    expect({ missingFromZh, missingFromEn }).toEqual({
      missingFromZh: [],
      missingFromEn: [],
    })
  })

  it('the four category-tab keys exist in both locales', () => {
    for (const c of ['all', 'ai', 'security', 'performance']) {
      expect(resolve(en.opsHud, `categories.${c}`)).toBeTruthy()
      expect(resolve(zh.opsHud, `categories.${c}`)).toBeTruthy()
    }
  })

  it('the pulse + anomaly copy resolve to non-empty values in both locales', () => {
    const paths = [
      'pulse.label',
      'pulse.applied',
      'anomaly.title',
      'anomaly.drilldown',
      'anomaly.dismissed',
    ]
    for (const p of paths) {
      expect(String(resolve(en.opsHud, p) ?? '').trim().length).toBeGreaterThan(0)
      expect(String(resolve(zh.opsHud, p) ?? '').trim().length).toBeGreaterThan(0)
    }
  })

  it('the aria live-region labels exist in both locales (AC 3.1)', () => {
    for (const a of ['regionLabel', 'description', 'feedLive', 'anomalyLive', 'pulseButton', 'investigateButton', 'dismissButton', 'closeDetail']) {
      expect(resolve(en.opsHud, `aria.${a}`)).toBeTruthy()
      expect(resolve(zh.opsHud, `aria.${a}`)).toBeTruthy()
    }
  })
})
