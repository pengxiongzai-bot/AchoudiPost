#!/usr/bin/env sh
set -eu

BACKUP_DIR="${BACKUP_DIR:-runtime/backups/db}"
DATABASE_URL="${DATABASE_URL:?DATABASE_URL is required}"

mkdir -p "$BACKUP_DIR"
pg_dump -Fc "$DATABASE_URL" > "$BACKUP_DIR/freedompost_$(date +%F).dump"

find "$BACKUP_DIR" -name "freedompost_*.dump" -mtime +30 -delete
