#!/bin/bash
# ==============================================================================
# PrintMasterERP - Environment Switcher
# ==============================================================================
# 
# This script helps you switch between different environments:
# - production: Live environment with real customer data
# - staging: Testing environment for new features
# - demo: Demo environment using localStorage
# - development: Local development environment
#
# Usage:
#   ./scripts/switch-env.sh <environment>
#
# Examples:
#   ./scripts/switch-env.sh production
#   ./scripts/switch-env.sh staging
#   ./scripts/switch-env.sh demo
#   ./scripts/switch-env.sh development
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
ENV=${1:-"development"}

# Validate environment
case $ENV in
  production|staging|demo|development)
    ;;
  *)
    echo -e "${RED}Error: Invalid environment '$ENV'${NC}"
    echo "Valid environments: production, staging, demo, development"
    exit 1
    ;;
esac

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  PrintMasterERP Environment Switcher${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Function to switch environment
switch_environment() {
  local env=$1
  local env_file="${PROJECT_ROOT}/.env.${env}"
  local target_file="${PROJECT_ROOT}/.env.local"
  
  # Check if environment file exists
  if [ ! -f "$env_file" ]; then
    local example_file="${PROJECT_ROOT}/.env.${env}.example"
    if [ -f "$example_file" ]; then
      echo -e "${YELLOW}Warning: .env.${env} not found.${NC}"
      echo -e "Creating from .env.${env}.example..."
      cp "$example_file" "$env_file"
      echo -e "${YELLOW}Please edit .env.${env} with your credentials.${NC}"
    else
      echo -e "${RED}Error: Neither .env.${env} nor .env.${env}.example found.${NC}"
      exit 1
    fi
  fi
  
  # Copy environment file to .env.local
  echo -e "Switching to ${GREEN}${env}${NC} environment..."
  cp "$env_file" "$target_file"
  
  # Set VITE_ENV in the target file
  if grep -q "^VITE_ENV=" "$target_file"; then
    sed -i "s/^VITE_ENV=.*/VITE_ENV=${env}/" "$target_file"
  else
    echo "VITE_ENV=${env}" >> "$target_file"
  fi
  
  echo -e "${GREEN}✓ Environment switched to ${env}${NC}"
}

# Function to switch git branch (optional)
switch_branch() {
  local env=$1
  local branch
  
  case $env in
    production)
      branch="main"
      ;;
    staging)
      branch="staging"
      ;;
    demo)
      branch="demo"
      ;;
    development)
      branch="develop"
      ;;
  esac
  
  # Check if we're in a git repository
  if git rev-parse --git-dir > /dev/null 2>&1; then
    # Check if branch exists
    if git show-ref --verify --quiet "refs/heads/${branch}"; then
      read -p "Switch to branch '${branch}'? (y/n) " -n 1 -r
      echo
      if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo -e "Switching to branch ${GREEN}${branch}${NC}..."
        git checkout "$branch"
        echo -e "${GREEN}✓ Switched to branch ${branch}${NC}"
      fi
    else
      echo -e "${YELLOW}Note: Branch '${branch}' does not exist yet.${NC}"
    fi
  fi
}

# Main execution
switch_environment "$ENV"
echo ""

# Optional: Switch git branch
switch_branch "$ENV"
echo ""

# Print current environment info
echo -e "${BLUE}Current Environment Settings:${NC}"
echo -e "  Environment: ${GREEN}${ENV}${NC}"

if [ -f "${PROJECT_ROOT}/.env.local" ]; then
  # Extract and display some info (without exposing secrets)
  if grep -q "VITE_SUPABASE_URL" "${PROJECT_ROOT}/.env.local"; then
    url=$(grep "VITE_SUPABASE_URL" "${PROJECT_ROOT}/.env.local" | cut -d'=' -f2)
    if [ -n "$url" ] && [ "$url" != "your_"* ]; then
      echo -e "  Supabase URL: ${GREEN}Configured${NC}"
    else
      echo -e "  Supabase URL: ${YELLOW}Not configured${NC}"
    fi
  fi
  
  if grep -q "VITE_ENABLE_DEMO_MODE=true" "${PROJECT_ROOT}/.env.local"; then
    echo -e "  Demo Mode: ${YELLOW}Enabled${NC}"
  else
    echo -e "  Demo Mode: ${GREEN}Disabled${NC}"
  fi
fi

echo ""
echo -e "${GREEN}Ready! Run 'npm run dev' to start the development server.${NC}"
