const CACHE_NAME = "parking-system-v1"
const urlsToCache = [
  "/",
  "/login",
  "/manager",
  "/director",
  "/images/logo.png",
  "/images/background.webp",
  "/manifest.json",
]

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(urlsToCache)))
})

self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      if (response) {
        return response
      }
      return fetch(event.request)
    }),
  )
})
