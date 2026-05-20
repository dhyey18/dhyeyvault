import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'DhyeyVault',
    short_name: 'DhyeyVault',
    description: 'AI-powered personal document vault and password manager',
    start_url: '/dashboard',
    display: 'standalone',
    background_color: '#080b18',
    theme_color: '#7c3aed',
    orientation: 'portrait',
    icons: [
      { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png' },
      { src: '/icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'maskable' },
    ],
    shortcuts: [
      { name: 'My Vault', short_name: 'Vault', url: '/vault', icons: [{ src: '/icon.svg', sizes: 'any' }] },
      { name: 'Passwords', short_name: 'Passwords', url: '/passwords', icons: [{ src: '/icon.svg', sizes: 'any' }] },
    ],
  };
}
