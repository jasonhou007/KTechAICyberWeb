/**
 * Unit tests for Performance Requirements
 * Following TDD principles - tests written before implementation
 *
 * These tests validate bundle size requirements and build optimizations:
 * - JS bundle size <= 200KB gzipped
 * - CSS bundle size <= 50KB gzipped
 * - Individual route chunks <= 50KB gzipped each
 * - Compression outputs generated (gzip, brotli)
 * - Bundle analyzer creates stats.html
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { readFileSync, readdirSync, existsSync, statSync } from 'fs'
import { join } from 'path'
import { gzipSync, brotliCompressSync } from 'zlib'
import { fileURLToPath } from 'url'
import { dirname } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Helper function to get dist directory path
const getDistPath = () => join(__dirname, '../../dist')

// Helper function to get gzipped size
const getGzipSize = (buffer) => gzipSync(buffer).length

// Helper function to get brotli size
const getBrotliSize = (buffer) => brotliCompressSync(buffer).length

// Helper function to find files matching pattern
const findFiles = (dir, pattern) => {
  if (!existsSync(dir)) return []
  return readdirSync(dir).filter(file => pattern.test(file))
}

// Helper function to get bundle size
const getBundleSize = (filePath) => {
  if (!existsSync(filePath)) return 0
  const stats = statSync(filePath)
  return stats.size
}

// Helper function to read file buffer
const readFileBuffer = (filePath) => {
  if (!existsSync(filePath)) return Buffer.alloc(0)
  return readFileSync(filePath)
}

describe('Performance Requirements', () => {
  const distPath = getDistPath()

  describe('Build Output Verification', () => {
    it('should have dist directory after build', () => {
      expect(existsSync(distPath)).toBe(true)
    })

    it('should have assets directory', () => {
      const assetsPath = join(distPath, 'assets')
      expect(existsSync(assetsPath)).toBe(true)
    })

    it('should have index.html', () => {
      const indexPath = join(distPath, 'index.html')
      expect(existsSync(indexPath)).toBe(true)
    })
  })

  describe('JavaScript Bundle Size', () => {
    it('should have main JS bundle', () => {
      const jsFiles = findFiles(join(distPath, 'assets'), /^index-.*\.js$/)
      expect(jsFiles.length).toBeGreaterThan(0)
    })

    it('should have JS bundle size <= 200KB gzipped', () => {
      const jsFiles = findFiles(join(distPath, 'assets'), /^index-.*\.js$/)
      if (jsFiles.length === 0) {
        expect.fail('No JS bundle found')
      }

      const mainJs = jsFiles[0]
      const jsPath = join(distPath, 'assets', mainJs)
      const jsBuffer = readFileBuffer(jsPath)
      const gzippedSize = getGzipSize(jsBuffer)

      expect(gzippedSize).toBeLessThanOrEqual(200000)
    })

    it('should have JS bundle size <= 200KB brotli', () => {
      const jsFiles = findFiles(join(distPath, 'assets'), /^index-.*\.js$/)
      if (jsFiles.length === 0) {
        expect.fail('No JS bundle found')
      }

      const mainJs = jsFiles[0]
      const jsPath = join(distPath, 'assets', mainJs)
      const jsBuffer = readFileBuffer(jsPath)
      const brotliSize = getBrotliSize(jsBuffer)

      expect(brotliSize).toBeLessThanOrEqual(200000)
    })
  })

  describe('CSS Bundle Size', () => {
    it('should have main CSS bundle', () => {
      const cssFiles = findFiles(join(distPath, 'assets'), /^index-.*\.css$/)
      expect(cssFiles.length).toBeGreaterThan(0)
    })

    it('should have CSS bundle size <= 50KB gzipped', () => {
      const cssFiles = findFiles(join(distPath, 'assets'), /^index-.*\.css$/)
      if (cssFiles.length === 0) {
        expect.fail('No CSS bundle found')
      }

      const mainCss = cssFiles[0]
      const cssPath = join(distPath, 'assets', mainCss)
      const cssBuffer = readFileBuffer(cssPath)
      const gzippedSize = getGzipSize(cssBuffer)

      expect(gzippedSize).toBeLessThanOrEqual(50000)
    })

    it('should have CSS bundle size <= 50KB brotli', () => {
      const cssFiles = findFiles(join(distPath, 'assets'), /^index-.*\.css$/)
      if (cssFiles.length === 0) {
        expect.fail('No CSS bundle found')
      }

      const mainCss = cssFiles[0]
      const cssPath = join(distPath, 'assets', mainCss)
      const cssBuffer = readFileBuffer(cssPath)
      const brotliSize = getBrotliSize(cssBuffer)

      expect(brotliSize).toBeLessThanOrEqual(50000)
    })
  })

  describe('Route Code Splitting', () => {
    it('should have separate chunk for Home route', () => {
      const homeFiles = findFiles(join(distPath, 'assets'), /Home.*\.js$/)
      expect(homeFiles.length).toBeGreaterThan(0)
    })

    it('should have separate chunk for About route', () => {
      const aboutFiles = findFiles(join(distPath, 'assets'), /About.*\.js$/)
      expect(aboutFiles.length).toBeGreaterThan(0)
    })

    it('should have separate chunk for Services route', () => {
      const servicesFiles = findFiles(join(distPath, 'assets'), /Services.*\.js$/)
      expect(servicesFiles.length).toBeGreaterThan(0)
    })

    it('should have individual route chunks <= 50KB gzipped', () => {
      const routeFiles = findFiles(join(distPath, 'assets'), /(Home|About|Services).*\.js$/)

      for (const file of routeFiles) {
        const filePath = join(distPath, 'assets', file)
        const fileBuffer = readFileBuffer(filePath)
        const gzippedSize = getGzipSize(fileBuffer)
        expect(gzippedSize).toBeLessThanOrEqual(50000)
      }
    })
  })

  describe('Compression Outputs', () => {
    it('should generate gzip compressed JS files', () => {
      const gzFiles = findFiles(join(distPath, 'assets'), /^index-.*\.js\.gz$/)
      expect(gzFiles.length).toBeGreaterThan(0)
    })

    it('should generate brotli compressed JS files', () => {
      const brFiles = findFiles(join(distPath, 'assets'), /^index-.*\.js\.br$/)
      expect(brFiles.length).toBeGreaterThan(0)
    })

    it('should generate gzip compressed CSS files', () => {
      const gzFiles = findFiles(join(distPath, 'assets'), /^index-.*\.css\.gz$/)
      expect(gzFiles.length).toBeGreaterThan(0)
    })

    it('should generate brotli compressed CSS files', () => {
      const brFiles = findFiles(join(distPath, 'assets'), /^index-.*\.css\.br$/)
      expect(brFiles.length).toBeGreaterThan(0)
    })
  })

  describe('Bundle Analyzer', () => {
    it('should generate bundle analyzer stats.html', () => {
      const statsPath = join(distPath, 'stats.html')
      expect(existsSync(statsPath)).toBe(true)
    })

    it('should have non-empty stats.html file', () => {
      const statsPath = join(distPath, 'stats.html')
      if (!existsSync(statsPath)) {
        expect.fail('stats.html not found')
      }

      const statsSize = getBundleSize(statsPath)
      expect(statsSize).toBeGreaterThan(1000)
    })
  })

  describe('Vendor Chunk Splitting', () => {
    it('should have separate vendor chunk', () => {
      const vendorFiles = findFiles(join(distPath, 'assets'), /vendor.*\.js$/)
      expect(vendorFiles.length).toBeGreaterThan(0)
    })

    it('should vendor chunk contain Vue', () => {
      const vendorFiles = findFiles(join(distPath, 'assets'), /vendor.*\.js$/)
      if (vendorFiles.length === 0) {
        expect.fail('No vendor chunk found')
      }

      const vendorFile = vendorFiles[0]
      const vendorPath = join(distPath, 'assets', vendorFile)
      const vendorContent = readFileSync(vendorPath, 'utf-8')

      // Should contain Vue references
      expect(vendorContent).toMatch(/vue|Vue/i)
    })
  })

  describe('Font Optimization', () => {
    it('should use font-display: swap in index.html', () => {
      const indexPath = join(distPath, 'index.html')
      if (!existsSync(indexPath)) {
        expect.fail('index.html not found')
      }

      const indexContent = readFileSync(indexPath, 'utf-8')
      expect(indexContent).toMatch(/font-display.*swap/i)
    })

    it('should have preconnect for Google Fonts', () => {
      const indexPath = join(distPath, 'index.html')
      if (!existsSync(indexPath)) {
        expect.fail('index.html not found')
      }

      const indexContent = readFileSync(indexPath, 'utf-8')
      expect(indexContent).toMatch(/preconnect.*fonts\.googleapis/i)
    })
  })

  describe('Edge Cases', () => {
    it('should handle missing dist gracefully', () => {
      const testPath = join(__dirname, 'non-existent-dist')
      expect(() => findFiles(testPath, /.*/)).not.toThrow()
    })

    it('should handle empty bundle gracefully', () => {
      const emptyBuffer = Buffer.alloc(0)
      expect(() => getGzipSize(emptyBuffer)).not.toThrow()
      expect(() => getBrotliSize(emptyBuffer)).not.toThrow()
    })
  })
})
