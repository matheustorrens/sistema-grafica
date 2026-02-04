#!/bin/bash
# ==============================================================================
# PrintMasterERP - Build Script
# ==============================================================================
#
# This script builds the application for a specific environment.
#
# Usage:
#   ./scripts/build.sh <environment>
#
# Examples:
#   ./scripts/build.sh production
#   ./scripts/build.sh staging
#   ./scripts/build.sh demo
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

# Environment argument
ENV=${1:-"production"}

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
echo -e "${BLUE}  PrintMasterERP Build Script${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""
echo -e "Building for: ${GREEN}${ENV}${NC}"
echo ""

# Switch to the correct environment
"${SCRIPT_DIR}/switch-env.sh" "$ENV"

# Build the application
echo ""
echo -e "${BLUE}Building application...${NC}"
cd "$PROJECT_ROOT"
npm run build

# Success message
echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  Build Complete!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo -e "Output directory: ${BLUE}dist/${NC}"
echo ""

# Environment-specific notes
case $ENV in
  production)
    echo -e "${YELLOW}Production Build Notes:${NC}"
    echo "  - Ensure all environment variables are set correctly"
    echo "  - Test thoroughly before deploying to live users"
    echo "  - Deploy using 'netlify deploy --prod'"
    ;;
  staging)
    echo -e "${YELLOW}Staging Build Notes:${NC}"
    echo "  - Use this build for testing new features"
    echo "  - Deploy to staging: 'netlify deploy'"
    echo "  - Share preview URL with testers"
    ;;
  demo)
    echo -e "${YELLOW}Demo Build Notes:${NC}"
    echo "  - This build uses localStorage (no Supabase)"
    echo "  - Deploy to demo site for public access"
    echo "  - Perfect for landing page demos"
    ;;
esac
