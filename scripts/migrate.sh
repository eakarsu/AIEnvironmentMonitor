#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."; set -a; . ./.env; set +a; npm run db:setup; for migration in server/database/migrations/*.sql; do PGPASSWORD="${DB_PASSWORD:-}" psql -h "${DB_HOST:-localhost}" -p "${DB_PORT:-5432}" -U "${DB_USER:-postgres}" -d "${DB_NAME:-ai_environment_monitor}" -v ON_ERROR_STOP=1 -f "$migration"; done
