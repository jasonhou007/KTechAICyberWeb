/**
 * @file i18n-toggle.spec.js
 * @description Regression guard: the 8 components migrated off local t() maps
 * onto the shared useLanguage() composable must actually re-render when the
 * site language flips. Before the migration each component held a hardcoded
 * local translation map, so toggling the language left their text stuck in one
 * language. These tests set the language to `zh` (via the same composable the
 * LanguageSwitcher drives) and assert that real Chinese copy renders in a
 * representative subset: Hero, Footer, Header, Contact.
 *
 * The shared language lives in a module-scoped ref inside useLanguage, so
 * setLanguage('zh') before mount() is enough to flip every component that
 * calls useLanguage(). We reset to 'en' in afterEach so other suites keep
 * their default-English assumptions.
 */

import { describe, it, expect, afterEach, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { h } from 'vue'

import { useLanguage } from '../../composables/useLanguage'
import Hero from '../Hero.vue'
import Footer from '../Footer.vue'
import Header from '../Header.vue'
import Contact from '../Contact.vue'

const { setLanguage } = useLanguage()

// Transition stub that renders its children, so v-if content is visible.
const transitionStub = {
  render() {
    return h('div', { class: 'transition-stub' }, this.$slots.default ? this.$slots.default() : [])
  },
}

function mountWithStubs(component) {
  return mount(component, {
    global: {
      stubs: { Transition: transitionStub },
    },
  })
}

describe('migrated components re-render on language toggle to zh', () => {
  beforeEach(() => {
    // Flip the shared language to Chinese before each mount below.
    setLanguage('zh')
  })

  afterEach(() => {
    // Restore the default English locale so other suites are unaffected.
    setLanguage('en')
  })

  it('Hero renders Chinese title and stats labels after toggle', () => {
    const wrapper = mountWithStubs(Hero)
    expect(wrapper.find('.hero-title .main').text()).toBe('开泰科技')
    const labels = wrapper.findAll('.stat-item .stat-label').map((el) => el.text())
    expect(labels).toEqual(['成立年份', '注册资本（元）', '建设项目'])
    wrapper.unmount()
  })

  it('Footer renders Chinese company name and copyright after toggle', () => {
    const wrapper = mount(Footer)
    expect(wrapper.find('.footer-text').text()).toBe('开泰远景信息科技有限公司')
    expect(wrapper.find('.footer-copyright').text()).toBe('© 2025 KTech AI. 所有系统正常运行。')
    wrapper.unmount()
  })

  it('Header renders Chinese nav labels after toggle', () => {
    const wrapper = mount(Header)
    const links = wrapper.findAll('ul.nav-links a').map((a) => a.text())
    expect(links).toEqual(['服务', '荣誉', '联系'])
    wrapper.unmount()
  })

  it('Contact renders Chinese title, subtitle, and item labels after toggle', () => {
    const wrapper = mountWithStubs(Contact)
    expect(wrapper.find('.section-title').text()).toBe('联系')
    expect(wrapper.find('.section-subtitle').text()).toBe('欢迎与我们合作，开启您的下一个项目')
    const labels = wrapper.findAll('.contact-item h4').map((h4) => h4.text())
    expect(labels).toEqual(['公司地址', '电子邮箱', '官方网站'])
    wrapper.unmount()
  })
})
