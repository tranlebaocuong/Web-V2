#!/bin/bash
# ==============================================================================
# SCRIPT PHỤC HỒI DỮ LIỆU TỦ SÁCH ÁO LAM TỪ BẢN SAO LƯU TAR.GZ
# Cách dùng:
#   sudo ./deploy/scripts/restore-prod.sh /var/backups/tusachaolam/tusach_backup_YYYYMMDD_HHMMSS.tar.gz
# ==============================================================================

set -euo pipefail

if [ $# -lt 1 ]; then
    echo "❌ Cách dùng: $0 <duong_dan_file_backup.tar.gz>"
    exit 1
fi

TAR_FILE="$1"
if [ ! -f "${TAR_FILE}" ]; then
    echo "❌ Không tìm thấy tệp sao lưu: ${TAR_FILE}"
    exit 1
fi

TEMP_EXTRACT="/tmp/tusach_restore_$(date +%s)"
DB_NAME="sentrang_prod"
DB_USER="tusach_admin"
MEDIA_DIR="/var/www/tusachaolam/uploads"

echo "=========================================================="
echo "  BẮT ĐẦU QUY TRÌNH PHỤC HỒI THẢM HỌA (DISASTER RECOVERY) "
echo "=========================================================="
echo "• Tệp nguồn: ${TAR_FILE}"

mkdir -p "${TEMP_EXTRACT}"
tar -xzf "${TAR_FILE}" -C "${TEMP_EXTRACT}"

BUNDLE_DIR=$(find "${TEMP_EXTRACT}" -maxdepth 1 -type d -name "bundle_*" | head -n 1)

if [ -z "${BUNDLE_DIR}" ]; then
    echo "❌ Định dạng tệp sao lưu không hợp lệ (thiếu thư mục bundle)."
    rm -rf "${TEMP_EXTRACT}"
    exit 1
fi

echo "• Đọc manifest kiểm tra toàn vẹn..."
cat "${BUNDLE_DIR}/manifest.json"

# 1. Tạm dừng dịch vụ web để tránh xung đột dữ liệu
echo "• Tạm dừng dịch vụ tusachaolam..."
sudo systemctl stop tusachaolam || true

# 2. Phục hồi Database
echo "• Phục hồi cơ sở dữ liệu PostgreSQL..."
psql -U "${DB_USER}" -d "${DB_NAME}" -f "${BUNDLE_DIR}/database.sql"
echo "  ✓ Đã phục hồi dữ liệu bảng và chỉ mục tìm kiếm."

# 3. Phục hồi Media
if [ -d "${BUNDLE_DIR}/media" ]; then
    echo "• Phục hồi tệp hình ảnh vào ${MEDIA_DIR}..."
    mkdir -p "${MEDIA_DIR}"
    rsync -av "${BUNDLE_DIR}/media/" "${MEDIA_DIR}/"
    chown -R tusach:tusach "${MEDIA_DIR}"
    echo "  ✓ Đã đồng bộ tài sản hình ảnh."
fi

# 4. Khởi động lại dịch vụ web
echo "• Khởi động lại dịch vụ tusachaolam..."
sudo systemctl start tusachaolam

# 5. Dọn dẹp tệp tạm
rm -rf "${TEMP_EXTRACT}"

echo "=========================================================="
echo "✅ PHỤC HỒI HOÀN TẤT! HỆ THỐNG ĐÃ HOẠT ĐỘNG TRỞ LẠI BÌNH THƯỜNG."
echo "=========================================================="
