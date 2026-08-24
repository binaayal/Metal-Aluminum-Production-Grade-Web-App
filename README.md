# Metal & Aluminum Works — Business Dashboard

A production-grade, full-stack business dashboard for a single-facility metal & aluminum fabrication shop. Manages **Production Jobs**, **Inventory** (raw materials & finished goods), and **Customer Orders** through a role-based interface with historical trend reporting.

---

## Table of Contents

- [Overview](#overview)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Project Structure](#project-structure)
- [Prerequisites](#prerequisites)
- [Getting Started](#getting-started)
- [Available Scripts](#available-scripts)
- [Environment Variables](#environment-variables)
- [Database](#database)
- [Module Boundaries](#module-boundaries)
- [Roles & Permissions](#roles--permissions)
- [API Overview](#api-overview)
- [Design Documents](#design-documents)
- [License](#license)

---

## Overview

This application is a **CRUD dashboard with RBAC** — not a real-time system. It serves 20–100 users split into two roles:

| Role       | Access                                                             |
| ---------- | ------------------------------------------------------------------ |
| **Owner**  | Full read/write across all modules (Production, Inventory, Orders) |
| **Viewer** | Read-only access to all dashboard views                            |

Key design decisions:

- **Manual data entry only** — no IoT/sensor/ERP ingestion.
- **No live push** — viewers see updates on manual page refresh (standard HTTP request/response).
- **Modular monolith** — three bounded contexts (Production, Inventory, Orders) deployed as one application with enforced module boundaries.
- **Append-only inventory** — stock levels are derived from the sum of `StockMovement` records, never directly edited.

---

## Tech Stack

| Layer              | Technology                                                              |
| ------------------ | ----------------------------------------------------------------------- |
| **Language**        | TypeScript (end-to-end)                                                |
| **Backend**         | [Fastify](https://fastify.dev/) v5                                     |
| **ORM**             | [Prisma](https://www.prisma.io/) v6 with PostgreSQL multi-schema       |
| **Database**        | PostgreSQL 16                                                          |
| **Session Storage** | Postgres-backed sessions (`connect-pg-simple`)                         |
| **Frontend**        | [React](https://react.dev/) 18 + [Vite](https://vitejs.dev/) 5        |
| **Routing**         | React Router v6                                                        |
| **State/Data**      | TanStack React Query v5                                                |
| **Forms**           | React Hook Form + Zod validation                                       |
| **Charts**          | [Recharts](https://recharts.org/) v2                                   |
| **Icons**           | [Lucide React](https://lucide.dev/)                                    |
| **Deployment**      | Render (managed PaaS)                                                  |

---

## Architecture

The application follows a **layered modular monolith** pattern. Each backend module mirrors the same internal structure:

```
modules/<module>/
  ├── routes.ts        ← HTTP layer (Fastify route handlers, schema validation)
  ├── service.ts       ← Business logic; the ONLY file other modules may import
  ├── repository.ts    ← Prisma queries, scoped to this module's tables
  ├── types.ts         ← Domain types/interfaces, exported for cross-module use
  └── index.ts         ← Barrel export (service functions + types only)
```

**Cross-module rule:** No module may directly import another module's `repository.ts` or Prisma models. All inter-module communication goes through the public `service.ts` interface re-exported via `index.ts`.

### Request Flow Example

```
POST /api/production/jobs/:id/runs (Owner logs a production run)

  routes.ts (production)
    → validates request body (Fastify schema)
    → calls ProductionService.logProductionRun(...)

  service.ts (production)
    → opens Prisma $transaction
    → INSERT production_run
    → INSERT production_run_materials (bulk)
    → for each material: InventoryService.recordMovement(...)
    → if quantityProduced > 0: InventoryService.recordMovement(..., 'receipt')
    → UPDATE jobs (status/updated_at)
    → commit or rollback
```

---

## Project Structure

```
.
├── backend/                        # Fastify API server
│   ├── prisma/
│   │   ├── schema.prisma           # Database schema (4 Postgres schemas)
│   │   └── seed.ts                 # Initial Owner account seeder
│   ├── src/
│   │   ├── app.ts                  # Fastify app setup (plugins, routes)
│   │   ├── server.ts               # Server entry point
│   │   ├── lib/                    # Shared utilities
│   │   └── modules/
│   │       ├── auth/               # Authentication (login/logout/session)
│   │       ├── production/         # Jobs & production runs
│   │       ├── inventory/          # Items, stock movements, thresholds
│   │       ├── orders/             # Orders, line items, customers
│   │       ├── reporting/          # Trend aggregation (read-only)
│   │       └── users/              # User management (Owner-only)
│   ├── docker-compose.yml          # Local PostgreSQL container
│   ├── .env.example                # Environment variable template
│   └── package.json
│
├── src/                            # React frontend (Vite)
│   ├── main.tsx                    # App entry point
│   ├── index.css                   # Global styles
│   ├── api/                        # API client functions
│   ├── components/                 # Shared UI components
│   ├── context/                    # React context providers
│   ├── features/                   # Feature modules
│   │   ├── admin/                  # User management UI
│   │   ├── auth/                   # Login/session UI
│   │   ├── dashboard/              # Home summary dashboard
│   │   ├── inventory/              # Inventory management UI
│   │   ├── orders/                 # Orders management UI
│   │   ├── production/             # Production management UI
│   │   └── reports/                # Trend charts & reporting UI
│   ├── layouts/                    # Page layout wrappers
│   ├── routes/                     # Route definitions
│   ├── schemas/                    # Zod validation schemas
│   └── types/                      # Shared TypeScript types
│
├── architecture-design-v1.0.md     # Architecture & tech stack decisions
├── requirements-spec-v1.0.md       # Full requirements specification
├── module-interfaces.md            # Cross-module interface contracts
├── dashboard_erd.html              # Entity-Relationship Diagram
├── vite.config.ts                  # Vite configuration (proxy → :4000)
├── tsconfig.json                   # Frontend TypeScript config
└── package.json                    # Frontend dependencies & scripts
```

---

## Prerequisites

- **Node.js** ≥ 18
- **npm** ≥ 9
- **Docker** & **Docker Compose** (for local PostgreSQL)

---

## Getting Started

### 1. Clone the repository

```bash
git clone <repository-url>
cd Metal-Aluminum-Production-Grade-Web-App
```

### 2. Start the database

```bash
cd backend
docker compose up -d
```

This starts a PostgreSQL 16 instance on `localhost:5432`.

### 3. Set up the backend

```bash
# Still in backend/
cp .env.example .env            # Edit .env if needed
npm install
npx prisma migrate dev          # Apply migrations & generate client
npm run db:seed                 # Create the initial Owner account
npm run dev                     # Start backend on http://localhost:4000
```

### 4. Set up the frontend

```bash
# From the project root
npm install
npm run dev                     # Start frontend on http://localhost:3000
```

The Vite dev server proxies all `/api` requests to `http://localhost:4000`.

### 5. Log in

Use the seed credentials from your `.env` file (defaults below):

| Field    | Default Value         |
| -------- | --------------------- |
| Email    | `owner@metalworks.com` |
| Password | `owner123456`          |

---

## Available Scripts

### Frontend (project root)

| Script          | Description                          |
| --------------- | ------------------------------------ |
| `npm run dev`   | Start Vite dev server on port 3000   |
| `npm run build` | Type-check & build for production    |
| `npm run preview` | Preview production build locally   |

### Backend (`backend/`)

| Script              | Description                              |
| ------------------- | ---------------------------------------- |
| `npm run dev`       | Start Fastify with hot-reload (tsx watch) |
| `npm run build`     | Compile TypeScript to `dist/`            |
| `npm start`         | Run compiled production server           |
| `npm run db:migrate`| Run Prisma migrations                    |
| `npm run db:push`   | Push schema changes (no migration file)  |
| `npm run db:seed`   | Seed the initial Owner account           |
| `npm run db:studio` | Open Prisma Studio (GUI database browser) |

---

## Environment Variables

All backend environment variables are defined in `backend/.env`. See `backend/.env.example` for the template:

| Variable               | Description                                  | Default                                                    |
| ---------------------- | -------------------------------------------- | ---------------------------------------------------------- |
| `DATABASE_URL`         | PostgreSQL connection string                 | `postgresql://postgres:postgres@localhost:5432/metal_aluminum_db?schema=public` |
| `SESSION_SECRET`       | Secret for signing session cookies           | *(must be changed in production)*                          |
| `SEED_OWNER_EMAIL`     | Email for the initial Owner account          | `owner@metalworks.com`                                     |
| `SEED_OWNER_PASSWORD`  | Password for the initial Owner account       | `owner123456`                                              |
| `PORT`                 | Backend server port                          | `4000`                                                     |
| `NODE_ENV`             | Environment mode                             | `development`                                              |

> **⚠️ Security:** Never commit `.env` files. Change `SESSION_SECRET` and seed credentials before deploying.

---

## Database

The application uses **PostgreSQL with four schemas** to enforce module boundaries at the database level:

| Schema       | Contents                                            |
| ------------ | --------------------------------------------------- |
| `public`     | `users`, `session` tables, `Role` enum              |
| `production` | `jobs`, `production_runs`, `production_run_materials`, `JobStatus` enum |
| `inventory`  | `inventory_items`, `stock_movements`, `ItemType`/`MovementType` enums |
| `orders`     | `customers`, `orders`, `order_line_items`, `OrderStatus` enum |

Key design choices:

- **Optimistic concurrency control** via `version` columns on `jobs` and `orders`.
- **Append-only inventory** — `stock_movements` is an immutable audit trail; current stock = `SUM(movements)`.
- **Soft-referenced cross-module FKs** — e.g., `jobs.order_id → orders.id` for display, not for automatic status propagation.

---

## Module Boundaries

The three core modules interact through **explicit service interfaces only**:

```
┌──────────────┐      recordMovement()      ┌──────────────┐
│  Production  │ ─────────────────────────→  │  Inventory   │
│              │      getCurrentStock()      │              │
│              │ ←───────────────────────── │              │
└──────────────┘                             └──────────────┘
       │                                            ↑
       │ getOrdersForJob()                          │ getCurrentStock()
       ↓                                            │
┌──────────────┐                             ┌──────────────┐
│    Orders    │                              │  Reporting   │
│              │ ←──── reads from all ─────  │  (read-only) │
└──────────────┘                             └──────────────┘
```

Full interface contracts are documented in [`module-interfaces.md`](module-interfaces.md).

---

## Roles & Permissions

| Role       | Create/Edit | View | Manage Users |
| ---------- | :---------: | :--: | :----------: |
| **Owner**  | ✅          | ✅   | ✅           |
| **Viewer** | ❌          | ✅   | ❌           |

- Authorization is enforced **server-side** — write endpoints reject Viewer sessions.
- The first Owner account is created via the seed script, not a public registration form.
- Owners manage all user accounts (create, deactivate) through the admin UI.

---

## API Overview

All API routes are prefixed with `/api`. The backend runs on port `4000` by default; the Vite dev server proxies `/api` requests automatically.

| Method | Endpoint                              | Module     | Auth   |
| ------ | ------------------------------------- | ---------- | ------ |
| POST   | `/api/auth/login`                     | Auth       | Public |
| POST   | `/api/auth/logout`                    | Auth       | Any    |
| GET    | `/api/auth/me`                        | Auth       | Any    |
| GET    | `/api/production/jobs`                | Production | Any    |
| POST   | `/api/production/jobs`                | Production | Owner  |
| PATCH  | `/api/production/jobs/:id`            | Production | Owner  |
| POST   | `/api/production/jobs/:id/runs`       | Production | Owner  |
| GET    | `/api/inventory/items`                | Inventory  | Any    |
| POST   | `/api/inventory/items`                | Inventory  | Owner  |
| POST   | `/api/inventory/movements`            | Inventory  | Owner  |
| GET    | `/api/orders`                         | Orders     | Any    |
| POST   | `/api/orders`                         | Orders     | Owner  |
| PATCH  | `/api/orders/:id`                     | Orders     | Owner  |
| GET    | `/api/reporting/production-trends`    | Reporting  | Any    |
| GET    | `/api/reporting/inventory-trends`     | Reporting  | Any    |
| GET    | `/api/reporting/order-trends`         | Reporting  | Any    |
| GET    | `/api/users`                          | Users      | Owner  |
| POST   | `/api/users`                          | Users      | Owner  |

---

## Design Documents

Detailed specifications and architectural decisions are captured in the following documents:

| Document                                                  | Description                                          |
| --------------------------------------------------------- | ---------------------------------------------------- |
| [`requirements-spec-v1.0.md`](requirements-spec-v1.0.md)  | Full requirements specification (functional & non-functional) |
| [`architecture-design-v1.0.md`](architecture-design-v1.0.md) | Tech stack decisions and layered architecture design |
| [`module-interfaces.md`](module-interfaces.md)            | Cross-module interface contracts                      |
| [`dashboard_erd.html`](dashboard_erd.html)                | Entity-Relationship Diagram                          |
| [`full-stack-design-v1.0.md`](full-stack-design-v1.0.md)  | Full-stack design document                           |

---

## License

This project is private and proprietary.
