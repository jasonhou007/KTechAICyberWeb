/**
 * @file glow-token-computed-285.spec.js
 * @description Live-DOM computed-style proof that the #285 alpha-step tokens
 * resolve to their declared rgba at computed-style time.
 * @ticket #285
 *
 * The CSS-source gate (style-tokenize-285.spec.js) proves the tokens EXIST and
 * the literals are GONE from source. This file proves the second half of the
 * wiring contract: when a mounted element's box-shadow reads through
 * var(--accent-cyan-alpha-NN) / var(--accent-magenta-alpha-NN), getComputedStyle
 * resolves it to the canonical rgba. If a token were misspelled or its var()
 * reference broken, the computed boxShadow would be empty / the fallback.
 *
 * Approach: inject a <style> block that carries the variables.css :root token
 * definitions (the production source of truth) into the test document, then
 * mount a minimal element whose box-shadow reads through the token. Assert the
 * resolved rgba appears in getComputedStyle().boxShadow. Tokens resolve to
 * their rgba at computed-style time, so assert the rgba value, NOT the token
 * name. content-visibility guard (iter-58): the mount subtree has no
 * content-visibility:auto rule, so the computed style is reachable.
 *
 * GREEN by construction once STEP 1 lands the tokens (no dependency on the
 * STEP 4 bulk replace — this proves the token layer itself resolves).
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { h, defineComponent } from 'vue'

const ROOT = process.cwd()
const VARIABLES_CSS_PATH = resolve(ROOT, 'src/assets/styles/variables.css')

// The full variables.css :root block is the production source of truth for the
// tokens. Injecting it verbatim means the test resolves the SAME rgba the
// production build resolves — not a hand-retyped copy that could drift.
function readVariablesCss() {
  return readFileSync(VARIABLES_CSS_PATH, 'utf-8')
}

// Build a minimal component whose root element's box-shadow reads through a
// given token. Scoped style so it does not leak across tests.
function makeGlowComponent(token) {
  return defineComponent({
    name: 'GlowProbe285',
    setup() {
      return () =>
        h('div', { class: 'glow-probe-285', 'data-testid': 'glow-probe' })
    },
    styles: [],
  }) // styles unused; scoped CSS injected below via the component template
}

// Mount with an inline <style> carrying (1) the variables.css :root tokens and
// (2) a .glow-probe-285 rule that routes box-shadow through the token.
function mountProbe(token) {
  const Component = defineComponent({
    name: 'GlowProbeRoot285',
    setup() {
      return () =>
        h('div', { class: 'glow-probe-285', 'data-testid': 'glow-probe' })
    },
  })
  const variablesCss = readVariablesCss()
  // Append the probe rule onto the real variables.css so :root tokens resolve
  // in the test document exactly as in production.
  const styleContent = `${variablesCss}\n.glow-probe-285 { box-shadow: 0 0 10px ${token}; }`
  const styleEl = document.createElement('style')
  styleEl.setAttribute('data-probe', '285')
  styleEl.textContent = styleContent
  document.head.appendChild(styleEl)
  const wrapper = mount(Component, { attachTo: document.body })
  return { wrapper, styleEl }
}

describe('#285 alpha-step tokens resolve to their rgba in computed box-shadow', () => {
  let probes

  beforeEach(() => {
    probes = []
  })

  afterEach(() => {
    for (const p of probes) {
      p.wrapper.unmount()
      p.styleEl.remove()
    }
    probes = []
  })

  const CASES = [
    { token: 'var(--accent-cyan-alpha-20)', expectRgba: '0, 255, 204, 0.2' },
    { token: 'var(--accent-cyan-alpha-50)', expectRgba: '0, 255, 204, 0.5' },
    { token: 'var(--accent-magenta-alpha-30)', expectRgba: '255, 0, 170, 0.3' },
    { token: 'var(--accent-magenta-alpha-60)', expectRgba: '255, 0, 170, 0.6' },
  ]

  it.each(CASES)(
    '$token resolves boxShadow to contain rgba($expectRgba)',
    ({ token, expectRgba }) => {
      const probe = mountProbe(token)
      probes.push(probe)
      const el = probe.wrapper.get('[data-testid="glow-probe"]').element
      const boxShadow = getComputedStyle(el).boxShadow
      // box-shadow serialization is implementation-defined (rgba vs rgb vs
      // hex, spacing), so assert the rgba channel tuple is present rather
      // than an exact string. The resolved value MUST be non-empty (a broken
      // var() reference yields '' in happy-dom) AND contain the rgba tuple.
      expect(boxShadow.length, `box-shadow resolved empty for ${token} — var() broken`).toBeGreaterThan(0)
      expect(boxShadow, `expected rgba(${expectRgba}) in box-shadow for ${token}, got "${boxShadow}"`).toContain(expectRgba)
    }
  )
})
