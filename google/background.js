const CSS = ".ytp-ce-element.ytp-ce-element-show { opacity: 0 !important; display: none !important; }";
const TITLE_APPLY = "Blocked Recommendations";
const TITLE_REMOVE = "UnBlocked Recommendations";

// URL'in YouTube olup olmadığını güvenli şekilde kontrol eder
function isYouTube(url) {
  try {
    const activeUrl = new URL(url);
    return activeUrl.hostname.includes("youtube.com");
  } catch (e) {
    return false;
  }
}

// Belirli bir sekmeye güncel durumu (Aktif/Pasif) uygular
async function applyStateToTab(tabId, isActive) {
  if (isActive) {
    chrome.action.setIcon({tabId: tabId, path: "icons/onIcon.png"});
    chrome.action.setTitle({tabId: tabId, title: TITLE_REMOVE});
    chrome.scripting.insertCSS({
      target: {tabId: tabId},
      css: CSS
    }).catch(() => {}); // Hataları yut (Örn: sayfa tam yüklenmemişse)
  } else {
    chrome.action.setIcon({tabId: tabId, path: "icons/offIcon.png"});
    chrome.action.setTitle({tabId: tabId, title: TITLE_APPLY});
    chrome.scripting.removeCSS({
      target: {tabId: tabId},
      css: CSS
    }).catch(() => {});
  }
}

// Butona tıklandığında global durumu değiştir ve tüm YouTube sekmelerine uygula
chrome.action.onClicked.addListener(async (tab) => {
  if (!isYouTube(tab.url)) return;

  // Mevcut durumu storage'dan al
  let data = await chrome.storage.local.get(['isYTNoRecsActive']);
  let newState = !data.isYTNoRecsActive; // Durumu tersine çevir (Toggle)

  // Yeni durumu storage'a kaydet
  await chrome.storage.local.set({ isYTNoRecsActive: newState });

  // Açık olan TÜM sekmeleri bul ve sadece YouTube olanlara yeni durumu anında uygula
  let allTabs = await chrome.tabs.query({});
  for (let t of allTabs) {
    if (t.url && isYouTube(t.url)) {
      applyStateToTab(t.id, newState);
    }
  }
});

// Yeni sekme açıldığında veya sayfa güncellendiğinde çalışır
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  // Sayfa yüklenmesi tamamlandığında veya URL değiştiğinde
  if (changeInfo.status === 'complete' || changeInfo.url) {
    if (tab.url && isYouTube(tab.url)) {
      chrome.action.enable(tabId); // YouTube ise butonu tıklanabilir yap
      
      // Kayıtlı global durumu al ve sekmeye uygula
      let data = await chrome.storage.local.get(['isYTNoRecsActive']);
      
      // Eğer kullanıcı eklentiyi yeni kurduysa (undefined ise), varsayılan olarak Aktif (true) başlat
      let isActive = data.isYTNoRecsActive !== undefined ? data.isYTNoRecsActive : true;
      if (data.isYTNoRecsActive === undefined) {
         chrome.storage.local.set({ isYTNoRecsActive: true });
      }
      
      applyStateToTab(tabId, isActive);
    } else {
      chrome.action.disable(tabId); // YouTube değilse butonu soluklaştır
    }
  }
});