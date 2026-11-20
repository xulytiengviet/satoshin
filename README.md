# Satoshi — Những lá thư gửi Sirius (2009–2011)

Một **phòng đọc thư tín số bằng tiếng Việt**, theo mỹ thuật lưu trữ cổ điển: nền giấy, kiểu chữ serif, trình đọc nguyên văn và dòng thời gian 2009–2011.

> **Nguồn sử liệu:** [Satoshi — Sirius emails 2009–2011, Martti Malmi](https://mmalmi.github.io/satoshi/). Đây là dự án giao diện độc lập, **không phải** bản lưu trữ chính thức của tác giả.

## Xem trang

- Website sau khi GitHub Pages được kích hoạt: **https://xulytiengviet.github.io/satoshin/**
- Repository: https://github.com/xulytiengviet/satoshin

## Tính năng

- Giao diện Việt ngữ, đơn giản, phong cách tư liệu 2009–2011, tương thích điện thoại và máy tính.
- Danh sách thư có số hiệu, ngày tháng, chủ đề, người gửi.
- Tìm kiếm **toàn văn** trong nội dung tiếng Anh của từng lá thư (không gửi tìm kiếm lên máy chủ).
- Bộ lọc người gửi **Satoshi / Sirius**, bộ lọc năm **2009 / 2010 / 2011**, sắp xếp theo thứ tự.
- Mở thư bằng URL riêng, ví dụ #email-1, đối chiếu trực tiếp với email tương ứng tại nguồn.
- Điều hướng thư trước/sau, thay đổi cỡ chữ, sao chép liên kết và tải xuống TXT.
- Không dùng framework JavaScript, cơ sở dữ liệu, cookie phân tích hay thư viện bên thứ ba.

## Nguồn dữ liệu và tính nguyên gốc

Kho nguồn của Martti Malmi công khai **260 thư có số thứ tự**. Tại nguồn, tác giả giải thích kho là **không đầy đủ**: chỉ bao gồm thư ông còn giữ từ địa chỉ đại học @cc.hut.fi; những thư từ @aalto.fi không có bản sao lưu sau khi thay đổi địa chỉ đầu năm 2011.

Ứng dụng này **không chép nội dung 260 thư vào repository**. Khi mở trang, app.js lấy tài liệu HTML công khai và trích xuất tiêu đề/thân thư trực tiếp trên máy người đọc, với các URL theo thứ tự:

1. Bản phân phối CDN từ **commit cố định** của kho mmalmi/mmalmi.github.io, nhằm tạo nguồn tham chiếu có thể tái lập.
2. Bản HTML master hiện hành trên raw.githubusercontent.com khi CDN không truy cập được.

Hai nguồn trỏ tới **tài liệu của Martti Malmi**; ứng dụng không trộn nội dung do AI tạo vào thư gốc. Nếu cả hai đều không khả dụng, giao diện hiện thông báo và liên kết về nguồn chính.

**Lưu ý:** Các thư công khai có thể nhắc tới địa chỉ, thông tin liên lạc và thông tin xác thực lịch sử đã hết hiệu lực theo lời tác giả. Người đọc nên đối chiếu nguyên bản và không sử dụng dữ liệu lịch sử cho các mục đích khác. Các nội dung thư vẫn bằng tiếng Anh; giao diện và chú thích bằng tiếng Việt.

## Cấu trúc

| Tệp | Vai trò |
| --- | --- |
| index.html | Cấu trúc giao diện và nội dung giới thiệu |
| styles.css | Hệ thiết kế cổ điển, bố cục responsive |
| app.js | Nạp nguồn, phân tích email, tìm kiếm, lọc, trình đọc |
| .github/workflows/pages.yml | Tự động triển khai GitHub Pages |
| .nojekyll | Giữ website tĩnh, không qua bộ dựng Jekyll |

## Chạy thử trên máy

Do ứng dụng dùng JavaScript module, nên mở qua một máy chủ tĩnh. Chạy **python -m http.server 8000**, sau đó mở http://localhost:8000. Trình duyệt cần truy cập Internet để đọc dữ liệu nguồn. Nếu trình duyệt hoặc mạng đang dùng chặn truy cập CDN/raw GitHub, trang sẽ thông báo rõ thay vì hiển thị dữ liệu giả.

## Triển khai GitHub Pages

1. Vào **Repository → Settings → Pages**.
2. Chọn **Source: GitHub Actions** (nếu repository chưa bật Pages).
3. Vào tab **Actions**, chạy workflow **Deploy Satoshi archive to GitHub Pages**, hoặc push một commit mới lên main.
4. Khi workflow triển khai thành công, mở https://xulytiengviet.github.io/satoshin/.

Repository không lưu API key hoặc thông tin bí mật. Các thao tác tìm kiếm và lọc diễn ra hoàn toàn trong trình duyệt.

## Tôn trọng nguồn

**Quyền đối với thư tín gốc** thuộc về những người có quyền tương ứng; việc họ công khai tư liệu không tự động chuyển quyền sử dụng cho dự án này. Mã nguồn của *giao diện đọc* được viết độc lập. Khi trích dẫn lịch sử Bitcoin, hãy dẫn về các URL thư cụ thể trên https://mmalmi.github.io/satoshi/ .

---
Dự án UI độc lập · Satoshi / Sirius · 2009–2011
