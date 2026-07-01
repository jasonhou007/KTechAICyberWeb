import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import PositionList from '../../src/views/PositionList.vue'
import { useLanguage } from '../../src/composables/useLanguage'
import { createRouter, createMemoryHistory } from 'vue-router'
import { createPinia } from 'pinia'

// Drives the REAL useLanguage composable (translations are statically bundled
// in src/locales/{en,zh}.json). No module mock. This is the regression gate for
// #287: PositionList.vue used to reference currentLanguage.value INSIDE the
// <template>, where refs auto-unwrap so .value is undefined -> the whole render
// threw "Cannot read properties of undefined (reading 'length')" and NO
// .position-card reached the DOM. If the bug returns, the card-count assertion
// in test 1 (the regression gate) fails.
//
// positions.json loads via dynamic `import()` in onMounted. flush-promises is
// not installed in this repo, so we let the async import resolve with a
// setTimeout(0) macrotask after nextTick (see vitest-dynamic-import-timing).

describe('PositionList.vue', () => {
  let router
  let pinia
  let wrapper

  beforeEach(() => {
    router = createRouter({
      history: createMemoryHistory(),
      routes: [
        { path: '/careers', component: PositionList },
        { path: '/', component: { template: '<div>Home</div>' } },
        { path: '/join-us', component: { template: '<div>JoinUs</div>' } },
      ],
    })
    pinia = createPinia()
    useLanguage().setLanguage('en')
  })

  afterEach(() => {
    if (wrapper) wrapper.unmount()
    useLanguage().setLanguage('en')
  })

  const mountPositionList = () => {
    wrapper = mount(PositionList, { global: { plugins: [router, pinia] } })
    return wrapper
  }

  // Helper: let the onMounted dynamic import('../data/positions.json') resolve
  // and the re-render settle. The dynamic import is a macrotask that resolves
  // nondeterministically relative to the microtask queue, so a single
  // setTimeout(0) is not enough — poll for up to ~500ms (50 tries × 10ms) until
  // the cards reach the DOM. See vitest-dynamic-import-timing memory.
  const waitForPositions = async (w) => {
    for (let i = 0; i < 50; i++) {
      await nextTick()
      if (w.findAll('.position-card').length > 0) return
      await new Promise((r) => setTimeout(r, 10))
    }
  }

  it('renders 8 position cards after the data load (AC1, #287 regression gate)', async () => {
    const w = mountPositionList()
    await waitForPositions(w)
    // If #287 returns (currentLanguage.value in <template>), the render throws
    // during the post-load re-render and 0 cards reach the DOM -> this fails.
    expect(w.findAll('.position-card').length).toBe(8)
  })

  it('does not throw during render (regression: no "reading \'length\'" TypeError)', async () => {
    // The #287 throw surfaces in the synchronous re-render once positions load.
    // mountPositionList() itself does not throw (onMounted fires async), but if
    // the bug is present the post-load re-render throws and the card-count
    // assertion below fails. This test makes that contract explicit.
    const w = mountPositionList()
    await waitForPositions(w)
    expect(w.findAll('.position-card').length).toBe(8)
  })

  it('card description resolves the real \'en\' locale (not undefined)', async () => {
    const w = mountPositionList()
    await waitForPositions(w)
    // Proves currentLanguage is wired correctly: position.description['en']
    // resolves to real prose, not the undefined that broke the old render.
    expect(w.find('.position-card__description').text().trim().length).toBeGreaterThan(0)
  })

  it('renders the .position-card__badge in the live DOM', async () => {
    const w = mountPositionList()
    await waitForPositions(w)
    // Underpins the #252 live contrast path: the badge must be present so the
    // E2E contrast gate can sample its painted colors instead of falling back.
    expect(w.find('.position-card__badge').exists()).toBe(true)
  })
})
