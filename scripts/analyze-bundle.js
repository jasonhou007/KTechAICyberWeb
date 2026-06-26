#!/usr/bin/env node

/**
 * Bundle Analysis Script
 * Analyzes bundle sizes and generates reports for CI/CD integration
 * Following TDD principles - script created after tests were written
 */

import { readFileSync, readdirSync, existsSync, statSync } from 'fs';
import { join, dirname } from 'path';
import { gzipSync, brotliCompressSync } from 'zlib';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Configuration
const DIST_PATH = join(__dirname, '../dist');
const ASSETS_PATH = join(DIST_PATH, 'assets');

// Bundle size limits (in bytes)
const LIMITS = {
  JS_GZIPPED: 200 * 1024,      // 200KB
  JS_BROTLI: 200 * 1024,       // 200KB
  CSS_GZIPPED: 50 * 1024,      // 50KB
  CSS_BROTLI: 50 * 1024,       // 50KB
  ROUTE_CHUNK_GZIPPED: 50 * 1024, // 50KB
  ROUTE_CHUNK_BROTLI: 50 * 1024,  // 50KB
};

// Color codes for terminal output
const COLORS = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

function colorize(color, text) {
  return `${COLORS[color]}${text}${COLORS.reset}`;
}

/**
 * Get gzipped size of a buffer
 */
function getGzipSize(buffer) {
  return gzipSync(buffer).length;
}

/**
 * Get brotli size of a buffer
 */
function getBrotliSize(buffer) {
  return brotliCompressSync(buffer).length;
}

/**
 * Format bytes to human-readable string
 */
function formatBytes(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
}

/**
 * Format percentage
 */
function formatPercentage(value, total) {
  return ((value / total) * 100).toFixed(1);
}

/**
 * Find files matching a pattern
 */
function findFiles(dir, pattern) {
  if (!existsSync(dir)) return [];
  return readdirSync(dir).filter(file => pattern.test(file));
}

/**
 * Read file buffer
 */
function readFileBuffer(filePath) {
  if (!existsSync(filePath)) return Buffer.alloc(0);
  return readFileSync(filePath);
}

/**
 * Get file stats
 */
function getFileStats(filePath) {
  const buffer = readFileBuffer(filePath);
  return {
    size: buffer.length,
    gzip: getGzipSize(buffer),
    brotli: getBrotliSize(buffer),
  };
}

/**
 * Analyze bundle sizes
 */
function analyzeBundles() {
  console.log(colorize('cyan', '\n📦 Bundle Size Analysis\n'));

  if (!existsSync(ASSETS_PATH)) {
    console.error(colorize('red', '❌ Assets directory not found. Run `npm run build` first.'));
    process.exit(1);
  }

  const results = {
    js: [],
    css: [],
    routes: {},
    vendor: null,
  };

  // Find JS bundles
  const jsFiles = findFiles(ASSETS_PATH, /^index-.*\.js$/);
  for (const file of jsFiles) {
    const filePath = join(ASSETS_PATH, file);
    const stats = getFileStats(filePath);
    results.js.push({ file, ...stats });
  }

  // Find CSS bundles
  const cssFiles = findFiles(ASSETS_PATH, /^index-.*\.css$/);
  for (const file of cssFiles) {
    const filePath = join(ASSETS_PATH, file);
    const stats = getFileStats(filePath);
    results.css.push({ file, ...stats });
  }

  // Find vendor chunks
  const vendorFiles = findFiles(ASSETS_PATH, /vendor-.*\.js$/);
  for (const file of vendorFiles) {
    const filePath = join(ASSETS_PATH, file);
    const stats = getFileStats(filePath);
    results.vendor = { file, ...stats };
  }

  // Find route chunks
  const routeFiles = findFiles(ASSETS_PATH, /(Home|About|Services)-.*\.js$/);
  for (const file of routeFiles) {
    const routeName = file.match(/(Home|About|Services)/)?.[1] || 'unknown';
    const filePath = join(ASSETS_PATH, file);
    const stats = getFileStats(filePath);
    results.routes[routeName] = { file, ...stats };
  }

  return results;
}

/**
 * Display bundle analysis results
 */
function displayResults(results) {
  let hasErrors = false;

  // Display JS bundles
  console.log(colorize('blue', '\n📄 JavaScript Bundles:'));
  for (const bundle of results.js) {
    const jsPass = bundle.gzip <= LIMITS.JS_GZIPPED && bundle.brotli <= LIMITS.JS_BROTLI;
    const status = jsPass ? colorize('green', '✓') : colorize('red', '✗');
    console.log(`  ${status} ${bundle.file}`);
    console.log(`     Raw: ${formatBytes(bundle.size)}, Gzip: ${formatBytes(bundle.gzip)}, Brotli: ${formatBytes(bundle.brotli)}`);
    if (!jsPass) hasErrors = true;
  }

  // Display CSS bundles
  console.log(colorize('blue', '\n🎨 CSS Bundles:'));
  for (const bundle of results.css) {
    const cssPass = bundle.gzip <= LIMITS.CSS_GZIPPED && bundle.brotli <= LIMITS.CSS_BROTLI;
    const status = cssPass ? colorize('green', '✓') : colorize('red', '✗');
    console.log(`  ${status} ${bundle.file}`);
    console.log(`     Raw: ${formatBytes(bundle.size)}, Gzip: ${formatBytes(bundle.gzip)}, Brotli: ${formatBytes(bundle.brotli)}`);
    if (!cssPass) hasErrors = true;
  }

  // Display vendor chunk
  if (results.vendor) {
    console.log(colorize('blue', '\n📦 Vendor Chunk:'));
    console.log(`  ${results.vendor.file}`);
    console.log(`     Raw: ${formatBytes(results.vendor.size)}, Gzip: ${formatBytes(results.vendor.gzip)}, Brotli: ${formatBytes(results.vendor.brotli)}`);
  }

  // Display route chunks
  console.log(colorize('blue', '\n🛣️  Route Chunks:'));
  for (const [routeName, bundle] of Object.entries(results.routes)) {
    const routePass = bundle.gzip <= LIMITS.ROUTE_CHUNK_GZIPPED && bundle.brotli <= LIMITS.ROUTE_CHUNK_BROTLI;
    const status = routePass ? colorize('green', '✓') : colorize('red', '✗');
    console.log(`  ${status} ${routeName}: ${bundle.file}`);
    console.log(`     Raw: ${formatBytes(bundle.size)}, Gzip: ${formatBytes(bundle.gzip)}, Brotli: ${formatBytes(bundle.brotli)}`);
    if (!routePass) hasErrors = true;
  }

  // Display summary
  console.log(colorize('cyan', '\n📊 Summary:'));
  const totalJsGzip = results.js.reduce((sum, b) => sum + b.gzip, 0);
  const totalJsBrotli = results.js.reduce((sum, b) => sum + b.brotli, 0);
  const totalCssGzip = results.css.reduce((sum, b) => sum + b.gzip, 0);
  const totalCssBrotli = results.css.reduce((sum, b) => sum + b.brotli, 0);

  console.log(`  Total JS (gzipped): ${formatBytes(totalJsGzip)} / ${formatBytes(LIMITS.JS_GZIPPED)} ${colorize(totalJsGzip <= LIMITS.JS_GZIPPED ? 'green' : 'red', totalJsGzip <= LIMITS.JS_GZIPPED ? '✓' : '✗')}`);
  console.log(`  Total CSS (gzipped): ${formatBytes(totalCssGzip)} / ${formatBytes(LIMITS.CSS_GZIPPED)} ${colorize(totalCssGzip <= LIMITS.CSS_GZIPPED ? 'green' : 'red', totalCssGzip <= LIMITS.CSS_GZIPPED ? '✓' : '✗')}`);

  // Check for bundle analyzer
  const statsPath = join(DIST_PATH, 'stats.html');
  if (existsSync(statsPath)) {
    console.log(colorize('green', `  ✓ Bundle analyzer report: ${statsPath}`));
  } else {
    console.log(colorize('yellow', `  ⚠ Bundle analyzer report not found`));
  }

  // Check for compression files
  const gzFiles = findFiles(ASSETS_PATH, /\.gz$/);
  const brFiles = findFiles(ASSETS_PATH, /\.br$/);
  console.log(colorize(gzFiles.length > 0 ? 'green' : 'yellow', `  ${gzFiles.length > 0 ? '✓' : '⚠'} Gzip compressed files: ${gzFiles.length}`));
  console.log(colorize(brFiles.length > 0 ? 'green' : 'yellow', `  ${brFiles.length > 0 ? '✓' : '⚠'} Brotli compressed files: ${brFiles.length}`));

  if (hasErrors) {
    console.log(colorize('red', '\n❌ Bundle size limits exceeded!\n'));
    process.exit(1);
  } else {
    console.log(colorize('green', '\n✅ All bundle size checks passed!\n'));
  }

  return results;
}

/**
 * Generate CI/CD compatible report
 */
function generateReport(results) {
  const report = {
    timestamp: new Date().toISOString(),
    bundles: {
      js: results.js.map(b => ({
        file: b.file,
        size: b.size,
        gzip: b.gzip,
        brotli: b.brotli,
      })),
      css: results.css.map(b => ({
        file: b.file,
        size: b.size,
        gzip: b.gzip,
        brotli: b.brotli,
      })),
      routes: results.routes,
      vendor: results.vendor,
    },
    limits: LIMITS,
    status: 'passed',
  };

  // Check if any limits exceeded
  for (const bundle of report.bundles.js) {
    if (bundle.gzip > LIMITS.JS_GZIPPED || bundle.brotli > LIMITS.JS_BROTLI) {
      report.status = 'failed';
    }
  }
  for (const bundle of report.bundles.css) {
    if (bundle.gzip > LIMITS.CSS_GZIPPED || bundle.brotli > LIMITS.CSS_BROTLI) {
      report.status = 'failed';
    }
  }

  return report;
}

/**
 * Main execution
 */
function main() {
  const args = process.argv.slice(2);
  const jsonMode = args.includes('--json');

  try {
    const results = analyzeBundles();

    if (jsonMode) {
      const report = generateReport(results);
      console.log(JSON.stringify(report, null, 2));
      process.exit(report.status === 'passed' ? 0 : 1);
    } else {
      displayResults(results);
    }
  } catch (error) {
    console.error(colorize('red', `❌ Error: ${error.message}`));
    process.exit(1);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { analyzeBundles, displayResults, generateReport };
