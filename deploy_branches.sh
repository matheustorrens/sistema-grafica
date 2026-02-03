#!/bin/bash

set -e

# Cores
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo "════════════════════════════════════════════════"
echo "  PrintMaster ERP - Deploy Automático"
echo "════════════════════════════════════════════════"
echo ""

# Salva as credenciais reais
REAL_URL="https://wiwhuysfrbygnkrngkha.supabase.co"
REAL_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indpd2h1eXNmcmJ5Z25rcm5na2hhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk2MTc4NTQsImV4cCI6MjA4NTE5Mzg1NH0.7o53tVTyjv20hTwz1sqQ023viLA2oBdBv29qm8WvShs"

PLACEHOLDER_URL="https://placeholder.supabase.co"
PLACEHOLDER_KEY="placeholder-key"

# 1. Commita mudanças atuais
echo -e "${BLUE}[1/5]${NC} Commitando alterações atuais..."
git add .
git commit -m "feat: atualização do projeto" || echo -e "${YELLOW}✓ Nada para commitar${NC}"

# 2. Configura branch MAIN (Supabase com credenciais REAIS)
echo -e "${BLUE}[2/5]${NC} Configurando branch MAIN (Supabase - Produção)..."
git checkout -B main

# Garante que as credenciais reais estão no arquivo
sed -i.bak "s|const supabaseUrl = .*|const supabaseUrl = '$REAL_URL'|" services/supabase/client.ts
sed -i.bak "s|const supabaseAnonKey = .*|const supabaseAnonKey = '$REAL_KEY'|" services/supabase/client.ts
rm -f services/supabase/client.ts.bak

git add services/supabase/client.ts
git commit -m "🚀 Config: Supabase com credenciais de produção" || echo -e "${YELLOW}✓ Já configurado${NC}"

# 3. Configura branch SISTEMA-DEMO (localStorage com placeholders)
echo -e "${BLUE}[3/5]${NC} Configurando branch SISTEMA-DEMO (localStorage - Demo)..."
git checkout -B sistema-demo

# Substitui por placeholders (isso faz IS_DEMO_MODE = true automaticamente)
sed -i.bak "s|const supabaseUrl = .*|const supabaseUrl = '$PLACEHOLDER_URL'|" services/supabase/client.ts
sed -i.bak "s|const supabaseAnonKey = .*|const supabaseAnonKey = '$PLACEHOLDER_KEY'|" services/supabase/client.ts
rm -f services/supabase/client.ts.bak

git add services/supabase/client.ts
git commit -m "🎭 Config: localStorage (Demo mode ativado)" || echo -e "${YELLOW}✓ Já configurado${NC}"

# 4. Push forçado (sobrescreve branches antigas no GitHub)
echo -e "${BLUE}[4/5]${NC} Fazendo push para GitHub..."
git push -f origin main
echo -e "${GREEN}✓ Branch main enviada${NC}"

git push -f origin sistema-demo
echo -e "${GREEN}✓ Branch sistema-demo enviada${NC}"

# 5. Volta pra main
echo -e "${BLUE}[5/5]${NC} Finalizando..."
git checkout main

echo ""
echo -e "${GREEN}════════════════════════════════════════════════${NC}"
echo -e "${GREEN}✅ DEPLOY CONCLUÍDO COM SUCESSO!${NC}"
echo -e "${GREEN}════════════════════════════════════════════════${NC}"
echo ""
echo "📦 Branch MAIN:"
echo "   → Supabase URL: $REAL_URL"
echo "   → IS_DEMO_MODE = false (Produção)"
echo ""
echo "🎭 Branch SISTEMA-DEMO:"
echo "   → Supabase URL: $PLACEHOLDER_URL"
echo "   → IS_DEMO_MODE = true (localStorage)"
echo ""

