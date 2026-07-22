#!/bin/bash

# Lighthouse Baseline Capture Script
# Issue #461: Mobile TBT Regression Fix
#
# This script captures Lighthouse performance baselines for desktop and mobile
# after applying the ambient animation throttling fixes.
#
# Prerequisites:
# - Audit builds: dist-audit/ and dist-audit-mob/ must exist
# - Preview servers running on ports 4173 (desktop) and 4174 (mobile)
# - Lighthouse installed: npm install -g lighthouse

set -e

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}Lighthouse Baseline Capture Script${NC}"
echo -e "${BLUE}Issue #461: Mobile TBT Regression Fix${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Configuration
DESKTOP_PORT=4173
MOBILE_PORT=4174
EVIDENCE_DIR="./evidence"
BASE_URL_DESKTOP="http://localhost:${DESKTOP_PORT}"
BASE_URL_MOBILE="http://localhost:${MOBILE_PORT}"

# Routes to test
ROUTES=(
    "/"
    "/about"
    "/services"
    "/contact"
    "/news"
)

# Route names for file naming
ROUTE_NAMES=(
    "home"
    "about"
    "services"
    "contact"
    "news"
)

# Create evidence directory
mkdir -p "$EVIDENCE_DIR"

# Check if Lighthouse is installed
if ! command -v lighthouse &> /dev/null; then
    echo -e "${YELLOW}⚠️  Lighthouse not found. Installing...${NC}"
    npm install -g lighthouse
fi

echo -e "${GREEN}✓ Lighthouse ready${NC}"
echo ""

# Function to capture baseline for a single route
capture_route() {
    local route=$1
    local route_name=$2
    local preset=$3
    local port=$4
    local device_type=$5

    local url="http://localhost:${port}${route}"
    local json_file="${EVIDENCE_DIR}/baseline-${device_type}-${route_name}.json"
    local html_file="${EVIDENCE_DIR}/baseline-${device_type}-${route_name}.html"

    echo -e "${BLUE}Capturing ${device_type} baseline for ${route}...${NC}"

    # Run Lighthouse with JSON and HTML output
    lighthouse "$url" \
        --preset="$preset" \
        --output=json \
        --output=html \
        --output-path="${EVIDENCE_DIR}/baseline-${device_type}-${route_name}" \
        --quiet \
        --chrome-flags="--headless --no-sandbox --disable-gpu"

    if [ $? -eq 0 ]; then
        echo -e "${GREEN}  ✓ ${device_type} ${route_name} captured${NC}"

        # Extract and display key metrics
        if [ -f "$json_file" ]; then
            local perf_score=$(jq '.categories.performance.score * 100' "$json_file" 2>/dev/null || echo "N/A")
            local tbt=$(jq '.audits["total-blocking-time"].numericValue' "$json_file" 2>/dev/null || echo "N/A")
            local lcp=$(jq '.audits["largest-contentful-paint"].numericValue' "$json_file" 2>/dev/null || echo "N/A")
            local cls=$(jq '.audits["cumulative-layout-shift"].numericValue' "$json_file" 2>/dev/null || echo "N/A")

            echo -e "    Performance: ${perf_score}"
            echo -e "    TBT: ${tbt}ms"
            echo -e "    LCP: ${lcp}ms"
            echo -e "    CLS: ${cls}"
        fi
    else
        echo -e "${YELLOW}  ✗ Failed to capture ${device_type} ${route_name}${NC}"
    fi

    echo ""
}

# Function to check if server is running
check_server() {
    local port=$1
    local server_name=$2

    if curl -s "http://localhost:${port}" > /dev/null; then
        echo -e "${GREEN}✓ ${server_name} server running on port ${port}${NC}"
        return 0
    else
        echo -e "${YELLOW}⚠️  ${server_name} server not running on port ${port}${NC}"
        echo -e "${YELLOW}  Start with: npx serve -s dist-${server_name} -l ${port} &${NC}"
        return 1
    fi
}

echo -e "${BLUE}Checking preview servers...${NC}"
if ! check_server $DESKTOP_PORT "desktop"; then
    echo -e "${YELLOW}Starting desktop preview server...${NC}"
    npx serve -s dist-audit -l $DESKTOP_PORT > /dev/null 2>&1 &
    sleep 3
fi

if ! check_server $MOBILE_PORT "mobile"; then
    echo -e "${YELLOW}Starting mobile preview server...${NC}"
    npx serve -s dist-audit-mob -l $MOBILE_PORT > /dev/null 2>&1 &
    sleep 3
fi

echo ""

# Capture desktop baselines
echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}Capturing Desktop Baselines${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

for i in "${!ROUTES[@]}"; do
    route="${ROUTES[$i]}"
    route_name="${ROUTE_NAMES[$i]}"
    capture_route "$route" "$route_name" "desktop" $DESKTOP_PORT "desktop"
done

# Capture mobile baselines
echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}Capturing Mobile Baselines${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

for i in "${!ROUTES[@]}"; do
    route="${ROUTES[$i]}"
    route_name="${ROUTE_NAMES[$i]}"
    capture_route "$route" "$route_name" "mobile" $MOBILE_PORT "mobile"
done

# Summary
echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}Baseline Capture Complete${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""
echo -e "${GREEN}✓ Desktop baselines captured${NC}"
echo -e "${GREEN}✓ Mobile baselines captured${NC}"
echo ""
echo -e "${BLUE}Evidence files:${NC}"
echo -e "  ${EVIDENCE_DIR}/baseline-desktop-*.json"
echo -e "  ${EVIDENCE_DIR}/baseline-mobile-*.json"
echo -e "  ${EVIDENCE_DIR}/baseline-desktop-*.html"
echo -e "  ${EVIDENCE_DIR}/baseline-mobile-*.html"
echo ""
echo -e "${BLUE}Next steps:${NC}"
echo -e "  1. Review HTML reports for detailed analysis"
echo -e "  2. Update CI thresholds based on captured values"
echo -e "  3. Document results in issue-461-performance-baseline.md"
echo ""

# Generate summary table
echo -e "${BLUE}Performance Summary Table${NC}"
echo ""
printf "%-15s | %-10s | %-10s | %-10s | %-10s\n" "Route" "Device" "Perf Score" "TBT (ms)" "LCP (ms)"
echo "--------------------------------------------------------------------------------"

for i in "${!ROUTE_NAMES[@]}"; do
    route_name="${ROUTE_NAMES[$i]}"

    # Desktop metrics
    desktop_json="${EVIDENCE_DIR}/baseline-desktop-${route_name}.json"
    if [ -f "$desktop_json" ]; then
        perf_score=$(jq '.categories.performance.score * 100' "$desktop_json" 2>/dev/null || echo "N/A")
        tbt=$(jq '.audits["total-blocking-time"].numericValue | floor' "$desktop_json" 2>/dev/null || echo "N/A")
        lcp=$(jq '.audits["largest-contentful-paint"].numericValue | floor' "$desktop_json" 2>/dev/null || echo "N/A")
        printf "%-15s | %-10s | %-10s | %-10s | %-10s\n" "$route_name" "Desktop" "$perf_score" "$tbt" "$lcp"
    fi

    # Mobile metrics
    mobile_json="${EVIDENCE_DIR}/baseline-mobile-${route_name}.json"
    if [ -f "$mobile_json" ]; then
        perf_score=$(jq '.categories.performance.score * 100' "$mobile_json" 2>/dev/null || echo "N/A")
        tbt=$(jq '.audits["total-blocking-time"].numericValue | floor' "$mobile_json" 2>/dev/null || echo "N/A")
        lcp=$(jq '.audits["largest-contentful-paint"].numericValue | floor' "$mobile_json" 2>/dev/null || echo "N/A")
        printf "%-15s | %-10s | %-10s | %-10s | %-10s\n" "$route_name" "Mobile" "$perf_score" "$tbt" "$lcp"
    fi
done

echo ""
echo -e "${GREEN}✓ Baseline capture script complete${NC}"