#!/bin/bash
set -e

# Wait for postgres to be ready
until pg_isready -U "$POSTGRES_USER" -d "$POSTGRES_DB" -h localhost; do
  echo "Waiting for postgres to be ready..."
  sleep 2
done

echo "Postgres is ready. Running migrations..."

# Execute all SQL files in the migrations directory
if [ -d "/docker-entrypoint-initdb.d" ]; then
  for sql_file in /docker-entrypoint-initdb.d/*.sql; do
    if [ -f "$sql_file" ]; then
      echo "Executing migration: $(basename $sql_file)"
      psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -f "$sql_file" 2>&1 | sed 's/^/  /'
      echo "✓ Completed: $(basename $sql_file)"
    fi
  done
  echo "✓ All migrations completed successfully!"
else
  echo "No migrations directory found at /docker-entrypoint-initdb.d"
fi
