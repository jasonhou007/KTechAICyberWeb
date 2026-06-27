/**
 * @file breakpoints.test.ts
 * @description Lock the shared MOBILE_BREAKPOINT constant as the single
 * source of truth for the 768px mobile/desktop cutoff (#164 review S3).
 *
 * Hover-gating logic in NavigationDropdown previously inlined `768` in 3
 * spots; the magic number is now centralised here + as the
 * --breakpoint-mobile CSS variable.
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import {
  MOBILE_BREAKPOINT,
  isMobileViewport,
  isDesktopViewport,
} from '../breakpoints'

describe('constants/breakpoints', () => {
  const setWidth = (w: number) =>
    Object.defineProperty(window, 'innerWidth', {
      configurable: true,
      writable: true,
      value: w,
    })

  let original: number
  beforeEach(() => {
    original = window.innerWidth
  })
  afterEach(() => {
    setWidth(original)
  })

  it('exposes MOBILE_BREAKPOINT === 768 (matches CSS --breakpoint-mobile)', () => {
    expect(MOBILE_BREAKPOINT).toBe(768)
  })

  it('isMobileViewport() is true at exactly the breakpoint', () => {
    setWidth(768)
    expect(isMobileViewport()).toBe(true)
  })

  it('isMobileViewport() is true below the breakpoint', () => {
    setWidth(480)
    expect(isMobileViewport()).toBe(true)
  })

  it('isDesktopViewport() is true above the breakpoint', () => {
    setWidth(1024)
    expect(isDesktopViewport()).toBe(true)
  })

  it('isMobileViewport() and isDesktopViewport() are mutually exclusive', () => {
    setWidth(1024)
    expect(isMobileViewport()).toBe(false)
    expect(isDesktopViewport()).toBe(true)
    setWidth(480)
    expect(isMobileViewport()).toBe(true)
    expect(isDesktopViewport()).toBe(false)
  })
})
