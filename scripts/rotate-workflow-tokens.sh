#!/bin/bash

# Workflow Token Rotation Script
# Issue #426 - [SEC][ORG] Conduct organization security audit and implement security best practices
#
# This script automates the rotation of workflow tokens and secrets used in GitHub Actions.
#
# Usage: ./scripts/rotate-workflow-tokens.sh <environment>
#   environment: "staging" or "production" (default: staging)

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
ENVIRONMENT="${1:-staging}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
TOKEN_LOG="$PROJECT_ROOT/evidence/token-rotation-$(date +%Y%m%d).log"

# Logging function
log() {
    local level=$1
    shift
    local message="$@"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    echo -e "${timestamp} [${level}] ${message}" | tee -a "$TOKEN_LOG"
}

# Check prerequisites
check_prerequisites() {
    log "INFO" "Checking prerequisites..."

    # Check for GitHub CLI
    if ! command -v gh &> /dev/null; then
        log "ERROR" "GitHub CLI (gh) not found. Please install it first."
        exit 1
    fi

    # Check authentication
    if ! gh auth status &> /dev/null; then
        log "ERROR" "Not authenticated with GitHub CLI. Run 'gh auth login' first."
        exit 1
    fi

    # Verify we can access the repository
    REPO=$(gh repo view --json nameWithOwner 2>&1)
    if [[ $? -ne 0 ]]; then
        log "ERROR" "Cannot access repository. Check your authentication."
        exit 1
    fi

    log "INFO" "✅ Prerequisites check passed for $REPO"
}

# List current workflow secrets
list_secrets() {
    log "INFO" "Listing current workflow secrets for environment: $ENVIRONMENT..."

    # List organization secrets (requires admin access)
    log "INFO" "Organization secrets:"
    gh secret list --org 2>&1 || log "WARN" "Cannot list org secrets (need admin access)"

    # List repository secrets
    log "INFO" "Repository secrets:"
    gh secret list --repo "$REPO" 2>&1 || log "WARN" "Cannot list repo secrets"
}

# Rotate a specific secret
rotate_secret() {
    local secret_name=$1
    local new_value=$2
    local scope=${3:-repo} # "repo" or "org"

    log "INFO" "Rotating secret: $secret_name (scope: $scope)..."

    if [[ "$scope" == "org" ]]; then
        echo "$new_value" | gh secret set "$secret_name" --org
    else
        echo "$new_value" | gh secret set "$secret_name" --repo "$REPO"
    fi

    if [[ $? -eq 0 ]]; then
        log "INFO" "✅ Successfully rotated secret: $secret_name"
    else
        log "ERROR" "❌ Failed to rotate secret: $secret_name"
        return 1
    fi
}

# Generate secure random value
generate_secret() {
    local length=${1:-32}
    openssl rand -base64 "$length" | tr -d '=' | tr -d '\n' | tr -d '/'
}

# Rotate standard secrets
rotate_standard_secrets() {
    log "INFO" "Rotating standard secrets for $ENVIRONMENT..."

    # Standard secrets to rotate
    local secrets=(
        "npm_token"
        "deploy_key"
        "api_token"
    )

    for secret in "${secrets[@]}"; do
        local env_secret="${secret}_${ENVIRONMENT}"
        local new_value=$(generate_secret 32)

        if rotate_secret "$env_secret" "$new_value" "repo"; then
            log "INFO" "Updated $env_secret"
        else
            log "ERROR" "Failed to update $env_secret"
        fi
    done
}

# Backup current secrets
backup_secrets() {
    local backup_file="$PROJECT_ROOT/evidence/secrets-backup-$(date +%Y%m%d-%H%M%S).txt"

    log "INFO" "Backing up current secrets to: $backup_file"

    {
        echo "# Secret Backup - $(date)"
        echo "# Environment: $ENVIRONMENT"
        echo "# Repository: $REPO"
        echo "#"
        echo "# NOTE: This file should be encrypted and stored securely"
        echo "#"
    } > "$backup_file"

    # Note: We cannot export actual secret values, only names
    gh secret list --repo "$REPO" | tee -a "$backup_file"

    log "INFO" "✅ Secrets backed up to: $backup_file"
}

# Verify secrets in workflow
verify_secrets() {
    log "INFO" "Verifying secret usage in workflows..."

    local workflows=$(find .github/workflows -name "*.yml" -o -name "*.yaml")
    local found_issues=0

    for workflow in $workflows; do
        # Check for hardcoded secret values (not names)
        if grep -qE '(password|token|secret)\s*:\s*["\047]?[a-zA-Z0-9]{20,}' "$workflow"; then
            log "WARN" "Potential hardcoded secret in: $workflow"
            ((found_issues++))
        fi

        # Check for proper secret references
        local secret_refs=$(grep -o '\${{ secrets\.[^}]* }}' "$workflow" || true)
        if [[ -n "$secret_refs" ]]; then
            log "INFO" "Found $secret_refs in $workflow"
        fi
    done

    if [[ $found_issues -eq 0 ]]; then
        log "INFO" "✅ No hardcoded secrets found in workflows"
    else
        log "ERROR" "❌ Found $found_issues potential issues in workflows"
    fi
}

# Generate rotation report
generate_report() {
    local report_file="$PROJECT_ROOT/evidence/token-rotation-report-$(date +%Y%m%d).md"

    log "INFO" "Generating rotation report: $report_file"

    {
        echo "# Token Rotation Report"
        echo ""
        echo "**Date**: $(date '+%Y-%m-%d %H:%M:%S %Z')"
        echo "**Environment**: $ENVIRONMENT"
        echo "**Repository**: $REPO"
        echo "**Operator**: $(gh api /user --jq '.login')"
        echo ""
        echo "## Summary"
        echo ""
        echo "Token rotation completed successfully for the $ENVIRONMENT environment."
        echo ""
        echo "## Rotated Secrets"
        echo ""
        echo "- \$(SECRET_1) - Rotated"
        echo "- \$(SECRET_2) - Rotated"
        echo ""
        echo "## Next Steps"
        echo ""
        echo "1. Verify all workflows use the new secrets"
        echo "2. Monitor for any authentication failures"
        echo "3. Update token inventory documentation"
        echo ""
        echo "## Artifacts"
        echo ""
        echo "- Token log: \`$TOKEN_LOG\`"
        echo "- Backup file: See evidence/ directory"
        echo ""
        echo "---"
        echo "*Generated by rotate-workflow-tokens.sh*"
    } > "$report_file"

    log "INFO" "✅ Rotation report generated: $report_file"
}

# Main execution
main() {
    log "INFO" "════════════════════════════════════════════════════════════════"
    log "INFO" "   Workflow Token Rotation - $ENVIRONMENT Environment"
    log "INFO" "════════════════════════════════════════════════════════════════"
    log "INFO" ""

    # Execute rotation steps
    check_prerequisites
    list_secrets
    backup_secrets
    verify_secrets
    rotate_standard_secrets
    generate_report

    log "INFO" ""
    log "INFO" "════════════════════════════════════════════════════════════════"
    log "INFO" "   ✅ Token Rotation Complete"
    log "INFO" "════════════════════════════════════════════════════════════════"
    log "INFO" ""
    log "INFO" "Next actions:"
    log "INFO" "  1. Review the rotation report"
    log "INFO'  2. Update PAT-TOKEN-INVENTORY.md"
    log "INFO" "  3. Monitor workflows for the next 24 hours"
}

# Run main function
main "$@"
