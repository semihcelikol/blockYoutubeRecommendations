const CSS = ".ytp-ce-element.ytp-ce-element-show { opacity: 0; }";
const TITLE_APPLY = "Blocked Recommendations ";
const TITLE_REMOVE = "UnBlocked Recommendations";
const APPLICABLE_PROTOCOLS = ["http:", "https:"];

/*
Toggle CSS: based on the current title, insert or remove the CSS.
Update the page action's title and icon to reflect its state.
*/
function toggleCSS(tab) {

  function gotTitle(title) {
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
  }

  var gettingTitle = browser.pageAction.getTitle({tabId: tab.id});
  gettingTitle.then(gotTitle);
}

/*
Returns true only if the URL's protocol is in APPLICABLE_PROTOCOLS.
*/
function protocolIsApplicable(url) {
  var anchor =  document.createElement('a');
  anchor.href = url;
  return APPLICABLE_PROTOCOLS.includes(anchor.protocol);
}

/*
Initialize the page action: set icon and title, then show.
Only operates on tabs whose URL's protocol is applicable.
*/
function initializePageAction(tab) {
  if (protocolIsApplicable(tab.url)) {
    browser.pageAction.setIcon({tabId: tab.id, path: "icons/offIcon.png"});
    browser.pageAction.setTitle({tabId: tab.id, title: TITLE_APPLY});
    browser.pageAction.show(tab.id);
  }
}

/*
When first loaded, initialize the page action for all tabs.
*/
var gettingAllTabs = browser.tabs.query({});
gettingAllTabs.then((tabs) => {
  for (let tab of tabs) {
    initializePageAction(tab);
  }
});

/*
Each time a tab is updated, reset the page action for that tab.
*/
browser.tabs.onUpdated.addListener((id, changeInfo, tab) => {
  initializePageAction(tab);
});

/*
Toggle CSS when the page action is clicked.
*/
browser.pageAction.onClicked.addListener(toggleCSS);