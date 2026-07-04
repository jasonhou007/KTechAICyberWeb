/**
 * #348 Thin wrapper around vite-ssg's Node build() API.
 *
 * Why: vite-ssg's cac-based CLI (vite-ssg build) rejects `--outDir` outright
 * (CACError: Unknown option `--outDir`), but the Lighthouse CI audit-variant
 * build steps invoke `npm run build -- --base=/ --outDir dist-audit` and
 * `--base=/ --outDir dist-audit-mob`. The plain `vite build` CLI accepts
 * `--outDir`; vite-ssg's CLI does not.
 *
 * This wrapper parses the flags the CI passes (--base, --outDir, plus the
 * vite-ssg-recognized --mode / --config / -c) and forwards them to vite-ssg's
 * Node `build(ssgOptions, viteConfig)` API, mirroring exactly how the CLI
 * distributes args (see node_modules/vite-ssg/dist/node/cli.mjs):
 *   - --base, --script, --mock, --mode -> ssgOptions (first arg)
 *   - --config/-c                       -> { configFile }   (second arg key)
 *   - --outDir                          -> viteConfig.build.outDir (second arg)
 *
 * The no-arg case (default `npm run build`) reproduces `vite-ssg build`
 * exactly: build({}, {}), which writes prerendered HTML to ./dist.
 */
import process from 'node:process'
import { build } from 'vite-ssg/node'

// --- minimal argv parser (handles --flag value, --flag=value, boolean flags) ---
const argv = process.argv.slice(2)
const parsed = { _: [] }
for (let i = 0; i < argv.length; i++) {
  const a = argv[i]
  if (a.startsWith('--')) {
    const eq = a.indexOf('=')
    if (eq !== -1) {
      parsed[a.slice(2, eq)] = a.slice(eq + 1)
    } else {
      const next = argv[i + 1]
      const key = a.slice(2)
      if (next === undefined || next.startsWith('--')) {
        parsed[key] = true // boolean flag
      } else {
        parsed[key] = next
        i++
      }
    }
  } else if (a.startsWith('-') && a.length === 2) {
    // short flag like -c <value>
    const next = argv[i + 1]
    if (next !== undefined && !next.startsWith('-')) {
      parsed[a.slice(1)] = next
      i++
    } else {
      parsed[a.slice(1)] = true
    }
  } else {
    parsed._.push(a)
  }
}

// --- distribute args exactly as the vite-ssg CLI does ---
const ssgOptions = {}
if (parsed.base !== undefined) ssgOptions.base = parsed.base
if (parsed.script !== undefined) ssgOptions.script = parsed.script
if (parsed.mock) ssgOptions.mock = true
if (parsed.mode) ssgOptions.mode = parsed.mode

const viteConfig = {}
if (parsed.config || parsed.c) viteConfig.configFile = parsed.config || parsed.c
if (parsed.outDir) {
  viteConfig.build = { ...viteConfig.build, outDir: parsed.outDir }
}

// Mirror the CLI's 15s force-exit watchdog so a misconfigured build cannot
// hang CI forever (see cli.mjs lines 23-29).
const forceExit = setTimeout(() => {
  console.log('\x1B[90m[vite-ssg]\x1B[33m Build process still running after 15s. There might be something misconfigured in your setup. Force exit.\x1B[0m')
  process.exit(0)
}, 15 * 1000)
forceExit.unref()

try {
  await build(ssgOptions, viteConfig)
} catch (err) {
  console.error(err)
  process.exit(1)
}
