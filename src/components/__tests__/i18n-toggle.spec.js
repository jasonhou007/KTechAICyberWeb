/**
 * @file i18n-toggle.spec.js
 * @description Regression guard: the 8 components migrated off local t() maps
 * onto the shared useLanguage() composable must actually re-render when the
 * site language flips. Before the migration each component held a hardcoded
 * local translation map, so toggling the language left their text stuck in one
 * language. These tests set the language to `zh` (via the same composable the
 * LanguageSwitcher drives) and assert that real Chinese copy renders in a
 * representative subset: Footer, Header, Contact.
 *
 * The shared language lives in a module-scoped ref inside useLanguage, so
 * setLanguage('zh') before mount() is enough to flip every component that
 * calls useLanguage(). We reset to 'en' in afterEach so other suites keep
 * their default-English assumptions.
 */

import { describe, it, expect, afterEach, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { h, ref } from 'vue'

import { useLanguage } from '../../composables/useLanguage'
import Footer from '../Footer.vue'
import Header from '../Header.vue'
import Contact from '../Contact.vue'

// Contact.vue gates its real copy behind `v-if="!isLoading"` driven by
// useSkeleton(). With the real composable, isLoading starts true and only
// clears via the IntersectionObserver (which never fires in a jsdom/happy-dom
// unit mount), so `.section-title` / `.contact-item` never render and the
// Chinese-copy assertions below would never see the text. Mock useSkeleton so
// isLoading is false from the start — the content renders synchronously and the
// language-toggle regression is actually exercised. Path resolves relative to
// this test file: src/components/__tests__/ -> src/composables/useSkeleton.
const mockIsLoading = ref(false)
vi.mock('../../composables/useSkeleton', () => ({
  useSkeleton: () => ({
    isLoading: mockIsLoading,
    hasLoaded: ref(true),
    target: ref(null),
    isVisible: ref(true),
  }),
}))

const { setLanguage } = useLanguage()

// Transition stub that renders its children, so v-if content is visible.
const transitionStub = {
  render() {
    return h('div', { class: 'transition-stub' }, this.$slots.default ? this.$slots.default() : [])
  },
}

// router-link stub: the rewritten Header (#164) renders the logo, Home, and
// Contact items as <router-link>, which otherwise fail to resolve in an
// isolated mount. Renders <a :href="to"> with slotted content.
const routerLinkStub = {
  name: 'RouterLink',
  props: { to: { type: [String, Object], default: '' } },
  computed: {
    href() {
      return typeof this.to === 'string' ? this.to : (this.to && this.to.path) || ''
    },
  },
  template: '<a :href="href"><slot /></a>',
}

function mountWithStubs(component) {
  return mount(component, {
    global: {
      stubs: { Transition: transitionStub, 'router-link': routerLinkStub },
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

  it('Footer renders Chinese company name and copyright after toggle', () => {
    const wrapper = mount(Footer)
    expect(wrapper.find('.footer-text').text()).toBe('开泰远景信息科技有限公司')
    expect(wrapper.find('.footer-copyright').text()).toBe('© 2025 KTech AI. 所有系统正常运行。')
    wrapper.unmount()
  })

  it('Header renders Chinese nav labels after toggle', () => {
    const wrapper = mountWithStubs(Header)
    // The rewritten Header (#164) renders Home + About + News + Contact as
    // router-link <a> and the 2 dropdown top-level items (Our Solutions /
    // Join Us) as NavigationDropdown <button> triggers. (#255 made About a
    // direct link to /about; #256 made News a direct link to /news.)
    const anchors = wrapper.findAll('ul.nav-links a').map((a) => a.text())
    expect(anchors).toEqual(['首页', '关于我们', '新闻', '联系'])
    const triggers = wrapper
      .findAll('ul.nav-links .dropdown-trigger')
      .map((b) => b.text().replace('▼', '').trim())
    expect(triggers).toEqual(['解决方案', '加入我们'])
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
