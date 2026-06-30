/**
 * @file 246-content-audit.spec.ts
 * @description Regression-proof record of the #246 copy audit corrections.
 * @ticket #246 - Correct user-facing copy against the official KTech site
 *   (https://www.kaitai.tech/, fetched 2026-06-30).
 *
 * This test loads the REAL en.json and zh.json (not a mocked `t()`) and asserts
 * that every correction from the audit manifest is present in BOTH locales.
 * A mocked-`t()` component test passes even when the JSON still holds the old
 * fabricated value; this test flips RED the moment any corrected value is
 * reverted or a locale drifts out of sync.
 *
 * Each assertion below is one row of CORRECTIONS_MANIFEST.md (C1-C5, H1-H4,
 * M1-M5). The expected values are quoted verbatim from the manifest.
 */

import { describe, it, expect } from 'vitest'
import en from '../en.json'
import zh from '../zh.json'

// Typed accessor: resolve a dotted path against a locale object, returning
// '' for a missing key (so the assertion failure names the key, not a throw).
function pick(obj: unknown, path: string): string {
  const parts = path.split('.')
  let cur: unknown = obj
  for (const p of parts) {
    if (cur === null || typeof cur !== 'object') return ''
    cur = (cur as Record<string, unknown>)[p]
  }
  return typeof cur === 'string' ? cur : ''
}

describe('#246 content audit — CRITICAL (brand / contact facts)', () => {
  // C1 — hero.title
  it('C1: hero.title is KTech in both locales', () => {
    expect(pick(en, 'hero.title')).toBe('KTech')
    expect(pick(zh, 'hero.title')).toBe('KTech')
  })

  // C2 — hero.subtitle
  it('C2: hero.subtitle is FINTECH / 金融科技 (no fabricated KBRIGHT/凯泰)', () => {
    expect(pick(en, 'hero.subtitle')).toBe('FINTECH')
    expect(pick(zh, 'hero.subtitle')).toBe('金融科技')
  })

  // C3 — contact email (both the info block and the legacy top-level pair)
  it('C3: contact email is the official KTECH@kaitaitech.cn inbox', () => {
    expect(pick(en, 'contact.info.emailValue')).toBe('KTECH@kaitaitech.cn')
    expect(pick(zh, 'contact.info.emailValue')).toBe('KTECH@kaitaitech.cn')
    expect(pick(en, 'contact.emailValue')).toBe('KTECH@kaitaitech.cn')
    expect(pick(zh, 'contact.emailValue')).toBe('KTECH@kaitaitech.cn')
  })

  // C4 — contact phone
  it('C4: contact.info.phoneValue is the official +86 755 36878020', () => {
    expect(pick(en, 'contact.info.phoneValue')).toBe('+86 755 36878020')
    expect(pick(zh, 'contact.info.phoneValue')).toBe('+86 755 36878020')
  })

  // C5 — contact address (info block + legacy top-level pair)
  it('C5: contact addresses are the Runhong Building street address', () => {
    expect(pick(en, 'contact.info.addressValue')).toBe(
      '12F, Runhong Building T2, No. 75 Meiyuan Road, Shenzhen, China',
    )
    expect(pick(zh, 'contact.info.addressValue')).toBe(
      '中国深圳市梅苑路75号润弘大厦T2座12楼',
    )
    expect(pick(en, 'contact.addressValue')).toBe(
      '12F, Runhong Building T2, No. 75 Meiyuan Road, Shenzhen',
    )
    expect(pick(zh, 'contact.addressValue')).toBe(
      '深圳市梅苑路75号润弘大厦T2座12楼',
    )
  })
})

describe('#246 content audit — HIGH (mission / vision / parent chain)', () => {
  // H1 — about.vision.description
  it('H1: about.vision.description matches official vision wording', () => {
    expect(pick(en, 'about.vision.description')).toBe(
      'To become a regional leading fintech platform.',
    )
    expect(pick(zh, 'about.vision.description')).toBe(
      '成为区域领先的金融科技平台。',
    )
  })

  // H2 — about.mission.description
  it('H2: about.mission.description matches official mission wording', () => {
    expect(pick(en, 'about.mission.description')).toBe(
      'Empower customers with cutting-edge technology.',
    )
    expect(pick(zh, 'about.mission.description')).toBe('以尖端科技赋能客户。')
  })

  // H3 — culture.missionDesc (en only; zh already correct)
  it('H3: culture.missionDesc uses customers/cutting-edge (en)', () => {
    expect(pick(en, 'culture.missionDesc')).toBe(
      'Empower customers with cutting-edge technology',
    )
    // zh was already correct and is unchanged by the audit.
    expect(pick(zh, 'culture.missionDesc')).toBe('以尖端科技赋能客户')
  })

  // H4 — hero.description parent-chain clause
  it('H4: hero.description names KASIKORNBANK via KASIKORN VISION subsidiary', () => {
    expect(pick(en, 'hero.description')).toContain(
      "Thailand's KASIKORNBANK through its wholly owned subsidiary KASIKORN VISION Co., Ltd.",
    )
    expect(pick(en, 'hero.description')).not.toContain("KASIKORN Bank Group")
    expect(pick(zh, 'hero.description')).toContain(
      '由泰国开泰银行通过其全资子公司开泰远景有限公司（注册于泰国）在深圳市罗湖区设立',
    )
    expect(pick(zh, 'hero.description')).not.toContain('由泰国开泰银行集团')
  })
})

describe('#246 content audit — MEDIUM (internal consistency)', () => {
  // M1 — about.stats.projects.value
  it('M1: about.stats.projects.value is 20+ (matches achievements.projects)', () => {
    expect(pick(en, 'about.stats.projects.value')).toBe('20+')
    expect(pick(zh, 'about.stats.projects.value')).toBe('20+')
  })

  // M2 — joinUs.contact.email
  it('M2: joinUs.contact.email is the single official inbox', () => {
    expect(pick(en, 'joinUs.contact.email')).toBe('KTECH@kaitaitech.cn')
    expect(pick(zh, 'joinUs.contact.email')).toBe('KTECH@kaitaitech.cn')
  })

  // M3 — privacy.contact.email
  it('M3: privacy.contact.email is the official inbox (prefixed label preserved)', () => {
    expect(pick(en, 'privacy.contact.email')).toBe('Email: KTECH@kaitaitech.cn')
    expect(pick(zh, 'privacy.contact.email')).toBe('电子邮箱：KTECH@kaitaitech.cn')
  })

  // M4 — privacy.contact.address
  it('M4: privacy.contact.address is the Runhong Building address (no fabricated ZIP)', () => {
    expect(pick(en, 'privacy.contact.address')).toBe(
      'Address: 开泰远景信息科技有限公司, 12F, Runhong Building T2, No. 75 Meiyuan Road, Shenzhen, China',
    )
    expect(pick(zh, 'privacy.contact.address')).toBe(
      '地址：开泰远景信息科技有限公司，深圳市梅苑路75号润弘大厦T2座12楼',
    )
    // the fabricated 518000 ZIP must be gone from both locales
    expect(pick(en, 'privacy.contact.address')).not.toContain('518000')
    expect(pick(zh, 'privacy.contact.address')).not.toContain('518000')
  })

  // M5 — contact.info.wechatValue
  it('M5: contact.info.wechatValue is the official WeChat label (no fabricated ID)', () => {
    expect(pick(en, 'contact.info.wechatValue')).toBe('KTech Official WeChat')
    expect(pick(zh, 'contact.info.wechatValue')).toBe('KTech 官方微信')
  })
})

describe('#246 content audit — fabricated identifiers are gone everywhere', () => {
  // Defense-in-depth: the fabricated `@ktech.fintech` mailbox and the
  // `0000 0000` placeholder must not survive in ANY locale leaf that the
  // manifest touched. (Other inboxes — e.g. legal@ — are out of scope and
  // intentionally retained.)
  it('no corrected contact key still holds contact@ktech.fintech', () => {
    expect(pick(en, 'contact.info.emailValue')).not.toBe('contact@ktech.fintech')
    expect(pick(zh, 'contact.info.emailValue')).not.toBe('contact@ktech.fintech')
    expect(pick(en, 'contact.emailValue')).not.toBe('contact@ktech.fintech')
    expect(pick(zh, 'contact.emailValue')).not.toBe('contact@ktech.fintech')
  })

  it('no corrected key still holds the +86 755 0000 0000 placeholder', () => {
    expect(pick(en, 'contact.info.phoneValue')).not.toBe('+86 755 0000 0000')
    expect(pick(zh, 'contact.info.phoneValue')).not.toBe('+86 755 0000 0000')
  })
})
