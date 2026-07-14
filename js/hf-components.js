/*
 * 共用版型元件 (Hua Fan Shared Layout Components)
 * ------------------------------------------------------------------
 * 將 5 個頁面共用的：Header（頁首）、漢堡全螢幕選單、右側懸浮按鈕組、
 * Footer（頁尾）集中於此檔，於載入時套用到各頁面對應位置。
 *
 * 頁面連結對應（依需求重新命名）：
 *   index.html   → 首頁
 *   guide.html   → 我剛失去親人
 *   about.html   → 關於華梵
 *   process.html → 流程拷貝9
 *   生前契約        → preneed.html（不變）
 *
 * 使用方式：於各頁 <head> 以相對路徑載入（需在 hf-image-path.js 之後）：
 *   <script src="hf-components.js"></script>
 * ------------------------------------------------------------------
 */
(function () {
  'use strict';

  // 目前頁面檔名（去除路徑、查詢字串與 hash）
  var page = (location.pathname.split('/').pop() || 'index.html').toLowerCase();
  if (!page) page = 'index.html';
  var isIndex = page === 'index.html';

  // 首頁區塊錨點前綴：在首頁用純錨點；其他頁面導回 index.html 再定位
  var HOME = isIndex ? '' : 'index.html';

  /* ---------------------------------------------------------------
   * 1) 右側懸浮按鈕組
   * ------------------------------------------------------------- */
  function floatingHTML() {
    return '' +
    '<div class="fixed right-4 bottom-8 z-40 flex flex-col gap-3">' +
      '<a href="https://line.me/ti/p/@your_line_id" target="_blank" class="w-10 h-10 md:w-12 md:h-12 bg-primary text-white rounded-full flex items-center justify-center shadow-lg hover:bg-accent hover:scale-110 transition duration-300 relative group cursor-pointer">' +
        '<i class="fa-brands fa-line text-lg md:text-2xl"></i>' +
        '<span class="absolute right-full mr-3 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition whitespace-nowrap pointer-events-none">加入 LINE</span>' +
      '</a>' +
      '<a href="#" target="_blank" class="w-10 h-10 md:w-12 md:h-12 bg-primary text-white rounded-full flex items-center justify-center shadow-lg hover:bg-accent hover:scale-110 transition duration-300 relative group cursor-pointer">' +
        '<i class="fa-brands fa-facebook-f text-lg md:text-xl"></i>' +
        '<span class="absolute right-full mr-3 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition whitespace-nowrap pointer-events-none">關注 Facebook</span>' +
      '</a>' +
      '<div class="font-pill-vertical group relative w-10 md:w-12 h-[110px] mx-auto flex flex-col items-center justify-center shadow-lg py-3 bg-primary rounded-full border border-white/10 text-[#C5A670]">' +
        '<button onclick="adjustFontSize(1)" class="font-pill-btn-vertical" aria-label="放大字體"><i class="fa-solid fa-plus text-lg"></i></button>' +
        '<span class="text-xs font-medium px-1 select-none text-white/80">字</span>' +
        '<span class="text-xs font-medium px-1 select-none text-white/80">體</span>' +
        '<button onclick="adjustFontSize(-1)" class="font-pill-btn-vertical" aria-label="縮小字體"><i class="fa-solid fa-minus text-sm"></i></button>' +
      '</div>' +
      '<a href="#" class="w-10 h-10 md:w-12 md:h-12 bg-primary text-white rounded-full flex items-center justify-center shadow-lg hover:bg-accent hover:scale-110 transition duration-300 relative group mt-1 cursor-pointer">' +
        '<i class="fa-solid fa-angle-up text-lg md:text-xl"></i>' +
        '<span class="absolute right-full mr-3 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition whitespace-nowrap pointer-events-none">回到頂部</span>' +
      '</a>' +
    '</div>';
  }

  /* ---------------------------------------------------------------
   * 2) 漢堡全螢幕選單 Overlay
   * ------------------------------------------------------------- */
  function menuHTML() {
    return '' +
    '<div id="full-screen-menu" class="fixed inset-0 bg-[#F7F5F0]/95 backdrop-blur-xl z-[100] hidden flex-col transition-opacity duration-300 opacity-0 bg-dots-pattern">' +
      '<div class="absolute top-1/4 left-[-10%] text-primary/5 pointer-events-none rotate-12 select-none"><i class="fa-solid fa-leaf text-[300px]"></i></div>' +
      '<div class="absolute bottom-0 right-0 w-96 h-96 bg-accent/10 rounded-full blur-[80px] pointer-events-none"></div>' +
      '<div class="relative z-10 w-full flex justify-between items-center p-6 md:p-8">' +
        '<div class="flex items-center gap-3 opacity-80">' +
          '<img src="/HuaFan/image/shared/image_8286fa.webp" alt="華梵LOGO" class="w-10 h-auto object-contain">' +
          '<span class="text-primary font-serif font-bold tracking-widest">華梵禮儀</span>' +
        '</div>' +
        '<button id="close-menu-btn" class="w-12 h-12 rounded-full bg-white border border-gray-200 text-primary shadow-sm hover:bg-primary hover:text-white hover:rotate-90 transition-all duration-300 flex items-center justify-center cursor-pointer group">' +
          '<i class="fa-solid fa-xmark text-xl group-hover:scale-110 transition-transform"></i>' +
        '</button>' +
      '</div>' +
      '<div class="relative z-10 flex-1 w-full flex flex-row overflow-hidden">' +
        '<div id="mobile-submenu-area" class="flex-1 flex flex-col justify-center items-start pl-8 md:pl-20 transition-all duration-500 opacity-0 -translate-x-4 pointer-events-none">' +
          '<div id="submenu-about-list" class="flex flex-col gap-5 hidden w-full pr-4">' +
            '<div class="text-[10px] tracking-[0.2em] text-[#C5A670] mb-2 uppercase font-sans opacity-70">About Us</div>' +
            '<a href="about.html#awards-timeline" onclick="toggleMenu()" class="text-xl font-serif font-medium text-primary hover:text-accent transition-colors block submenu-item-fade" style="animation-delay: 0.05s;">榮耀歷程</a>' +
            '<a href="about.html#official-recognition" onclick="toggleMenu()" class="text-xl font-serif font-medium text-primary hover:text-accent transition-colors block submenu-item-fade" style="animation-delay: 0.1s;">政府合作</a>' +
            '<a href="about.html#training" onclick="toggleMenu()" class="text-xl font-serif font-medium text-primary hover:text-accent transition-colors block submenu-item-fade" style="animation-delay: 0.15s;">教育訓練</a>' +
            '<a href="about.html#core-philosophy" onclick="toggleMenu()" class="text-xl font-serif font-medium text-primary hover:text-accent transition-colors block submenu-item-fade" style="animation-delay: 0.2s;">核心理念</a>' +
            '<a href="about.html#life-care" onclick="toggleMenu()" class="text-xl font-serif font-medium text-primary hover:text-accent transition-colors block submenu-item-fade" style="animation-delay: 0.25s;">公益關懷</a>' +
          '</div>' +
        '</div>' +
        '<div class="flex-none flex flex-col justify-center items-end space-y-7 md:space-y-9 pb-20 pr-10 md:pr-24 min-w-[200px] z-20">' +
          '<a href="index.html" class="menu-link group text-right cursor-pointer relative">' +
            '<span class="block text-3xl md:text-4xl font-serif font-bold text-primary group-hover:text-accent transition-colors duration-300">首頁</span>' +
            '<span class="block text-[10px] tracking-[0.3em] text-[#9CA3AF] mt-1.5 uppercase group-hover:text-accent/70 transition-colors font-sans">Home</span>' +
          '</a>' +
          '<button onclick="toggleMobileSubmenu()" class="menu-link group text-right cursor-pointer relative focus:outline-none w-full">' +
            '<span class="block text-3xl md:text-4xl font-serif font-bold text-primary group-hover:text-accent transition-colors duration-300 flex items-center justify-end gap-3">' +
              '<i id="mobile-submenu-icon" class="fa-solid fa-chevron-right text-sm text-[#C5A670] opacity-60 transition-transform duration-300 group-hover:opacity-100"></i>關於華梵' +
            '</span>' +
            '<span class="block text-[10px] tracking-[0.3em] text-[#9CA3AF] mt-1.5 uppercase group-hover:text-accent/70 transition-colors font-sans">About Us</span>' +
          '</button>' +
          '<a href="' + HOME + '#services" class="menu-link group text-right cursor-pointer relative">' +
            '<span class="block text-3xl md:text-4xl font-serif font-bold text-primary group-hover:text-accent transition-colors duration-300">服務方案</span>' +
            '<span class="block text-[10px] tracking-[0.3em] text-[#9CA3AF] mt-1.5 uppercase group-hover:text-accent/70 transition-colors font-sans">Services</span>' +
          '</a>' +
          '<a href="preneed.html" data-nav="preneed" class="menu-link group text-right cursor-pointer relative">' +
            '<span class="block text-3xl md:text-4xl font-serif font-bold text-primary group-hover:text-accent transition-colors duration-300">生前契約</span>' +
            '<span class="block text-[10px] tracking-[0.3em] text-[#9CA3AF] mt-1.5 uppercase group-hover:text-accent/70 transition-colors font-sans">Pre-need</span>' +
          '</a>' +
          '<a href="process.html" data-nav="process" class="menu-link group text-right cursor-pointer relative">' +
            '<span class="block text-3xl md:text-4xl font-serif font-bold text-primary group-hover:text-accent transition-colors duration-300">禮儀百科</span>' +
            '<span class="block text-[10px] tracking-[0.3em] text-[#9CA3AF] mt-1.5 uppercase group-hover:text-accent/70 transition-colors font-sans">Etiquette Guide</span>' +
          '</a>' +
          '<a href="' + HOME + '#locations" class="menu-link group text-right cursor-pointer relative">' +
            '<span class="block text-3xl md:text-4xl font-serif font-bold text-primary group-hover:text-accent transition-colors duration-300">聯絡我們</span>' +
            '<span class="block text-[10px] tracking-[0.3em] text-[#9CA3AF] mt-1.5 uppercase group-hover:text-accent/70 transition-colors font-sans">Contact</span>' +
          '</a>' +
        '</div>' +
      '</div>' +
    '</div>';
  }

  /* ---------------------------------------------------------------
   * 3) Header 頁首
   * ------------------------------------------------------------- */
  function dropdownItem(hash, text) {
    return '' +
      '<a href="about.html' + hash + '" class="nav-dropdown-item block px-4 py-2.5 text-center transition-all group/item hover:bg-[#E8DCC0]/20">' +
        '<span class="nav-item-icon"><i class="fa-solid fa-leaf"></i></span>' +
        '<span class="nav-dropdown-text text-[#5C5C5C] font-serif text-[13px] tracking-[0.15em] group-hover/item:text-primaryDark transition-colors">' + text + '</span>' +
      '</a>';
  }

  function headerHTML() {
    return '' +
    '<header class="fixed w-full top-0 z-50 bg-dots-pattern shadow-md transition-all duration-300" id="navbar">' +
      '<div class="container mx-auto px-4 py-3 flex justify-between items-center relative z-10">' +
        '<a href="index.html" class="flex items-center gap-3 group">' +
          '<picture>' +
            '<source srcset="/HuaFan/image/shared/image_8286fa.webp" type="image/webp">' +
            '<img src="/HuaFan/image/shared/image_8286fa.webp" alt="華梵禮儀" class="h-10 w-auto object-contain" loading="eager" decoding="async">' +
          '</picture>' +
          '<div class="flex flex-col">' +
            '<span class="text-xl font-serif font-bold tracking-widest text-primary group-hover:text-accent transition">華梵禮儀</span>' +
            '<span class="text-[10px] text-accent tracking-[0.2em] uppercase">Hua Fan Etiquette</span>' +
          '</div>' +
        '</a>' +
        '<nav class="hidden lg:flex items-center gap-8 text-sm font-medium text-gray-600">' +
          '<div class="relative group h-full flex items-center">' +
            '<a href="about.html" data-nav="about" class="hover:text-primary relative py-4 flex items-center gap-1 group-hover:text-primary transition-colors font-medium">關於華梵 <span class="absolute bottom-2 left-0 w-0 h-0.5 bg-accent transition-all group-hover:w-full"></span></a>' +
            '<div class="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-32 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-500 transform origin-top -translate-y-1 group-hover:translate-y-0 pt-2">' +
              '<div class="bg-[#FFFEFA] rounded-sm shadow-xl border border-[#E3EBE5] py-2 overflow-hidden">' +
                '<div class="flex flex-col">' +
                  dropdownItem('#awards-timeline', '榮耀歷程') +
                  dropdownItem('#official-recognition', '政府合作') +
                  dropdownItem('#training', '教育訓練') +
                  dropdownItem('#core-philosophy', '核心理念') +
                  dropdownItem('#life-care', '公益關懷') +
                '</div>' +
              '</div>' +
            '</div>' +
          '</div>' +
          '<a href="' + HOME + '#services" class="hover:text-primary relative group transition">服務方案<span class="absolute -bottom-1 left-0 w-0 h-0.5 bg-accent transition-all group-hover:w-full"></span></a>' +
          '<a href="preneed.html" data-nav="preneed" class="hover:text-primary relative group transition">生前契約<span class="absolute -bottom-1 left-0 w-0 h-0.5 bg-accent transition-all group-hover:w-full"></span></a>' +
          '<a href="process.html" data-nav="process" class="hover:text-primary relative group transition">禮儀百科<span class="absolute -bottom-1 left-0 w-0 h-0.5 bg-accent transition-all group-hover:w-full"></span></a>' +
          '<a href="' + HOME + '#locations" class="hover:text-primary relative group transition">聯絡我們<span class="absolute -bottom-1 left-0 w-0 h-0.5 bg-accent transition-all group-hover:w-full"></span></a>' +
        '</nav>' +
        '<div class="flex items-center gap-3 md:gap-4 relative z-50">' +
          '<a href="' + HOME + '#calculator" class="hidden md:flex items-center gap-2 px-5 py-3 border border-gray-300 rounded-full text-base text-gray-600 hover:border-primary hover:text-primary transition duration-300 bg-white shadow-sm"><i class="fa-solid fa-calculator"></i> 預估費用</a>' +
          '<a href="tel:0800-800818" class="flex items-center gap-2 md:gap-3 px-3 md:px-6 py-2 bg-emergency text-white rounded-full shadow-red-glow hover:bg-[#8a3e3b] transition animate-attention">' +
            '<i class="fa-solid fa-phone-volume text-xl md:text-2xl"></i>' +
            '<div class="flex flex-col items-start leading-none">' +
              '<span class="text-[9px] md:text-[10px] opacity-90 tracking-widest mb-0.5"><span class="md:hidden">24H 服務</span><span class="hidden md:inline">24H 專人服務</span></span>' +
              '<span class="font-bold tracking-wide text-base md:text-lg font-sans"><span class="md:hidden">專線</span><span class="hidden md:inline">緊急協助專線</span></span>' +
            '</div>' +
          '</a>' +
          '<button id="menu-btn" class="lg:hidden text-primary p-2 focus:outline-none ml-1 relative z-[60] cursor-pointer"><i class="fa-solid fa-bars text-3xl"></i></button>' +
        '</div>' +
      '</div>' +
    '</header>';
  }

  /* ---------------------------------------------------------------
   * 4) Footer 頁尾（取自 process.html）
   * ------------------------------------------------------------- */
  function footerHTML() {
    return '' +
    '<footer class="bg-secondary text-gray-400 py-8 text-sm font-light relative z-30">' +
      '<div class="absolute top-0 left-0 w-full overflow-hidden leading-[0] -translate-y-[99%] z-0 pointer-events-none">' +
        '<svg class="relative block w-[calc(100%+1.3px)] h-[50px] md:h-[100px]" data-name="Layer 1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 120" preserveAspectRatio="none">' +
          '<path d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V120H0V27.35A600.21,600.21,0,0,0,321.39,56.44Z" fill="#2F3E2B"></path>' +
        '</svg>' +
      '</div>' +
      '<div class="absolute -top-[50px] md:-top-[100px] left-0 w-full h-[calc(100%+50px)] md:h-[calc(100%+100px)] overflow-hidden pointer-events-none z-10 mix-blend-screen" style="mask-image: linear-gradient(to top, black 80%, transparent 100%); -webkit-mask-image: linear-gradient(to top, black 80%, transparent 100%);">' +
        '<div class="absolute bottom-0 -right-[120px] md:-right-[150px] w-[500px] h-[500px] md:w-[850px] md:h-[850px] opacity-30">' +
          '<style>@keyframes hf-spin-slow{from{transform:rotate(0deg);}to{transform:rotate(360deg);}}.animate-spin-slower{animation:hf-spin-slow 120s linear infinite;}</style>' +
          '<svg viewBox="0 0 500 500" xmlns="http://www.w3.org/2000/svg" class="w-full h-full">' +
            '<defs>' +
              '<radialGradient id="orangeGlow" cx="50%" cy="50%" r="50%" fx="50%" fy="50%"><stop offset="0%" style="stop-color:#FFB347; stop-opacity:0.9" /><stop offset="70%" style="stop-color:#FF8C00; stop-opacity:0.6" /><stop offset="100%" style="stop-color:#FF8C00; stop-opacity:0" /></radialGradient>' +
              '<radialGradient id="greenGlow" cx="50%" cy="50%" r="50%" fx="50%" fy="50%"><stop offset="40%" style="stop-color:#A3D9A5; stop-opacity:0.6" /><stop offset="80%" style="stop-color:#465B40; stop-opacity:0.4" /><stop offset="100%" style="stop-color:#2F3E2B; stop-opacity:0" /></radialGradient>' +
              '<mask id="fadeMask"><radialGradient id="maskGrad"><stop offset="0%" stop-color="white" /><stop offset="70%" stop-color="white" /><stop offset="100%" stop-color="black" /></radialGradient><circle cx="250" cy="250" r="250" fill="url(#maskGrad)" /></mask>' +
            '</defs>' +
            '<g class="animate-spin-slower" style="transform-origin: center;">' +
              '<circle cx="250" cy="250" r="180" fill="none" stroke="#FFD700" stroke-width="200" stroke-dasharray="4 40" opacity="0.08" mask="url(#fadeMask)" />' +
              '<circle cx="250" cy="250" r="120" fill="none" stroke="#FFE4B5" stroke-width="100" stroke-dasharray="2 30" opacity="0.12" mask="url(#fadeMask)" transform="rotate(15 250 250)" />' +
            '</g>' +
            '<circle cx="250" cy="250" r="150" fill="url(#greenGlow)" stroke="none" opacity="0.5" />' +
            '<circle cx="250" cy="250" r="90" fill="url(#orangeGlow)" stroke="none" opacity="0.8" />' +
            '<path transform="translate(30, 20)" d="M180 130 Q190 180 230 180 Q190 180 180 230 Q170 180 130 180 Q170 180 180 130 Z" fill="#FFFACD" opacity="0.8" filter="blur(0.5px)"><animate attributeName="opacity" values="0.6;0.9;0.6" dur="4s" repeatCount="indefinite" /></path>' +
            '<circle cx="300" cy="300" r="25" fill="#FF8C00" opacity="0.7"><animate attributeName="opacity" values="0.5;0.8;0.5" dur="3s" repeatCount="indefinite" /></circle>' +
          '</svg>' +
        '</div>' +
      '</div>' +
      '<div class="absolute top-0 left-0 w-full overflow-hidden leading-[0] -translate-y-[99%] z-20 pointer-events-none">' +
        '<svg class="relative block w-[calc(100%+1.3px)] h-[50px] md:h-[100px]" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 120" preserveAspectRatio="none">' +
          '<path fill-rule="evenodd" clip-rule="evenodd" d="M0,0 H1200 V120 H0 Z M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V120H0V27.35A600.21,600.21,0,0,0,321.39,56.44Z" fill="transparent"></path>' +
        '</svg>' +
      '</div>' +
      '<div class="container mx-auto px-4 relative z-20">' +
        '<div class="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">' +
          '<div class="col-span-1 md:col-span-2">' +
            '<div class="flex items-center gap-3 mb-6">' +
              '<div class="w-8 h-8 bg-accent text-secondary flex items-center justify-center rounded-full font-serif font-bold">華</div>' +
              '<h4 class="text-white text-2xl font-serif font-bold tracking-widest">華梵禮儀</h4>' +
            '</div>' +
            '<p class="mb-6 max-w-sm leading-loose text-gray-300">我們相信，好的道別能撫平生者的傷痛。<br>華梵致力於提供透明、專業且充滿溫度的生命禮儀服務，讓愛延續。</p>' +
            '<div class="space-y-2">' +
              '<p class="flex items-center gap-3"><i class="fa-solid fa-phone text-accent"></i> <span class="text-white tracking-wider">0800-800-818</span> <span class="text-xs bg-white/10 px-2 py-0.5 rounded">24H</span></p>' +
              '<p class="flex items-center gap-3"><i class="fa-solid fa-location-dot text-accent"></i> 台中市北區學士路 257 號 9 樓</p>' +
            '</div>' +
          '</div>' +
          '<div>' +
            '<h4 class="text-white font-bold mb-6 text-lg">快速連結</h4>' +
            '<ul class="space-y-3">' +
              '<li><a href="guide.html" class="hover:text-accent transition flex items-center gap-2"><i class="fa-solid fa-angle-right text-xs"></i> 臨終關懷 SOP</a></li>' +
              '<li><a href="' + HOME + '#calculator" class="hover:text-accent transition flex items-center gap-2"><i class="fa-solid fa-angle-right text-xs"></i> 服務費用試算</a></li>' +
              '<li><a href="#" class="hover:text-accent transition flex items-center gap-2"><i class="fa-solid fa-angle-right text-xs"></i> 合法塔位查詢</a></li>' +
              '<li><a href="process.html" class="hover:text-accent transition flex items-center gap-2"><i class="fa-solid fa-angle-right text-xs"></i> 生命禮儀百科</a></li>' +
            '</ul>' +
          '</div>' +
          '<div>' +
            '<h4 class="text-white font-bold mb-6 text-lg">關注我們</h4>' +
            '<div class="flex gap-4">' +
              '<a href="#" class="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-[#06C755] hover:text-white transition duration-300"><i class="fa-brands fa-line text-lg"></i></a>' +
              '<a href="#" class="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-[#1877F2] hover:text-white transition duration-300"><i class="fa-brands fa-facebook-f text-lg"></i></a>' +
              '<a href="#" class="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-[#E4405F] hover:text-white transition duration-300"><i class="fa-brands fa-instagram text-lg"></i></a>' +
            '</div>' +
            '<div class="mt-8 p-4 bg-white/5 rounded border border-white/10 relative overflow-hidden group">' +
              '<div class="absolute inset-0 bg-accent/10 translate-y-full group-hover:translate-y-0 transition duration-500"></div>' +
              '<p class="text-xs text-gray-300 mb-1 relative z-10">需要立即協助？</p>' +
              '<a href="tel:0800800818" class="text-accent font-bold text-lg hover:underline relative z-10">撥打 0800-800-818</a>' +
            '</div>' +
          '</div>' +
        '</div>' +
        '<div class="border-t border-white/10 pt-8 flex flex-col md:flex-row justify-between items-center text-xs text-gray-500 relative z-10">' +
          '<p>&copy; 2025 華梵禮儀有限公司 All Rights Reserved. 許可證號：府授經商字第10907655990號</p>' +
        '</div>' +
      '</div>' +
    '</footer>';
  }

  function stickyFooterHTML() {
    return '' +
    '<div class="fixed bottom-0 left-0 w-full z-50 pointer-events-none overflow-hidden h-36 flex items-end md:hidden">' +
      '<div class="absolute inset-0 bg-gradient-to-t from-[#F7F5F0]/95 via-[#F7F5F0]/70 to-transparent backdrop-blur-[10px]" style="mask-image: linear-gradient(to top, black 0%, black 40%, transparent 90%); -webkit-mask-image: linear-gradient(to top, black 0%, black 40%, transparent 90%); border: none;"></div>' +
      '<div class="absolute inset-0 z-0 opacity-40 pointer-events-none" style="mask-image: linear-gradient(to top, black 0%, black 40%, transparent 90%); -webkit-mask-image: linear-gradient(to top, black 0%, black 40%, transparent 90%);">' +
        '<div class="absolute bottom-0 left-1/2 -translate-x-1/2 w-64 h-32 bg-accent/20 rounded-full blur-[50px]"></div>' +
        '<svg class="absolute bottom-0 left-0 w-full h-12 text-primary/5 fill-current" viewBox="0 0 1200 120" preserveAspectRatio="none">' +
          '<path d="M0,0V46.29c47.79,22.2,103.59,32.17,158,28,70.36-5.37,136.33-33.31,206.8-37.5C438.64,32.43,512.34,53.67,583,72.05c69.27,18,138.3,24.88,209.4,13.08,36.15-6,69.85-17.84,104.45-29.34C989.49,25,1113-14.29,1200,52.47V0Z" opacity=".25"></path>' +
          '<path d="M0,0V15.81C13,36.92,27.64,56.86,47.69,72.05,99.41,111.27,165,111,224.58,91.58c31.15-10.15,60.09-26.07,89.67-39.8,40.92-19,84.73-46,130.83-49.67,36.26-2.85,70.9,9.42,98.6,31.56,31.77,25.39,62.32,62,103.63,73,40.44,10.79,81.35-6.69,119.13-24.28s75.16-39,116.92-43.05c59.73-5.85,113.28,22.88,168.9,38.84,30.2,8.66,59,6.17,87.09-7.5,22.43-10.89,48-26.93,60.65-49.24V0Z" opacity=".5" class="text-accent/10"></path>' +
        '</svg>' +
      '</div>' +
      '<div class="relative w-full px-5 pb-6 pt-2 flex gap-4 items-center justify-between pointer-events-auto z-10">' +
        '<a href="tel:0800800818" class="flex-1 bg-emergency text-white rounded-full flex items-center justify-center gap-3 py-4 shadow-[0_8px_20px_-5px_rgba(199,127,123,0.4)] hover:bg-[#BF8683] active:scale-95 transition-all duration-300 group relative overflow-hidden">' +
          '<div class="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:animate-[shine_1.5s_infinite]"></div>' +
          '<i class="fa-solid fa-phone-volume text-lg group-hover:rotate-12 transition-transform"></i>' +
          '<span class="font-serif font-bold tracking-widest text-base">呼叫禮儀師</span>' +
        '</a>' +
        '<a href="https://line.me/ti/p/@your_line_id" target="_blank" class="flex-1 bg-[#6B8C70] text-white rounded-full flex items-center justify-center gap-3 py-4 shadow-[0_8px_20px_-5px_rgba(127,169,136,0.4)] hover:bg-[#7FA988] active:scale-95 transition-all duration-300 group">' +
          '<i class="fa-brands fa-line text-2xl"></i>' +
          '<span class="font-serif font-bold tracking-widest text-base">諮詢 LINE</span>' +
        '</a>' +
      '</div>' +
    '</div>';
  }

  /* ---------------------------------------------------------------
   * 共用行為：全域函式（供注入後的 onclick 使用）
   * ------------------------------------------------------------- */
  function defineGlobals() {
    // 開關全螢幕選單
    window.toggleMenu = function () {
      var menu = document.getElementById('full-screen-menu');
      if (!menu) return;
      var hidden = menu.classList.contains('hidden');
      if (hidden) {
        menu.classList.remove('hidden');
        menu.classList.add('flex');
        document.body.style.overflow = 'hidden';
        requestAnimationFrame(function () { menu.style.opacity = '1'; });
      } else {
        menu.style.opacity = '0';
        document.body.style.overflow = '';
        setTimeout(function () {
          menu.classList.add('hidden');
          menu.classList.remove('flex');
        }, 300);
      }
    };

    // 手機版「關於華梵」子選單：第一次展開，再次點擊前往 about.html
    window.toggleMobileSubmenu = function () {
      var area = document.getElementById('mobile-submenu-area');
      var list = document.getElementById('submenu-about-list');
      var icon = document.getElementById('mobile-submenu-icon');
      if (!area || !list) { window.location.href = 'about.html'; return; }
      if (area.classList.contains('opacity-0')) {
        area.classList.remove('opacity-0', '-translate-x-4', 'pointer-events-none');
        area.classList.add('opacity-100', 'translate-x-0', 'pointer-events-auto');
        list.classList.remove('hidden');
        if (icon) icon.classList.add('rotate-90');
      } else {
        window.location.href = 'about.html';
      }
    };

    // 字體大小調整
    window.adjustFontSize = function (change) {
      var html = document.documentElement;
      var current = parseFloat(window.getComputedStyle(html).fontSize);
      var next = current + change;
      if (next >= 12 && next <= 24) html.style.fontSize = next + 'px';
    };
  }

  /* ---------------------------------------------------------------
   * 掛載：將共用元件注入到各頁佔位置
   * ------------------------------------------------------------- */
  // 優先使用佔位元素（id=hf-*）；若頁面尚未改為佔位（相容舊版）則退回既有元件。
  function inject(placeholderId, legacyEl, html) {
    var target = document.getElementById(placeholderId) || legacyEl;
    if (target) target.outerHTML = html;
  }

  function markActive() {
    var key = null;
    if (page === 'about.html') key = 'about';
    else if (page === 'preneed.html') key = 'preneed';
    else if (page === 'process.html') key = 'process';
    if (!key) return;
    var items = document.querySelectorAll('[data-nav="' + key + '"]');
    for (var i = 0; i < items.length; i++) {
      items[i].classList.add('text-primary', 'font-bold');
    }
  }

  // 注入完成後，直接綁定漢堡選單互動，避免各頁腳本因執行時機不同而失效。
  function bindMenuActions() {
    var menuBtn = document.getElementById('menu-btn');
    var closeBtn = document.getElementById('close-menu-btn');
    var menu = document.getElementById('full-screen-menu');
    if (!menu) return;

    if (menuBtn && !menuBtn.dataset.hfMenuBound) {
      menuBtn.addEventListener('click', function (e) {
        e.preventDefault();
        e.stopImmediatePropagation();
        window.toggleMenu();
      }, true);
      menuBtn.dataset.hfMenuBound = '1';
    }

    if (closeBtn && !closeBtn.dataset.hfMenuBound) {
      closeBtn.addEventListener('click', function (e) {
        e.preventDefault();
        e.stopImmediatePropagation();
        window.toggleMenu();
      }, true);
      closeBtn.dataset.hfMenuBound = '1';
    }

    var links = menu.querySelectorAll('.menu-link');
    for (var i = 0; i < links.length; i++) {
      var link = links[i];
      if (link.tagName !== 'A' || link.dataset.hfMenuBound) continue;
      link.addEventListener('click', function () {
        window.toggleMenu();
      }, true);
      link.dataset.hfMenuBound = '1';
    }
  }

  function mount() {
    defineGlobals();

    var pill = document.querySelector('.font-pill-vertical');
    inject('hf-floating', pill ? pill.closest('div.fixed') : null, floatingHTML());
    inject('hf-menu', document.getElementById('full-screen-menu'), menuHTML());
    inject('hf-header', document.getElementById('navbar'), headerHTML());
    inject('hf-footer', document.querySelector('footer'), footerHTML());
    inject('hf-sticky-footer', document.querySelector('.fixed.bottom-0.left-0.w-full.z-50.pointer-events-none.overflow-hidden.h-36.flex.items-end.md\\:hidden'), stickyFooterHTML());

    bindMenuActions();
    markActive();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', mount);
  } else {
    mount();
  }
})();
