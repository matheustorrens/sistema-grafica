#!/bin/bash
# ==============================================================================
# PrintMasterERP - Deploy Script para Branches
# ==============================================================================
#
# Este script permite fazer deploy seletivo para cada ambiente/branch.
#
# Branches:
#   - main           → Produção (Supabase de produção)
#   - sistema-staging → Staging/Testes (Supabase de staging)
#   - sistema-demo    → Demo (localStorage, sem Supabase)
#
# Uso:
#   ./deploy_branches.sh              # Menu interativo
#   ./deploy_branches.sh main         # Deploy apenas para main (produção)
#   ./deploy_branches.sh staging      # Deploy apenas para sistema-staging
#   ./deploy_branches.sh demo         # Deploy apenas para sistema-demo
#   ./deploy_branches.sh all          # Deploy para todas as branches
#
# ==============================================================================

set -e

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Diretório do script
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Configurações dos ambientes (credenciais Supabase)
# Production
PROD_URL="https://wiwhuysfrbygnkrngkha.supabase.co"
PROD_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indpd2h1eXNmcmJ5Z25rcm5na2hhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk2MTc4NTQsImV4cCI6MjA4NTE5Mzg1NH0.7o53tVTyjv20hTwz1sqQ023viLA2oBdBv29qm8WvShs"

# Staging
STAGING_URL="https://evujlxfbdfzpqlnmlxif.supabase.co"
STAGING_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV2dWpseGZiZGZ6cHFsbm1seGlmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAxNTA3ODIsImV4cCI6MjA4NTcyNjc4Mn0.JcmOlPRtU06CGgV8-PdHwkyay41VQ5hiS_MTu3FakJg"

# Demo (placeholders - ativa localStorage)
DEMO_URL=""
DEMO_KEY=""

# Arquivos que são específicos de cada ambiente (não devem ser copiados entre branches)
ENV_SPECIFIC_FILES=".env .env.local .env.production .env.staging .env.demo"

# Branch atual
CURRENT_BRANCH=$(git branch --show-current)

# ==============================================================================
# Funções Auxiliares
# ==============================================================================

print_header() {
    echo ""
    echo -e "${CYAN}════════════════════════════════════════════════════════════════${NC}"
    echo -e "${CYAN}  PrintMasterERP - Sistema de Deploy${NC}"
    echo -e "${CYAN}════════════════════════════════════════════════════════════════${NC}"
    echo ""
}

print_menu() {
    echo -e "${BLUE}Escolha uma opção:${NC}"
    echo ""
    echo "  1) Deploy para MAIN (Produção)"
    echo "  2) Deploy para SISTEMA-STAGING (Testes)"
    echo "  3) Deploy para SISTEMA-DEMO (Demo)"
    echo "  4) Deploy para TODAS as branches"
    echo "  5) Cancelar"
    echo ""
}

# Verifica se há mudanças não commitadas
check_uncommitted_changes() {
    if ! git diff-index --quiet HEAD -- 2>/dev/null; then
        return 0  # Há mudanças
    else
        return 1  # Não há mudanças
    fi
}

# Stash de mudanças locais de .env para evitar conflitos
stash_env_files() {
    git stash push -m "deploy-script-env-backup" -- $ENV_SPECIFIC_FILES 2>/dev/null || true
}

# Restaura .env após operações
restore_env_files() {
    git stash pop 2>/dev/null || true
}

# Cria/atualiza o arquivo .env.local com as credenciais do ambiente
create_env_file() {
    local env=$1
    local url=$2
    local key=$3
    local demo_mode=$4
    local debug=$5

    cat > .env.local << EOF
# PrintMasterERP - ${env} Environment
# Gerado automaticamente pelo deploy_branches.sh

# Environment
VITE_ENV=${env}

# Supabase
VITE_SUPABASE_URL=${url}
VITE_SUPABASE_ANON_KEY=${key}

# Feature Flags
VITE_ENABLE_DEMO_MODE=${demo_mode}
VITE_ENABLE_DEBUG=${debug}
EOF
}

# Commita mudanças pendentes
commit_changes() {
    local message=$1
    
    # Adiciona todos os arquivos (exceto .env que está no .gitignore)
    git add -A
    
    # Verifica se há algo para commitar
    if git diff --staged --quiet; then
        echo -e "${YELLOW}  ✓ Nenhuma mudança para commitar${NC}"
        return 0
    fi
    
    git commit -m "$message"
    echo -e "${GREEN}  ✓ Commit realizado${NC}"
}

# ==============================================================================
# Funções de Deploy por Branch
# ==============================================================================

deploy_main() {
    echo ""
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${BLUE}  📦 Deploying para MAIN (Produção)${NC}"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    
    # Checkout para main
    echo -e "\n${CYAN}[1/4]${NC} Mudando para branch main..."
    git checkout main 2>/dev/null || git checkout -b main
    
    # Merge das mudanças do branch atual (se não for main)
    if [ "$CURRENT_BRANCH" != "main" ] && [ -n "$CURRENT_BRANCH" ]; then
        echo -e "${CYAN}[2/4]${NC} Aplicando mudanças de $CURRENT_BRANCH..."
        git merge "$CURRENT_BRANCH" -m "merge: atualizações de $CURRENT_BRANCH" --no-edit || {
            echo -e "${YELLOW}  ⚠ Merge automático falhou, fazendo merge manual...${NC}"
            git checkout --theirs . 2>/dev/null || true
            git add -A
            git commit -m "merge: atualizações de $CURRENT_BRANCH" || true
        }
    else
        echo -e "${CYAN}[2/4]${NC} Já na branch main..."
    fi
    
    # Configura ambiente de produção
    echo -e "${CYAN}[3/4]${NC} Configurando ambiente de produção..."
    create_env_file "production" "$PROD_URL" "$PROD_KEY" "false" "false"
    
    # Commita configuração específica
    git add .env.local 2>/dev/null || true
    git commit -m "🚀 config(prod): ambiente de produção" --allow-empty 2>/dev/null || true
    
    # Push para GitHub
    echo -e "${CYAN}[4/4]${NC} Fazendo push para origin/main..."
    git push -u origin main --force-with-lease || git push -u origin main -f
    
    echo -e "\n${GREEN}✅ Branch MAIN atualizada com sucesso!${NC}"
    echo -e "   URL: ${PROD_URL}"
    echo -e "   Demo Mode: false"
}

deploy_staging() {
    echo ""
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${BLUE}  🧪 Deploying para SISTEMA-STAGING (Testes)${NC}"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    
    # Checkout para staging
    echo -e "\n${CYAN}[1/4]${NC} Mudando para branch sistema-staging..."
    git checkout sistema-staging 2>/dev/null || git checkout -b sistema-staging
    
    # Merge das mudanças da main (pega código atualizado)
    echo -e "${CYAN}[2/4]${NC} Sincronizando com main..."
    git merge main -m "merge: sincronização com main" --no-edit || {
        echo -e "${YELLOW}  ⚠ Merge automático falhou, usando código da main...${NC}"
        git checkout --theirs . 2>/dev/null || true
        git add -A
        git commit -m "merge: sincronização com main" || true
    }
    
    # Configura ambiente de staging
    echo -e "${CYAN}[3/4]${NC} Configurando ambiente de staging..."
    create_env_file "staging" "$STAGING_URL" "$STAGING_KEY" "false" "true"
    
    # Commita configuração específica
    git add .env.local 2>/dev/null || true
    git commit -m "🧪 config(staging): ambiente de testes" --allow-empty 2>/dev/null || true
    
    # Push para GitHub
    echo -e "${CYAN}[4/4]${NC} Fazendo push para origin/sistema-staging..."
    git push -u origin sistema-staging --force-with-lease || git push -u origin sistema-staging -f
    
    echo -e "\n${GREEN}✅ Branch SISTEMA-STAGING atualizada com sucesso!${NC}"
    echo -e "   URL: ${STAGING_URL}"
    echo -e "   Debug Mode: true"
}

deploy_demo() {
    echo ""
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${BLUE}  🎭 Deploying para SISTEMA-DEMO (Demo)${NC}"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    
    # Checkout para demo
    echo -e "\n${CYAN}[1/4]${NC} Mudando para branch sistema-demo..."
    git checkout sistema-demo 2>/dev/null || git checkout -b sistema-demo
    
    # Merge das mudanças da main (pega código atualizado)
    echo -e "${CYAN}[2/4]${NC} Sincronizando com main..."
    git merge main -m "merge: sincronização com main" --no-edit || {
        echo -e "${YELLOW}  ⚠ Merge automático falhou, usando código da main...${NC}"
        git checkout --theirs . 2>/dev/null || true
        git add -A
        git commit -m "merge: sincronização com main" || true
    }
    
    # Configura ambiente demo (localStorage)
    echo -e "${CYAN}[3/4]${NC} Configurando ambiente demo..."
    create_env_file "demo" "" "" "true" "true"
    
    # Commita configuração específica
    git add .env.local 2>/dev/null || true
    git commit -m "🎭 config(demo): ambiente demo com localStorage" --allow-empty 2>/dev/null || true
    
    # Push para GitHub
    echo -e "${CYAN}[4/4]${NC} Fazendo push para origin/sistema-demo..."
    git push -u origin sistema-demo --force-with-lease || git push -u origin sistema-demo -f
    
    echo -e "\n${GREEN}✅ Branch SISTEMA-DEMO atualizada com sucesso!${NC}"
    echo -e "   Storage: localStorage"
    echo -e "   Demo Mode: true"
}

deploy_all() {
    echo -e "\n${YELLOW}Iniciando deploy para TODAS as branches...${NC}"
    
    # Primeiro commita mudanças na branch atual
    if check_uncommitted_changes; then
        echo -e "\n${CYAN}Commitando mudanças pendentes...${NC}"
        git add -A
        git commit -m "feat: atualização do projeto" || true
    fi
    
    # Salva branch atual
    local original_branch=$CURRENT_BRANCH
    
    # Deploy em ordem: main primeiro (base), depois staging e demo
    deploy_main
    deploy_staging
    deploy_demo
    
    # Volta para branch original
    echo -e "\n${CYAN}Voltando para branch original ($original_branch)...${NC}"
    git checkout "$original_branch" 2>/dev/null || git checkout main
    
    # Restaura .env.local para o ambiente correto
    case "$original_branch" in
        main)
            create_env_file "production" "$PROD_URL" "$PROD_KEY" "false" "false"
            ;;
        sistema-staging)
            create_env_file "staging" "$STAGING_URL" "$STAGING_KEY" "false" "true"
            ;;
        sistema-demo)
            create_env_file "demo" "" "" "true" "true"
            ;;
        *)
            # Por padrão, usa produção
            create_env_file "production" "$PROD_URL" "$PROD_KEY" "false" "false"
            ;;
    esac
}

print_summary() {
    echo ""
    echo -e "${GREEN}════════════════════════════════════════════════════════════════${NC}"
    echo -e "${GREEN}  ✅ DEPLOY CONCLUÍDO COM SUCESSO!${NC}"
    echo -e "${GREEN}════════════════════════════════════════════════════════════════${NC}"
    echo ""
    echo -e "${BLUE}Resumo das branches:${NC}"
    echo ""
    echo -e "  📦 ${GREEN}main${NC} (Produção)"
    echo -e "     └─ Supabase: wiwhuysfrbygnkrngkha.supabase.co"
    echo -e "     └─ Clientes reais, dados de produção"
    echo ""
    echo -e "  🧪 ${YELLOW}sistema-staging${NC} (Testes)"
    echo -e "     └─ Supabase: evujlxfbdfzpqlnmlxif.supabase.co"
    echo -e "     └─ Ambiente para testar features"
    echo ""
    echo -e "  🎭 ${CYAN}sistema-demo${NC} (Demo)"
    echo -e "     └─ Storage: localStorage (sem banco)"
    echo -e "     └─ Para demonstrações e landing page"
    echo ""
    echo -e "Branch atual: ${GREEN}$(git branch --show-current)${NC}"
    echo ""
}

# ==============================================================================
# Main
# ==============================================================================

print_header

# Verifica se está num repositório Git
if ! git rev-parse --git-dir > /dev/null 2>&1; then
    echo -e "${RED}Erro: Este diretório não é um repositório Git.${NC}"
    exit 1
fi

# Processa argumento de linha de comando
TARGET=${1:-""}

case $TARGET in
    main|production|prod)
        if check_uncommitted_changes; then
            git add -A
            git commit -m "feat: atualização do projeto" || true
        fi
        deploy_main
        git checkout "$CURRENT_BRANCH" 2>/dev/null || true
        create_env_file "production" "$PROD_URL" "$PROD_KEY" "false" "false"
        print_summary
        ;;
    staging|test)
        if check_uncommitted_changes; then
            git add -A
            git commit -m "feat: atualização do projeto" || true
        fi
        # Primeiro atualiza main
        deploy_main
        deploy_staging
        git checkout "$CURRENT_BRANCH" 2>/dev/null || true
        create_env_file "production" "$PROD_URL" "$PROD_KEY" "false" "false"
        print_summary
        ;;
    demo)
        if check_uncommitted_changes; then
            git add -A
            git commit -m "feat: atualização do projeto" || true
        fi
        # Primeiro atualiza main
        deploy_main
        deploy_demo
        git checkout "$CURRENT_BRANCH" 2>/dev/null || true
        create_env_file "production" "$PROD_URL" "$PROD_KEY" "false" "false"
        print_summary
        ;;
    all)
        deploy_all
        print_summary
        ;;
    "")
        # Menu interativo
        print_menu
        read -p "Opção: " choice
        echo ""
        
        case $choice in
            1)
                if check_uncommitted_changes; then
                    git add -A
                    git commit -m "feat: atualização do projeto" || true
                fi
                deploy_main
                git checkout "$CURRENT_BRANCH" 2>/dev/null || true
                create_env_file "production" "$PROD_URL" "$PROD_KEY" "false" "false"
                print_summary
                ;;
            2)
                if check_uncommitted_changes; then
                    git add -A
                    git commit -m "feat: atualização do projeto" || true
                fi
                deploy_main
                deploy_staging
                git checkout "$CURRENT_BRANCH" 2>/dev/null || true
                create_env_file "production" "$PROD_URL" "$PROD_KEY" "false" "false"
                print_summary
                ;;
            3)
                if check_uncommitted_changes; then
                    git add -A
                    git commit -m "feat: atualização do projeto" || true
                fi
                deploy_main
                deploy_demo
                git checkout "$CURRENT_BRANCH" 2>/dev/null || true
                create_env_file "production" "$PROD_URL" "$PROD_KEY" "false" "false"
                print_summary
                ;;
            4)
                deploy_all
                print_summary
                ;;
            5)
                echo -e "${YELLOW}Deploy cancelado.${NC}"
                exit 0
                ;;
            *)
                echo -e "${RED}Opção inválida.${NC}"
                exit 1
                ;;
        esac
        ;;
    *)
        echo -e "${RED}Erro: Opção '$TARGET' não reconhecida.${NC}"
        echo ""
        echo "Uso: ./deploy_branches.sh [main|staging|demo|all]"
        exit 1
        ;;
esac

