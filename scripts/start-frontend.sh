#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$ROOT_DIR"

echo "============================================"
echo " E-Commerce Frontend — Dev Mode"
echo "============================================"
echo ""
echo " Starting Vite dev servers..."
echo "   Customer Portal:    http://localhost:5173"
echo "   Support Dashboard:  http://localhost:5174"
echo ""
echo " Make sure backend is running (npm run start:backend)"
echo "============================================"
echo ""

npx turbo run dev --filter=@ecommerce/customer-portal --filter=@ecommerce/support-dashboard
