#!/bin/sh
# Wait for Kibana to be ready, then create the data view automatically

KIBANA_URL="${KIBANA_URL:-http://kibana:5601}"
MAX_RETRIES=30
RETRY_INTERVAL=5

echo "Waiting for Kibana at $KIBANA_URL..."

for i in $(seq 1 $MAX_RETRIES); do
  STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$KIBANA_URL/api/status" 2>/dev/null)
  if [ "$STATUS" = "200" ]; then
    echo "Kibana is ready."
    break
  fi
  echo "Kibana not ready (attempt $i/$MAX_RETRIES), retrying in ${RETRY_INTERVAL}s..."
  sleep $RETRY_INTERVAL
done

if [ "$STATUS" != "200" ]; then
  echo "Kibana did not become ready in time. Exiting."
  exit 1
fi

# Check if data view already exists
EXISTING=$(curl -s "$KIBANA_URL/api/data_views" -H "kbn-xsrf: true" 2>/dev/null)
if echo "$EXISTING" | grep -q "ecommerce-logs-"; then
  echo "Data view 'ecommerce-logs-*' already exists. Skipping."
  exit 0
fi

# Create the data view
RESPONSE=$(curl -s -X POST "$KIBANA_URL/api/data_views/data_view" \
  -H "kbn-xsrf: true" \
  -H "Content-Type: application/json" \
  -d '{
    "data_view": {
      "title": "ecommerce-logs-*",
      "name": "Ecommerce Logs",
      "timeFieldName": "@timestamp"
    }
  }')

if echo "$RESPONSE" | grep -q '"data_view"'; then
  echo "Data view 'Ecommerce Logs' created successfully."
else
  echo "Failed to create data view: $RESPONSE"
  exit 1
fi
