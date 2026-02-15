#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR/.."

KAFKA_CONTAINER="$(docker compose ps -q kafka)"
TOPICS=("settlement-retry" "refund-retry")

echo "Waiting for Kafka broker to be ready..."
MAX_RETRIES=30
for i in $(seq 1 $MAX_RETRIES); do
  if docker exec "$KAFKA_CONTAINER" /opt/kafka/bin/kafka-topics.sh \
       --bootstrap-server localhost:9092 --list >/dev/null 2>&1; then
    echo "Kafka is ready."
    break
  fi
  if [ "$i" -eq "$MAX_RETRIES" ]; then
    echo "ERROR: Kafka did not become ready in time."
    exit 1
  fi
  echo "  Kafka not ready (attempt $i/$MAX_RETRIES), retrying in 3s..."
  sleep 3
done

for TOPIC in "${TOPICS[@]}"; do
  echo "  Creating topic: $TOPIC"
  docker exec "$KAFKA_CONTAINER" /opt/kafka/bin/kafka-topics.sh \
    --bootstrap-server localhost:9092 \
    --create \
    --topic "$TOPIC" \
    --partitions 1 \
    --replication-factor 1 \
    --if-not-exists 2>/dev/null
done

echo "Kafka topics created successfully."
