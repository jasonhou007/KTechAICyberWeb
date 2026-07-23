/**
 * Security Utility Functions for Organization Security Audit
 * Issue #426 - [SEC][ORG] Conduct organization security audit and implement security best practices
 */

/**
 * Secret patterns for scanning
 */
const SECRET_PATTERNS = [
  // GitHub Personal Access Tokens
  {
    type: 'github-token',
    pattern: /ghp_[a-zA-Z0-9]{36}/g,
    severity: 'critical'
  },
  // GitHub OAuth Tokens
  {
    type: 'github-oauth',
    pattern: /gho_[a-zA-Z0-9]{36}/g,
    severity: 'critical'
  },
  // API Keys (generic pattern)
  {
    type: 'api-key',
    pattern: /(?:api[_-]?key|apikey)['":\s]*['"]?([a-zA-Z0-9_\-]{15,})['"]?/gi,
    severity: 'high'
  },
  // Stripe/Stripe-like keys
  {
    type: 'stripe-key',
    pattern: /sk[_-]?test[_-]?[a-zA-Z0-9]{10,}/gi,
    severity: 'high'
  },
  // Email addresses
  {
    type: 'email',
    pattern: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
    severity: 'low'
  },
  // AWS Access Keys
  {
    type: 'aws-access-key',
    pattern: /AKIA[0-9A-Z]{16}/g,
    severity: 'critical'
  },
  // Slack Tokens
  {
    type: 'slack-token',
    pattern: /xox[baprs]-[0-9]{12}-[0-9]{12}-[0-9A-Za-z]{24,}/g,
    severity: 'high'
  },
  // Generic password strings
  {
    type: 'password',
    pattern: /(?:password|passwd|pwd)['":\s]*['"]?([^'"`\s]{8,})['"]?/gi,
    severity: 'critical'
  }
];

/**
 * Scan text for potential secrets
 */
export function scanForSecrets(text: string): {
  found: boolean;
  secrets: Array<{
    type: string;
    value: string;
    severity: string;
    position: number;
  }>;
} {
  const secrets: Array<{
    type: string;
    value: string;
    severity: string;
    position: number;
  }> = [];

  SECRET_PATTERNS.forEach(({ type, pattern, severity }) => {
    let match;
    // Reset regex state
    pattern.lastIndex = 0;
    while ((match = pattern.exec(text)) !== null) {
      secrets.push({
        type,
        value: match[1] || match[0],
        severity,
        position: match.index
      });
    }
  });

  return {
    found: secrets.length > 0,
    secrets
  };
}

/**
 * Repository permission levels in order of privilege
 */
const PERMISSION_LEVELS = ['none', 'triage', 'push', 'maintain', 'admin'];

/**
 * Validate repository permissions
 */
export function validateRepositoryPermissions(permissions: {
  admin?: boolean;
  maintain?: boolean;
  push?: boolean;
  triage?: boolean;
}): {
  valid: boolean;
  level: string;
} {
  const { admin = false, maintain = false, push = false, triage = false } = permissions;

  if (admin) {
    return { valid: true, level: 'admin' };
  }
  if (maintain) {
    return { valid: true, level: 'maintain' };
  }
  if (push) {
    return { valid: true, level: 'push' };
  }
  if (triage) {
    return { valid: true, level: 'triage' };
  }

  return { valid: false, level: 'none' };
}

/**
 * Check if a token is expired or expiring soon
 */
export function checkTokenExpiry(token: {
  name: string;
  createdAt: string;
  expiresIn: number; // days
}): {
  expired: boolean;
  expiringSoon: boolean;
  daysUntilExpiry: number;
  expiryDate: Date;
} {
  const created = new Date(token.createdAt);
  const expiryDate = new Date(created);
  expiryDate.setDate(expiryDate.getDate() + token.expiresIn);

  const now = new Date();
  const daysUntilExpiry = Math.floor((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

  return {
    expired: daysUntilExpiry < 0,
    expiringSoon: daysUntilExpiry >= 0 && daysUntilExpiry <= 7,
    daysUntilExpiry,
    expiryDate
  };
}

/**
 * Generate a comprehensive security report
 */
export function generateSecurityReport(auditData: {
  repositoryPermissions: { valid: boolean; level: string };
  patTokens: Array<{ name: string; expired: boolean; expiringSoon: boolean }>;
  secretScan: { found: boolean; secrets: Array<{ type: string; severity: string }> };
  oauthApps: Array<{ name: string; verified: boolean }>;
}): {
  timestamp: string;
  summary: {
    criticalIssues: number;
    warningIssues: number;
    healthyItems: number;
  };
  findings: Array<{
    category: string;
    severity: string;
    description: string;
  }>;
  recommendations: Array<{
    priority: string;
    category: string;
    action: string;
  }>;
} {
  const findings: Array<{
    category: string;
    severity: string;
    description: string;
  }> = [];

  const recommendations: Array<{
    priority: string;
    category: string;
    action: string;
  }> = [];

  let criticalIssues = 0;
  let warningIssues = 0;
  let healthyItems = 0;

  // Check repository permissions
  if (!auditData.repositoryPermissions.valid) {
    criticalIssues++;
    findings.push({
      category: 'permissions',
      severity: 'critical',
      description: 'No valid repository permissions detected'
    });
    recommendations.push({
      priority: 'critical',
      category: 'permissions',
      action: 'Assign appropriate repository permissions to team members'
    });
  } else {
    healthyItems++;
  }

  // Check PAT tokens
  auditData.patTokens.forEach((token) => {
    if (token.expired) {
      criticalIssues++;
      findings.push({
        category: 'tokens',
        severity: 'critical',
        description: `Token "${token.name}" has expired`
      });
      recommendations.push({
        priority: 'critical',
        category: 'tokens',
        action: `Revoke or rotate expired token "${token.name}"`
      });
    } else if (token.expiringSoon) {
      warningIssues++;
      findings.push({
        category: 'tokens',
        severity: 'warning',
        description: `Token "${token.name}" expires soon`
      });
      recommendations.push({
        priority: 'warning',
        category: 'tokens',
        action: `Plan rotation for expiring token "${token.name}"`
      });
    } else {
      healthyItems++;
    }
  });

  // Check secret scan results
  if (auditData.secretScan.found) {
    const criticalSecrets = auditData.secretScan.secrets.filter((s) => s.severity === 'critical').length;
    criticalIssues += criticalSecrets;
    warningIssues += auditData.secretScan.secrets.length - criticalSecrets;
    // Note: don't increment healthyItems here since secrets were found
  } else {
    healthyItems++;
  }

  // Check OAuth apps
  auditData.oauthApps.forEach((app) => {
    if (!app.verified) {
      warningIssues++;
      findings.push({
        category: 'oauth',
        severity: 'warning',
        description: `OAuth app "${app.name}" is not verified`
      });
      recommendations.push({
        priority: 'warning',
        category: 'oauth',
        action: `Review and verify OAuth app "${app.name}"`
      });
    } else {
      healthyItems++;
    }
  });

  return {
    timestamp: new Date().toISOString(),
    summary: {
      criticalIssues,
      warningIssues,
      healthyItems
    },
    findings,
    recommendations
  };
}

/**
 * Validate workflow permissions for least-privilege access
 */
export function validateWorkflowPermissions(workflow: {
  name: string;
  permissions?: Record<string, string>;
}): {
  valid: boolean;
  issues: Array<{
    permission: string;
    issue: string;
    recommendation: string;
  }>;
} {
  const issues: Array<{
    permission: string;
    issue: string;
    recommendation: string;
  }> = [];

  if (!workflow.permissions) {
    return { valid: true, issues: [] };
  }

  // Check for overly broad permissions
  if (workflow.permissions['contents'] === 'write') {
    issues.push({
      permission: 'contents: write',
      issue: 'Grants write access to all repository contents',
      recommendation: 'Use contents: read unless write access is explicitly needed'
    });
  }

  if (workflow.permissions['issues'] === 'write') {
    issues.push({
      permission: 'issues: write',
      issue: 'Grants ability to create/modify issues',
      recommendation: 'Evaluate if issues: read is sufficient'
    });
  }

  return {
    valid: issues.length === 0,
    issues
  };
}
