/* ============================================================
 * hf-wiki-admin.js — 華梵禮儀百科「隱藏管理系統」
 * ------------------------------------------------------------
 * 觸發：Cmd + Shift + E   (Mac) / Ctrl + Shift + E (Win/Linux)
 * 功能（程式邏輯仿照視丘 insights-admin.js）：
 *   1. 開啟浮動管理面板（覆蓋於 wiki.html / wiki_base-detail.html / wiki_top-detail.html）
 *   2. 左側列表：釘選文章與一般文章分組，可新增/刪除/搜尋
 *   3. 右側表單：
 *      - 一般文章 → 標準面板（段落 / 標題 / 引言 / 圖片 / 分隔線）
 *      - 釘選文章 → 量身面板（另支援 手風琴 / 卡片格 / 按鈕列卡 / 提示框 / 自由 HTML）
 *   4. 匯出 JSON（wiki-data.json） / 匯入 JSON / 重置
 *
 * 依賴：window.WikiStore (js/hf-wiki-data.js)
 * ============================================================ */

(function () {
  'use strict';

  if (typeof window.WikiStore === 'undefined') {
    console.warn('[wiki-admin] 找不到 WikiStore，請先載入 js/hf-wiki-data.js');
    return;
  }

  const STYLE_ID = 'hfw-admin-style';
  if (!document.getElementById(STYLE_ID)) {
    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = `
      #hfw-admin-root, #hfw-admin-root * { box-sizing: border-box; }
      #hfw-admin-root {
        position: fixed; inset: 0; z-index: 99999;
        font-family: "Noto Sans TC", system-ui, -apple-system, sans-serif;
        color: #3D443B;
      }
      #hfw-admin-root .hfw-backdrop {
        position: absolute; inset: 0;
        background: rgba(47, 62, 43, 0.55);
        backdrop-filter: blur(6px);
      }
      #hfw-admin-root .hfw-panel {
        position: absolute; top: 50%; left: 50%;
        transform: translate(-50%, -50%);
        width: min(1280px, 96vw); height: min(90vh, 960px);
        background: #fff; border-radius: 14px;
        box-shadow: 0 40px 80px -20px rgba(0,0,0,0.35);
        display: flex; overflow: hidden;
      }
      #hfw-admin-root .hfw-side {
        width: 320px; border-right: 1px solid #E3EBE5;
        display: flex; flex-direction: column; background: #F7F5F0;
      }
      #hfw-admin-root .hfw-side-head { padding: 20px 20px 14px; border-bottom: 1px solid #E3EBE5; }
      #hfw-admin-root .hfw-side-title { font-family: "Noto Serif TC", serif; font-size: 20px; font-weight: 700; margin: 0 0 4px; color: #2F3E2B; }
      #hfw-admin-root .hfw-side-sub { font-size: 11px; color: #C5A670; letter-spacing: 0.15em; text-transform: uppercase; margin: 0; font-weight: 700; }
      #hfw-admin-root .hfw-search {
        margin: 12px 20px; padding: 10px 12px;
        border: 1px solid #DDE2D8; border-radius: 8px;
        background: #fff; font-size: 13px; outline: none;
      }
      #hfw-admin-root .hfw-search:focus { border-color: #465B40; }
      #hfw-admin-root .hfw-list { flex: 1; overflow-y: auto; padding: 4px 12px 12px; }
      #hfw-admin-root .hfw-group-label {
        font-size: 10px; font-weight: 700; letter-spacing: 0.2em;
        color: #C5A670; text-transform: uppercase;
        padding: 10px 8px 4px;
      }
      #hfw-admin-root .hfw-list-item {
        display: flex; gap: 10px; align-items: center;
        padding: 8px; margin-bottom: 4px; border-radius: 8px;
        cursor: pointer; transition: background 0.15s;
      }
      #hfw-admin-root .hfw-list-item:hover { background: #E3EBE5; }
      #hfw-admin-root .hfw-list-item.active { background: #465B40; color: #fff; }
      #hfw-admin-root .hfw-list-item.active .hfw-list-sub { color: #C9D2C4; }
      #hfw-admin-root .hfw-list-thumb {
        width: 48px; height: 48px; border-radius: 6px;
        background: #DDE2D8 center/cover no-repeat; flex-shrink: 0;
      }
      #hfw-admin-root .hfw-list-text { min-width: 0; flex: 1; }
      #hfw-admin-root .hfw-list-title { font-size: 13px; font-weight: 500; margin: 0 0 2px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
      #hfw-admin-root .hfw-list-sub { font-size: 11px; color: #8B9287; margin: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
      #hfw-admin-root .hfw-list-star { font-size: 12px; color: #C5A670; }
      #hfw-admin-root .hfw-list-pin { font-size: 11px; color: #465B40; }
      #hfw-admin-root .hfw-list-item.active .hfw-list-pin { color: #C5A670; }

      #hfw-admin-root .hfw-side-foot { padding: 12px 20px; border-top: 1px solid #E3EBE5; display: flex; flex-direction: column; gap: 8px; }
      #hfw-admin-root .hfw-btn { padding: 9px 14px; border-radius: 8px; font-size: 13px; font-weight: 500; cursor: pointer; border: 1px solid transparent; display: inline-flex; align-items: center; justify-content: center; gap: 6px; transition: all 0.15s; }
      #hfw-admin-root .hfw-btn-primary { background: #465B40; color: #fff; }
      #hfw-admin-root .hfw-btn-primary:hover { background: #2F3E2B; }
      #hfw-admin-root .hfw-btn-ghost { background: transparent; color: #465B40; border-color: #DDE2D8; }
      #hfw-admin-root .hfw-btn-ghost:hover { background: #E3EBE5; }
      #hfw-admin-root .hfw-btn-danger { background: #9F4A46; color: #fff; }
      #hfw-admin-root .hfw-btn-danger:hover { background: #83403C; }
      #hfw-admin-root .hfw-btn-sm { padding: 6px 10px; font-size: 12px; }

      #hfw-admin-root .hfw-main { flex: 1; display: flex; flex-direction: column; min-width: 0; }
      #hfw-admin-root .hfw-main-head { padding: 16px 24px; border-bottom: 1px solid #E3EBE5; display: flex; align-items: center; justify-content: space-between; gap: 12px; }
      #hfw-admin-root .hfw-main-title { font-family: "Noto Serif TC", serif; font-size: 18px; font-weight: 700; margin: 0; color: #2F3E2B; }
      #hfw-admin-root .hfw-mode-badge {
        font-size: 10px; font-weight: 700; letter-spacing: 0.12em;
        padding: 3px 10px; border-radius: 999px;
      }
      #hfw-admin-root .hfw-mode-badge.pinned { background: #465B40; color: #C5A670; }
      #hfw-admin-root .hfw-mode-badge.base { background: #E3EBE5; color: #465B40; }
      #hfw-admin-root .hfw-close { width: 34px; height: 34px; border-radius: 50%; border: 1px solid #DDE2D8; background: #fff; cursor: pointer; font-size: 16px; color: #8B9287; display: inline-flex; align-items: center; justify-content: center; }
      #hfw-admin-root .hfw-close:hover { background: #F7F5F0; color: #2F3E2B; }
      #hfw-admin-root .hfw-form { flex: 1; overflow-y: auto; padding: 20px 24px 24px; }
      #hfw-admin-root .hfw-empty { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; color: #ADB5A9; text-align: center; padding: 40px; }
      #hfw-admin-root .hfw-empty h3 { font-family: "Noto Serif TC", serif; font-size: 22px; color: #8B9287; margin: 12px 0 6px; }
      #hfw-admin-root .hfw-empty p { margin: 0; font-size: 13px; }

      #hfw-admin-root .hfw-field { margin-bottom: 18px; }
      #hfw-admin-root .hfw-label { display: block; font-size: 12px; font-weight: 600; color: #465B40; margin-bottom: 6px; letter-spacing: 0.05em; }
      #hfw-admin-root .hfw-input, #hfw-admin-root .hfw-textarea, #hfw-admin-root .hfw-select {
        width: 100%; padding: 9px 12px; border: 1px solid #DDE2D8;
        border-radius: 8px; font-size: 13px; font-family: inherit;
        outline: none; background: #fff; color: #3D443B;
      }
      #hfw-admin-root .hfw-input:focus, #hfw-admin-root .hfw-textarea:focus, #hfw-admin-root .hfw-select:focus { border-color: #465B40; }
      #hfw-admin-root .hfw-textarea { min-height: 80px; resize: vertical; line-height: 1.7; }
      #hfw-admin-root .hfw-row { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
      #hfw-admin-root .hfw-row-3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 14px; }
      #hfw-admin-root .hfw-cover-preview {
        width: 100%; aspect-ratio: 3/2; border-radius: 8px;
        background: #F7F5F0 center/cover no-repeat;
        border: 1px dashed #DDE2D8; margin-bottom: 8px;
        display: flex; align-items: center; justify-content: center;
        color: #ADB5A9; font-size: 12px;
      }
      #hfw-admin-root .hfw-image-row { display: flex; gap: 8px; align-items: center; }
      #hfw-admin-root .hfw-image-row .hfw-input { flex: 1; }
      #hfw-admin-root .hfw-file-btn { padding: 9px 14px; border-radius: 8px; font-size: 12px; background: #F7F5F0; border: 1px solid #DDE2D8; color: #465B40; cursor: pointer; white-space: nowrap; }
      #hfw-admin-root .hfw-file-btn:hover { background: #E3EBE5; }

      #hfw-admin-root .hfw-cat-list { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 4px; }
      #hfw-admin-root .hfw-cat-chip { padding: 5px 10px; border-radius: 999px; font-size: 11px; border: 1px solid #DDE2D8; cursor: pointer; user-select: none; color: #8B9287; background: #fff; transition: all 0.15s; }
      #hfw-admin-root .hfw-cat-chip.on { background: #465B40; color: #fff; border-color: #465B40; }

      /* Blocks 編輯區 */
      #hfw-admin-root .hfw-blocks {
        border: 1px solid #DDE2D8; border-radius: 10px;
        padding: 10px; background: #FAFAF7;
      }
      #hfw-admin-root .hfw-block {
        background: #fff; border: 1px solid #E3EBE5; border-radius: 8px;
        padding: 10px; margin-bottom: 8px; position: relative;
      }
      #hfw-admin-root .hfw-block-head {
        display: flex; align-items: center; gap: 8px;
        font-size: 11px; color: #8B9287; margin-bottom: 6px;
      }
      #hfw-admin-root .hfw-block-type {
        display: inline-flex; align-items: center; gap: 4px;
        padding: 2px 8px; border-radius: 999px;
        background: #E3EBE5; color: #465B40; font-weight: 600;
        letter-spacing: 0.06em;
      }
      #hfw-admin-root .hfw-block-actions { margin-left: auto; display: flex; gap: 4px; }
      #hfw-admin-root .hfw-block-actions button {
        border: 1px solid #DDE2D8; background: #fff; color: #8B9287;
        width: 26px; height: 26px; border-radius: 6px; cursor: pointer;
        font-size: 12px; display: inline-flex; align-items: center; justify-content: center;
      }
      #hfw-admin-root .hfw-block-actions button:hover { background: #F7F5F0; color: #2F3E2B; }
      #hfw-admin-root .hfw-block-actions button.danger:hover { background: #F6E4E3; color: #9F4A46; border-color: #E5B5B3; }
      #hfw-admin-root .hfw-block-body input[type="text"],
      #hfw-admin-root .hfw-block-body textarea,
      #hfw-admin-root .hfw-block-body select {
        width: 100%; padding: 8px 10px; border: 1px solid #E3EBE5;
        border-radius: 6px; font-size: 13px; font-family: inherit;
        outline: none; background: #fff; color: #3D443B; margin-bottom: 6px;
      }
      #hfw-admin-root .hfw-block-body input[type="text"]:focus,
      #hfw-admin-root .hfw-block-body textarea:focus { border-color: #465B40; }
      #hfw-admin-root .hfw-block-body textarea { min-height: 80px; resize: vertical; line-height: 1.75; }
      #hfw-admin-root .hfw-block-body textarea.hfw-html { font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 12px; }
      #hfw-admin-root .hfw-block-body .hfw-img-preview {
        width: 100%; max-height: 220px; object-fit: contain;
        background: #F7F5F0; border-radius: 6px; margin: 4px 0 6px;
        display: block;
      }
      #hfw-admin-root .hfw-block-body .hfw-divider-hint {
        text-align: center; color: #ADB5A9; font-size: 12px; padding: 8px 0;
        letter-spacing: 0.3em;
      }
      #hfw-admin-root .hfw-subitem {
        border: 1px dashed #DDE2D8; border-radius: 8px;
        padding: 10px; margin-bottom: 8px; background: #FCFCFA;
      }
      #hfw-admin-root .hfw-subitem-head {
        display: flex; align-items: center; gap: 6px;
        font-size: 11px; color: #8B9287; margin-bottom: 6px;
      }
      #hfw-admin-root .hfw-subitem-head .hfw-block-actions { margin-left: auto; }
      #hfw-admin-root .hfw-add-subitem {
        width: 100%; padding: 7px; border-radius: 6px; font-size: 12px;
        border: 1px dashed #C5A670; background: #fff; color: #465B40; cursor: pointer;
      }
      #hfw-admin-root .hfw-add-subitem:hover { background: rgba(197,166,112,0.08); }
      #hfw-admin-root .hfw-block-inserter {
        display: flex; flex-wrap: wrap; gap: 6px; padding: 8px 4px 2px;
        justify-content: center; border-top: 1px dashed #E3EBE5; margin-top: 4px;
      }
      #hfw-admin-root .hfw-block-inserter button {
        padding: 6px 12px; border-radius: 999px; font-size: 12px;
        border: 1px solid #DDE2D8; background: #fff; color: #465B40;
        cursor: pointer; display: inline-flex; align-items: center; gap: 4px;
      }
      #hfw-admin-root .hfw-block-inserter button:hover { background: #465B40; color: #fff; border-color: #465B40; }

      #hfw-admin-root .hfw-toolbar { display: flex; gap: 8px; padding: 14px 24px; border-top: 1px solid #E3EBE5; background: #F7F5F0; align-items: center; }
      #hfw-admin-root .hfw-toolbar-spacer { flex: 1; }
      #hfw-admin-root .hfw-toggle { display: inline-flex; align-items: center; gap: 8px; font-size: 13px; color: #465B40; cursor: pointer; }
      #hfw-admin-root .hfw-toggle input { accent-color: #465B40; }

      #hfw-admin-root .hfw-toast, .hfw-toast-global {
        position: fixed; bottom: 24px; left: 50%; transform: translateX(-50%);
        padding: 12px 20px; background: #2F3E2B; color: #fff; border-radius: 8px;
        font-size: 13px; z-index: 100000; box-shadow: 0 10px 30px rgba(0,0,0,0.2);
        animation: hfw-toast-in 0.25s ease-out;
      }
      @keyframes hfw-toast-in { from { opacity: 0; transform: translate(-50%, 20px); } to { opacity: 1; transform: translate(-50%, 0); } }

      #hfw-admin-root .hfw-dialog-backdrop {
        position: absolute; inset: 0; background: rgba(47, 62, 43, 0.24);
        display: flex; align-items: center; justify-content: center; z-index: 100001;
      }
      #hfw-admin-root .hfw-dialog {
        width: min(460px, calc(100vw - 32px));
        background: #fff; border-radius: 16px;
        box-shadow: 0 30px 80px -28px rgba(0,0,0,0.35); overflow: hidden;
      }
      #hfw-admin-root .hfw-dialog-body {
        padding: 24px 26px 20px; font-size: 17px; line-height: 1.7; color: #2F3E2B;
      }
      #hfw-admin-root .hfw-dialog-actions {
        display: flex; justify-content: flex-end; gap: 10px;
        padding: 14px 18px 18px; border-top: 1px solid #E3EBE5;
      }

      #hfw-admin-hint {
        position: fixed; bottom: 12px; right: 12px; z-index: 99998;
        padding: 6px 10px; border-radius: 6px; background: rgba(47,62,43,0.72);
        color: #fff; font-size: 10px; letter-spacing: 0.1em;
        font-family: "Noto Sans TC", sans-serif; pointer-events: none;
        opacity: 0; transition: opacity 0.3s;
      }
      #hfw-admin-hint.show { opacity: 1; }

      @media (max-width: 900px) {
        #hfw-admin-root .hfw-panel { width: 100vw; height: 100vh; border-radius: 0; flex-direction: column; }
        #hfw-admin-root .hfw-side { width: 100%; height: 40%; border-right: none; border-bottom: 1px solid #E3EBE5; }
        #hfw-admin-root .hfw-row, #hfw-admin-root .hfw-row-3 { grid-template-columns: 1fr; }
      }
    `;
    document.head.appendChild(style);
  }

  /* ---------- State ---------- */
  const DRAFT_STORAGE_KEY = 'HUAFAN_WIKI_ADMIN_DRAFT_V1';
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
      wrap.className = 'hfw-dialog-backdrop';
      wrap.innerHTML = '' +
        '<div class="hfw-dialog" role="alertdialog" aria-modal="true" aria-labelledby="hfw-dialog-title">' +
          '<div class="hfw-dialog-body" id="hfw-dialog-title">' + escapeHtml(message || '尚有未儲存的變更，是否繼續？') + '</div>' +
          '<div class="hfw-dialog-actions">' +
            '<button class="hfw-btn hfw-btn-ghost hfw-btn-sm" data-dialog-action="discard">捨棄</button>' +
            '<button class="hfw-btn hfw-btn-primary hfw-btn-sm" data-dialog-action="save">儲存</button>' +
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
    t.className = 'hfw-toast-global'; t.textContent = msg;
    document.body.appendChild(t);
    setTimeout(() => t.remove(), 2200);
  }

  /* ---------- Open / Close ---------- */
  function open() {
    if (rootEl) return;
    const restored = !dirtyDraft && restoreDraftState();
    rootEl = document.createElement('div');
    rootEl.id = 'hfw-admin-root';
    document.body.appendChild(rootEl);
    if (!restored) {
      const all = WikiStore.getAll();
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
    const all = WikiStore.getAll();
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
    const prevForm = rootEl.querySelector('.hfw-form');
    const prevList = rootEl.querySelector('.hfw-list');
    const savedFormScroll = prevForm ? prevForm.scrollTop : 0;
    const savedListScroll = prevList ? prevList.scrollTop : 0;
    const activeEl = document.activeElement;
    const activeMarker = activeEl && rootEl.contains(activeEl)
      ? {
          field: activeEl.getAttribute('data-block-field') || activeEl.getAttribute('data-field') || activeEl.getAttribute('data-role'),
          idx: activeEl.getAttribute('data-idx'),
          sub: activeEl.getAttribute('data-sub'),
          selStart: typeof activeEl.selectionStart === 'number' ? activeEl.selectionStart : null,
          selEnd: typeof activeEl.selectionEnd === 'number' ? activeEl.selectionEnd : null
        }
      : null;

    const all = WikiStore.getAll();
    const filtered = filteredList();
    const pinnedItems = filtered.filter(p => p.pinned).sort((a, b) => (a.pinnedOrder || 0) - (b.pinnedOrder || 0));
    const baseItems = filtered.filter(p => !p.pinned);
    const current = all.find(p => p.id === selectedId) || null;
    const draft = dirtyDraft || current;

    rootEl.innerHTML = `
      <div class="hfw-backdrop" data-role="close"></div>
      <div class="hfw-panel" role="dialog" aria-label="禮儀百科管理">
        <aside class="hfw-side">
          <div class="hfw-side-head">
            <h2 class="hfw-side-title">禮儀百科管理</h2>
            <p class="hfw-side-sub">Wiki Admin</p>
          </div>
          <input class="hfw-search" data-role="search" placeholder="搜尋標題／分類／標籤…" value="${escapeAttr(searchTerm)}">
          <div class="hfw-list" data-role="list">
            ${pinnedItems.length ? '<p class="hfw-group-label"><i class="fa-solid fa-thumbtack"></i> 釘選文章</p>' : ''}
            ${pinnedItems.map(p => renderListItem(p)).join('')}
            ${baseItems.length ? '<p class="hfw-group-label"><i class="fa-regular fa-file-lines"></i> 一般文章</p>' : ''}
            ${baseItems.map(p => renderListItem(p)).join('')}
            ${!filtered.length ? '<p style="padding:20px;color:#ADB5A9;font-size:12px;text-align:center;">找不到符合的文章</p>' : ''}
          </div>
          <div class="hfw-side-foot">
            <div style="display:flex;gap:6px;">
              <button class="hfw-btn hfw-btn-primary" data-role="new" style="flex:1;"><span>＋</span> 新增文章</button>
              <button class="hfw-btn hfw-btn-ghost" data-role="new-pinned" style="flex:1;"><span>＋</span> 新增釘選</button>
            </div>
            <div style="display:flex;gap:6px;">
              <button class="hfw-btn hfw-btn-ghost hfw-btn-sm" data-role="export" style="flex:1;">匯出 JSON</button>
              <button class="hfw-btn hfw-btn-ghost hfw-btn-sm" data-role="import" style="flex:1;">匯入 JSON</button>
            </div>
            <p style="margin:6px 2px 0;font-size:11px;line-height:1.6;color:#8B9287;">編輯資料先儲存在瀏覽器（localStorage），不會自動寫入網站檔案。若要落地保存，請按「匯出 JSON」並上傳 wiki-data.json。</p>
            <button class="hfw-btn hfw-btn-ghost hfw-btn-sm" data-role="reset" style="color:#9F4A46;border-color:#E5B5B3;">重置為預設資料</button>
          </div>
        </aside>
        <main class="hfw-main">
          ${draft ? renderForm(draft, !current) : renderEmpty()}
        </main>
      </div>
    `;
    bindEvents();

    const newForm = rootEl.querySelector('.hfw-form');
    const newList = rootEl.querySelector('.hfw-list');
    if (newForm) newForm.scrollTop = savedFormScroll;
    if (newList) newList.scrollTop = savedListScroll;

    // 嘗試把焦點還給剛才在編輯的欄位
    if (activeMarker && (activeMarker.field || activeMarker.idx)) {
      let selector = '';
      if (activeMarker.field && activeMarker.idx != null && activeMarker.sub != null) {
        selector = '[data-block-field="' + activeMarker.field + '"][data-idx="' + activeMarker.idx + '"][data-sub="' + activeMarker.sub + '"]';
      } else if (activeMarker.field && activeMarker.idx != null) {
        selector = '[data-block-field="' + activeMarker.field + '"][data-idx="' + activeMarker.idx + '"]:not([data-sub])';
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
    const cover = WikiStore.coverOf(p);
    const bg = cover ? `background-image:url('${escapeAttr(cover)}')` : '';
    return `
      <div class="hfw-list-item ${active}" data-role="select" data-id="${escapeAttr(p.id)}">
        <div class="hfw-list-thumb" style="${bg}"></div>
        <div class="hfw-list-text">
          <p class="hfw-list-title">${p.pinned ? '<i class="fa-solid fa-thumbtack hfw-list-pin"></i> ' : ''}${escapeHtml(p.title)}</p>
          <p class="hfw-list-sub">${escapeHtml(p.publishedDate || '')} · ${escapeHtml((p.categories || [])[0] || '—')}</p>
        </div>
        ${p.featured ? '<span class="hfw-list-star" title="精選">★</span>' : ''}
      </div>
    `;
  }

  function renderEmpty() {
    return `
      <div class="hfw-empty">
        <div style="font-size:40px;">📖</div>
        <h3>尚無文章</h3>
        <p>點擊左下角「新增文章」開始撰寫第一則禮儀知識。</p>
      </div>
    `;
  }

  function renderForm(p, isNew) {
    const allCats = WikiStore.getAllCategories();
    const currentCats = new Set(p.categories || []);
    const cover = p.coverImage || '';
    const isPinned = !!p.pinned;
    return `
      <div class="hfw-main-head">
        <h2 class="hfw-main-title">${isNew ? '新增' : '編輯'}${isPinned ? '釘選文章' : '文章'}</h2>
        <span class="hfw-mode-badge ${isPinned ? 'pinned' : 'base'}">${isPinned ? '📌 釘選量身面板 · wiki_top-detail' : '一般面板 · wiki_base-detail'}</span>
        <button class="hfw-close" data-role="close" title="關閉 (Esc)">×</button>
      </div>
      <div class="hfw-form">
        <div class="hfw-field">
          <label class="hfw-label">封面圖（用於知識圖卡與詳細頁 Hero）</label>
          <div class="hfw-cover-preview" style="${cover ? `background-image:url('${escapeAttr(cover)}')` : ''}">
            ${cover ? '' : '未設定封面（會自動套用站內圖庫）'}
          </div>
          <div class="hfw-image-row">
            <input class="hfw-input" data-field="coverImage" placeholder="/HuaFan/image/wiki/檔名.webp 或外部網址" value="${escapeAttr(cover)}">
            <label class="hfw-file-btn">
              選擇檔案
              <input type="file" accept="image/*" hidden data-role="upload-cover">
            </label>
          </div>
          <p style="font-size:11px;color:#ADB5A9;margin:6px 0 0;">圖片請歸檔於 <strong>HuaFan/image/wiki</strong>，選擇檔案後會自動填入對應路徑。</p>
        </div>

        <div class="hfw-field">
          <label class="hfw-label">標題 *</label>
          <input class="hfw-input" data-field="title" value="${escapeAttr(p.title)}" required>
        </div>

        <div class="hfw-row">
          <div class="hfw-field">
            <label class="hfw-label">副標</label>
            <input class="hfw-input" data-field="subtitle" value="${escapeAttr(p.subtitle || '')}">
          </div>
          <div class="hfw-field">
            <label class="hfw-label">發布日期</label>
            <input class="hfw-input" data-field="publishedDate" type="date" value="${escapeAttr(p.publishedDate || '')}">
          </div>
        </div>

        <div class="hfw-row-3">
          <div class="hfw-field">
            <label class="hfw-label">標籤（逗號分隔）</label>
            <input class="hfw-input" data-field="tags" value="${escapeAttr((p.tags || []).join(', '))}">
          </div>
          ${isPinned ? `
          <div class="hfw-field">
            <label class="hfw-label">目錄圖示（Font Awesome class）</label>
            <input class="hfw-input" data-field="icon" placeholder="fa-solid fa-user-tie" value="${escapeAttr(p.icon || '')}">
          </div>
          <div class="hfw-field">
            <label class="hfw-label">釘選排序（小 → 大）</label>
            <input class="hfw-input" data-field="pinnedOrder" type="number" value="${escapeAttr(p.pinnedOrder || 0)}">
          </div>
          ` : `
          <div class="hfw-field" style="display:flex;align-items:flex-end;">
            <label class="hfw-toggle">
              <input type="checkbox" data-field="featured" ${p.featured ? 'checked' : ''}>
              標記為「精選」
            </label>
          </div>
          <div></div>
          `}
        </div>
        ${isPinned ? `
        <div class="hfw-field" style="display:flex;align-items:center;gap:18px;">
          <label class="hfw-toggle">
            <input type="checkbox" data-field="featured" ${p.featured ? 'checked' : ''}>
            標記為「精選」
          </label>
        </div>
        ` : ''}

        <div class="hfw-field">
          <label class="hfw-label">分類（可複選）</label>
          <div class="hfw-cat-list">
            ${allCats.map(c => `
              <span class="hfw-cat-chip ${currentCats.has(c) ? 'on' : ''}" data-role="toggle-cat" data-cat="${escapeAttr(c)}">${escapeHtml(c)}</span>
            `).join('')}
            <span class="hfw-cat-chip" data-role="add-cat" style="border-style:dashed;">＋ 新分類</span>
          </div>
        </div>

        <div class="hfw-field">
          <label class="hfw-label">摘要（圖卡顯示；留空會自動抓內文首段）</label>
          <textarea class="hfw-textarea" data-field="summary" placeholder="一段簡短的摘要…">${escapeHtml(p.summary || '')}</textarea>
        </div>

        <div class="hfw-field">
          <label class="hfw-label">內容區塊${isPinned ? '（釘選文章支援複合版型：手風琴、卡片格、按鈕列卡、提示框、自由 HTML）' : '（段落 / 標題 / 引言 / 圖片 / 分隔線）'}</label>
          <div class="hfw-blocks" data-role="blocks">
            ${(p.blocks || []).map((b, i) => renderBlock(b, i, isPinned)).join('')}
            ${renderInserter((p.blocks || []).length, isPinned)}
          </div>
        </div>
      </div>

      <div class="hfw-toolbar">
        ${!isNew ? '<button class="hfw-btn hfw-btn-danger hfw-btn-sm" data-role="delete">刪除此文章</button>' : ''}
        <div class="hfw-toolbar-spacer"></div>
        ${!isNew ? `<a class="hfw-btn hfw-btn-ghost hfw-btn-sm" href="${escapeAttr(WikiStore.detailUrlOf(p))}" target="_blank">預覽 ↗</a>` : ''}
        <button class="hfw-btn hfw-btn-ghost hfw-btn-sm" data-role="cancel">取消</button>
        <button class="hfw-btn hfw-btn-primary hfw-btn-sm" data-role="save">儲存</button>
      </div>
    `;
  }

  const BLOCK_LABELS = {
    heading:   '標題',
    paragraph: '段落',
    quote:     '引言',
    image:     '圖片',
    divider:   '分隔線',
    accordion: '手風琴（展開式）',
    cards:     '卡片格',
    actions:   '按鈕列卡',
    note:      '提示框',
    html:      '自由 HTML'
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

  function subitemActions(i, s) {
    return `
      <div class="hfw-block-actions">
        <button data-role="pitem-up" data-idx="${i}" data-sub="${s}" title="上移">▲</button>
        <button data-role="pitem-down" data-idx="${i}" data-sub="${s}" title="下移">▼</button>
        <button data-role="pitem-remove" data-idx="${i}" data-sub="${s}" title="刪除" class="danger">×</button>
      </div>
    `;
  }

  function renderBlock(b, i, isPinned) {
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
        ${b.src ? `<img class="hfw-img-preview" src="${escapeAttr(b.src)}" alt="" style="${size === 'small' ? 'max-width:33%;margin:4px auto 6px;' : ''}">` : `<div class="hfw-divider-hint">— 尚未設定圖片 —</div>`}
        <div class="hfw-image-row">
          <input type="text" data-block-field="src" data-idx="${i}" value="${escapeAttr(b.src || '')}" placeholder="/HuaFan/image/wiki/檔名.webp 或外部網址">
          <label class="hfw-file-btn">
            選擇檔案
            <input type="file" accept="image/*" multiple hidden data-role="upload-block-image" data-idx="${i}">
          </label>
        </div>
        <input type="text" data-block-field="caption" data-idx="${i}" value="${escapeAttr(b.caption || '')}" placeholder="圖說（選填）">
        <input type="text" data-block-field="alt" data-idx="${i}" value="${escapeAttr(b.alt || '')}" placeholder="替代文字 alt（選填，SEO 用）">
      `;
    } else if (b.type === 'divider') {
      body = `<div class="hfw-divider-hint">— — — 分 隔 線 — — —</div>`;
    } else if (b.type === 'accordion') {
      body = (b.items || []).map((it, s) => `
        <div class="hfw-subitem">
          <div class="hfw-subitem-head">
            <span>條目 ${s + 1}</span>
            <label class="hfw-toggle" style="font-size:11px;">
              <input type="checkbox" data-block-field="open" data-idx="${i}" data-sub="${s}" ${it.open ? 'checked' : ''}> 預設展開
            </label>
            ${subitemActions(i, s)}
          </div>
          <input type="text" data-block-field="title" data-idx="${i}" data-sub="${s}" value="${escapeAttr(it.title || '')}" placeholder="條目標題…">
          <textarea class="hfw-html" data-block-field="html" data-idx="${i}" data-sub="${s}" placeholder="條目內容（HTML，例：<p>…</p>）">${escapeHtml(it.html || '')}</textarea>
        </div>
      `).join('') + `<button type="button" class="hfw-add-subitem" data-role="pitem-add" data-idx="${i}">＋ 新增條目</button>`;
    } else if (b.type === 'cards') {
      const cols = b.cols === 2 ? 2 : 3;
      body = `
        <div style="display:flex;gap:6px;align-items:center;margin-bottom:8px;">
          <span style="font-size:11px;color:#8B9287;">欄數</span>
          <select data-block-field="cols" data-idx="${i}" style="max-width:120px;">
            <option value="2" ${cols === 2 ? 'selected' : ''}>2 欄</option>
            <option value="3" ${cols === 3 ? 'selected' : ''}>3 欄</option>
          </select>
        </div>
      ` + (b.items || []).map((it, s) => `
        <div class="hfw-subitem">
          <div class="hfw-subitem-head"><span>卡片 ${s + 1}</span>${subitemActions(i, s)}</div>
          <div class="hfw-row">
            <input type="text" data-block-field="icon" data-idx="${i}" data-sub="${s}" value="${escapeAttr(it.icon || '')}" placeholder="圖示 class（選填，例：fa-solid fa-leaf）">
            <input type="text" data-block-field="num" data-idx="${i}" data-sub="${s}" value="${escapeAttr(it.num || '')}" placeholder="編號（選填，例：01）">
          </div>
          <input type="text" data-block-field="title" data-idx="${i}" data-sub="${s}" value="${escapeAttr(it.title || '')}" placeholder="卡片標題…">
          <input type="text" data-block-field="href" data-idx="${i}" data-sub="${s}" value="${escapeAttr(it.href || '')}" placeholder="連結網址（選填，填了整張卡可點擊）">
          <textarea class="hfw-html" data-block-field="html" data-idx="${i}" data-sub="${s}" placeholder="卡片內容（HTML，例：<p>…</p>）">${escapeHtml(it.html || '')}</textarea>
        </div>
      `).join('') + `<button type="button" class="hfw-add-subitem" data-role="pitem-add" data-idx="${i}">＋ 新增卡片</button>`;
    } else if (b.type === 'actions') {
      body = (b.items || []).map((it, s) => `
        <div class="hfw-subitem">
          <div class="hfw-subitem-head"><span>列卡 ${s + 1}</span>${subitemActions(i, s)}</div>
          <input type="text" data-block-field="title" data-idx="${i}" data-sub="${s}" value="${escapeAttr(it.title || '')}" placeholder="標題…">
          <textarea class="hfw-html" data-block-field="html" data-idx="${i}" data-sub="${s}" placeholder="說明內容（HTML）">${escapeHtml(it.html || '')}</textarea>
          <div class="hfw-row">
            <input type="text" data-block-field="href" data-idx="${i}" data-sub="${s}" value="${escapeAttr(it.href || '')}" placeholder="按鈕連結網址">
            <input type="text" data-block-field="label" data-idx="${i}" data-sub="${s}" value="${escapeAttr(it.label || '')}" placeholder="按鈕文字（例：申請說明）">
          </div>
        </div>
      `).join('') + `<button type="button" class="hfw-add-subitem" data-role="pitem-add" data-idx="${i}">＋ 新增列卡</button>`;
    } else if (b.type === 'note') {
      body = `
        <div style="display:flex;gap:6px;align-items:center;margin-bottom:8px;">
          <span style="font-size:11px;color:#8B9287;">色調</span>
          <select data-block-field="tone" data-idx="${i}" style="max-width:160px;">
            <option value="gold" ${b.tone !== 'red' ? 'selected' : ''}>金色（資訊提示）</option>
            <option value="red" ${b.tone === 'red' ? 'selected' : ''}>紅色（重要申訴）</option>
          </select>
        </div>
        <textarea class="hfw-html" data-block-field="html" data-idx="${i}" placeholder="提示內容（HTML）">${escapeHtml(b.html || '')}</textarea>
      `;
    } else if (b.type === 'html') {
      body = `
        <textarea class="hfw-html" data-block-field="html" data-idx="${i}" placeholder="自由 HTML 內容…" style="min-height:120px;">${escapeHtml(b.html || '')}</textarea>
      `;
    }

    return `
      <div class="hfw-block" data-role="block" data-idx="${i}">
        <div class="hfw-block-head">
          <span class="hfw-block-type">${escapeHtml(label)}</span>
          <div class="hfw-block-actions">
            <button data-role="move-up" data-idx="${i}" title="上移">▲</button>
            <button data-role="move-down" data-idx="${i}" title="下移">▼</button>
            <button data-role="dup-block" data-idx="${i}" title="複製">⎘</button>
            <button data-role="remove-block" data-idx="${i}" title="刪除" class="danger">×</button>
          </div>
        </div>
        <div class="hfw-block-body">${body}</div>
        ${renderInserter(i + 1, isPinned)}
      </div>
    `;
  }

  function renderInserter(insertAt, isPinned) {
    const extra = isPinned ? `
        <button data-role="insert-block" data-type="accordion" data-at="${insertAt}">＋ 手風琴</button>
        <button data-role="insert-block" data-type="cards" data-at="${insertAt}">＋ 卡片格</button>
        <button data-role="insert-block" data-type="actions" data-at="${insertAt}">＋ 按鈕列卡</button>
        <button data-role="insert-block" data-type="note" data-at="${insertAt}">＋ 提示框</button>
        <button data-role="insert-block" data-type="html" data-at="${insertAt}">＋ HTML</button>
    ` : '';
    return `
      <div class="hfw-block-inserter">
        <button data-role="insert-block" data-type="paragraph" data-at="${insertAt}">＋ 文字</button>
        <button data-role="insert-block" data-type="image" data-at="${insertAt}">＋ 圖片</button>
        <button data-role="insert-block" data-type="divider" data-at="${insertAt}">＋ 分隔線</button>
        ${extra}
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
        if (!(await resolveUnsavedBeforeContinue('尚有未儲存的變更，切換文章前是否先儲存？'))) return;
        selectedId = el.getAttribute('data-id');
        render();
      });
    });

    rootEl.querySelector('[data-role="new"]')?.addEventListener('click', async () => {
      if (!(await resolveUnsavedBeforeContinue('尚有未儲存的變更，建立新文章前是否先儲存？'))) return;
      selectedId = null;
      dirtyDraft = {
        id: '', title: '', subtitle: '',
        publishedDate: new Date().toISOString().slice(0, 10),
        coverImage: '', icon: '', categories: [], tags: [], summary: '',
        featured: false, pinned: false, pinnedOrder: 0,
        blocks: [{ type: 'paragraph', text: '' }]
      };
      persistDraftState();
      render();
    });

    rootEl.querySelector('[data-role="new-pinned"]')?.addEventListener('click', async () => {
      if (!(await resolveUnsavedBeforeContinue('尚有未儲存的變更，建立新文章前是否先儲存？'))) return;
      selectedId = null;
      const maxOrder = WikiStore.getPinned().reduce((m, p) => Math.max(m, p.pinnedOrder || 0), 0);
      dirtyDraft = {
        id: '', title: '', subtitle: '',
        publishedDate: new Date().toISOString().slice(0, 10),
        coverImage: '', icon: 'fa-solid fa-bookmark', categories: [], tags: [], summary: '',
        featured: false, pinned: true, pinnedOrder: maxOrder + 1,
        blocks: [
          { type: 'paragraph', text: '' },
          { type: 'accordion', items: [{ title: '', html: '', open: true }] }
        ]
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
        WikiStore.reset();
        discardDirtyDraft();
        selectedId = WikiStore.getAll()[0]?.id || null;
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
        else if (f === 'pinnedOrder') dirtyDraft.pinnedOrder = Number(el.value) || 0;
        else dirtyDraft[f] = el.value;
        persistDraftState();
        if (f === 'coverImage') {
          const pv = rootEl.querySelector('.hfw-cover-preview');
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
      dirtyDraft.coverImage = wikiImagePathFromFile(file);
      persistDraftState();
      toast('已設定封面路徑為 ' + dirtyDraft.coverImage);
      render();
    });

    // Blocks 欄位輸入（含釘選子項 data-sub）
    rootEl.querySelectorAll('[data-block-field]').forEach(el => {
      const eventName = el.tagName === 'SELECT' || el.type === 'checkbox' ? 'change' : 'input';
      el.addEventListener(eventName, () => {
        ensureDraft();
        const idx = Number(el.getAttribute('data-idx'));
        const field = el.getAttribute('data-block-field');
        const subAttr = el.getAttribute('data-sub');
        const block = dirtyDraft.blocks[idx];
        if (!block) return;
        let value;
        if (el.type === 'checkbox') value = el.checked;
        else if (field === 'cols') value = Number(el.value) || 3;
        else value = el.value;
        if (subAttr != null) {
          const sub = Number(subAttr);
          if (!block.items || !block.items[sub]) return;
          block.items[sub][field] = value;
        } else {
          block[field] = value;
        }
        persistDraftState();
        if (field === 'tone' || field === 'cols') render();
      });
    });

    // 文字類型切換（段落 / 標題 / 引言）
    rootEl.querySelectorAll('[data-role="switch-text-type"]').forEach(el => {
      el.addEventListener('change', () => {
        ensureDraft();
        const idx = Number(el.getAttribute('data-idx'));
        const block = dirtyDraft.blocks[idx];
        if (!block) return;
        const ta = rootEl.querySelector('[data-block-field="text"][data-idx="' + idx + '"]:not([data-sub])');
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
        current.src = wikiImagePathFromFile(first);
        if (!current.caption) current.caption = '';

        const currentSize = current.size === 'small' ? 'small' : 'large';
        const extraBlocks = files.slice(1).map(file => ({
          type: 'image',
          src: wikiImagePathFromFile(file),
          caption: '', alt: '', size: currentSize
        }));
        if (extraBlocks.length) {
          dirtyDraft.blocks.splice(idx + 1, 0, ...extraBlocks);
        }

        try { e.target.value = ''; } catch (_) {}
        persistDraftState();
        toast(files.length > 1
          ? '已新增 ' + files.length + ' 張圖片，路徑預設為 /HuaFan/image/wiki/'
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

    // 釘選子項動作
    rootEl.querySelectorAll('[data-role="pitem-add"]').forEach(el => {
      el.addEventListener('click', () => {
        ensureDraft();
        const idx = Number(el.getAttribute('data-idx'));
        const block = dirtyDraft.blocks[idx];
        if (!block) return;
        block.items = block.items || [];
        block.items.push(newSubItem(block.type));
        persistDraftState();
        render();
      });
    });
    rootEl.querySelectorAll('[data-role="pitem-remove"]').forEach(el => {
      el.addEventListener('click', () => {
        ensureDraft();
        const idx = Number(el.getAttribute('data-idx'));
        const sub = Number(el.getAttribute('data-sub'));
        const block = dirtyDraft.blocks[idx];
        if (!block || !block.items) return;
        block.items.splice(sub, 1);
        persistDraftState();
        render();
      });
    });
    rootEl.querySelectorAll('[data-role="pitem-up"]').forEach(el => {
      el.addEventListener('click', () => {
        ensureDraft();
        const idx = Number(el.getAttribute('data-idx'));
        const sub = Number(el.getAttribute('data-sub'));
        const items = dirtyDraft.blocks[idx]?.items;
        if (!items || sub <= 0) return;
        [items[sub - 1], items[sub]] = [items[sub], items[sub - 1]];
        persistDraftState();
        render();
      });
    });
    rootEl.querySelectorAll('[data-role="pitem-down"]').forEach(el => {
      el.addEventListener('click', () => {
        ensureDraft();
        const idx = Number(el.getAttribute('data-idx'));
        const sub = Number(el.getAttribute('data-sub'));
        const items = dirtyDraft.blocks[idx]?.items;
        if (!items || sub >= items.length - 1) return;
        [items[sub], items[sub + 1]] = [items[sub + 1], items[sub]];
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
      const target = WikiStore.getById(selectedId);
      const warn = target && target.pinned
        ? '確定刪除這則「釘選文章」？刪除後目錄卡也會移除此條目。此動作無法復原（但仍保留於已匯出的 JSON 檔）。'
        : '確定刪除這篇文章？此動作無法復原（但仍保留於已匯出的 JSON 檔）。';
      if (!confirm(warn)) return;
      WikiStore.remove(selectedId);
      discardDirtyDraft();
      selectedId = WikiStore.getAll()[0]?.id || null;
      render();
      toast('已刪除');
    });
  }

  function ensureDraft() {
    if (dirtyDraft) return;
    const cur = WikiStore.getById(selectedId);
    dirtyDraft = cur ? JSON.parse(JSON.stringify(cur)) : null;
    persistDraftState();
  }

  function saveDraft() {
    if (!dirtyDraft) return true;
    if (!dirtyDraft.title || !dirtyDraft.title.trim()) { alert('請輸入文章標題'); return false; }
    const saved = WikiStore.save(dirtyDraft);
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
      case 'accordion': return { type: 'accordion', items: [{ title: '', html: '', open: false }] };
      case 'cards':     return { type: 'cards', cols: 3, items: [{ icon: '', num: '', title: '', href: '', html: '' }] };
      case 'actions':   return { type: 'actions', items: [{ title: '', html: '', href: '', label: '前往' }] };
      case 'note':      return { type: 'note', tone: 'gold', html: '' };
      case 'html':      return { type: 'html', html: '' };
      default:          return { type: 'paragraph', text: '' };
    }
  }

  function newSubItem(blockType) {
    if (blockType === 'accordion') return { title: '', html: '', open: false };
    if (blockType === 'cards')     return { icon: '', num: '', title: '', href: '', html: '' };
    if (blockType === 'actions')   return { title: '', html: '', href: '', label: '前往' };
    return {};
  }

  /* ---------- Import / Export ---------- */
  function exportJSON() {
    const blob = new Blob([WikiStore.exportJSON()], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'wiki-data.json';
    document.body.appendChild(a); a.click(); a.remove();
    URL.revokeObjectURL(url);
    toast('已下載 wiki-data.json');
    alert('請上傳此檔至網站根目錄（與 wiki.html 同層），取代舊檔後所有訪客即會看到最新內容。\n圖片檔請歸檔於 HuaFan/image/wiki，並維持欄位中的路徑一致。');
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
          WikiStore.importJSON(String(reader.result), mode);
          selectedId = WikiStore.getAll()[0]?.id || null;
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
  function wikiImagePathFromFile(file) {
    const name = String((file && file.name) || '').split(/[\\/]/).pop().trim();
    return name ? '/HuaFan/image/wiki/' + name : '';
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
  hint.id = 'hfw-admin-hint';
  hint.textContent = '⌘ + ⇧ + E · Wiki Admin';
  document.body.appendChild(hint);
  document.addEventListener('mousemove', e => {
    const near = e.clientX > window.innerWidth - 240 && e.clientY > window.innerHeight - 100;
    hint.classList.toggle('show', near);
  });

  window.HuaFanWikiAdmin = { open, close };
})();
