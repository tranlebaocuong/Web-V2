import "dotenv/config";
import fs from "fs";
import path from "path";

/**
 * Script tải về toàn bộ tệp hình ảnh từ Supabase Storage Bucket để lưu trữ dự phòng ngoại tuyến
 */
export async function backupCloudMedia() {
  console.log("==================================================================");
  console.log("   TỦ SÁCH ÁO LAM — SAO LƯU HÌNH ẢNH TỪ SUPABASE STORAGE          ");
  console.log("==================================================================\n");

  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const bucket = process.env.SUPABASE_STORAGE_BUCKET || "sentrang-media";

  if (!supabaseUrl || !serviceKey) {
    console.error("❌ Lỗi: Thiếu biến môi trường SUPABASE_URL hoặc SUPABASE_SERVICE_ROLE_KEY.");
    process.exit(1);
  }

  const timestamp = new Date()
    .toISOString()
    .replace(/[-:]/g, "")
    .replace("T", "_")
    .replace(/\..+/, "");

  const backupDir = path.resolve(process.cwd(), "data", "backups", `cloud_media_${timestamp}`);
  fs.mkdirSync(backupDir, { recursive: true });

  console.log(`• Đang liệt kê danh sách tệp trong bucket '${bucket}'...`);
  try {
    const listRes = await fetch(`${supabaseUrl}/storage/v1/object/list/${bucket}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${serviceKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ limit: 1000, offset: 0, sortBy: { column: "name", order: "asc" } }),
    });

    if (!listRes.ok) {
      throw new Error(`Không thể lấy danh sách tệp: ${await listRes.text()}`);
    }

    const items: Array<{ name: string; id: string; metadata?: any }> = await listRes.json();
    console.log(`• Tìm thấy ${items.length} tệp trong bucket.`);

    let downloadCount = 0;
    for (const item of items) {
      if (!item.name) continue;
      const getUrl = `${supabaseUrl}/storage/v1/object/authenticated/${bucket}/${item.name}`;
      const fileRes = await fetch(getUrl, {
        headers: { Authorization: `Bearer ${serviceKey}` },
      });

      if (fileRes.ok) {
        const buffer = Buffer.from(await fileRes.arrayBuffer());
        const destPath = path.join(backupDir, item.name);
        fs.writeFileSync(destPath, buffer);
        console.log(`  ✓ Đã tải: ${item.name} (${buffer.length} bytes)`);
        downloadCount++;
      } else {
        console.warn(`  ✗ Thất bại khi tải: ${item.name}`);
      }
    }

    console.log("\n==================================================================");
    console.log(`✅ HOÀN TẤT SAO LƯU MEDIA: Đã lưu ${downloadCount}/${items.length} tệp vào:`);
    console.log(`   ${backupDir}`);
    console.log("==================================================================");
  } catch (err: any) {
    console.error("❌ Lỗi trong quá trình sao lưu media:", err.message);
    process.exit(1);
  }
}

if (require.main === module) {
  backupCloudMedia().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
