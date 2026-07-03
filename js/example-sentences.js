/* example-sentences.js — Sinh NHIỀU câu ví dụ (đủ chủ ngữ – vị ngữ) cho MỌI từ vựng,
   dựa trên loại từ (word_type). Áp dụng cho toàn bộ kho HSK1-9, không chỉ 1 từ riêng lẻ.

   Cách dùng: window.HSK_getExampleSentences(word, count)
   -> trả về mảng [{ zh, pinyin, vi }, ...] (mặc định 3 câu).

   Đây là câu mẫu tạo tự động theo khuôn ngữ pháp phổ biến (không phải do biên tập viên
   viết tay từng câu), nên một số câu có thể hơi gượng với vài từ đặc biệt — nhưng luôn
   đảm bảo cấu trúc chủ ngữ + vị ngữ đầy đủ để người học dễ hình dung cách dùng từ. */
(function () {
  "use strict";

  /* ----- Từ đệm dùng chung, đã biết sẵn Pinyin để ghép câu ----- */
  const F = (zh, py) => ({ zh, py });
  const W = { word: true }; // đánh dấu vị trí chèn từ đang học

  const FILLER = {
    wo: F("我", "wǒ"), ni: F("你", "nǐ"), ta: F("他", "tā"), taShe: F("她", "tā"),
    women: F("我们", "wǒmen"), nimen: F("你们", "nǐmen"), tamen: F("他们", "tāmen"),
    zhe: F("这", "zhè"), na: F("那", "nà"), zhege: F("这个", "zhège"), nage: F("那个", "nàge"),
    hen: F("很", "hěn"), bu: F("不", "bù"), dou: F("都", "dōu"), ye: F("也", "yě"),
    tai: F("太", "tài"), zhen: F("真", "zhēn"), feichang: F("非常", "fēicháng"),
    shi: F("是", "shì"), you: F("有", "yǒu"), zai: F("在", "zài"),
    hui: F("会", "huì"), xiang: F("想", "xiǎng"), xihuan: F("喜欢", "xǐhuan"),
    keyi: F("可以", "kěyǐ"), yijing: F("已经", "yǐjīng"), juede: F("觉得", "juéde"),
    le: F("了", "le"), ma: F("吗", "ma"),
    meitian: F("每天", "měitiān"), zuotian: F("昨天", "zuótiān"), xianzai: F("现在", "xiànzài"),
    yi: F("一", "yī"), ge: F("个", "gè"), yige: F("一个", "yí gè"),
    pengyou: F("朋友", "péngyou"), pingguo: F("苹果", "píngguǒ"), shu: F("书", "shū"),
    shui: F("水", "shuǐ"), beijing: F("北京", "Běijīng"), shei: F("谁", "shéi"),
    yao: F("要", "yào"), chi: F("吃", "chī"), qu: F("去", "qù"), lai: F("来", "lái"),
    zheZhong: F("这种情况可以说是", "zhè zhǒng qíngkuàng kěyǐ shuō shì"),
    zuoshi: F("他做事一向", "tā zuòshì yíxiàng"),
    lizi: F("这真是一个", "zhè zhēn shi yí gè"), de2: F("的例子", "de lìzi"),
    tianTaiLeng: F("天太冷，", "tiān tài lěng,"), meiQu: F("我没去", "wǒ méi qù"),
    henMang: F("他很忙，", "tā hěn máng,"), meiLai: F("他没来", "tā méi lái")
  };

  function seg(word, arr) {
    const zh = arr.map(s => s.word ? word.hanzi : s.zh).join("");
    const py = arr.map(s => s.word ? word.pinyin : s.py).filter(Boolean).join(" ");
    return { zh, py };
  }

  /* Mỗi template: (word) => { zh, pinyin, vi } */
  function T(build, vi) {
    return (word) => {
      const { zh, py } = build(word);
      return { zh, pinyin: py, vi: vi(word.meaning_vi) };
    };
  }

  const BUCKETS = {
    verb: [
      T(w => seg(w, [FILLER.wo, FILLER.meitian, FILLER.dou, W, F("。", "")]),
        m => `Ngày nào tôi cũng ${m}.`),
      T(w => seg(w, [FILLER.ni, FILLER.xiang, W, F("吗？", "ma?")]),
        m => `Bạn có muốn ${m} không?`),
      T(w => seg(w, [FILLER.ta, FILLER.zuotian, W, FILLER.le, F("。", "")]),
        m => `Hôm qua anh ấy đã ${m}.`),
      T(w => seg(w, [FILLER.women, FILLER.dou, FILLER.hen, FILLER.xihuan, W, F("。", "")]),
        m => `Chúng tôi đều rất thích ${m}.`)
    ],
    noun: [
      T(w => seg(w, [FILLER.zhe, FILLER.shi, W, F("。", "")]),
        m => `Đây là ${m}.`),
      T(w => seg(w, [FILLER.wo, FILLER.you, FILLER.yige, W, F("。", "")]),
        m => `Tôi có một ${m}.`),
      T(w => seg(w, [FILLER.nage, W, FILLER.hen, F("好。", "hǎo.")]),
        m => `Cái ${m} đó rất tốt.`),
      T(w => seg(w, [FILLER.ni, FILLER.xihuan, W, F("吗？", "ma?")]),
        m => `Bạn có thích ${m} không?`)
    ],
    adjective: [
      T(w => seg(w, [FILLER.zhege, FILLER.hen, W, F("。", "")]),
        m => `Cái này rất ${m}.`),
      T(w => seg(w, [FILLER.ta, FILLER.bu, W, F("。", "")]),
        m => `Anh ấy không ${m}.`),
      T(w => seg(w, [FILLER.ni, FILLER.juede, FILLER.zhege, W, F("吗？", "ma?")]),
        m => `Bạn thấy cái này có ${m} không?`),
      T(w => seg(w, [FILLER.women, FILLER.dou, FILLER.hen, W, F("。", "")]),
        m => `Chúng tôi đều rất ${m}.`)
    ],
    number: [
      T(w => seg(w, [FILLER.wo, FILLER.you, W, FILLER.ge, FILLER.pingguo, F("。", "")]),
        m => `Tôi có ${m} quả táo.`),
      T(w => seg(w, [FILLER.xianzai, FILLER.shi, W, F("点。", "diǎn.")]),
        m => `Bây giờ là ${m} giờ.`),
      T(w => seg(w, [FILLER.zhe, FILLER.shi, F("第", "dì"), W, F("课。", "kè.")]),
        m => `Đây là bài học thứ ${m}.`)
    ],
    measure: [
      T(w => seg(w, [FILLER.wo, FILLER.yao, FILLER.yi, W, FILLER.shui, F("。", "")]),
        m => `Tôi muốn một ${m} nước.`),
      T(w => seg(w, [FILLER.zhe, FILLER.shi, FILLER.yi, W, FILLER.shu, F("。", "")]),
        m => `Đây là một ${m} sách.`)
    ],
    pronoun: [
      T(w => seg(w, [W, FILLER.shi, FILLER.wo, F("的朋友。", "de péngyou.")]),
        m => `${m.charAt(0).toUpperCase() + m.slice(1)} là bạn của tôi.`),
      T(w => seg(w, [FILLER.wo, FILLER.xihuan, W, F("。", "")]),
        m => `Tôi thích ${m}.`),
      T(w => seg(w, [W, FILLER.hen, F("好。", "hǎo.")]),
        m => `${m.charAt(0).toUpperCase() + m.slice(1)} rất tốt.`)
    ],
    adverb: [
      T(w => seg(w, [FILLER.ta, W, F("忙。", "máng.")]),
        m => `Anh ấy ${m} bận.`),
      T(w => seg(w, [FILLER.women, W, FILLER.qu, F("。", "")]),
        m => `Chúng tôi ${m} đi.`),
      T(w => seg(w, [FILLER.zhege, W, F("好。", "hǎo.")]),
        m => `Cái này ${m} tốt.`)
    ],
    conjunction: [
      T(w => seg(w, [FILLER.henMang, W, FILLER.meiLai, F("。", "")]),
        m => `Anh ấy rất bận, ${m} anh ấy không đến.`),
      T(w => seg(w, [FILLER.tianTaiLeng, W, FILLER.meiQu, F("。", "")]),
        m => `Trời quá lạnh, ${m} tôi không đi.`)
    ],
    preposition: [
      T(w => seg(w, [FILLER.wo, W, FILLER.beijing, F("。", "")]),
        m => `Tôi ${m} Bắc Kinh.`),
      T(w => seg(w, [FILLER.ta, W, FILLER.wo, F("说。", "shuō.")]),
        m => `Anh ấy ${m} tôi nói.`)
    ],
    particle: [
      T(w => seg(w, [FILLER.ni, F("好", "hǎo"), W, F("？", "?")]),
        m => `Bạn khoẻ ${m}?`),
      T(w => seg(w, [FILLER.wo, FILLER.chi, W, F("。", "")]),
        m => `Tôi ăn ${m}.`)
    ],
    interjection: [
      T(w => seg(w, [W, F("，你好！", ", nǐ hǎo!")]),
        m => `${m}, xin chào!`)
    ],
    phrase: [
      T(w => seg(w, [W, F("！", "!")]),
        m => `${m}!`),
      T(w => seg(w, [FILLER.ni, FILLER.keyi, F("说", "shuō"), W, F("。", "")]),
        m => `Bạn có thể nói "${m}".`)
    ],
    idiom: [
      T(w => seg(w, [FILLER.zheZhong, W, F("。", "")]),
        m => `Tình huống này có thể nói là ${m}.`),
      T(w => seg(w, [FILLER.zuoshi, W, F("。", "")]),
        m => `Anh ấy làm việc luôn ${m}.`),
      T(w => seg(w, [FILLER.lizi, W, FILLER.de2, F("。", "")]),
        m => `Đây thật là một ví dụ ${m}.`)
    ]
  };

  const TYPE_MAP = [
    [/động từ năng nguyện/i, "verb"], [/cụm động từ/i, "verb"],
    [/động từ\/danh từ/i, "verb"], [/danh từ\/động từ/i, "noun"],
    [/động từ/i, "verb"],
    [/tính từ \/ danh từ/i, "adjective"], [/tính từ/i, "adjective"],
    [/danh từ riêng/i, "noun"], [/danh từ phương vị/i, "noun"], [/danh từ/i, "noun"],
    [/số từ/i, "number"], [/lượng từ/i, "measure"],
    [/đại từ nghi vấn/i, "pronoun"], [/đại từ chỉ định/i, "pronoun"], [/đại từ/i, "pronoun"],
    [/phó từ/i, "adverb"], [/liên từ/i, "conjunction"], [/giới từ/i, "preposition"],
    [/trợ từ/i, "particle"], [/thán từ/i, "interjection"],
    [/cụm từ/i, "phrase"], [/thành ngữ/i, "idiom"]
  ];

  function bucketFor(wordType) {
    const t = wordType || "";
    for (const [re, bucket] of TYPE_MAP) if (re.test(t)) return bucket;
    return "noun"; // fallback an toàn
  }

  /* Chọn seed on định theo id/hanzi để cùng 1 từ luôn ra cùng bộ câu (khong doi khi F5) */
  function seedIndex(word, mod) {
    const s = String(word.id || word.hanzi || "x");
    let h = 0;
    for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
    return h % mod;
  }

  function HSK_getExampleSentences(word, count) {
    count = count || 3;
    if (!word || !word.hanzi) return [];
    const bucket = BUCKETS[bucketFor(word.word_type)] || BUCKETS.noun;
    const n = Math.min(count, bucket.length);
    const start = seedIndex(word, bucket.length);
    const picks = [];
    for (let i = 0; i < n; i++) picks.push(bucket[(start + i) % bucket.length]);
    return picks.map(tpl => {
      try { return tpl(word); }
      catch (e) { return null; }
    }).filter(Boolean);
  }

  window.HSK_getExampleSentences = HSK_getExampleSentences;
})();
