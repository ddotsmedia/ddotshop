#!/bin/sh
set -e

if [ "$RUN_MIGRATIONS" = "1" ]; then
  echo "[entrypoint] Syncing Prisma schema to database..."
  npx prisma db push --skip-generate
fi

exec "$@"
