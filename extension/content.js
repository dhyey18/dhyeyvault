// Detects login form submissions and notifies the extension

(function () {
  'use strict';

  // Find the most likely username input in a form
  function findUsernameInput(form) {
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
      const el = form.querySelector(sel);
      if (el && el.value) return el;
    }
    return null;
  }

  function onFormSubmit(e) {
    const form = e.target;
    const pwInput = form.querySelector('input[type="password"]');
    if (!pwInput || !pwInput.value) return;

    const userInput = findUsernameInput(form);
    const username = userInput ? userInput.value.trim() : '';
    const password = pwInput.value;

    if (!username && !password) return;

    chrome.runtime.sendMessage({
      type: 'CREDENTIAL_DETECTED',
      data: {
        siteName: document.title || window.location.hostname,
        siteUrl: window.location.href,
        username,
        password,
      },
    });
  }

  // Listen on all current forms
  document.querySelectorAll('form').forEach((form) => {
    form.addEventListener('submit', onFormSubmit, true);
  });

  // Watch for dynamically added forms
  const observer = new MutationObserver(() => {
    document.querySelectorAll('form:not([data-dv-observed])').forEach((form) => {
      form.setAttribute('data-dv-observed', '1');
      form.addEventListener('submit', onFormSubmit, true);
    });
  });
  observer.observe(document.body, { childList: true, subtree: true });

  // Listen for fill requests from popup
  chrome.runtime.onMessage.addListener((msg) => {
    if (msg.type !== 'FILL_CREDENTIAL') return;
    const { username, password } = msg;
    const pwInput = document.querySelector('input[type="password"]');
    const form = pwInput ? pwInput.closest('form') : null;
    const userInput = form ? findUsernameInput(form) : null;

    if (userInput) {
      userInput.value = username;
      userInput.dispatchEvent(new Event('input', { bubbles: true }));
      userInput.dispatchEvent(new Event('change', { bubbles: true }));
    }
    if (pwInput) {
      pwInput.value = password;
      pwInput.dispatchEvent(new Event('input', { bubbles: true }));
      pwInput.dispatchEvent(new Event('change', { bubbles: true }));
    }
  });
})();
