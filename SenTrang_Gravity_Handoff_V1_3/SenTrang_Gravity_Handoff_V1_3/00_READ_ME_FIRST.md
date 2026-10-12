# SEN TRẮNG — GRAVITY HANDOFF V1.3

**ĐỌC FILE NÀY ĐẦU TIÊN.** Đây là hồ sơ bàn giao bản đặc tả + Master Data, **chưa phải chỉ thị bắt đầu code**. Chủ dự án đã chốt V1.0 chỉ gồm Thư viện Ngành Đồng và ba lĩnh vực tu học. Phong cách AC (hiện đại + thư viện chuyên nghiệp).

## Những gì có trong ZIP

```text
SenTrang_Gravity_Handoff_V1_3/
├── 00_READ_ME_FIRST.md
├── 01_SPECIFICATIONS/
│   ├── 01_SRS_PhamVi_NghiepVu.md
│   ├── 02_Database_Schema_DataMapping.md
│   ├── 03_API_Contract.md
│   ├── 04_UI_Blueprint_DesignSystem.md
│   └── 05_TestPlan_Acceptance.md
├── 02_MASTER_DATA/
│   ├── SenTrang_MasterData_NganhDong_V1_2.xlsx
│   ├── SenTrang_MasterData_NganhDong_V1_2.csv
│   ├── SenTrang_MasterData_NganhDong_V1_2.json
│   └── SenTrang_MasterData_README_V1_2.md
└── 03_HANDOFF/
    ├── 06_Import_MasterData_Guide.md
    └── 07_Gravity_Kickoff_Prompt.md
```

Có thể có thêm bản Word tổng hợp ở thư mục gốc ZIP.

## Thứ tự đọc đề nghị

1. `01_SRS_PhamVi_NghiepVu.md` → chốt phạm vi và business rules.
2. `02_Database_Schema_DataMapping.md` → quan hệ DB và đúng ID trong JSON.
3. `02_MASTER_DATA/*.json` + `.xlsx` → xem dữ liệu thực tế và so sánh Excel.
4. `06_Import_MasterData_Guide.md` → cách seed không tạo dữ liệu giả.
5. `03_API_Contract.md` → API public/admin.
6. `04_UI_Blueprint_DesignSystem.md` → 7 màn hình desktop/mobile.
7. `05_TestPlan_Acceptance.md` → điều kiện nghiệm thu.
8. `07_Gravity_Kickoff_Prompt.md` → yêu cầu Gravity tóm tắt kế hoạch trước khi code.

## Phân biệt dữ liệu với bản thiết kế

- **Master Data V1.2 là source of truth** cho IDs, tên bài, thứ tự, phân nhóm, nguồn và raw text.
- V1.3 là **đặc tả đích** cho kiến trúc/DB/API/UI; các bảng như `lesson_contents` là dữ liệu tương lai, chưa có sẵn trong Master Data.
- Các đoạn JSON API trong docs là **ví dụ schema**, không phải dữ liệu trả về từ server thật.
- **Quan trọng:** category Hoạt động Thanh niên có ID `hoat-dong-thanh-nien`, KHÔNG phải `hoat-dong` như ví dụ trong trao đổi cũ.
- Tài liệu nội bộ làm nguồn chuẩn nội dung theo xác nhận chủ dự án; quyền đăng nguyên văn công khai cần chủ dự án bảo đảm riêng.

## Scope freeze

Không bổ sung PDF viewer, chức năng tải PDF, ngân hàng đề thi, AI, user login, bình luận, học theo số tiết. Chỉ bắt đầu code khi chủ dự án đồng ý sau khi Gravity đọc và xác nhận đặc tả.
