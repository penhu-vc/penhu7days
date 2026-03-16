#!/usr/bin/env bash
set -euo pipefail

PORT="${1:-}"

if [[ -z "$PORT" ]]; then
  echo "[devhub] missing port; skip register" >&2
  exit 0
fi

DEVHUB_BASE_URL="${DEVHUB_BASE_URL:-http://127.0.0.1:4790}"
DEVHUB_PROJECT_ID="${DEVHUB_PROJECT_ID:-cmmj58mbu000fu6gh1dkk1ukr}"
DEVHUB_MACHINE_ID="${DEVHUB_MACHINE_ID:-cmmj4g6ee0004u6ghux1vww2x}"
DEVHUB_DEVICE_TOKEN="${DEVHUB_DEVICE_TOKEN:-xa0xaB4UXYi5OS4zSE21gsdhw-2Bu4iD}"
DEVHUB_SERVICE_NAME="${DEVHUB_SERVICE_NAME:-web}"

if [[ -z "$DEVHUB_PROJECT_ID" || -z "$DEVHUB_MACHINE_ID" || -z "$DEVHUB_DEVICE_TOKEN" ]]; then
  echo "[devhub] missing config; skip register" >&2
  exit 0
fi

payload=$(cat <<EOF
{"projectId":"$DEVHUB_PROJECT_ID","machineId":"$DEVHUB_MACHINE_ID","serviceName":"$DEVHUB_SERVICE_NAME","port":$PORT}
EOF
)

if ! curl -fsS \
  -X POST \
  -H "Authorization: Bearer $DEVHUB_DEVICE_TOKEN" \
  -H "Content-Type: application/json" \
  -d "$payload" \
  "$DEVHUB_BASE_URL/api/ports/register" >/dev/null; then
  echo "[devhub] failed to register port $PORT to $DEVHUB_BASE_URL" >&2
  exit 0
fi

echo "[devhub] registered $DEVHUB_SERVICE_NAME on port $PORT"
