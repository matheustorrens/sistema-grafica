# AI Coding Agent Instructions for This Codebase

## Overview
This project is a SaaS application for managing a printing business called **PrintMasterERP**. It is built using React (with TypeScript) and Vite as the build tool. The application is structured into components, pages, services, and context providers. It integrates with Supabase for backend services (including multi-tenant architecture with RLS) and uses local storage for demo mode.

## Supabase Projects
- **Production**: `wiwhuysfrbygnkrngkha` (wiwhuysfrbygnkrngkha.supabase.co)
- **Staging/Test**: `evujlxfbdfzpqlnmlxif` (evujlxfbdfzpqlnmlxif.supabase.co)

## Architecture
- **Components**: Reusable UI components are located in the `components/` directory. Examples include modals (`ConfirmModal.tsx`, `CreateOrderModal.tsx`) and layout components (`Dashboard.tsx`, `Layout.tsx`).
- **Pages**: Each page of the application is defined in the `pages/` directory. These pages represent the main navigation routes of the app.
  - `Dashboard.tsx` - Dashboard principal com métricas
  - `Orders.tsx` - Lista de pedidos com filtros e ações
  - `OrderDetails.tsx` - Detalhes do pedido (itens, pagamentos, histórico)
  - `Materials.tsx` - Gestão de materiais/estoque
  - `Quotes.tsx` - Geração de orçamentos para clientes (PDF)
  - `Suppliers.tsx` - Gestão de fornecedores
  - `Automation.tsx` - Automações de cobrança via WhatsApp
  - `Settings.tsx` - Configurações do sistema
  - `auth/` - Páginas de autenticação (SignIn, SignUp, ForgotPassword)
- **Services**: The `services/` directory contains modules for interacting with APIs and managing data. For example:
  - `api.ts`: Handles HTTP requests.
  - `supabaseClient.ts`: Configures and interacts with Supabase.
  - `localStorage/`: Manages local caching for materials, orders, and suppliers (demo mode).
- **Context**: The `context/` directory contains React Context providers, such as `SettingsContext.tsx` and `AuthContext.tsx`, for managing global state.
- **Supabase Integration**: The `services/supabase/` directory includes modules for interacting with Supabase tables (e.g., `materials.ts`, `orders.ts`).

## Multi-Tenant Architecture (IMPLEMENTED ✅)

### Database Schema
```sql
-- Tabelas principais
tenants (id, name, slug, settings, created_at)
user_tenants (id, user_id, tenant_id, role, created_at)
orders (id, tenant_id, client_name, description, status, total_amount, deadline, ...)
order_items (id, order_id, tenant_id, name, description, quantity, unit_price, ...)
payments (id, order_id, tenant_id, amount, payment_date, payment_method, ...)
materials (id, tenant_id, name, quantity, unit, min_stock, ...)
suppliers (id, tenant_id, name, contact, ...)
revenue_adjustments (id, tenant_id, order_id, adjustment_type, amount, ...)
```

### RLS Function
```sql
-- Função que retorna o tenant_id do usuário autenticado
CREATE OR REPLACE FUNCTION get_current_tenant_id()
RETURNS UUID AS $$
  SELECT ut.tenant_id FROM user_tenants ut WHERE ut.user_id = auth.uid() LIMIT 1;
$$ LANGUAGE sql STABLE SECURITY DEFINER;
```

### RLS Policies (Applied to all tenant tables)
```sql
-- Política de isolamento por tenant
CREATE POLICY "Tenant isolation for [table]" ON [table]
FOR ALL USING (tenant_id = get_current_tenant_id())
WITH CHECK (tenant_id = get_current_tenant_id());
```

### Auto-Create Tenant Trigger
```sql
-- Trigger que cria automaticamente um tenant quando novo usuário se cadastra
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
  new_tenant_id UUID;
  tenant_name TEXT;
  tenant_slug TEXT;
BEGIN
  tenant_name := COALESCE(NEW.raw_user_meta_data->>'company_name', split_part(NEW.email, '@', 1));
  tenant_slug := lower(regexp_replace(tenant_name, '[^a-zA-Z0-9]', '-', 'g')) || '-' || substr(gen_random_uuid()::text, 1, 8);
  
  INSERT INTO public.tenants (name, slug) VALUES (tenant_name, tenant_slug) RETURNING id INTO new_tenant_id;
  INSERT INTO public.user_tenants (user_id, tenant_id, role) VALUES (NEW.id, new_tenant_id, 'admin');
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

## Developer Workflows

### Building and Running the Project
- Use `npm install` to install dependencies.
- Start the development server with `npm run dev`.
- Build the project for production with `npm run build`.

### Environment Switching
Use the scripts in `scripts/` directory:
- `scripts/switch-env.sh staging` - Switch to staging environment
- `scripts/switch-env.sh production` - Switch to production environment

### Testing
- Currently, no explicit testing framework is set up. Add tests as needed using your preferred framework (e.g., Jest, React Testing Library).

### Debugging
- Use browser developer tools for debugging React components.
- Supabase queries can be debugged by inspecting network requests or using the Supabase dashboard.

## Project-Specific Conventions
- **TypeScript**: All components and services are written in TypeScript. Ensure proper typing for props, state, and function arguments.
- **State Management**: Use React Context for global state and `useState` or `useReducer` for local state.
- **API Integration**: Use the `api.ts` service for HTTP requests and `supabaseClient.ts` for database interactions.
- **File Naming**: Follow the existing naming conventions (e.g., `CreateOrderModal.tsx` for modals, `Orders.tsx` for pages).
- **Dark Mode**: All components support dark mode using Tailwind's `dark:` prefix.
- **Tenant Isolation**: Always include `tenant_id` when inserting data. RLS handles filtering on reads.

## External Dependencies
- **Supabase**: Used for authentication, database, and storage.
- **Vite**: Build tool for fast development and optimized builds.
- **React**: Frontend library for building user interfaces.
- **Lucide React**: Icon library used throughout the app.
- **Tailwind CSS**: Utility-first CSS framework.

## Key Features Implemented

### Orders Management
- Create, edit, delete orders
- Order items with dynamic descriptions
- Status management with customizable statuses
- Deadline tracking
- Dropdown menu with quick actions (Gerar Orçamento, Cobrar, Excluir)

### Payments System
- Register payments per order
- Multiple payment methods (PIX, Cartão, Dinheiro, Boleto, Transferência)
- Delete payments with confirmation
- Validation: cannot exceed pending amount (shows inline warning)
- Quick payment button on order cards

### Quotes (Orçamentos)
- Generate PDF quotes from orders or manually
- Drag-and-drop logo upload
- Configurable settings (default delivery time, phone, address)
- Print-ready PDF generation
- Dark mode support in preview

### Materials & Inventory
- Stock tracking with min_stock alerts
- Supplier association

### Automation
- WhatsApp charge message generation
- Bulk charge for pending payments

## Notes
- Follow the existing folder structure and naming conventions to maintain consistency.
- Document any new patterns or workflows in this file to help future contributors.
- **IMPORTANT**: The SaaS is in production with paying customers. Always test in staging first.
- Always reply in Brazilian Portuguese when interacting with the developer.
- When creating new interfaces, FOLLOW the existing interface design for consistency.

---

# Advanced Project Context for Claude Opus 4.5

Use this section as high-level context about the business, architecture goals, and roadmap. You are an AI coding assistant (Claude Opus 4.5 inside GitHub Copilot) helping refactor and evolve this SaaS.

## 1. Who I Am and What This Project Is

- I am a young developer (18 years old), entrepreneur, building and selling a SaaS in production.
- The SaaS is called **PrintMasterERP**, used to manage a small printing/graphics business.
- The product is already in **production**, with **1 paying customer**, generating approximately **R$149/month**.
- Main stack:
  - **Frontend**: React + TypeScript + Vite, hosted on **Netlify**.
  - **Backend/DB**: **Supabase** (PostgreSQL + Row-Level Security).
  - Development workflow: **VS Code + GitHub**.
- The codebase currently has **15k+ lines of code**, evolving with AI assistance and now has proper multi-tenant architecture.

## 2. Current Situation and High-Level Goals

### ✅ COMPLETED:
- **Multi-tenant architecture** fully implemented in both staging and production
- **RLS policies** enforcing tenant isolation on all tables
- **Auto-create tenant trigger** for new user signups
- **Authentication system** with Supabase Auth
- **Quotes page** for generating customer budgets/PDFs

### 🔄 IN PROGRESS:
- Landing page + Demo mode
- Checkout/payment flow for new customers

### 📋 FUTURE:
- Multiple users per tenant
- Role-based permissions (admin, member, viewer)
- API integrations (WhatsApp Business, payment gateways)

## 3. Environments

| Environment | Supabase Project | Netlify Site | Branch |
|-------------|------------------|--------------|--------|
| Production | wiwhuysfrbygnkrngkha | printmasterprp | main |
| Staging | evujlxfbdfzpqlnmlxif | staging-printmaster | staging |
| Demo | (same as staging) | demo-printmaster | demo |

## 4. How I Want You (Claude Opus 4.5) to Work With Me

When I ask questions or paste code:

- Always remember:
  - The SaaS is **already in production** with a real customer, so we **must not break existing behavior**.
  - Multi-tenant is **already implemented** - use `tenant_id` and RLS correctly.
  - We want a clean flow for **Prod/Test/Demo** environments.
- Your responsibilities:
  - Propose and review **folder and architectural structures** for frontend and backend.
  - Plan and review **database migrations** for multi-tenant with safety and rollback in mind.
  - Help write **Bash scripts** for environment/branch management.
  - Help implement and review the **login + multi-tenant** system end-to-end.
- Response style:
  - Be **direct** and give **practical code examples**.
  - Explain the **reasoning behind architecture decisions**.
  - Think with **long-term maintainability** and future scaling to **dozens of customers (50–100)**.
- Always reply to me in Brazilian Portuguese.
- When creating new interfaces, buttons, screens, etc., FOLLOW the existing interface design; otherwise, PrintMasterERP will have inconsistent designs.
