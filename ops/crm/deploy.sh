#!/bin/sh
set -eu
cd "$(dirname "$0")"

if [ -n "${CONTAINER_ENGINE:-}" ]; then
  engine=$CONTAINER_ENGINE
elif command -v podman >/dev/null 2>&1; then
  engine=podman
else
  engine=docker
fi

compose() {
  "$engine" compose --env-file .env -f compose.yaml "$@"
}

service=intake
old_id=$(compose images -q "$service" 2>/dev/null | head -n 1 || true)
if [ -n "$old_id" ]; then "$engine" image tag "$old_id" ohgeec-intake:rollback; fi
compose pull "$service"
compose up -d --no-deps "$service"

healthy=0
i=0
while [ "$i" -lt 18 ]; do
  container_id=$(compose ps -q "$service")
  state=$("$engine" inspect --format '{{if .State.Health}}{{.State.Health.Status}}{{else}}{{.State.Status}}{{end}}' "$container_id" 2>/dev/null || true)
  if [ "$state" = healthy ]; then healthy=1; break; fi
  sleep 5
  i=$((i + 1))
done
if [ "$healthy" -eq 1 ]; then
  echo "Intake service is healthy."
  exit 0
fi

echo "New intake image did not become healthy; restoring the previous local image." >&2
if [ -n "$old_id" ]; then
  INTAKE_IMAGE=ohgeec-intake:rollback compose up -d --no-deps --pull never "$service"
  exit 1
fi
exit 1
