# KTechAICyberWeb Branch Protection Rules

## Overview

This document defines branch protection policies for the KTechAICyberWeb repository. These rules ensure code quality, security, and traceability for all changes.

## Protected Branches

| Branch | Protection Level | Require PR | Require Review | CI Checks | Block Force Push |
|--------|------------------|-----------|----------------|------------|-----------------|
| `main` | Standard | ✓ | ✓ | ✓ | ✓ |

## Protection Rules

### Rule 1: Pull Request Required
- **Status**: ENABLED
- **Scope**: main branch
- **Rationale**: Forces review of all changes

### Rule 2: Required Reviews
- **Status**: ENABLED
- **Count**: 1 approval required
- **Code owners**: CODEOWNERS file must approve
- **Rationale**: Human oversight for all changes

### Rule 3: Status Checks Required
- **Status**: ENABLED
- **Strict**: Yes (all checks must pass)
- **Rationale**: Prevent broken code from merging

**Required Checks**:
- `ci` - General CI workflow
- `test` - Unit tests (Vitest)
- `e2e` - E2E tests (Playwright)
- `build` - Production build
- `lighthouse` - Performance thresholds (mobile)
- `security` - Security scan

### Rule 4: Block Force Pushes
- **Status**: ENABLED
- **Rationale**: Preserve git history, prevent rewrites

### Rule 5: Restrict Push Access
- **Status**: ENABLED
- **Who**: Repository owner only (@jasonhou007)
- **Rationale**: Prevent unauthorized direct pushes

## Automation-Specific Rules

### Rule 6: Automation Cannot Push to main
- **Agent Access**: READ-ONLY for main branch
- **Worktree Access**: Can create branches, not push to main
- **Rationale**: Ensure all automation goes through PR process

### Rule 7: Feature Branch Naming Convention
- **Pattern**: `autodev-{issue-number}-{short-description}`
- **Examples**: `autodev-423-org-governance`, `autodev-428-legal-pages`
- **Rationale**: Traceability from branch to issue

### Rule 8: Commit Message Format
- **Pattern**: `#{issue-number} {action} {description}`
- **Examples**: `#423 Add governance documentation`, `#428 Fix privacy policy link`
- **Rationale**: Traceability from commit to issue

## Status Check Details

| Check | Purpose | Waivable | Coverage Gate |
|-------|---------|----------|---------------|
| `ci` | General CI workflow | No | N/A |
| `test` | Unit tests pass (Vitest) | No | ≥80% lines (60% MVP) |
| `e2e` | E2E tests pass (Playwright) | No | All critical paths |
| `build` | Production build succeeds | No | N/A |
| `lighthouse` | Mobile Lighthouse thresholds | Case-by-case | Score ≥70, LCP ≤2.5s |
| `security` | Security scan passes | No | No high/critical issues |

## Quality Gates

### Coverage Gate
- **Target**: ≥80% line coverage
- **MVP Floor**: 60% line coverage
- **Enforcement**: CI blocks merge if under threshold
- **Branch Coverage**: Advisory (not blocking)

### Performance Gate
- **Mobile Lighthouse Score**: ≥70
- **LCP (Largest Contentful Paint)**: ≤2.5s
- **CLS (Cumulative Layout Shift)**: ≤0.1
- **Enforcement**: CI blocks merge if thresholds not met

### Security Gate
- **High/Critical Issues**: 0 allowed
- **Moderate Issues**: Allowed with review
- **Low Issues**: Allowed
- **Enforcement**: CI blocks merge on high/critical

## Emergency Overrides

See [DevAgent Emergency Override Procedures](https://github.com/jasonhou007/DevAgent/blob/main/docs/governance/EMERGENCY-OVERRIDE.md).

**When to Override**:
1. Critical production hotfix
2. Security vulnerability (CVSS ≥7.0)
3. Branch protection misconfiguration

**Override Process**:
1. Document emergency in issue
2. Disable protection temporarily
3. Push fix
4. Re-enable protection immediately
5. Post-emergency review

## Configuration

### Current Protection Settings

```yaml
enforce_admins: true
required_pull_request_reviews:
  required_approving_review_count: 1
  require_code_owner_reviews: true
  dismiss_stale_reviews: false
required_status_checks:
  strict: true
  contexts:
    - ci
    - test
    - e2e
    - build
    - lighthouse
    - security
restrictions:
  users:
    - jasonhou007
  teams: []
  apps: []
allow_force_pushes: false
```

### Applying/Updating Rules

Use GitHub CLI or web UI:
```bash
gh api \
  --method PUT \
  -H "Accept: application/vnd.github+json" \
  repos/jasonhou007/KTechAICyberWeb/branches/main/protection \
  -f enforce_admins=true \
  -f required_pull_request_reviews='{"required_approving_review_count":1}' \
  -f required_status_checks='{"strict":true,"contexts":["ci","test","e2e","build","lighthouse","security"]}' \
  -f restrictions='{"users":["jasonhou007"]}' \
  -f allow_force_pushes=false
```

## Best Practices

### For Developers (Human)
1. Create feature branch from main
2. Follow naming convention (`autodev-NNN-desc`)
3. Make atomic commits with `#NNN` format
4. Create PR with description linking to issue
5. Address review feedback
6. Wait for all CI checks to pass
7. Merge after approval

### For Automation
1. Create worktree from main
2. Follow naming convention
3. Make commits with `#NNN` format
4. Push to feature branch
5. Create PR with evidence (coverage, security report)
6. Wait for CI and human review
7. Request merge after approval

### For Reviewers
1. Review changes thoroughly
2. Check commit format
3. Verify tests pass and coverage meets threshold
4. Check security report
5. Approve if all gates satisfied

## Related Documents

- [CODEOWNERS](../CODEOWNERS) - Code ownership rules
- [SECURITY-POLICY.md](.github/SECURITY-POLICY.md) - Security policy
- [DevAgent Branch Protection Rules](https://github.com/jasonhou007/DevAgent/blob/main/docs/governance/BRANCH-PROTECTION-RULES.md) - Org-level rules

## Change History

| Date | Change | Reason |
|------|--------|--------|
| 2024-10-15 | Initial document | Establish baseline protection rules |
| 2024-10-20 | Added coverage/performance gates | Define quality thresholds |
