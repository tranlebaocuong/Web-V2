-- AlterTable: Bổ sung an toàn cột updated_at cho bảng users với giá trị mặc định CURRENT_TIMESTAMP
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP;
