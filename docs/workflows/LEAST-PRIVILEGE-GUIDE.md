# Least Privilege Workflow Permissions Guide

**Issue**: #426 - [SEC][ORG] Conduct organization security audit and implement security best practices
**Date**: 2026-07-23
**Status**: Complete

## Overview

This guide establishes the principle of least privilege for GitHub Actions workflows within the KTech AI Cyber Web organization. All workflows must use minimal required permissions to reduce security risk.

## Permission Hierarchy

### Default Permissions (Most Restrictive)
```yaml
permissions:
  contents: read
```

### Workflow-Specific Permissions

#### CI/CD Workflows
```yaml
permissions:
  contents: read
  pull-requests: write
  actions: read
```
**Justification**: Needs to comment on PRs but not modify repository contents directly.

#### Deployment Workflows
```yaml
permissions:
  contents: write
  deployments: write
  pages: write
```
**Justification**: Requires write access for deployment operations.

#### Security Workflows
```yaml
permissions:
  contents: read
  security-events: write
  actions: read
```
**Justification**: Needs to upload security findings but not modify code.

#### Project Board Workflows
```yaml
permissions:
  contents: read
  projects: write
  repository-projects: write
```
**Justification**: Modifies project boards but not repository code.

## Workflow Permission Templates

### 1. Read-Only Workflow Template
**Use Cases**: Testing, linting, analysis workflows

```yaml
name: Read-Only Workflow
permissions:
  contents: read
  actions: read
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      # Read-only operations
```

### 2. PR Comment Workflow Template
**Use Cases**: Code review, reporting, validation

```yaml
name: PR Comment Workflow
permissions:
  contents: read
  pull-requests: write
  actions: read
jobs:
  report:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      # Generate and post comments
```

### 3. Deployment Workflow Template
**Use Cases**: Release, deployment, publishing

```yaml
name: Deployment Workflow
permissions:
  contents: write
  deployments: write
  id-token: write  # For OIDC
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      # Deployment operations
```

### 4. Security Scanning Workflow Template
**Use Cases**: CodeQL, dependency scanning, secret scanning

```yaml
name: Security Scanning Workflow
permissions:
  contents: read
  security-events: write
  actions: read
jobs:
  scan:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      # Security scanning operations
```

## Permission Justification Matrix

| Workflow | Contents | PR | Deploy | Security | Actions | Justification |
|----------|----------|-----|---------|----------|---------|----------------|
| test.yml | read | - | - | - | read | Test execution only |
| lint.yml | read | write | - | - | read | Comment on PRs |
| codeql.yml | read | - | - | write | read | Upload security findings |
| deploy.yml | write | - | write | - | read | Deploy artifacts |
| build.yml | read | - | - | - | read | Build artifacts |
| release.yml | write | write | write | - | read | Create releases |

## Existing Workflow Audit

### Compliant Workflows ✅
1. **lighthouse-security.yml** - Uses minimal permissions
2. **codeql.yml** - Security-scoped permissions only

### Workflows Requiring Update ⚠️
1. **Any workflow without explicit permissions** - Should default to read-only

## Implementation Guidelines

### Step 1: Audit Current Permissions
For each workflow, document:
- Current permissions
- Actual required permissions
- Justification for each permission

### Step 2: Apply Minimal Permissions
```yaml
# Before (over-privileged)
# No permissions specified (defaults to full write)

# After (least privilege)
permissions:
  contents: read
  pull-requests: write  # Only if needed
```

### Step 3: Validate Functionality
- Test workflow with restricted permissions
- Verify all operations succeed
- Document any permission elevation requirements

### Step 4: Document Justification
Create a PERMISSONS.md in each workflow directory explaining:
- Why each permission is required
- What operations use each permission
- When permissions can be reduced further

## Common Permission Patterns

### Pattern: Checkout + Test
```yaml
permissions:
  contents: read
steps:
  - uses: actions/checkout@v4
  - run: npm test
```

### Pattern: Build + Upload Artifact
```yaml
permissions:
  contents: read
  actions: write
steps:
  - uses: actions/checkout@v4
  - run: npm run build
  - uses: actions/upload-artifact@v4
```

### Pattern: Deploy to Pages
```yaml
permissions:
  contents: read
  pages: write
  id-token: write
steps:
  - uses: actions/checkout@v4
  - uses: actions/deploy-pages@v4
```

## Security Best Practices

### 1. Default to Deny
If a permission is not explicitly granted, it should not be required.

### 2. Job-Level Permissions
Where possible, apply permissions at the job level, not workflow level:

```yaml
jobs:
  job-with-need:
    permissions:
      contents: write  # Only this job needs write
    runs-on: ubuntu-latest
    steps: [...]

  job-without-need:
    permissions:
      contents: read  # This job only needs read
    runs-on: ubuntu-latest
    steps: [...]
```

### 3. Temporary Elevation
For operations requiring elevated permissions:
1. Create a separate workflow with elevated permissions
2. Trigger it via workflow_call or repository_dispatch
3. Use strict input validation

### 4. OIDC Over PATs
Use OpenID Connect for cloud deployments instead of stored credentials:

```yaml
permissions:
  contents: read
  id-token: write  # For OIDC token generation
```

## Monitoring and Compliance

### Automated Checks
- Workflow linting to detect missing permission declarations
- CI gate to verify permissions are explicitly set
- Alerts for permission elevation attempts

### Monthly Audit
- Review all workflow permissions
- Validate against actual usage
- Identify opportunities for reduction

### Documentation Updates
- Maintain this guide with current best practices
- Document any permission justifications
- Update templates as new patterns emerge

## References

- [GitHub Actions Permissions](https://docs.github.com/en/actions/security-guides/automatic-token-authentication#permissions-for-the-github_token)
- [Security Hardening for GitHub Actions](https://docs.github.com/en/actions/security-guides/security-hardening-for-github-actions)
- [Workflow Syntax](https://docs.github.com/en/actions/using-workflows/workflow-syntax-for-github-actions#permissions)

---

**Last Updated**: 2026-07-23
**Next Review**: 2026-08-23
**Maintained By**: Security Team
