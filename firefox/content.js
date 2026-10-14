// content.js
const styleId = 'yt-norecs-style';
const CSS = '.ytp-ce-element.ytp-ce-element-show { opacity: 0 !important; display: none !important; pointer-events: none !important; }';

// CSS'i sayfaya ekler veya sayfadan kaldırır
function applyState(isActive) {
  let existingStyle = document.getElementById(styleId);
  
  if (isActive) {
    if (!existingStyle) {
      let styleEl = document.createElement('style');
      styleEl.id = styleId;
      styleEl.textContent = CSS;
      // Sayfa yüklenirken <head> yoksa <html> içine atar, her türlü çalışır
      (document.head || document.documentElement).appendChild(styleEl);
    }
  } else {
    if (existingStyle) existingStyle.remove();
  }
}

// Sekme ilk açıldığında hafızadaki durumu (Aktif/Pasif) alıp uygula
browser.storage.local.get(['isYTNoRecsActive']).then((data) => {
  let isActive = data.isYTNoRecsActive !== undefined ? data.isYTNoRecsActive : true;
  if (data.isYTNoRecsActive === undefined) {
    browser.storage.local.set({ isYTNoRecsActive: true });
  }
  applyState(isActive);
});

// Kullanıcı butona bastığında anında tetiklenir
browser.storage.onChanged.addListener((changes) => {
  if (changes.isYTNoRecsActive) {
    applyState(changes.isYTNoRecsActive.newValue);
  }
});