#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
HOST="${HOST:-0.0.0.0}"
DEFAULT_PORT="${PORT:-${DEVHUB_DEFAULT_PORT:-3042}}"
STATE_DIR="$ROOT_DIR/.codex/dev-daemon"
PID_FILE="$STATE_DIR/dev.pid"
PORT_FILE="$STATE_DIR/dev.port"
LOG_FILE="$STATE_DIR/dev.log"

mkdir -p "$STATE_DIR"

load_port() {
  if [[ -n "${PORT:-}" ]]; then
    echo "$PORT"
  elif [[ -f "$PORT_FILE" ]]; then
    cat "$PORT_FILE"
  else
    echo "$DEFAULT_PORT"
  fi
}

store_port() {
  local port="$1"
  printf '%s\n' "$port" >"$PORT_FILE"
}

pid_from_file() {
  if [[ -f "$PID_FILE" ]]; then
    cat "$PID_FILE"
  fi
}

cleanup_stale_pid() {
  local pid
  pid="$(pid_from_file)"
  if [[ -n "${pid}" ]] && ! kill -0 "$pid" 2>/dev/null; then
    rm -f "$PID_FILE"
  fi
}

is_running() {
  cleanup_stale_pid
  local pid
  pid="$(pid_from_file)"
  [[ -n "${pid}" ]] && kill -0 "$pid" 2>/dev/null
}

detect_listen_port() {
  local pid="$1"
  lsof -Pan -p "$pid" -iTCP -sTCP:LISTEN 2>/dev/null | awk 'NR>1 {split($9, a, ":"); print a[length(a)]; exit}'
}

is_port_listening() {
  local port="$1"
  lsof -nP -iTCP:"$port" -sTCP:LISTEN >/dev/null 2>&1
}

kill_port_listeners() {
  local port="$1"
  local pids
  pids="$(lsof -tiTCP:"$port" -sTCP:LISTEN 2>/dev/null || true)"
  if [[ -n "$pids" ]]; then
    # shellcheck disable=SC2086
    kill $pids >/dev/null 2>&1 || true
  fi
}

kill_port_listeners_force() {
  local port="$1"
  local pids
  pids="$(lsof -tiTCP:"$port" -sTCP:LISTEN 2>/dev/null || true)"
  if [[ -n "$pids" ]]; then
    # shellcheck disable=SC2086
    kill -9 $pids >/dev/null 2>&1 || true
  fi
}

wait_until_ready() {
  local port="$1"
  local max_try=60
  local i

  for ((i=1; i<=max_try; i++)); do
    if curl -fsS "http://127.0.0.1:${port}/pro" >/dev/null 2>&1; then
      return 0
    fi
    sleep 1
  done
  return 1
}

register_devhub() {
  local port="$1"
  bash "$ROOT_DIR/scripts/devhub-register.sh" "$port" || true
}

warm_routes() {
  local port="$1"
  local routes=(
    "/"
    "/pro"
    "/admin-login"
    "/api/site-config?variant=pro"
  )
  local route

  for route in "${routes[@]}"; do
    if curl -fsS "http://127.0.0.1:${port}${route}" >/dev/null 2>&1; then
      echo "[warm] ok ${route}"
    else
      echo "[warm] fail ${route}" >&2
      return 1
    fi
  done
}

start() {
  local port pid actual_port
  port="$(load_port)"

  if is_running; then
    pid="$(pid_from_file)"
    actual_port="$(detect_listen_port "$pid" || true)"
    if [[ -n "$actual_port" ]]; then
      store_port "$actual_port"
      register_devhub "$actual_port"
      echo "dev server already running (pid $pid)"
      echo "url: http://127.0.0.1:${actual_port}"
      return 0
    fi
  fi

  if is_port_listening "$port"; then
    echo "port $port is already in use by another process" >&2
    lsof -nP -iTCP:"$port" -sTCP:LISTEN >&2 || true
    return 1
  fi

  echo "starting dev server on http://127.0.0.1:${port}"
  ROOT_DIR="$ROOT_DIR" HOST="$HOST" DEV_PORT="$port" LOG_FILE="$LOG_FILE" PID_FILE="$PID_FILE" python3 - <<'PY'
import os
import subprocess

root_dir = os.environ["ROOT_DIR"]
host = os.environ["HOST"]
port = os.environ["DEV_PORT"]
log_file = os.environ["LOG_FILE"]
pid_file = os.environ["PID_FILE"]

with open(log_file, "ab") as log:
    proc = subprocess.Popen(
        [os.path.join(root_dir, "node_modules", ".bin", "next"), "dev", "--hostname", host, "--port", port],
        cwd=root_dir,
        stdin=subprocess.DEVNULL,
        stdout=log,
        stderr=subprocess.STDOUT,
        start_new_session=True,
    )

with open(pid_file, "w", encoding="utf-8") as fh:
    fh.write(f"{proc.pid}\n")
PY

  pid="$(pid_from_file)"
  if [[ -z "$pid" ]] || ! kill -0 "$pid" 2>/dev/null; then
    echo "failed to start; see $LOG_FILE" >&2
    return 1
  fi

  if ! wait_until_ready "$port"; then
    echo "process started but server is not ready; see $LOG_FILE" >&2
    return 1
  fi

  actual_port="$(detect_listen_port "$pid" || true)"
  if [[ -z "$actual_port" ]]; then
    actual_port="$port"
  fi
  store_port "$actual_port"
  register_devhub "$actual_port"

  echo "started (pid $pid)"
  echo "url: http://127.0.0.1:${actual_port}"
  echo "log: $LOG_FILE"
}

stop() {
  local pid port
  cleanup_stale_pid
  pid="$(pid_from_file)"
  port="$(load_port)"

  if [[ -z "$pid" ]]; then
    if is_port_listening "$port"; then
      echo "stopping process on port $port"
      kill_port_listeners "$port"
      sleep 1
      if is_port_listening "$port"; then
        kill_port_listeners_force "$port"
      fi
    else
      echo "dev server is not running"
    fi
    rm -f "$PID_FILE" "$PORT_FILE"
    return 0
  fi

  echo "stopping dev server (pid $pid)"
  kill "$pid" 2>/dev/null || true
  sleep 1
  if kill -0 "$pid" 2>/dev/null; then
    kill -9 "$pid" 2>/dev/null || true
  fi

  if is_port_listening "$port"; then
    kill_port_listeners "$port"
  fi

  rm -f "$PID_FILE" "$PORT_FILE"
  echo "stopped"
}

status() {
  local pid port
  if ! is_running; then
    echo "not running"
    return 1
  fi

  pid="$(pid_from_file)"
  port="$(detect_listen_port "$pid" || true)"
  if [[ -z "$port" ]]; then
    port="$(load_port)"
  fi

  echo "running (pid $pid)"
  echo "url: http://127.0.0.1:${port}"
  echo "log: $LOG_FILE"
}

doctor() {
  local port pid
  port="$(load_port)"
  pid="$(pid_from_file)"

  echo "[doctor] expected port: $port"
  if is_running; then
    echo "[doctor] process alive: pid $pid"
  else
    echo "[doctor] process not running"
  fi

  if is_port_listening "$port"; then
    echo "[doctor] port listening: $port"
  else
    echo "[doctor] port not listening: $port"
  fi

  if curl -fsS "http://127.0.0.1:${port}/pro" >/dev/null 2>&1; then
    echo "[doctor] app healthy"
    register_devhub "$port"
    return 0
  fi

  echo "[doctor] app unhealthy; attempting restart"
  stop || true
  start
}

up() {
  start
  warm
}

warm() {
  local port
  port="$(load_port)"
  if ! is_port_listening "$port"; then
    echo "dev server is not listening on $port; start it first" >&2
    return 1
  fi
  warm_routes "$port"
}

logs() {
  touch "$LOG_FILE"
  tail -n 100 -f "$LOG_FILE"
}

case "${1:-}" in
start|up) "$1" ;;
stop|down) stop ;;
restart) stop || true; start ;;
status) status ;;
doctor) doctor ;;
warm) warm ;;
logs) logs ;;
*)
  cat <<EOF
Usage: scripts/dev-server.sh {start|up|stop|down|restart|status|doctor|warm|logs}
EOF
  exit 1
  ;;
esac
