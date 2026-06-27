/**
 * @file no-raw-i18n-placeholders.spec.js
 * @description Repo-wide regression guard against raw i18n key placeholder
 * rendering.
 *
 * Background: useLanguage() statically imports src/locales/{en,zh}.json and
 * falls back to the raw dotted key (e.g. "hero.title") when a key is missing.
 * Before this guard was added, ~258 keys were missing and many pages rendered
 * raw keys instead of copy. This test mounts each major view with the REAL
 * useLanguage composable (no mock) and asserts that no raw `*.*.*` key pattern
 * leaks through `t()` into the rendered text.
 *
 * If a future change introduces a t('some.new.key') call without adding the key
 * to en.json/zh.json, this test fails and names the offending view.
 *
 * Note: a small number of Home sub-components (Hero, Honors, Services, Culture,
 * Contact, Footer, Header, NavigationDropdown) declare a LOCAL t() map that
 * bypasses useLanguage entirely, so their rendered copy never reaches this
 * fallback path. We still mount Home end-to-end to exercise those children.
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createRouter, createMemoryHistory } from 'vue-router'
import { createPinia, setActivePinia } from 'pinia'

import Home from '../../src/views/Home.vue'
import About from '../../src/views/About.vue'
import Services from '../../src/views/Services.vue'
import Blockchain from '../../src/views/Blockchain.vue'
import MobileApp from '../../src/views/MobileApp.vue'
import JoinUs from '../../src/views/JoinUs.vue'
import PositionList from '../../src/views/PositionList.vue'
import Contact from '../../src/views/Contact.vue'
import News from '../../src/views/News.vue'
import NewsSection from '../../src/components/NewsSection.vue'

// A raw i18n key looks like "namespace.word.word..." — a lowercase-leading
// dotted token with at least two dots. We do NOT anchor on \b because Vue
// renders inline keys glued to adjacent text (e.g. "Home>Blockchain<rawkey>"),
// so there is no word boundary before the key. Instead we match the dotted
// token wherever it appears and rely on the "lowercase namespace + 2+ dots"
// shape to avoid false positives on real copy, emails, or version strings.
const RAW_KEY_PATTERN = /[a-z][a-zA-Z0-9]*\.[a-z][a-zA-Z0-9]*\.[a-zA-Z0-9]+(?:\.[a-zA-Z0-9]+)*/g

// RouterLink stub that preserves the href attribute so views with <router-link>
// mount cleanly without the full router plugin resolving every route.
const RouterLinkStub = {
  name: 'RouterLinkStub',
  props: { to: { type: [String, Object], default: '' } },
  computed: {
    href() {
      return typeof this.to === 'string' ? this.to : (this.to && this.to.path) || ''
    },
  },
  template: '<a :href="href"><slot /></a>',
}

function mountView(component, options = {}) {
  // Use a fresh pinia per mount so stores don't leak between views.
  setActivePinia(createPinia())
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [{ path: '/', component: { template: '<div/>' } }],
  })
  return mount(component, {
    global: {
      plugins: [router],
      stubs: { 'router-link': RouterLinkStub },
      ...options.global,
    },
  })
}

describe('No raw i18n placeholder keys leak into rendered views', () => {
  let wrappers = []

  beforeEach(() => {
    wrappers = []
  })

  const views = [
    { name: 'Home', component: Home },
    { name: 'About', component: About },
    { name: 'Services', component: Services },
    { name: 'Blockchain', component: Blockchain },
    { name: 'MobileApp', component: MobileApp },
    { name: 'JoinUs', component: JoinUs },
    { name: 'PositionList', component: PositionList },
    { name: 'Contact', component: Contact },
    { name: 'News', component: News },
    { name: 'NewsSection', component: NewsSection },
  ]

  it.each(views.map((v) => [v.name, v.component]))(
    '%s renders no raw dotted placeholder key',
    async (_name, component) => {
      const wrapper = mountView(component)
      wrappers.push(wrapper)
      await wrapper.vm.$nextTick()
      const text = wrapper.text()
      const matches = text.match(RAW_KEY_PATTERN)
      expect(matches, `raw key placeholders leaked: ${matches && matches.join(', ')}`).toBeNull()
    }
  )

  // Single consolidated sweep across ALL mounted views at once, so a regression
  // in any one of them surfaces even if the per-view case is edited away.
  it('the union of all major views contains zero raw placeholder keys', async () => {
    const text = views
      .map(({ component }) => {
        const w = mountView(component)
        wrappers.push(w)
        return w.text()
      })
      .join('\n')
    wrappers.forEach((w) => w.unmount())
    const matches = text.match(RAW_KEY_PATTERN)
    expect(matches, `raw key placeholders leaked: ${matches && matches.join(', ')}`).toBeNull()
  })

  afterEach(() => {
    wrappers.forEach((w) => {
      try {
        w.unmount()
      } catch (_) {
        /* already unmounted */
      }
    })
  })
})
