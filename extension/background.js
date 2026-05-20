// Background service worker — auto-saves detected credentials immediately

// ─── Crypto (same as popup.js / webapp) ──────────────────────────────────────

function b64ToBuffer(b64) {
  const bin = atob(b64);
  const buf = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) buf[i] = bin.charCodeAt(i);
  return buf.buffer;
}
function bufToB64(buf) {
  return btoa(String.fromCharCode(...new Uint8Array(buf)));
}
async function encryptText(plain, key) {
  const enc = new TextEncoder();
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const buf = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, enc.encode(plain));
  return { ciphertext: bufToB64(buf), iv: bufToB64(iv.buffer) };
}
async function importKeyB64(b64) {
  return crypto.subtle.importKey('raw', b64ToBuffer(b64), { name: 'AES-GCM' }, true, ['encrypt', 'decrypt']);
}
function calcStrength(pw) {
  if (!pw) return 0;
  let s = 0;
  if (pw.length >= 8) s++;
  if (pw.length >= 12) s++;
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) s++;
  if (/\d/.test(pw)) s++;
  if (/[^A-Za-z0-9]/.test(pw)) s++;
  return Math.min(4, s);
}
function generateId() {
  return crypto.randomUUID();
}

// ─── Storage helpers ──────────────────────────────────────────────────────────

function getSettings() {
  return new Promise(r => chrome.storage.sync.get(['vaultUrl', 'apiToken'], r));
}
function getCachedKey() {
  return new Promise(r => chrome.storage.session.get(['cryptoKeyB64'], r));
}
function setPending(tabId, cred) {
  return new Promise(r => chrome.storage.session.set({ [`pending_${tabId}`]: cred }, r));
}
function clearPending(tabId) {
  return new Promise(r => chrome.storage.session.remove([`pending_${tabId}`], r));
}

// ─── API ──────────────────────────────────────────────────────────────────────

async function apiPost(vaultUrl, apiToken, path, body) {
  const res = await fetch(`${vaultUrl.replace(/\/$/, '')}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiToken}` },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const j = await res.json().catch(() => ({}));
    throw new Error(j.error || `HTTP ${res.status}`);
  }
  return res.json();
}

// ─── Save password (matches webapp format exactly) ────────────────────────────

async function saveToVault(vaultUrl, apiToken, key, cred) {
  const { ciphertext: encPw, iv: pwIv } = await encryptText(cred.password, key);
  const now = new Date().toISOString();
  const payload = JSON.stringify({
    siteName: cred.siteName,
    siteUrl: cred.siteUrl,
    username: cred.username,
    password: encPw,
    passwordIv: pwIv,
    category: 'other',
    notes: '', favorite: false,
    createdAt: now, updatedAt: now,
    strength: calcStrength(cred.password),
  });
  const { ciphertext: data, iv } = await encryptText(payload, key);
  await apiPost(vaultUrl, apiToken, '/api/passwords', { id: generateId(), data, iv });
}

// ─── Badge helpers ────────────────────────────────────────────────────────────

function setBadge(tabId, text, color) {
  chrome.action.setBadgeText({ text, tabId });
  chrome.action.setBadgeBackgroundColor({ color, tabId });
}
function clearBadge(tabId, delay = 3000) {
  setTimeout(() => chrome.action.setBadgeText({ text: '', tabId }), delay);
}

// ─── Main handler ─────────────────────────────────────────────────────────────

chrome.runtime.onMessage.addListener((msg, sender) => {
  if (msg.type !== 'CREDENTIAL_DETECTED' || !sender.tab) return;
  handleCredential(msg.data, sender.tab.id);
});

async function handleCredential(cred, tabId) {
  // Skip if no real username/password
  if (!cred.password || (!cred.username && !cred.siteName)) return;

  const settings = await getSettings();
  if (!settings.vaultUrl || !settings.apiToken) {
    // Extension not configured — store pending so popup shows it
    await setPending(tabId, cred);
    setBadge(tabId, '!', '#6b7280');
    return;
  }

  const { cryptoKeyB64 } = await getCachedKey();
  if (!cryptoKeyB64) {
    // Vault locked — store as pending, badge prompts user to open popup & unlock
    await setPending(tabId, cred);
    setBadge(tabId, '🔒', '#f59e0b');
    return;
  }

  try {
    const key = await importKeyB64(cryptoKeyB64);
    await saveToVault(settings.vaultUrl, settings.apiToken, key, cred);

    // Show success notification
    chrome.notifications.create({
      type: 'basic',
      iconUrl: 'icon48.svg',
      title: 'DhyeyVault — Saved',
      message: `"${cred.username || cred.siteName}" saved to your vault.`,
    });
    setBadge(tabId, '✓', '#10b981');
    clearBadge(tabId, 3000);
  } catch (err) {
    // Save failed — store as pending so user can retry from popup
    await setPending(tabId, cred);
    setBadge(tabId, '!', '#ef4444');
    console.error('[DhyeyVault] auto-save failed:', err.message);
  }
}

// ─── Clear stale pending creds on navigation ──────────────────────────────────

chrome.tabs.onUpdated.addListener((tabId, changeInfo) => {
  if (changeInfo.status === 'loading') {
    chrome.action.setBadgeText({ text: '', tabId });
    clearPending(tabId);
  }
});
