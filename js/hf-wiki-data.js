/* ============================================================
 * hf-wiki-data.js
 * ------------------------------------------------------------
 * 華梵禮儀百科（Wiki） — 共用資料層
 * （程式邏輯仿照視丘 Fotosoft insights-data.js）
 *
 * 頁面使用：
 *   <script src="js/hf-wiki-data.js"></script>
 *   const list = WikiStore.getAll();
 *   const post = WikiStore.getById('etiquette');
 *
 * 資料模型 (WikiArticle)：
 *   {
 *     id:            string   // URL slug，唯一識別
 *     title:         string
 *     subtitle:      string
 *     publishedDate: string   // 'YYYY-MM-DD'
 *     coverImage:    string   // 卡片封面 + 詳細頁 hero；未填會 fallback 到圖庫
 *     icon:          string   // Font Awesome class（釘選文章目錄用）
 *     categories:    string[]
 *     tags:          string[]
 *     summary:       string   // 卡片摘要（若空會自動由 blocks 抽首段）
 *     featured:      boolean  // 精選標記（卡片顯示「精選」徽章）
 *     pinned:        boolean  // 釘選文章（顯示於目錄卡，詳細頁走 wiki_top-detail.html）
 *     pinnedOrder:   number   // 釘選排序（小 → 大）
 *     blocks: Block[]         // 內文區塊，順序即呈現順序
 *     createdAt:     number
 *     updatedAt:     number
 *   }
 *
 * Block（一般文章 wiki_base-detail.html 支援）：
 *   { type: 'heading',   level: 2|3,      text: string }
 *   { type: 'paragraph', text: string }                 // 允許 \n\n 分段
 *   { type: 'quote',     text: string,    cite?: string }
 *   { type: 'image',     src: string,     caption?: string, alt?: string, size?: 'large'|'small' }
 *   { type: 'divider' }
 *
 * 釘選文章（wiki_top-detail.html）額外支援的複合區塊：
 *   { type: 'accordion', items: [{ title, html, open? }] }              // 展開式問答
 *   { type: 'cards',     cols: 2|3, items: [{ icon?, num?, title, html, href? }] }
 *   { type: 'actions',   items: [{ title, html, href, label }] }        // 附按鈕的橫列卡
 *   { type: 'note',      tone: 'gold'|'red', html: string }             // 提示框
 *   { type: 'html',      html: string }                                 // 自由 HTML
 * ============================================================ */

(function (global) {
  'use strict';

  const STORAGE_KEY = 'HUAFAN_WIKI_V1';
  const EVENT_NAME  = 'huafan:wiki-updated';
  const REMOTE_JSON = 'wiki-data.json';

  /* 圖庫：未指定封面時，用 id 做雜湊挑一張作為 fallback（皆為站內既有圖片） */
  const FALLBACK_COVERS = [
    '/HuaFan/image/index/花.webp',
    '/HuaFan/image/index/樹葬1.webp',
    '/HuaFan/image/index/彌撒.webp',
    '/HuaFan/image/index/華梵會館.webp',
    '/HuaFan/image/index/啟靈.webp',
    '/HuaFan/image/index/辭生.webp'
  ];

  const DEFAULT_CATEGORIES = [
    '弔唁禮節','宗教葬儀','葬式知識','習俗祭祀','補助權益','契約消費','交通資訊'
  ];

  /* ---------- 預設種子資料 ---------- */
  /* 釘選文章：完整移植原 wiki.html 七大條目內容 */
  const PINNED_ARTICLES = [
    {
      id: 'etiquette',
      title: '弔唁禮節須知',
      subtitle: '參加告別式前，先了解這些基本禮節，讓心意得體表達',
      publishedDate: '2026-07-07',
      coverImage: '/HuaFan/image/index/花.webp',
      icon: 'fa-solid fa-user-tie',
      categories: ['弔唁禮節'],
      tags: ['服裝儀容','奠儀','公奠','拈香'],
      summary: '服裝儀容、奠儀（白包）禮節、公奠與拈香──參加告別式前，先了解這些基本禮節，讓心意得體表達。',
      featured: true, pinned: true, pinnedOrder: 1,
      blocks: [
        { type: 'paragraph', text: '參加告別式前，先了解這些基本禮節，讓心意得體表達。' },
        { type: 'accordion', items: [
          { title: '服裝儀容', open: true, html: '<p>參加喪禮請著<strong>深色、偏寒色調素服</strong>為宜，儀容清爽、略施薄妝即可，不宜過度妝扮，不穿拖鞋，尤忌蓬首垢面。</p><p><strong>胸花／黃絲帶佩戴：</strong>奠禮會場備有胸花或黃絲帶，以逝者性別區分佩戴方向──逝者為男性別於<strong>左胸</strong>，逝者為女性別於<strong>右胸</strong>，約鎖骨下一掌距離。</p><p><strong>進場禮節：</strong>進入會場請輕步低聲、態度肅穆莊重，並將手機調為震動或關機。</p><p><strong>禮成離場：</strong>靈柩送出後，與親友<strong>不互道「再見」、「再會」</strong>，即「不要再辦喪事」之意。</p>' },
          { title: '奠儀（白包）禮節', html: '<p>「奠儀」又稱「香儀」、「香奠」、「楮敬」，是致送供奠物品的統稱，現多指向逝者行奠並慰問生者的禮金。</p><p><strong>金額：</strong>以<strong>單數</strong>計，如 $1,100、$2,100……，以白色封袋盛裝。</p><p><strong>署名格式：</strong>香奠袋於會場多有供應，請以正楷署名。上款為哀悼逝者之詞（如「○○先生千古」、「○○女士仙逝」），下款為致意者落款（如「○○○敬弔」、「○○○敬輓」）。</p><p><strong>中款題詞參考：</strong>通用──「往登淨土」、「音容宛在」、「世德流芳」；男用──「駕鶴西歸」、「德邵年高」；女用──「馭鶴仙去」、「懿訓猶存」、「彤管流芳」。</p>' },
          { title: '公奠與拈香', html: '<p><strong>填寫公奠單：</strong>參與公奠之單位請於會場受賻處填寫「公奠單」，推選一名主奠，註明公奠單位、主奠者姓名與職銜，交予工作人員後靜待司儀唱名。以個人名義參加者，可於單位公奠後自由拈香致意。</p><p><strong>團體奠拜：</strong>主奠者站最前，其他成員於後排列隨行；獻香、獻花時隨行者行注目禮，最後與主奠者一同向逝者行鞠躬禮。</p><p><strong>拿香禮節：</strong>右手握香、左手包右手。男舉香雙手上不過眉、下不過腰；女舉香上不過顎、下不過腰，雙眼向逝者行注目禮。</p><p><strong>拈香禮：</strong>先於主奠位行一鞠躬禮，向前至祭壇以右手拇指、食指、中指拈起少許香末提至眉心，行注目禮後放回香器，退回主奠位再行鞠躬禮，由襄儀引導家屬答禮後復位。</p><p><strong>家屬答禮：</strong>拜奠完畢，襄儀會引導家屬答禮──左側男眷先、右側女眷後；退場請依襄儀指示方向復位。若時間許可，誠摯建議全程觀禮，這可能是您最後一次向逝者致意。</p>' }
        ]}
      ]
    },
    {
      id: 'religions',
      title: '宗教與葬儀',
      subtitle: '不同信仰有不同的告別方式，華梵尊重每個家庭的宗教與價值選擇',
      publishedDate: '2026-07-06',
      coverImage: '/HuaFan/image/index/彌撒.webp',
      icon: 'fa-solid fa-hands-praying',
      categories: ['宗教葬儀'],
      tags: ['佛教','道教','基督宗教'],
      summary: '佛教、道教與基督宗教的葬儀特色與精神──不同信仰有不同的告別方式，華梵尊重每個家庭的宗教與價值選擇。',
      featured: false, pinned: true, pinnedOrder: 2,
      blocks: [
        { type: 'paragraph', text: '不同信仰有不同的告別方式，華梵尊重每個家庭的宗教與價值選擇。' },
        { type: 'cards', cols: 3, items: [
          { icon: 'fa-solid fa-dharmachakra', title: '佛教葬儀', html: '<p>佛教認為死亡可以是輪迴的開始，也可以是解脫的來臨。主張葬儀<strong>簡單、隆重</strong>即可；靈前不宜用葷腥祭祀，宜以香花、素食、蔬果供養，並可將奠儀所餘供養三寶、弘法利生，將功德迴向亡者。</p>' },
          { icon: 'fa-solid fa-yin-yang', title: '道教葬儀', html: '<p>道教講求煉度「薦亡」，強調超拔渡化的儀式。臺灣道教為喪家所做的功德以課誦經懺為主，如誦「度人經」、「太上三元慈悲滅罪水懺」等，透過「給牒」、「過橋」象徵亡魂獲得超拔，不致沉淪。</p>' },
          { icon: 'fa-solid fa-cross', title: '基督宗教葬儀', html: '<p>天主教以殯葬彌撒（追思彌撒）為核心，基督教則以安息禮拜送別，由神父或牧師主禮，透過經文、詩歌與追思，將逝者交託於信仰的盼望中。儀式莊嚴安靜，一般不設香案、不燒紙錢，親友以獻花與禱告致意。</p>' }
        ]}
      ]
    },
    {
      id: 'burials',
      title: '葬式知識',
      subtitle: '從傳統土葬、火化晉塔到環保自然葬，了解各種安葬方式',
      publishedDate: '2026-07-05',
      coverImage: '/HuaFan/image/index/樹葬1.webp',
      icon: 'fa-solid fa-leaf',
      categories: ['葬式知識'],
      tags: ['火葬','土葬','樹葬','海葬'],
      summary: '火化晉塔、土葬、環保自然葬（樹葬・海葬）與水葬的歷史知識──了解各種安葬方式，做出合適的選擇。',
      featured: true, pinned: true, pinnedOrder: 3,
      blocks: [
        { type: 'paragraph', text: '從傳統土葬、火化晉塔到環保自然葬，了解各種安葬方式。' },
        { type: 'accordion', items: [
          { title: '火葬（火化晉塔）', open: true, html: '<p>火化後晉塔是目前臺灣最普遍的安葬方式。火葬在我國歷史悠久，《墨子．節葬》即有記載，漢代以後隨佛教東傳而漸盛，唐宋民間已多有奉行。</p><p>現代火葬因經濟、衛生、節約土地等因素成為主流。火化後骨灰可安奉於納骨塔（晉塔）、或選擇樹葬、海葬等環保自然葬。華梵可協助安排火化時程、選塔與晉塔儀式。</p>' },
          { title: '土葬', html: '<p>土葬是我國傳統喪葬儀式，源自「入土為安」的觀念──以農立國的漢民族視土地為生命之本，認為人死後埋葬於土中，是靈魂得以安息的最好所在。</p><p>方法為以棺木盛屍、挖葬穴深埋土中、以土丘為標記。現行土葬須於<strong>公墓</strong>內為之，並向殯葬主管機關申請，相關規定可洽各縣市生命禮儀（殯葬）管理處。</p>' },
          { title: '環保自然葬（樹葬・海葬）', html: '<p>環保自然葬讓生命回歸自然──<strong>樹葬</strong>將骨灰研磨後埋藏於樹木根部；<strong>海葬</strong>則將骨灰拋灑於政府劃定海域，化作春泥更護花。</p><p>華梵禮儀是台中市政府<strong>聯合奠祭、聯合海葬</strong>的重要協辦廠商，經驗豐富。臺中市亦提供多處樹葬園區與定期聯合海葬場次，詳情可洽華梵或參考 <a href="https://mortuary.taichung.gov.tw/" target="_blank" rel="noopener">臺中市殯葬資訊服務網 <i class="fa-solid fa-arrow-up-right-from-square"></i></a>。</p>' },
          { title: '水葬（歷史知識）', html: '<p>水葬在我國尚不多見，是古代南方部分少數民族（主要為康藏）的喪葬形式，一般由喇嘛誦經後將逝者遺體投入水中。奉行此葬式的民族多生活於深谷大河之畔，視江河為生命的起點與歸宿。</p><p>因易污染水源等因素，歷代均力求革除，水葬之法已逐漸廢棄不用。今日合法的「海葬」係指火化後將<strong>骨灰</strong>拋灑於指定海域，與傳統水葬不同。</p>' }
        ]}
      ]
    },
    {
      id: 'memorial',
      title: '百日・對年・合爐',
      subtitle: '後續祭祀的重要日子與意義',
      publishedDate: '2026-07-04',
      coverImage: '/HuaFan/image/index/辭生.webp',
      icon: 'fa-regular fa-calendar-check',
      categories: ['習俗祭祀'],
      tags: ['做七','百日','對年','合爐'],
      summary: '頭七做七、百日、對年、合爐──後續祭祀的重要日子與意義，並附日期快速推算工具連結。',
      featured: false, pinned: true, pinnedOrder: 4,
      blocks: [
        { type: 'html', html: '<p>後續祭祀的重要日子與意義。想快速推算日期，可使用 <a href="faq.html#calculator">百日對年計算器 →</a></p>' },
        { type: 'cards', cols: 2, items: [
          { num: '01', title: '頭七・做七', html: '<p>自往生日起每七日為一個「七」，共七個七（四十九日）。「頭七」為第一個七日，傳統上認為亡魂於此日返家，家屬會誦經祭拜。現代常視治喪時程將做七儀式合併簡化。</p>' },
          { num: '02', title: '百日', html: '<p>往生後第一百日的祭祀，表達百日思念之情。一般以往生日為第一天往後推算；部分地區習俗會依子孫人數「扣日」，實際日期建議與禮儀師確認。</p>' },
          { num: '03', title: '對年', html: '<p>往生後滿一週年的祭祀（又稱小祥），傳統以<strong>農曆</strong>同月同日計算；若遇閏月則有提前一個月之習俗。對年當日祭拜後，服喪期間的相關禁忌多告一段落。</p>' },
          { num: '04', title: '合爐', html: '<p>將逝者的魂帛火化、名字寫入祖先牌位，香爐灰併入祖先爐中，象徵正式成為祖先、與歷代祖先一同接受祭祀。多於對年後擇吉日辦理，日期由家屬與禮儀師或擇日師商定。</p>' }
        ]}
      ]
    },
    {
      id: 'subsidy',
      title: '喪葬補助申請',
      subtitle: '依逝者投保身分不同，家屬可申請的給付也不同',
      publishedDate: '2026-07-03',
      coverImage: '/HuaFan/image/index/華梵會館.webp',
      icon: 'fa-solid fa-hand-holding-dollar',
      categories: ['補助權益'],
      tags: ['勞保','國民年金','農保','喪葬津貼'],
      summary: '勞保、國民年金、農保的喪葬津貼與死亡給付申請管道整理──華梵禮儀師會主動協助家屬確認可申請的項目。',
      featured: false, pinned: true, pinnedOrder: 5,
      blocks: [
        { type: 'paragraph', text: '依逝者投保身分不同，家屬可申請的給付也不同。以下整理官方申請管道，華梵禮儀師也會主動協助家屬確認可申請的項目。' },
        { type: 'actions', items: [
          { title: '勞保 喪葬津貼／死亡給付', html: '<p>被保險人本人或其家屬死亡，可依規定請領喪葬津貼（本人死亡另有遺屬年金或遺屬津貼）。請領有期限，建議儘早辦理。</p>', href: 'https://www.bli.gov.tw/0004840.html', label: '勞保局官網' },
          { title: '國民年金 喪葬給付', html: '<p>國保被保險人死亡，支出殯葬費者可申請喪葬給付（5 個月投保金額）。申請資格、金額與應備文件詳見勞保局說明。</p>', href: 'https://www.bli.gov.tw/0014359.html', label: '申請說明' },
          { title: '農保 喪葬津貼', html: '<p>農保被保險人死亡，由支出殯葬費者請領喪葬津貼（15 個月投保金額）。</p>', href: 'https://www.bli.gov.tw/0006759.html', label: '申請說明' }
        ]},
        { type: 'note', tone: 'gold', html: '<i class="fa-solid fa-circle-info"></i> 另有低收入戶喪葬補助、軍公教遺族給付等，依身分與各縣市規定不同。治喪期間資料繁雜，華梵禮儀師會協助家屬盤點可申請項目與應備文件，歡迎來電 <a href="tel:0800800818">0800-800-818</a> 詢問。' }
      ]
    },
    {
      id: 'contracts',
      title: '契約與消費權益',
      subtitle: '簽約前先了解自己的權益，華梵全面採用內政部定型化契約',
      publishedDate: '2026-07-02',
      coverImage: '/HuaFan/image/preneed/preneed_hero.webp',
      icon: 'fa-solid fa-file-signature',
      categories: ['契約消費'],
      tags: ['定型化契約','信託','合法業者'],
      summary: '殯葬定型化契約範本、合法業者查詢、信託查詢與消費申訴管道──簽約前先了解自己的權益。',
      featured: false, pinned: true, pinnedOrder: 6,
      blocks: [
        { type: 'paragraph', text: '簽約前先了解自己的權益。以下皆為政府官方資源，華梵全面採用內政部定型化契約。' },
        { type: 'cards', cols: 2, items: [
          { icon: 'fa-solid fa-file-contract', title: '殯葬定型化契約範本下載', href: 'https://www.moi.gov.tw/cl.aspx?n=81', html: '<p>內政部公告之「殯葬服務定型化契約」、「生前殯葬服務定型化契約（自用型／家用型）」範本與應記載事項。</p>' },
          { icon: 'fa-solid fa-gavel', title: '合法殯葬業者查詢', href: 'https://mort.moi.gov.tw/', html: '<p>內政部全國殯葬資訊入口網──查詢合法殯葬禮儀服務業者、生前契約業者與殯葬設施。</p>' },
          { icon: 'fa-solid fa-city', title: '臺中市合法業者名冊', href: 'https://mortuary.taichung.gov.tw/Frontend/Morticianlist.aspx', html: '<p>臺中市殯葬資訊服務網（生命禮儀管理處）──臺中市合法殯葬禮儀業者與殯葬設施查詢。</p>' },
          { icon: 'fa-solid fa-building-columns', title: '生前契約信託查詢', href: 'https://www.bankchb.com/frontend/FT-5-2-3-1.jsp', html: '<p>依法生前契約預收費用 75% 須交付信託。可至受託銀行網站查詢信託專戶狀態，保障您的權益。</p>' }
        ]},
        { type: 'note', tone: 'red', html: '<p><strong><i class="fa-solid fa-shield-halved"></i> 消費諮詢／申訴管道</strong></p><p>華梵禮儀申訴專線：<a href="tel:0800800818">0800-800-818</a>｜臺中市生命禮儀管理處：(04) 2233-4145｜臺中市政府消費者保護官室：(04) 2228-9111 或撥打全國消費者服務專線 <strong>1950</strong>。另可參考 <a href="https://mort.moi.gov.tw/#/Protection/?type=1" target="_blank" rel="noopener">內政部殯葬消費者保護專區 <i class="fa-solid fa-arrow-up-right-from-square"></i></a>。</p>' }
      ]
    },
    {
      id: 'traffic',
      title: '殯儀館交通資訊',
      subtitle: '臺中市崇德殯儀館：臺中市北區崇德路一段 50 號',
      publishedDate: '2026-07-01',
      coverImage: '/HuaFan/image/index/啟靈.webp',
      icon: 'fa-solid fa-route',
      categories: ['交通資訊'],
      tags: ['崇德殯儀館','公車','開車'],
      summary: '臺中市崇德殯儀館交通資訊：公車站點、自行開車國道路線指引。地址：臺中市北區崇德路一段 50 號。',
      featured: false, pinned: true, pinnedOrder: 7,
      blocks: [
        { type: 'paragraph', text: '臺中市崇德殯儀館｜地址：臺中市北區崇德路一段 50 號｜電話：(04) 2233-4145' },
        { type: 'cards', cols: 2, items: [
          { icon: 'fa-solid fa-bus', title: '搭乘公車', html: '<p>可搭乘台中客運、統聯客運、全航客運、豐原客運等多線市區公車，於下列站點下車步行即達：</p><ul><li><i class="fa-solid fa-location-dot"></i>一心市場</li><li><i class="fa-solid fa-location-dot"></i>市立殯儀館</li><li><i class="fa-solid fa-location-dot"></i>中國醫藥大學／中山堂</li><li><i class="fa-solid fa-location-dot"></i>五權學士路口</li></ul>' },
          { icon: 'fa-solid fa-car', title: '自行開車', html: '<ul><li><strong>國道1號（南下）：</strong>大雅交流道下 → 中清路往市區 → 左轉文心路 → 右轉崇德路即達。</li><li><strong>國道1號（北上）：</strong>臺灣大道交流道下 → 往市區 → 左轉五權路 → 左轉崇德路即達。</li><li><strong>國道3號（南下）：</strong>沙鹿交流道下 → 臺灣大道二段 → 左轉五權路 → 左轉崇德路即達。</li><li><strong>國道3號（北上）：</strong>大里接 63 中投快速道路 → 五權南路下 → 右轉三民路 → 左轉崇德路即達。</li></ul>' }
        ]}
      ]
    }
  ];

  /* 一般文章：示範內容（可於後台編輯或刪除） */
  const BASE_ARTICLES = [
    {
      id: 'condolence-flowers',
      title: '弔唁花禮與輓聯，怎麼送才得體？',
      subtitle: '花籃、花圈、罐頭塔與輓聯的致贈時機與署名方式',
      publishedDate: '2026-06-20',
      coverImage: '/HuaFan/image/index/花.webp',
      icon: '',
      categories: ['弔唁禮節'],
      tags: ['花禮','輓聯','示範文章'],
      summary: '想以花禮或輓聯表達哀思，卻不確定該送什麼、何時送、如何署名？這篇整理常見花禮種類與致贈要點。',
      featured: false, pinned: false, pinnedOrder: 0,
      blocks: [
        { type: 'paragraph', text: '接到訃聞後，許多親友會想以花禮或輓聯表達哀思，卻常不確定該送什麼、何時送、如何署名。以下整理常見作法，實際安排仍建議先與喪家或承辦禮儀公司確認。' },
        { type: 'heading', level: 2, text: '常見花禮種類' },
        { type: 'paragraph', text: '常見的弔唁花禮包含高架花籃、盆花、花圈與十字架花牌（基督宗教）等；部分地區亦有致贈罐頭塔、毛毯的習俗。花色以白、黃、淡紫等素雅色系為主。\n\n致贈前建議先向喪家或禮儀公司確認：會場空間是否足夠擺放、家屬是否婉謝奠品，以及告別式的宗教型式──例如基督宗教儀式一般不使用罐頭塔。' },
        { type: 'heading', level: 2, text: '致贈時機與署名' },
        { type: 'paragraph', text: '花禮應於告別式前一日或當日早晨送達會場，並註明「○○○先生／女士 告別式」與家屬姓名，避免送錯場地。\n\n署名方式與奠儀相同：上款為哀悼逝者之詞，下款為致意者姓名或公司行號全銜加「敬輓」。' },
        { type: 'quote', text: '心意不在排場，而在恰如其分的尊重。', cite: '華梵禮儀' },
        { type: 'paragraph', text: '若不確定送什麼合適，歡迎來電 0800-800-818，由華梵協助您確認會場狀況與家屬意願。' }
      ]
    },
    {
      id: 'zuo-qi-modern',
      title: '「做七」是什麼？現代家庭如何安排',
      subtitle: '從頭七到滿七，四十九日祭祀的由來與現代調整',
      publishedDate: '2026-06-12',
      coverImage: '/HuaFan/image/index/辭生.webp',
      icon: '',
      categories: ['習俗祭祀'],
      tags: ['做七','頭七','示範文章'],
      summary: '「做七」是臺灣喪俗中最常見的祭祀傳統。這篇說明七七四十九日的由來，以及現代家庭常見的簡化安排。',
      featured: false, pinned: false, pinnedOrder: 0,
      blocks: [
        { type: 'paragraph', text: '「做七」是臺灣喪俗中最常見的祭祀傳統：自往生日起，每七日為一個「七」，共七個七、四十九日。傳統上認為亡者在這段期間逐步走向來生，家屬則藉由每一次祭拜表達思念與祝福。' },
        { type: 'heading', level: 2, text: '各七的傳統意涵' },
        { type: 'paragraph', text: '傳統習俗中，頭七由兒子主祭，三七、五七、滿七各有不同親屬主祭的慣例，各地作法不盡相同。其中以「頭七」與「滿七（尾七）」最受重視。' },
        { type: 'heading', level: 2, text: '現代常見的調整' },
        { type: 'paragraph', text: '現代家庭因工作與治喪時程考量，常在與禮儀師、宗教師討論後，將部分七期合併或簡化，僅圓滿頭七、滿七等重要日子；亦有家庭選擇以誦經、追思聚會等方式取代傳統祭拜。\n\n習俗的核心是心意，形式可以與時俱進。華梵禮儀師會依家庭信仰與作息，協助規劃合適的做七安排。' }
      ]
    },
    {
      id: 'joint-sea-burial',
      title: '想參加聯合海葬，需要知道的事',
      subtitle: '報名方式、流程與家屬常見疑問',
      publishedDate: '2026-06-05',
      coverImage: '/HuaFan/image/index/樹葬1.webp',
      icon: '',
      categories: ['葬式知識'],
      tags: ['海葬','環保自然葬','示範文章'],
      summary: '海葬讓生命回歸大海。這篇整理聯合海葬的報名方式、大致流程，以及家屬最常詢問的問題。',
      featured: false, pinned: false, pinnedOrder: 0,
      blocks: [
        { type: 'paragraph', text: '海葬是將火化後的骨灰經研磨處理，於政府劃定海域拋灑的環保自然葬。各縣市多定期舉辦「聯合海葬」，由政府與協辦業者統一安排船班與儀式，家屬僅需依公告時程報名參加。' },
        { type: 'heading', level: 2, text: '如何報名' },
        { type: 'paragraph', text: '聯合海葬場次由各縣市殯葬主管機關公告，多需事先申請並備妥死亡證明、火化證明等文件。臺中市場次資訊可參考臺中市殯葬資訊服務網，或直接洽詢華梵，我們是台中市政府聯合海葬的協辦廠商，可協助您完成報名與文件準備。' },
        { type: 'heading', level: 2, text: '家屬常見疑問' },
        { type: 'paragraph', text: '「之後想祭拜怎麼辦？」──海葬後雖無固定塔位，家屬仍可於家中設置追思空間，或於重要節日至海邊遙祭；部分縣市也設有追思網站可線上獻花。\n\n「儀式莊重嗎？」──聯合海葬全程有司儀引導，含追思儀式與拋灑儀程，莊嚴而溫馨。' },
        { type: 'divider' },
        { type: 'paragraph', text: '海葬相關規定與場次每年略有調整，實際辦理請以主管機關最新公告為準，或來電 0800-800-818 由華梵為您確認。' }
      ]
    }
  ];

  const DEFAULT_ARTICLES = PINNED_ARTICLES.concat(BASE_ARTICLES);

  /* ---------- Utility ---------- */
  function safeParse(s) { try { return JSON.parse(s); } catch (_) { return null; } }
  function slugify(text) {
    return String(text || '')
      .toLowerCase().trim()
      .replace(/\s+/g, '-')
      .replace(/[^\w一-龥-]/g, '')
      .replace(/-+/g, '-')
      .slice(0, 60) || 'wiki-' + Date.now();
  }
  function broadcast() {
    try { window.dispatchEvent(new CustomEvent(EVENT_NAME)); } catch (_) {}
  }
  function stableHash(s) {
    let h = 0;
    s = String(s || '');
    for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
    return h;
  }
  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  /* ---------- Store ---------- */
  const WikiStore = {
    STORAGE_KEY, EVENT_NAME, DEFAULT_CATEGORIES, FALLBACK_COVERS,

    _seedIfEmpty() {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_ARTICLES));
    },

    /** 新到舊排序 */
    getAll() {
      this._seedIfEmpty();
      const data = safeParse(localStorage.getItem(STORAGE_KEY)) || [];
      return data.slice().sort((a, b) => {
        const ta = Date.parse(a.publishedDate || '') || (a.createdAt || 0);
        const tb = Date.parse(b.publishedDate || '') || (b.createdAt || 0);
        return tb - ta;
      });
    },

    getById(id) {
      return this.getAll().find(i => i.id === id) || null;
    },

    /** 釘選文章（依 pinnedOrder 小 → 大） */
    getPinned() {
      return this.getAll().filter(i => i.pinned)
        .sort((a, b) => (a.pinnedOrder || 0) - (b.pinnedOrder || 0));
    },

    getFeatured(limit) {
      const arr = this.getAll().filter(i => i.featured);
      return typeof limit === 'number' ? arr.slice(0, limit) : arr;
    },

    getAllCategories() {
      const set = new Set(DEFAULT_CATEGORIES);
      this.getAll().forEach(i => (i.categories || []).forEach(c => c && set.add(c)));
      return Array.from(set);
    },

    /** 依文章型別產生詳細頁網址 */
    detailUrlOf(post) {
      if (!post) return 'wiki.html';
      const page = post.pinned ? 'wiki_top-detail.html' : 'wiki_base-detail.html';
      return page + '?id=' + encodeURIComponent(post.id);
    },

    /** 依 id 產生穩定 fallback 封面 */
    pickFallbackCover(id) {
      return FALLBACK_COVERS[stableHash(id) % FALLBACK_COVERS.length];
    },

    coverOf(post) {
      if (!post) return '';
      return (post.coverImage && post.coverImage.trim()) || this.pickFallbackCover(post.id);
    },

    /** 由 blocks 抽首段當摘要（若原 summary 為空） */
    summaryOf(post, maxLen) {
      if (!post) return '';
      if (post.summary && post.summary.trim()) return post.summary.trim();
      const first = (post.blocks || []).find(b => b && b.type === 'paragraph' && b.text);
      const raw = first ? String(first.text).replace(/\s+/g, ' ').trim() : '';
      const max = maxLen || 100;
      return raw.length > max ? raw.slice(0, max) + '…' : raw;
    },

    /**
     * 釘選文章目錄卡（沿用原 wiki.html 目錄設計，供 wiki.html 與兩種詳細頁共用）
     * opts: { activeId?: string, showBack?: boolean }
     */
    renderPinnedNavHTML(opts) {
      opts = opts || {};
      const pinned = this.getPinned();
      const items = pinned.map(p => {
        const active = p.id === opts.activeId ? ' active' : '';
        const icon = p.icon || 'fa-solid fa-bookmark';
        return '<a href="' + esc(this.detailUrlOf(p)) + '" class="wiki-toc-link' + active + ' whitespace-nowrap px-3 py-2.5 rounded-r-lg text-sm text-gray-600">' +
          '<i class="' + esc(icon) + ' w-5 text-accent"></i> ' + esc(p.title) + '</a>';
      }).join('');
      const back = opts.showBack
        ? '<a href="wiki.html" class="flex items-center gap-2 px-3 py-2.5 mb-2 rounded-xl bg-primary text-white text-sm font-bold hover:bg-primaryDark transition">' +
          '<i class="fa-solid fa-arrow-left-long"></i> 返回禮儀百科</a>'
        : '';
      return '' +
        '<nav class="lg:sticky lg:top-28 bg-surface rounded-2xl border border-white shadow-soft p-4" aria-label="釘選文章">' +
          back +
          '<p class="text-xs tracking-[0.2em] text-accent uppercase font-bold px-3 pt-2 pb-3"><i class="fa-solid fa-thumbtack mr-1"></i>目錄 Contents</p>' +
          '<div class="flex lg:flex-col overflow-x-auto lg:overflow-visible gap-1 pb-2 lg:pb-0">' + items + '</div>' +
          '<div class="hidden lg:block border-t border-gray-100 mt-3 pt-3 px-3 pb-2 space-y-2">' +
            '<a href="process.html" class="block text-sm text-primary font-bold hover:text-accent transition"><i class="fa-solid fa-diagram-project w-5"></i> 完整治喪流程 →</a>' +
            '<a href="faq.html" class="block text-sm text-primary font-bold hover:text-accent transition"><i class="fa-solid fa-circle-question w-5"></i> 常見問題 FAQ →</a>' +
          '</div>' +
        '</nav>';
    },

    save(post) {
      const list = this.getAll();
      const now = Date.now();
      const isNew = !post.id || !list.some(i => i.id === post.id);
      const normalized = {
        id: post.id || (slugify(post.title) + '-' + now.toString(36)),
        title: (post.title || '未命名文章').trim(),
        subtitle: (post.subtitle || '').trim(),
        publishedDate: post.publishedDate || new Date(now).toISOString().slice(0, 10),
        coverImage: (post.coverImage || '').trim(),
        icon: (post.icon || '').trim(),
        categories: Array.isArray(post.categories) ? post.categories.filter(Boolean) : [],
        tags: Array.isArray(post.tags) ? post.tags.filter(Boolean) : [],
        summary: (post.summary || '').trim(),
        featured: !!post.featured,
        pinned: !!post.pinned,
        pinnedOrder: Number(post.pinnedOrder) || 0,
        blocks: Array.isArray(post.blocks) ? post.blocks.filter(b => b && b.type) : [],
        createdAt: post.createdAt || now,
        updatedAt: now
      };
      const next = isNew
        ? list.concat([normalized])
        : list.map(i => (i.id === normalized.id ? normalized : i));
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch (e) { console.warn('[wiki] quota', e); }
      broadcast();
      return normalized;
    },

    remove(id) {
      const next = this.getAll().filter(i => i.id !== id);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      broadcast();
    },

    reset() {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_ARTICLES));
      broadcast();
    },

    exportJSON() {
      return JSON.stringify(this.getAll(), null, 2);
    },

    importJSON(jsonString, mode) {
      const data = typeof jsonString === 'string' ? safeParse(jsonString) : jsonString;
      if (!Array.isArray(data)) throw new Error('匯入資料格式錯誤：必須為陣列');
      if (mode === 'merge') {
        const map = new Map(this.getAll().map(i => [i.id, i]));
        data.forEach(i => { if (i && i.id) map.set(i.id, i); });
        localStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(map.values())));
      } else {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      }
      broadcast();
    },

    /** 嘗試從 wiki-data.json 拉最新資料覆蓋（用於部署後同步） */
    refreshFromRemote() {
      return fetch(REMOTE_JSON + '?t=' + Date.now(), { cache: 'no-store' })
        .then(r => r.ok ? r.json() : null)
        .then(data => {
          if (!Array.isArray(data)) return false;
          localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
          broadcast();
          return true;
        })
        .catch(() => false);
    },

    subscribe(callback) {
      const handler = () => callback();
      window.addEventListener(EVENT_NAME, handler);
      window.addEventListener('storage', (e) => {
        if (e.key === STORAGE_KEY) callback();
      });
      return () => window.removeEventListener(EVENT_NAME, handler);
    },

    slugify
  };

  global.WikiStore = WikiStore;
})(window);
