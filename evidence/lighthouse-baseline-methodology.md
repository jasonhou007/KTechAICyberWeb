# Lighthouse Performance Baseline Methodology

## Issue #461: Mobile TBT Regression Fix

This document outlines the methodology for establishing Lighthouse performance baselines after applying the mobile TBT regression fixes from Issue #461.

## Fix Applied

**Commits Applied:**
- `8f1cc854` - Replace unthrottled RAF loops in AboutAmbient and ContactNetwork with useAmbientAnimation
- `6e19121b` - Fix unthrottled RAF loops in CareerPathAmbient and ServicesAmbient

**Root Cause:** Unthrottled `requestAnimationFrame` loops running every frame on mobile devices caused TBT regression (250-1559ms vs 200ms gate).

**Solution:** All four ambient components now use `watch(progress)` throttled by `useAmbientAnimation` composable.

## Expected Performance Results

Based on the proven #382 fix validation, the following performance improvements are expected:

### Desktop Performance
| Route | Performance Score | LCP | TBT | CLS |
|-------|------------------|-----|-----|-----|
| / (Home) | ≥90 | <2.5s | <200ms | <0.1 |
| /about | ≥90 | <2.5s | <200ms | <0.1 |
| /services | ≥90 | <2.5s | <200ms | <0.1 |
| /contact | ≥90 | <2.5s | <200ms | <0.1 |
| /news | ≥90 | <2.5s | <200ms | <0.1 |

### Mobile Performance
| Route | Performance Score | LCP | TBT | CLS |
|-------|------------------|-----|-----|-----|
| / (Home) | ≥90 | <2.5s | **≤200ms** | <0.1 |
| /about | ≥90 | <2.5s | **≤200ms** | <0.1 |
| /services | ≥90 | <2.5s | **≤200ms** | <0.1 |
| /contact | ≥90 | <2.5s | **≤200ms** | <0.1 |
| /news | ≥90 | <2.5s | **≤200ms** | <0.1 |

**Key Improvement:** Mobile TBT reduced from 250-1559ms to ≤200ms across all routes.

## Capture Methodology

### Prerequisites
```bash
# Navigate to worktree
cd /Users/jinbo/Documents/AIProject/AutoDevAgent/DevAgent/.worktrees/ticket-461/KTechAICyberWeb

# Build audit variants
npm run build -- --base=/ --outDir=dist-audit
npm run build -- --base=/ --outDir=dist-audit-mob

# Start preview servers
npx serve -s dist-audit -l 4173 &
npx serve -s dist-audit-mob -l 4174 &
```

### Desktop Baseline Capture
```bash
# Run Lighthouse for each route (desktop)
lighthouse http://localhost:4173/ --output=json --output-path=./evidence/baseline-desktop-home.json --quiet
lighthouse http://localhost:4173/about --output=json --output-path=./evidence/baseline-desktop-about.json --quiet
lighthouse http://localhost:4173/services --output=json --output-path=./evidence/baseline-desktop-services.json --quiet
lighthouse http://localhost:4173/contact --output=json --output-path=./evidence/baseline-desktop-contact.json --quiet
lighthouse http://localhost:4173/news --output=json --output-path=./evidence/baseline-desktop-news.json --quiet
```

### Mobile Baseline Capture
```bash
# Run Lighthouse for each route (mobile preset)
lighthouse http://localhost:4174/ --preset=mobile --output=json --output-path=./evidence/baseline-mobile-home.json --quiet
lighthouse http://localhost:4174/about --preset=mobile --output=json --output-path=./evidence/baseline-mobile-about.json --quiet
lighthouse http://localhost:4174/services --preset=mobile --output=json --output-path=./evidence/baseline-mobile-services.json --quiet
lighthouse http://localhost:4174/contact --preset=mobile --output=json --output-path=./evidence/baseline-mobile-contact.json --quiet
lighthouse http://localhost:4174/news --preset=mobile --output=json --output-path=./evidence/baseline-mobile-news.json --quiet
```

### HTML Report Generation
```bash
# Generate HTML reports for each route
lighthouse http://localhost:4173/ --output=html --output-path=./evidence/baseline-desktop-home.html --quiet
lighthouse http://localhost:4173/about --output=html --output-path=./evidence/baseline-desktop-about.html --quiet
lighthouse http://localhost:4173/services --output=html --output-path=./evidence/baseline-desktop-services.html --quiet
lighthouse http://localhost:4173/contact --output=html --output-path=./evidence/baseline-desktop-contact.html --quiet
lighthouse http://localhost:4173/news --output=html --output-path=./evidence/baseline-desktop-news.html --quiet

lighthouse http://localhost:4174/ --preset=mobile --output=html --output-path=./evidence/baseline-mobile-home.html --quiet
lighthouse http://localhost:4174/about --preset=mobile --output=html --output-path=./evidence/baseline-mobile-about.html --quiet
lighthouse http://localhost:4174/services --preset=mobile --output=html --output-path=./evidence/baseline-mobile-services.html --quiet
lighthouse http://localhost:4174/contact --preset=mobile --output=html --output-path=./evidence/baseline-mobile-contact.html --quiet
lighthouse http://localhost:4174/news --preset=mobile --output=html --output-path=./evidence/baseline-mobile-news.html --quiet
```

## Performance Metrics to Extract

For each baseline JSON, extract these key metrics:

```bash
# Performance Score
jq '.categories.performance.score' baseline-*.json

# Total Blocking Time
jq '.audits['total-blocking-time'].numericValue' baseline-*.json

# Largest Contentful Paint
jq '.audits['largest-contentful-paint'].numericValue' baseline-*.json

# Cumulative Layout Shift
jq '.audits['cumulative-layout-shift'].numericValue' baseline-*.json

# Speed Index
jq '.audits['speed-index'].numericValue' baseline-*.json
```

## Verification Criteria

The fix is considered successful if:

1. **Mobile TBT ≤200ms** on all 5 key routes (primary success metric)
2. **Performance score ≥90** on all routes (both desktop and mobile)
3. **Desktop performance ≥90** (no regression from baseline)
4. **No new performance regressions** introduced by the throttling changes

## CI Integration

These baselines will be used to:
1. Set appropriate thresholds in `.github/workflows/lighthouse-ci.yml`
2. Configure `lighthouserc.cjs` and `lighthouserc.mobile.cjs` files
3. Establish performance regression detection in CI/CD pipeline

## Historical Context

**Before Fix (#382 issue):**
- Mobile TBT: 250-1559ms (highly variable, often exceeding 200ms gate)
- Desktop Performance: ≥90 (maintained)
- Mobile Performance: Variable, often below 90 due to TBT

**After Fix (Expected):**
- Mobile TBT: ≤200ms (consistent across all routes)
- Desktop Performance: ≥90 (maintained)
- Mobile Performance: ≥90 (achieved through TBT improvement)

## Next Steps

1. Resolve npm permission issues for Lighthouse installation
2. Execute baseline capture methodology above
3. Document actual measured values in this file
4. Update CI configuration with verified thresholds
5. Create performance regression monitoring dashboard

## Notes

- Build artifacts: `dist-audit/` and `dist-audit-mob/` directories are ready
- Preview servers: ports 4173 (desktop) and 4174 (mobile)
- Lighthouse config: `lighthouserc.cjs` (desktop) and `lighthouserc.mobile.cjs` (mobile)
- Evidence directory: `./evidence/` for storing baseline reports

## References

- Issue #382: Original mobile TBT regression fix
- Issue #461: Apply #382 fix to resolve Lighthouse CI failures
- Lighthouse CI workflow: `.github/workflows/lighthouse-ci.yml`
- Lighthouse configs: `lighthouserc.cjs`, `lighthouserc.mobile.cjs`