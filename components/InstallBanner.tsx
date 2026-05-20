'use client';

import { useState, useEffect } from 'react';

export default function InstallBanner() {
  const [show, setShow] = useState(false);
  const [isIos, setIsIos] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<Event & { prompt: () => Promise<void> } | null>(null);

  useEffect(() => {
    const ios = /iphone|ipad|ipod/i.test(navigator.userAgent);
    const standalone = (navigator as Navigator & { standalone?: boolean }).standalone;
    const dismissed = sessionStorage.getItem('pwa-banner-dismissed');

    if (dismissed) return;

    if (ios && !standalone) {
      setIsIos(true);
      setShow(true);
      return;
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as Event & { prompt: () => Promise<void> });
      setShow(true);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  function dismiss() {
    sessionStorage.setItem('pwa-banner-dismissed', '1');
    setShow(false);
  }

  async function install() {
    if (deferredPrompt) {
      await deferredPrompt.prompt();
    }
    dismiss();
  }

  if (!show) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 rounded-xl border border-white/10 bg-[#1a1f3a] p-4 shadow-2xl md:left-auto md:right-6 md:w-80">
      <div className="flex items-start gap-3">
        <img src="/icon-192.png" alt="DhyeyVault" className="h-12 w-12 rounded-xl" />
        <div className="flex-1">
          <p className="font-semibold text-white">Install DhyeyVault</p>
          {isIos ? (
            <p className="mt-0.5 text-xs text-gray-400">
              Tap <span className="font-medium text-white">Share</span> then{' '}
              <span className="font-medium text-white">"Add to Home Screen"</span> to install.
            </p>
          ) : (
            <p className="mt-0.5 text-xs text-gray-400">
              Add to your home screen for a faster, app-like experience.
            </p>
          )}
          <div className="mt-2 flex gap-2">
            {!isIos && (
              <button
                onClick={install}
                className="rounded-lg bg-violet-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-violet-500"
              >
                Install
              </button>
            )}
            <button
              onClick={dismiss}
              className="rounded-lg px-3 py-1.5 text-xs font-medium text-gray-400 hover:text-white"
            >
              Not now
            </button>
          </div>
        </div>
        <button onClick={dismiss} className="text-gray-500 hover:text-white" aria-label="Close">
          ✕
        </button>
      </div>
    </div>
  );
}
