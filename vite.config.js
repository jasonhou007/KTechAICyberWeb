import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

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
      // subpath (e.g. /KTechAICyberWeb/assets/index-HASH.css). Vite emits
      // the link with attributes in varying order, often with `crossorigin`
      // between rel and href (e.g.
      // `<link rel="stylesheet" crossorigin href=".../index-HASH.css">`), so
      // the regex matches a link that has BOTH rel="stylesheet" AND an
      // href ending in /assets/index-*.css, in any order, separated by
      // other attributes. The capture group is the href value.
      const blockingLinkRegex =
        /<link\s+([^>]*?rel=["']stylesheet["'][^>]*?href=["']([^"']+\/assets\/index-[^"']+\.css)["'][^>]*?|[^>]*?href=["']([^"']+\/assets\/index-[^"']+\.css)["'][^>]*?rel=["']stylesheet["'][^>]*?)>/i
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
  build: {
    // Production sourcemaps are disabled: emitting .map files leaks original
    // source to the public site and adds a separate .map fetch per chunk that
    // the browser can request even when unneeded. Debugging happens in dev
    // mode (sourcemaps on by default there). Set to true only if you need to
    // debug the production build locally.
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          // Group the framework + shared-app deps into one long-lived,
          // strongly-cacheable vendor chunk so they are not re-fetched on
          // every route change. pinia/@vueuse are app-wide (used by App shell
          // + many routes), so pulling them out of the per-route chunks keeps
          // the route chunks small and the vendor chunk stable across deploys.
          vendor: ['vue', 'vue-router', 'pinia', '@vueuse/core', '@vueuse/head']
        }
      }
    }
  }
})
