import { describe, it, expect, vi } from 'vitest';
import {
  scanForSecrets,
  validateRepositoryPermissions,
  checkTokenExpiry,
  generateSecurityReport
} from '@/utils/security';

/**
 * Unit tests for security utility functions
 */

describe('Security Utilities', () => {
  describe('scanForSecrets', () => {
    it('should detect Stripe/secret keys in text', () => {
      const textWithSecret = 'const apiKey = "sk-test-1234567890abcdef"';
      const result = scanForSecrets(textWithSecret);
      expect(result.found).toBe(true);
      expect(result.secrets).toContainEqual(
        expect.objectContaining({ type: 'stripe-key' })
      );
    });

    it('should detect GitHub tokens in text', () => {
      const textWithToken = 'token: ghp_1234567890abcdefGHIJKLMNOPQRSTUVWXYZ';
      const result = scanForSecrets(textWithToken);
      expect(result.found).toBe(true);
      expect(result.secrets).toContainEqual(
        expect.objectContaining({ type: 'github-token' })
      );
    });

    it('should return empty results for clean text', () => {
      const cleanText = 'const apiKey = process.env.API_KEY';
      const result = scanForSecrets(cleanText);
      expect(result.found).toBe(false);
      expect(result.secrets).toHaveLength(0);
    });

    it('should detect email addresses', () => {
      const textWithEmail = 'Contact: user@example.com';
      const result = scanForSecrets(textWithEmail);
      expect(result.found).toBe(true);
      expect(result.secrets).toContainEqual(
        expect.objectContaining({ type: 'email' })
      );
    });
  });

  describe('validateRepositoryPermissions', () => {
    it('should validate admin permissions', () => {
      const permissions = {
        admin: true,
        maintain: false,
        push: false,
        triage: false
      };
      const result = validateRepositoryPermissions(permissions);
      expect(result.valid).toBe(true);
      expect(result.level).toBe('admin');
    });

    it('should validate maintain permissions', () => {
      const permissions = {
        admin: false,
        maintain: true,
        push: false,
        triage: false
      };
      const result = validateRepositoryPermissions(permissions);
      expect(result.valid).toBe(true);
      expect(result.level).toBe('maintain');
    });

    it('should invalidate no permissions', () => {
      const permissions = {
        admin: false,
        maintain: false,
        push: false,
        triage: false
      };
      const result = validateRepositoryPermissions(permissions);
      expect(result.valid).toBe(false);
      expect(result.level).toBe('none');
    });

    it('should prefer highest permission level', () => {
      const permissions = {
        admin: true,
        maintain: true,
        push: true,
        triage: true
      };
      const result = validateRepositoryPermissions(permissions);
      expect(result.level).toBe('admin');
    });
  });

  describe('checkTokenExpiry', () => {
    it('should detect expired tokens', () => {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 10);

      const result = checkTokenExpiry({
        name: 'test-token',
        createdAt: pastDate.toISOString(),
        expiresIn: 7 // days
      });

      expect(result.expired).toBe(true);
      expect(result.daysUntilExpiry).toBeLessThan(0);
    });

    it('should detect expiring tokens soon', () => {
      const recentDate = new Date();
      recentDate.setDate(recentDate.getDate() - 25);

      const result = checkTokenExpiry({
        name: 'test-token',
        createdAt: recentDate.toISOString(),
        expiresIn: 30 // days
      });

      expect(result.expiringSoon).toBe(true);
      expect(result.daysUntilExpiry).toBeGreaterThan(0);
      expect(result.daysUntilExpiry).toBeLessThanOrEqual(7);
    });

    it('should detect healthy tokens', () => {
      const today = new Date();

      const result = checkTokenExpiry({
        name: 'test-token',
        createdAt: today.toISOString(),
        expiresIn: 90 // days
      });

      expect(result.expired).toBe(false);
      expect(result.expiringSoon).toBe(false);
      expect(result.daysUntilExpiry).toBeGreaterThan(7);
    });
  });

  describe('generateSecurityReport', () => {
    it('should generate comprehensive security report', () => {
      const auditData = {
        repositoryPermissions: { valid: true, level: 'admin' },
        patTokens: [
          { name: 'token1', expired: false, expiringSoon: false },
          { name: 'token2', expired: true, expiringSoon: true }
        ],
        secretScan: { found: false, secrets: [] },
        oauthApps: [
          { name: 'app1', verified: true },
          { name: 'app2', verified: false }
        ]
      };

      const report = generateSecurityReport(auditData);

      expect(report).toHaveProperty('timestamp');
      expect(report).toHaveProperty('summary');
      expect(report).toHaveProperty('findings');
      expect(report).toHaveProperty('recommendations');

      expect(report.summary.criticalIssues).toBe(1); // 1 expired token
      expect(report.summary.warningIssues).toBe(1); // 1 unverified OAuth app
      expect(report.summary.healthyItems).toBe(4); // 1 healthy token + 1 valid permissions + 1 clean secret scan + 1 verified OAuth app
    });

    it('should include recommendations based on findings', () => {
      const auditData = {
        repositoryPermissions: { valid: false, level: 'none' },
        patTokens: [],
        secretScan: { found: true, secrets: [{ type: 'api-key' }] },
        oauthApps: []
      };

      const report = generateSecurityReport(auditData);

      expect(report.recommendations).toContainEqual(
        expect.objectContaining({
          priority: 'critical',
          category: 'permissions'
        })
      );
    });
  });
});
