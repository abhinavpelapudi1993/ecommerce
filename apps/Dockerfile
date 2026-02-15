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
COPY apps/ apps/
COPY services/ services/

# ── Build stage ──────────────────────────────────────────────────
FROM base AS builder
ARG APP
ARG VITE_API_URL=/api
ENV VITE_API_URL=${VITE_API_URL}
RUN cd apps/${APP} && npm run build

# ── Serve with nginx ─────────────────────────────────────────────
FROM nginx:alpine AS runner
ARG APP
COPY --from=builder /app/apps/${APP}/dist /usr/share/nginx/html
COPY apps/nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
