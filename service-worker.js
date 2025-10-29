const CACHE_NAME = 'smart-attendance-cache-v1';
// List of all files that make up the "app shell" to be cached
const URLS_TO_CACHE = [
  './',
  './index.html',
  './index.tsx',
  './App.tsx',
  './types.ts',
  './components/Header.tsx',
  './components/Scanner.tsx',
  './components/Reports.tsx',
  './components/icons.tsx',
  './services/googleSheetsService.ts',
  './utils/exportUtils.ts',
  './utils/AmiriFont.ts', // Add the new font file to the cache
  './manifest.json',
  './favicon.ico',
  './logo192.png',
  './logo512.png',
  'https://cdn.tailwindcss.com',
  'https://unpkg.com/html5-qrcode@2.3.8/html5-qrcode.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.5.23/jspdf.plugin.autotable.min.js'
];

/**
 * Install event: Caches the app shell upon installation.
 */
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Opened cache');
        return cache.addAll(URLS_TO_CACHE);
      })
  );
});

/**
 * Fetch event: Serves content from cache first (cache-first strategy).
 * If the resource is not in the cache, it fetches it from the network.
 */
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Cache hit - return the response from cache
        if (response) {
          return response;
        }
        // Not in cache - fetch from the network
        return fetch(event.request);
      })
  );
});

/**
 * Activate event: Cleans up old caches to ensure the user has the latest version.
 */
self.addEventListener('activate', (event) => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});