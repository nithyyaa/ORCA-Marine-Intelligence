/* ORCA Offline Service Worker */

const VERSION = "orca-offline-v2";

const STATIC_CACHE = `${VERSION}-static`;
const PAGE_CACHE = `${VERSION}-pages`;
const MARINE_CACHE = `${VERSION}-marine`;
const TILE_CACHE = `${VERSION}-tiles`;

const MARINE_API_PREFIXES = [
  "/api/safety",
  "/api/weather",
  "/api/ocean",
  "/api/tide",
  "/api/pfz",
  "/api/pfz/nearby",
  "/api/hazard",
  "/api/geofence",
  "/api/map-forecast",
  "/api/alerts",
];

const TILE_HOSTS = new Set([
  "tile.openstreetmap.org",
  "a.tile.openstreetmap.org",
  "b.tile.openstreetmap.org",
  "c.tile.openstreetmap.org",
]);

/* ----------------------------- */
/* INSTALL                       */
/* ----------------------------- */

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(STATIC_CACHE)
      .then((cache) => cache.add("/"))
      .catch(() => {
        // Do not fail installation if the root page
        // cannot be cached.
      })
  );

  self.skipWaiting();
});

/* ----------------------------- */
/* ACTIVATE                      */
/* ----------------------------- */

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter(
              (key) =>
                key.startsWith("orca-offline-") &&
                ![
                  STATIC_CACHE,
                  PAGE_CACHE,
                  MARINE_CACHE,
                  TILE_CACHE,
                ].includes(key)
            )
            .map((key) => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  );
});

/* ----------------------------- */
/* HELPERS                       */
/* ----------------------------- */

function isMarineApi(url) {
  return (
    url.origin === self.location.origin &&
    MARINE_API_PREFIXES.some((prefix) =>
      url.pathname.startsWith(prefix)
    )
  );
}

function isTile(url) {
  return (
    TILE_HOSTS.has(url.hostname) &&
    url.pathname.endsWith(".png")
  );
}

function isStaticAsset(request, url) {
  if (url.origin !== self.location.origin) {
    return false;
  }

  if (
    url.pathname.startsWith("/api/")
  ) {
    return false;
  }

  return (
    url.pathname.startsWith("/_next/static/") ||
    url.pathname.startsWith("/favicon") ||
    url.pathname.startsWith("/icons/") ||
    ["style", "script", "font", "image"].includes(
      request.destination
    )
  );
}

async function networkWithTimeout(
  request,
  timeoutMs = 3500
) {
  return Promise.race([
    fetch(request),

    new Promise((_, reject) =>
      setTimeout(
        () =>
          reject(
            new Error(
              "ORCA network timeout"
            )
          ),
        timeoutMs
      )
    ),
  ]);
}

/* ----------------------------- */
/* MARINE API CACHE              */
/* ----------------------------- */

async function handleMarineApi(request) {
  const cache =
    await caches.open(MARINE_CACHE);

  try {
    const response =
      await networkWithTimeout(
        request,
        3500
      );

    if (
      response &&
      response.ok
    ) {
      await cache.put(
        request,
        response.clone()
      );

      return response;
    }

    throw new Error(
      "Marine API request failed"
    );
  } catch {
    const cached =
      await cache.match(request);

    if (cached) {
      const headers =
        new Headers(
          cached.headers
        );

      headers.set(
        "X-ORCA-Offline",
        "true"
      );

      headers.set(
        "X-ORCA-Data-Mode",
        "offline-cache"
      );

      return new Response(
        cached.body,
        {
          status: cached.status,
          statusText:
            cached.statusText,
          headers,
        }
      );
    }

    return new Response(
      JSON.stringify({
        success: false,
        offline: true,
        error:
          "No cached marine data is available for this request.",
      }),
      {
        status: 503,
        headers: {
          "Content-Type":
            "application/json",
          "X-ORCA-Offline":
            "true",
        },
      }
    );
  }
}

/* ----------------------------- */
/* PAGE NAVIGATION                */
/* ----------------------------- */

async function handleNavigation(
  request
) {
  const cache =
    await caches.open(PAGE_CACHE);

  try {
    const response =
      await networkWithTimeout(
        request,
        4500
      );

    if (
      response &&
      response.ok
    ) {
      await cache.put(
        request,
        response.clone()
      );

      return response;
    }

    throw new Error(
      "Navigation failed"
    );
  } catch {
    const cached =
      await cache.match(request);

    if (cached) {
      return cached;
    }

    const root =
      await caches.match("/");

    if (root) {
      return root;
    }

    return new Response(
      `<!doctype html>
<html>
<head>
<meta charset="utf-8">
<title>ORCA Offline</title>
<style>
body {
  font-family: system-ui, sans-serif;
  padding: 2rem;
}
</style>
</head>

<body>

<h1>ORCA is offline</h1>

<p>
No cached ORCA page is available yet.
</p>

<p>
Reconnect once and open ORCA so the
application can prepare its offline cache.
</p>

</body>
</html>`,
      {
        status: 503,
        headers: {
          "Content-Type":
            "text/html; charset=utf-8",
        },
      }
    );
  }
}

/* ----------------------------- */
/* STATIC ASSETS                  */
/* ----------------------------- */

async function handleStaticAsset(
  request
) {
  const cache =
    await caches.open(STATIC_CACHE);

  const cached =
    await cache.match(request);

  /*
   * Cache-first:
   * If CSS/JS/font/image already exists,
   * use it immediately.
   */
  if (cached) {
    return cached;
  }

  /*
   * Otherwise try the network.
   */
  try {
    const response =
      await networkWithTimeout(
        request,
        5000
      );

    if (
      response &&
      response.ok
    ) {
      await cache.put(
        request,
        response.clone()
      );
    }

    return response;
  } catch {
    /*
     * IMPORTANT:
     * Never allow an offline asset request
     * to throw an uncaught promise.
     */

    return new Response(
      "",
      {
        status: 504,
        statusText:
          "ORCA asset unavailable offline",
      }
    );
  }
}

/* ----------------------------- */
/* MAP TILES                      */
/* ----------------------------- */

async function handleTile(request) {
  const cache =
    await caches.open(TILE_CACHE);

  const cached =
    await cache.match(request);

  if (cached) {
    return cached;
  }

  try {
    const response =
      await networkWithTimeout(
        request,
        5000
      );

    if (
      response &&
      response.ok
    ) {
      await cache.put(
        request,
        response.clone()
      );
    }

    return response;
  } catch {
    return new Response(
      "",
      {
        status: 504,
        statusText:
          "Map tile unavailable offline",
      }
    );
  }
}

/* ----------------------------- */
/* FETCH                          */
/* ----------------------------- */

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

    const url =
      new URL(request.url);

    /* Marine APIs */
    if (isMarineApi(url)) {
      event.respondWith(
        handleMarineApi(request)
      );

      return;
    }

    /* OpenStreetMap tiles */
    if (isTile(url)) {
      event.respondWith(
        handleTile(request)
      );

      return;
    }

    /* Page navigation */
    if (
      request.mode === "navigate"
    ) {
      event.respondWith(
        handleNavigation(request)
      );

      return;
    }

    /* CSS / JS / fonts / images / Next assets */
    if (
      isStaticAsset(
        request,
        url
      )
    ) {
      event.respondWith(
        handleStaticAsset(request)
      );

      return;
    }
  }
);

/* ----------------------------- */
/* SERVICE WORKER MESSAGES        */
/* ----------------------------- */

self.addEventListener(
  "message",
  (event) => {
    if (
      event.data?.type ===
      "ORCA_SKIP_WAITING"
    ) {
      self.skipWaiting();
    }
  }
);