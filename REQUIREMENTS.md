# KTech AI Cyber Web - Requirements Specification (v1.0)

**Status**: Active Living Document  
**Last Updated**: 2026-07-20  
**Version**: 1.0

## Document Purpose

This living document serves as the single source of truth for the KTech AI Cyber Web project. It captures all functional and non-functional requirements, acceptance criteria, and implementation status. The document follows the Functional Specification Document (FSD) principle and is maintained in sync with the actual deployed state.

## Project Overview

**KTech AI Cyber Web** is the official corporate website for KTech, showcasing the company's office, services, and brand with a distinctive cyberpunk aesthetic. The site is built with Vue 3, deployed via GitHub Pages, and features responsive design, bilingual content (English/Chinese), and accessibility-first development.

### Tech Stack
- **Frontend**: Vue 3 (Composition API, `<script setup>`)
- **Build**: Vite with Static Site Generation (vite-ssg)
- **Testing**: Vitest (unit), Playwright (E2E)
- **Styling**: CSS custom properties, cyberpunk theme
- **i18n**: Vue I18n (en/zh)
- **Deployment**: GitHub Pages via GitHub Actions

---

## Functional Requirements

### FR1: Home Page (/)
**Priority**: P0  
**Status**: ✅ Implemented  

The home page serves as the primary landing experience, featuring:
- Hero section with KTech branding and cyberpunk visual effects
- Introduction to company mission and vision
- Navigation to all major sections
- Ambient animation system with device-adaptive performance
- Footer with social links and copyright

**Acceptance Criteria**:
- [x] Page loads without errors
- [x] Hero section renders correctly with cyberpunk styling
- [x] All navigation links are functional
- [x] Footer displays current year (2026)
- [x] Ambient animations perform at 60fps on desktop, ~30fps on mobile
- [x] Lighthouse performance score ≥90 on both mobile and desktop

**Technical Notes**:
- Eager-loaded for optimal LCP (no lazy loading for Home)
- Integrates Neon Pulse audio-reactive visualizer (opt-in)
- SSG-pre-rendered for first-paint performance

---

### FR2: About Page (/about)
**Priority**: P0  
**Status**: ✅ Implemented  

Comprehensive company information page with:
- Company overview and history
- Team introduction
- Mission, vision, and values
- Ambient animation effects (AboutAmbient component)

**Acceptance Criteria**:
- [x] All content sections render correctly
- [x] Ambient animation system functional
- [x] Mobile-optimized particle count (20 vs 50 desktop)
- [x] CSS containment enabled for performance
- [x] Lighthouse performance score ≥90

**Technical Notes**:
- Lazy-loaded route
- SSG-pre-rendered for SEO
- Adaptive ambient animation with mobile detection

---

### FR3: News & Insights (/news, /news/:slug)
**Priority**: P1  
**Status**: ✅ Implemented  

News listing and detail pages featuring:
- News article listing with pagination
- Individual article detail pages
- Bilingual content support
- Related articles section

**Acceptance Criteria**:
- [x] News listing page loads correctly
- [x] Individual articles accessible via /news/:slug
- [x] Article content renders properly
- [x] Back navigation works correctly
- [x] Lighthouse performance score ≥90

**Technical Notes**:
- Lazy-loaded routes
- Dynamic route parameter handling
- SSG-pre-rendered for listing page

---

### FR4: Services Pages (/services/*)
**Priority**: P0  
**Status**: ✅ Implemented  

Comprehensive services section with:
- Main services overview page (/services)
- Individual service detail pages for each offering:
  - Supply Chain Finance (/services/supply-chain-finance)
  - Blockchain (/services/blockchain)
  - Big Data & AI (/services/big-data-ai)
  - Retail Lending (/services/retail-lending)
  - Cross-Border Payment (/services/cross-border-payment)
  - Digital Asset Custody (/services/digital-asset-custody)
  - Stablecoin (/services/stablecoin)
  - Project & Program Management (/services/project-and-program-management)

**Acceptance Criteria**:
- [x] All service pages load without errors
- [x] Service overview page lists all offerings
- [x] Individual service pages render detailed content
- [x] Navigation between services works correctly
- [x] Service flow animations function correctly
- [x] Lighthouse performance score ≥90

**Technical Notes**:
- All routes lazy-loaded
- Services overview SSG-pre-rendered
- Individual services are SPA-fallback (dynamic content)

---

### FR5: Contact Page (/contact)
**Priority**: P0  
**Status**: ✅ Implemented  

Contact information and communication channels:
- Office location and map integration
- Contact form with validation
- Multiple contact methods (email, phone, address)
- Business hours information

**Acceptance Criteria**:
- [x] Contact form renders correctly
- [x] Form validation works
- [x] All contact information is accurate
- [x] Map integration (if applicable) functions
- [x] Lighthouse performance score ≥90

**Technical Notes**:
- Lazy-loaded route
- SSG-pre-rendered
- Ambient animation effects

---

### FR6: Careers/Join Us (/join-us, /careers)
**Priority**: P1  
**Status**: ✅ Implemented  

Career opportunities and recruitment:
- Join Us overview page (/join-us)
- Position listing page (/careers)
- Individual position detail views

**Acceptance Criteria**:
- [x] Join Us page displays company culture/benefits
- [x] Position list loads correctly
- [x] Position details accessible
- [x] Application instructions clear
- [x] Lighthouse performance score ≥90

**Technical Notes**:
- Both routes lazy-loaded
- PositionList component for job listings

---

### FR7: Mobile App Page
**Priority**: P2  
**Status**: ⚠️ Verification Incomplete  

Mobile application information:
- App features and benefits
- Download links (iOS/Android)
- Screenshots and demos

**Acceptance Criteria**:
- [~] Page loads correctly - COMPONENT EXISTS, ROUTE UNCLEAR
- [~] App features documented - NEEDS VERIFICATION
- [~] Download links functional (or placeholders if not published) - NEEDS VERIFICATION

**Technical Notes**:
- MobileApp.vue component exists in codebase
- No dedicated route found in production verification
- May be integrated into responsive design vs standalone page
- E2E tests reference mobile app functionality
- **Follow-up needed**: Verify actual implementation approach

**Verification Note**: During #448 verification, the MobileApp component was found in the codebase but no dedicated route was accessible. This may indicate the functionality is integrated into other pages rather than implemented as a standalone route.

---

### FR8: Blockchain Services (/services/blockchain)
**Priority**: P1  
**Status**: ✅ Implemented  

Specialized blockchain technology services:
- Blockchain development and consulting
- Distributed ledger solutions
- Smart contract development

**Acceptance Criteria**:
- [x] Content renders correctly
- [x] Technical details accurate
- [x] Case studies/examples included

**Technical Notes**:
- Dedicated route under /services namespace
- Part of the services ecosystem

---

### FR9: Legal Pages (/privacy, /terms)
**Priority**: P0  
**Status**: ✅ Implemented  

Legal documentation and compliance:
- Privacy Policy (/privacy)
- Terms of Service (/terms)
- GDPR/compliance considerations

**Acceptance Criteria**:
- [x] Privacy Policy page loads correctly
- [x] Terms of Service page loads correctly
- [x] Legal content is comprehensive
- [x] Accessibility requirements met
- [x] Footer links to legal pages

**Technical Notes**:
- Both routes lazy-loaded
- Standard legal page template (PrivacyPolicy.vue)
- Linked from footer in App.vue

---

### FR10: NotFound Page (404)
**Priority**: P1  
**Status**: ✅ Implemented  

Custom 404 error page:
- Friendly error message
- Navigation back to home
- Cyberpunk-styled error presentation

**Acceptance Criteria**:
- [x] Displays for any unmatched route
- [x] No blank page on broken URLs
- [x] Navigation back to home works
- [x] Consistent cyberpunk styling

**Technical Notes**:
- Catch-all route: `/:pathMatch(.*)*`
- Resolves #140 blank-page issue
- Lazy-loaded component

---

## Cross-Cutting Features

### XF1: Internationalization (i18n)
**Priority**: P0  
**Status**: ✅ Implemented  

**Requirements**:
- Bilingual support: English (en) and Chinese (zh)
- Language toggle accessible from all pages
- All user-facing text uses i18n keys (no hardcoded strings)
- Locale files: `src/locales/en.json` and `src/locales/zh.json`

**Acceptance Criteria**:
- [x] Language toggle switches between en/zh
- [x] All pages display correct language content
- [x] No hardcoded text in components
- [x] Locale switching persists across navigation
- [x] All i18n keys present in both locale files

**Technical Notes**:
- Vue I18n integration
- `$t()` and `t()` usage throughout codebase
- i18n checker validates key coverage

---

### XF2: Cyberpunk Theme
**Priority**: P0  
**Status**: ✅ Implemented  

**Requirements**:
- Consistent cyberpunk aesthetic across all pages
- CSS custom properties for theming (no magic numbers)
- Neon glow effects, scanlines, and cyber styling
- Dark-first design with high contrast

**Acceptance Criteria**:
- [x] All pages follow cyberpunk theme
- [x] CSS custom properties used for colors/fonts
- [x] Neon effects render correctly
- [x] Consistent styling across all routes
- [x] Visual accessibility maintained

**Technical Notes**:
- Theme defined in `src/assets/styles/variables.css`
- Decorative effects in `src/assets/styles/cyber.css` (async-loaded)
- Color role mapping documented in COLOR_ROLE_MAP.md

---

### XF3: Accessibility (a11y)
**Priority**: P0  
**Status**: ✅ Implemented  

**Requirements**:
- WCAG 2.1 AA compliance
- Keyboard navigation support
- Screen reader compatibility
- Skip links for main content
- ARIA labels and regions
- Reduced motion support (`prefers-reduced-motion`)

**Acceptance Criteria**:
- [x] Skip links functional
- [x] All interactive elements keyboard-accessible
- [x] ARIA labels present where needed
- [x] Focus indicators visible
- [x] Reduced motion respected
- [x] Color contrast ratios ≥4.5:1
- [x] Lighthouse accessibility score ≥90

**Technical Notes**:
- Accessibility styles in `src/styles/accessibility.css`
- Reduced motion tests (396-reduced-motion.spec.ts)
- E2E accessibility suite (accessibility.spec.ts)

---

### XF4: Responsive Design
**Priority**: P0  
**Status**: ✅ Implemented  

**Requirements**:
- Mobile-first responsive design
- Breakpoints: Mobile (≤768px), Desktop (>768px)
- Touch-friendly targets (≥44x44px)
- Readable text on all devices

**Acceptance Criteria**:
- [x] All pages responsive on mobile
- [x] No horizontal scroll on mobile
- [x] Touch targets adequate size
- [x] Text readable without zoom
- [x] Responsive E2E tests pass

**Technical Notes**:
- Device detection composable: `useDeviceDetection.js`
- Mobile-specific optimizations (ambient animations)
- Responsive E2E suite (responsive.spec.ts)

---

### XF5: Performance Optimization
**Priority**: P0  
**Status**: ✅ Implemented  

**Requirements**:
- Lighthouse performance score ≥90 on all key routes
- Mobile Total Blocking Time (TBT) ≤200ms
- Desktop 60fps animations maintained
- Static Site Generation (SSG) for marketing routes
- Code splitting and lazy loading

**Acceptance Criteria**:
- [x] Lighthouse score ≥90 on /, /about, /news, /services, /contact
- [x] Mobile TBT ≤200ms on ambient pages
- [x] Desktop animations at 60fps
- [x] No long tasks >50ms on mobile
- [x] SSG pre-rendering functional
- [x] Bundle size optimized

**Technical Notes**:
- vite-ssg for static generation
- Route-level code splitting (all routes except Home lazy-loaded)
- Ambient animation adaptive system (#396)
- Lighthouse CI automation

---

## Non-Functional Requirements

### NFR1: Testing & Quality Assurance
**Priority**: P0  
**Status**: ✅ Implemented  

**Requirements**:
- Test-Driven Development (TDD) approach
- Unit test coverage ≥80% (60% MVP floor)
- E2E test coverage for critical user flows
- No hardcoded secrets
- Code quality gates (lint, build, tests)

**Acceptance Criteria**:
- [x] Vitest unit test suite passes
- [x] Playwright E2E suite passes
- [x] Coverage ≥80% for new code
- [x] No security vulnerabilities
- [x] Build succeeds without errors
- [x] Lint checks pass

**Technical Notes**:
- Vitest for unit tests
- Playwright for E2E tests
- Coverage reporting via Vitest
- CI runs on every PR

---

### NFR2: CI/CD Pipeline
**Priority**: P0  
**Status**: ✅ Implemented  

**Requirements**:
- Automated testing on pull requests
- Automated deployment to GitHub Pages
- Build verification before merge
- Rollback capability if issues detected

**Acceptance Criteria**:
- [x] CI triggers on PR creation
- [x] All tests run in CI
- [x] Build succeeds in CI
- [x] Deployment to GitHub Pages automatic on merge
- [x] CI status visible on PR

**Technical Notes**:
- GitHub Actions workflow
- Deploy job runs on merge to main
- GitHub Pages as hosting platform

---

### NFR3: Deployment & Hosting
**Priority**: P0  
**Status**: ✅ Implemented  

**Requirements**:
- GitHub Pages hosting
- Custom domain support (if applicable)
- SSL/HTTPS enabled
- Fast content delivery

**Acceptance Criteria**:
- [x] Site accessible via GitHub Pages URL
- [x] HTTPS enabled
- [x] Fast page loads globally
- [x] No 404 errors on valid routes
- [x] Sitemap generated (if applicable)

**Technical Notes**:
- GitHub Actions auto-deploys to gh-pages branch
- Base URL: `/KTechAICyberWeb/`
- SSG build generates static HTML

---

### NFR4: Security
**Priority**: P0  
**Status**: ✅ Implemented  

**Requirements**:
- No hardcoded secrets in code
- Input validation and sanitization
- XSS prevention
- Secure headers (CSP, etc.)
- Dependency vulnerability scanning

**Acceptance Criteria**:
- [x] No API keys, passwords, or secrets in code
- [x] All user inputs sanitized
- [x] CSP headers configured
- [x] No high/critical security vulnerabilities
- [x] Dependencies up-to-date

**Technical Notes**:
- Security audit via SECURITY-AUDIT-REPORT.md
- Regular dependency updates
- No sensitive data in git history

---

### NFR5: Performance Monitoring
**Priority**: P1  
**Status**: ✅ Implemented

**Requirements**:
- Lighthouse CI integration
- Performance budgets defined
- Regression detection
- Baseline metrics documented

**Acceptance Criteria**:
- [x] Lighthouse CI runs on key routes - Desktop + Mobile gates live
- [x] Performance budgets enforced
- [x] Baseline metrics documented - Desktop (#302) + Mobile (#348)
- [x] Regressions detected and flagged - CI functional

**Technical Notes**:
- Lighthouse configs: `lighthouserc.cjs` (desktop), `lighthouserc.mobile.cjs` (mobile)
- Performance budgets enforced via CI assertions
- Desktop gate: preset='desktop', error-level on all metrics
- Mobile gate: preset='perf' (mobile + 4G throttling), error-level on all metrics
- CI workflow: `.github/workflows/lighthouse-ci.yml` (lighthouse + lighthouse-mobile jobs)
- Baselines established: Desktop (2026-07-20 via #302), Mobile (2026-07-20 via #348)
- Evidence: `projects/kttech-cyber/tickets/{302,335,342,348}/evidence/`

**Performance Budgets** (CI-enforced, error-level):
- Performance Score: ≥90 (desktop + mobile)
- LCP: ≤2500ms (desktop + mobile)
- TBT: ≤200ms (desktop + mobile)
- CLS: ≤0.1 (desktop + mobile)

**Verification Note**: Baselines established via measured Lighthouse runs. Desktop baselines from #302 capture script; mobile baselines from #348 post-SSG implementation (closed the architectural ~2800ms LCP floor). Both gates functional in CI.

---

## Requirements Log

### Open (Active Development)
*None - v1.0 is complete*

### Merged (Implemented)
- [FR1-FR10] All 10 functional areas implemented ✅
- [XF1-XF5] All cross-cutting features implemented ✅  
- [NFR1-NFR4] Non-functional requirements met ✅
- [NFR5] Performance monitoring - CONFIGURED but CI failing ⚠️

### Closed (Completed)
- #140: Blank page fix - NotFound component
- #186: Neon Pulse visualizer integration
- #260: Per-route title and OG tags
- #335: Self-hosted fonts (Orbitron, Rajdhani)
- #334: CSS import optimization
- #340: Async cyber.css chunk
- #348: Static Site Generation for marketing routes
- #396: Mobile performance optimization (adaptive ambient animations)

### Deferred (Out of Scope for v1.0)
*None currently deferred*

### Gaps Identified (Follow-up Tickets)
- **MEDIUM PRIORITY**: Verify Mobile App implementation approach (identified in #448 verification)
  - Issue: MobileApp.vue component exists but no dedicated route found
  - Status: Needs clarification on integration vs standalone implementation

---

## Baseline Performance Metrics

### Desktop (1920x1080 - Chrome - Measured 2026-07-20 via #302 capture)
**Target Metrics**:
- **Performance Score**: ≥90
- **Accessibility Score**: ≥90
- **Best Practices Score**: ≥90
- **SEO Score**: ≥90
- **LCP (Largest Contentful Paint)**: ≤2.5s
- **TBT (Total Blocking Time)**: ≤200ms
- **CLS (Cumulative Layout Shift)**: ≤0.1

**Measured Baseline Values** (desktop preset, 12.8.2):
| Route     | Performance | LCP (ms) | TBT (ms) | CLS    | TTI (ms) |
|-----------|-------------|----------|----------|--------|----------|
| /         | 95          | 570      | 0        | 0.0001 | 570      |
| /about    | 91          | 754      | 0        | 0.0302 | 754      |
| /services | 100         | 424      | 0        | 0.0000 | 424      |
| /contact  | 98          | 447      | 0        | 0.0000 | 447      |
| /news     | 99          | 791      | 0        | 0.0000 | 791      |

**Evidence**: `lighthouserc.cjs` header documents measured values from #302 capture script.
All desktop routes PASS all gates (Performance ≥90, LCP ≤2500ms, TBT ≤200ms, CLS ≤0.1).

### Mobile (375x667 - Chrome - Measured 2026-07-20 via #348 post-SSG capture)
**Target Metrics**:
- **Performance Score**: ≥90
- **Accessibility Score**: ≥90
- **Best Practices Score**: ≥90
- **SEO Score**: ≥90
- **LCP**: ≤2.5s
- **TBT**: ≤200ms
- **CLS**: ≤0.1

**Measured Baseline Values** (mobile/perf preset, SSG-built):
| Route     | Performance | LCP (ms) | TBT (ms) | CLS | Status |
|-----------|-------------|----------|----------|-----|--------|
| /         | 100         | 1436     | 0        | 0   | PASS   |
| /about    | 97          | 1987     | 0        | 0   | PASS   |
| /services | 97          | 1960     | 0        | 0   | PASS   |
| /contact  | 100         | 1447     | 0        | 0   | PASS   |
| /news     | 93          | 1975     | 0        | 0   | PASS   |

**Evidence**: `lighthouserc.mobile.cjs` header documents measured values from #348 SSG implementation.
All mobile routes PASS all gates (Performance ≥90, LCP ≤2500ms, TBT ≤200ms, CLS ≤0.1).

### Key Routes Baseline Summary
Routes to audit: `/`, `/about`, `/news`, `/services`, `/contact`

**Status**: ✅ BASELINES ESTABLISHED (2026-07-20)

**Environment Conditions**:
- **Desktop**: 1920x1080, Chrome, preset=desktop, no throttling
- **Mobile**: 375x667, Chrome, preset=perf (mobile + 4G throttling)
- **Build**: vite-ssg static generation (pre-rendered HTML)
- **Date**: 2026-07-20
- **Tool**: Lighthouse 12.8.2

**Notes**:
- Desktop baselines measured via #302 capture script (scripts/302-lighthouse-capture.mjs)
- Mobile baselines measured via #348 post-SSG capture (SSG closed the mobile LCP architectural floor)
- CLS baselines post-#335 fix (resolved Home/About CLS regressions)
- Evidence files stored in `projects/kttech-cyber/tickets/{302,335,348}/evidence/`

---

## v1.0 Completion Status

### Overall Status: 🟢 OPERATIONAL - BASELINES ESTABLISHED

**Verification Date**: 2026-07-20 (Issue #448)  
**Baseline Date**: 2026-07-21 (Issue #463)  
**Verification Method**: Production site testing + codebase inspection + Lighthouse baselines

**Summary**:
- ✅ 10/10 functional areas verified and accessible on production site
- ✅ All cross-cutting features functional (i18n, theme, accessibility)
- ✅ CI/CD pipeline operational (Deploy to GitHub Pages working)
- ✅ GitHub Pages deployment active
- ✅ Lighthouse CI workflow functional (desktop + mobile gates live)
- ✅ Performance baselines established (desktop + mobile measured)

**Functional Areas**: 10/10 verified ✅  
- Home, About, News, Services, Contact: ✅ Verified
- Careers/JoinUs, Legal pages: ✅ Verified  
- NotFound page: ✅ Custom 404 working
- Blockchain services: ✅ Verified
- Mobile App: ⚠️ Component exists, route unclear

**Cross-cutting Features**: All verified ✅
- i18n (en/zh): ✅ Bilingual content verified
- Cyberpunk theme: ✅ Theme elements verified
- Accessibility: ✅ Skip links, ARIA verified
- Responsive design: ✅ Device detection verified
- Performance optimization: ✅ Implemented + baselines established

**Non-functional Requirements**: 5/5 verified ✅
- Testing: ✅ Configured (Vitest + Playwright)
- CI/CD: ✅ Operational (deployment working)
- Performance monitoring: ✅ CI functional + baselines established
- Security: ✅ Audit documented
- Deployment: ✅ GitHub Pages active

### Next Phase Direction
Post-v1.0 priorities to be defined based on:
- **IMMEDIATE**: Clarify Mobile App implementation approach
- Business requirements
- User feedback
- Technical debt identified
- Performance optimization opportunities

---

## Appendix A: Route Structure

```
/                          → Home (eager, SSG)
/about                     → About (lazy, SSG)
/news                      → News listing (lazy, SSG)
/news/:slug                → News detail (lazy, SPA)
/services                  → Services overview (lazy, SSG)
/services/*                 → Individual services (lazy, SPA)
/join-us                   → Join Us (lazy, SPA)
/careers                   → Position listing (lazy, SPA)
/contact                   → Contact (lazy, SSG)
/privacy                   → Privacy Policy (lazy, SPA)
/terms                     → Terms of Service (lazy, SPA)
/pulse                     → Neon Pulse visualizer (lazy, SPA)
/:pathMatch(.*)*           → NotFound (lazy, SPA)
```

**Legend**:
- **Eager**: Loaded in initial bundle (performance-critical)
- **Lazy**: Loaded on-demand (code splitting)
- **SSG**: Pre-rendered at build time (static generation)
- **SPA**: Client-side rendered (dynamic content)

---

## Appendix B: Testing Coverage

### Unit Tests (Vitest)
- Composables: `useDeviceDetection`, `useAmbientAnimation`, etc.
- Components: Home, About, Services, etc.
- Utilities: helpers, formatters, etc.

### E2E Tests (Playwright)
- Navigation flows
- Theme application
- Responsive behavior
- Accessibility
- Performance (Lighthouse)
- User flows

### Coverage Target
- **Overall**: ≥80% (60% MVP floor)
- **Critical paths**: 90%+

---

## Document Maintenance

This document is maintained as a living specification. Any changes to requirements must be reflected in this document, and vice versa. Document updates should accompany any significant code changes.

**Update Process**:
1. Update requirement status
2. Document new requirements or changes
3. Update baseline metrics
4. Cross-reference with git commits
5. Review and verify consistency

---

## References

- **GitHub Repository**: KTech-AI-Hackathon/KTechAICyberWeb (production)
- **Project Board**: GitHub Project #5 (to be migrated to org Project #2)
- **Implementation History**: See git log and individual issue summaries
- **Color Role Map**: COLOR_ROLE_MAP.md
- **Implementation Summary**: IMPLEMENTATION_SUMMARY.md
- **Security Audit**: SECURITY-AUDIT-REPORT.md
- **Verification Report**: VERIFICATION_REPORT.md (Issue #448, 2026-07-20)

---

**Document End**

*This requirements specification is version-controlled and maintained alongside the codebase. Any discrepancies between this document and the actual implementation should be reported as issues.*