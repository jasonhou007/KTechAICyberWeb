# Security Policy

## Security Measures

KTechAICyberWeb implements multiple layers of security protection to ensure the safety and integrity of our website and user data.

### 1. Content Security Policy (CSP)

We use a strict Content Security Policy to prevent Cross-Site Scripting (XSS) attacks and data injection attacks.

#### CSP Configuration
- **Default Policy**: Restricts all resources to same-origin by default
- **Scripts**: Allows scripts from same-origin with SHA-256 whitelisting for inline scripts
- **Styles**: Allows styles from same-origin with unsafe-inline for Vue.js scoped styles
- **Images**: Allows images from same-origin, data URIs, and HTTPS sources
- **Fonts**: Allows fonts from same-origin and data URIs (self-hosted)
- **Connect**: Allows API calls to GitHub API only
- **Frames**: Blocks all frames (`frame-src 'none'`)
- **Objects**: Blocks all plugins (`object-src 'none'`)

#### Inline Script Hashes
Our CSP includes SHA-256 hashes for 4 inline JSON-LD structured data scripts:

```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "Organization",
  ...
}
</script>
```

Hashes:
- Organization: `sha256-g9v+MgaRF40zra76ggvvUuURa9K4sqXOzDWQP6cIHTs=`
- WebSite: `sha256-OzdMRKYQB69Gxupj5Dy77CxQS7dym21alwXiQMnxJP4=`
- WebPage: `sha256-y3ZUUnV07cpeGdMLa4RzXX/jPnQBSzlkmg/ZDyVsn40=`
- Corporation: `sha256-Gh+lmYwmvVugv7G0qUT8BFwlNquNb5kFHQdOjuVei2o=`

#### Hash Regeneration Process

If you modify the inline JSON-LD scripts in `index.html`, you must regenerate the SHA-256 hashes:

1. **Extract the script content**:
   ```bash
   # Extract each script block from index.html
   awk '/<script type="application\/ld\+json">/{found=1; next} found && /<\/script>/{print script; script=""; found=0; next} found{script=(script $0 ORS)}' index.html
   ```

2. **Compute SHA-256 hash**:
   ```bash
   # For each script, compute hash
   echo "<script_content>" | openssl dgst -sha256 -binary | openssl base64
   ```

3. **Update CSP**:
   Add `sha256-<hash>` to the `script-src` directive in `public/_headers`

### 2. Security Headers

We implement comprehensive security headers:

#### X-Frame-Options: DENY
Prevents clickjacking attacks by blocking the site from being embedded in frames.

#### X-Content-Type-Options: nosniff
Prevents MIME sniffing, ensuring browsers respect the declared content type.

#### Referrer-Policy: strict-origin-when-cross-origin
Controls referrer information sent with navigation requests, balancing privacy and analytics.

#### Strict-Transport-Security (HSTS)
Forces HTTPS connections for 1 year with subdomain coverage:
```
max-age=31536000; includeSubDomains; preload
```

#### Permissions-Policy
Disables browser features that aren't needed:
```javascript
geolocation=(), microphone=(), camera=(), payment=()
```

#### Cross-Origin-Opener-Policy: same-origin
Isolates the current page from other windows/pages for enhanced security.

#### Cross-Origin-Resource-Policy: same-origin
Controls how resources can be loaded by cross-origin requests.

### 3. Dependency Security

We regularly audit and update dependencies to address known vulnerabilities:

- **@vueuse/head**: Maintained at v2.0.0+ with security fixes
- **Vue.js**: Regular updates to latest stable releases  
- **Vite**: Build tool kept up-to-date for security patches

#### Risk Acceptance: unhead Vulnerabilities (MODERATE)

**Status**: Accepted risk - Development-time dependency only

**Issue**: @vueuse/head@2.0.0 depends on unhead≤2.1.12 which has 3 MODERATE XSS bypass vulnerabilities:
- GHSA-5339-hvwr-7582: Bypass of URI Scheme Sanitization in makeTagSafe via Case-Sensitivity
- GHSA-g5xx-pwrp-g3fv: XSS bypass in useHeadSafe via attribute name injection
- GHSA-95h2-gj7x-gx9w: hasDangerousProtocol() bypass via leading-zero padded HTML entities

**Risk Acceptance Rationale**:
1. **Development-time only**: @vueuse/head is a build-time dependency used for SSR meta tag generation
2. **Not in production bundle**: The library is not included in the browser-facing production code
3. **Server-side execution**: Vulnerabilities affect server-side rendering, not client users
4. **Controlled input**: We only use basic title/meta/description tags, not user-generated content
5. **No useHeadSafe usage**: We don't use the vulnerable useHeadSafe() function
6. **No breaking fix available**: npm audit fix requires downgrading to 0.9.8 (breaking change)

**Mitigation Strategy**:
- Monitor for @vueuse/head updates that depend on safe unhead versions
- Regular security audits to detect new vulnerabilities
- CSP provides additional XSS protection layers
- Review if upgrade becomes available without breaking changes

**Fixed Vulnerabilities** (2025-01-21):
- ✅ Vite upgraded from 5.4.21 → 8.1.5 (fixes GHSA-fx2h-pf6j-xcff CVSS 7.5)
- ✅ CSP hardened: removed 'unsafe-inline'/'unsafe-eval' from script-src

#### Vulnerability Scanning

Run security audit before deployment:
```bash
npm audit
npm audit fix
```

Critical/high vulnerabilities must be addressed before deployment. MODERATE vulnerabilities may be accepted if documented with proper rationale.

### 4. No External Dependencies

We minimize external dependencies:

- **No CDN Dependencies**: All dependencies are bundled and version-controlled
- **Self-Hosted Fonts**: Orbitron and Rajdhani fonts are bundled, not loaded from Google Fonts
- **No External Scripts**: No third-party analytics or tracking scripts

### 5. HTTPS Enforcement

The site is served exclusively over HTTPS:

- All pages redirect HTTP to HTTPS
- All internal links use relative paths or HTTPS
- All external resources use HTTPS

## Vulnerability Disclosure

If you discover a security vulnerability, please disclose it responsibly:

1. **Do NOT** create a public issue
2. **DO** email us at: security@ktech.fintech
3. Include details of the vulnerability and steps to reproduce

We will:
- Acknowledge receipt within 48 hours
- Provide regular updates on our progress
- Notify you when the issue is resolved
- Credit you in our security acknowledgments (if desired)

## Security Best Practices

### For Developers

1. **Never commit secrets** - API keys, passwords, or tokens
2. **Use environment variables** for configuration
3. **Keep dependencies updated** - Regular `npm audit` and updates
4. **Review CSP violations** - Check console for CSP reports
5. **Test security headers** - Use curl or browser DevTools

### For Deployment

1. **Verify HTTPS** - Ensure all resources use HTTPS
2. **Check security headers** - Use `curl -I` to verify headers
3. **Run Lighthouse** - Security score should be ≥90
4. **Monitor CSP reports** - Set up CSP violation monitoring
5. **Review npm audit** - Ensure no high/critical vulnerabilities

### For Users

1. **Use HTTPS only** - Always access via https:// URL
2. **Keep browser updated** - Latest security patches
3. **Report suspicious activity** - email security@ktech.fintech
4. **Use strong passwords** - If we add authentication in future

## Compliance

Our security measures align with:

- **OWASP Top 10** - Protection against common web vulnerabilities
- **CSP Level 3** - Latest Content Security Policy standard
- **HTTPS Best Practices** - Modern web security standards
- **Privacy by Design** - Minimal data collection, self-hosted fonts

## Version History

- **v1.1** (2025-01-21): Critical security fixes (Issue #457)
  - ✅ CRITICAL: Fixed CSP - removed 'unsafe-inline'/'unsafe-eval' from script-src
  - ✅ HIGH: Upgraded Vite 5.4.21 → 8.1.5 (fixes GHSA-fx2h-pf6j-xcff CVSS 7.5)
  - ✅ MODERATE: Documented risk acceptance for unhead vulnerabilities
  - ✅ Enforced SHA-256 hashes in real CSP (not Report-Only)
  
- **v1.0** (2025-01-21): Initial security hardening (Issue #457)
  - Implemented CSP with SHA-256 hashes
  - Added 7 security headers
  - Documented security measures
  - Configured Lighthouse security CI

---

**Last Updated**: 2025-01-21
**Issue Reference**: #457 - Security Hardening
