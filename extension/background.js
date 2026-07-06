// JobForge AI — background service worker (MV3)
// Handles: badge text per tab, desktop notifications, and triggering file downloads
// (kept in the background worker because chrome.downloads isn't available to content scripts).

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.action === 'setBadge') {
    const tabId = sender.tab?.id;
    if (tabId) {
      chrome.action.setBadgeText({ tabId, text: msg.text || '' });
      chrome.action.setBadgeBackgroundColor({ tabId, color: '#8b5cf6' }); // purple accent
    }
    sendResponse({ ok: true });
    return true;
  }

  if (msg.action === 'notify') {
    chrome.notifications.create({
      type: 'basic',
      iconUrl: 'icon.png',
      title: msg.title || 'JobForge AI',
      message: msg.message || ''
    });
    sendResponse({ ok: true });
    return true;
  }

  if (msg.action === 'downloadFile') {
    // msg.url must be a fully qualified backend URL; msg.filename is suggested name
    chrome.downloads.download({ url: msg.url, filename: msg.filename, saveAs: false }, (downloadId) => {
      sendResponse({ ok: true, downloadId });
    });
    return true; // async response
  }
});
