#!/bin/sh
set -eu

if [ -z "${DATABASE_URL:-}" ]; then
  echo "DATABASE_URL is required"
  exit 1
fi

psql "$DATABASE_URL" -f packages/db/prisma/rls.sql
