/*
 * 共用圖片路徑切換器 (Hua Fan Image Path Resolver)
 * ------------------------------------------------------------------
 * 專案中所有本機圖片皆使用「絕對路徑」前綴： /HuaFan/image/...
 *
 * 問題：以 file:// 直接開啟 HTML（本機預覽）或用 Live Server 時，
 *       開頭的斜線 "/" 會指向「磁碟根目錄 / 網站根目錄」，
 *       因此 /HuaFan/image/... 會找不到檔案（404），圖片無法顯示。
 *
 * 解法：本機環境時，將前綴 "/HuaFan/image/" 自動改為相對路徑
 *       "HuaFan/image/"（相對於 HTML 檔所在的專案根目錄）。
 *       部署在 GitHub（正式站）時則保持原本的 "/HuaFan/image/" 不變。
 *
 * 使用方式：在每個頁面的 <head> 早期加入：
 *   <script src="hf-image-path.js"></script>
 *   （以相對路徑載入，本機與 GitHub 皆可正常運作）
 * ------------------------------------------------------------------
 */
(function () {
  'use strict';

  var ABS_PREFIX = '/HuaFan/image/'; // 部署（GitHub）用的絕對前綴
  var REL_PREFIX = 'HuaFan/image/';  // 本機用的相對前綴

  // 判斷是否為「本機／開發」環境
  var host = location.hostname;
  var isLocal =
    location.protocol === 'file:' ||
    host === 'localhost' ||
    host === '127.0.0.1' ||
    host === '0.0.0.0' ||
    host === '' ||
    /\.local$/.test(host);

  // 正式環境（GitHub 等）：維持絕對路徑，不做任何改寫。
  if (!isLocal) return;

  // 將字串中的絕對前綴換成相對前綴（可重複呼叫，具冪等性）。
  function toRel(value) {
    if (!value || value.indexOf(ABS_PREFIX) === -1) return value;
    return value.split(ABS_PREFIX).join(REL_PREFIX);
  }

  // 改寫單一元素的 src / srcset / 內聯 style
  function fixEl(el) {
    if (!el || el.nodeType !== 1) return;

    if (el.tagName === 'IMG') {
      var src = el.getAttribute('src');
      if (src && src.indexOf(ABS_PREFIX) !== -1) el.setAttribute('src', toRel(src));
    }

    if (el.hasAttribute && el.hasAttribute('srcset')) {
      var srcset = el.getAttribute('srcset');
      if (srcset && srcset.indexOf(ABS_PREFIX) !== -1) el.setAttribute('srcset', toRel(srcset));
    }

    if (el.hasAttribute && el.hasAttribute('style')) {
      var style = el.getAttribute('style');
      if (style && style.indexOf(ABS_PREFIX) !== -1) el.setAttribute('style', toRel(style));
    }
  }

  // 遞迴改寫某個節點與其子孫
  function fixTree(root) {
    if (!root) return;
    if (root.nodeType === 1) fixEl(root);
    if (root.querySelectorAll) {
      var nodes = root.querySelectorAll('img, source, [style]');
      for (var i = 0; i < nodes.length; i++) fixEl(nodes[i]);
    }
  }

  // 改寫 <style> 標籤內的 CSS（例如 .hero-bg { background-image: url('/HuaFan/image/...') }）
  function fixStyleTags() {
    var styles = document.getElementsByTagName('style');
    for (var i = 0; i < styles.length; i++) {
      var text = styles[i].textContent;
      if (text && text.indexOf(ABS_PREFIX) !== -1) {
        styles[i].textContent = toRel(text);
      }
    }
  }

  // 監看動態新增的節點與屬性變動（JS 產生的 <img>、背景輪播切換等）
  var observer = new MutationObserver(function (mutations) {
    for (var i = 0; i < mutations.length; i++) {
      var m = mutations[i];
      if (m.type === 'childList') {
        for (var j = 0; j < m.addedNodes.length; j++) fixTree(m.addedNodes[j]);
      } else if (m.type === 'attributes') {
        fixEl(m.target);
      }
    }
  });

  function startObserver() {
    if (!document.documentElement) return;
    observer.observe(document.documentElement, {
      subtree: true,
      childList: true,
      attributes: true,
      attributeFilter: ['src', 'srcset', 'style']
    });
  }

  // 立即處理目前已存在的節點，並開始監看後續變動。
  fixTree(document);
  startObserver();

  // DOM 解析完成後，再完整掃描一次（含 <style> 內的 CSS 與內聯背景）。
  document.addEventListener('DOMContentLoaded', function () {
    fixTree(document);
    fixStyleTags();
  });

  // 全部資源載入後，最後補掃一次，確保萬無一失。
  window.addEventListener('load', function () {
    fixTree(document);
    fixStyleTags();
  });
})();
