#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$ROOT_DIR"

echo "============================================"
echo " E-Commerce Backend — Starting All Services"
echo "============================================"
echo ""

# Step 1: Build all packages
echo "[1/5] Building all packages..."
npx turbo run build
echo ""

# Step 2: Start Docker services (excluding frontend containers — use Vite for dev)
echo "[2/5] Starting Docker services..."
docker compose up --build -d \
  postgres redis kafka \
  elasticsearch logstash kibana kibana-setup \
  customer-api product-api shipment-api backend \
  filebeat-customer-api filebeat-product-api filebeat-shipment-api filebeat-backend
echo ""

# Step 3: Wait for critical services to be healthy
echo "[3/5] Waiting for services to be healthy..."
SERVICES=("postgres" "redis" "kafka" "elasticsearch")

for svc in "${SERVICES[@]}"; do
  printf "  %-20s" "$svc"
  RETRIES=0
  while [ $RETRIES -lt 60 ]; do
    CONTAINER_ID=$(docker compose ps -q "$svc" 2>/dev/null || echo "")
    if [ -n "$CONTAINER_ID" ]; then
      STATUS=$(docker inspect --format='{{.State.Health.Status}}' "$CONTAINER_ID" 2>/dev/null || echo "starting")
      if [ "$STATUS" = "healthy" ]; then
        echo "ready"
        break
      fi
    fi
    RETRIES=$((RETRIES + 1))
    sleep 2
  done
  if [ "$STATUS" != "healthy" ]; then
    echo "WARNING: did not become healthy within 120s"
  fi
done

# Wait for backend (depends on other services, may take longer)
printf "  %-20s" "backend"
RETRIES=0
STATUS="starting"
while [ $RETRIES -lt 90 ]; do
  CONTAINER_ID=$(docker compose ps -q backend 2>/dev/null || echo "")
  if [ -n "$CONTAINER_ID" ]; then
    # Backend doesn't have a healthcheck, check if it's responding
    if curl -s -o /dev/null -w "" "http://localhost:3000/products" 2>/dev/null; then
      STATUS="healthy"
      echo "ready"
      break
    fi
  fi
  RETRIES=$((RETRIES + 1))
  sleep 2
done
if [ "$STATUS" != "healthy" ]; then
  echo "WARNING: did not become healthy within 180s"
fi
echo ""

# Step 4: Create Kafka topics
echo "[4/5] Creating Kafka topics..."
bash "$SCRIPT_DIR/setup-kafka-topics.sh"
echo ""

# Step 5: Wait for Kibana data view setup
echo "[5/5] Setting up Kibana data view..."
RETRIES=0
while [ $RETRIES -lt 30 ]; do
  CONTAINER_ID=$(docker compose ps -q kibana-setup 2>/dev/null || echo "")
  if [ -z "$CONTAINER_ID" ]; then
    echo "  Kibana setup complete."
    break
  fi
  RUNNING=$(docker inspect --format='{{.State.Running}}' "$CONTAINER_ID" 2>/dev/null || echo "false")
  if [ "$RUNNING" = "false" ]; then
    echo "  Kibana data view configured."
    break
  fi
  RETRIES=$((RETRIES + 1))
  sleep 3
done

echo ""
echo "============================================"
echo " All services are running!"
echo "============================================"
echo ""
echo " Service URLs:"
echo "   Backend API:       http://localhost:3000"
echo "   Customer API:      http://localhost:3001"
echo "   Product API:       http://localhost:3002"
echo "   Shipment API:      http://localhost:3003"
echo "   Kibana (logs):     http://localhost:5601"
echo "   Elasticsearch:     http://localhost:9200"
echo ""
echo " Infrastructure:"
echo "   PostgreSQL:        localhost:5432"
echo "   Redis:             localhost:6379"
echo "   Kafka:             localhost:9092"
echo ""
echo " Seed data loaded (customers, products, credits, promo codes)"
echo " Kafka topics: settlement-retry, refund-retry"
echo ""
echo " Next: Run 'npm run start:frontend' to start the UI"
echo "============================================"
