#!/usr/bin/env node

/**
 * Bundle Analysis Script
 *
 * This script analyzes the production build and generates detailed reports
 * about bundle sizes, composition, and optimization opportunities.
 *
 * Usage: node scripts/analyze-bundle.js
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const DIST_DIR = path.join(__dirname, '../dist')
const STATS_FILE = path.join(DIST_DIR, 'stats.html')
const MANIFEST_FILE = path.join(DIST_DIR, '.vite', 'manifest.json')
const INDEX_FILE = path.join(DIST_DIR, 'index.html')

// ANSI color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m'
}

function formatSize(bytes) {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`
}

function formatPercent(value, total) {
  if (total === 0) return '0%'
  return `${((value / total) * 100).toFixed(1)}%`
}

function getColorForSize(bytes) {
  const KB = bytes / 1024
  const MB = KB / 1024

  if (MB > 1) return colors.red // Red for > 1MB
  if (KB > 500) return colors.yellow // Yellow for > 500KB
  return colors.green // Green for <= 500KB
}

function printHeader(text) {
  console.log(`\n${colors.bold}${colors.cyan}${'='.repeat(60)}`)
  console.log(`${text}`)
  console.log(`${'='.repeat(60)}${colors.reset}\n`)
}

function printSubheader(text) {
  console.log(`\n${colors.bold}${colors.yellow}${text}${colors.reset}`)
  console.log(`${colors.yellow}${'-'.repeat(text.length)}${colors.reset}\n`)
}

function analyzeIndexHTML() {
  if (!fs.existsSync(INDEX_FILE)) {
    console.log(`${colors.yellow}No index.html found in dist.${colors.reset}`)
    return null
  }

  const stats = fs.statSync(INDEX_FILE)
  const size = stats.size

  return {
    name: 'index.html',
    size,
    type: 'html'
  }
}

function analyzeDistDirectory() {
  if (!fs.existsSync(DIST_DIR)) {
    console.log(`${colors.red}Build directory not found. Run 'npm run build' first.${colors.reset}`)
    return null
  }

  const analysis = {
    totalSize: 0,
    files: [],
    byType: {
      html: { count: 0, size: 0 },
      js: { count: 0, size: 0 },
      css: { count: 0, size: 0 },
      images: { count: 0, size: 0 },
      other: { count: 0, size: 0 }
    }
  }

  function scanDirectory(dir) {
    const entries = fs.readdirSync(dir, { withFileTypes: true })

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name)
      const relPath = path.relative(DIST_DIR, fullPath)

      if (entry.isDirectory()) {
        // Skip .vite directory
        if (entry.name !== '.vite') {
          scanDirectory(fullPath)
        }
        continue
      }

      const stats = fs.statSync(fullPath)
      const size = stats.size
      const ext = path.extname(entry.name).toLowerCase()

      analysis.totalSize += size
      analysis.files.push({
        name: entry.name,
        path: relPath,
        size,
        ext
      })

      // Categorize by type
      if (ext === '.html') {
        analysis.byType.html.count++
        analysis.byType.html.size += size
      } else if (ext === '.js') {
        analysis.byType.js.count++
        analysis.byType.js.size += size
      } else if (ext === '.css') {
        analysis.byType.css.count++
        analysis.byType.css.size += size
      } else if (/png|jpe?g|svg|gif|tiff|bmp|ico|webp/i.test(ext)) {
        analysis.byType.images.count++
        analysis.byType.images.size += size
      } else {
        analysis.byType.other.count++
        analysis.byType.other.size += size
      }
    }
  }

  scanDirectory(DIST_DIR)
  return analysis
}

function printAnalysis(analysis) {
  if (!analysis) {
    console.log(`${colors.red}Analysis failed. No data available.${colors.reset}`)
    return
  }

  printHeader('📊 BUNDLE SIZE ANALYSIS')

  // Total size
  console.log(`${colors.bold}Total Bundle Size:${colors.reset} ${formatSize(analysis.totalSize)}`)

  // By type
  printSubheader('Files by Type')

  const types = [
    { key: 'html', name: 'HTML' },
    { key: 'js', name: 'JavaScript' },
    { key: 'css', name: 'CSS' },
    { key: 'images', name: 'Images' },
    { key: 'other', name: 'Other' }
  ]

  for (const type of types) {
    const data = analysis.byType[type.key]
    if (data.count > 0) {
      console.log(`${type.name}: ${colors.bold}${data.count}${colors.reset} files | ` +
        `Size: ${getColorForSize(data.size)}${formatSize(data.size)}${colors.reset} | ` +
        `Percentage: ${formatPercent(data.size, analysis.totalSize)}`)
    }
  }

  // Largest files
  printSubheader('Largest Files (Top 10)')

  const sortedFiles = [...analysis.files].sort((a, b) => b.size - a.size).slice(0, 10)

  for (const file of sortedFiles) {
    const sizeColor = getColorForSize(file.size)
    const percentage = formatPercent(file.size, analysis.totalSize)
    console.log(`${sizeColor}${formatSize(file.size).padStart(10)}${colors.reset} ` +
      `(${percentage.padStart(5)}) ${file.path}`)
  }
}

function printRecommendations(analysis) {
  if (!analysis) return

  printSubheader('💡 Optimization Recommendations')

  const recommendations = []

  // Check HTML size
  if (analysis.byType.html.size > 100 * 1024) {
    recommendations.push({
      level: 'warning',
      message: `index.html is ${formatSize(analysis.byType.html.size)}. Consider extracting inline scripts to separate files.`
    })
  }

  // Check image optimization
  if (analysis.byType.images.size > 500 * 1024) {
    recommendations.push({
      level: 'warning',
      message: `Total image size is ${formatSize(analysis.byType.images.size)}. Consider WebP format and lazy loading.`
    })
  }

  // Check for large files
  const largeFiles = analysis.files.filter(f => f.size > 200 * 1024)
  if (largeFiles.length > 0) {
    recommendations.push({
      level: 'info',
      message: `Found ${largeFiles.length} file(s) over 200KB. Review for optimization opportunities.`
    })
  }

  // Overall bundle size
  if (analysis.totalSize > 2 * 1024 * 1024) {
    recommendations.push({
      level: 'warning',
      message: `Total bundle size is ${formatSize(analysis.totalSize)}. Aim for under 2MB.`
    })
  } else if (analysis.totalSize < 500 * 1024) {
    recommendations.push({
      level: 'success',
      message: `Bundle size is excellent (${formatSize(analysis.totalSize)}).`
    })
  } else {
    recommendations.push({
      level: 'success',
      message: `Bundle size is within acceptable range (${formatSize(analysis.totalSize)}).`
    })
  }

  for (const rec of recommendations) {
    let color = colors.white
    let icon = 'ℹ️'

    if (rec.level === 'success') {
      color = colors.green
      icon = '✅'
    } else if (rec.level === 'warning') {
      color = colors.yellow
      icon = '⚠️'
    }

    console.log(`${color}${icon} ${rec.message}${colors.reset}`)
  }
}

function checkBuildArtifacts() {
  printSubheader('Build Artifacts')

  if (!fs.existsSync(DIST_DIR)) {
    console.log(`${colors.red}Build directory not found.${colors.reset}`)
    return
  }

  // Check for stats.html
  if (fs.existsSync(STATS_FILE)) {
    const stats = fs.statSync(STATS_FILE)
    console.log(`${colors.green}✓${colors.reset} Bundle visualization: ${STATS_FILE} (${formatSize(stats.size)})`)
    console.log(`  ${colors.cyan}→ Open in browser to view interactive bundle analysis${colors.reset}`)
  } else {
    console.log(`${colors.yellow}✗${colors.reset} Bundle visualization not found`)
  }

  // Check for manifest
  if (fs.existsSync(MANIFEST_FILE)) {
    const manifestSize = fs.statSync(MANIFEST_FILE).size
    if (manifestSize > 10) {
      console.log(`${colors.green}✓${colors.reset} Vite build manifest found (${formatSize(manifestSize)})`)
    } else {
      console.log(`${colors.yellow}⚠${colors.reset} Vite manifest exists but is empty - no chunks created`)
    }
  } else {
    console.log(`${colors.yellow}✗${colors.reset} Vite manifest not found`)
  }
}

function printPerformanceTargets() {
  printSubheader('Performance Targets')

  const targets = [
    { name: 'Initial Bundle Size', target: '< 500KB', recommended: '< 250KB' },
    { name: 'First Contentful Paint', target: '< 1.8s', recommended: '< 1s' },
    { name: 'Largest Contentful Paint', target: '< 2.5s', recommended: '< 2s' },
    { name: 'Time to Interactive', target: '< 3.8s', recommended: '< 3s' },
    { name: 'Total Blocking Time', target: '< 200ms', recommended: '< 100ms' },
    { name: 'Cumulative Layout Shift', target: '< 0.1', recommended: '< 0.05' }
  ]

  console.log(`\n${colors.cyan}Metric${colors.reset}                ${colors.cyan}Target${colors.reset}          ${colors.cyan}Recommended${colors.reset}`)
  console.log(`${colors.cyan}${'─'.repeat(60)}${colors.reset}`)

  for (const t of targets) {
    console.log(
      `${t.name.padEnd(25)}${colors.green}${t.target.padStart(16)}${colors.reset}${colors.cyan}${t.recommended.padStart(16)}${colors.reset}`
    )
  }
}

// Main execution
async function main() {
  console.log(`${colors.bold}${colors.magenta}`)
  console.log('╔════════════════════════════════════════════════════════════╗')
  console.log('║          KTech AI Cyber Web - Bundle Analyzer           ║')
  console.log('╚════════════════════════════════════════════════════════════╝')
  console.log(`${colors.reset}`)

  const analysis = analyzeDistDirectory()

  if (analysis) {
    printAnalysis(analysis)
    printRecommendations(analysis)
  }

  checkBuildArtifacts()
  printPerformanceTargets()

  console.log(`\n${colors.bold}${colors.cyan}Next Steps:${colors.reset}`)
  console.log(`1. View bundle visualization: ${colors.yellow}open dist/stats.html${colors.reset}`)
  console.log(`2. Build with analysis: ${colors.yellow}npm run build && npm run analyze${colors.reset}`)
  console.log(`3. Preview production build: ${colors.yellow}npm run preview${colors.reset}`)
  console.log(`\n${colors.reset}`)
}

main().catch(console.error)
