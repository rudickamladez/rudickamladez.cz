const CACHE_NAME = 'song-book-v1.0';
const CONTENT_FILE = '/api/_fullData';
const APPSHELL_FILES = [
  '/',
  '/cs/',
  '/cs/about/',
  '/cs/contact/',
  '/cs/song-book/',
  '/en/',
  '/en/about/',
  '/en/contact/',
  '/en/song-book/',
  '/images/IMG_4726.webp',
  '/images/erik-mclean-bGWVhFY1gH0-unsplash.webp',
  '/css/style.min.css',
  '/js/darkmode.min.js',
];


self.addEventListener('install', function (e) {
  console.log('Installing...');
  e.waitUntil(
    caches.open(CACHE_NAME).then(function (cache) {
      console.log(' Caching all: app shell and content');
      // return cache.addAll([...APPSHELL_FILES, CONTENT_FILE]);
      return cache.addAll([...APPSHELL_FILES]);
    })
  );
});


self.addEventListener('activate', function (event) {
  // Delete deprecated cache
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName != CACHE_NAME) {
            console.log('Deleting deprecated cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});


self.addEventListener('fetch', function (event) {
  console.log('Handling fetch event for', event.request.url);

  // Catch api requests
  const url = new URL(event.request.url);
  if (url.pathname.startsWith('/api')) {
    const [className, groupName, weekName] = url.pathname.split('/').slice(2)
      .filter(v => v);
    event.respondWith(caches.open(CACHE_NAME).then(async (cache) => {
      return cache.match(CONTENT_FILE).then((response) => {

        if (response) {
          console.log(' Sending API response from cache');

          return new Promise(async (resolve, reject) => {
            response = await response.json();

            // Content update
            (async () =>
              fetch(CONTENT_FILE).then(async (_response) => {
                if (_response.status == 200 || _response.status == 304) {
                  const data = await _response.json();
                  console.log('Checking if content should be updated...');
                  if (JSON.stringify(data) != JSON.stringify(response)) {
                    console.log('Updating content...');
                    cache.put(new Request(CONTENT_FILE), _response)
                      .then(async () => {
                        console.log('Updated content');
                        if (event.clientId) {
                          const client = await clients.get(event.clientId);
                          if (client) client.postMessage('CONTENT_UPDATED');
                        }
                      });
                  } else {
                    console.log('Content is already up-to-date.');
                  }
                }
              }).catch(e => console.warn('Content update failed:', e))
            )();

            // Try to get data from cache
            try {
              if (weekName) {
                return resolve(new Response(
                  JSON.stringify(
                    response[className][groupName][weekName]
                  )
                ));
              }
              if (groupName) {
                return resolve(new Response(
                  JSON.stringify({
                    weeks: Object.keys(response[className][groupName]),
                    className, groupName
                  })
                ));
              }
              if (className) {
                return resolve(new Response(
                  JSON.stringify({
                    groups: Object.keys(response[className]), className
                  })
                ));
              }
              reject();
            } catch (e) {
              reject(e);
            }
          });

        } else {
          console.log(' API not cached');
        }
      });
    }));
    return;
  }

  // Other files
  event.respondWith(caches.open(CACHE_NAME).then(async (cache) => {
    if (!navigator.onLine) {
      console.log('  Not online, trying to serve cache');
      return returnFromCache();
    }

    return fetch(event.request.clone()).then((response) => {
      console.log('  Recieved response for %s from network',
        event.request.url);

      if (response.status == 200 || response.status == 304) {
        console.log('  Caching the response to', event.request.url);
        cache.put(event.request, response.clone());
      } else {
        console.log('  Not caching failed response to', event.request.url);
      }

      return response;
    }).catch(async (error) => {
      console.error('  Error in fetch handler:', error);
      console.log('  Trying to serve cache');

      return returnFromCache(cache, event);
    });


    async function returnFromCache() {
      return cache.match(event.request).then((response) => {
        if (response) {
          console.log(' Found response in cache');

          return response;
        } else {
          console.error('  Not found in cache');
        }
      });
    }
  }));
});