import "dotenv/config";
import { prisma } from "../src/lib/prisma";

export async function runDemoSeed() {
  console.log("=========================================================");
  console.log("  SEN TRẮNG — SEED BÀI HỌC DEMO CHUẨN NỘI DUNG GỐC (CHẶNG 2)");
  console.log("=========================================================");
  console.log("Nạp nội dung biên tập khối chuẩn xác 100% từ giáo trình Mở Mắt:");
  console.log("1. D-MM-A-01: Lịch sử Đức Phật Thích Ca (Trang 7-11)");
  console.log("2. D-MM-A-03: Ý nghĩa huy hiệu Hoa Sen trong GĐPT (Trang 15-17)");
  console.log("TUÂN THỦ: Không tự sáng tác, giữ nguyên trạng thái DRAFT (chưa xuất bản).\n");

  // =========================================================================
  // 1. D-MM-A-01: Lịch sử Đức Phật Thích Ca (3 tiết) - Trang 7-11
  // =========================================================================
  const contentLesson1 = {
    version: 1,
    blocks: [
      {
        id: "d1-h1",
        type: "heading" as const,
        level: 2 as const,
        text: "A. TỪ SƠ SANH ĐẾN XUẤT GIA (tiết 1)",
      },
      {
        id: "d1-h1-mucdich",
        type: "heading" as const,
        level: 3 as const,
        text: "I. Mục đích",
      },
      {
        id: "d1-p1",
        type: "paragraph" as const,
        text: "Nắm vững được thân thế và thời niên thiếu của Thái Tử.",
      },
      {
        id: "d1-h1-noidung",
        type: "heading" as const,
        level: 3 as const,
        text: "II. Nội dung bài giảng",
      },
      {
        id: "d1-h1-1",
        type: "heading" as const,
        level: 4 as const,
        text: "1. Thân thế của Thái Tử",
      },
      {
        id: "d1-p2",
        type: "paragraph" as const,
        text: "Vào năm 624 trước Tây lịch, vua Tịnh Phạn đã 50 tuổi và hoàng hậu Ma Gia 45 tuổi mới hạ sinh được một Thái tử, dưới gốc cây Vô Ưu trong vườn Lâm Tỳ Ny nước Ca Tỳ La Vệ, vua cha đặt tên cho Thái tử là Tất Đạt Đa, họ Thích Ca, vì Thích Ca là một nhánh của dòng họ Kiều Tất La nên Ngài được gọi là Kiều Tất La Thích Ca Tất Đạt Đa. Vào lúc mặt trời vừa mọc ngày rằm tháng hai Ấn Độ (tức rằm tháng tư theo lịch Tàu). Hiện nay mỗi năm chúng ta kỷ niệm Đản sanh của Ngài vào ngày Rằm tháng tư âm lịch.",
      },
      {
        id: "d1-p3",
        type: "paragraph" as const,
        text: "Khi Ngài Đản sanh có nhiều điểm lạ như trên trời mưa hoa thơm. Nhạc trời ca tụng, quả đất rung động. Ngài có 32 tướng tốt, báo trước Ngài sẽ xuất gia tu hành tìm đường giác ngộ cho chúng sanh và sẽ thành Phật.",
      },
      {
        id: "d1-h1-2",
        type: "heading" as const,
        level: 4 as const,
        text: "2. Thời niên thiếu",
      },
      {
        id: "d1-p4",
        type: "paragraph" as const,
        text: "Thái tử Đản sanh được 7 ngày thì thân mẫu của Ngài từ trần, bà dì Ma Ha Bà Xà Bà Đề chăm sóc nuôi dưỡng. Ngài được vua chọn các thầy giáo danh tiếng nhất để dạy. Thái tử học vô cùng thông minh, các thầy đều mến phục. Tuy văn võ song toàn xuất chúng nhưng Ngài luôn lễ độ khiêm tốn, mặc dù sống trong quyền uy với điện ngọc ngai vàng xa hoa lộng lẫy nhưng nét mặt Ngài luôn lộ vẻ buồn kín đáo vì Ngài xót thương mọi người, mọi loài chúng sanh đang đau khổ. Năm 17 tuổi, Thái tử kết hôn với công chúa Da Du Đà La và sinh được một người con trai tên là La hầu La.",
      },
      {
        id: "d1-h1-cauhoi",
        type: "heading" as const,
        level: 3 as const,
        text: "III. Câu hỏi",
      },
      {
        id: "d1-list-q1",
        type: "list" as const,
        ordered: true,
        items: [
          "Thái tử Đản sanh vào ngày, tháng nào?",
          "Thái tử con Vua và Hoàng Hậu nào?",
        ],
      },
      {
        id: "d1-h2",
        type: "heading" as const,
        level: 2 as const,
        text: "B. TỪ XUẤT GIA ĐẾN THÀNH ĐẠO (tiết 2)",
      },
      {
        id: "d1-h2-mucdich",
        type: "heading" as const,
        level: 3 as const,
        text: "I. Mục đích",
      },
      {
        id: "d1-p5",
        type: "paragraph" as const,
        text: "Hiểu được Thái Tử đã dấn thân vào con đường Xuất Gia và Thành Đạo như thế nào?",
      },
      {
        id: "d1-h2-noidung",
        type: "heading" as const,
        level: 3 as const,
        text: "II. Nội dung bài giảng",
      },
      {
        id: "d1-p6",
        type: "paragraph" as const,
        text: "Sau một đêm yến tiệc linh đình, Thái tử giã từ vợ con, cung vàng điện ngọc… Lúc đó Thái tử 19 tuổi, vào đêm mồng 8 tháng 2 âm lịch, sau khi vượt dòng sông A Nô Ma cùng ngựa Kiền Trắc và Xa Nặc, Thái tử xuống ngựa, cắt tóc, cởi áo bào và đồ trang sức giao cho Xa Nặc cùng cây gươm báu để về trình Vua cha.",
      },
      {
        id: "d1-p7",
        type: "paragraph" as const,
        text: "Sau khi hỏi đạo và học đạo một số vị thầy, Thái tử không thỏa mãn vì không tìm ra đạo giải thoát nên bỏ đi.",
      },
      {
        id: "d1-h2-khohanh",
        type: "heading" as const,
        level: 4 as const,
        text: "Thái tử tu khổ hạnh",
      },
      {
        id: "d1-p8",
        type: "paragraph" as const,
        text: "Ngài đến bên dòng sông Ni Liên Thuyền bắt đầu tu khổ hạnh với 5 người bạn là nhóm ông Kiều Trần Như, tu ép xác mỗi ngày chỉ ăn một hột gạo, hột mè trong sáu năm chỉ còn da bọc xương, bị kiệt sức và ngất xỉu.",
      },
      {
        id: "d1-p9",
        type: "paragraph" as const,
        text: "Khi tỉnh lại, Ngài hiểu rằng phải giữ lấy cái thân mới tìm được đạo giải thoát. Thái tử nhận ra lối tu khổ hạnh không đem lại kết quả - Nhờ bát cháo sữa của cô thôn nữ Tu Xà Đề mà sức khỏe Ngài hồi phục, Ngài xuống dòng sông tắm rửa sạch sẽ, về núi Tượng Đầu tĩnh tọa tham thiền suốt 49 ngày dưới gốc cây Tất Bát La (cây Bồ Đề) đến khi thành đạo. Nhóm các ông Kiều Trần Như nghĩ rằng Ngài đã thối chí nên bỏ đi.",
      },
      {
        id: "d1-p10",
        type: "paragraph" as const,
        text: "Các Ma vương đã tìm mọi cách để quấy phá, cám dỗ, quyến rũ nhưng ý chí sắt thép của Thái tử đã chiến thắng tất cả. Đến khi sao mai vừa mọc ngày mồng 8 tháng 12 ngài chứng ngộ thành bậc Vô thượng giác hiệu là Phật Thích Ca Mâu Ni.",
      },
      {
        id: "d1-h2-cauhoi",
        type: "heading" as const,
        level: 3 as const,
        text: "III. Câu hỏi",
      },
      {
        id: "d1-list-q2",
        type: "list" as const,
        ordered: true,
        items: [
          "Thái tử ra đi cùng với ai?",
          "Thái tử ngồi thiền định bao lâu?",
          "Vào thời khắc nào thì Thái tử thành đạo?",
        ],
      },
      {
        id: "d1-h3",
        type: "heading" as const,
        level: 2 as const,
        text: "C. THÀNH ĐẠO ĐẾN NHẬP DIỆT (tiết 3)",
      },
      {
        id: "d1-h3-mucdich",
        type: "heading" as const,
        level: 3 as const,
        text: "I. Mục đích",
      },
      {
        id: "d1-p11",
        type: "paragraph" as const,
        text: "Nắm vững được khi Thành Đạo Đức Phật đã hóa độ cho tầng lớp nào và lời dạy cuối cùng là gì?",
      },
      {
        id: "d1-h3-noidung",
        type: "heading" as const,
        level: 3 as const,
        text: "II. Nội dung bài giảng",
      },
      {
        id: "d1-p12",
        type: "paragraph" as const,
        text: "Khi đã thành Phật hiệu là Thích Ca Mâu Ni, Đức Phật đến vườn Lộc Uyển để thuyết giảng cho năm anh em ông Kiều Trần Như bài Pháp đầu tiên là Tứ Diệu Đế, nghe xong họ đều giác ngộ và từ đó thế gian mới có đủ Ba ngôi báu: Phật, Pháp, Tăng.",
      },
      {
        id: "d1-h3-hoado",
        type: "heading" as const,
        level: 4 as const,
        text: "Những người được Đức Phật hóa độ",
      },
      {
        id: "d1-p13",
        type: "paragraph" as const,
        text: "Suốt 49 năm, Đức Phật đã hóa độ rất nhiều giai cấp, từ hàng vua chúa đến dân nghèo, từ thanh niên đến người già, từ bậc hiền đức đến kẻ hung bạo, Ngài cũng đã độ cho dòng tộc và Di mẫu.",
      },
      {
        id: "d1-h3-hoanman",
        type: "heading" as const,
        level: 4 as const,
        text: "Nhân duyên hoàn mãn",
      },
      {
        id: "d1-p14",
        type: "paragraph" as const,
        text: "Một hôm đi qua thành Tỳ Xá Li, lúc này Đức Phật đã trụ thế 80 năm, Ngài biết trước thời gian sẽ nhập diệt, có người thợ rèn tên Thuần Đà cung thỉnh Đức Phật về nhà dâng thọ trai lần cuối cùng.",
      },
      {
        id: "d1-h3-loidday",
        type: "heading" as const,
        level: 4 as const,
        text: "Những lời dạy sau cùng",
      },
      {
        id: "d1-p15",
        type: "paragraph" as const,
        text: "Đi về Câu Thi Na, Đức Phật nằm nghỉ giữa hai cây Sa La, độ cho Tu Bạt Đà La là vị đệ tử cuối cùng. Trước khi viên tịch, Đức Từ Phụ đã dạy cho các hàng đệ tử: “Này các ngươi phải biết tự mình thắp đuốc lên mà đi, hãy lấy pháp của ta làm đuốc, hãy lấy giới luật làm thầy”. Rồi nhập diệt vào ngày rằm tháng hai âm lịch.",
      },
      {
        id: "d1-h3-cauhoi",
        type: "heading" as const,
        level: 3 as const,
        text: "III. Câu hỏi",
      },
      {
        id: "d1-list-q3",
        type: "list" as const,
        ordered: true,
        items: [
          "Đức Phật thuyết pháp lần đầu tiên tại đâu?",
          "Tam Bảo có từ lúc nào?",
        ],
      },
    ],
  };

  await prisma.lessonContent.upsert({
    where: { lessonId: "D-MM-A-01" },
    update: {
      contentJson: contentLesson1 as any,
      schemaVersion: 1,
    },
    create: {
      lessonId: "D-MM-A-01",
      contentJson: contentLesson1 as any,
      schemaVersion: 1,
    },
  });

  await prisma.lesson.update({
    where: { id: "D-MM-A-01" },
    data: {
      contentStatus: "ready",
      publishStatus: "draft", // GIỮ NGUYÊN BẢN NHÁP THEO CHỈ THỊ CHẶNG 2
    },
  });
  console.log("  ✓ Đã nạp nội dung biên tập chuẩn khối cho bài D-MM-A-01 (draft, ready, 100% khớp giáo trình)");

  // =========================================================================
  // 2. D-MM-A-03: Ý nghĩa huy hiệu Hoa Sen trong GĐPT - Trang 15-17
  // =========================================================================
  const contentLesson3 = {
    version: 1,
    blocks: [
      {
        id: "d3-h1-mucdich",
        type: "heading" as const,
        level: 2 as const,
        text: "I. Mục đích",
      },
      {
        id: "d3-p1",
        type: "paragraph" as const,
        text: "Hiểu khái quát về hình thức và ý nghĩa huy hiệu hoa sen.",
      },
      {
        id: "d3-h2-noidung",
        type: "heading" as const,
        level: 2 as const,
        text: "II. Nội dung bài giảng",
      },
      {
        id: "d3-h2-1",
        type: "heading" as const,
        level: 3 as const,
        text: "1. Phát sinh huy hiệu hoa sen",
      },
      {
        id: "d3-p2",
        type: "paragraph" as const,
        text: "Đối với người dân Việt, hoa sen rất gần gũi và thân thiết, hoa sen đã đi vào thi ca dân tộc thật đậm đà và phong phú. Ngoài bông sen tinh khiết thanh cao, cây sen còn cống hiến cho con người những món ăn giàu dinh dưỡng, được chế biến từ hạt sen, ngó sen, củ sen...",
      },
      {
        id: "d3-p3",
        type: "paragraph" as const,
        text: "GĐPT lấy huy hiệu hoa sen làm phù hiệu để tượng trưng cho lý tưởng mục đích của tổ chức.",
      },
      {
        id: "d3-h2-2",
        type: "heading" as const,
        level: 3 as const,
        text: "2. Hình thức và ý nghĩa của huy hiệu hoa sen",
      },
      {
        id: "d3-h2-2-a",
        type: "heading" as const,
        level: 4 as const,
        text: "a. Hình thức",
      },
      {
        id: "d3-p4",
        type: "paragraph" as const,
        text: "Huy hiệu hoa sen của GĐPT màu trắng được thể hiện trên một hình tròn, đường kính 3 cm, nền màu xanh lục, có đường viền màu trắng.",
      },
      {
        id: "d3-h2-2-b",
        type: "heading" as const,
        level: 4 as const,
        text: "b. Ý nghĩa và cách phối trí màu",
      },
      {
        id: "d3-p5",
        type: "paragraph" as const,
        text: "Hình tròn của huy hiệu nhằm tượng trưng cho sự hoàn toàn vô ngại và viên dung của đạo Phật.",
      },
      {
        id: "d3-p6",
        type: "paragraph" as const,
        text: "Màu nền của huy hiệu là màu xanh lục tượng trưng cho tuổi trẻ tràn đầy hy vọng.",
      },
      {
        id: "d3-p7",
        type: "paragraph" as const,
        text: "Màu trắng của Hoa sen và màu trắng của đường viền tượng trưng cho ánh sáng giác ngộ.",
      },
      {
        id: "d3-h2-2-c",
        type: "heading" as const,
        level: 4 as const,
        text: "c. Ý nghĩa nội dung",
      },
      {
        id: "d3-p8",
        type: "paragraph" as const,
        text: "Hoa sen của huy hiệu GĐPT được sắp xếp gồm 2 phần: Phần trên có 5 cánh, phần dưới có 3 cánh.",
      },
      {
        id: "d3-p9",
        type: "paragraph" as const,
        text: "* Ý nghĩa:",
      },
      {
        id: "d3-list-canh",
        type: "list" as const,
        ordered: false,
        items: [
          "5 cánh trên tượng trưng cho 5 hạnh.",
          "3 cánh dưới tượng trưng cho 3 ngôi báu Phật - Pháp - Tăng.",
        ],
      },
      {
        id: "d3-h2-3",
        type: "heading" as const,
        level: 3 as const,
        text: "3. Vinh dự được mang huy hiệu hoa sen",
      },
      {
        id: "d3-p10",
        type: "paragraph" as const,
        text: "Được phát nguyện đeo huy hiệu hoa sen là niềm vinh dự, hãnh diện và niềm vui lớn đối với các em. Kể từ thời gian ấn tượng sâu sắc này, các em trở thành đoàn sinh chính thức của GĐPT Việt Nam. Do vậy các em phải trân trọng giữ gìn huy hiệu Hoa sen. Khi mặc Đoàn phục các em phải mang ngay ngắn đúng vị trí đã quy định.",
      },
      {
        id: "d3-h3-cauhoi",
        type: "heading" as const,
        level: 2 as const,
        text: "III. Câu hỏi",
      },
      {
        id: "d3-list-q",
        type: "list" as const,
        ordered: true,
        items: [
          "Hình tròn huy hiệu hoa sen tượng trưng ý nghĩa gì?",
          "Nền của huy hiệu hoa sen có màu gì? Màu này mang ý nghĩa gì?",
          "Huy hiệu hoa sen chia làm mấy phần, mỗi phần có mấy cánh?",
        ],
      },
      {
        id: "d3-h4-thuchanh",
        type: "heading" as const,
        level: 2 as const,
        text: "IV. Thực hành vẽ hoa sen",
      },
      {
        id: "d3-p11",
        type: "paragraph" as const,
        text: "Đối với bậc Mở Mắt, các anh chị trưởng tập cho các em sử dụng compa vẽ hình tròn trước.",
      },
    ],
  };

  await prisma.lessonContent.upsert({
    where: { lessonId: "D-MM-A-03" },
    update: {
      contentJson: contentLesson3 as any,
      schemaVersion: 1,
    },
    create: {
      lessonId: "D-MM-A-03",
      contentJson: contentLesson3 as any,
      schemaVersion: 1,
    },
  });

  await prisma.lesson.update({
    where: { id: "D-MM-A-03" },
    data: {
      contentStatus: "ready",
      publishStatus: "draft", // GIỮ NGUYÊN BẢN NHÁP THEO CHỈ THỊ CHẶNG 2
    },
  });
  console.log("  ✓ Đã nạp nội dung biên tập chuẩn khối cho bài D-MM-A-03 (draft, ready, 100% khớp giáo trình)");

  console.log("\n=========================================================");
  console.log("  HOÀN TẤT SEED DEMO BẢO TOÀN NGUYÊN BẢN GIÁO TRÌNH VÀ DRAFT");
  console.log("=========================================================");
}

if (require.main === module) {
  runDemoSeed()
    .catch((e) => {
      console.error("[DEMO SEED ERROR]", e);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
