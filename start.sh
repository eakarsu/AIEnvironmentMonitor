#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"; [ -f .env ] || { echo 'Missing .env; copy .env.example.' >&2; exit 1; }
[ -d node_modules ] && [ -d client/node_modules ] || { echo 'Run ./scripts/bootstrap.sh first.' >&2; exit 1; }

if [[ "${NODE_ENV:-}" == "test" ]]; then
  exec npm start
fi

npm start & backend_pid=$!
BROWSER=none PORT="${FRONTEND_PORT:-${CLIENT_PORT:-3000}}" npm --prefix client start & frontend_pid=$!
cleanup(){ kill "$backend_pid" "$frontend_pid" 2>/dev/null || true; }; trap cleanup EXIT INT TERM; wait "$backend_pid" "$frontend_pid"
