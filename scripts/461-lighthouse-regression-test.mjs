#!/usr/bin/env node
/**
 * Issue #461: Lighthouse regression detection script
 *
 * This script runs Lighthouse audits to detect performance regressions.
 * It can be used locally to verify changes before pushing to CI.
 *
 * Usage:
 *   node scripts/461-lighthouse-regression-test.mjs [route] [formFactor]
 *
 * Examples:
 *   node scripts/461-lighthouse-regression-test.mjs /about mobile
 *   node scripts/461-lighthouse-regression-test.mjs / desktop
 */

import { spawn } from 'child_process'
import { readFile, writeFile } from 'fs/promises'
import { existsSync } from 'fs'
import path from 'path'

const MOBILE_THRESHOLD = {
  performanceScore: 0.9,
  lcp: 2500,
  tbt: 200,
  cls: 0.1
}

const DESKTOP_THRESHOLD = {
  performanceScore: 0.9,
  lcp: 2500,
  tbt: 200,
  cls: 0.1
}

const KEY_ROUTES = ['/', '/about', '/services', '/contact', '/news']

/**
 * Run Lighthouse audit for a single route
 */
async function runLighthouse(route, formFactor = 'mobile') {
  const preset = formFactor === 'mobile' ? 'perf' : 'desktop'
  const port = formFactor === 'mobile' ? 4174 : 4173
  const outputFile = `lighthouse-${formFactor}-${route.replace(/\//g, '-')}.json`

  return new Promise((resolve, reject) => {
    const lighthouse = spawn('npx', [
      'lighthouse',
      `http://localhost:${port}${route}`,
      `--preset=${preset}`,
      '--output=json',
      `--output-path=${outputFile}`,
      '--quiet',
      '--chrome-flags="--headless --no-sandbox --disable-gpu"'
    ])

    let stdout = ''
    let stderr = ''

    lighthouse.stdout.on('data', (data) => {
      stdout += data.toString()
    })

    lighthouse.stderr.on('data', (data) => {
      stderr += data.toString()
    })

    lighthouse.on('close', async (code) => {
      if (code === 0) {
        try {
          const report = JSON.parse(await readFile(outputFile, 'utf-8'))
          resolve(report)
        } catch (error) {
          reject(new Error(`Failed to read Lighthouse report: ${error.message}`))
        }
      } else {
        reject(new Error(`Lighthouse failed with code ${code}: ${stderr}`))
      }
    })
  })
}

/**
 * Extract performance metrics from Lighthouse report
 */
function extractMetrics(report) {
  const categories = report.categories
  const audits = report.audits

  return {
    performanceScore: categories.performance.score,
    lcp: audits['largest-contentful-paint'].numericValue,
    tbt: audits['total-blocking-time'].numericValue,
    cls: audits['cumulative-layout-shift'].numericValue,
    tti: audits['interactive'].numericValue,
    fcp: audits['first-contentful-paint'].numericValue,
    si: audits['speed-index'].numericValue
  }
}

/**
 * Check if metrics meet thresholds
 */
function checkThresholds(metrics, thresholds) {
  const issues = []

  if (metrics.performanceScore < thresholds.performanceScore) {
    issues.push({
      metric: 'Performance Score',
      actual: metrics.performanceScore,
      threshold: thresholds.performanceScore,
      status: 'FAIL'
    })
  }

  if (metrics.lcp > thresholds.lcp) {
    issues.push({
      metric: 'LCP',
      actual: metrics.lcp,
      threshold: thresholds.lcp,
      status: 'FAIL'
    })
  }

  if (metrics.tbt > thresholds.tbt) {
    issues.push({
      metric: 'TBT',
      actual: metrics.tbt,
      threshold: thresholds.tbt,
      status: 'FAIL'
    })
  }

  if (metrics.cls > thresholds.cls) {
    issues.push({
      metric: 'CLS',
      actual: metrics.cls,
      threshold: thresholds.cls,
      status: 'FAIL'
    })
  }

  return {
    passed: issues.length === 0,
    issues
  }
}

/**
 * Format metrics for display
 */
function formatMetrics(metrics) {
  return `
Performance Score: ${(metrics.performanceScore * 100).toFixed(0)}%
LCP: ${Math.round(metrics.lcp)}ms
TBT: ${Math.round(metrics.tbt)}ms
CLS: ${metrics.cls.toFixed(3)}
TTI: ${Math.round(metrics.tti)}ms
FCP: ${Math.round(metrics.fcp)}ms
SI: ${Math.round(metrics.si)}ms
  `.trim()
}

/**
 * Main test execution
 */
async function runRegressionTest(routes = KEY_ROUTES, formFactor = 'mobile') {
  console.log(`🚀 Running Lighthouse ${formFactor} regression test...`)
  console.log(`Routes: ${routes.join(', ')}`)
  console.log('')

  const results = []
  const thresholds = formFactor === 'mobile' ? MOBILE_THRESHOLD : DESKTOP_THRESHOLD

  for (const route of routes) {
    try {
      console.log(`Testing ${route}...`)
      const report = await runLighthouse(route, formFactor)
      const metrics = extractMetrics(report)
      const check = checkThresholds(metrics, thresholds)

      results.push({
        route,
        metrics,
        check,
        passed: check.passed
      })

      console.log(`  ${check.passed ? '✅' : '❌'} ${route}`)
      console.log(formatMetrics(metrics))

      if (!check.passed) {
        console.log('  Issues:')
        check.issues.forEach(issue => {
          console.log(`    - ${issue.metric}: ${issue.actual} (threshold: ${issue.threshold})`)
        })
      }
      console.log('')

    } catch (error) {
      console.error(`  ❌ ${route} - Error: ${error.message}`)
      results.push({
        route,
        error: error.message,
        passed: false
      })
      console.log('')
    }
  }

  // Summary
  const passed = results.filter(r => r.passed).length
  const failed = results.filter(r => !r.passed).length

  console.log('='.repeat(50))
  console.log(`Summary: ${passed}/${results.length} passed, ${failed} failed`)
  console.log('='.repeat(50))

  // Save results to file
  const summaryFile = `lighthouse-regression-${formFactor}-summary.json`
  await writeFile(summaryFile, JSON.stringify({
    timestamp: new Date().toISOString(),
    formFactor,
    routes,
    thresholds,
    results
  }, null, 2))

  console.log(`Results saved to ${summaryFile}`)

  // Exit with error code if any tests failed
  if (failed > 0) {
    process.exit(1)
  }
}

// CLI interface
const args = process.argv.slice(2)
const routeArg = args[0]
const formFactorArg = args[1] || 'mobile'

let routes = KEY_ROUTES
if (routeArg && routeArg !== 'all') {
  routes = [routeArg]
}

if (args.includes('--help') || args.includes('-h')) {
  console.log(`
Lighthouse Regression Detection Tool

Usage:
  node 461-lighthouse-regression-test.mjs [route] [formFactor]

Arguments:
  route      Route to test (default: all key routes)
  formFactor Form factor: 'mobile' or 'desktop' (default: mobile)

Examples:
  node 461-lighthouse-regression-test.mjs              # Test all routes on mobile
  node 461-lighthouse-regression-test.mjs /about       # Test /about on mobile
  node 461-lighthouse-regression-test.mjs / desktop    # Test all routes on desktop
  node 461-lighthouse-regression-test.mjs /about mobile # Test /about on mobile

Requires:
  - Preview server running on port 4173 (desktop) or 4174 (mobile)
  - Lighthouse installed: npm install -g lighthouse
  `)
  process.exit(0)
}

// Check if preview server is running
const checkServer = async (port) => {
  try {
    const response = await fetch(`http://localhost:${port}/`)
    return response.ok
  } catch {
    return false
  }
}

const formFactor = formFactorArg
const port = formFactor === 'mobile' ? 4174 : 4173

checkServer(port).then((running) => {
  if (!running) {
    console.error(`❌ Preview server not running on port ${port}`)
    console.error(`Please start the server first:`)
    console.error(`  npx serve dist-audit${formFactor === 'mobile' ? '-mob' : ''} -l ${port}`)
    process.exit(1)
  }

  runRegressionTest(routes, formFactor).catch((error) => {
    console.error('Fatal error:', error)
    process.exit(1)
  })
})
