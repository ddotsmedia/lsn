#!/usr/bin/env bash
#
# Little Smarties — PostgreSQL backup.
# Writes a gzipped pg_dump to $BACKUP_PATH and prunes dumps older than $RETENTION_DAYS.
#
# Usage:  bash infra/scripts/backup.sh
# Cron :  0 3 * * * cd /opt/websites/littlesmarties && bash infra/scripts/backup.sh >> /var/log/lsn-backup.log 2>&1
#
set -Eeuo pipefail

DEPLOY_PATH="${DEPLOY_PATH:-/opt/websites/littlesmarties}"
BACKUP_PATH="${BACKUP_PATH:-/backups/littlesmarties}"
RETENTION_DAYS="${RETENTION_DAYS:-14}"
COMPOSE_FILE="docker-compose.prod.yml"

log()  { printf '\033[0;36m[backup]\033[0m %s\n' "$*"; }
fail() { printf '\033[0;31m[backup] ERROR:\033[0m %s\n' "$*" >&2; exit 1; }

cd "$DEPLOY_PATH" || fail "deploy path not found: $DEPLOY_PATH"
[ -f "$COMPOSE_FILE" ] || fail "not a Little Smarties checkout — refusing to run"

# Load DB credentials if present (deploy.sh writes .env from /etc/littlesmarties/.env.prod)
if [ -f .env ]; then
  set -a; . ./.env; set +a
fi
DB_USER="${DB_USER:-lsn}"
DB_NAME="${DB_NAME:-littlesmarties}"

mkdir -p "$BACKUP_PATH"

STAMP="$(date +%Y%m%d-%H%M%S)"
OUT="$BACKUP_PATH/${DB_NAME}-${STAMP}.sql.gz"

if ! docker compose -f "$COMPOSE_FILE" ps --status running postgres | grep -q postgres; then
  log "postgres container not running — skipping backup"
  exit 0
fi

log "dumping $DB_NAME -> $OUT"
docker compose -f "$COMPOSE_FILE" exec -T postgres \
  pg_dump -U "$DB_USER" -d "$DB_NAME" --no-owner --no-acl | gzip -9 > "$OUT"

# A dump under 1 KB means pg_dump produced nothing useful.
SIZE=$(wc -c < "$OUT")
[ "$SIZE" -gt 1024 ] || { rm -f "$OUT"; fail "dump too small (${SIZE}B) — treating as failure"; }

log "wrote $(du -h "$OUT" | cut -f1)"

log "pruning dumps older than ${RETENTION_DAYS} days"
find "$BACKUP_PATH" -name "${DB_NAME}-*.sql.gz" -type f -mtime "+${RETENTION_DAYS}" -delete

log "backup complete"
