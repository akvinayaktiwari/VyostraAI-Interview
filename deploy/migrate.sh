#!/bin/sh
# Applies migrations/*.sql in filename order, each exactly once.
# Applied files are recorded in schema_migrations, so new migrations
# don't need to be idempotent. Runs inside the postgres image (psql available).
set -eu

psql -v ON_ERROR_STOP=1 -q <<'SQL'
CREATE TABLE IF NOT EXISTS schema_migrations (
    filename TEXT PRIMARY KEY,
    applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
SQL

for file in /migrations/*.sql; do
  name=$(basename "$file")
  applied=$(psql -tAq -c "SELECT 1 FROM schema_migrations WHERE filename = '$name'")
  if [ "$applied" = "1" ]; then
    echo "skip  $name"
    continue
  fi
  echo "apply $name"
  psql -v ON_ERROR_STOP=1 -q --single-transaction \
    -f "$file" \
    -c "INSERT INTO schema_migrations (filename) VALUES ('$name')"
done

echo "migrations up to date"
