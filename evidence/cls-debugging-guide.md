# CLS Debugging Guide for Issue #352

## Problem
Both `/about` and `/news` show CLS 0.172. Need to find the true source using Chrome DevTools.

## Quick Start

### Option 1: Browser Console (Fastest)

1. **Start the dev server:**
   ```bash
   cd /Users/jinbo/Documents/AIProject/AutoDevAgent/DevAgent/.worktrees/ticket-461/KTechAICyberWeb
   npm run dev
   ```

2. **Navigate to a problematic route:**
   - http://localhost:5173/about
   - http://localhost:5173/news

3. **Open DevTools Console (F12 or Cmd+Option+I)**

4. **Copy and paste the debugging script:**
   - Open `scripts/debug-cls.js`
   - Copy the entire contents
   - Paste into the DevTools console
   - Press Enter

5. **Refresh the page (Cmd+R or F5)**

6. **Check the console output:**
   - Look for "CLS Debugging Report" after 2 seconds
   - Review the detailed shift events table
   - A JSON file will auto-download with full data

### Option 2: Lighthouse CI (Most Accurate)

1. **Build the audit variant:**
   ```bash
   npm run build -- --base=/ --outDir=dist-audit
   ```

2. **Start preview server:**
   ```bash
   npx serve -s dist-audit -l 4173
   ```

3. **Run Lighthouse with layout shift details:**
   ```bash
   lighthouse http://localhost:4173/about --output=json --output-path=cls-about.json --quiet
   lighthouse http://localhost:4173/news --output=json --output-path=cls-news.json --quiet
   ```

4. **Examine the results:**
   - Open `cls-about.json` or `cls-news.json`
   - Look for `audits["layout-shifts"].details`
   - Find specific elements causing shifts

### Option 3: Chrome DevTools Performance Tab

1. **Open DevTools Performance tab**

2. **Start recording (circle button)**

3. **Refresh the page**

4. **Stop recording after page loads**

5. **Look for "Layout Shifts" in the bottom panel**

6. **Click on shift events to see affected elements**

## What to Look For

### Key CLS Sources Identified

**1. Flex Layout Container (Primary Suspect)**
- **Symptom:** `.main-content` width jumps (922px → 1350px)
- **Cause:** `margin: auto` on flex child absorbing free space
- **Evidence:** Index.html lines 113-120 mention this caused 0.158 CLS

**2. Async Content Rendering**
- **Symptom:** News cards/skeletons have different dimensions
- **Cause:** `isLoading` state change triggers reflow
- **Evidence:** NewsList shows 6 cards that appear after initial paint

**3. Image Loading Without Dimensions**
- **Symptom:** Images load and push content down
- **Cause:** CyberImage components without explicit size
- **Evidence:** SVG images have no intrinsic width

**4. About Page Ambient Animations**
- **Symptom:** Canvas elements resize during initialization
- **Cause:** AboutAmbient/SelfDrivingDemo components
- **Evidence:** Multiple canvas elements in About.vue

## Interpreting the Debug Output

### Console Report Example:
```
📊 Layout Shift Detected
Shift Value: 0.0156
Cumulative CLS: 0.0156
Sources: [Array]

Element: .main-content
Width Change: 922px → 1350px
```

**This indicates:**
- `.main-content` element shifted
- Width jumped by 428px
- This contributed 0.0156 to the total CLS

### JSON Report Structure:
```json
{
  "clsScore": "0.1720",
  "totalShifts": 5,
  "shifts": [
    {
      "score": 0.0500,
      "sources": [
        {
          "selector": ".news-list__grid",
          "currentRect": {"width": 1350, "height": 400},
          "previousRect": {"width": 922, "height": 200}
        }
      ]
    }
  ]
}
```

## Expected Findings

Based on the code analysis, we expect to find:

1. **Major shift:** `.main-content` width change (largest contributor)
2. **Minor shifts:** News cards replacing skeletons
3. **Possible shifts:** Image loading in About page

## Recommended Fixes (In Priority Order)

### 1. Fix Flex Layout (Expected to fix ~0.15 CLS)
```css
/* Add to App.vue or main CSS */
.main-content {
  width: 100%; /* Prevent flex child shrink-to-fit */
  max-width: 100%; /* Prevent overflow */
}
```

### 2. Reserve Space for Async Content (Expected to fix ~0.02 CLS)
```vue
<!-- In NewsList.vue -->
<div class="news-list__grid" style="min-height: 600px;">
  <!-- Content -->
</div>
```

### 3. Add Image Dimensions (Expected to fix ~0.002 CLS)
```vue
<!-- In NewsCard.vue -->
<div class="news-card__image-wrapper" style="aspect-ratio: 16/9;">
  <CyberImage ... />
</div>
```

## Validation Steps

After applying fixes:

1. **Re-run the debugging script**
2. **Compare CLS scores before/after**
3. **Verify no regressions on mobile/desktop**
4. **Test both /about and /news routes**

## Success Criteria

- **Target CLS:** <0.1 (Good)
- **Current CLS:** 0.172 (Needs improvement)
- **Expected after fixes:** ~0.02-0.05

## Troubleshooting

**No output in console:**
- Check browser supports PerformanceObserver (most modern browsers do)
- Ensure you refreshed the page after pasting the script
- Check for JavaScript errors in console

**CLS too low in testing:**
- Try "Slow 3G" in DevTools Network tab
- Clear browser cache
- Test in incognito mode

**Different results each time:**
- CLS can vary slightly between runs
- Take multiple measurements and average
- Test on actual mobile device for realistic results

## Files to Monitor

When debugging, pay special attention to these files:

1. **`src/App.vue`** - Main layout container
2. **`src/views/About.vue`** - About page structure
3. **`src/views/News.vue`** - News page structure
4. **`src/components/NewsList.vue`** - News grid container
5. **`src/components/NewsCard.vue`** - Individual card layout
6. **`index.html`** - Critical CSS seed

## Additional Tools

**Chrome Extensions:**
- Lighthouse CI (integrated into DevTools)
- Web Vitals (shows real-time CLS)
- React DevTools (component inspection)

**Command Line:**
```bash
# Run Lighthouse in CI mode
npm run lighthouse:ci

# Check CLS in CI logs
npm run test:lighthouse
```

## Next Steps

1. **Run the debugging script** on both routes
2. **Document the findings** in this file
3. **Apply the primary fix** (flex layout)
4. **Re-measure CLS** to confirm improvement
5. **Iterate** if needed based on new measurements