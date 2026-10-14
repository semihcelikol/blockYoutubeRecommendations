// background.js
const TITLE_APPLY = "Blocked Recommendations";
const TITLE_REMOVE = "UnBlocked Recommendations";

function isYouTube(url) {
  try {
    const activeUrl = new URL(url);
    return activeUrl.hostname.includes("youtube.com");
  } catch (e) {
    return false;
  }
}

// İkonu günceller
async function updateIcon(tabId, isActive) {
  if (isActive) {
    chrome.action.setIcon({tabId: tabId, path: "icons/onIcon.png"});
    chrome.action.setTitle({tabId: tabId, title: TITLE_REMOVE});
  } else {
    chrome.action.setIcon({tabId: tabId, path: "icons/offIcon.png"});
    chrome.action.setTitle({tabId: tabId, title: TITLE_APPLY});
  }
}

// Butona tıklandığında durumu Storage'a kaydet (content.js bunu otomatik algılayacak)
chrome.action.onClicked.addListener(async (tab) => {
  if (!isYouTube(tab.url)) return;

  let data = await chrome.storage.local.get(['isYTNoRecsActive']);
  let newState = !data.isYTNoRecsActive; // Durumu tersine çevir
  await chrome.storage.local.set({ isYTNoRecsActive: newState });

  // Tüm açık YouTube sekmelerinin ikonunu anında güncelle
  let allTabs = await chrome.tabs.query({});
  for (let t of allTabs) {
    if (t.url && isYouTube(t.url)) {
      updateIcon(t.id, newState);
    }
  }
});

// Yeni sekme açıldığında veya geçiş yapıldığında kontrol et
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (tab.url && isYouTube(tab.url)) {
    chrome.action.enable(tabId); // İkonu tıklanabilir yap
    let data = await chrome.storage.local.get(['isYTNoRecsActive']);
    let isActive = data.isYTNoRecsActive !== undefined ? data.isYTNoRecsActive : true;
    updateIcon(tabId, isActive);
  } else {
    chrome.action.disable(tabId); // YouTube değilse ikonu soluklaştır/pasifleştir
  }
});

// Service Worker (Arka plan) uyandığında mevcut sekmeleri kontrol et
chrome.tabs.query({}).then(async (tabs) => {
  let data = await chrome.storage.local.get(['isYTNoRecsActive']);
  let isActive = data.isYTNoRecsActive !== undefined ? data.isYTNoRecsActive : true;
  
  for (let tab of tabs) {
    if (tab.url && isYouTube(tab.url)) {
      chrome.action.enable(tab.id);
      updateIcon(tab.id, isActive);
    } else {
      chrome.action.disable(tab.id);
    }
  }
});