// ─── Crypto helpers (same algorithm as webapp) ───────────────────────────────

function b64ToBuffer(b64) {
  const bin = atob(b64);
  const buf = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) buf[i] = bin.charCodeAt(i);
  return buf.buffer;
}
function bufToB64(buf) {
  return btoa(String.fromCharCode(...new Uint8Array(buf)));
}

async function deriveKey(password, saltB64) {
  const enc = new TextEncoder();
  const km = await crypto.subtle.importKey('raw', enc.encode(password), 'PBKDF2', false, ['deriveKey']);
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt: b64ToBuffer(saltB64), iterations: 200000, hash: 'SHA-256' },
    km,
    { name: 'AES-GCM', length: 256 },
    true,  // extractable so we can cache in session storage
    ['encrypt', 'decrypt']
  );
}

async function encryptText(plain, key) {
  const enc = new TextEncoder();
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const buf = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, enc.encode(plain));
  return { ciphertext: bufToB64(buf), iv: bufToB64(iv.buffer) };
}

async function decryptText(ciphertext, iv, key) {
  const dec = new TextDecoder();
  const buf = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: b64ToBuffer(iv) }, key, b64ToBuffer(ciphertext));
  return dec.decode(buf);
}

async function exportKeyB64(key) {
  const raw = await crypto.subtle.exportKey('raw', key);
  return bufToB64(raw);
}

async function importKeyB64(b64) {
  return crypto.subtle.importKey('raw', b64ToBuffer(b64), { name: 'AES-GCM' }, true, ['encrypt', 'decrypt']);
}

const VERIFIER_PLAINTEXT = 'dhyeyvault-verified';

// ─── Settings & session storage ───────────────────────────────────────────────

async function getSettings() {
  return new Promise(resolve => chrome.storage.sync.get(['vaultUrl', 'apiToken'], resolve));
}
async function saveSettings(vaultUrl, apiToken) {
  return new Promise(resolve => chrome.storage.sync.set({ vaultUrl, apiToken }, resolve));
}
async function getCachedKey() {
  return new Promise(resolve => chrome.storage.session.get(['cryptoKeyB64'], resolve));
}
async function setCachedKey(b64) {
  return new Promise(resolve => chrome.storage.session.set({ cryptoKeyB64: b64 }, resolve));
}
async function clearCachedKey() {
  return new Promise(resolve => chrome.storage.session.remove(['cryptoKeyB64'], resolve));
}
async function getPendingCredential(tabId) {
  return new Promise(resolve => chrome.storage.session.get([`pending_${tabId}`], d => resolve(d[`pending_${tabId}`] || null)));
}
async function clearPendingCredential(tabId) {
  return new Promise(resolve => chrome.storage.session.remove([`pending_${tabId}`], resolve));
}

// ─── API ──────────────────────────────────────────────────────────────────────

async function api(vaultUrl, apiToken, path, options = {}) {
  const url = `${vaultUrl.replace(/\/$/, '')}${path}`;
  const res = await fetch(url, {
    ...options,
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiToken}`, ...(options.headers || {}) },
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `HTTP ${res.status}`);
  }
  return res.json();
}

// ─── Password save/load ───────────────────────────────────────────────────────

function generateId() {
  return crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2) + Date.now().toString(36);
}

async function savePasswordToVault(vaultUrl, apiToken, key, { siteName, siteUrl, username, password, category }) {
  // Inner encryption — must match webapp's PasswordContext.addEntry
  const { ciphertext: encPw, iv: pwIv } = await encryptText(password, key);
  const now = new Date().toISOString();
  // Outer payload — must match lib/passwordStorage.ts savePasswordEntry
  const payload = JSON.stringify({
    siteName, siteUrl, username,
    password: encPw,
    passwordIv: pwIv,
    category: category || 'other',
    notes: '', favorite: false,
    createdAt: now, updatedAt: now,
    strength: calcStrength(password),
  });
  const { ciphertext: data, iv } = await encryptText(payload, key);
  const id = generateId();
  await api(vaultUrl, apiToken, '/api/passwords', {
    method: 'POST',
    body: JSON.stringify({ id, data, iv }),
  });
  return id;
}

async function loadPasswordsFromVault(vaultUrl, apiToken, key) {
  const rows = await api(vaultUrl, apiToken, '/api/passwords');
  const entries = [];
  for (const row of rows) {
    try {
      const plain = await decryptText(row.data, row.iv, key);
      const fields = JSON.parse(plain);
      entries.push({ id: row.id, ...fields });
    } catch { /* corrupt/wrong key */ }
  }
  return entries;
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

// ─── Unlock vault ─────────────────────────────────────────────────────────────

async function unlockVault(vaultUrl, apiToken, masterPassword) {
  const meta = await api(vaultUrl, apiToken, '/api/password-meta');
  if (!meta) throw new Error('Password vault not set up. Please set up your vault in DhyeyVault first.');
  const key = await deriveKey(masterPassword, meta.salt);
  const verified = await decryptText(meta.verifier, meta.verifierIv, key).catch(() => null);
  if (verified !== VERIFIER_PLAINTEXT) throw new Error('Incorrect master password');
  const keyB64 = await exportKeyB64(key);
  await setCachedKey(keyB64);
  return key;
}

async function getKey() {
  const { cryptoKeyB64 } = await getCachedKey();
  if (!cryptoKeyB64) return null;
  return importKeyB64(cryptoKeyB64);
}

// ─── Render helpers ───────────────────────────────────────────────────────────

const root = document.getElementById('root');
const btnLock = document.getElementById('btn-lock');
const btnSettings = document.getElementById('btn-settings');

function el(tag, cls, inner) {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (inner !== undefined) e.innerHTML = inner;
  return e;
}

function showError(msg) {
  const d = el('div', 'alert error', `⚠️ ${msg}`);
  return d;
}

function showInfo(msg) {
  return el('div', 'alert info', `ℹ️ ${msg}`);
}

// ─── Settings screen ──────────────────────────────────────────────────────────

function renderSettings(prefill) {
  btnLock.style.display = 'none';
  root.innerHTML = '';

  const title = el('div', '', '<div style="font-weight:700;font-size:15px;color:#f0f4ff">Connect Your Vault</div><div style="font-size:12px;color:#8899bb;margin-top:4px">Enter your DhyeyVault URL and API token.</div>');
  root.appendChild(title);

  const urlField = el('div', 'field');
  urlField.innerHTML = '<label>Vault URL</label>';
  const urlInput = el('input');
  urlInput.type = 'text';
  urlInput.placeholder = 'https://dhyeyvault.vercel.app';
  urlInput.value = (prefill && prefill.vaultUrl) || 'https://dhyeyvault.vercel.app';
  urlField.appendChild(urlInput);
  root.appendChild(urlField);

  const tokenField = el('div', 'field');
  tokenField.innerHTML = '<label>API Token</label>';
  const tokenRow = el('div', 'input-row');
  const tokenInput = el('input');
  tokenInput.type = 'password';
  tokenInput.placeholder = 'Paste token from DhyeyVault → Passwords → Browser Extension';
  tokenInput.value = (prefill && prefill.apiToken) || '';
  const eyeBtn = el('button', 'eye-btn', '👁️');
  eyeBtn.type = 'button';
  eyeBtn.onclick = () => { tokenInput.type = tokenInput.type === 'password' ? 'text' : 'password'; };
  tokenRow.appendChild(tokenInput);
  tokenRow.appendChild(eyeBtn);
  tokenField.appendChild(tokenRow);
  root.appendChild(tokenField);

  const errDiv = el('div');
  root.appendChild(errDiv);

  const saveBtn = el('button', 'btn-primary', '💾 Save Settings');
  saveBtn.onclick = async () => {
    const url = urlInput.value.trim();
    const token = tokenInput.value.trim();
    if (!url || !token) { errDiv.innerHTML = ''; errDiv.appendChild(showError('Both fields are required.')); return; }
    saveBtn.disabled = true;
    saveBtn.innerHTML = '<span class="spinner"></span> Saving…';
    try {
      // Verify token works
      await api(url, token, '/api/password-meta');
      await saveSettings(url, token);
      renderMain();
    } catch (e) {
      errDiv.innerHTML = '';
      errDiv.appendChild(showError(e.message));
      saveBtn.disabled = false;
      saveBtn.innerHTML = '💾 Save Settings';
    }
  };
  root.appendChild(saveBtn);

  root.appendChild(el('div', 'text-muted', '<a href="https://dhyeyvault.vercel.app/passwords" target="_blank">Get your token from DhyeyVault →</a>'));
}

// ─── Lock screen ──────────────────────────────────────────────────────────────

function renderLock(vaultUrl, apiToken) {
  btnLock.style.display = 'none';
  root.innerHTML = '';

  const wrap = el('div', 'lock-center');
  wrap.innerHTML = '<div class="lock-icon">🔐</div><div class="lock-title">Vault Locked</div><div class="lock-sub">Enter your master password to access saved passwords</div>';

  const form = el('div', 'field', '<label>Master Password</label>');
  const pwRow = el('div', 'input-row');
  const pwInput = el('input');
  pwInput.type = 'password';
  pwInput.placeholder = '••••••••';
  pwInput.autofocus = true;
  const eyeBtn = el('button', 'eye-btn', '👁️');
  eyeBtn.type = 'button';
  eyeBtn.onclick = () => { pwInput.type = pwInput.type === 'password' ? 'text' : 'password'; };
  pwRow.appendChild(pwInput);
  pwRow.appendChild(eyeBtn);
  form.appendChild(pwRow);

  const errDiv = el('div');
  const unlockBtn = el('button', 'btn-primary', '🔓 Unlock Vault');

  const doUnlock = async () => {
    const pw = pwInput.value;
    if (!pw) return;
    unlockBtn.disabled = true;
    unlockBtn.innerHTML = '<span class="spinner"></span> Unlocking…';
    errDiv.innerHTML = '';
    try {
      await unlockVault(vaultUrl, apiToken, pw);
      renderMain();
    } catch (e) {
      errDiv.appendChild(showError(e.message));
      unlockBtn.disabled = false;
      unlockBtn.innerHTML = '🔓 Unlock Vault';
    }
  };

  pwInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') doUnlock(); });
  unlockBtn.onclick = doUnlock;

  wrap.appendChild(form);
  wrap.appendChild(errDiv);
  wrap.appendChild(unlockBtn);
  root.appendChild(wrap);
}

// ─── Main screen ──────────────────────────────────────────────────────────────

async function renderMain() {
  btnLock.style.display = 'flex';
  root.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;padding:32px"><span class="spinner"></span></div>';

  const settings = await getSettings();
  const key = await getKey();
  if (!key) { renderLock(settings.vaultUrl, settings.apiToken); return; }

  let entries = [];
  let pendingCred = null;
  let currentDomain = '';

  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab && tab.url) {
      try { currentDomain = new URL(tab.url).hostname.replace(/^www\./, ''); } catch {}
      pendingCred = await getPendingCredential(tab.id);
    }
    entries = await loadPasswordsFromVault(settings.vaultUrl, settings.apiToken, key);
  } catch (e) {
    root.innerHTML = '';
    root.appendChild(showError('Failed to load passwords: ' + e.message));
    return;
  }

  const siteEntries = entries.filter(e => {
    const eHost = (() => { try { return new URL(e.siteUrl || '').hostname.replace(/^www\./, ''); } catch { return (e.siteUrl || '').toLowerCase(); } })();
    return currentDomain && eHost.includes(currentDomain);
  });

  root.innerHTML = '';

  // Site header
  if (currentDomain) {
    const sh = el('div', 'site-header');
    sh.innerHTML = `<span class="domain">${currentDomain}</span><span class="badge">${siteEntries.length} saved</span>`;
    root.appendChild(sh);
  }

  // Pending credential banner
  if (pendingCred) {
    const banner = el('div', 'pending-banner');
    banner.innerHTML = `
      <div class="banner-title">🔑 Save detected credential?</div>
      <div class="cred-row"><span>Site</span><span>${pendingCred.siteName || currentDomain}</span></div>
      <div class="cred-row"><span>Username</span><span>${pendingCred.username}</span></div>
      <div class="cred-row"><span>Password</span><span>••••••••</span></div>
    `;
    const actions = el('div', 'flex gap-8 mt-2');
    const saveBtn = el('button', 'btn-primary', '💾 Save');
    saveBtn.style.fontSize = '12px';
    saveBtn.style.padding = '8px';
    const skipBtn = el('button', 'btn-secondary', 'Skip');
    skipBtn.style.fontSize = '12px';
    skipBtn.style.padding = '8px';

    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    skipBtn.onclick = async () => { await clearPendingCredential(tab.id); renderMain(); };
    saveBtn.onclick = async () => {
      saveBtn.disabled = true;
      saveBtn.innerHTML = '<span class="spinner"></span>';
      try {
        await savePasswordToVault(settings.vaultUrl, settings.apiToken, key, {
          siteName: pendingCred.siteName || currentDomain,
          siteUrl: pendingCred.siteUrl || `https://${currentDomain}`,
          username: pendingCred.username,
          password: pendingCred.password,
          category: 'other',
        });
        await clearPendingCredential(tab.id);
        renderMain();
      } catch (e) {
        banner.appendChild(showError(e.message));
        saveBtn.disabled = false;
        saveBtn.innerHTML = '💾 Save';
      }
    };

    actions.appendChild(saveBtn);
    actions.appendChild(skipBtn);
    banner.appendChild(actions);
    root.appendChild(banner);
    root.appendChild(el('div', 'divider'));
  }

  // Saved passwords for this site
  if (siteEntries.length > 0) {
    root.appendChild(el('div', 'section-title', `Saved for ${currentDomain}`));
    const list = el('div', 'card');
    for (const entry of siteEntries) {
      list.appendChild(buildEntryRow(entry, key, settings));
    }
    root.appendChild(list);
  } else if (!pendingCred && currentDomain) {
    root.appendChild(el('div', 'empty', `<div class="icon">🔍</div>No saved passwords for ${currentDomain}`));
  }

  // All passwords section
  if (entries.length > 0) {
    const toggle = el('button', 'btn-secondary', `🗝️ All Passwords (${entries.length})`);
    toggle.style.fontSize = '12px';
    toggle.style.marginTop = '4px';
    const allList = el('div', 'card');
    allList.style.display = 'none';
    let open = false;
    toggle.onclick = () => {
      open = !open;
      allList.style.display = open ? 'block' : 'none';
      toggle.innerHTML = open ? `🗝️ Hide All (${entries.length})` : `🗝️ All Passwords (${entries.length})`;
      if (open && !allList.children.length) {
        for (const entry of entries) allList.appendChild(buildEntryRow(entry, key, settings));
      }
    };
    root.appendChild(toggle);
    root.appendChild(allList);
  }

  // Add new password manually
  root.appendChild(el('div', 'divider'));
  const addBtn = el('button', 'btn-secondary', '+ Add Password Manually');
  addBtn.style.fontSize = '12px';
  addBtn.onclick = () => renderAddForm(settings, key, currentDomain);
  root.appendChild(addBtn);
}

function buildEntryRow(entry, key, settings) {
  const row = el('div', 'pw-row');
  const avatar = el('div', 'pw-avatar', (entry.siteName || '?')[0].toUpperCase());
  const info = el('div', 'pw-info');
  info.innerHTML = `<div class="site">${entry.siteName}</div><div class="user">${entry.username}</div>`;
  const actions = el('div', 'pw-actions');

  const fillBtn = el('button', 'btn-sm fill', '⌨️ Fill');
  fillBtn.onclick = async () => {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    try {
      // entry.password = inner ciphertext; entry.passwordIv = inner IV (set by savePasswordToVault)
      const plain = await decryptText(entry.password, entry.passwordIv, key);
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: (username, password) => {
          const pwInput = document.querySelector('input[type="password"]');
          const userInput = document.querySelector('input[type="email"],input[type="text"][name*="user"],input[type="text"][name*="email"],input[type="text"][name*="login"],input[type="text"][id*="user"],input[type="text"][id*="email"]');
          if (userInput) { userInput.value = username; userInput.dispatchEvent(new Event('input', { bubbles: true })); }
          if (pwInput) { pwInput.value = password; pwInput.dispatchEvent(new Event('input', { bubbles: true })); }
        },
        args: [entry.username, plain],
      });
      fillBtn.innerHTML = '✅';
      setTimeout(() => { fillBtn.innerHTML = '⌨️ Fill'; }, 1500);
    } catch (e) {
      fillBtn.innerHTML = '❌';
      setTimeout(() => { fillBtn.innerHTML = '⌨️ Fill'; }, 1500);
    }
  };

  const copyBtn = el('button', 'btn-sm', '📋');
  copyBtn.title = 'Copy password';
  copyBtn.onclick = async () => {
    try {
      const plain = await decryptText(entry.password, entry.passwordIv, key);
      await navigator.clipboard.writeText(plain);
      copyBtn.innerHTML = '✅';
      setTimeout(() => { copyBtn.innerHTML = '📋'; }, 1500);
    } catch { copyBtn.innerHTML = '❌'; setTimeout(() => { copyBtn.innerHTML = '📋'; }, 1500); }
  };

  actions.appendChild(fillBtn);
  actions.appendChild(copyBtn);
  row.appendChild(avatar);
  row.appendChild(info);
  row.appendChild(actions);
  return row;
}

// ─── Add password form ────────────────────────────────────────────────────────

function renderAddForm(settings, key, currentDomain) {
  root.innerHTML = '';

  const back = el('button', 'btn-secondary', '← Back');
  back.style.fontSize = '12px';
  back.style.marginBottom = '8px';
  back.onclick = renderMain;
  root.appendChild(back);

  root.appendChild(el('div', '', '<div style="font-weight:700;font-size:14px;color:#f0f4ff">Add Password</div>'));

  const fields = [
    { id: 'siteName', label: 'Site Name', type: 'text', placeholder: 'e.g. GitHub', value: currentDomain },
    { id: 'siteUrl', label: 'Site URL', type: 'text', placeholder: 'https://...', value: currentDomain ? `https://${currentDomain}` : '' },
    { id: 'username', label: 'Username / Email', type: 'text', placeholder: '' },
    { id: 'password', label: 'Password', type: 'password', placeholder: '' },
  ];

  const inputs = {};
  for (const f of fields) {
    const field = el('div', 'field', `<label>${f.label}</label>`);
    const inp = el('input');
    inp.type = f.type;
    inp.placeholder = f.placeholder;
    inp.value = f.value || '';
    if (f.type === 'password') {
      const row = el('div', 'input-row');
      const eye = el('button', 'eye-btn', '👁️');
      eye.type = 'button';
      eye.onclick = () => { inp.type = inp.type === 'password' ? 'text' : 'password'; };
      row.appendChild(inp);
      row.appendChild(eye);
      field.appendChild(row);
    } else {
      field.appendChild(inp);
    }
    inputs[f.id] = inp;
    root.appendChild(field);
  }

  const errDiv = el('div');
  root.appendChild(errDiv);

  const saveBtn = el('button', 'btn-primary', '💾 Save Password');
  saveBtn.onclick = async () => {
    const vals = { siteName: inputs.siteName.value.trim(), siteUrl: inputs.siteUrl.value.trim(), username: inputs.username.value.trim(), password: inputs.password.value };
    if (!vals.siteName || !vals.username || !vals.password) {
      errDiv.innerHTML = '';
      errDiv.appendChild(showError('Site name, username and password are required.'));
      return;
    }
    saveBtn.disabled = true;
    saveBtn.innerHTML = '<span class="spinner"></span> Saving…';
    try {
      await savePasswordToVault(settings.vaultUrl, settings.apiToken, key, { ...vals, category: 'other' });
      renderMain();
    } catch (e) {
      errDiv.appendChild(showError(e.message));
      saveBtn.disabled = false;
      saveBtn.innerHTML = '💾 Save Password';
    }
  };
  root.appendChild(saveBtn);
}

// ─── Init ─────────────────────────────────────────────────────────────────────

btnSettings.onclick = async () => {
  const settings = await getSettings();
  renderSettings(settings);
};

btnLock.onclick = async () => {
  await clearCachedKey();
  renderMain();
};

async function init() {
  const settings = await getSettings();
  if (!settings.vaultUrl || !settings.apiToken) {
    renderSettings(null);
    return;
  }
  btnSettings.style.display = 'flex';
  const key = await getKey();
  if (!key) {
    renderLock(settings.vaultUrl, settings.apiToken);
  } else {
    renderMain();
  }
}

init();
