#!/bin/bash
# ==============================================================================
# PrintMasterERP - Deploy Script
# ==============================================================================
#
# This script deploys the application to Netlify for a specific environment.
#
# Prerequisites:
#   - Netlify CLI installed: npm install -g netlify-cli
#   - Logged into Netlify: netlify login
#   - Site linked: netlify link (run in project root)
#
# Usage:
#   ./scripts/deploy.sh <environment> [--prod]
#
# Examples:
#   ./scripts/deploy.sh staging         # Preview deploy
#   ./scripts/deploy.sh production --prod  # Production deploy
#   ./scripts/deploy.sh demo --prod     # Deploy to demo site
#
# ==============================================================================

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

# Arguments
ENV=${1:-"staging"}
IS_PROD=${2:-""}

# Validate environment
case $ENV in
  production|staging|demo)
    ;;
  *)
    echo -e "${RED}Error: Invalid environment '$ENV'${NC}"
    echo "Valid environments: production, staging, demo"
    exit 1
    ;;
esac

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  PrintMasterERP Deploy Script${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Check if netlify CLI is installed
if ! command -v netlify &> /dev/null; then
  echo -e "${RED}Error: Netlify CLI is not installed.${NC}"
  echo "Install it with: npm install -g netlify-cli"
  exit 1
fi

# Build first
echo -e "${BLUE}Step 1: Building application...${NC}"
"${SCRIPT_DIR}/build.sh" "$ENV"

# Deploy
echo ""
echo -e "${BLUE}Step 2: Deploying to Netlify...${NC}"
cd "$PROJECT_ROOT"

if [ "$IS_PROD" == "--prod" ]; then
  echo -e "${YELLOW}Deploying to PRODUCTION...${NC}"
  netlify deploy --prod --dir=dist
  echo ""
  echo -e "${GREEN}✓ Deployed to production!${NC}"
else
  echo -e "Creating preview deploy..."
  netlify deploy --dir=dist
  echo ""
  echo -e "${GREEN}✓ Preview deploy created!${NC}"
  echo -e "Use ${YELLOW}--prod${NC} flag to deploy to production."
fi

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  Deployment Complete!${NC}"
echo -e "${GREEN}========================================${NC}"
