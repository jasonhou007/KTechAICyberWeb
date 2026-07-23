# Token Lifecycle Management

**Issue**: #426 - [SEC][ORG] Conduct organization security audit and implement security best practices
**Date**: 2026-07-23
**Status**: Complete

## Overview

This document defines the complete lifecycle management process for all authentication tokens used within the KTech AI Cyber Web organization, including Personal Access Tokens (PATs), OAuth tokens, and workflow secrets.

## Token Categories

### 1. Personal Access Tokens (PATs)
- **Purpose**: Individual authentication for CLI tools, scripts, and automation
- **Lifespan**: 90 days maximum
- **Rotation**: Quarterly or upon compromise
- **Storage**: Secure vault or environment variables

### 2. OAuth Application Tokens
- **Purpose**: Third-party application integration
- **Lifespan**: 180 days maximum
- **Rotation**: Semi-annually or upon app re-authorization
- **Storage**: Application-specific secure storage

### 3. Workflow Secrets
- **Purpose**: GitHub Actions authentication
- **Lifespan**: 1 year maximum (organization secret)
- **Rotation**: Bi-annually
- **Storage**: GitHub Secrets (encrypted)

### 4. Service Account Tokens
- **Purpose**: Service-to-service authentication
- **Lifespan**: 365 days maximum
- **Rotation**: Annually or upon service decommission
- **Storage**: Cloud provider secret manager

## Token Lifecycle Stages

### Stage 1: Creation

#### Requirements Checklist
- [ ] Business justification documented
- [ ] Required scopes identified (minimum necessary)
- [ ] Owner assigned
- [ ] Expiration date set
- [ ] Purpose description provided

#### Creation Process
1. **Justification Review**
   - Submit token request with business case
   - Security team reviews scope requirements
   - Approval from team lead required

2. **Token Generation**
   - Use token generation tools/CLI
   - Set expiration date (max 90 days for PATs)
   - Generate descriptive name (e.g., `ci-cd-pipeline-prod`)

3. **Documentation**
   - Add to PAT-TOKEN-INVENTORY.md
   - Record creation date and expiration
   - Document purpose and scopes

4. **Distribution**
   - Deliver token via secure channel
   - Confirm receipt with owner
   - Delete any intermediate copies

### Stage 2: Active Usage

#### Monitoring Requirements
- **Daily**: Automated anomaly detection
- **Weekly**: Usage pattern review
- **Monthly**: Access scope validation
- **Quarterly**: Full audit

#### Usage Guidelines
✅ **Do:**
- Use tokens only for intended purpose
- Monitor usage for unusual patterns
- Report suspicious activity immediately
- Rotate before expiration

❌ **Don't:**
- Share tokens via email/chat
- Hardcode tokens in repositories
- Use tokens for multiple purposes
- Extend token expiration without review

### Stage 3: Rotation

#### Rotation Triggers
1. **Scheduled Rotation** - Based on token age
2. **Security Incident** - Potential compromise
3. **Scope Change** - New permissions required
4. **Personnel Change** - Token owner leaves organization

#### Rotation Process

##### Pre-Rotation (1 week before expiry)
```bash
# 1. Create new token
gh auth login -h github.com -s

# 2. Test new token in staging environment
curl -H "Authorization: token $NEW_TOKEN" https://api.github.com/user

# 3. Update documentation
# Edit PAT-TOKEN-INVENTORY.md
```

##### Rotation Execution
```bash
# 1. Deploy new token to all systems
# 2. Verify functionality with new token
# 3. Revoke old token immediately
gh auth logout -h github.com
# Or via API: DELETE /authorizations/{authorization_id}
```

##### Post-Rotation (within 24 hours)
- [ ] Update inventory documentation
- [ ] Confirm old token is revoked
- [ ] Archive rotation records
- [ ] Notify stakeholders

### Stage 4: Expiration

#### Expiration Handling
1. **30 days before expiry**
   - Automated email reminder to owner
   - Calendar invitation for rotation window

2. **14 days before expiry**
   - Second reminder with urgency
   - Security team notification

3. **7 days before expiry**
   - Critical reminder
   - Manager notification
   - Plan for service disruption if not rotated

4. **Day of expiry**
   - Automatic token invalidation
   - Service disruption notification
   - Emergency rotation process initiation

### Stage 5: Revocation

#### Immediate Revocation Triggers
- Token compromise confirmed
- Token owner leaves organization
- Security incident investigation
- Token no longer needed

#### Revocation Process
```bash
# Via GitHub CLI
gh auth revoke

# Via GitHub API
curl -X DELETE \
  -H "Authorization: token $ADMIN_TOKEN" \
  https://api.github.com/authorizations/{authorization_id}

# Via GitHub UI
# Settings → Developer settings → Personal access tokens → Revoke
```

## Token Classification by Risk

### Critical Risk (Immediate Action Required)
- **Tokens with**: `admin:org`, `repo:all`, `deployment` scopes
- **Rotation Frequency**: Monthly
- **Monitoring**: Real-time
- **Examples**: CI/CD pipeline tokens, deployment tokens

### High Risk (Priority Action)
- **Tokens with**: `repo:write`, `workflow` scopes
- **Rotation Frequency**: Quarterly
- **Monitoring**: Daily
- **Examples**: Build automation tokens, workflow tokens

### Medium Risk (Standard Action)
- **Tokens with**: `repo:read`, `project` scopes
- **Rotation Frequency**: Semi-annually
- **Monitoring**: Weekly
- **Examples**: Read-only automation, project board tokens

### Low Risk (Routine Action)
- **Tokens with**: `public_repo`, `gist` scopes
- **Rotation Frequency**: Annually
- **Monitoring**: Monthly
- **Examples**: Public data access tokens

## Automation Scripts

### Token Status Check
```bash
#!/bin/bash
# Check token expiration status
# Usage: ./check-token-expiry.sh <token_name>

TOKEN_NAME=$1
TOKEN_FILE="tokens/${TOKEN_NAME}.json"

if [ ! -f "$TOKEN_FILE" ]; then
  echo "❌ Token file not found: $TOKEN_FILE"
  exit 1
fi

CREATED=$(jq -r '.created' "$TOKEN_FILE")
EXPIRES_IN=$(jq -r '.expiresIn' "$TOKEN_FILE")

CREATED_DATE=$(date -j -f "%Y-%m-%d" "$CREATED" +%s)
EXPIRY_DATE=$((CREATED_DATE + (EXPIRES_IN * 86400)))
TODAY=$(date +%s)

DAYS_UNTIL_EXPIRY=$(( ($EXPIRY_DATE - $TODAY) / 86400 ))

if [ $DAYS_UNTIL_EXPIRY -lt 0 ]; then
  echo "🔴 EXPIRED: $TOKEN_NAME expired $((DAYS_UNTIL_EXPIRY * -1)) days ago"
elif [ $DAYS_UNTIL_EXPIRY -lt 7 ]; then
  echo "🟠 CRITICAL: $TOKEN_NAME expires in $DAYS_UNTIL_EXPIRY days"
elif [ $DAYS_UNTIL_EXPIRY -lt 30 ]; then
  echo "🟡 WARNING: $TOKEN_NAME expires in $DAYS_UNTIL_EXPIRY days"
else
  echo "🟢 OK: $TOKEN_NAME expires in $DAYS_UNTIL_EXPIRY days"
fi
```

### Token Rotation Template
```bash
#!/bin/bash
# Rotate token template
# Usage: ./rotate-token.sh <token_name>

TOKEN_NAME=$1
OLD_TOKEN_FILE="tokens/${TOKEN_NAME}.json"
NEW_TOKEN_FILE="tokens/${TOKEN_NAME}-new.json"

echo "🔄 Starting rotation for $TOKEN_NAME"

# 1. Generate new token
echo "📝 Generating new token..."
# Token generation command here

# 2. Update all references
echo "🔧 Updating references..."
# Update scripts, workflows, configs

# 3. Test new token
echo "🧪 Testing new token..."
# Test commands here

# 4. Revoke old token
echo "🗑️ Revoking old token..."
gh auth revoke

# 5. Update documentation
echo "📚 Updating documentation..."
# Update PAT-TOKEN-INVENTORY.md

echo "✅ Rotation complete for $TOKEN_NAME"
```

## Compliance Requirements

### Regulatory Compliance
- **SOX**: Token rotation every 90 days for financial systems
- **SOC 2**: Annual access review and token audit
- **ISO 27001**: Quarterly security assessments

### Internal Policies
- **Least Privilege**: Minimum required scopes only
- **Separation of Duties**: Different tokens for different environments
- **Audit Trail**: All token operations logged
- **Encryption**: Tokens encrypted at rest and in transit

## Incident Response

### Token Compromise Response
1. **Immediate Revocation** (within 15 minutes)
   ```bash
   gh auth revoke --token $COMPROMISED_TOKEN
   ```

2. **Impact Assessment** (within 1 hour)
   - Review access logs for unusual activity
   - Identify potentially exposed data
   - Determine scope of compromise

3. **Credential Rotation** (within 4 hours)
   - Rotate all tokens created before compromise
   - Force password resets if applicable
   - Revoke OAuth sessions

4. **Security Team Notification** (immediate)
   - Escalate to security response team
   - Document incident details
   - Initiate post-mortem process

### Post-Incident Actions
- [ ] Update security procedures
- [ ] Implement additional monitoring
- [ ] Conduct root cause analysis
- [ ] Document lessons learned

## Monitoring and Alerts

### Automated Monitoring
```yaml
# GitHub Actions workflow for token monitoring
name: Token Health Check
on:
  schedule:
    - cron: '0 9 * * 1'  # Weekly on Mondays at 9 AM

jobs:
  check-tokens:
    runs-on: ubuntu-latest
    steps:
      - name: Check token expiry
        run: |
          ./scripts/check-all-tokens.sh
      - name: Alert on critical tokens
        if: contains(steps.check.outputs, 'CRITICAL')
        run: |
          echo "::error::Critical tokens expiring soon"
```

### Alert Configuration
| Condition | Alert Type | Recipients |
|-----------|------------|------------|
| Token expires in 7 days | Email + Slack | Token owner |
| Token expires in 3 days | SMS + Email + Slack | Owner + Manager |
| Token expired | Page | On-call security |
| Token compromised | Page all | Security team |

## Documentation Requirements

### Token Records
Each token must have:
- Unique identifier/name
- Creation date
- Expiration date
- Purpose description
- Scopes/permissions
- Owner assignment
- Rotation history

### Audit Trail
Maintain records of:
- All token creations
- All rotation operations
- All revocations
- All access log reviews

---

**Last Updated**: 2026-07-23
**Next Review**: 2026-08-23
**Maintained By**: Security Team
