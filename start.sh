#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"; [ -f .env ] || { echo 'Missing .env; copy .env.example.' >&2; exit 1; }
set -a
. ./.env
set +a
[ -d node_modules ] && [ -d client/node_modules ] || { echo 'Run ./scripts/bootstrap.sh first.' >&2; exit 1; }
for port in "${PORT:-${BACKEND_PORT:-3001}}" "${FRONTEND_PORT:-${CLIENT_PORT:-3000}}"; do
  ! lsof -ti ":$port" >/dev/null 2>&1 || { echo "Port $port is in use; refusing to terminate it." >&2; exit 1; }
done
if [[ "${MIGRATE_ON_START:-false}" == "true" ]]; then
  npm run db:setup
  npx ts-node server/database/provisionAdmin.ts
fi

if [[ "${NODE_ENV:-}" == "test" ]]; then
  exec npm start
fi

npm start & backend_pid=$!
BROWSER=none PORT="${FRONTEND_PORT:-${CLIENT_PORT:-3000}}" npm --prefix client start & frontend_pid=$!
cleanup(){ kill "$backend_pid" "$frontend_pid" 2>/dev/null || true; }; trap cleanup EXIT INT TERM; wait "$backend_pid" "$frontend_pid"
