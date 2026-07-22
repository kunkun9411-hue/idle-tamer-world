#!/usr/bin/env bash
set -Eeuo pipefail

app_dir="${IDLE_TAMER_APP_DIR:-/srv/idle-tamer/app}"
env_file="${IDLE_TAMER_ENV_FILE:-/srv/idle-tamer/.env}"
backup_dir="${IDLE_TAMER_BACKUP_DIR:-/srv/idle-tamer/backups}"
restore_database="${POSTGRES_RESTORE_DATABASE:-idle_tamer_restore_check}"
compose_files=(
  -f "${app_dir}/infra/compose.yaml"
  -f "${app_dir}/infra/compose.server.yaml"
)

set -a
source "${env_file}"
set +a

if [[ "${restore_database}" == "${POSTGRES_DB}" || ! "${restore_database}" =~ _restore(_check)?$ ]]; then
  echo "Restore verification requires a dedicated *_restore or *_restore_check database." >&2
  exit 1
fi

postgres_container="$(docker compose --env-file "${env_file}" "${compose_files[@]}" ps -q postgres)"
latest_backup="$(find "${backup_dir}" -maxdepth 1 -type f -name 'idle-tamer-*.sql.gz' -printf '%T@ %p\n' | sort -n | tail -n 1 | cut -d' ' -f2-)"

if [[ -z "${postgres_container}" || -z "${latest_backup}" ]]; then
  echo "PostgreSQL container or backup file was not found." >&2
  exit 1
fi

cleanup() {
  docker exec "${postgres_container}" dropdb --username "${POSTGRES_USER}" --if-exists "${restore_database}" >/dev/null 2>&1 || true
}
trap cleanup EXIT

started_at="$(date +%s)"
cleanup
docker exec "${postgres_container}" createdb --username "${POSTGRES_USER}" "${restore_database}"
gzip -dc "${latest_backup}" \
  | docker exec -i "${postgres_container}" psql \
      --username "${POSTGRES_USER}" \
      --dbname "${restore_database}" \
      --set ON_ERROR_STOP=1 >/dev/null

restore_url="${DATABASE_URL%/*}/${restore_database}"
docker compose --env-file "${env_file}" "${compose_files[@]}" exec -T \
  -w /workspace/packages/database \
  -e RESTORE_DATABASE_URL="${restore_url}" \
  api pnpm db:verify-restore </dev/null

printf 'Backup %s restored and verified in %ss.\n' "$(basename "${latest_backup}")" "$(( $(date +%s) - started_at ))"
