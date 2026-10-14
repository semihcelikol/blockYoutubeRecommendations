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
    browser.pageAction.setIcon({tabId: tabId, path: "icons/onIcon.png"});
    browser.pageAction.setTitle({tabId: tabId, title: TITLE_REMOVE});
  } else {
    browser.pageAction.setIcon({tabId: tabId, path: "icons/offIcon.png"});
    browser.pageAction.setTitle({tabId: tabId, title: TITLE_APPLY});
  }
}

// Butona tıklandığında durumu Storage'a kaydet (content.js bunu otomatik algılayacak)
browser.pageAction.onClicked.addListener(async (tab) => {
  if (!isYouTube(tab.url)) return;

  let data = await browser.storage.local.get(['isYTNoRecsActive']);
  let newState = !data.isYTNoRecsActive;
  await browser.storage.local.set({ isYTNoRecsActive: newState });

  // Tüm açık YouTube sekmelerinin ikonunu anında güncelle
  let allTabs = await browser.tabs.query({});
  for (let t of allTabs) {
    if (t.url && isYouTube(t.url)) {
      updateIcon(t.id, newState);
    }
  }
});

// Yeni sekme açıldığında veya geçiş yapıldığında URL çubuğu ikonunu göster/gizle
browser.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (tab.url && isYouTube(tab.url)) {
    browser.pageAction.show(tabId); // İkonu URL çubuğunun sağında göster
    let data = await browser.storage.local.get(['isYTNoRecsActive']);
    let isActive = data.isYTNoRecsActive !== undefined ? data.isYTNoRecsActive : true;
    updateIcon(tabId, isActive);
  } else {
    browser.pageAction.hide(tabId); // YouTube değilse URL çubuğundan gizle
  }
});

// Eklenti ilk yüklendiğinde mevcut sekmeleri kontrol et
browser.tabs.query({}).then(async (tabs) => {
  let data = await browser.storage.local.get(['isYTNoRecsActive']);
  let isActive = data.isYTNoRecsActive !== undefined ? data.isYTNoRecsActive : true;
  
  for (let tab of tabs) {
    if (tab.url && isYouTube(tab.url)) {
      browser.pageAction.show(tab.id);
      updateIcon(tab.id, isActive);
    }
  }
});