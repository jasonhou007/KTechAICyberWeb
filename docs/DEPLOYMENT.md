# Deployment Guide

This guide covers deployment procedures for KTechAICyberWeb, including build processes, security verification, and CI/CD integration.

## Prerequisites

- Node.js 18+ and npm
- Git
- GitHub CLI (gh) for GitHub Pages deployment
- Access to KTechAICyberWeb repository

## Local Deployment

### Development Server

```bash
# Install dependencies
npm install --legacy-peer-deps

# Start development server
npm run dev
```

Access at: `http://localhost:5173/KTechAICyberWeb/`

### Production Build (SSG)

```bash
# Build static site with vite-ssg
npm run build

# Preview production build
npm run preview
```

The build outputs to `dist/` directory with pre-rendered HTML for all routes.

## GitHub Pages Deployment

### Manual Deployment

```bash
# Build the site
npm run build

# Deploy to GitHub Pages
# The dist/ directory should be pushed to the gh-pages branch
# Or use GitHub Actions for automated deployment
```

### Automated Deployment

We use GitHub Actions for automated deployment. See `.github/workflows/` for workflow configurations.

## Security Verification

### Pre-Deployment Security Checklist

Before deploying to production, verify the following security measures:

#### 1. Security Headers Verification

Test that security headers are properly configured:

```bash
# After deployment, check headers
curl -I https://jasonhou007.github.io/KTechAICyberWeb/

# Expected headers:
# X-Frame-Options: DENY
# X-Content-Type-Options: nosniff
# Referrer-Policy: strict-origin-when-cross-origin
# Strict-Transport-Security: max-age=31536000; includeSubDomains; preload
# Content-Security-Policy: <see SECURITY.md>
# Permissions-Policy: geolocation=(), microphone=(), camera=(), payment=()
# Cross-Origin-Opener-Policy: same-origin
# Cross-Origin-Resource-Policy: same-origin
```

#### 2. Dependency Vulnerability Scan

```bash
# Check for known vulnerabilities
npm audit

# Ensure no HIGH or CRITICAL vulnerabilities
# LOW/MODERATE should be reviewed and addressed if possible
```

#### 3. Lighthouse Security Score

```bash
# Run Lighthouse security audit
npx lhci autorun --config=lighthouserc-security.cjs

# Security score must be ≥90
# Performance score should be ≥60 (warning threshold)
# Accessibility score should be ≥80 (warning threshold)
```

#### 4. CSP Validation

Verify that Content Security Policy doesn't block legitimate resources:

```bash
# Check browser console for CSP violations
# All inline scripts should have SHA-256 hashes in CSP
# No external resources should be blocked
```

#### 5. HTTPS Enforcement

```bash
# Verify all links use HTTPS
grep -r 'http://' src/
# Should return no results (except for localhost examples)

# Verify all external resources use HTTPS
grep -E '(src|href)="http:' dist/*.html
# Should return no results
```

## Post-Deployment Verification

### 1. Smoke Test All Routes

Visit each route and verify:
- [ ] Home: `https://jasonhou007.github.io/KTechAICyberWeb/`
- [ ] About: `https://jasonhou007.github.io/KTechAICyberWeb/about`
- [ ] Services: `https://jasonhou007.github.io/KTechAICyberWeb/services`
- [ ] News: `https://jasonhou007.github.io/KTechAICyberWeb/news`
- [ ] Careers: `https://jasonhou007.github.io/KTechAICyberWeb/careers`
- [ ] Contact: `https://jasonhou007.github.io/KTechAICyberWeb/contact`

### 2. Security Headers Check

```bash
# Verify all security headers are present
curl -I https://jasonhou007.github.io/KTechAICyberWeb/ | grep -E "X-Frame|X-Content|Referrer|Strict-Transport|Content-Security|Permissions|Cross-Origin"
```

### 3. Browser Console Check

Open browser DevTools and verify:
- No CSP violations
- No mixed content warnings
- No JavaScript errors
- All fonts load successfully

### 4. Lighthouse Audit

Run Lighthouse in Chrome DevTools:
- Security score: ≥90
- Performance score: ≥60
- Accessibility score: ≥80

### 5. Mobile Responsiveness

Test on mobile devices or Chrome DevTools mobile emulation:
- All pages render correctly
- Navigation works on touch devices
- No horizontal scrolling
- Images are responsive

## Rollback Procedure

If issues are detected after deployment:

### 1. Emergency Rollback

```bash
# Revert to previous working commit
git revert <commit-hash>
git push origin main

# Force redeploy (if using GitHub Actions)
# Or manually deploy previous version
```

### 2. Verify Rollback

- Check that issues are resolved
- Run smoke tests
- Verify security headers
- Monitor for new issues

## CI/CD Integration

### GitHub Actions Workflows

Our deployment automation includes:

1. **Build Workflow** (`.github/workflows/build.yml`)
   - Runs on every push
   - Builds the site
   - Runs tests
   - Checks security headers

2. **Lighthouse CI** (`.github/workflows/lighthouse-ci.yml`)
   - Runs on pull requests
   - Audits performance, accessibility, security
   - Comments with Lighthouse scores

3. **Deploy Workflow** (`.github/workflows/deploy.yml`)
   - Deploys to GitHub Pages on merge
   - Runs post-deployment verification

### CI Security Gates

Before deployment, CI must pass:

- ✅ Build succeeds
- ✅ All tests pass (`npm run test:unit`)
- ✅ E2E tests pass (`npm run test:e2e`)
- ✅ npm audit shows no high/critical vulnerabilities
- ✅ Lighthouse security score ≥90

## Environment Variables

Currently, no environment variables are required for deployment.

If you add environment variables in the future:

1. Add them to GitHub repository secrets
2. Reference them in workflows
3. Document them here

## Troubleshooting

### Build Failures

**Issue**: Build fails with "module not found"
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install --legacy-peer-deps
```

**Issue**: vite-ssg build timeout
```bash
# Increase Node.js memory
NODE_OPTIONS=--max-old-space-size=4096 npm run build
```

### Deployment Issues

**Issue**: 404 errors on GitHub Pages
```bash
# Verify vite base path is correct in vite.config.js
base: '/KTechAICyberWeb/'

# Verify _headers file is in dist/ after build
ls dist/_headers
```

**Issue**: Security headers not applied
```bash
# Verify _headers file is in public/ directory
ls public/_headers

# Verify build copies _headers to dist/
ls dist/_headers
```

### Security Issues

**Issue**: CSP violations in console
```bash
# Check which hashes are missing
# Generate new hashes for modified scripts
# Update public/_headers with new hashes
```

**Issue**: npm audit shows vulnerabilities
```bash
# Review vulnerabilities
npm audit

# Fix if possible (may break things)
npm audit fix

# Or update specific package
npm install package@latest
```

## Monitoring

### Post-Deployment Monitoring

After deployment, monitor:

1. **GitHub Pages Deployment Logs**
   - Check deployment status
   - Review build logs for errors

2. **Browser Console**
   - Check for CSP violations
   - Look for JavaScript errors
   - Verify all resources load

3. **Performance**
   - Monitor Lighthouse scores
   - Check Core Web Vitals
   - Review load times

4. **Security**
   - Monitor CSP violation reports
   - Watch for new npm vulnerabilities
   - Review security headers

### Alerts

Set up alerts for:
- Deployment failures
- Security vulnerabilities
- Performance degradation
- High error rates

## Maintenance

### Regular Maintenance Tasks

**Weekly**:
- Check npm audit for new vulnerabilities
- Review GitHub Issues for security reports

**Monthly**:
- Update dependencies (test thoroughly)
- Review and update security policies
- Check Lighthouse scores for regression

**Quarterly**:
- Security audit (run comprehensive security scan)
- Review and update documentation
- Performance optimization review

## Appendix

### Useful Commands

```bash
# Build and preview
npm run build && npm run preview

# Run all tests
npm run test:unit && npm run test:e2e

# Security audit
npm audit
npx lhci autorun --config=lighthouserc-security.cjs

# Check headers locally
npx serve -s dist -l 4175
curl -I http://localhost:4175/
```

### References

- [SECURITY.md](./SECURITY.md) - Detailed security policy
- [vite-ssg Documentation](https://github.com/antfu/vite-ssg)
- [Lighthouse CI Documentation](https://github.com/GoogleChrome/lighthouse-ci)
- [GitHub Pages Documentation](https://docs.github.com/pages)

---

**Last Updated**: 2025-01-21
**Issue Reference**: #457 - Security Hardening
