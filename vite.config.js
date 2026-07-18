import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath, URL } from 'node:url'

const SITE_URL = 'https://jasonhou007.github.io/KTechAICyberWeb'

/**
 * #340 Step 2 — defer the entry CSS bundle via preload + async-onload.
 *
 * Vite injects the production stylesheet as a render-blocking
 * `<link rel="stylesheet" href=".../assets/index-HASH.css">` into the built
 * dist/index.html. The browser stops parsing HTML until the sheet downloads +
 * parses, which on /about, /contact, /news measured ~730ms of FCP waste
 * (the SOLE remaining render-blocking resource after #334 Fix B removed the
 * serial CSS @import chains). This plugin rewrites that link into the
 * web-standard non-blocking pattern:
 *
 *   <link rel="preload" href="...index-HASH.css" as="style"
 *         onload="this.onload=null;this.rel='stylesheet'">
 *   <noscript><link rel="stylesheet" href="...index-HASH.css"></noscript>
 *
 * The browser preloads the sheet WITHOUT blocking render; onload flips rel
 * to 'stylesheet' so the rules apply once available. <noscript> preserves
 * the styles for no-JS clients.
 *
 * enforce:'post' is CRITICAL — it makes this hook run AFTER Vite's built-in
 * HTML handling has resolved the hashed chunk URL and injected the production
 * <link rel="stylesheet">. Without enforce:'post', the link has not been
 * emitted yet and the regex matches nothing.
 *
 * The transform is a no-op in `vite dev` (serve mode): Vite injects styles
 * via JS in dev, so there is no <link rel="stylesheet"> for the regex to
 * match — the hook returns the HTML unchanged. The defer is a build-only
 * optimization, which is exactly what we want (dev needs blocking styles
 * for HMR correctness).
 */
function deferEntryCss() {
  return {
    name: 'ktech-defer-entry-css',
    enforce: 'post',
    transformIndexHtml(html) {
      // Match Vite's injected render-blocking stylesheet link for the entry
      // CSS chunk. The href is the resolved production URL under the base
      // subpath (e.g. /KTechAICyberWeb/assets/index-HASH.css for a plain
      // `vite build`, or /KTechAICyberWeb/assets/app-HASH.css for a
      // `vite-ssg build` — see #348: vite-ssg renames the SSG client entry
      // chunk from `index-*` to `app-*`). Vite emits the link with attributes
      // in varying order, often with `crossorigin` between rel and href
      // (e.g. `<link rel="stylesheet" crossorigin href=".../index-HASH.css">`),
      // so the regex matches a link that has BOTH rel="stylesheet" AND an
      // href ending in /assets/(index|app)-*.css, in any order, separated by
      // other attributes. The capture group is the href value.
      const blockingLinkRegex =
        /<link\s+([^>]*?rel=["']stylesheet["'][^>]*?href=["']([^"']*\/assets\/(?:index|app)-[^"']+\.css)["'][^>]*?|[^>]*?href=["']([^"']*\/assets\/(?:index|app)-[^"']+\.css)["'][^>]*?rel=["']stylesheet["'][^>]*?)>/i
      const match = html.match(blockingLinkRegex)
      if (!match) {
        // No render-blocking entry link found. In dev this is expected (Vite
        // injects styles via JS, not a <link>). In build it would mean Vite
        // changed its injection format — leave the HTML unchanged rather
        // than risk breaking it, and rely on the 340-perf-css-defer-pattern
        // unit test to flag the regression.
        return html
      }
      // href is capture group 2 (rel-first) or 3 (href-first).
      const href = match[2] || match[3]
      const preload =
        `<link rel="preload" href="${href}" as="style" ` +
        `onload="this.onload=null;this.rel='stylesheet'">`
      const noscript = `<noscript><link rel="stylesheet" href="${href}"></noscript>`
      return html.replace(match[0], preload + noscript)
    },
  }
}

export default defineConfig({
  plugins: [vue(), deferEntryCss()],
  base: '/KTechAICyberWeb/',
  server: {
    port: 3000
  },
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) }
  },
  // #348 SSG build-time options. vite-ssg's CLI (`vite-ssg build`) reads this
  // block to control which routes get pre-rendered and how the per-route HTML
  // lands on disk. The client entry (src/main.js) is unaffected — it just
  // hydrates whatever HTML the SSG pass emitted.
  //
  // dirStyle:'nested' emits dist/<route>/index.html (vs flat's
  // dist/<route>.html) so static hosts (GitHub Pages) serve each route as a
  // folder with a default index. This matches the existing dev-server +
  // router-base expectations (pushState paths under /KTechAICyberWeb/).
  //
  // includedRoutes filters the route list to the 5 marketing routes that
  // #348 targets. Dynamic routes (/news/:slug, the per-service routes) stay
  // SPA-hydrated because their content is data-driven and would need a per-
  // entry build-time crawl that is out of scope for this ticket. The function
  // signature is vite-ssg's: (paths, routes) => string[]. paths is the full
  // flattened route path list; we return only the marketing set so the SSG
  // build stays fast and the data-driven routes keep their SPA fallback.
  //
  // formatting:'none' is vite-ssg's default and matches Vite's build output
  // (no minify, no prettify). The deferred-entry-CSS plugin in this file
  // runs as enforce:'post' AFTER vite-ssg emits each route's HTML, so the
  // regex-based stylesheet-defer rewrite still applies on top of the SSG
  // output. (Verified by the 348-ssg-output + 348-perf-css-defer-pattern
  // tests: the prod dist/<route>/index.html files contain the preload+onload
  // form, not the render-blocking <link rel="stylesheet">.)
  ssgOptions: {
    dirStyle: 'nested',
    formatting: 'none',
    includedRoutes(/* paths, routes */) {
      // Return the 5 marketing routes UNCONDITIONALLY (do NOT filter by the
      // paths argument). vite-ssg's default includedRoutes filters out paths
      // that don't match a declared route, which would drop '/services' (the
      // /services URL has no declared route — it falls through to NotFound's
      // catch-all, but the AC still measures it as a witness). Returning the
      // literal list forces vite-ssg to render every URL we want pre-rendered
      // HTML for, regardless of whether a static route declaration exists.
      // The /services page renders NotFound content via the catch-all — that
      // is the SAME content the SPA served pre-SSG, so the before/after LCP
      // comparison is apples-to-apples (same route, just pre-rendered HTML
      // vs SPA-hydrated).
      return ['/', '/about', '/contact', '/news', '/services']
    },
  },
  build: {
    // Production sourcemaps are disabled: emitting .map files leaks original
    // source to the public site and adds a separate .map fetch per chunk that
    // the browser can request even when unneeded. Debugging happens in dev
    // mode (sourcemaps on by default there). Set to true only if you need to
    // debug the production build locally.
    sourcemap: false,
    rollupOptions: {
      output: {
        // #348 SSG: vite-ssg runs TWO build passes — a client build (where
        // chunking helps) and an SSR build (where vue/vue-router/pinia are
        // externalized and CANNOT be in manualChunks, or rollup rejects with
        // EXTERNAL_MODULES_CANNOT_BE_INCLUDED_IN_MANUAL_CHUNKS). vite-ssg
        // sets process.env.VITE_SSG='true' before the SSR pass; we return
        // undefined from the function form so the SSR bundle is a single
        // entry chunk, and return the vendor-grouping object for the client
        // pass. The function form (vs the old object form) is what makes the
        // pass-aware split possible.
        manualChunks(id, { getModuleInfo }) {
          if (process.env.VITE_SSG === 'true') return undefined
          // Group the framework + shared-app deps into one long-lived,
          // strongly-cacheable vendor chunk so they are not re-fetched on
          // every route change. pinia/@vueuse are app-wide (used by App shell
          // + many routes), so pulling them out of the per-route chunks keeps
          // the route chunks small and the vendor chunk stable across deploys.
          if (
            id.includes('node_modules/vue/') ||
            id.includes('node_modules/@vue/') ||
            id.includes('node_modules/vue-router/') ||
            id.includes('node_modules/pinia/') ||
            id.includes('node_modules/@vueuse/core/') ||
            id.includes('node_modules/@vueuse/head/')
          ) {
            return 'vendor'
          }
          return undefined
        },
      }
    }
  }
})

export { deferEntryCss }
