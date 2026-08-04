#!/usr/bin/env bash
#
# Little Smarties — VPS deploy.
# Touches ONLY $DEPLOY_PATH. Never other projects on the box.
#
# Usage (on the VPS):  bash infra/scripts/deploy.sh
#
set -Eeuo pipefail

DEPLOY_PATH="${DEPLOY_PATH:-/opt/websites/littlesmarties}"
ENV_FILE="${ENV_FILE:-/etc/littlesmarties/.env.prod}"
COMPOSE_FILE="docker-compose.prod.yml"
BRANCH="${BRANCH:-main}"

log()  { printf '\033[0;36m[deploy]\033[0m %s\n' "$*"; }
fail() { printf '\033[0;31m[deploy] ERROR:\033[0m %s\n' "$*" >&2; exit 1; }

[ -d "$DEPLOY_PATH" ] || fail "deploy path not found: $DEPLOY_PATH"
cd "$DEPLOY_PATH"
[ -f "$COMPOSE_FILE" ] || fail "not a Little Smarties checkout (no $COMPOSE_FILE) — refusing to run"

# --- 1. back up the database before anything changes ------------------------
log "pre-deploy database backup"
bash infra/scripts/backup.sh || fail "backup failed — aborting deploy"

# --- 2. pull latest code ----------------------------------------------------
log "fetching origin/$BRANCH"
git fetch --prune origin "$BRANCH"
git checkout "$BRANCH"
git reset --hard "origin/$BRANCH"

# --- 3. env -----------------------------------------------------------------
[ -f "$ENV_FILE" ] || fail "env file not found: $ENV_FILE"
log "copying $ENV_FILE -> .env"
cp "$ENV_FILE" .env
chmod 600 .env

# --- 4. clear the Next.js build cache (required before every build) ---------
log "clearing frontend build cache"
rm -rf apps/frontend/.next

# --- 5. build ---------------------------------------------------------------
log "building images"
docker compose -f "$COMPOSE_FILE" build

# --- 6. start ---------------------------------------------------------------
log "starting services"
docker compose -f "$COMPOSE_FILE" up -d --remove-orphans

# --- 7. migrations (additive only) ------------------------------------------
log "waiting for postgres"
for i in $(seq 1 30); do
  if docker compose -f "$COMPOSE_FILE" exec -T postgres pg_isready -q; then break; fi
  [ "$i" -eq 30 ] && fail "postgres did not become ready"
  sleep 2
done

log "applying migrations"
for f in apps/backend/migrations/*.sql; do
  [ -e "$f" ] || { log "no migrations to apply"; break; }
  log "  -> $(basename "$f")"
  docker compose -f "$COMPOSE_FILE" exec -T postgres \
    psql -v ON_ERROR_STOP=1 -U "${DB_USER:-lsn}" -d "${DB_NAME:-littlesmarties}" < "$f"
done

# --- 8. health checks -------------------------------------------------------
log "health checks"
for i in $(seq 1 30); do
  if curl -fsS http://127.0.0.1:3001/health >/dev/null; then break; fi
  [ "$i" -eq 30 ] && fail "backend health check failed"
  sleep 2
done
log "  backend  ok"

for i in $(seq 1 30); do
  if curl -fsS http://127.0.0.1:3000 >/dev/null; then break; fi
  [ "$i" -eq 30 ] && fail "frontend health check failed"
  sleep 2
done
log "  frontend ok"

# --- 9. prune images built by this project only -----------------------------
log "pruning dangling images"
docker image prune -f --filter "label=com.docker.compose.project=littlesmarties" || true

log "deploy complete — $(git rev-parse --short HEAD)"
