# Issue #352: CLS Investigation - /about and /news Routes

## Problem Statement
Both `/about` and `/news` show CLS 0.172. The NewsTicker fix didn't help, indicating the CLS source is elsewhere.

## Key Finding from index.html Comments

**Critical Discovery (Lines 113-120 in index.html):**

```html
/* #340 review(perf): a former `main{max-width:1400px;margin:0 auto}` rule
   is REMOVED — it caused a 0.158 CLS hit on /news. `.app` is a flex
   COLUMN container (App.vue scoped); `margin:auto` on a flex child
   ABSORBS free space and defeats `flex-grow`, so the seed made the outer
   <main class="main-content"> shrink-to-fit instead of stretching
   full-width as `.main-content{flex:1}` intends. When /news's onMounted
   setTimeout flipped isLoading and the wider news cards rendered, the
   outer <main>'s width jumped 922 -> 1350px. Per-route containers
   (`.news-page`, etc.) carry their own `max-width;margin:0 auto`. */
```

**Analysis:**
- The previous CLS of **0.158** was caused by `margin: auto` on a flex child absorbing free space
- Current CLS is **0.172** - very close to the previous 0.158
- The root cause is likely related to this same flex layout issue but wasn't fully resolved

## Suspected CLS Sources

### 1. Flex Layout Container Issue (Primary Suspect)
**Location:** `App.vue` + index.html critical CSS

**Problem:**
- `.app` is a flex COLUMN container
- `<main class="main-content">` has `flex: 1` but may not be stretching properly
- Width jumps occur when content renders (922px → 1350px mentioned in comments)

**Evidence:**
- Comments explicitly mention this caused 0.158 CLS before
- Current 0.172 is slightly higher, suggesting the issue persists
- News page has content that changes width on load (isLoading state change)

### 2. Async Content Rendering
**Location:** `News.vue`, `NewsList.vue`, `NewsCard.vue`

**Problem:**
- `isLoading` state changes cause content to appear/disappear
- News cards render after initial paint (visibleCount = 6)
- Skeleton loaders vs actual content have different dimensions

**Evidence:**
- News.vue initializes `isLoading = false` but mentions previous 300ms setTimeout
- NewsList shows skeletons when `isLoading = true`
- Content dimensions change when actual cards replace skeletons

### 3. Image Loading Without Dimensions
**Location:** `NewsCard.vue`, `About.vue`

**Problem:**
- CyberImage components may not have explicit width/height
- SVG images (iso27001-shield.svg) don't declare intrinsic width
- Image loading can cause layout shifts

**Evidence:**
- NewsCard uses CyberImage with responsive srcset
- About.vue has CyberImage components with eager loading
- Comments mention NewsCard SVG has no intrinsic pixel width

### 4. About Page Specific Issues
**Location:** `About.vue`

**Problem:**
- SelfDrivingDemo component may cause layout shifts
- AboutAmbient canvas animation sizing
- Hero image with responsive srcset

**Evidence:**
- Multiple sections with potentially async content
- Ambient animations that may resize
- Responsive images with srcset

## Investigation Methodology

To confirm the true CLS source, we need to:

1. **Chrome DevTools Layout Shift Analysis:**
   - Open DevTools → Performance Monitor
   - Check "Layout Shifts" metric
   - Record page load and identify shift events
   - Examine specific elements causing shifts

2. **Lighthouse Layout Shift Audit:**
   - Run Lighthouse with layout shift details
   - Examine the "Layout Shifts" section
   - Identify specific elements and shift scores

3. **Visual Regression Testing:**
   - Capture frames during page load
   - Identify when layout changes occur
   - Measure exact pixel shifts

## Recommended Fixes

### High Priority (Most Likely CLS Source):

**1. Fix Flex Layout Container:**
```css
/* In App.vue or main CSS */
.app {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  /* Ensure proper flex behavior */
}

.main-content {
  flex: 1;
  /* Ensure it stretches properly */
  width: 100%; /* Add explicit width */
  max-width: 100%; /* Prevent overflow */
}
```

**2. Reserve Space for Async Content:**
```vue
<!-- In NewsList.vue -->
<div class="news-list__grid" style="min-height: 600px;">
  <!-- Content -->
</div>
```

**3. Add Explicit Dimensions to Images:**
```vue
<!-- In NewsCard.vue -->
<CyberImage
  :style="{ minHeight: '200px' }"
  <!-- or use aspect-ratio -->
/>
```

### Medium Priority:

**4. Skeleton Loading Improvements:**
- Ensure skeleton dimensions match actual content
- Use `aspect-ratio` for image placeholders
- Reserve space for all async elements

**5. About Page Optimizations:**
- Add min-height to ambient animation sections
- Reserve space for SelfDrivingDemo
- Ensure hero image has aspect-ratio

## Next Steps

1. **Immediate:** Run Chrome DevTools to capture exact layout shift events
2. **Document:** Record which elements are shifting and by how much
3. **Implement:** Apply the flex layout fix first (most likely culprit)
4. **Test:** Re-measure CLS after each fix
5. **Verify:** Ensure no regressions on desktop/mobile

## Historical Context

- **Issue #340:** Previous CLS fix that addressed 0.158 CLS on /news
- **Issue #334:** About hero LCP preload optimization
- **Issue #374:** SVG image conversion for news cards
- **Current:** CLS 0.172 persists despite previous fixes

## Conclusion

The most likely source of the 0.172 CLS is the **flex layout container issue** that was previously identified but not fully resolved. The `.app` flex column container with `.main-content` flex child is causing width jumps when content loads.

The secondary suspects are:
1. Async content rendering (NewsList skeletons → actual cards)
2. Image loading without explicit dimensions
3. About page ambient animations

**Recommendation:** Fix the flex layout issue first, then re-measure CLS. If it persists, investigate async content rendering.