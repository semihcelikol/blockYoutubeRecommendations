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
    browser.pageAction.setIcon({tabId: tabId, path: "icons/onIcon.png"});
    browser.pageAction.setTitle({tabId: tabId, title: TITLE_REMOVE});
    browser.scripting.insertCSS({
      target: {tabId: tabId},
      css: CSS
    }).catch(() => {}); // Sayfa yüklenmeden CSS eklenmeye çalışılırsa hatayı yut
  } else {
    browser.pageAction.setIcon({tabId: tabId, path: "icons/offIcon.png"});
    browser.pageAction.setTitle({tabId: tabId, title: TITLE_APPLY});
    browser.scripting.removeCSS({
      target: {tabId: tabId},
      css: CSS
    }).catch(() => {});
  }
}

// Butona tıklandığında global durumu değiştir ve tüm YouTube sekmelerine uygula
browser.pageAction.onClicked.addListener(async (tab) => {
  if (!isYouTube(tab.url)) return;

  // Mevcut durumu storage'dan al
  let data = await browser.storage.local.get(['isYTNoRecsActive']);
  let newState = !data.isYTNoRecsActive; // Durumu tersine çevir (Toggle)

  // Yeni durumu storage'a kaydet
  await browser.storage.local.set({ isYTNoRecsActive: newState });

  // Açık olan TÜM sekmeleri bul ve sadece YouTube olanlara yeni durumu anında uygula
  let allTabs = await browser.tabs.query({});
  for (let t of allTabs) {
    if (t.url && isYouTube(t.url)) {
      applyStateToTab(t.id, newState);
    }
  }
});

// Yeni sekme açıldığında veya sayfa güncellendiğinde çalışır
browser.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  // Sayfa yüklenmesi tamamlandığında veya URL değiştiğinde
  if (changeInfo.status === 'complete' || changeInfo.url) {
    if (tab.url && isYouTube(tab.url)) {
      browser.pageAction.show(tabId); // İkonu Firefox adres çubuğunda göster
      
      // Kayıtlı global durumu al
      let data = await browser.storage.local.get(['isYTNoRecsActive']);
      
      // Eğer kullanıcı eklentiyi ilk defa kurduysa (undefined), varsayılan olarak Aktif (true) başlat
      let isActive = data.isYTNoRecsActive !== undefined ? data.isYTNoRecsActive : true;
      if (data.isYTNoRecsActive === undefined) {
         browser.storage.local.set({ isYTNoRecsActive: true });
      }
      
      applyStateToTab(tabId, isActive);
    } else {
      browser.pageAction.hide(tabId); // YouTube değilse adres çubuğundan gizle
    }
  }
});

// Eklenti ilk yüklendiğinde mevcut açık sekmeleri kontrol et
browser.tabs.query({}).then(async (tabs) => {
  let data = await browser.storage.local.get(['isYTNoRecsActive']);
  let isActive = data.isYTNoRecsActive !== undefined ? data.isYTNoRecsActive : true;
  
  for (let tab of tabs) {
    if (tab.url && isYouTube(tab.url)) {
      browser.pageAction.show(tab.id);
      applyStateToTab(tab.id, isActive);
    }
  }
});