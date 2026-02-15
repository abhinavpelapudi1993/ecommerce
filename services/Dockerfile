FROM node:20-alpine AS base
WORKDIR /app

# Copy root workspace files
COPY package.json package-lock.json tsconfig.base.json ./
COPY turbo.json ./

# Copy all package.json files for workspace resolution
COPY packages/data-client/package.json packages/data-client/
COPY packages/state-service/package.json packages/state-service/
COPY packages/logging/package.json packages/logging/
COPY packages/ui-components/package.json packages/ui-components/
COPY services/backend/package.json services/backend/
COPY services/customer-api/package.json services/customer-api/
COPY services/product-api/package.json services/product-api/
COPY services/shipment-api/package.json services/shipment-api/
COPY apps/customer-portal/package.json apps/customer-portal/
COPY apps/support-dashboard/package.json apps/support-dashboard/

RUN npm ci --ignore-scripts --legacy-peer-deps

# Copy all source code
COPY packages/ packages/
COPY services/ services/
COPY apps/ apps/

# ── Build stage ──────────────────────────────────────────────────
FROM base AS builder
ARG SERVICE
RUN cd packages/logging && npx tsc
RUN cd services/${SERVICE} && npx nest build

# ── Production stage ─────────────────────────────────────────────
FROM node:20-alpine AS runner
WORKDIR /app

ARG SERVICE
ENV NODE_ENV=production
ENV SERVICE_NAME=${SERVICE}
RUN mkdir -p /var/log/app

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages ./packages
COPY --from=builder /app/services/${SERVICE}/dist ./dist
COPY --from=builder /app/services/${SERVICE}/package.json ./

CMD ["node", "dist/main"]
