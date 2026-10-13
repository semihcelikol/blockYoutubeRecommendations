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

/*
Duruma göre CSS enjekte et veya kaldır.
URL çubuğundaki ikonu ve başlığı güncelle.
*/
function toggleCSS(tab) {
  if (!isYouTube(tab.url)) return;

  let gettingTitle = browser.pageAction.getTitle({tabId: tab.id});
  
  gettingTitle.then((title) => {
    if (title === TITLE_APPLY) {
      browser.pageAction.setIcon({tabId: tab.id, path: "icons/onIcon.png"});
      browser.pageAction.setTitle({tabId: tab.id, title: TITLE_REMOVE});
      browser.scripting.insertCSS({
        target: {tabId: tab.id},
        css: CSS
      }).catch(error => console.error('Insert CSS error:', error));

    } else {
      browser.pageAction.setIcon({tabId: tab.id, path: "icons/offIcon.png"});
      browser.pageAction.setTitle({tabId: tab.id, title: TITLE_APPLY});
      browser.scripting.removeCSS({
        target: {tabId: tab.id},
        css: CSS
      }).catch(error => console.error('Remove CSS error:', error));
    }
  });
}

// Sekme yüklendiğinde veya güncellendiğinde, sadece YouTube'daysak URL çubuğunda ikonu göster
function handleTabUpdate(tabId, changeInfo, tab) {
  if (tab.url && isYouTube(tab.url)) {
    browser.pageAction.show(tab.id); // İkonu adres çubuğunda göster
  } else {
    browser.pageAction.hide(tab.id); // YouTube değilse adres çubuğundan gizle
  }
}

// İlk yüklendiğinde tüm sekmeleri kontrol et
browser.tabs.query({}).then((tabs) => {
  for (let tab of tabs) {
    if (tab.url) handleTabUpdate(tab.id, null, tab);
  }
});

// Sekme güncellemelerini dinle
browser.tabs.onUpdated.addListener((id, changeInfo, tab) => {
  if (changeInfo.status === 'complete' || changeInfo.url) {
     handleTabUpdate(id, changeInfo, tab);
  }
});

// Butona tıklandığında CSS işlemini tetikle
browser.pageAction.onClicked.addListener(toggleCSS);