/**
 * @file locale-parity.test.ts
 * @description Global i18n invariants for en.json and zh.json (AC #165)
 * @ticket #165 - [ASSETS] Extract and Implement About & News Section Images
 *
 * Global guards (owned here, not in any single component test):
 *  - en.json and zh.json have EQUAL leaf-key counts (a missing key in either
 *    locale would silently fall back to the raw dotted key in the rendered UI).
 *  - Every About/News image alt key added for AC #165 exists in BOTH locales.
 *  - No alt value is empty and no raw dotted key appears as a value.
 *  - Every news.json article's altKey resolves in BOTH locales (data-integrity).
 *
 * Mocked-`t()` component tests do NOT prove these invariants — they pass even
 * when keys are missing from the JSON. This test loads the real JSON so a
 * missing key flips RED here regardless of component mocking.
 */

import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import en from '../en.json'
import zh from '../zh.json'
import newsData from '../../data/news.json'

/** Recursively collect the dotted-path of every leaf value in an object. */
function leafPaths(obj: unknown, prefix = ''): string[] {
  if (obj === null || typeof obj !== 'object') return []
  if (Array.isArray(obj)) return [] // arrays are not part of the locale contract
  const out: string[] = []
  for (const [k, v] of Object.entries(obj as Record<string, unknown>)) {
    const path = prefix ? `${prefix}.${k}` : k
    if (v !== null && typeof v === 'object' && !Array.isArray(v)) {
      out.push(...leafPaths(v, path))
    } else {
      out.push(path)
    }
  }
  return out
}

/** Resolve a dotted path through an object; returns undefined if any segment is absent. */
function resolveKey(obj: unknown, key: string): unknown {
  return key.split('.').reduce<unknown>((acc, seg) => {
    if (acc !== null && typeof acc === 'object' && seg in (acc as object)) {
      return (acc as Record<string, unknown>)[seg]
    }
    return undefined
  }, obj)
}

describe('locale parity (en + zh)', () => {
  const enLeaves = leafPaths(en)
  const zhLeaves = leafPaths(zh)

  it('en.json and zh.json have equal leaf-key counts', () => {
    // If a key is added to one locale but not the other, this flips RED and
    // the diff below shows which side is missing it.
    expect(enLeaves.length).toBe(zhLeaves.length)
  })

  it('en.json and zh.json have the same set of leaf keys', () => {
    const enSet = new Set(enLeaves)
    const zhSet = new Set(zhLeaves)
    const missingFromZh = enLeaves.filter((k) => !zhSet.has(k))
    const missingFromEn = zhLeaves.filter((k) => !enSet.has(k))
    expect({ missingFromZh, missingFromEn }).toEqual({
      missingFromZh: [],
      missingFromEn: [],
    })
  })

  // ============================================
  // AC #165 — About image alt keys
  // ============================================
  describe('About image alt keys (AC #165)', () => {
    const aboutAltKeys = [
      'about.hero.imageAlt',
      'about.whoWeAre.featureImageAlt',
      'about.achievements.aaaAlt',
      'about.achievements.mncAlt',
      'about.achievements.nationalAlt',
      'about.achievements.national2021Alt',
      'about.achievements.iso9001Alt',
      'about.achievements.iso20000Alt',
      'about.achievements.iso27001Alt',
      'about.achievements.shenzhenFintechAlt',
      'about.achievements.guangdongFintechAlt',
      'about.achievements.hightechAlt',
      'about.achievements.innovativeSmeAlt',
      'about.achievements.specializedSmeAlt',
      'about.culture.imageAlt',
    ]

    it.each(aboutAltKeys)('%s exists in en.json', (key) => {
      expect(resolveKey(en, key)).toBeTruthy()
    })

    it.each(aboutAltKeys)('%s exists in zh.json', (key) => {
      expect(resolveKey(zh, key)).toBeTruthy()
    })

    it('no About alt value is empty in either locale', () => {
      aboutAltKeys.forEach((key) => {
        const enVal = resolveKey(en, key)
        const zhVal = resolveKey(zh, key)
        expect(String(enVal ?? '').trim().length).toBeGreaterThan(0)
        expect(String(zhVal ?? '').trim().length).toBeGreaterThan(0)
      })
    })

    it('no About alt value is a raw dotted key (no English-in-zh or missing-key fallback)', () => {
      aboutAltKeys.forEach((key) => {
        const enVal = String(resolveKey(en, key) ?? '')
        const zhVal = String(resolveKey(zh, key) ?? '')
        // A raw dotted key leaking through would match this pattern.
        expect(enVal).not.toMatch(/^[a-z]+\.[a-z.]+$/i)
        expect(zhVal).not.toMatch(/^[a-z]+\.[a-z.]+$/i)
        // The zh value must actually be Chinese (contain a CJK char), not English.
        expect(zhVal).toMatch(/[一-鿿]/)
      })
    })
  })

  // ============================================
  // AC #165 — News article alt keys (one per article)
  // ============================================
  describe('News article alt keys (AC #165)', () => {
    it('every news.json article has an altKey field', () => {
      newsData.forEach((article) => {
        expect(article.altKey, `article id=${article.id} missing altKey`).toBeTruthy()
        expect(String(article.altKey)).toMatch(/^news\.articleAlts\./)
      })
    })

    it('every article altKey resolves in BOTH en.json and zh.json', () => {
      newsData.forEach((article) => {
        const key = article.altKey
        const enVal = resolveKey(en, key)
        const zhVal = resolveKey(zh, key)
        expect(enVal, `en missing ${key}`).toBeTruthy()
        expect(zhVal, `zh missing ${key}`).toBeTruthy()
        // zh must be real Chinese copy, not a raw key or English fallback.
        expect(String(zhVal)).toMatch(/[一-鿿]/)
      })
    })

    it('no news alt value is empty or a raw dotted key', () => {
      newsData.forEach((article) => {
        const key = article.altKey
        const enVal = String(resolveKey(en, key) ?? '')
        const zhVal = String(resolveKey(zh, key) ?? '')
        expect(enVal.trim().length).toBeGreaterThan(0)
        expect(zhVal.trim().length).toBeGreaterThan(0)
        expect(enVal).not.toMatch(/^news\./)
        expect(zhVal).not.toMatch(/^news\./)
      })
    })
  })
})

// `readFileSync` is imported and used in case a future revision wants to do
// raw-source assertions (e.g. detect accidental trailing commas). It is kept
// here to avoid a dangling import lint error in the current revision.
void readFileSync
void resolve
