const CACHE_NAME =
  "daily-progress-v1";

const APP_ASSETS = [
  "./",
  "./index.html",
  "./css/style.css",
  "./js/app.js",
  "./js/schedule.js",
  "./manifest.webmanifest",
  "./icons/icon-192.svg",
  "./icons/icon-512.svg"
];

const TAILWIND_CDN =
  "https://cdn.tailwindcss.com";


/*
 * ================================
 * INSTALL
 * ================================
 */

self.addEventListener(
  "install",
  (event) => {

    event.waitUntil(
      (async () => {

        const cache =
          await caches.open(
            CACHE_NAME
          );

        await cache.addAll(
          APP_ASSETS
        );


        /*
         * Cache Tailwind CDN
         *
         * Menggunakan no-cors agar
         * response CDN dapat disimpan
         * sebagai opaque response.
         */

        try {

          const response =
            await fetch(
              TAILWIND_CDN,
              {
                mode: "no-cors"
              }
            );

          await cache.put(
            TAILWIND_CDN,
            response
          );

        } catch (error) {

          console.warn(
            "Tailwind CDN gagal dicache:",
            error
          );
        }


        await self.skipWaiting();
      })()
    );
  }
);



/*
 * ================================
 * ACTIVATE
 * ================================
 */

self.addEventListener(
  "activate",
  (event) => {

    event.waitUntil(
      (async () => {

        const keys =
          await caches.keys();

        await Promise.all(
          keys
            .filter(
              (key) =>
                key !== CACHE_NAME
            )
            .map(
              (key) =>
                caches.delete(key)
            )
        );

        await self.clients.claim();
      })()
    );
  }
);



/*
 * ================================
 * FETCH
 * ================================
 */

self.addEventListener(
  "fetch",
  (event) => {

    const request =
      event.request;


    if (
      request.method !== "GET"
    ) {
      return;
    }


    event.respondWith(
      (async () => {

        const cached =
          await caches.match(
            request
          );

        if (cached) {
          return cached;
        }


        try {

          const response =
            await fetch(
              request
            );

          return response;

        } catch (error) {

          return new Response(
            "Offline",
            {
              status: 503,
              statusText:
                "Service Unavailable",
              headers: {
                "Content-Type":
                  "text/plain; charset=utf-8"
              }
            }
          );
        }
      })()
    );
  }
);