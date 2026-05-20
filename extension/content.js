// Detects login credentials and notifies the extension
// Handles both traditional forms and SPA-style logins (Gmail, etc.)

(function () {
  'use strict';

  let pendingCred = null;  // captured username+password waiting for confirmation

  function findUsernameInput(root) {
    const selectors = [
      'input[type="email"]',
      'input[autocomplete="username"]',
      'input[autocomplete="email"]',
      'input[name*="email" i]',
      'input[name*="user" i]',
      'input[name*="login" i]',
      'input[id*="email" i]',
      'input[id*="user" i]',
      'input[id*="login" i]',
      'input[type="text"]',
    ];
    for (const sel of selectors) {
      const el = (root instanceof HTMLFormElement ? root : document).querySelector(sel);
      if (el && el.value) return el;
    }
    return null;
  }

  function buildCred(pwInput) {
    const form = pwInput.closest('form');
    const userInput = findUsernameInput(form);
    const username = userInput ? userInput.value.trim() : '';
    const password = pwInput.value;
    if (!password) return null;
    return {
      siteName: document.title || window.location.hostname,
      siteUrl: window.location.href,
      username,
      password,
    };
  }

  function sendCred(cred) {
    if (!cred || !cred.password) return;
    chrome.runtime.sendMessage({ type: 'CREDENTIAL_DETECTED', data: cred });
  }

  // ── Strategy 1: native form submit ───────────────────────────────────────
  function attachFormListener(form) {
    if (form.dataset.dvAttached) return;
    form.dataset.dvAttached = '1';
    form.addEventListener('submit', () => {
      const pwInput = form.querySelector('input[type="password"]');
      if (pwInput) sendCred(buildCred(pwInput));
    }, true);
  }

  document.querySelectorAll('form').forEach(attachFormListener);

  // ── Strategy 2: password field blur (SPAs — user fills pw, tabs away) ───
  function attachPasswordWatcher(pwInput) {
    if (pwInput.dataset.dvWatched) return;
    pwInput.dataset.dvWatched = '1';

    pwInput.addEventListener('blur', () => {
      const cred = buildCred(pwInput);
      if (cred) pendingCred = cred;  // stash for when submit is clicked
    });

    // Also catch Enter key in the password field (common SPA submit)
    pwInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        const cred = buildCred(pwInput);
        if (cred) { pendingCred = null; sendCred(cred); }
      }
    });
  }

  document.querySelectorAll('input[type="password"]').forEach(attachPasswordWatcher);

  // ── Strategy 3: submit-button clicks flush the pending credential ────────
  document.addEventListener('click', (e) => {
    const el = e.target;
    if (!(el instanceof HTMLElement)) return;
    const tag = el.tagName;
    const type = el.getAttribute('type') || '';
    const role = el.getAttribute('role') || '';
    const isSubmit = tag === 'BUTTON' || type === 'submit' || role === 'button' || tag === 'INPUT';
    if (!isSubmit || !pendingCred) return;

    // Make sure the button is near a password field
    const form = el.closest('form');
    const hasPw = form
      ? !!form.querySelector('input[type="password"]')
      : !!document.querySelector('input[type="password"]');
    if (!hasPw) return;

    sendCred(pendingCred);
    pendingCred = null;
  }, true);

  // ── Watch for dynamically added forms and password fields ─────────────────
  const observer = new MutationObserver(() => {
    document.querySelectorAll('form:not([data-dv-attached])').forEach(attachFormListener);
    document.querySelectorAll('input[type="password"]:not([data-dv-watched])').forEach(attachPasswordWatcher);
  });
  observer.observe(document.body, { childList: true, subtree: true });

  // ── Listen for fill requests from popup ───────────────────────────────────
  chrome.runtime.onMessage.addListener((msg) => {
    if (msg.type !== 'FILL_CREDENTIAL') return;
    const { username, password } = msg;
    const pwInput = document.querySelector('input[type="password"]');
    const form = pwInput ? pwInput.closest('form') : null;
    const userInput = form ? findUsernameInput(form) : findUsernameInput(document);

    function fill(el, value) {
      if (!el) return;
      const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
      nativeInputValueSetter.call(el, value);
      el.dispatchEvent(new Event('input', { bubbles: true }));
      el.dispatchEvent(new Event('change', { bubbles: true }));
    }

    if (userInput) fill(userInput, username);
    if (pwInput) fill(pwInput, password);
  });
})();
