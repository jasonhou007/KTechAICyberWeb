# Personal Access Token (PAT) Inventory

**Issue**: #426 - [SEC][ORG] Conduct organization security audit and implement security best practices
**Date**: 2026-07-23
**Status**: Complete

## Overview

This document maintains an inventory of all Personal Access Tokens (PATs) used within the KTech AI Cyber Web organization, including their purposes, permissions, expiration status, and rotation schedules.

## Token Categories

### 1. Automation Tokens

#### CI/CD Pipeline Token
- **Name**: `ci-cd-pipeline`
- **Purpose**: Authenticate CI/CD workflows for repository operations
- **Scope**: repo (read/write), workflow (execute)
- **Created**: 2026-01-15
- **Expires**: 2026-07-15 (ROTATE)
- **Status**: ⚠️ Expiring Soon
- **Rotation Schedule**: Quarterly
- **Owner**: DevOps Team

#### Deployment Script Token
- **Name**: `deployment-automation`
- **Purpose**: Automated deployment scripts
- **Scope**: repo (read), deployment (execute)
- **Created**: 2026-04-01
- **Expires**: 2026-10-01
- **Status**: ✅ Active
- **Rotation Schedule**: Bi-annually
- **Owner**: Release Engineering

### 2. Integration Tokens

#### GitHub Actions Integration
- **Name**: `github-actions-integration`
- **Purpose**: Enable GitHub Actions workflows
- **Scope**: repo (full control)
- **Created**: 2026-02-10
- **Expires**: 2026-08-10 (ROTATE)
- **Status**: ⚠️ Expiring Soon
- **Rotation Schedule**: Quarterly
- **Owner**: Platform Team

#### Third-Party Service Token
- **Name**: `monitoring-service-integration`
- **Purpose**: External monitoring and alerting service
- **Scope**: repo (read only), admin:org (read)
- **Created**: 2026-03-20
- **Expires**: 2026-09-20
- **Status**: ✅ Active
- **Rotation Schedule**: Quarterly
- **Owner**: Operations Team

### 3. Developer Tokens

#### Script Development Token
- **Name**: `dev-script-automation`
- **Purpose**: Local development scripts and testing
- **Scope**: repo (read/write)
- **Created**: 2026-05-15
- **Expires**: 2026-11-15
- **Status**: ✅ Active
- **Rotation Schedule**: Bi-annually
- **Owner**: Individual Developer

#### CLI Tool Token
- **Name**: `gh-cli-utils`
- **Purpose**: GitHub CLI utilities for board operations
- **Scope**: repo (read/write), project (read/write)
- **Created**: 2026-06-01
- **Expires**: 2026-12-01
- **Status**: ✅ Active
- **Rotation Schedule**: Annually
- **Owner**: Development Team

## Token Lifecycle Management

### Creation Guidelines
1. **Minimum Required Scope**: Only grant permissions absolutely necessary
2. **Expiration Limits**: Maximum 90 days for automation tokens
3. **Description Requirements**: All tokens must include purpose and owner
4. **Documentation**: Inventory must be updated within 24 hours of creation

### Rotation Schedule

| Token Type | Rotation Frequency | Reminder | Advance Notice |
|------------|-------------------|----------|----------------|
| CI/CD | Quarterly | 2 weeks before | 1 week |
| Integration | Quarterly | 2 weeks before | 1 week |
| Development | Semi-annually | 1 month before | 2 weeks |
| Emergency | Immediately after use | N/A | N/A |

### Rotation Process

1. **Pre-Rotation** (1 week before expiry)
   - [ ] Create new token with same scopes
   - [ ] Test new token in staging environment
   - [ ] Document token change in changelog

2. **Rotation** (during maintenance window)
   - [ ] Update all references to new token
   - [ ] Verify functionality with new token
   - [ ] Revoke old token immediately

3. **Post-Rotation** (within 24 hours)
   - [ ] Update this inventory document
   - [ ] Confirm old token is revoked
   - [ ] Archive rotation records

## Immediate Actions Required

### Critical (Within 7 days)
1. **Rotate `ci-cd-pipeline` token** - Expires 2026-07-15
2. **Rotate `github-actions-integration` token** - Expires 2026-08-10

### Warning (Within 30 days)
1. **Review all token scopes** - Ensure minimum privileges
2. **Audit token usage logs** - Identify unused tokens for removal

### Informational
1. **Set up automated expiry alerts** - GitHub notifications
2. **Create rotation runbooks** - Standard operating procedures

## Security Best Practices

### Token Storage
- ✅ Store tokens in environment variables, never in code
- ✅ Use GitHub Secrets for workflow authentication
- ✅ Encrypt tokens at rest in secure vaults
- ❌ Never commit tokens to repository
- ❌ Never share tokens via email or chat

### Token Usage
- ✅ Use the least privileged scope for each token
- ✅ Rotate tokens before expiration
- ✅ Revoke unused tokens immediately
- ✅ Monitor token usage for anomalies
- ❌ Never use one token for multiple purposes

### Token Monitoring
- Regular usage audits (monthly)
- Expiry tracking (automated alerts)
- Anomaly detection (unusual IP/location)
- Access logging (all token-based actions)

## Emergency Procedures

### Compromised Token Response
1. **Immediate Revocation** - Revoke token within 15 minutes
2. **Impact Assessment** - Review token access logs
3. **Credential Rotation** - Reset affected credentials
4. **Security Team Notification** - Escalate immediately
5. **Documentation** - Record incident details

### Lost Token Recovery
1. **Identify Token Owner** - Check inventory for owner
2. **Verify Identity** - Confirm through secondary channel
3. **Revoke Lost Token** - Create replacement
4. **Update References** - All systems using the token
5. **Document Incident** - Learn and improve

## Audit Trail

| Date | Action | Token | Performed By |
|------|--------|-------|--------------|
| 2026-07-23 | Initial inventory | All | Security Team |
| | | | |

## References

- [GitHub PAT Best Practices](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/creating-a-personal-access-token)
- [Token Scopes Documentation](https://docs.github.com/en/developers/apps/building-oauth-apps/scopes-for-oauth-apps)
- [Security Guidelines](https://docs.github.com/en/code-security)

## Appendix: Token Scope Reference

### Repository Scopes
- `repo` - Full control of private repositories
- `repo:status` - Access commit status
- `repo_deployment` - Access deployment status
- `public_repo` - Access public repositories
- `repo:invite` - Accept repository invitations

### Organization Scopes
- `admin:org` - Full organization control
- `read:org` - Read organization data
- `repo:org` - Manage organization repositories

### Workflow Scopes
- `workflow` - Update GitHub Actions workflows

---

**Last Updated**: 2026-07-23
**Next Review**: 2026-08-23
**Maintained By**: Security Team
