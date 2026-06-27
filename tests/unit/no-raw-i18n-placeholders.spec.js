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
 * Note: the Home sub-components (Hero, Honors, Services, Culture, Contact,
 * Footer, Header, NavigationDropdown) previously declared a LOCAL t() map that
 * bypassed useLanguage entirely. They have since been migrated onto the shared
 * useLanguage() composable, so we now mount each of them directly (in both en
 * and zh) below — a missing key in any of them now surfaces here.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createRouter, createMemoryHistory } from 'vue-router'
import { createPinia, setActivePinia } from 'pinia'
import { h } from 'vue'

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

// The 8 components migrated from local t() maps onto useLanguage().
import Hero from '../../src/components/Hero.vue'
import Honors from '../../src/components/Honors.vue'
import ServicesSection from '../../src/components/Services.vue'
import Culture from '../../src/components/Culture.vue'
import ContactSection from '../../src/components/Contact.vue'
import Footer from '../../src/components/Footer.vue'
import Header from '../../src/components/Header.vue'
import NavigationDropdown from '../../src/components/NavigationDropdown.vue'
import { useLanguage } from '../../src/composables/useLanguage'

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

// Transition stub that renders its children, so v-if content is visible for
// components that gate real copy behind a loading Transition (Hero, Services,
// Culture, Contact, Honors).
const transitionSlotStub = {
  render() {
    return h('div', { class: 'transition-stub' }, this.$slots.default ? this.$slots.default() : [])
  },
}

// Minimal vue-router mock so NavigationDropdown (which calls useRouter()) mounts.
const router = createRouter({
  history: createMemoryHistory(),
  routes: [{ path: '/', component: { template: '<div/>' } }],
})

describe('Migrated components (Hero, Honors, Services, Culture, Contact, Footer, Header, NavigationDropdown) leak no raw keys', () => {
  const migratedComponents = [
    { name: 'Hero', component: Hero, stubs: { Transition: transitionSlotStub } },
    { name: 'Honors', component: Honors, stubs: { Transition: transitionSlotStub } },
    { name: 'Services (section)', component: ServicesSection, stubs: { Transition: transitionSlotStub } },
    { name: 'Culture', component: Culture, stubs: { Transition: transitionSlotStub } },
    { name: 'Contact (section)', component: ContactSection, stubs: { Transition: transitionSlotStub } },
    { name: 'Footer', component: Footer, stubs: {} },
    { name: 'Header', component: Header, stubs: {} },
    {
      name: 'NavigationDropdown',
      component: NavigationDropdown,
      stubs: {},
      props: {
        label: 'About Us',
        items: [
          { key: 'about', label: 'nav.about', route: '/about' },
          { key: 'news', label: 'nav.news', route: '/news' },
        ],
      },
    },
  ]

  const { setLanguage } = useLanguage()
  let originalLang

  beforeEach(() => {
    originalLang = useLanguage().currentLanguage.value
  })

  afterEach(() => {
    // Restore whatever the suite-wide language was before this test ran.
    setLanguage(originalLang)
  })

  it.each(['en', 'zh'])(
    'renders no raw dotted placeholder key in the %s locale',
    (lang) => {
      setLanguage(lang)
      const text = migratedComponents
        .map(({ component, stubs, props }) => {
          setActivePinia(createPinia())
          const w = mount(component, {
            props,
            global: { plugins: [router], stubs },
          })
          // Open the dropdown so its item labels render too.
          if (component === NavigationDropdown) {
            w.find('.dropdown-trigger').trigger('click')
          }
          const t = w.text()
          w.unmount()
          return t
        })
        .join('\n')
      const matches = text.match(RAW_KEY_PATTERN)
      expect(matches, `raw key placeholders leaked in ${lang}: ${matches && matches.join(', ')}`).toBeNull()
    }
  )
})
