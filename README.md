# E-Commerce Platform

Full-stack e-commerce platform with credit management, purchase flow, promo codes, and refunds. Built with NestJS microservices, React frontends, and shared packages — managed with npm workspaces and Turborepo.

## Prerequisites

Install these on your machine before starting:

| Tool                  | Minimum Version | How to check       | Install                                    |
| --------------------- | --------------- | ------------------- | ------------------------------------------ |
| **Node.js**           | v20+            | `node -v`           | https://nodejs.org or `nvm install 20`     |
| **npm**               | v10+            | `npm -v`            | Ships with Node.js                         |
| **Docker**            | v24+            | `docker -v`         | https://docs.docker.com/get-docker/        |
| **Docker Compose**    | v2+             | `docker compose version` | Included with Docker Desktop          |
| **Git**               | any             | `git --version`     | https://git-scm.com/downloads              |

Docker is required for PostgreSQL, Redis, Kafka, Elasticsearch, and all backend NestJS services.

---

## Quick Start

### 1. Clone and install dependencies

```bash
git clone <repository-url>
cd ecommerce
npm install
```

This installs dependencies for **all** workspaces (apps, packages, services) via npm workspaces.

### 2. Start everything (one command)

```bash
npm run start:all
```

This builds all packages, starts all Docker containers (infrastructure + backend + frontend), waits for health checks, creates Kafka topics, and configures Kibana. When done, the apps are available at:

- **Customer Portal** — http://localhost:5173
- **Support Dashboard** — http://localhost:5174

### Alternative: Backend + Frontend separately (for development)

This approach gives you hot reload on frontend changes.

**Terminal 1 — Backend:**
```bash
npm run start:backend
```

This script will automatically:
- Build all packages with Turborepo
- Start Docker containers (Postgres, Redis, Kafka, Elasticsearch, Kibana, all NestJS services)
- Wait for all services to become healthy
- Create Kafka topics (`settlement-retry`, `refund-retry`)
- Configure Kibana data views
- Load seed data (customers, products, credits, promo codes)

Wait for the script to finish — it prints all service URLs when ready.

**Terminal 2 — Frontend (Vite dev servers with hot reload):**

```bash
npm run start:frontend
```

This starts Vite dev servers for:
- **Customer Portal** at http://localhost:5173
- **Support Dashboard** at http://localhost:5174

### 4. Stop everything

```bash
docker compose down
```

Add `-v` to also remove data volumes (database, Elasticsearch indices):

```bash
docker compose down -v
```

---

## Project Structure

```
ecommerce/
├── apps/
│   ├── customer-portal/       # React (Vite) — customer-facing storefront
│   └── support-dashboard/     # React (Vite) — internal support tool
├── packages/
│   ├── data-client/           # Shared typed API client (fetch wrappers)
│   ├── state-service/         # Zustand state management stores
│   ├── ui-components/         # Shared React component library (Click UI)
│   ├── logging/               # Shared logging utilities
│   └── storybooks/            # Storybook for ui-components
├── services/
│   ├── backend/               # NestJS — central orchestration service (see below)
│   ├── customer-api/          # NestJS — customer CRUD microservice
│   ├── product-api/           # NestJS — product catalog microservice
│   └── shipment-api/          # NestJS — shipment tracking microservice
├── e2e/                       # Playwright end-to-end tests
├── scripts/                   # Shell scripts for starting services
├── docker-compose.yml
├── turbo.json
├── eslint.config.mjs          # Shared ESLint config (all workspaces)
└── tsconfig.base.json
```

### Why is it called `backend` and not `purchase-api`?

The `backend` service is the **central orchestration layer** — it coordinates across multiple domains and calls the other microservices. Unlike `customer-api`, `product-api`, and `shipment-api` (which are single-domain CRUD services), `backend` handles:

- **Purchases** — create, cancel, settle (calls product-api for stock, customer-api for validation, shipment-api for delivery)
- **Credits** — grant, deduct, balance computation with PostgreSQL advisory locks
- **Promo codes** — create, validate, apply discounts
- **Refunds** — request, approve, reject with amount cap enforcement
- **Company ledger** — tracks revenue from settled purchases and refund payouts
- **Kafka consumers** — processes `settlement-retry` and `refund-retry` events asynchronously

The `-api` services are standalone and stateless. The `backend` service owns the business logic that spans across them.

---

## Service URLs

| Service            | URL / Port               |
| ------------------ | ------------------------ |
| Backend API        | http://localhost:3000     |
| Customer API       | http://localhost:3001     |
| Product API        | http://localhost:3002     |
| Shipment API       | http://localhost:3003     |
| Customer Portal    | http://localhost:5173     |
| Support Dashboard  | http://localhost:5174     |
| Kibana (logs)      | http://localhost:5601     |
| Elasticsearch      | http://localhost:9200     |
| PostgreSQL         | localhost:5432            |
| Redis              | localhost:6379            |
| Kafka              | localhost:9092            |

---

## Backend API Endpoints

### Credits
- `GET /credits/:customerId/balance` — Balance + ledger history
- `POST /credits/:customerId/grant` — Grant credit `{ amount, reason }`
- `POST /credits/:customerId/deduct` — Deduct credit `{ amount, reason }`

### Purchases
- `POST /purchases` — Create purchase `{ customerId, productId, quantity, promoCode?, shippingAddress? }`
- `GET /purchases?customerId=...&page=1&limit=20` — List purchases (paginated)
- `GET /purchases/:id` — Single purchase detail
- `GET /purchases/:id/transactions` — Audit trail for a purchase
- `POST /purchases/:id/cancel` — Cancel a pending order `{ customerId }`
- `PATCH /shipments/:id` — Update shipment status `{ status }` (auto-settles on delivery)

### Refund Requests
- `POST /purchases/:id/refund-request` — Request refund/return `{ customerId, type, reason, requestedAmount? }`
- `GET /refund-requests?status=...&customerId=...` — List refund requests
- `POST /refund-requests/:id/approve` — Approve refund `{ amount, note? }`
- `POST /refund-requests/:id/reject` — Reject refund `{ note? }`

### Company
- `GET /company/balance` — Company revenue balance + ledger (escrow, sales, refunds)

### Promo Codes
- `POST /promos` — Create promo code
- `GET /promos` — List promo codes
- `POST /promos/validate` — Validate promo `{ code, purchaseAmount }`

### Auth (Support Dashboard)
- `GET /auth/support-users?email=...` — Find support user by email
- `GET /auth/support-users/:id` — Get support user by ID

---

## Development Commands

All commands run from the project root. Turborepo handles caching and dependency ordering.

| Command                  | Description                                       |
| ------------------------ | ------------------------------------------------- |
| `npm run build`          | Build all packages and services                   |
| `npm run dev`            | Start all dev servers                             |
| `npm run lint`           | Run ESLint across all workspaces                  |
| `npm run test`           | Run all unit and component tests                  |
| `npm run test:e2e`       | Run Playwright end-to-end tests                   |
| `npm run storybook`      | Start Storybook for ui-components                 |
| `npm run start:all`      | Start everything in Docker (backend + frontend)   |
| `npm run start:backend`  | Start Docker infrastructure + all NestJS services |
| `npm run start:frontend` | Start Vite dev servers (hot reload for frontend)  |

---

## Running Tests

### Unit tests (per workspace)

```bash
# All unit + component tests across all workspaces
npm run test

# Backend service
cd services/backend && npm test

# Microservices
cd services/customer-api && npm test
cd services/product-api && npm test
cd services/shipment-api && npm test

# Frontend apps
cd apps/customer-portal && npm test
cd apps/support-dashboard && npm test

# Shared UI components
cd packages/ui-components && npm test
```

### Backend integration tests

Integration tests use supertest against a real NestJS app module. They require infrastructure services (Postgres, Redis, Kafka) to be running:

```bash
npm run start:backend          # Start infrastructure first (Terminal 1)
cd services/backend
npm run test:e2e               # Run integration tests (Terminal 2)
```

Available integration test suites:
- `test/e2e/purchase-flow.e2e-spec.ts` — Purchase creation, settlement, listing
- `test/e2e/cancel-flow.e2e-spec.ts` — Cancel pending orders, credit refund
- `test/e2e/refund-flow.e2e-spec.ts` — Refund request, approve, reject, amount cap
- `test/e2e/promo-flow.e2e-spec.ts` — Promo code application, invalid/expired codes
- `test/e2e/escrow-flow.e2e-spec.ts` — Escrow entries on purchase, settlement, cancellation

### End-to-end tests (Playwright)

E2E tests require **both** backend and frontend to be running:

```bash
npm run start:backend          # Terminal 1
npm run start:frontend         # Terminal 2
npm run test:e2e               # Terminal 3
```

First-time setup — install Playwright browsers:

```bash
npx playwright install chromium
```

---

## Testing Stack

| Layer          | Tool                           | Location                               |
| -------------- | ------------------------------ | -------------------------------------- |
| Unit (backend) | Jest + ts-jest                 | `services/*/test/unit/`                |
| Integration    | Jest + supertest               | `services/backend/test/e2e/`           |
| Components     | Vitest + React Testing Library | `apps/*/src/**/__tests__/`             |
| UI library     | Vitest + React Testing Library | `packages/ui-components/src/__tests__/`|
| E2E            | Playwright (Chromium)          | `e2e/tests/`                           |

---

## Linting

ESLint is configured at the root with a shared flat config (`eslint.config.mjs`) covering all workspaces:

- TypeScript rules via `typescript-eslint`
- React Hooks + React Refresh rules for `.tsx` files
- Unused vars are warnings (variables prefixed with `_` are ignored)

```bash
npm run lint                         # Lint all workspaces
cd services/backend && npm run lint  # Lint a specific workspace
```

---

## Making Changes

### Adding a new API endpoint to an existing service

1. Navigate to the service (e.g., `services/backend/src/`)
2. Add or modify the controller, service, and entity files
3. Write unit tests in `test/unit/` following the existing mock patterns
4. Run `npm test` from the service directory to verify
5. Run `npm run lint` to check for linting issues

### Adding a new microservice

1. Copy an existing service directory (e.g., `services/customer-api/`) as a template
2. Update `package.json` with a unique name (e.g., `@ecommerce/my-new-api`)
3. Add the service to `docker-compose.yml` (container, port mapping, filebeat sidecar)
4. Add the service to `scripts/start-backend.sh` in the Docker Compose `up` command
5. Add a `jest.config.ts` following the existing pattern
6. Run `npm install` from the root to register the new workspace

### Adding a new shared package

1. Create a directory under `packages/` (e.g., `packages/my-utils/`)
2. Add a `package.json` with name `@ecommerce/my-utils`
3. Add a `tsconfig.json` extending `../../tsconfig.base.json`
4. Run `npm install` from the root to link the workspace
5. Reference from other packages by adding `"@ecommerce/my-utils": "1.0.0"` to their `package.json`

### Adding a new frontend page

1. Create the page component in `apps/<app>/src/pages/`
2. Add a route in the app's router configuration
3. Write a component test in `src/pages/__tests__/` using React Testing Library
4. Run `npm test` from the app directory to verify

### Adding a new shared UI component

1. Create the component in `packages/ui-components/src/`
2. Export it from `packages/ui-components/src/index.ts`
3. Write tests in `packages/ui-components/src/__tests__/`
4. Add a Storybook story in `packages/storybooks/`
5. Run `npm run storybook` to preview

### Writing tests — patterns to follow

- **Backend unit tests**: Mock TypeORM repositories using `getRepositoryToken()`. See `services/backend/test/unit/purchase.service.spec.ts` for the pattern.
- **Frontend component tests**: Use `render()` from `@testing-library/react`, query with `screen`, and interact with `userEvent`. See any `__tests__/` folder for examples.
- **Integration tests**: Use supertest with `@nestjs/testing` to create a real NestJS app module. See `services/backend/test/e2e/purchase-flow.e2e-spec.ts`.
- **E2E tests**: Use Playwright's `page` fixture. Tests run against real running services.

---

## Demo Accounts

### Customers (Customer Portal)

| Name          | Email               | ID                                     | Credit  |
| ------------- | ------------------- | -------------------------------------- | ------- |
| Alice Johnson | alice@example.com   | `c0a80001-0000-4000-8000-000000000001` | $5,000  |
| Bob Smith     | bob@example.com     | `c0a80001-0000-4000-8000-000000000002` | $2,500  |
| Carol Davis   | carol@example.com   | `c0a80001-0000-4000-8000-000000000003` | $1,000  |

Access code for all accounts: **123456**

### Support Users (Support Dashboard)

| Name          | Email              | Role    |
| ------------- | ------------------ | ------- |
| Sarah Support | sarah@company.com  | support |
| Mike Manager  | mike@company.com   | admin   |
| Lisa Lead     | lisa@company.com   | support |

Access code: **123456**

### Promo Codes

| Code       | Type       | Value | Min Purchase | Max Uses |
| ---------- | ---------- | ----- | ------------ | -------- |
| WELCOME10  | percentage | 10%   | $50          | 100      |
| SAVE20     | fixed      | $20   | $100         | 50       |
| HALF50     | percentage | 50%   | $200         | 10       |

---

## Tech Stack

- **Frontend**: React, TypeScript, Click UI, Zustand, Vite
- **Backend**: NestJS, TypeORM, PostgreSQL, Redis, Kafka
- **Observability**: Elasticsearch, Logstash, Kibana (ELK), Filebeat
- **Infra**: Docker Compose, Turborepo (npm workspaces)
- **Testing**: Jest, Vitest, React Testing Library, Playwright, Supertest
- **Linting**: ESLint (flat config), typescript-eslint

---

## Troubleshooting

### `npm install` fails
Make sure you're using Node.js >= 20 and npm >= 10. Run `node -v` and `npm -v` to verify.

### Docker containers won't start
- Check Docker is running: `docker info`
- Check port conflicts: `lsof -i :5432` (Postgres), `lsof -i :6379` (Redis), `lsof -i :3000` (Backend)
- Remove old volumes and retry: `docker compose down -v && npm run start:backend`

### Tests fail with "Cannot find module"
Run `npm run build` first — some test suites depend on built packages (configured via `turbo.json` task dependencies).

### Turbo doesn't detect all packages
Turbo relies on git for workspace detection. Make sure you're in a git repository:
```bash
git init && git add -A && git commit -m "init"
```

### Frontend tests fail with ThemeProvider errors
The test setup files (`src/test/setup.ts`) mock `@clickhouse/click-ui` components. If you use new click-ui components in your code, add them to the mock in the setup file.

