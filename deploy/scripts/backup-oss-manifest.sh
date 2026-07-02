#!/usr/bin/env sh
set -eu

BACKUP_DIR="${BACKUP_DIR:-runtime/backups/oss}"
OSS_BUCKET="${ALIYUN_OSS_BUCKET:?ALIYUN_OSS_BUCKET is required}"

mkdir -p "$BACKUP_DIR"
ossutil ls "oss://$OSS_BUCKET/freedompost" -r > "$BACKUP_DIR/oss_manifest_$(date +%F).txt"

find "$BACKUP_DIR" -name "oss_manifest_*.txt" -mtime +180 -delete
