/* ============================================================
 * hf-news-admin.js — 華梵最新消息「隱藏管理系統」
 * ------------------------------------------------------------
 * 觸發：Cmd + Shift + E   (Mac) / Ctrl + Shift + E (Win/Linux)
 * 功能（程式邏輯仿照視丘 insights-admin.js，與 hf-wiki-admin.js 同架構）：
 *   1. 開啟浮動管理面板（覆蓋於 news.html / news-detail.html）
 *   2. 左側列表：所有消息，可新增/刪除/搜尋
 *   3. 右側表單：標題、副標、顯示日期（自由格式）、封面、分類、標籤、
 *      摘要、精選、外部報導連結、內文區塊（段落 / 標題 / 引言 / 圖片 / 分隔線）
 *   4. 匯出 JSON（news-data.json） / 匯入 JSON / 重置
 *
 * 依賴：window.NewsStore (js/hf-news-store.js)
 * ============================================================ */

(function () {
  'use strict';

  if (typeof window.NewsStore === 'undefined') {
    console.warn('[news-admin] 找不到 NewsStore，請先載入 js/hf-news-store.js');
    return;
  }

  const STYLE_ID = 'hfn-admin-style';
  if (!document.getElementById(STYLE_ID)) {
    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = `
      #hfn-admin-root, #hfn-admin-root * { box-sizing: border-box; }
      #hfn-admin-root {
        position: fixed; inset: 0; z-index: 99999;
        font-family: "Noto Sans TC", system-ui, -apple-system, sans-serif;
        color: #3D443B;
      }
      #hfn-admin-root .hfn-backdrop {
        position: absolute; inset: 0;
        background: rgba(47, 62, 43, 0.55);
        backdrop-filter: blur(6px);
      }
      #hfn-admin-root .hfn-panel {
        position: absolute; top: 50%; left: 50%;
        transform: translate(-50%, -50%);
        width: min(1280px, 96vw); height: min(90vh, 960px);
        background: #fff; border-radius: 14px;
        box-shadow: 0 40px 80px -20px rgba(0,0,0,0.35);
        display: flex; overflow: hidden;
      }
      #hfn-admin-root .hfn-side {
        width: 320px; border-right: 1px solid #E3EBE5;
        display: flex; flex-direction: column; background: #F7F5F0;
      }
      #hfn-admin-root .hfn-side-head { padding: 20px 20px 14px; border-bottom: 1px solid #E3EBE5; }
      #hfn-admin-root .hfn-side-title { font-family: "Noto Serif TC", serif; font-size: 20px; font-weight: 700; margin: 0 0 4px; color: #2F3E2B; }
      #hfn-admin-root .hfn-side-sub { font-size: 11px; color: #C5A670; letter-spacing: 0.15em; text-transform: uppercase; margin: 0; font-weight: 700; }
      #hfn-admin-root .hfn-search {
        margin: 12px 20px; padding: 10px 12px;
        border: 1px solid #DDE2D8; border-radius: 8px;
        background: #fff; font-size: 13px; outline: none;
      }
      #hfn-admin-root .hfn-search:focus { border-color: #465B40; }
      #hfn-admin-root .hfn-list { flex: 1; overflow-y: auto; padding: 4px 12px 12px; }
      #hfn-admin-root .hfn-list-item {
        display: flex; gap: 10px; align-items: center;
        padding: 8px; margin-bottom: 4px; border-radius: 8px;
        cursor: pointer; transition: background 0.15s;
      }
      #hfn-admin-root .hfn-list-item:hover { background: #E3EBE5; }
      #hfn-admin-root .hfn-list-item.active { background: #465B40; color: #fff; }
      #hfn-admin-root .hfn-list-item.active .hfn-list-sub { color: #C9D2C4; }
      #hfn-admin-root .hfn-list-thumb {
        width: 48px; height: 48px; border-radius: 6px;
        background: #DDE2D8 center/cover no-repeat; flex-shrink: 0;
      }
      #hfn-admin-root .hfn-list-text { min-width: 0; flex: 1; }
      #hfn-admin-root .hfn-list-title { font-size: 13px; font-weight: 500; margin: 0 0 2px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
      #hfn-admin-root .hfn-list-sub { font-size: 11px; color: #8B9287; margin: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
      #hfn-admin-root .hfn-list-star { font-size: 12px; color: #C5A670; }

      #hfn-admin-root .hfn-side-foot { padding: 12px 20px; border-top: 1px solid #E3EBE5; display: flex; flex-direction: column; gap: 8px; }
      #hfn-admin-root .hfn-btn { padding: 9px 14px; border-radius: 8px; font-size: 13px; font-weight: 500; cursor: pointer; border: 1px solid transparent; display: inline-flex; align-items: center; justify-content: center; gap: 6px; transition: all 0.15s; }
      #hfn-admin-root .hfn-btn-primary { background: #465B40; color: #fff; }
      #hfn-admin-root .hfn-btn-primary:hover { background: #2F3E2B; }
      #hfn-admin-root .hfn-btn-ghost { background: transparent; color: #465B40; border-color: #DDE2D8; }
      #hfn-admin-root .hfn-btn-ghost:hover { background: #E3EBE5; }
      #hfn-admin-root .hfn-btn-danger { background: #9F4A46; color: #fff; }
      #hfn-admin-root .hfn-btn-danger:hover { background: #83403C; }
      #hfn-admin-root .hfn-btn-sm { padding: 6px 10px; font-size: 12px; }

      #hfn-admin-root .hfn-main { flex: 1; display: flex; flex-direction: column; min-width: 0; }
      #hfn-admin-root .hfn-main-head { padding: 16px 24px; border-bottom: 1px solid #E3EBE5; display: flex; align-items: center; justify-content: space-between; gap: 12px; }
      #hfn-admin-root .hfn-main-title { font-family: "Noto Serif TC", serif; font-size: 18px; font-weight: 700; margin: 0; color: #2F3E2B; }
      #hfn-admin-root .hfn-close { width: 34px; height: 34px; border-radius: 50%; border: 1px solid #DDE2D8; background: #fff; cursor: pointer; font-size: 16px; color: #8B9287; display: inline-flex; align-items: center; justify-content: center; }
      #hfn-admin-root .hfn-close:hover { background: #F7F5F0; color: #2F3E2B; }
      #hfn-admin-root .hfn-form { flex: 1; overflow-y: auto; padding: 20px 24px 24px; }
      #hfn-admin-root .hfn-empty { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; color: #ADB5A9; text-align: center; padding: 40px; }
      #hfn-admin-root .hfn-empty h3 { font-family: "Noto Serif TC", serif; font-size: 22px; color: #8B9287; margin: 12px 0 6px; }
      #hfn-admin-root .hfn-empty p { margin: 0; font-size: 13px; }

      #hfn-admin-root .hfn-field { margin-bottom: 18px; }
      #hfn-admin-root .hfn-label { display: block; font-size: 12px; font-weight: 600; color: #465B40; margin-bottom: 6px; letter-spacing: 0.05em; }
      #hfn-admin-root .hfn-input, #hfn-admin-root .hfn-textarea {
        width: 100%; padding: 9px 12px; border: 1px solid #DDE2D8;
        border-radius: 8px; font-size: 13px; font-family: inherit;
        outline: none; background: #fff; color: #3D443B;
      }
      #hfn-admin-root .hfn-input:focus, #hfn-admin-root .hfn-textarea:focus { border-color: #465B40; }
      #hfn-admin-root .hfn-textarea { min-height: 80px; resize: vertical; line-height: 1.7; }
      #hfn-admin-root .hfn-row { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
      #hfn-admin-root .hfn-cover-preview {
        width: 100%; aspect-ratio: 3/2; border-radius: 8px;
        background: #F7F5F0 center/cover no-repeat;
        border: 1px dashed #DDE2D8; margin-bottom: 8px;
        display: flex; align-items: center; justify-content: center;
        color: #ADB5A9; font-size: 12px;
      }
      #hfn-admin-root .hfn-image-row { display: flex; gap: 8px; align-items: center; }
      #hfn-admin-root .hfn-image-row .hfn-input { flex: 1; }
      #hfn-admin-root .hfn-file-btn { padding: 9px 14px; border-radius: 8px; font-size: 12px; background: #F7F5F0; border: 1px solid #DDE2D8; color: #465B40; cursor: pointer; white-space: nowrap; }
      #hfn-admin-root .hfn-file-btn:hover { background: #E3EBE5; }

      #hfn-admin-root .hfn-cat-list { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 4px; }
      #hfn-admin-root .hfn-cat-chip { padding: 5px 10px; border-radius: 999px; font-size: 11px; border: 1px solid #DDE2D8; cursor: pointer; user-select: none; color: #8B9287; background: #fff; transition: all 0.15s; }
      #hfn-admin-root .hfn-cat-chip.on { background: #465B40; color: #fff; border-color: #465B40; }

      /* Blocks 編輯區 */
      #hfn-admin-root .hfn-blocks {
        border: 1px solid #DDE2D8; border-radius: 10px;
        padding: 10px; background: #FAFAF7;
      }
      #hfn-admin-root .hfn-block {
        background: #fff; border: 1px solid #E3EBE5; border-radius: 8px;
        padding: 10px; margin-bottom: 8px; position: relative;
      }
      #hfn-admin-root .hfn-block-head {
        display: flex; align-items: center; gap: 8px;
        font-size: 11px; color: #8B9287; margin-bottom: 6px;
      }
      #hfn-admin-root .hfn-block-type {
        display: inline-flex; align-items: center; gap: 4px;
        padding: 2px 8px; border-radius: 999px;
        background: #E3EBE5; color: #465B40; font-weight: 600;
        letter-spacing: 0.06em;
      }
      #hfn-admin-root .hfn-block-actions { margin-left: auto; display: flex; gap: 4px; }
      #hfn-admin-root .hfn-block-actions button {
        border: 1px solid #DDE2D8; background: #fff; color: #8B9287;
        width: 26px; height: 26px; border-radius: 6px; cursor: pointer;
        font-size: 12px; display: inline-flex; align-items: center; justify-content: center;
      }
      #hfn-admin-root .hfn-block-actions button:hover { background: #F7F5F0; color: #2F3E2B; }
      #hfn-admin-root .hfn-block-actions button.danger:hover { background: #F6E4E3; color: #9F4A46; border-color: #E5B5B3; }
      #hfn-admin-root .hfn-block-body input[type="text"],
      #hfn-admin-root .hfn-block-body textarea,
      #hfn-admin-root .hfn-block-body select {
        width: 100%; padding: 8px 10px; border: 1px solid #E3EBE5;
        border-radius: 6px; font-size: 13px; font-family: inherit;
        outline: none; background: #fff; color: #3D443B; margin-bottom: 6px;
      }
      #hfn-admin-root .hfn-block-body input[type="text"]:focus,
      #hfn-admin-root .hfn-block-body textarea:focus { border-color: #465B40; }
      #hfn-admin-root .hfn-block-body textarea { min-height: 80px; resize: vertical; line-height: 1.75; }
      #hfn-admin-root .hfn-block-body .hfn-img-preview {
        width: 100%; max-height: 220px; object-fit: contain;
        background: #F7F5F0; border-radius: 6px; margin: 4px 0 6px;
        display: block;
      }
      #hfn-admin-root .hfn-block-body .hfn-divider-hint {
        text-align: center; color: #ADB5A9; font-size: 12px; padding: 8px 0;
        letter-spacing: 0.3em;
      }
      #hfn-admin-root .hfn-block-inserter {
        display: flex; flex-wrap: wrap; gap: 6px; padding: 8px 4px 2px;
        justify-content: center; border-top: 1px dashed #E3EBE5; margin-top: 4px;
      }
      #hfn-admin-root .hfn-block-inserter button {
        padding: 6px 12px; border-radius: 999px; font-size: 12px;
        border: 1px solid #DDE2D8; background: #fff; color: #465B40;
        cursor: pointer; display: inline-flex; align-items: center; gap: 4px;
      }
      #hfn-admin-root .hfn-block-inserter button:hover { background: #465B40; color: #fff; border-color: #465B40; }

      #hfn-admin-root .hfn-toolbar { display: flex; gap: 8px; padding: 14px 24px; border-top: 1px solid #E3EBE5; background: #F7F5F0; align-items: center; }
      #hfn-admin-root .hfn-toolbar-spacer { flex: 1; }
      #hfn-admin-root .hfn-toggle { display: inline-flex; align-items: center; gap: 8px; font-size: 13px; color: #465B40; cursor: pointer; }
      #hfn-admin-root .hfn-toggle input { accent-color: #465B40; }

      .hfn-toast-global {
        position: fixed; bottom: 24px; left: 50%; transform: translateX(-50%);
        padding: 12px 20px; background: #2F3E2B; color: #fff; border-radius: 8px;
        font-size: 13px; z-index: 100000; box-shadow: 0 10px 30px rgba(0,0,0,0.2);
        animation: hfn-toast-in 0.25s ease-out;
      }
      @keyframes hfn-toast-in { from { opacity: 0; transform: translate(-50%, 20px); } to { opacity: 1; transform: translate(-50%, 0); } }

      #hfn-admin-root .hfn-dialog-backdrop {
        position: absolute; inset: 0; background: rgba(47, 62, 43, 0.24);
        display: flex; align-items: center; justify-content: center; z-index: 100001;
      }
      #hfn-admin-root .hfn-dialog {
        width: min(460px, calc(100vw - 32px));
        background: #fff; border-radius: 16px;
        box-shadow: 0 30px 80px -28px rgba(0,0,0,0.35); overflow: hidden;
      }
      #hfn-admin-root .hfn-dialog-body {
        padding: 24px 26px 20px; font-size: 17px; line-height: 1.7; color: #2F3E2B;
      }
      #hfn-admin-root .hfn-dialog-actions {
        display: flex; justify-content: flex-end; gap: 10px;
        padding: 14px 18px 18px; border-top: 1px solid #E3EBE5;
      }

      #hfn-admin-hint {
        position: fixed; bottom: 12px; right: 12px; z-index: 99998;
        padding: 6px 10px; border-radius: 6px; background: rgba(47,62,43,0.72);
        color: #fff; font-size: 10px; letter-spacing: 0.1em;
        font-family: "Noto Sans TC", sans-serif; pointer-events: none;
        opacity: 0; transition: opacity 0.3s;
      }
      #hfn-admin-hint.show { opacity: 1; }

      @media (max-width: 900px) {
        #hfn-admin-root .hfn-panel { width: 100vw; height: 100vh; border-radius: 0; flex-direction: column; }
        #hfn-admin-root .hfn-side { width: 100%; height: 40%; border-right: none; border-bottom: 1px solid #E3EBE5; }
        #hfn-admin-root .hfn-row { grid-template-columns: 1fr; }
      }
    `;
    document.head.appendChild(style);
  }

  /* ---------- State ---------- */
  const DRAFT_STORAGE_KEY = 'HUAFAN_NEWS_ADMIN_DRAFT_V1';
  let rootEl = null;
  let selectedId = null;
  let searchTerm = '';
  let dirtyDraft = null;

  function hasUnsavedDraft() {
    return !!dirtyDraft || !!localStorage.getItem(DRAFT_STORAGE_KEY);
  }
  function clearDraftState() {
    try { localStorage.removeItem(DRAFT_STORAGE_KEY); } catch (_) {}
  }
  function persistDraftState() {
    if (!dirtyDraft) { clearDraftState(); return; }
    try {
      localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify({
        selectedId: selectedId || '',
        searchTerm: searchTerm,
        dirtyDraft: dirtyDraft
      }));
    } catch (_) {}
  }
  function restoreDraftState() {
    let raw = null;
    try { raw = localStorage.getItem(DRAFT_STORAGE_KEY); } catch (_) {}
    if (!raw) return false;
    try {
      const saved = JSON.parse(raw);
      if (!saved || typeof saved !== 'object' || !saved.dirtyDraft || typeof saved.dirtyDraft !== 'object') return false;
      selectedId = saved.selectedId || '';
      searchTerm = typeof saved.searchTerm === 'string' ? saved.searchTerm : '';
      dirtyDraft = saved.dirtyDraft;
      return true;
    } catch (_) {
      clearDraftState();
      return false;
    }
  }
  function discardDirtyDraft() {
    dirtyDraft = null;
    clearDraftState();
  }

  function showSaveDiscardDialog(message) {
    return new Promise(resolve => {
      if (!rootEl) { resolve('discard'); return; }
      const wrap = document.createElement('div');
      wrap.className = 'hfn-dialog-backdrop';
      wrap.innerHTML = '' +
        '<div class="hfn-dialog" role="alertdialog" aria-modal="true" aria-labelledby="hfn-dialog-title">' +
          '<div class="hfn-dialog-body" id="hfn-dialog-title">' + escapeHtml(message || '尚有未儲存的變更，是否繼續？') + '</div>' +
          '<div class="hfn-dialog-actions">' +
            '<button class="hfn-btn hfn-btn-ghost hfn-btn-sm" data-dialog-action="discard">捨棄</button>' +
            '<button class="hfn-btn hfn-btn-primary hfn-btn-sm" data-dialog-action="save">儲存</button>' +
          '</div>' +
        '</div>';
      function cleanup(result) {
        document.removeEventListener('keydown', onKeydown, true);
        wrap.remove();
        resolve(result);
      }
      function onKeydown(e) {
        if (e.key === 'Enter') { e.preventDefault(); e.stopPropagation(); cleanup('save'); }
        if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); cleanup('discard'); }
      }
      wrap.addEventListener('click', e => {
        const action = e.target && e.target.getAttribute('data-dialog-action');
        if (!action) return;
        cleanup(action);
      });
      rootEl.appendChild(wrap);
      document.addEventListener('keydown', onKeydown, true);
      const primary = wrap.querySelector('[data-dialog-action="save"]');
      if (primary) primary.focus();
    });
  }

  async function resolveUnsavedBeforeContinue(message) {
    if (!dirtyDraft) return true;
    const action = await showSaveDiscardDialog(message || '尚有未儲存的變更，是否繼續？');
    if (action === 'save') return saveDraft();
    discardDirtyDraft();
    return true;
  }

  function toast(msg) {
    const t = document.createElement('div');
    t.className = 'hfn-toast-global'; t.textContent = msg;
    document.body.appendChild(t);
    setTimeout(() => t.remove(), 2200);
  }

  /* ---------- Open / Close ---------- */
  function open() {
    if (rootEl) return;
    const restored = !dirtyDraft && restoreDraftState();
    rootEl = document.createElement('div');
    rootEl.id = 'hfn-admin-root';
    document.body.appendChild(rootEl);
    if (!restored) {
      const all = NewsStore.getAll();
      selectedId = all.length ? all[0].id : null;
      dirtyDraft = null;
    }
    render();
    if (restored) toast('已還原上次未儲存的編輯');
  }

  async function close() {
    if (!(await resolveUnsavedBeforeContinue('尚有未儲存的變更，關閉前是否先儲存？'))) return;
    if (rootEl) { rootEl.remove(); rootEl = null; }
    discardDirtyDraft();
  }

  /* ---------- Render ---------- */
  function filteredList() {
    const all = NewsStore.getAll();
    if (!searchTerm) return all;
    const q = searchTerm.toLowerCase();
    return all.filter(p =>
      (p.title + ' ' + (p.subtitle || '') + ' ' + (p.tags || []).join(' ') + ' ' + (p.categories || []).join(' '))
        .toLowerCase().includes(q)
    );
  }

  function render() {
    if (!rootEl) return;

    // 保留滾動位置與輸入焦點，避免每次 render 都跳回頂端
    const prevForm = rootEl.querySelector('.hfn-form');
    const prevList = rootEl.querySelector('.hfn-list');
    const savedFormScroll = prevForm ? prevForm.scrollTop : 0;
    const savedListScroll = prevList ? prevList.scrollTop : 0;
    const activeEl = document.activeElement;
    const activeMarker = activeEl && rootEl.contains(activeEl)
      ? {
          field: activeEl.getAttribute('data-block-field') || activeEl.getAttribute('data-field') || activeEl.getAttribute('data-role'),
          idx: activeEl.getAttribute('data-idx'),
          selStart: typeof activeEl.selectionStart === 'number' ? activeEl.selectionStart : null,
          selEnd: typeof activeEl.selectionEnd === 'number' ? activeEl.selectionEnd : null
        }
      : null;

    const all = NewsStore.getAll();
    const filtered = filteredList();
    const current = all.find(p => p.id === selectedId) || null;
    const draft = dirtyDraft || current;

    rootEl.innerHTML = `
      <div class="hfn-backdrop" data-role="close"></div>
      <div class="hfn-panel" role="dialog" aria-label="最新消息管理">
        <aside class="hfn-side">
          <div class="hfn-side-head">
            <h2 class="hfn-side-title">最新消息管理</h2>
            <p class="hfn-side-sub">News Admin</p>
          </div>
          <input class="hfn-search" data-role="search" placeholder="搜尋標題／分類／標籤…" value="${escapeAttr(searchTerm)}">
          <div class="hfn-list" data-role="list">
            ${filtered.map(p => renderListItem(p)).join('') || '<p style="padding:20px;color:#ADB5A9;font-size:12px;text-align:center;">找不到符合的消息</p>'}
          </div>
          <div class="hfn-side-foot">
            <button class="hfn-btn hfn-btn-primary" data-role="new"><span>＋</span> 新增消息</button>
            <div style="display:flex;gap:6px;">
              <button class="hfn-btn hfn-btn-ghost hfn-btn-sm" data-role="export" style="flex:1;">匯出 JSON</button>
              <button class="hfn-btn hfn-btn-ghost hfn-btn-sm" data-role="import" style="flex:1;">匯入 JSON</button>
            </div>
            <p style="margin:6px 2px 0;font-size:11px;line-height:1.6;color:#8B9287;">編輯資料先儲存在瀏覽器（localStorage），不會自動寫入網站檔案。若要落地保存，請按「匯出 JSON」並上傳 news-data.json。</p>
            <button class="hfn-btn hfn-btn-ghost hfn-btn-sm" data-role="reset" style="color:#9F4A46;border-color:#E5B5B3;">重置為預設資料</button>
          </div>
        </aside>
        <main class="hfn-main">
          ${draft ? renderForm(draft, !current) : renderEmpty()}
        </main>
      </div>
    `;
    bindEvents();

    const newForm = rootEl.querySelector('.hfn-form');
    const newList = rootEl.querySelector('.hfn-list');
    if (newForm) newForm.scrollTop = savedFormScroll;
    if (newList) newList.scrollTop = savedListScroll;

    // 嘗試把焦點還給剛才在編輯的欄位
    if (activeMarker && (activeMarker.field || activeMarker.idx)) {
      let selector = '';
      if (activeMarker.field && activeMarker.idx != null) {
        selector = '[data-block-field="' + activeMarker.field + '"][data-idx="' + activeMarker.idx + '"]';
      } else if (activeMarker.field) {
        selector = '[data-field="' + activeMarker.field + '"], [data-role="' + activeMarker.field + '"]';
      }
      if (selector) {
        const el = rootEl.querySelector(selector);
        if (el && typeof el.focus === 'function') {
          try { el.focus({ preventScroll: true }); } catch (_) { el.focus(); }
          if (activeMarker.selStart != null && typeof el.setSelectionRange === 'function') {
            try { el.setSelectionRange(activeMarker.selStart, activeMarker.selEnd != null ? activeMarker.selEnd : activeMarker.selStart); } catch (_) {}
          }
        }
      }
    }
  }

  function renderListItem(p) {
    const active = p.id === selectedId ? 'active' : '';
    const cover = NewsStore.coverOf(p);
    const bg = cover ? `background-image:url('${escapeAttr(cover)}')` : '';
    return `
      <div class="hfn-list-item ${active}" data-role="select" data-id="${escapeAttr(p.id)}">
        <div class="hfn-list-thumb" style="${bg}"></div>
        <div class="hfn-list-text">
          <p class="hfn-list-title">${escapeHtml(p.title)}</p>
          <p class="hfn-list-sub">${escapeHtml(p.publishedDate || '')} · ${escapeHtml((p.categories || [])[0] || '—')}</p>
        </div>
        ${p.featured ? '<span class="hfn-list-star" title="精選">★</span>' : ''}
      </div>
    `;
  }

  function renderEmpty() {
    return `
      <div class="hfn-empty">
        <div style="font-size:40px;">📰</div>
        <h3>尚無消息</h3>
        <p>點擊左下角「新增消息」開始撰寫第一則最新消息。</p>
      </div>
    `;
  }

  function renderForm(p, isNew) {
    const allCats = NewsStore.getAllCategories();
    const currentCats = new Set(p.categories || []);
    const cover = p.coverImage || '';
    return `
      <div class="hfn-main-head">
        <h2 class="hfn-main-title">${isNew ? '新增消息' : '編輯消息'}</h2>
        <button class="hfn-close" data-role="close" title="關閉 (Esc)">×</button>
      </div>
      <div class="hfn-form">
        <div class="hfn-field">
          <label class="hfn-label">封面圖（用於消息圖卡與詳細頁 Hero）</label>
          <div class="hfn-cover-preview" style="${cover ? `background-image:url('${escapeAttr(cover)}')` : ''}">
            ${cover ? '' : '未設定封面（會自動套用站內圖庫）'}
          </div>
          <div class="hfn-image-row">
            <input class="hfn-input" data-field="coverImage" placeholder="/HuaFan/image/news/檔名.webp 或外部網址" value="${escapeAttr(cover)}">
            <label class="hfn-file-btn">
              選擇檔案
              <input type="file" accept="image/*" hidden data-role="upload-cover">
            </label>
          </div>
          <p style="font-size:11px;color:#ADB5A9;margin:6px 0 0;">圖片請歸檔於 <strong>HuaFan/image/news</strong>，選擇檔案後會自動填入對應路徑。</p>
        </div>

        <div class="hfn-field">
          <label class="hfn-label">標題 *</label>
          <input class="hfn-input" data-field="title" value="${escapeAttr(p.title)}" required>
        </div>

        <div class="hfn-row">
          <div class="hfn-field">
            <label class="hfn-label">副標</label>
            <input class="hfn-input" data-field="subtitle" value="${escapeAttr(p.subtitle || '')}">
          </div>
          <div class="hfn-field">
            <label class="hfn-label">顯示日期（自由格式：民國 114 年／2025-06-27／長期服務…）</label>
            <input class="hfn-input" data-field="publishedDate" value="${escapeAttr(p.publishedDate || '')}" placeholder="民國 114 年">
          </div>
        </div>

        <div class="hfn-row">
          <div class="hfn-field">
            <label class="hfn-label">標籤（逗號分隔）</label>
            <input class="hfn-input" data-field="tags" value="${escapeAttr((p.tags || []).join(', '))}">
          </div>
          <div class="hfn-field" style="display:flex;align-items:flex-end;">
            <label class="hfn-toggle">
              <input type="checkbox" data-field="featured" ${p.featured ? 'checked' : ''}>
              標記為「精選」
            </label>
          </div>
        </div>

        <div class="hfn-field">
          <label class="hfn-label">外部報導連結（選填；詳細頁會顯示「相關報導連結」按鈕）</label>
          <input class="hfn-input" data-field="external" value="${escapeAttr(p.external || '')}" placeholder="https://…">
        </div>

        <div class="hfn-field">
          <label class="hfn-label">分類（可複選）</label>
          <div class="hfn-cat-list">
            ${allCats.map(c => `
              <span class="hfn-cat-chip ${currentCats.has(c) ? 'on' : ''}" data-role="toggle-cat" data-cat="${escapeAttr(c)}">${escapeHtml(c)}</span>
            `).join('')}
            <span class="hfn-cat-chip" data-role="add-cat" style="border-style:dashed;">＋ 新分類</span>
          </div>
        </div>

        <div class="hfn-field">
          <label class="hfn-label">摘要（圖卡顯示；留空會自動抓內文首段）</label>
          <textarea class="hfn-textarea" data-field="summary" placeholder="一段簡短的摘要…">${escapeHtml(p.summary || '')}</textarea>
        </div>

        <div class="hfn-field">
          <label class="hfn-label">內文區塊（段落 / 標題 / 引言 / 圖片 / 分隔線）</label>
          <div class="hfn-blocks" data-role="blocks">
            ${(p.blocks || []).map((b, i) => renderBlock(b, i)).join('')}
            ${renderInserter((p.blocks || []).length)}
          </div>
        </div>
      </div>

      <div class="hfn-toolbar">
        ${!isNew ? '<button class="hfn-btn hfn-btn-danger hfn-btn-sm" data-role="delete">刪除此消息</button>' : ''}
        <div class="hfn-toolbar-spacer"></div>
        ${!isNew ? `<a class="hfn-btn hfn-btn-ghost hfn-btn-sm" href="${escapeAttr(NewsStore.detailUrlOf(p))}" target="_blank">預覽 ↗</a>` : ''}
        <button class="hfn-btn hfn-btn-ghost hfn-btn-sm" data-role="cancel">取消</button>
        <button class="hfn-btn hfn-btn-primary hfn-btn-sm" data-role="save">儲存</button>
      </div>
    `;
  }

  const BLOCK_LABELS = {
    heading:   '標題',
    paragraph: '段落',
    quote:     '引言',
    image:     '圖片',
    divider:   '分隔線'
  };

  function renderTextSwitcher(b, i) {
    return `
      <div style="display:flex;gap:6px;align-items:center;margin-bottom:8px;">
        <span style="font-size:11px;color:#8B9287;letter-spacing:0.06em;flex-shrink:0;">文字類型</span>
        <select data-role="switch-text-type" data-idx="${i}" style="max-width:220px;">
          <option value="paragraph" ${b.type === 'paragraph' ? 'selected' : ''}>內文（段落）</option>
          <option value="heading-2" ${b.type === 'heading' && (b.level || 2) === 2 ? 'selected' : ''}>H2 · 章節標題</option>
          <option value="heading-3" ${b.type === 'heading' && b.level === 3 ? 'selected' : ''}>H3 · 小節標題</option>
          <option value="quote" ${b.type === 'quote' ? 'selected' : ''}>引言</option>
        </select>
      </div>
    `;
  }

  function renderBlock(b, i) {
    const label = BLOCK_LABELS[b.type] || b.type;
    let body = '';

    if (b.type === 'heading') {
      body = renderTextSwitcher(b, i) + `
        <input type="text" data-block-field="text" data-idx="${i}" value="${escapeAttr(b.text || '')}" placeholder="標題文字…">
      `;
    } else if (b.type === 'paragraph') {
      body = renderTextSwitcher(b, i) + `
        <textarea data-block-field="text" data-idx="${i}" placeholder="段落內容…（可用空行分段）">${escapeHtml(b.text || '')}</textarea>
      `;
    } else if (b.type === 'quote') {
      body = renderTextSwitcher(b, i) + `
        <textarea data-block-field="text" data-idx="${i}" placeholder="引言內容…">${escapeHtml(b.text || '')}</textarea>
        <input type="text" data-block-field="cite" data-idx="${i}" value="${escapeAttr(b.cite || '')}" placeholder="出處／作者（選填）">
      `;
    } else if (b.type === 'image') {
      const size = b.size === 'small' ? 'small' : 'large';
      body = `
        <div style="display:flex;gap:6px;margin-bottom:8px;align-items:center;">
          <span style="font-size:11px;color:#8B9287;letter-spacing:0.06em;">尺寸</span>
          <button type="button" data-role="set-img-size" data-idx="${i}" data-size="large"
            style="padding:4px 10px;border-radius:999px;font-size:11px;font-weight:600;cursor:pointer;border:1px solid ${size === 'large' ? '#465B40' : '#DDE2D8'};background:${size === 'large' ? '#465B40' : '#fff'};color:${size === 'large' ? '#fff' : '#465B40'};">大圖（滿版）</button>
          <button type="button" data-role="set-img-size" data-idx="${i}" data-size="small"
            style="padding:4px 10px;border-radius:999px;font-size:11px;font-weight:600;cursor:pointer;border:1px solid ${size === 'small' ? '#465B40' : '#DDE2D8'};background:${size === 'small' ? '#465B40' : '#fff'};color:${size === 'small' ? '#fff' : '#465B40'};">縮圖（≈ 1/3）</button>
        </div>
        ${b.src ? `<img class="hfn-img-preview" src="${escapeAttr(b.src)}" alt="" style="${size === 'small' ? 'max-width:33%;margin:4px auto 6px;' : ''}">` : `<div class="hfn-divider-hint">— 尚未設定圖片 —</div>`}
        <div class="hfn-image-row">
          <input type="text" data-block-field="src" data-idx="${i}" value="${escapeAttr(b.src || '')}" placeholder="/HuaFan/image/news/檔名.webp 或外部網址">
          <label class="hfn-file-btn">
            選擇檔案
            <input type="file" accept="image/*" multiple hidden data-role="upload-block-image" data-idx="${i}">
          </label>
        </div>
        <input type="text" data-block-field="caption" data-idx="${i}" value="${escapeAttr(b.caption || '')}" placeholder="圖說（選填）">
        <input type="text" data-block-field="alt" data-idx="${i}" value="${escapeAttr(b.alt || '')}" placeholder="替代文字 alt（選填，SEO 用）">
      `;
    } else if (b.type === 'divider') {
      body = `<div class="hfn-divider-hint">— — — 分 隔 線 — — —</div>`;
    }

    return `
      <div class="hfn-block" data-role="block" data-idx="${i}">
        <div class="hfn-block-head">
          <span class="hfn-block-type">${escapeHtml(label)}</span>
          <div class="hfn-block-actions">
            <button data-role="move-up" data-idx="${i}" title="上移">▲</button>
            <button data-role="move-down" data-idx="${i}" title="下移">▼</button>
            <button data-role="dup-block" data-idx="${i}" title="複製">⎘</button>
            <button data-role="remove-block" data-idx="${i}" title="刪除" class="danger">×</button>
          </div>
        </div>
        <div class="hfn-block-body">${body}</div>
        ${renderInserter(i + 1)}
      </div>
    `;
  }

  function renderInserter(insertAt) {
    return `
      <div class="hfn-block-inserter">
        <button data-role="insert-block" data-type="paragraph" data-at="${insertAt}">＋ 文字</button>
        <button data-role="insert-block" data-type="image" data-at="${insertAt}">＋ 圖片</button>
        <button data-role="insert-block" data-type="divider" data-at="${insertAt}">＋ 分隔線</button>
      </div>
    `;
  }

  /* ---------- Events ---------- */
  function bindEvents() {
    rootEl.querySelectorAll('[data-role="close"]').forEach(el => el.addEventListener('click', close));

    const search = rootEl.querySelector('[data-role="search"]');
    if (search) {
      search.addEventListener('input', e => {
        searchTerm = e.target.value;
        persistDraftState();
        render();
      });
    }

    rootEl.querySelectorAll('[data-role="select"]').forEach(el => {
      el.addEventListener('click', async () => {
        if (!(await resolveUnsavedBeforeContinue('尚有未儲存的變更，切換消息前是否先儲存？'))) return;
        selectedId = el.getAttribute('data-id');
        render();
      });
    });

    rootEl.querySelector('[data-role="new"]')?.addEventListener('click', async () => {
      if (!(await resolveUnsavedBeforeContinue('尚有未儲存的變更，建立新消息前是否先儲存？'))) return;
      selectedId = null;
      dirtyDraft = {
        id: '', title: '', subtitle: '',
        publishedDate: '',
        coverImage: '', categories: [], tags: [], summary: '',
        featured: false, external: '',
        blocks: [{ type: 'paragraph', text: '' }]
      };
      persistDraftState();
      render();
    });

    rootEl.querySelector('[data-role="export"]')?.addEventListener('click', async () => {
      if (!(await resolveUnsavedBeforeContinue('匯出前有未儲存的變更，是否先儲存？'))) return;
      exportJSON();
    });
    rootEl.querySelector('[data-role="import"]')?.addEventListener('click', async () => {
      if (!(await resolveUnsavedBeforeContinue('匯入前有未儲存的變更，是否先儲存？'))) return;
      importJSON();
    });
    rootEl.querySelector('[data-role="reset"]')?.addEventListener('click', async () => {
      if (!(await resolveUnsavedBeforeContinue('重置前有未儲存的變更，是否先儲存？'))) return;
      if (confirm('確定重置為預設資料？當前所有變更會遺失。')) {
        NewsStore.reset();
        discardDirtyDraft();
        selectedId = NewsStore.getAll()[0]?.id || null;
        render();
        toast('已重置為預設資料');
      }
    });

    // 表單欄位
    rootEl.querySelectorAll('[data-field]').forEach(el => {
      el.addEventListener('input', () => {
        ensureDraft();
        const f = el.getAttribute('data-field');
        if (f === 'featured') dirtyDraft.featured = el.checked;
        else if (f === 'tags') dirtyDraft.tags = el.value.split(',').map(s => s.trim()).filter(Boolean);
        else dirtyDraft[f] = el.value;
        persistDraftState();
        if (f === 'coverImage') {
          const pv = rootEl.querySelector('.hfn-cover-preview');
          if (pv) {
            pv.style.backgroundImage = el.value ? `url('${el.value}')` : '';
            pv.textContent = el.value ? '' : '未設定封面（會自動套用站內圖庫）';
          }
        }
      });
    });

    rootEl.querySelectorAll('[data-role="toggle-cat"]').forEach(el =>
      el.addEventListener('click', () => {
        ensureDraft();
        const cat = el.getAttribute('data-cat');
        const set = new Set(dirtyDraft.categories || []);
        if (set.has(cat)) set.delete(cat); else set.add(cat);
        dirtyDraft.categories = Array.from(set);
        persistDraftState();
        el.classList.toggle('on');
      })
    );
    rootEl.querySelector('[data-role="add-cat"]')?.addEventListener('click', () => {
      const name = prompt('新分類名稱：');
      if (!name) return;
      ensureDraft();
      dirtyDraft.categories = Array.from(new Set([...(dirtyDraft.categories || []), name.trim()]));
      persistDraftState();
      render();
    });

    // 封面上傳
    rootEl.querySelector('[data-role="upload-cover"]')?.addEventListener('change', e => {
      const file = e.target.files?.[0]; if (!file) return;
      ensureDraft();
      dirtyDraft.coverImage = newsImagePathFromFile(file);
      persistDraftState();
      toast('已設定封面路徑為 ' + dirtyDraft.coverImage);
      render();
    });

    // Blocks 欄位輸入
    rootEl.querySelectorAll('[data-block-field]').forEach(el => {
      el.addEventListener('input', () => {
        ensureDraft();
        const idx = Number(el.getAttribute('data-idx'));
        const field = el.getAttribute('data-block-field');
        if (!dirtyDraft.blocks[idx]) return;
        dirtyDraft.blocks[idx][field] = el.value;
        persistDraftState();
      });
    });

    // 文字類型切換（段落 / 標題 / 引言）
    rootEl.querySelectorAll('[data-role="switch-text-type"]').forEach(el => {
      el.addEventListener('change', () => {
        ensureDraft();
        const idx = Number(el.getAttribute('data-idx'));
        const block = dirtyDraft.blocks[idx];
        if (!block) return;
        const ta = rootEl.querySelector('[data-block-field="text"][data-idx="' + idx + '"]');
        if (ta) block.text = ta.value;
        const citeEl = rootEl.querySelector('[data-block-field="cite"][data-idx="' + idx + '"]');
        if (citeEl) block.cite = citeEl.value;
        const text = block.text || '';
        const value = el.value;
        if (value.indexOf('heading') === 0) {
          const level = value === 'heading-3' ? 3 : 2;
          dirtyDraft.blocks[idx] = { type: 'heading', level: level, text: text };
        } else if (value === 'quote') {
          dirtyDraft.blocks[idx] = { type: 'quote', text: text, cite: block.cite || '' };
        } else {
          dirtyDraft.blocks[idx] = { type: 'paragraph', text: text };
        }
        persistDraftState();
        render();
      });
    });

    // 圖片尺寸切換
    rootEl.querySelectorAll('[data-role="set-img-size"]').forEach(el => {
      el.addEventListener('click', () => {
        ensureDraft();
        const idx = Number(el.getAttribute('data-idx'));
        const size = el.getAttribute('data-size') === 'small' ? 'small' : 'large';
        if (!dirtyDraft.blocks[idx]) return;
        dirtyDraft.blocks[idx].size = size;
        persistDraftState();
        render();
      });
    });

    // Block 圖片上傳（可多選，自動建立多個圖片區塊）
    rootEl.querySelectorAll('[data-role="upload-block-image"]').forEach(el => {
      el.addEventListener('change', e => {
        const files = Array.from(e.target.files || []);
        if (!files.length) return;
        const idx = Number(el.getAttribute('data-idx'));
        ensureDraft();
        const current = dirtyDraft.blocks[idx];
        if (!current || current.type !== 'image') return;

        const first = files[0];
        current.src = newsImagePathFromFile(first);

        const currentSize = current.size === 'small' ? 'small' : 'large';
        const extraBlocks = files.slice(1).map(file => ({
          type: 'image',
          src: newsImagePathFromFile(file),
          caption: '', alt: '', size: currentSize
        }));
        if (extraBlocks.length) {
          dirtyDraft.blocks.splice(idx + 1, 0, ...extraBlocks);
        }

        try { e.target.value = ''; } catch (_) {}
        persistDraftState();
        toast(files.length > 1
          ? '已新增 ' + files.length + ' 張圖片，路徑預設為 /HuaFan/image/news/'
          : '已設定圖片路徑為 ' + current.src);
        render();
      });
    });

    // Block 動作：新增/刪除/複製/上下移
    rootEl.querySelectorAll('[data-role="insert-block"]').forEach(el => {
      el.addEventListener('click', () => {
        ensureDraft();
        const at = Number(el.getAttribute('data-at'));
        const type = el.getAttribute('data-type');
        dirtyDraft.blocks.splice(at, 0, newBlock(type));
        persistDraftState();
        render();
      });
    });
    rootEl.querySelectorAll('[data-role="remove-block"]').forEach(el => {
      el.addEventListener('click', () => {
        ensureDraft();
        const idx = Number(el.getAttribute('data-idx'));
        dirtyDraft.blocks.splice(idx, 1);
        persistDraftState();
        render();
      });
    });
    rootEl.querySelectorAll('[data-role="dup-block"]').forEach(el => {
      el.addEventListener('click', () => {
        ensureDraft();
        const idx = Number(el.getAttribute('data-idx'));
        const copy = JSON.parse(JSON.stringify(dirtyDraft.blocks[idx]));
        dirtyDraft.blocks.splice(idx + 1, 0, copy);
        persistDraftState();
        render();
      });
    });
    rootEl.querySelectorAll('[data-role="move-up"]').forEach(el => {
      el.addEventListener('click', () => {
        ensureDraft();
        const i = Number(el.getAttribute('data-idx'));
        if (i <= 0) return;
        const arr = dirtyDraft.blocks;
        [arr[i - 1], arr[i]] = [arr[i], arr[i - 1]];
        persistDraftState();
        render();
      });
    });
    rootEl.querySelectorAll('[data-role="move-down"]').forEach(el => {
      el.addEventListener('click', () => {
        ensureDraft();
        const i = Number(el.getAttribute('data-idx'));
        const arr = dirtyDraft.blocks;
        if (i >= arr.length - 1) return;
        [arr[i], arr[i + 1]] = [arr[i + 1], arr[i]];
        persistDraftState();
        render();
      });
    });

    // 底部按鈕
    rootEl.querySelector('[data-role="save"]')?.addEventListener('click', () => {
      if (!saveDraft()) return;
      render();
    });
    rootEl.querySelector('[data-role="cancel"]')?.addEventListener('click', async () => {
      if (!(await resolveUnsavedBeforeContinue('取消編輯前，是否先儲存目前變更？'))) return;
      render();
    });
    rootEl.querySelector('[data-role="delete"]')?.addEventListener('click', () => {
      if (!selectedId) return;
      if (!confirm('確定刪除這則消息？此動作無法復原（但仍保留於已匯出的 JSON 檔）。')) return;
      NewsStore.remove(selectedId);
      discardDirtyDraft();
      selectedId = NewsStore.getAll()[0]?.id || null;
      render();
      toast('已刪除');
    });
  }

  function ensureDraft() {
    if (dirtyDraft) return;
    const cur = NewsStore.getById(selectedId);
    dirtyDraft = cur ? JSON.parse(JSON.stringify(cur)) : null;
    persistDraftState();
  }

  function saveDraft() {
    if (!dirtyDraft) return true;
    if (!dirtyDraft.title || !dirtyDraft.title.trim()) { alert('請輸入消息標題'); return false; }
    const saved = NewsStore.save(dirtyDraft);
    selectedId = saved.id;
    dirtyDraft = null;
    clearDraftState();
    toast('已儲存');
    return true;
  }

  function newBlock(type) {
    switch (type) {
      case 'heading':   return { type: 'heading', level: 2, text: '' };
      case 'paragraph': return { type: 'paragraph', text: '' };
      case 'quote':     return { type: 'quote', text: '', cite: '' };
      case 'image':     return { type: 'image', src: '', caption: '', alt: '', size: 'large' };
      case 'divider':   return { type: 'divider' };
      default:          return { type: 'paragraph', text: '' };
    }
  }

  /* ---------- Import / Export ---------- */
  function exportJSON() {
    const blob = new Blob([NewsStore.exportJSON()], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'news-data.json';
    document.body.appendChild(a); a.click(); a.remove();
    URL.revokeObjectURL(url);
    toast('已下載 news-data.json');
    alert('請上傳此檔至網站根目錄（與 news.html 同層），取代舊檔後所有訪客即會看到最新內容。\n圖片檔請歸檔於 HuaFan/image/news，並維持欄位中的路徑一致。');
  }

  function importJSON() {
    const input = document.createElement('input');
    input.type = 'file'; input.accept = 'application/json,.json';
    input.onchange = () => {
      const f = input.files?.[0]; if (!f) return;
      const reader = new FileReader();
      reader.onload = () => {
        try {
          const mode = confirm('按「確定」= 合併（保留現有並更新同 ID）\n按「取消」= 完全取代') ? 'merge' : 'replace';
          NewsStore.importJSON(String(reader.result), mode);
          selectedId = NewsStore.getAll()[0]?.id || null;
          discardDirtyDraft();
          render();
          toast('匯入完成');
        } catch (err) { alert('匯入失敗：' + err.message); }
      };
      reader.readAsText(f);
    };
    input.click();
  }

  /* ---------- Helpers ---------- */
  function newsImagePathFromFile(file) {
    const name = String((file && file.name) || '').split(/[\\/]/).pop().trim();
    return name ? '/HuaFan/image/news/' + name : '';
  }
  function escapeHtml(s) {
    return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }
  function escapeAttr(s) {
    return escapeHtml(s).replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  /* ---------- Keyboard shortcut ---------- */
  document.addEventListener('keydown', e => {
    const isMac = navigator.platform.toUpperCase().includes('MAC');
    const modifier = isMac ? e.metaKey : e.ctrlKey;
    if (modifier && e.shiftKey && (e.key === 'e' || e.key === 'E')) {
      e.preventDefault();
      if (rootEl) close(); else open();
    }
    if (e.key === 'Escape' && rootEl) close();
  });

  window.addEventListener('beforeunload', e => {
    if (!hasUnsavedDraft()) return;
    e.preventDefault();
    e.returnValue = '';
  });

  /* 右下角極簡提示 */
  const hint = document.createElement('div');
  hint.id = 'hfn-admin-hint';
  hint.textContent = '⌘ + ⇧ + E · News Admin';
  document.body.appendChild(hint);
  document.addEventListener('mousemove', e => {
    const near = e.clientX > window.innerWidth - 240 && e.clientY > window.innerHeight - 100;
    hint.classList.toggle('show', near);
  });

  window.HuaFanNewsAdmin = { open, close };
})();
