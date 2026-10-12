import { Pool } from 'pg';

const pool = new Pool({
  connectionString: 'postgresql://postgres:postgres@127.0.0.1:5434/sentrang_test?sslmode=disable'
});

const richContent = {
  version: 1,
  blocks: [
    { id: 'muc-dich', type: 'heading', level: 2, text: 'I. Mục đích' },
    { id: 'p-muc-dich', type: 'paragraph', text: 'Giúp các em Oanh Vũ bước đầu làm quen với hình ảnh cao quý của Đức Từ Phụ Thích Ca Mâu Ni, hiểu rõ nguồn gốc giáng trần và tấm lòng từ bi vô lượng của Ngài đối với muôn loài chúng sanh.' },
    { id: 'noi-dung-bai-giang', type: 'heading', level: 2, text: 'II. Nội dung bài giảng' },
    { id: 'xuat-than', type: 'heading', level: 3, text: '1. Xuất thân và Giáng sinh' },
    { id: 'p-xuat-than-1', type: 'paragraph', text: 'Vào ngày mùng 8 tháng 4 âm lịch (năm 624 trước Tây lịch), tại vườn Lâm Tỳ Ny gần thành Ca Tỳ La Vệ, Hoàng hậu Ma Gia đã hạ sinh Thái tử Tất Đạt Đa. Vua cha là Tịnh Phạn Vương, thuộc dòng dõi họ Thích Ca trị vì vương quốc.' },
    { id: 'p-xuat-than-2', type: 'paragraph', text: 'Khi Thái tử đản sanh, đất trời chấn động, muôn hoa nở rộ, chín rồng phun nước tắm cho Thái tử. Ngài bước đi bảy bước, dưới mỗi bước chân nở một bông hoa sen trắng nâng gót ngọc.' },
    { id: 'img-dan-sanh', type: 'image', caption: 'Hình 1: Thái tử Tất Đạt Đa đản sanh tại vườn Lâm Tỳ Ny.', altText: 'Bức họa Thái Tử Tất Đạt Đa đản sanh bước trên bảy đóa sen' },
    { id: 'thoi-nien-thieu', type: 'heading', level: 3, text: '2. Thời niên thiếu và Đi dạo bốn cửa thành' },
    { id: 'p-thoi-nien-thieu', type: 'paragraph', text: 'Thái tử lớn lên thông minh xuất chúng, văn võ song toàn, lòng thương xót người và muôn vật khôn xiết. Trong những lần đi dạo ngoài bốn cửa thành, Thái tử đã chứng kiến những cảnh tượng nhân sinh:' },
    { id: 'list-bon-cua-thanh', type: 'list', ordered: true, items: [
      'Cửa Đông: Thái tử gặp một người già yếu lưng còng, tóc bạc bước đi run rẩy (Nỗi khổ Già).',
      'Cửa Nam: Thái tử gặp một người bệnh tật rên siết đau đớn quằn quại (Nỗi khổ Bệnh).',
      'Cửa Tây: Thái tử gặp một đám ma người chết, thân nhân khóc than thảm thiết (Nỗi khổ Chết).',
      'Cửa Bắc: Thái tử gặp một vị tu sĩ trang nghiêm, thanh tịnh ung dung tự tại (Con đường giải thoát).'
    ]},
    { id: 'xuat-gia', type: 'heading', level: 3, text: '3. Quyết định xuất gia tìm đạo' },
    { id: 'p-xuat-gia', type: 'paragraph', text: 'Thấu hiểu nỗi thống khổ của nhân sinh và quyết tâm tìm con đường cứu vớt muôn loài, vào nửa đêm ngày mùng 8 tháng 2 âm lịch, Thái tử đã cùng người hầu Xa Nặc và tuấn mã Kiền Trắc vượt sông Anoma, cắt tóc xuất gia tìm đạo cứu đời.' },
    { id: 'cham-ngon-ghi-nho', type: 'heading', level: 2, text: 'III. Châm ngôn và Điều dặn dò' },
    { id: 'callout-ghi-nho', type: 'callout', variant: 'quote', title: 'Lời dặn Oanh Vũ:', text: 'Đức Phật là bậc Đại Từ Bi, Ngài đã từ bỏ ngai vàng châu báu để cứu vớt chúng sanh. Em là đoàn sinh Gia Đình Phật Tử, phải luôn nhớ ơn Phật, học theo hạnh từ bi của Ngài, biết yêu thương muôn người và muôn vật.' },
    { id: 'cau-hoi-on-tap', type: 'heading', level: 2, text: 'IV. Câu hỏi ôn tập' },
    { id: 'list-cau-hoi', type: 'list', ordered: false, items: [
      'Thái tử Tất Đạt Đa sanh ngày tháng năm nào? Ở đâu?',
      'Vua cha và Hoàng hậu tên là gì?',
      'Đi dạo bốn cửa thành, Thái tử đã nhìn thấy những cảnh tượng gì?',
      'Đoàn sinh Oanh Vũ noi gương Đức Phật bằng những việc làm cụ thể nào trong cuộc sống?'
    ]}
  ]
};

async function main() {
  await pool.query(
    'UPDATE lesson_contents SET content_json = $1, updated_at = NOW() WHERE lesson_id = $2',
    [JSON.stringify(richContent), 'D-MM-A-01']
  );
  console.log('✓ Successfully enriched D-MM-A-01 in sentrang_test with full block types!');
  await pool.end();
}

main().catch(console.error);
