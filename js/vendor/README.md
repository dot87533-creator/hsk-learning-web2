# Thư mục vendor — thư viện bên thứ 3 tự host

Mục đích: lưu bản sao cục bộ của các thư viện ngoài (như Hanzi Writer) để trang web
không phụ thuộc hoàn toàn vào CDN — tránh trường hợp mạng di động/nhà mạng chặn CDN
làm khung viết chữ bị trống trên writing.html.

## Cần thêm file: hanzi-writer.min.js

Trang `writing.html` sẽ tự động thử tải file này trước:
    js/vendor/hanzi-writer.min.js

Nếu không tìm thấy (404), trang sẽ tự động rơi về CDN jsdelivr như trước đây —
nên hiện tại trang KHÔNG bị hỏng, chỉ là chưa tối ưu tới khi bạn thêm file này vào.

### Cách lấy file (chọn 1 trong 2 cách):

**Cách 1 — Tải trực tiếp bằng trình duyệt / máy tính có mạng:**
1. Mở link: https://cdn.jsdelivr.net/npm/hanzi-writer@3.7/dist/hanzi-writer.min.js
2. Lưu trang (Ctrl+S / Cmd+S) với tên chính xác: `hanzi-writer.min.js`
3. Copy file đó vào đúng thư mục: `Tiếngtrung/js/vendor/hanzi-writer.min.js`
4. Commit + push lên git như bình thường.

**Cách 2 — Dùng terminal (máy có mạng, không bị chặn CDN):**
```bash
cd Tiếngtrung/js/vendor
curl -o hanzi-writer.min.js https://cdn.jsdelivr.net/npm/hanzi-writer@3.7/dist/hanzi-writer.min.js
```

Sau khi có file, mỗi lần Hanzi Writer ra bản mới bạn muốn cập nhật, chỉ cần tải lại
đè lên file cũ rồi đổi số version trong `writing.html` (`?v=20260702`) sang ngày mới
để trình duyệt không dùng bản cache cũ.
