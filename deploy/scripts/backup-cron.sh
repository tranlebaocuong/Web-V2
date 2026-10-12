#!/bin/bash
# ==============================================================================
# SCRIPT SAO LƯU TỰ ĐỘNG HẰNG NGÀY CHO TỦ SÁCH ÁO LAM
# Đặt cronjob chạy vào 02:00 sáng mỗi ngày:
# 0 2 * * * /var/www/tusachaolam/deploy/scripts/backup-cron.sh >> /var/log/tusach_backup.log 2>&1
# ==============================================================================

set -euo pipefail

BACKUP_ROOT="/var/backups/tusachaolam"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BUNDLE_DIR="${BACKUP_ROOT}/bundle_${TIMESTAMP}"
RETENTION_DAYS=30

DB_NAME="sentrang_prod"
DB_USER="tusach_admin"
MEDIA_DIR="/var/www/tusachaolam/uploads"

echo "=========================================================="
echo "[$(date '+%Y-%m-%d %H:%M:%S')] Bắt đầu quy trình sao lưu định kỳ"
echo "=========================================================="

mkdir -p "${BUNDLE_DIR}"
chmod 700 "${BUNDLE_DIR}"

# 1. Sao lưu Cơ sở dữ liệu PostgreSQL
echo "• Đang xuất dump PostgreSQL (pg_dump)..."
pg_dump -U "${DB_USER}" -d "${DB_NAME}" --clean --if-exists --no-owner --no-privileges -f "${BUNDLE_DIR}/database.sql"
SQL_SHA256=$(sha256sum "${BUNDLE_DIR}/database.sql" | awk '{print $1}')
echo "  ✓ Dump hoàn tất. SHA256: ${SQL_SHA256}"

# 2. Sao lưu Vùng lưu trữ Media
if [ -d "${MEDIA_DIR}" ]; then
    echo "• Đang đồng bộ thư mục media..."
    mkdir -p "${BUNDLE_DIR}/media"
    rsync -av --delete "${MEDIA_DIR}/" "${BUNDLE_DIR}/media/"
    MEDIA_COUNT=$(find "${BUNDLE_DIR}/media" -type f | wc -l)
    echo "  ✓ Đã sao lưu ${MEDIA_COUNT} tệp hình ảnh."
else
    echo "  ! Không tìm thấy thư mục media: ${MEDIA_DIR}"
    MEDIA_COUNT=0
fi

# 3. Tạo Manifest kê khai tính toàn vẹn
cat <<EOF > "${BUNDLE_DIR}/manifest.json"
{
  "system": "Tu Sach Ao Lam Production",
  "timestamp": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
  "database": {
    "name": "${DB_NAME}",
    "sha256": "${SQL_SHA256}",
    "size_bytes": $(stat -c%s "${BUNDLE_DIR}/database.sql")
  },
  "media": {
    "count": ${MEDIA_COUNT}
  }
}
EOF

# 4. Nén gói sao lưu thành tệp tar.gz
TAR_FILE="${BACKUP_ROOT}/tusach_backup_${TIMESTAMP}.tar.gz"
echo "• Đang nén toàn bộ gói thành: ${TAR_FILE}..."
tar -czf "${TAR_FILE}" -C "${BACKUP_ROOT}" "bundle_${TIMESTAMP}"
rm -rf "${BUNDLE_DIR}"
chmod 600 "${TAR_FILE}"
echo "  ✓ Đã tạo file nén: $(stat -c%s "${TAR_FILE}") bytes"

# 5. Xóa các bản sao lưu cũ hơn RETENTION_DAYS ngày
echo "• Đang dọn dẹp các bản sao lưu cũ hơn ${RETENTION_DAYS} ngày..."
find "${BACKUP_ROOT}" -name "tusach_backup_*.tar.gz" -type f -mtime +${RETENTION_DAYS} -delete

echo "=========================================================="
echo "[$(date '+%Y-%m-%d %H:%M:%S')] Sao lưu hoàn tất thành công!"
echo "=========================================================="
