/* ============================================================
 * hf-news-store.js
 * ------------------------------------------------------------
 * 華梵最新消息（News） — 共用資料層
 * （程式邏輯仿照視丘 Fotosoft insights-data.js，與 hf-wiki-data.js 同架構）
 *
 * 頁面使用：
 *   <script src="js/hf-news-store.js"></script>
 *   const list = NewsStore.getAll();
 *   const post = NewsStore.getById('award-114');
 *
 * 資料模型 (NewsArticle)：
 *   {
 *     id:            string   // URL slug，唯一識別
 *     title:         string
 *     subtitle:      string
 *     publishedDate: string   // 顯示日期（自由格式：'民國 114 年'、'2025-06-27'、'長期服務'…）
 *     coverImage:    string   // 卡片封面 + 詳細頁 hero；未填會 fallback 到站內圖庫
 *     categories:    string[] // 例：['獲獎殊榮']
 *     tags:          string[]
 *     summary:       string   // 卡片摘要（若空會自動由 blocks 抽首段）
 *     featured:      boolean  // 精選標記（卡片顯示「精選」徽章）
 *     external:      string   // 外部報導連結（沒有留空字串）
 *     blocks: Block[]         // 內文區塊，順序即呈現順序
 *     createdAt:     number   // 兼作排序權重：日期無法解析時，越大越前面
 *     updatedAt:     number
 *   }
 *
 * Block：
 *   { type: 'heading',   level: 2|3,      text: string }
 *   { type: 'paragraph', text: string }                 // 允許 \n\n 分段
 *   { type: 'quote',     text: string,    cite?: string }
 *   { type: 'image',     src: string,     caption?: string, alt?: string, size?: 'large'|'small' }
 *   { type: 'divider' }
 *
 * 排序說明：getAll() 以「publishedDate 可解析的日期 → createdAt」新到舊排序。
 * 顯示日期使用「民國 114 年」等自由文字時，順序由 createdAt 決定（新增的消息自動在最上面）。
 * ============================================================ */

(function (global) {
  'use strict';

  const STORAGE_KEY = 'HUAFAN_NEWS_V1';
  const EVENT_NAME  = 'huafan:news-updated';
  const REMOTE_JSON = 'news-data.json';

  /* 圖庫：未指定封面時，用 id 做雜湊挑一張作為 fallback（皆為站內既有圖片） */
  const FALLBACK_COVERS = [
    '/HuaFan/image/index/華梵會館.webp',
    '/HuaFan/image/index/花.webp',
    '/HuaFan/image/about/聯合奠祭.webp',
    '/HuaFan/image/about/教育訓練.webp',
    '/HuaFan/image/index/樹葬1.webp',
    '/HuaFan/image/about/演習示範.webp'
  ];

  const DEFAULT_CATEGORIES = [
    '獲獎殊榮','公益關懷','服務消息','公司消息','致敬典範'
  ];

  /* ---------- 預設種子資料（完整移植自原 js/hf-news-data.js） ---------- */
  const DEFAULT_NEWS = [
    {
      id: 'award-114',
      title: '114年臺中市殯葬禮儀服務業評鑑「特優等」，同獲三項專項大獎',
      subtitle: '性別平等獎・環保永續獎・創新服務獎',
      publishedDate: '民國 114 年',
      coverImage: '/HuaFan/image/index/114評鑑.webp',
      categories: ['獲獎殊榮'],
      tags: ['評鑑','特優等'],
      summary: '華梵禮儀於114年臺中市殯葬禮儀服務業評鑑榮獲「特優等」，並同時獲頒性別平等獎、環保永續獎與創新服務獎。',
      featured: true,
      external: '',
      blocks: [
        { type: 'paragraph', text: '華梵禮儀團隊於 114 年臺中市殯葬禮儀服務業評鑑中，榮獲最高榮譽「特優等」，並同時獲頒「性別平等獎」、「環保永續獎」與「創新服務獎」三項專項肯定。' },
        { type: 'paragraph', text: '這是對華梵長期堅持「專業、體貼、尊重」服務原則的再次肯定。從 99 年起，華梵已連續多年於臺中市評鑑中獲得優等以上成績，並曾於 103 年、105 年獲選為示範單位、111 年成為臺中市首家獲得「人文關懷獎」的殯葬業者。' },
        { type: 'paragraph', text: '華梵禮儀將持續以透明的收費、完整的教育訓練與充滿溫度的服務，陪伴每一個家庭走過人生中最艱難的時刻。' }
      ],
      createdAt: 1700000000006, updatedAt: 1700000000006
    },
    {
      id: 'charity-rabbit',
      title: '華梵禮儀用愛迎兔年，攜手助弱勢',
      subtitle: '歲末寒冬送暖，公益不間斷',
      publishedDate: '民國 112 年 1 月',
      coverImage: '/HuaFan/image/about/charity-slide10.webp',
      categories: ['公益關懷'],
      tags: ['公益','弱勢關懷'],
      summary: '歲末年初，華梵禮儀持續投入社會公益，關懷弱勢家庭，以實際行動讓社會多一點溫暖。',
      featured: false,
      external: 'https://www.chinatimes.com/realtimenews/20230124001295-260402',
      blocks: [
        { type: 'paragraph', text: '華梵禮儀長期關懷社會弱勢族群、參與社會公益：到安養中心擔任義工、捐贈輪椅物資、每年舉辦捐血活動，並對無力殮葬的弱勢家庭提供喪葬費用的支援與協助。' },
        { type: 'paragraph', text: '兔年前夕，華梵再度發起關懷活動，盼在歲末寒冬為弱勢家庭送上溫暖，相關報導獲媒體刊載。' },
        { type: 'paragraph', text: '如果您也願意一同投入公益行列，歡迎與我們聯絡；您的愛心將用於替無力殮葬的弱勢族群購置棺木、辦理喪葬事宜。' }
      ],
      createdAt: 1700000000005, updatedAt: 1700000000005
    },
    {
      id: 'firefighter-farewell',
      title: '台中消防英雄告別式──以最莊嚴的儀式，送別守護城市的勇者',
      subtitle: '向殉職的消防勇者致敬',
      publishedDate: '民國 112 年',
      coverImage: '/HuaFan/image/about/聯合奠祭.webp',
      categories: ['致敬典範'],
      tags: ['告別式','致敬'],
      summary: '向殉職的消防勇者致敬。華梵禮儀以最高規格協助辦理告別式，陪伴家屬、也陪伴整座城市好好道別。',
      featured: false,
      external: 'https://wf119.pixnet.net/blog/post/351545383',
      blocks: [
        { type: 'paragraph', text: '面對為城市奉獻生命的消防英雄，華梵禮儀以最莊嚴、最高規格的儀式協助辦理告別式，讓勇者尊嚴地走完最後一程。' },
        { type: 'paragraph', text: '告別不只是儀式，更是整座城市共同的致敬與療癒。華梵團隊全程陪伴家屬，從治喪協調、會場佈置到奠禮執行，每一個細節都承載著敬意。' },
        { type: 'paragraph', text: '我們相信，好的道別能撫平生者的傷痛。謹以此文，向所有守護人民安全的消防同仁致上最深的敬意。' }
      ],
      createdAt: 1700000000004, updatedAt: 1700000000004
    },
    {
      id: 'award-111',
      title: '111年評鑑「人文關懷獎」──臺中市首家獲此獎項的殯葬業者',
      subtitle: '人文關懷，正是華梵服務的核心',
      publishedDate: '民國 111 年',
      coverImage: '/HuaFan/image/index/111評鑑.webp',
      categories: ['獲獎殊榮'],
      tags: ['評鑑','人文關懷獎'],
      summary: '華梵禮儀於111年臺中市殯葬禮儀服務業評鑑中，成為臺中市首次獲得「人文關懷獎」的殯葬業者。',
      featured: false,
      external: '',
      blocks: [
        { type: 'paragraph', text: '華梵禮儀於 111 年臺中市殯葬禮儀服務業評鑑中榮獲「人文關懷獎」，成為臺中市首家獲得此獎項的殯葬業者。' },
        { type: 'paragraph', text: '「人文關懷」正是華梵服務的核心：尊重每一位逝者的身分、信仰與生前意願，也照顧每一位家屬的感受。無論是客製化的奠禮安排、專業攝影紀錄，或是對弱勢家庭的公益協助，都是這份理念的實踐。' },
        { type: 'paragraph', text: '感謝評鑑委員與市民朋友的肯定，華梵會繼續把每一場告別，都當作一生只有一次的重要儀式來完成。' }
      ],
      createdAt: 1700000000003, updatedAt: 1700000000003
    },
    {
      id: 'joint-services',
      title: '協辦臺中市聯合奠祭與聯合海葬，推廣環保自然葬',
      subtitle: '台中市政府重要協辦廠商',
      publishedDate: '長期服務',
      coverImage: '/HuaFan/image/index/樹葬1.webp',
      categories: ['服務消息'],
      tags: ['聯合奠祭','聯合海葬','環保自然葬'],
      summary: '華梵禮儀為台中市政府聯合奠祭、聯合海葬重要協辦廠商，並自103年起承辦臺中市殯葬生命禮儀管理所勞務管理。',
      featured: false,
      external: '',
      blocks: [
        { type: 'paragraph', text: '華梵禮儀在聯合奠祭、聯合海葬部分，是台中市政府的重要協辦廠商，擁有豐富的執行經驗，並自 103 年起承辦「臺中市殯葬生命禮儀管理所」勞務管理工作。' },
        { type: 'paragraph', text: '我們也積極推廣樹葬、海葬等環保自然葬，讓生命回歸自然、化作春泥更護花。想了解自然葬的申請方式與流程，歡迎參閱本站禮儀百科，或來電免費諮詢。' },
        { type: 'paragraph', text: '相關政府資訊可參考「臺中市殯葬資訊服務網」與「內政部全國殯葬資訊入口網」。' }
      ],
      createdAt: 1700000000002, updatedAt: 1700000000002
    },
    {
      id: 'training',
      title: '教育訓練不間斷──打造值得託付的專業禮儀師團隊',
      subtitle: '專業，是華梵對家屬的承諾',
      publishedDate: '持續進行',
      coverImage: '/HuaFan/image/about/教育訓練.webp',
      categories: ['公司消息'],
      tags: ['教育訓練','禮儀師'],
      summary: '華梵禮儀定期辦理完整教育訓練與演習示範，團隊多名成員持有禮儀師證書，以專業回應每一份託付。',
      featured: false,
      external: '',
      blocks: [
        { type: 'paragraph', text: '「專業」是華梵對家屬的承諾。我們定期舉辦內部教育訓練與實地演習，從治喪流程、儀式細節到與家屬的溝通應對，都有標準化的訓練與考核。' },
        { type: 'paragraph', text: '團隊多名成員持有國家禮儀師證書，並持續進修殯葬相關法規與多元宗教禮俗，確保每一場服務都專業到位。' },
        { type: 'paragraph', text: '您可以在「關於華梵」頁面的教育訓練專區，了解更多我們的訓練實況。' }
      ],
      createdAt: 1700000000001, updatedAt: 1700000000001
    }
  ];

  /* ---------- Utility ---------- */
  function safeParse(s) { try { return JSON.parse(s); } catch (_) { return null; } }
  function slugify(text) {
    return String(text || '')
      .toLowerCase().trim()
      .replace(/\s+/g, '-')
      .replace(/[^\w一-龥-]/g, '')
      .replace(/-+/g, '-')
      .slice(0, 60) || 'news-' + Date.now();
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

  /* ---------- Store ---------- */
  const NewsStore = {
    STORAGE_KEY, EVENT_NAME, DEFAULT_CATEGORIES, FALLBACK_COVERS,

    _seedIfEmpty() {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_NEWS));
    },

    /** 新到舊排序（日期可解析者優先用日期，否則用 createdAt） */
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

    getFeatured(limit) {
      const arr = this.getAll().filter(i => i.featured);
      return typeof limit === 'number' ? arr.slice(0, limit) : arr;
    },

    getAllCategories() {
      const set = new Set(DEFAULT_CATEGORIES);
      this.getAll().forEach(i => (i.categories || []).forEach(c => c && set.add(c)));
      return Array.from(set);
    },

    detailUrlOf(post) {
      if (!post) return 'news.html';
      return 'news-detail.html?id=' + encodeURIComponent(post.id);
    },

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

    save(post) {
      const list = this.getAll();
      const now = Date.now();
      const isNew = !post.id || !list.some(i => i.id === post.id);
      const normalized = {
        id: post.id || (slugify(post.title) + '-' + now.toString(36)),
        title: (post.title || '未命名消息').trim(),
        subtitle: (post.subtitle || '').trim(),
        publishedDate: (post.publishedDate || '').trim(),
        coverImage: (post.coverImage || '').trim(),
        categories: Array.isArray(post.categories) ? post.categories.filter(Boolean) : [],
        tags: Array.isArray(post.tags) ? post.tags.filter(Boolean) : [],
        summary: (post.summary || '').trim(),
        featured: !!post.featured,
        external: (post.external || '').trim(),
        blocks: Array.isArray(post.blocks) ? post.blocks.filter(b => b && b.type) : [],
        createdAt: post.createdAt || now,
        updatedAt: now
      };
      const next = isNew
        ? list.concat([normalized])
        : list.map(i => (i.id === normalized.id ? normalized : i));
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch (e) { console.warn('[news] quota', e); }
      broadcast();
      return normalized;
    },

    remove(id) {
      const next = this.getAll().filter(i => i.id !== id);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      broadcast();
    },

    reset() {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_NEWS));
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

    /** 嘗試從 news-data.json 拉最新資料覆蓋（用於部署後同步） */
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

  global.NewsStore = NewsStore;
})(window);
