#!/bin/sh
set -e
if [ "$RUN_MIGRATIONS" = "1" ]; then
  echo "[ddotshop] Running db push..."
  npx prisma db push --skip-generate
  echo "[ddotshop] Done"
fi
exec node .next/standalone/server.js
