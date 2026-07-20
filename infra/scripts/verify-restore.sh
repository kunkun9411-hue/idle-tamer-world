#!/usr/bin/env bash
set -euo pipefail

container_id="$(docker ps --filter 'ancestor=postgres:18-alpine' --format '{{.ID}}' | head -n 1)"
if [[ -z "${container_id}" ]]; then
  echo "PostgreSQL 18 service container was not found." >&2
  exit 1
fi

source_database="${POSTGRES_SOURCE_DATABASE:-idle_tamer_test}"
restore_database="${POSTGRES_RESTORE_DATABASE:-idle_tamer_restore}"
database_user="${POSTGRES_USER:-idle_tamer}"
dump_path="/tmp/idle-tamer-restore-check.dump"

cleanup() {
  docker exec "${container_id}" dropdb --username "${database_user}" --if-exists "${restore_database}" >/dev/null 2>&1 || true
  docker exec "${container_id}" rm -f "${dump_path}" >/dev/null 2>&1 || true
}
trap cleanup EXIT

cleanup
docker exec "${container_id}" pg_dump --username "${database_user}" --format custom --file "${dump_path}" "${source_database}"
docker exec "${container_id}" createdb --username "${database_user}" "${restore_database}"
docker exec "${container_id}" pg_restore --username "${database_user}" --exit-on-error --dbname "${restore_database}" "${dump_path}"

export RESTORE_DATABASE_URL="postgres://${database_user}:idle_tamer_ci@127.0.0.1:5432/${restore_database}"
pnpm --filter @idle-tamer/database db:verify-restore

echo "PostgreSQL backup restored into a clean database and verified."
