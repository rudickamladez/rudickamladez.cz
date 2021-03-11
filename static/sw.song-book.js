self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open('fox-store').then((cache) => cache.addAll([
      '/favicon.ico',
      '/images/IMG_4726.jpg',
      '/images/erik-mclean-bGWVhFY1gH0-unsplash.jpg',
      '/en/',
      '/en/404/',
      '/en/song-book/',
      '/cs/',
      '/cs/404/',
      '/cs/song-book/',
    ])),
  );
});

self.addEventListener('fetch', (e) => {
  console.log(e.request.url);
  e.respondWith(
    caches.match(e.request).then((response) => response || fetch(e.request)),
  );
});
