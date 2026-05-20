// Background service worker — stores detected credentials per tab

chrome.runtime.onMessage.addListener((msg, sender) => {
  if (msg.type !== 'CREDENTIAL_DETECTED') return;
  if (!sender.tab) return;

  const key = `pending_${sender.tab.id}`;
  chrome.storage.session.set({ [key]: msg.data });

  // Show badge on the extension icon to alert the user
  chrome.action.setBadgeText({ text: '!', tabId: sender.tab.id });
  chrome.action.setBadgeBackgroundColor({ color: '#f59e0b', tabId: sender.tab.id });
});

// Clear badge and pending cred when tab navigates away
chrome.tabs.onUpdated.addListener((tabId, changeInfo) => {
  if (changeInfo.status === 'loading') {
    chrome.action.setBadgeText({ text: '', tabId });
    chrome.storage.session.remove([`pending_${tabId}`]);
  }
});
