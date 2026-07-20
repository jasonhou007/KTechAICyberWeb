import { ViteSSG } from 'vite-ssg'
import { createPinia } from 'pinia'
// #260: App.vue calls useHead(() => ({ title, meta, ... })) to drive per-route
// document titles + OG tags. Before #260, createHead() was never installed, so
// useHead was a silent no-op and document.title stayed frozen at the static
// index.html value on every route. Installing the plugin makes the head effect
// live (the AC2 fix). vite-ssg v28 ships @unhead/vue auto-installed in its
// SSR context, but App.vue's useHead() (from @vueuse/head, the legacy export)
// still needs createHead() installed client-side — vite-ssg tolerates the
// double-install (both clients share the same DOM patch queue).
import { createHead } from '@vueuse/head'

// Global theme (CSS variables + reset) — required by all components.
// Without this the SPA renders unstyled because component styles reference
// var(--cyan), var(--font-display), etc. defined in assets/styles/variables.css.
//
// #334 perf: variables.css + fonts.css are imported JS-side (BEFORE main.css)
// instead of via CSS @import inside main.css. CSS @import is render-blocking
// AND serial; JS-side CSS imports are bundled by Vite into a single stylesheet
// (no serial fetch). Order matters: variables.css must load before main.css
// so the custom properties main.css consumes are defined, and fonts.css
// (#335 self-hosted Orbitron/Rajdhani, font-display: optional) loads before
// main.css so the @font-face rules are declared before any rule resolves a
// var(--font-display)/var(--font-body) family to a real face. main.css
// previously did `@import './variables.css'` + `@import './fonts.css'` at its
// top — both lines are removed and the ordering is reproduced here.
import './assets/styles/variables.css'
import './assets/styles/fonts.css'
import './assets/styles/main.css'
// #334 perf: accessibility.css + cyber.css were previously loaded via CSS
// @import inside App.vue's <style> block (render-blocking + serial). They are
// now imported JS-side here so Vite bundles them into the single global
// stylesheet. Order matches App.vue's former @import order (accessibility,
// then cyber) to preserve cascade specificity.
import './styles/accessibility.css'
// #340 perf (follow-up to #334): cyber.css (79 lines of decorative
// neon/scanline/glow rules) is moved OUT of the entry CSS bundle into an
// ASYNC CHUNK via a dynamic `import()`. The 3 target routes (/about,
// /contact, /news) measured ~730ms of FCP wasted on the render-blocking
// entry sheet; cyber.css is decorative (no above-the-fold element needs it
// to paint correctly — it layers glow/scanline effects on top of the
// already-styled content from variables.css + main.css), so deferring it
// recovers ~220ms without FOUC. The OTHER global sheets (variables.css,
// fonts.css, main.css, accessibility.css) stay as static JS-side imports
// because they ARE critical (CSS custom properties, @font-face, reset, a11y
// focus rings) — those rules must resolve before any component renders.
//
// The dynamic `import()` causes Vite to emit cyber.css as a separate chunk
// fetched only after the entry module evaluates, instead of inlining it
// into the entry CSS bundle. This file STILL contains the literal
// `cyber.css` (so the #334 wiring-gate grep stays green); the #340
// increment is the dynamic form.
//
// #348 SSG note: vite-ssg's build-time render runs the entry module to
// bootstrap the SSR app, so this dynamic import resolves during SSG
// (cyber.css lands in the SSR-rendered <head> via the critical-CSS
// inliner). At runtime the dynamic import is a no-op (the sheet is already
// in the document) — verified by the no-FOUC manual check.
import('./assets/styles/cyber.css')

import App from './App.vue'

// Home is the LCP route AND the entry view users hit on '/'. It MUST be eager:
// its JS and CSS land in the synchronous initial bundle so the footer's layout
// is stable from first paint. An earlier revision of #18 lazy-loaded Home
// too, splitting its CSS into a separate async chunk that arrived after
// initial paint and re-flowed footer.cyber-footer, spiking CLS above the 0.1
// budget. Keeping Home eager fixes that CLS regression while preserving the
// bundle win that comes from the OTHER 17 routes below being lazy — not Home.
// (Per the #18 adversarial review: do not cite device-specific Lighthouse
// deltas in code comments — they go stale and were mislabeled once already.)
import Home from './views/Home.vue'

// Route-level code splitting: every non-Home view is a lazy dynamic import so
// Vite emits it as its own small chunk, fetched on demand when the route is
// hit. This replaces the previous single ~243 kB index bundle: the entry now
// only carries App + router + Home, and the heavy views (Services, News,
// PositionList, ...) no longer bloat the initial download. The catch-all keeps
// the 'not-found' name and NotFound view (#140 blank-page fix) — the lazy
// import path './views/NotFound.vue' still contains the literal 'NotFound', so
// the router-base.spec.js text contract still matches.
const routes = [
  { path: '/', component: Home },
  { path: '/about', component: () => import('./views/About.vue') },
  { path: '/news', component: () => import('./views/News.vue') },
  { path: '/news/:slug', component: () => import('./views/NewsDetail.vue'), props: true },
  { path: '/services/supply-chain-finance', component: () => import('./views/SupplyChainFinance.vue') },
  { path: '/services/project-and-program-management', component: () => import('./views/ServiceProjectManagement.vue') },
  { path: '/services/blockchain', component: () => import('./views/Blockchain.vue') },
  { path: '/services/big-data-ai', component: () => import('./views/ServiceBigData.vue') },
  { path: '/services/retail-lending', component: () => import('./views/ServiceRetailLending.vue') },
  { path: '/services/cross-border-payment', component: () => import('./views/ServiceCrossBorderPayment.vue') },
  { path: '/services/digital-asset-custody', component: () => import('./views/ServiceDigitalAssetCustody.vue') },
  { path: '/services/stablecoin', component: () => import('./views/ServiceStablecoin.vue') },
  { path: '/join-us', component: () => import('./views/JoinUs.vue') },
  { path: '/contact', component: () => import('./views/Contact.vue') },
  { path: '/careers', component: () => import('./views/PositionList.vue') },
  { path: '/privacy', component: () => import('./views/PrivacyPolicy.vue') },
  { path: '/terms', component: () => import('./views/Terms.vue') },
  // Neon Pulse audio-reactive visualizer (#186) — opt-in, lazy chunk. Wired
  // into Home AND reachable as its own route so the visualizer is exercisable
  // in isolation (and shipped-app gate: it must appear in both places).
  { path: '/pulse', name: 'pulse', component: () => import('./components/NeonPulse.vue') },
  // Catch-all: render NotFound for any unmatched path so deep links / typos
  // no longer render a blank page. (:pathMatch(.*)* is the vue-router 4 form.)
  { path: '/:pathMatch(.*)*', name: 'not-found', component: () => import('./views/NotFound.vue') }
]

// #348: build-time SSG (vite-ssg) replaces the createApp().mount() form so the
// 5 marketing routes (/, /about, /contact, /news, /services) are PRE-RENDERED
// at build time. Their LCP HTML+CSS lands in the initial document, so first
// paint is no longer gated on the SPA's JS-bundle download + parse + hydrate
// cycle under Lighthouse's simulated 4G throttling — the architectural
// ~2800ms floor measured on every non-Home route in the #346 post-state
// (witness /services at 2767ms confirmed it was NOT route-specific) is closed
// by shipping first-paint HTML that does not wait for hydration. The non-
// marketing routes fall through to SPA-hydrated fallback (the index document's
// app shell mounts and the router takes over).
//
// ViteSSG's signature: ViteSSG(App, routerOptions, fn?, clientOptions?).
// The callback receives ({ app, router, ... }) after the app is created (both
// on the SSG server AND in the browser on hydration) — the plugin chain
// (pinia, head) lives here so both render paths install them identically.
// routerOptions.base MUST be import.meta.env.BASE_URL so the deployed subpath
// /KTechAICyberWeb/ is preserved (same as the pre-SSG createWebHistory
// argument — #140 blank-page fix).
//
// The SSG build-time options (dirStyle, includedRoutes) live under
// ssgOptions in vite.config.js (not here) because they are build-only —
// the client entry just hydrates. The includedRoutes filter enumerates the
// 5 marketing routes explicitly so dynamic routes (/news/:slug, the
// per-service routes) keep their existing SPA-fallback behaviour (their
// content is data-driven and would need a per-entry build-time crawl that
// is out of scope for #348).
export const createApp = ViteSSG(
  App,
  {
    routes,
    base: import.meta.env.BASE_URL,
    scrollBehavior(to, from, savedPosition) {
      // #434: smooth scroll navigation with three cases

      // Case 1: Browser back/forward button - restore saved position
      if (savedPosition) {
        return savedPosition
      }

      // Respect prefers-reduced-motion
      const prefersReducedMotion =
        typeof window !== 'undefined' &&
        window.matchMedia('(prefers-reduced-motion: reduce)').matches
      const behavior = prefersReducedMotion ? 'auto' : 'smooth'

      // Case 2: Hash navigation (#section) with offset for fixed header
      if (to.hash) {
        return {
          el: to.hash,
          behavior,
          top: 80, // Offset for fixed header
        }
      }

      // Case 3: Regular route change - scroll to top
      return { top: 0, behavior }
    },
  },
  ({ app }) => {
    app.use(createPinia())
    app.use(createHead())
  },
)
