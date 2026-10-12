async function testScreens() {
  console.log("=========================================================");
  console.log("  SEN TRẮNG — KIỂM THỬ TỰ ĐỘNG CHẶNG 4 (SÁU MÀN HÌNH UI)");
  console.log("=========================================================\n");

  const routes = [
    { name: "SCR-01 Trang chủ (/)", url: "http://localhost:3001/", expect: 200 },
    { name: "SCR-02 Ngành Đồng (/nganh-dong)", url: "http://localhost:3001/nganh-dong", expect: 200 },
    { name: "SCR-03 Bậc Mở Mắt (/nganh-dong/mo-mat)", url: "http://localhost:3001/nganh-dong/mo-mat", expect: 200 },
    { name: "SCR-03 Bậc Cánh Mềm (/nganh-dong/canh-mem)", url: "http://localhost:3001/nganh-dong/canh-mem", expect: 200 },
    { name: "SCR-03 Bậc Chân Cứng (/nganh-dong/chan-cung)", url: "http://localhost:3001/nganh-dong/chan-cung", expect: 200 },
    { name: "SCR-03 Bậc Tung Bay (/nganh-dong/tung-bay)", url: "http://localhost:3001/nganh-dong/tung-bay", expect: 200 },
    { name: "SCR-03 Bậc không tồn tại (/nganh-dong/bac-la)", url: "http://localhost:3001/nganh-dong/bac-la", expect: 404 },
    { name: "SCR-04 Danh sách bài Mở Mắt - Phật pháp (/nganh-dong/mo-mat/phat-phap)", url: "http://localhost:3001/nganh-dong/mo-mat/phat-phap", expect: 200 },
    { name: "SCR-04 Danh sách bài Mở Mắt - Hoạt động (/nganh-dong/mo-mat/hoat-dong-thanh-nien)", url: "http://localhost:3001/nganh-dong/mo-mat/hoat-dong-thanh-nien", expect: 200 },
    { name: "SCR-04 Danh sách bài Mở Mắt - Văn nghệ (/nganh-dong/mo-mat/van-nghe)", url: "http://localhost:3001/nganh-dong/mo-mat/van-nghe", expect: 200 },
    { name: "SCR-05 Đọc bài học 1 (d-mm-a-01-lich-su-duc-phat-thich-ca)", url: "http://localhost:3001/bai-hoc/d-mm-a-01-lich-su-duc-phat-thich-ca", expect: 200 },
    { name: "SCR-05 Đọc bài học 2 (d-mm-a-02-em-den-chua)", url: "http://localhost:3001/bai-hoc/d-mm-a-02-em-den-chua", expect: 200 },
    { name: "SCR-05 Đọc bài học 3 (d-mm-a-03-y-nghia-huy-hieu-hoa-sen-trong-gdpt)", url: "http://localhost:3001/bai-hoc/d-mm-a-03-y-nghia-huy-hieu-hoa-sen-trong-gdpt", expect: 200 },
    { name: "SCR-05 Bảo vệ bản nháp: Bài nháp phải trả về 404", url: "http://localhost:3001/bai-hoc/d-mm-a-04-bai-hoc-ban-nhap", expect: 404 },
    { name: "SCR-05 Bảo vệ bản nháp: Slug không tồn tại phải 404", url: "http://localhost:3001/bai-hoc/slug-khong-ton-tai", expect: 404 },
    { name: "SCR-06 Tìm kiếm ban đầu (/tim-kiem)", url: "http://localhost:3001/tim-kiem", expect: 200 },
    { name: "SCR-06 Tìm kiếm có từ khóa (/tim-kiem?q=Phat)", url: "http://localhost:3001/tim-kiem?q=Phat", expect: 200 },
    { name: "SCR-06 Tìm kiếm kết hợp bộ lọc (/tim-kiem?q=Phat&level=mo-mat)", url: "http://localhost:3001/tim-kiem?q=Phat&level=mo-mat", expect: 200 },
  ];

  let passedCount = 0;
  for (const r of routes) {
    try {
      const res = await fetch(r.url);
      const isMatch = res.status === r.expect;
      if (isMatch) {
        console.log(`  ✓ [PASS] ${r.name} -> HTTP ${res.status}`);
        passedCount++;
      } else {
        console.error(`  ✗ [FAIL] ${r.name} -> HTTP ${res.status} (Kỳ vọng: ${r.expect})`);
      }
    } catch (e) {
      console.error(`  ✗ [ERROR] ${r.name}:`, e);
    }
  }

  console.log(`\nTổng kết: ${passedCount}/${routes.length} kiểm thử thành công.`);
  if (passedCount === routes.length) {
    console.log("==> TẤT CẢ 6 MÀN HÌNH ĐÃ VẬN HÀNH CHUẨN XÁC 100%! <==");
  }
}

testScreens();
