/* translate.js — Dịch câu tiếng Việt sang tiếng Trung để phục vụ tính năng
   "Dịch câu của bạn → Luyện viết" trên trang writing.html.

   Cách hoạt động:
   1. Gửi câu tiếng Việt tới một dịch vụ dịch công khai (không cần API key).
      Thử lần lượt 2 phương án, phương án nào phản hồi hợp lệ trước thì dùng:
        - Google Translate (endpoint công khai translate_a/single)
        - MyMemory Translation API (dự phòng)
   2. Sinh phiên âm Pinyin cho câu tiếng Trung nhận được bằng thư viện
      pinyin-pro (chạy hoàn toàn phía client, không cần gọi mạng thêm lần nữa).

   Lưu ý: đây là các dịch vụ dịch máy miễn phí, chất lượng dịch có thể không
   hoàn hảo 100% với câu dài / phức tạp — phù hợp để luyện viết chữ, không
   thay thế cho biên dịch chuyên nghiệp. */
window.HSK_Translate = (function () {
  "use strict";

  async function tryGoogle(text) {
    const url = "https://translate.googleapis.com/translate_a/single?client=gtx&sl=vi&tl=zh-CN&dt=t&q=" + encodeURIComponent(text);
    const res = await fetch(url);
    if (!res.ok) throw new Error("google_http_" + res.status);
    const data = await res.json();
    const zh = Array.isArray(data && data[0]) ? data[0].map(seg => (seg && seg[0]) || "").join("") : "";
    if (!zh.trim()) throw new Error("google_empty");
    return zh.trim();
  }

  async function tryMyMemory(text) {
    const url = "https://api.mymemory.translated.net/get?q=" + encodeURIComponent(text) + "&langpair=vi|zh-CN";
    const res = await fetch(url);
    if (!res.ok) throw new Error("mymemory_http_" + res.status);
    const data = await res.json();
    const zh = data && data.responseData && data.responseData.translatedText;
    if (!zh || !zh.trim()) throw new Error("mymemory_empty");
    return zh.trim();
  }

  /* Dịch một câu tiếng Việt sang tiếng Trung giản thể.
     Trả về Promise<string>, hoặc throw Error nếu cả 2 phương án đều thất bại. */
  async function translateViToZh(text) {
    const q = (text || "").trim();
    if (!q) throw new Error("empty_input");

    const attempts = [tryGoogle, tryMyMemory];
    let lastErr = null;
    for (const attempt of attempts) {
      try {
        return await attempt(q);
      } catch (err) {
        lastErr = err;
      }
    }
    throw lastErr || new Error("translate_failed");
  }

  /* Sinh Pinyin (có dấu thanh) cho một chuỗi chữ Hán, dùng thư viện pinyin-pro
     đã nạp qua thẻ <script> trong writing.html. Trả về "" nếu thư viện chưa
     sẵn sàng thay vì làm vỡ luồng chính. */
  function getPinyin(zhText) {
    try {
      if (window.pinyinPro && typeof window.pinyinPro.pinyin === "function") {
        return window.pinyinPro.pinyin(zhText, { toneType: "symbol", type: "string", nonZh: "consecutive" });
      }
    } catch (err) { /* bo qua, tra ve rong */ }
    return "";
  }

  return { translateViToZh, getPinyin };
})();
