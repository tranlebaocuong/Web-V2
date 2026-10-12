import "dotenv/config";
import fs from "fs";
import path from "path";
import { MEDIA_DIR, detectRealImageMime } from "../src/lib/dal/admin/media";

export async function syncMediaToCloud() {
  console.log("==================================================================");
  console.log("   TỦ SÁCH ÁO LAM — ĐỒNG BỘ MEDIA LÊN CLOUD OBJECT STORAGE       ");
  console.log("==================================================================");

  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const bucket = process.env.SUPABASE_STORAGE_BUCKET || "sentrang-media";

  if (!supabaseUrl || !serviceKey) {
    console.error("❌ Lỗi: Thiếu biến môi trường SUPABASE_URL hoặc SUPABASE_SERVICE_ROLE_KEY.");
    console.error("   Vui lòng điền các giá trị này vào file .env trước khi chạy đồng bộ.");
    process.exit(1);
  }

  if (!fs.existsSync(MEDIA_DIR)) {
    console.log(`• Không tìm thấy thư mục media: ${MEDIA_DIR}. Kết thúc.`);
    return;
  }

  // 1. Kiểm tra / Tạo Bucket nếu chưa tồn tại
  console.log(`• Đang kiểm tra bucket '${bucket}' trên Supabase Storage...`);
  try {
    const bucketRes = await fetch(`${supabaseUrl}/storage/v1/bucket/${bucket}`, {
      headers: { Authorization: `Bearer ${serviceKey}` },
    });

    if (bucketRes.status === 404) {
      console.log(`• Bucket '${bucket}' chưa tồn tại. Đang tự động tạo mới...`);
      const createRes = await fetch(`${supabaseUrl}/storage/v1/bucket`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${serviceKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: bucket,
          name: bucket,
          public: false, // Private bucket: chỉ truy cập qua API xác thực
        }),
      });
      if (!createRes.ok) {
        console.warn(`  ! Cảnh báo khi tạo bucket: ${await createRes.text()}`);
      } else {
        console.log(`  ✓ Đã tạo bucket '${bucket}' thành công.`);
      }
    } else {
      console.log(`  ✓ Bucket '${bucket}' đã sẵn sàng.`);
    }
  } catch (err: any) {
    console.warn("  ! Không thể kiểm tra bucket tự động:", err.message);
  }

  // 2. Tải từng tệp lên
  const files = fs.readdirSync(MEDIA_DIR);
  let successCount = 0;

  for (const file of files) {
    const filePath = path.join(MEDIA_DIR, file);
    if (!fs.statSync(filePath).isFile()) continue;

    const buffer = fs.readFileSync(filePath);
    const detected = detectRealImageMime(buffer);
    const mime = detected ? detected.mime : "application/octet-stream";

    console.log(`• Đang tải lên: ${file} (${buffer.length} bytes, ${mime})...`);
    try {
      const uploadUrl = `${supabaseUrl}/storage/v1/object/${bucket}/${file}`;
      const res = await fetch(uploadUrl, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${serviceKey}`,
          "Content-Type": mime,
          "x-upsert": "true",
        },
        body: buffer,
      });

      if (!res.ok) {
        console.error(`  ✗ Thất bại: ${await res.text()}`);
      } else {
        console.log(`  ✓ Đã đồng bộ thành công.`);
        successCount++;
      }
    } catch (err: any) {
      console.error(`  ✗ Lỗi kết nối: ${err.message}`);
    }
  }

  console.log("==================================================================");
  console.log(`✅ HOÀN TẤT ĐỒNG BỘ: ${successCount}/${files.length} tệp đã đưa lên Cloud Storage!`);
  console.log("==================================================================");
}

if (require.main === module) {
  syncMediaToCloud().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
