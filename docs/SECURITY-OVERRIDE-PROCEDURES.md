# Security Override Procedures

**Issue**: #426 - [SEC][ORG] Conduct organization security audit and implement security best practices
**Date**: 2026-07-23
**Status**: Complete

## Overview

This document defines the procedures for temporarily overriding security controls when necessary for emergency situations, maintenance operations, or exceptional circumstances. All overrides must be authorized, documented, and time-limited.

## Override Governance

### Authorization Levels

#### Level 1: Standard Override
- **Approval Required**: Team Lead
- **Duration**: Maximum 4 hours
- **Use Cases**:
  - Emergency deployments
  - Critical bug fixes
  - Production debugging

#### Level 2: Elevated Override
- **Approval Required**: Engineering Manager
- **Duration**: Maximum 24 hours
- **Use Cases**:
  - Security incident response
  - Major infrastructure changes
  - Emergency maintenance

#### Level 3: Critical Override
- **Approval Required**: CTO/Designee
- **Duration**: Maximum 7 days
- **Use Cases**:
  - Disaster recovery
  - Major security incidents
  - System-wide emergencies

### Override Request Process

#### Step 1: Justification
Document the following:
```markdown
## Override Request

**Request ID**: OVR-YYYY-NNN
**Date**: [Date/Time]
**Requester**: [Name]
**Level**: [1/2/3]

### Justification
- **Reason**: [Detailed explanation]
- **Impact**: [What will be affected]
- **Duration**: [How long override is needed]
- **Alternatives Considered**: [Why override is necessary]

### Controls to Override
- [ ] Branch protection
- [ ] Required reviewers
- [ ] Status checks
- [ ] Deployment gates
- [ ] Access restrictions
- [ ] Other: [Specify]
```

#### Step 2: Approval
1. Submit request to appropriate approver
2. Include justification and risk assessment
3. Obtain explicit approval (not implicit)
4. Document approval in override log

#### Step 3: Implementation
```bash
# Document override initiation
echo "$(date) - OVERRIDE_INITIATED - OVR-YYYY-NNN - [Approver Name]" >> /var/log/security-overrides.log

# Implement override with specific parameters
# (Use most restrictive override possible)
```

#### Step 4: Monitoring
- Continuous monitoring during override period
- Alert on any unexpected activity
- Document all activities performed

#### Step 5: Restoration
```bash
# Document override completion
echo "$(date) - OVERRIDE_COMPLETED - OVR-YYYY-NNN - [Requester Name]" >> /var/log/security-overrides.log

# Restore normal security controls
# Verify restoration is complete
```

## Override Scenarios and Procedures

### Scenario 1: Emergency Deployment

#### Situation
- Critical security vulnerability in production
- Requires immediate deployment bypassing normal gates

#### Override Procedure
1. **Request Creation**
   - Document vulnerability details
   - Specify patch to be deployed
   - Request Level 1 override

2. **Approval**
   - Team Lead reviews and approves
   - Documents approval reasoning

3. **Implementation**
   ```bash
   # Temporarily disable branch protection
   gh api repos/:owner/:repo/branches/:branch/protection \
     --method DELETE \
     --header "Authorization: token $OVERRIDE_TOKEN"

   # Deploy hotfix
   git push origin main

   # Re-enable protection
   gh api repos/:owner/:repo/branches/:branch/protection \
     --method PUT \
     --body @branch-protection.json
   ```

4. **Post-Deployment**
   - Verify hotfix resolved issue
   - Conduct post-deployment review
   - Update procedures to prevent future need

### Scenario 2: Security Incident Response

#### Situation
- Active security incident requiring immediate action
- Need to modify security settings for containment

#### Override Procedure
1. **Immediate Action**
   - Activate incident response plan
   - Document override as part of incident response
   - Level 2 override automatically authorized for IC

2. **Implementation**
   ```bash
   # Emergency access grant
   gh api orgs/:org/memberships/:username \
     --method PUT \
     -f role=admin \
     --header "Authorization: token $OVERRIDE_TOKEN"

   # Document emergency access
   echo "$(date) - EMERGENCY_ACCESS - [Username] - [Reason]" >> /var/log/emergency-access.log
   ```

3. **Restoration**
   - Revoke emergency access after incident resolved
   - Review all actions taken during override
   - Implement permanent fixes

### Scenario 3: Critical Maintenance Window

#### Situation
- Required infrastructure maintenance
- Need to temporarily disable certain protections

#### Override Procedure
1. **Planning**
   - Schedule maintenance window in advance
   - Document all required overrides
   - Request Level 2 override

2. **Implementation**
   ```bash
   # Disable specific checks
   # (Document each check being disabled)

   # Perform maintenance
   # (Log all maintenance activities)

   # Re-enable checks
   # (Verify restoration)
   ```

3. **Verification**
   - Test all security controls restored
   - Review maintenance logs
   - Document any unexpected issues

## Override Logging and Audit

### Required Log Entries

Each override must log:
```json
{
  "override_id": "OVR-YYYY-NNN",
  "timestamp": "ISO-8601 timestamp",
  "requester": "Name and role",
  "approver": "Name and role",
  "level": 1/2/3,
  "controls_affected": ["list"],
  "justification": "Detailed reason",
  "expected_duration": "hours/days",
  "actual_duration": "hours/days",
  "activities_performed": ["list"],
  "restoration_verified": true/false,
  "post_override_review": "completed/pending"
}
```

### Audit Trail Requirements

#### Regular Audits
- **Monthly**: Review all Level 1 overrides
- **Quarterly**: Review all Level 2 overrides
- **Semi-annually**: Review all Level 3 overrides

#### Audit Checklist
- [ ] Override was properly authorized
- [ ] Justification was documented
- [ ] Duration was appropriate
- [ ] Activities were logged
- [ ] Controls were restored
- [ ] Post-override review completed

## Emergency Contacts

### Primary Contacts
- **CTO**: [Contact Information]
- **Engineering Manager**: [Contact Information]
- **Security Team Lead**: [Contact Information]
- **On-Call Engineer**: [Contact Information]

### Escalation Path
1. Start with immediate supervisor
2. Escalate to Engineering Manager
3. Further escalation to CTO
4. Critical situations: All of the above simultaneously

## Risk Mitigation

### Pre-Override Considerations
1. **Is override absolutely necessary?**
   - Can the objective be achieved without override?
   - Can normal processes be expedited instead?

2. **What are the risks?**
   - Security exposure during override
   - Potential for abuse or mistakes
   - Impact on compliance requirements

3. **How will risks be mitigated?**
   - Additional monitoring during override
   - Multiple person verification
   - Time-limited automatic restoration

### During Override
1. **Enhanced Monitoring**
   - Log all activities at debug level
   - Real-time monitoring of system logs
   - Alert on any unexpected patterns

2. **Verification Points**
   - Verify only intended actions occur
   - Confirm no unexpected side effects
   - Document all deviations

### Post-Override
1. **Verification**
   - Confirm all controls restored
   - Verify no residual access
   - Test normal operations

2. **Documentation**
   - Complete override log
   - Document lessons learned
   - Update procedures if needed

## Override Prevention

### Process Improvements
1. **Expedited Processes**
   - Implement fast-track approvals for urgent situations
   - Create emergency deployment procedures
   - Define emergency access patterns

2. **Automation**
   - Automate emergency response procedures
   - Create self-restoring temporary access
   - Implement time-limited privileges

3. **Training**
   - Regular override procedure training
   - Simulation exercises
   - Post-override reviews

## Compliance and Regulatory Considerations

### Regulatory Requirements
- **SOX**: Document all overrides, maintain audit trail
- **SOC 2**: Timely restoration of controls, documentation
- **ISO 27001**: Regular reviews, continuous improvement

### Documentation Requirements
- All overrides must be documented within 24 hours
- Audit trail must be maintained for 7 years
- Annual review of override procedures required

## References

- [GitHub Branch Protection](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches)
- [Incident Response Plan](SECURITY-INCIDENT-RESPONSE.md)
- [Repository Permissions](ORG-REPOSITORY-PERMISSIONS.md)

---

**Last Updated**: 2026-07-23
**Next Review**: 2026-10-23
**Maintained By**: Security Team
