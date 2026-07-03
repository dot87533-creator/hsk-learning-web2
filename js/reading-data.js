/* reading-data.js — Kho bai doc luyen HSK, moi bai gom: cau truc token (hanzi/pinyin/nghia)
   theo tung cau de highlight + tooltip, ban dich, va cau hoi trac nghiem. */
(function () {
  "use strict";

  function T(h, p, m) { return { h, p, m }; }

  window.HSK_READING = [
    {
      id: "r_hsk1_family", level: "hsk1", title: "我的家", title_vi: "Gia đình tôi",
      minutes: 2,
      sentences: [
        [T("我", "wǒ", "tôi"), T("是", "shì", "là"), T("学生", "xuésheng", "học sinh"), T("。", "", "")],
        [T("我", "wǒ", "tôi"), T("有", "yǒu", "có"), T("爸爸", "bàba", "bố"), T("、", "", ""), T("妈妈", "māma", "mẹ"), T("和", "hé", "và"), T("一个", "yí gè", "một"), T("弟弟", "dìdi", "em trai"), T("。", "", "")],
        [T("爸爸", "bàba", "bố"), T("是", "shì", "là"), T("医生", "yīshēng", "bác sĩ"), T("，", "", ""), T("妈妈", "māma", "mẹ"), T("是", "shì", "là"), T("老师", "lǎoshī", "giáo viên"), T("。", "", "")],
        [T("我们", "wǒmen", "chúng tôi"), T("家", "jiā", "nhà"), T("有", "yǒu", "có"), T("一只", "yì zhī", "một con"), T("猫", "māo", "mèo"), T("。", "", "")],
        [T("我", "wǒ", "tôi"), T("很", "hěn", "rất"), T("爱", "ài", "yêu"), T("我的", "wǒ de", "của tôi"), T("家", "jiā", "gia đình"), T("。", "", "")]
      ],
      translation_vi: "Tôi là học sinh. Tôi có bố, mẹ và một em trai. Bố là bác sĩ, mẹ là giáo viên. Nhà tôi có một con mèo. Tôi rất yêu gia đình của mình.",
      questions: [
        { q: "\"Tôi\" trong bài là ai / làm gì?", options: ["Bác sĩ", "Học sinh", "Giáo viên", "Y tá"], correct: 1 },
        { q: "Bố của nhân vật làm nghề gì?", options: ["Bác sĩ", "Giáo viên", "Học sinh", "Công nhân"], correct: 0 },
        { q: "Gia đình nuôi con vật gì?", options: ["Chó", "Mèo", "Chim", "Cá"], correct: 1 },
        { q: "Nhân vật có mấy anh chị em (được nhắc tới)?", options: ["0", "1", "2", "3"], correct: 1 }
      ]
    },
    {
      id: "r_hsk1_shop", level: "hsk1", title: "在商店", title_vi: "Ở cửa hàng",
      minutes: 2,
      sentences: [
        [T("今天", "jīntiān", "hôm nay"), T("我", "wǒ", "tôi"), T("去", "qù", "đi"), T("商店", "shāngdiàn", "cửa hàng"), T("买", "mǎi", "mua"), T("东西", "dōngxi", "đồ"), T("。", "", "")],
        [T("商店里", "shāngdiàn lǐ", "trong cửa hàng"), T("有", "yǒu", "có"), T("很多", "hěn duō", "nhiều"), T("水果", "shuǐguǒ", "trái cây"), T("：", "", ""), T("苹果", "píngguǒ", "táo"), T("、", "", ""), T("香蕉", "xiāngjiāo", "chuối"), T("和", "hé", "và"), T("橙子", "chéngzi", "cam"), T("。", "", "")],
        [T("我", "wǒ", "tôi"), T("买了", "mǎi le", "đã mua"), T("三个", "sān gè", "ba (quả)"), T("苹果", "píngguǒ", "táo"), T("和", "hé", "và"), T("两个", "liǎng gè", "hai (quả)"), T("香蕉", "xiāngjiāo", "chuối"), T("。", "", "")],
        [T("苹果", "píngguǒ", "táo"), T("很", "hěn", "rất"), T("贵", "guì", "đắt"), T("，", "", ""), T("但是", "dànshì", "nhưng"), T("很", "hěn", "rất"), T("好吃", "hǎochī", "ngon"), T("。", "", "")],
        [T("我", "wǒ", "tôi"), T("也", "yě", "cũng"), T("买了", "mǎi le", "đã mua"), T("一杯", "yì bēi", "một cốc"), T("茶", "chá", "trà"), T("。", "", "")],
        [T("谢谢你", "xièxie nǐ", "cảm ơn bạn"), T("，", "", ""), T("再见", "zàijiàn", "tạm biệt"), T("！", "", "")]
      ],
      translation_vi: "Hôm nay tôi đi cửa hàng mua đồ. Trong cửa hàng có nhiều trái cây: táo, chuối và cam. Tôi mua ba quả táo và hai quả chuối. Táo khá đắt nhưng rất ngon. Tôi cũng mua một cốc trà. Cảm ơn bạn, tạm biệt!",
      questions: [
        { q: "Người kể chuyện đi đâu?", options: ["Trường học", "Cửa hàng", "Bệnh viện", "Công viên"], correct: 1 },
        { q: "Người kể mua mấy quả táo?", options: ["2", "3", "4", "5"], correct: 1 },
        { q: "Táo trong bài như thế nào?", options: ["Rẻ và dở", "Đắt nhưng ngon", "Đắt và dở", "Miễn phí"], correct: 1 },
        { q: "Ngoài trái cây, người kể còn mua gì?", options: ["Bánh", "Trà", "Sữa", "Cà phê"], correct: 1 }
      ]
    },
    {
      id: "r_hsk2_myday", level: "hsk2", title: "我的一天", title_vi: "Một ngày của tôi",
      minutes: 3,
      sentences: [
        [T("我", "wǒ", "tôi"), T("每天", "měitiān", "mỗi ngày"), T("早上", "zǎoshang", "buổi sáng"), T("七点", "qī diǎn", "7 giờ"), T("起床", "qǐchuáng", "thức dậy"), T("。", "", "")],
        [T("起床后", "qǐchuáng hòu", "sau khi thức dậy"), T("，", "", ""), T("我", "wǒ", "tôi"), T("先", "xiān", "trước tiên"), T("刷牙", "shuāyá", "đánh răng"), T("、", "", ""), T("洗脸", "xǐliǎn", "rửa mặt"), T("，", "", ""), T("然后", "ránhòu", "sau đó"), T("吃早饭", "chī zǎofàn", "ăn sáng"), T("。", "", "")],
        [T("八点", "bā diǎn", "8 giờ"), T("我", "wǒ", "tôi"), T("坐", "zuò", "đi (xe)"), T("公共汽车", "gōnggòng qìchē", "xe buýt"), T("去学校", "qù xuéxiào", "đến trường"), T("。", "", "")],
        [T("我", "wǒ", "tôi"), T("在学校", "zài xuéxiào", "ở trường"), T("学习", "xuéxí", "học"), T("汉语", "Hànyǔ", "tiếng Trung"), T("和", "hé", "và"), T("英语", "Yīngyǔ", "tiếng Anh"), T("。", "", "")],
        [T("中午", "zhōngwǔ", "buổi trưa"), T("十二点", "shí’èr diǎn", "12 giờ"), T("，", "", ""), T("我", "wǒ", "tôi"), T("和", "hé", "cùng"), T("同学们", "tóngxuémen", "các bạn học"), T("一起", "yìqǐ", "cùng nhau"), T("吃午饭", "chī wǔfàn", "ăn trưa"), T("。", "", "")],
        [T("下午", "xiàwǔ", "buổi chiều"), T("三点", "sān diǎn", "3 giờ"), T("放学", "fàngxué", "tan học"), T("以后", "yǐhòu", "sau khi"), T("，", "", ""), T("我", "wǒ", "tôi"), T("喜欢", "xǐhuan", "thích"), T("打篮球", "dǎ lánqiú", "chơi bóng rổ"), T("或者", "huòzhě", "hoặc"), T("看书", "kànshū", "đọc sách"), T("。", "", "")],
        [T("晚上", "wǎnshang", "buổi tối"), T("我", "wǒ", "tôi"), T("做作业", "zuò zuòyè", "làm bài tập"), T("，", "", ""), T("然后", "ránhòu", "sau đó"), T("睡觉", "shuìjiào", "đi ngủ"), T("。", "", "")]
      ],
      translation_vi: "Mỗi ngày tôi thức dậy lúc 7 giờ sáng. Sau khi thức dậy, tôi đánh răng, rửa mặt, rồi ăn sáng. 8 giờ tôi đi xe buýt đến trường. Ở trường tôi học tiếng Trung và tiếng Anh. 12 giờ trưa, tôi cùng các bạn ăn trưa. Sau khi tan học lúc 3 giờ chiều, tôi thích chơi bóng rổ hoặc đọc sách. Buổi tối tôi làm bài tập rồi đi ngủ.",
      questions: [
        { q: "Mấy giờ nhân vật thức dậy?", options: ["6 giờ", "7 giờ", "8 giờ", "9 giờ"], correct: 1 },
        { q: "Nhân vật đến trường bằng gì?", options: ["Đi bộ", "Xe buýt", "Xe đạp", "Ô tô"], correct: 1 },
        { q: "Ở trường, nhân vật học môn gì?", options: ["Toán và Lý", "Tiếng Trung và tiếng Anh", "Nhạc và Vẽ", "Sử và Địa"], correct: 1 },
        { q: "Sau khi tan học, nhân vật thích làm gì?", options: ["Ngủ", "Chơi bóng rổ hoặc đọc sách", "Xem tivi", "Nấu ăn"], correct: 1 }
      ]
    },
    {
      id: "r_hsk2_weekend", level: "hsk2", title: "周末", title_vi: "Cuối tuần",
      minutes: 3,
      sentences: [
        [T("星期六", "xīngqīliù", "thứ Bảy"), T("早上", "zǎoshang", "buổi sáng"), T("，", "", ""), T("天气", "tiānqì", "thời tiết"), T("很好", "hěn hǎo", "rất đẹp"), T("，", "", ""), T("我", "wǒ", "tôi"), T("和", "hé", "cùng"), T("家人", "jiārén", "người nhà"), T("一起", "yìqǐ", "cùng nhau"), T("去公园", "qù gōngyuán", "đi công viên"), T("散步", "sànbù", "đi dạo"), T("。", "", "")],
        [T("公园里", "gōngyuán lǐ", "trong công viên"), T("有", "yǒu", "có"), T("很多", "hěn duō", "nhiều"), T("花", "huā", "hoa"), T("和", "hé", "và"), T("树", "shù", "cây"), T("，", "", ""), T("也有", "yě yǒu", "cũng có"), T("一个", "yí gè", "một"), T("大湖", "dà hú", "hồ lớn"), T("。", "", "")],
        [T("我们", "wǒmen", "chúng tôi"), T("在湖边", "zài húbiān", "bên hồ"), T("拍照", "pāizhào", "chụp ảnh"), T("，", "", ""), T("还", "hái", "còn"), T("看见了", "kànjiàn le", "nhìn thấy"), T("几只", "jǐ zhī", "vài con"), T("小鸟", "xiǎo niǎo", "chim nhỏ"), T("。", "", "")],
        [T("中午", "zhōngwǔ", "buổi trưa"), T("我们", "wǒmen", "chúng tôi"), T("在", "zài", "ở"), T("公园附近", "gōngyuán fùjìn", "gần công viên"), T("的饭馆", "de fànguǎn", "nhà hàng"), T("吃饭", "chīfàn", "ăn cơm"), T("。", "", "")],
        [T("下午", "xiàwǔ", "buổi chiều"), T("我们", "wǒmen", "chúng tôi"), T("回家", "huíjiā", "về nhà"), T("休息", "xiūxi", "nghỉ ngơi"), T("，", "", ""), T("我", "wǒ", "tôi"), T("看了", "kàn le", "đã xem"), T("一部", "yí bù", "một bộ"), T("电影", "diànyǐng", "phim"), T("。", "", "")],
        [T("这个周末", "zhège zhōumò", "cuối tuần này"), T("我", "wǒ", "tôi"), T("很高兴", "hěn gāoxìng", "rất vui"), T("。", "", "")]
      ],
      translation_vi: "Sáng thứ Bảy, thời tiết rất đẹp, tôi cùng gia đình đi dạo công viên. Trong công viên có nhiều hoa và cây, còn có một hồ lớn. Chúng tôi chụp ảnh bên hồ, còn nhìn thấy vài chú chim nhỏ. Trưa chúng tôi ăn ở nhà hàng gần công viên. Chiều chúng tôi về nhà nghỉ ngơi, tôi xem một bộ phim. Cuối tuần này tôi rất vui.",
      questions: [
        { q: "Hôm đó là thứ mấy?", options: ["Thứ Sáu", "Thứ Bảy", "Chủ Nhật", "Thứ Hai"], correct: 1 },
        { q: "Buổi sáng gia đình đi đâu?", options: ["Siêu thị", "Công viên", "Trường học", "Bệnh viện"], correct: 1 },
        { q: "Trong công viên có gì?", options: ["Chỉ có cây", "Hoa, cây và hồ", "Chỉ có hồ", "Sân bóng"], correct: 1 },
        { q: "Buổi chiều nhân vật làm gì ở nhà?", options: ["Nấu ăn", "Xem phim", "Ngủ", "Đọc sách"], correct: 1 }
      ]
    },
    {
      id: "r_hsk3_friend", level: "hsk3", title: "我的朋友", title_vi: "Bạn của tôi",
      minutes: 3,
      sentences: [
        [T("我", "wǒ", "tôi"), T("有", "yǒu", "có"), T("一个", "yí gè", "một"), T("好朋友", "hǎo péngyou", "bạn tốt"), T("，", "", ""), T("他", "tā", "anh ấy"), T("叫", "jiào", "tên là"), T("小明", "Xiǎomíng", "Tiểu Minh"), T("。", "", "")],
        [T("我们", "wǒmen", "chúng tôi"), T("是", "shì", "là"), T("中学", "zhōngxué", "trung học"), T("同学", "tóngxué", "bạn học"), T("，", "", ""), T("认识", "rènshi", "quen biết"), T("已经", "yǐjīng", "đã"), T("五年了", "wǔ nián le", "năm năm rồi"), T("。", "", "")],
        [T("小明", "Xiǎomíng", "Tiểu Minh"), T("性格", "xìnggé", "tính cách"), T("很", "hěn", "rất"), T("开朗", "kāilǎng", "cởi mở"), T("，", "", ""), T("也", "yě", "cũng"), T("喜欢", "xǐhuan", "thích"), T("帮助", "bāngzhù", "giúp đỡ"), T("别人", "biérén", "người khác"), T("，", "", ""), T("所以", "suǒyǐ", "vì vậy"), T("大家", "dàjiā", "mọi người"), T("都", "dōu", "đều"), T("喜欢他", "xǐhuan tā", "thích cậu ấy"), T("。", "", "")],
        [T("他", "tā", "cậu ấy"), T("对", "duì", "đối với"), T("数学", "shùxué", "toán học"), T("很", "hěn", "rất"), T("感兴趣", "gǎn xìngqù", "hứng thú"), T("，", "", ""), T("将来", "jiānglái", "tương lai"), T("想", "xiǎng", "muốn"), T("当", "dāng", "làm"), T("一名", "yì míng", "một"), T("工程师", "gōngchéngshī", "kỹ sư"), T("。", "", "")],
        [T("每到", "měi dào", "mỗi khi đến"), T("周末", "zhōumò", "cuối tuần"), T("，", "", ""), T("我们", "wǒmen", "chúng tôi"), T("常常", "chángcháng", "thường"), T("一起", "yìqǐ", "cùng nhau"), T("打篮球", "dǎ lánqiú", "chơi bóng rổ"), T("或者", "huòzhě", "hoặc"), T("讨论", "tǎolùn", "thảo luận"), T("学习上", "xuéxí shàng", "trong học tập"), T("的问题", "de wèntí", "vấn đề"), T("。", "", "")],
        [T("虽然", "suīrán", "mặc dù"), T("我们的", "wǒmen de", "của chúng tôi"), T("兴趣", "xìngqù", "sở thích"), T("不完全一样", "bù wánquán yíyàng", "không hoàn toàn giống nhau"), T("，", "", ""), T("但是", "dànshì", "nhưng"), T("我们的", "wǒmen de", "của chúng tôi"), T("友谊", "yǒuyì", "tình bạn"), T("一直", "yìzhí", "luôn luôn"), T("没有变", "méiyǒu biàn", "không thay đổi"), T("。", "", "")],
        [T("我觉得", "wǒ juéde", "tôi cảm thấy"), T("有", "yǒu", "có"), T("这样", "zhèyàng", "như vậy"), T("一个朋友", "yí gè péngyou", "một người bạn"), T("是", "shì", "là"), T("一件", "yí jiàn", "một việc"), T("很幸福", "hěn xìngfú", "rất hạnh phúc"), T("的事情", "de shìqing", "sự việc"), T("。", "", "")]
      ],
      translation_vi: "Tôi có một người bạn tốt, tên là Tiểu Minh. Chúng tôi là bạn học cấp hai, quen biết đã năm năm rồi. Tiểu Minh tính cách rất cởi mở, cũng thích giúp đỡ người khác, nên mọi người đều quý cậu ấy. Cậu ấy rất hứng thú với môn Toán, sau này muốn trở thành kỹ sư. Mỗi cuối tuần, chúng tôi thường cùng nhau chơi bóng rổ hoặc thảo luận vấn đề học tập. Mặc dù sở thích của chúng tôi không hoàn toàn giống nhau, nhưng tình bạn của chúng tôi vẫn không thay đổi. Tôi cảm thấy có một người bạn như vậy là một điều rất hạnh phúc.",
      questions: [
        { q: "Bạn của nhân vật tên gì?", options: ["Tiểu Minh", "Tiểu Hồng", "Tiểu Lý", "Tiểu Vương"], correct: 0 },
        { q: "Họ quen nhau được bao lâu?", options: ["2 năm", "3 năm", "5 năm", "10 năm"], correct: 2 },
        { q: "Tiểu Minh hứng thú với môn gì?", options: ["Văn học", "Toán học", "Âm nhạc", "Thể thao"], correct: 1 },
        { q: "Tiểu Minh muốn làm nghề gì trong tương lai?", options: ["Bác sĩ", "Giáo viên", "Kỹ sư", "Ca sĩ"], correct: 2 }
      ]
    },
    {
      id: "r_hsk4_travel", level: "hsk4", title: "旅行计划", title_vi: "Kế hoạch du lịch",
      minutes: 4,
      sentences: [
        [T("这个暑假", "zhège shǔjià", "kỳ nghỉ hè này"), T("，", "", ""), T("我", "wǒ", "tôi"), T("打算", "dǎsuàn", "dự định"), T("和朋友一起", "hé péngyou yìqǐ", "cùng bạn bè"), T("去", "qù", "đi"), T("云南", "Yúnnán", "Vân Nam"), T("旅行", "lǚxíng", "du lịch"), T("。", "", "")],
        [T("我们", "wǒmen", "chúng tôi"), T("已经", "yǐjīng", "đã"), T("提前", "tíqián", "trước"), T("订了", "dìng le", "đặt"), T("机票", "jīpiào", "vé máy bay"), T("和", "hé", "và"), T("酒店", "jiǔdiàn", "khách sạn"), T("，", "", ""), T("计划", "jìhuà", "dự định"), T("在那里", "zài nàlǐ", "ở đó"), T("待", "dāi", "ở lại"), T("一个星期", "yí gè xīngqī", "một tuần"), T("。", "", "")],
        [T("云南的", "Yúnnán de", "của Vân Nam"), T("风景", "fēngjǐng", "phong cảnh"), T("非常美丽", "fēicháng měilì", "rất đẹp"), T("，", "", ""), T("尤其是", "yóuqí shì", "đặc biệt là"), T("大理", "Dàlǐ", "Đại Lý"), T("和", "hé", "và"), T("丽江", "Lìjiāng", "Lệ Giang"), T("，", "", ""), T("那里", "nàlǐ", "ở đó"), T("有", "yǒu", "có"), T("古老的建筑", "gǔlǎo de jiànzhù", "kiến trúc cổ"), T("和", "hé", "và"), T("独特的", "dútè de", "độc đáo"), T("少数民族文化", "shǎoshù mínzú wénhuà", "văn hóa dân tộc thiểu số"), T("。", "", "")],
        [T("除了", "chúle", "ngoài"), T("欣赏风景", "xīnshǎng fēngjǐng", "ngắm cảnh"), T("，", "", ""), T("我们", "wǒmen", "chúng tôi"), T("还想", "hái xiǎng", "còn muốn"), T("尝尝", "chángchang", "nếm thử"), T("当地的", "dāngdì de", "địa phương"), T("特色小吃", "tèsè xiǎochī", "món ăn vặt đặc sản"), T("。", "", "")],
        [T("虽然", "suīrán", "mặc dù"), T("旅行", "lǚxíng", "du lịch"), T("需要", "xūyào", "cần"), T("花不少钱", "huā bùshǎo qián", "tốn khá nhiều tiền"), T("，", "", ""), T("但是", "dànshì", "nhưng"), T("我", "wǒ", "tôi"), T("相信", "xiāngxìn", "tin rằng"), T("这次经历", "zhè cì jīnglì", "chuyến trải nghiệm này"), T("一定会", "yídìng huì", "chắc chắn sẽ"), T("让我们", "ràng wǒmen", "khiến chúng tôi"), T("终身难忘", "zhōngshēn nánwàng", "nhớ mãi suốt đời"), T("。", "", "")]
      ],
      translation_vi: "Kỳ nghỉ hè này, tôi dự định cùng bạn bè đi du lịch Vân Nam. Chúng tôi đã đặt trước vé máy bay và khách sạn, dự định ở đó một tuần. Phong cảnh Vân Nam vô cùng đẹp, đặc biệt là Đại Lý và Lệ Giang, ở đó có kiến trúc cổ và văn hóa dân tộc thiểu số độc đáo. Ngoài ngắm cảnh, chúng tôi còn muốn nếm thử các món ăn vặt đặc sản địa phương. Mặc dù du lịch cần tốn khá nhiều tiền, nhưng tôi tin rằng chuyến đi này chắc chắn sẽ khiến chúng tôi nhớ mãi suốt đời.",
      questions: [
        { q: "Nhân vật dự định đi du lịch ở đâu?", options: ["Bắc Kinh", "Vân Nam", "Thượng Hải", "Tứ Xuyên"], correct: 1 },
        { q: "Họ dự định ở lại bao lâu?", options: ["3 ngày", "1 tuần", "2 tuần", "1 tháng"], correct: 1 },
        { q: "Hai địa điểm nào được nhắc đến là đặc biệt đẹp?", options: ["Bắc Kinh, Thượng Hải", "Đại Lý, Lệ Giang", "Quế Lâm, Tây An", "Tô Châu, Hàng Châu"], correct: 1 },
        { q: "Ngoài ngắm cảnh, họ còn muốn làm gì?", options: ["Mua sắm", "Nếm đặc sản địa phương", "Học tiếng địa phương", "Leo núi"], correct: 1 }
      ]
    },
    {
      id: "r_hsk5_env", level: "hsk5", title: "环境保护", title_vi: "Bảo vệ môi trường",
      minutes: 5,
      sentences: [
        [T("随着", "suízhe", "cùng với"), T("经济的", "jīngjì de", "kinh tế"), T("快速发展", "kuàisù fāzhǎn", "phát triển nhanh"), T("，", "", ""), T("环境污染", "huánjìng wūrǎn", "ô nhiễm môi trường"), T("问题", "wèntí", "vấn đề"), T("越来越", "yuèláiyuè", "ngày càng"), T("受到", "shòudào", "nhận được"), T("人们的关注", "rénmen de guānzhù", "sự quan tâm của mọi người"), T("。", "", "")],
        [T("空气污染", "kōngqì wūrǎn", "ô nhiễm không khí"), T("、", "", ""), T("水污染", "shuǐ wūrǎn", "ô nhiễm nước"), T("和", "hé", "và"), T("垃圾处理不当", "lājī chǔlǐ búdàng", "xử lý rác không đúng cách"), T("，", "", ""), T("都", "dōu", "đều"), T("严重影响", "yánzhòng yǐngxiǎng", "ảnh hưởng nghiêm trọng"), T("着我们的", "zhe wǒmen de", "đến của chúng ta"), T("生活质量", "shēnghuó zhìliàng", "chất lượng cuộc sống"), T("。", "", "")],
        [T("为了保护环境", "wèile bǎohù huánjìng", "để bảo vệ môi trường"), T("，", "", ""), T("越来越多的", "yuèláiyuè duō de", "ngày càng nhiều"), T("城市", "chéngshì", "thành phố"), T("开始", "kāishǐ", "bắt đầu"), T("推广", "tuīguǎng", "triển khai"), T("垃圾分类", "lājī fēnlèi", "phân loại rác"), T("，", "", ""), T("鼓励", "gǔlì", "khuyến khích"), T("市民", "shìmín", "người dân"), T("减少使用", "jiǎnshǎo shǐyòng", "giảm sử dụng"), T("一次性塑料制品", "yícìxìng sùliào zhìpǐn", "đồ nhựa dùng một lần"), T("。", "", "")],
        [T("同时", "tóngshí", "đồng thời"), T("，", "", ""), T("政府", "zhèngfǔ", "chính phủ"), T("也", "yě", "cũng"), T("加大了", "jiādà le", "tăng cường"), T("对新能源产业", "duì xīn néngyuán chǎnyè", "đối với ngành năng lượng mới"), T("的支持力度", "de zhīchí lìdù", "mức độ hỗ trợ"), T("，", "", ""), T("希望", "xīwàng", "hy vọng"), T("通过", "tōngguò", "thông qua"), T("发展清洁能源", "fāzhǎn qīngjié néngyuán", "phát triển năng lượng sạch"), T("来减少", "lái jiǎnshǎo", "để giảm"), T("碳排放", "tàn páifàng", "phát thải carbon"), T("。", "", "")],
        [T("每个人的力量", "měi gè rén de lìliang", "sức mạnh mỗi người"), T("也许很小", "yěxǔ hěn xiǎo", "có lẽ rất nhỏ"), T("，", "", ""), T("但是", "dànshì", "nhưng"), T("只要", "zhǐyào", "chỉ cần"), T("大家", "dàjiā", "mọi người"), T("共同努力", "gòngtóng nǔlì", "cùng nỗ lực"), T("，", "", ""), T("就一定能够", "jiù yídìng nénggòu", "thì chắc chắn có thể"), T("为地球", "wèi dìqiú", "cho Trái Đất"), T("创造", "chuàngzào", "tạo ra"), T("一个更美好的未来", "yí gè gèng měihǎo de wèilái", "một tương lai tốt đẹp hơn"), T("。", "", "")]
      ],
      translation_vi: "Cùng với sự phát triển nhanh chóng của kinh tế, vấn đề ô nhiễm môi trường ngày càng được quan tâm. Ô nhiễm không khí, ô nhiễm nước và xử lý rác không đúng cách đều ảnh hưởng nghiêm trọng đến chất lượng cuộc sống. Để bảo vệ môi trường, ngày càng nhiều thành phố triển khai phân loại rác, khuyến khích người dân giảm dùng đồ nhựa một lần. Đồng thời, chính phủ cũng tăng cường hỗ trợ ngành năng lượng mới, hy vọng qua phát triển năng lượng sạch để giảm phát thải carbon. Sức mạnh mỗi người có lẽ nhỏ bé, nhưng chỉ cần mọi người cùng nỗ lực, chắc chắn sẽ tạo ra một tương lai tốt đẹp hơn cho Trái Đất.",
      questions: [
        { q: "Bài đọc chủ yếu nói về vấn đề gì?", options: ["Giáo dục", "Ô nhiễm môi trường", "Kinh tế", "Y tế"], correct: 1 },
        { q: "Các thành phố khuyến khích người dân làm gì?", options: ["Dùng nhiều nhựa hơn", "Giảm dùng đồ nhựa một lần", "Không phân loại rác", "Đốt rác"], correct: 1 },
        { q: "Chính phủ tăng hỗ trợ ngành nào để giảm phát thải carbon?", options: ["Năng lượng mới", "Thời trang", "Du lịch", "Nông nghiệp"], correct: 0 },
        { q: "Theo bài, để tạo tương lai tốt đẹp hơn cần điều gì?", options: ["Chỉ chính phủ hành động", "Mọi người cùng nỗ lực", "Không cần làm gì", "Chỉ doanh nghiệp lớn hành động"], correct: 1 }
      ]
    },
    {
      id: "r_hsk6_tech", level: "hsk6", title: "科技与生活", title_vi: "Công nghệ và cuộc sống",
      minutes: 5,
      sentences: [
        [T("近几十年来", "jìn jǐshí nián lái", "vài chục năm gần đây"), T("，", "", ""), T("科技的", "kējì de", "của khoa học công nghệ"), T("飞速发展", "fēisù fāzhǎn", "phát triển vũ bão"), T("深刻地改变了", "shēnkè de gǎibiàn le", "đã thay đổi sâu sắc"), T("人们的", "rénmen de", "của con người"), T("生活方式", "shēnghuó fāngshì", "phương thức sống"), T("。", "", "")],
        [T("智能手机", "zhìnéng shǒujī", "điện thoại thông minh"), T("、", "", ""), T("互联网", "hùliánwǎng", "internet"), T("和", "hé", "và"), T("人工智能的", "réngōng zhìnéng de", "trí tuệ nhân tạo"), T("出现", "chūxiàn", "sự xuất hiện"), T("，", "", ""), T("让", "ràng", "khiến"), T("信息的", "xìnxī de", "thông tin"), T("获取和交流", "huòqǔ hé jiāoliú", "tiếp nhận và trao đổi"), T("变得", "biàn dé", "trở nên"), T("前所未有地", "qiánsuǒwèiyǒu de", "chưa từng có"), T("便捷", "biànjié", "thuận tiện"), T("。", "", "")],
        [T("我们", "wǒmen", "chúng ta"), T("可以", "kěyǐ", "có thể"), T("足不出户", "zúbùchūhù", "không cần ra khỏi nhà"), T("就", "jiù", "là"), T("完成", "wánchéng", "hoàn thành"), T("购物", "gòuwù", "mua sắm"), T("、", "", ""), T("学习", "xuéxí", "học tập"), T("甚至", "shènzhì", "thậm chí"), T("工作", "gōngzuò", "công việc"), T("。", "", "")],
        [T("然而", "rán’ér", "tuy nhiên"), T("，", "", ""), T("科技的进步", "kējì de jìnbù", "sự tiến bộ của công nghệ"), T("也", "yě", "cũng"), T("带来了", "dàilái le", "mang đến"), T("一些", "yìxiē", "một số"), T("值得深思的问题", "zhídé shēnsī de wèntí", "vấn đề đáng suy ngẫm"), T("，", "", ""), T("比如", "bǐrú", "ví dụ như"), T("个人隐私的泄露", "gèrén yǐnsī de xièlù", "rò rỉ quyền riêng tư cá nhân"), T("、", "", ""), T("人与人之间", "rén yǔ rén zhījiān", "giữa người với người"), T("面对面交流的减少", "miànduìmiàn jiāoliú de jiǎnshǎo", "giảm giao tiếp trực tiếp"), T("。", "", "")],
        [T("如何", "rúhé", "làm thế nào"), T("在享受科技便利的同时", "zài xiǎngshòu kējì biànlì de tóngshí", "vừa tận hưởng tiện lợi công nghệ"), T("，", "", ""), T("保持", "bǎochí", "duy trì"), T("健康的生活方式", "jiànkāng de shēnghuó fāngshì", "lối sống lành mạnh"), T("和", "hé", "và"), T("人际关系", "rénjì guānxì", "mối quan hệ giữa người với người"), T("，", "", ""), T("已经成为", "yǐjīng chéngwéi", "đã trở thành"), T("现代社会", "xiàndài shèhuì", "xã hội hiện đại"), T("每个人", "měi gè rén", "mỗi người"), T("都需要思考的", "dōu xūyào sīkǎo de", "đều cần suy nghĩ"), T("课题", "kètí", "đề tài"), T("。", "", "")]
      ],
      translation_vi: "Trong vài chục năm gần đây, sự phát triển vũ bão của công nghệ đã thay đổi sâu sắc phương thức sống của con người. Sự xuất hiện của điện thoại thông minh, internet và trí tuệ nhân tạo khiến việc tiếp nhận và trao đổi thông tin trở nên thuận tiện chưa từng có. Chúng ta có thể không cần ra khỏi nhà mà vẫn hoàn thành mua sắm, học tập thậm chí công việc. Tuy nhiên, sự tiến bộ của công nghệ cũng mang đến một số vấn đề đáng suy ngẫm, ví dụ như rò rỉ quyền riêng tư cá nhân, sự giảm sút giao tiếp trực tiếp giữa người với người. Làm thế nào để vừa tận hưởng tiện lợi công nghệ vừa duy trì lối sống lành mạnh và các mối quan hệ, đã trở thành đề tài mà mỗi người trong xã hội hiện đại đều cần suy nghĩ.",
      questions: [
        { q: "Bài đọc chủ yếu nói về điều gì?", options: ["Lịch sử Trung Quốc", "Ảnh hưởng của công nghệ đến cuộc sống", "Kinh tế toàn cầu", "Giáo dục đại học"], correct: 1 },
        { q: "Công nghệ giúp con người làm gì mà không cần ra khỏi nhà?", options: ["Chỉ xem phim", "Mua sắm, học tập, làm việc", "Chỉ ngủ", "Chỉ nấu ăn"], correct: 1 },
        { q: "Vấn đề nào được nhắc đến như mặt trái của công nghệ?", options: ["Giá thực phẩm tăng", "Rò rỉ quyền riêng tư cá nhân", "Thiếu nước sạch", "Ùn tắc giao thông"], correct: 1 },
        { q: "Theo bài, con người hiện đại cần suy nghĩ về điều gì?", options: ["Chỉ kiếm nhiều tiền hơn", "Cân bằng tiện lợi công nghệ và lối sống lành mạnh", "Từ bỏ công nghệ hoàn toàn", "Không cần thay đổi gì"], correct: 1 }
      ]
    }
  ];

  window.HSK_READING_getByLevel = function (level) {
    return window.HSK_READING.filter(r => level === "all" || r.level === level);
  };
  window.HSK_READING_getById = function (id) {
    return window.HSK_READING.find(r => r.id === id) || null;
  };
})();
