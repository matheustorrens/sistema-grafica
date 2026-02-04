# AI Coding Agent Instructions for This Codebase

## Overview
This project is a SaaS application for managing a printing business. It is built using React (with TypeScript) and Vite as the build tool. The application is structured into components, pages, services, and context providers. It integrates with Supabase for backend services and uses local storage for caching data.

## Architecture
- **Components**: Reusable UI components are located in the `components/` directory. Examples include modals (`ConfirmModal.tsx`, `CreateOrderModal.tsx`) and layout components (`Dashboard.tsx`, `Layout.tsx`).
- **Pages**: Each page of the application is defined in the `pages/` directory. These pages represent the main navigation routes of the app.
- **Services**: The `services/` directory contains modules for interacting with APIs and managing data. For example:
  - `api.ts`: Handles HTTP requests.
  - `supabaseClient.ts`: Configures and interacts with Supabase.
  - `localStorage/`: Manages local caching for materials, orders, and suppliers.
- **Context**: The `context/` directory contains React Context providers, such as `SettingsContext.tsx`, for managing global state.
- **Supabase Integration**: The `services/supabase/` directory includes modules for interacting with Supabase tables (e.g., `materials.ts`, `orders.ts`).

## Developer Workflows

### Building and Running the Project
- Use `npm install` to install dependencies.
- Start the development server with `npm run dev`.
- Build the project for production with `npm run build`.

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

## External Dependencies
- **Supabase**: Used for authentication, database, and storage.
- **Vite**: Build tool for fast development and optimized builds.
- **React**: Frontend library for building user interfaces.

## Examples

### Creating a New Modal Component
1. Create a new file in `components/` (e.g., `NewModal.tsx`).
2. Use the `CreateOrderModal.tsx` component as a reference for structure and styling.

### Adding a New Page
1. Create a new file in `pages/` (e.g., `NewPage.tsx`).
2. Define the route in `App.tsx`.
3. Use existing pages like `Orders.tsx` as a reference.

### Interacting with Supabase
1. Use the `supabaseClient.ts` service to initialize the client.
2. Add new database interaction logic in the `services/supabase/` directory.

## Notes
- Follow the existing folder structure and naming conventions to maintain consistency.
- Document any new patterns or workflows in this file to help future contributors.

---
If you have any questions or need clarification, feel free to ask!

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
- The codebase currently has **10k+ lines of code**, a lot of it generated/refined with AI, and now needs **organization, refactoring, and professionalization**.

## 2. Current Situation and High-Level Goals

I want to evolve PrintMasterERP into a cleaner, more scalable architecture with:

1. **Three logical environments**:
   - **Production**: used by real paying customers.
   - **Test/Staging**: used to validate new features and database migrations.
   - **Demo**: used by people who sign up from the landing page to try the system.

2. **Infrastructure**:
   - Keep **Supabase** as the primary backend/database.
   - Keep **Netlify** as the primary hosting platform.
   - Use **GitHub Copilot Pro with Claude Opus 4.5** to refactor and evolve the code directly inside VS Code.

3. **Main functional goals**:
   - Implement **multi-tenant** support in Supabase (single project with tenants, not one project per customer).
   - Implement a **login system** integrated with this multi-tenant structure (with secure `tenant_id` and RLS).
   - Refactor the codebase and folder structure to cleanly support **Production + Test + Demo**.
   - Automate environment/branch usage with **Bash scripts** to switch between branches/environments easily.

## 3. Execution Plan (High-Level)

Use this plan as a persistent mental model when generating code or architecture suggestions:

### 3.1. Preparation

- Duplicate the current PrintMasterERP repository into a new refactoring repo.
- Create a **Supabase test/staging project** with the same schema as production.
- Keep the existing Supabase project as **production** (it already contains real customer data).
- (Later) Add a 2-project structure in Netlify:
  - Project 1: main app in production.
  - Project 2: landing page + demo + checkout.

### 3.2. Code Refactor (VS Code + Copilot)

In the duplicated repository, I want help to:

- **Refactor the folder structure** to something like:
  - `src/auth`
  - `src/tenants`
  - `src/demo`
  - `src/prod`
  - `src/shared`
  - or another clear architecture you recommend that supports environments and multi-tenant.
- Clearly separate what belongs to **Production**, **Test/Staging**, and **Demo** within the same codebase.
- Make the code more maintainable:
  - Break down huge files into smaller, focused modules.
  - Improve typing, reuse, and organization.

I also want **Bash scripts** that:

- Let me **switch branches** easily (e.g. `main`, `test`, `demo`).
- Load the correct **environment variables** for each environment (Supabase URL/key for production vs test, Netlify site IDs, etc.).

### 3.3. Multi-Tenant in Supabase

This is critical and must be done carefully to avoid breaking production:

- We must first **rehearse multi-tenant changes in the Supabase test/staging project**.
- The general idea:
  - Add a `tenant_id` column to all relevant tables (orders, materials, customers, etc.).
  - Backfill existing data so that all rows get a valid `tenant_id` (initially corresponding to the current single customer).
  - Define and enable **Row-Level Security (RLS)** policies that restrict every query to the correct `tenant_id`.
- After the staging environment is validated:
  - Apply the same migration steps to the production Supabase project, with **backups** and minimal downtime.
- You should help:
  - Design the migration steps.
  - Write SQL migration scripts (or Supabase migration files).
  - Validate that RLS rules are correct and safe.

### 3.4. Login Integrated with Multi-Tenant

The login system must:

- Use **Supabase Auth** for user accounts.
- Store the `tenant_id` inside the user’s JWT (e.g. using `app_metadata` or `user_metadata`).
- Ensure all data access is filtered by `tenant_id` using RLS and queries.

I need your help to:

- Propose the **schema** for:
  - `tenants`
  - `users`
  - optional `user_tenants` mapping table (for multi-tenant-per-user scenarios).
- Write or refactor RLS policies to enforce tenant isolation.
- Integrate the frontend (login, session management, data fetching) with this multi-tenant model.

### 3.5. Landing, Demo, and Checkout (Future Phase)

In a second phase, I want to:

- Create a **public landing page** that explains the product.
- Implement a **Demo mode**:
  - User signs up on the landing page.
  - User is redirected to a Demo environment (demo tenant, limited data, or sandbox).
- Build a **checkout/payment** flow that:
  - Converts Demo users into real customers.
  - Creates a new tenant and associates the user as an admin of that tenant.

This will probably use a **separate Netlify project** for landing/demo/checkout, pointing to the main app via APIs.

## 4. How I Want You (Claude Opus 4.5) to Work With Me

When I ask questions or paste code:

- Always remember:
  - The SaaS is **already in production** with a real customer, so we **must not break existing behavior**.
  - We want **multi-tenant in a single Supabase project**, using **RLS** with `tenant_id` to isolate customer data.
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
- When creating new interfaces, buttons, screens, etc., FOLLOW the existing interface design; otherwise, PrintMatterERP will have inconsistent designs.
