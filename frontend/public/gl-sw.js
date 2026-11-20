/* GrowUpCRM – service worker (zadání 2027 E2).
 *
 * Servíruje ho growupcrm.pwa.service_worker s hlavičkou Service-Worker-Allowed, registruje se se scope /crm,
 * takže řídí aplikaci (dřív seděl pod /assets/crm/frontend/ a neřídil nic).
 *
 * Co ukládá: JEN statické soubory sestavení s otiskem v názvu (/assets/crm/frontend/assets/*).
 * Ty jsou neměnné a neobsahují žádná data CRM.
 * Co NEukládá nikdy: stránku /crm (obsahuje přihlášení, CSRF token a údaje uživatele), /api/*, /files,
 * /private/*, cokoli s jinou metodou než GET a cokoli z cizí domény. Ty jdou vždy rovnou na síť.
 * Bez připojení se místo /crm ukáže jednoduchá statická stránka „Jste offline“ (vložená níže, bez dat).
 *
 * Aktualizace: nová verze se hned aktivuje (skipWaiting + clients.claim) a smaže staré cache. Protože HTML
 * aplikace se z cache nikdy nebere, nemůže se zaseknout stará verze; po nasazení stačí obnovit stránku.
 */
const VERSION = 'gl-sw-2'
const STATIC_CACHE = `${VERSION}-static`
const STATIC_MAX = 400

// jen soubory s otiskem v názvu (neměnné); ikony a manifest bez otisku jdou vždy na síť
const STATIC_PREFIXES = ['/assets/crm/frontend/assets/']

const OFFLINE_HTML = `<!doctype html><html lang="cs"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="theme-color" content="#EEEAFF"><title>GrowUpCRM – bez připojení</title>
<style>body{margin:0;min-height:100vh;display:flex;align-items:center;justify-content:center;background:#EEEAFF;
font:16px/1.5 Inter,system-ui,-apple-system,sans-serif;color:#0e1330;padding:24px;box-sizing:border-box;text-align:center}
h1{font-size:22px;margin:0 0 8px}p{margin:0 0 20px;color:#4A5170}
button{min-height:48px;padding:0 24px;border:0;border-radius:24px;background:#5b5bf6;color:#fff;font:600 16px Inter,system-ui,sans-serif}</style>
</head><body><main><h1>Jste offline</h1><p>GrowUpCRM potřebuje připojení k internetu. Data se v telefonu neukládají.</p>
<button onclick="location.reload()">Zkusit znovu</button></main></body></html>`

self.addEventListener('install', () => self.skipWaiting())

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys()
      // staré cache této i předchozí verze (workbox z vite-plugin-pwa) pryč
      await Promise.all(keys.filter((k) => k !== STATIC_CACHE).map((k) => caches.delete(k)))
      await self.clients.claim()
    })(),
  )
})

function isStatic(url) {
  return url.origin === self.location.origin && STATIC_PREFIXES.some((p) => url.pathname.startsWith(p))
}

async function trim(cache) {
  const keys = await cache.keys()
  for (let i = 0; i < keys.length - STATIC_MAX; i++) await cache.delete(keys[i])
}

async function cacheFirst(request) {
  const cache = await caches.open(STATIC_CACHE)
  const hit = await cache.match(request)
  if (hit) return hit
  const response = await fetch(request)
  // jen úplné odpovědi, žádné přesměrování na přihlášení ani chyby
  if (response.ok && response.status === 200 && response.type === 'basic' && !response.redirected) {
    cache.put(request, response.clone()).then(() => trim(cache))
  }
  return response
}

async function networkOnlyNavigation(request) {
  try {
    return await fetch(request)
  } catch (e) {
    return new Response(OFFLINE_HTML, { headers: { 'Content-Type': 'text/html; charset=utf-8' } })
  }
}

self.addEventListener('fetch', (event) => {
  const { request } = event
  if (request.method !== 'GET') return
  const url = new URL(request.url)
  if (url.origin !== self.location.origin) return
  if (request.mode === 'navigate') {
    event.respondWith(networkOnlyNavigation(request))
    return
  }
  if (isStatic(url)) event.respondWith(cacheFirst(request))
  // vše ostatní (API, soubory, socket.io) prohlížeč vyřídí sám, bez service workeru
})

/* ---- Web Push (growupcrm.push) ----
 * Obsah: {title, body, url, tag, silent}. Bez textu e-mailu. Výchozí stav na serveru: nic se neposílá. */
self.addEventListener('push', (event) => {
  let data = {}
  try {
    data = event.data ? event.data.json() : {}
  } catch (e) {
    data = { body: event.data ? event.data.text() : '' }
  }
  const url = typeof data.url === 'string' && data.url.startsWith('/crm') ? data.url : '/crm/today'
  const options = {
    body: data.body || '',
    icon: '/assets/crm/manifest/icon-192.png',
    badge: '/assets/crm/manifest/favicon-32.png',
    tag: data.tag || undefined,
    renotify: Boolean(data.tag),
    silent: data.silent !== false,
    data: { url },
  }
  event.waitUntil(self.registration.showNotification(data.title || 'GrowUpCRM', options))
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const target = new URL(event.notification.data?.url || '/crm/today', self.location.origin)
  if (target.origin !== self.location.origin) return
  event.waitUntil(
    (async () => {
      const all = await self.clients.matchAll({ type: 'window', includeUncontrolled: true })
      const client = all.find((c) => new URL(c.url).pathname.startsWith('/crm'))
      if (client) {
        try {
          await client.focus()
          if ('navigate' in client) return await client.navigate(target.href)
          return
        } catch (e) {
          // klient není řízený tímto SW (navigate selže) → otevřít nové okno
        }
      }
      return self.clients.openWindow(target.href)
    })(),
  )
})

// prohlížeč obnovil odběr (vypršení): aplikace ho při dalším spuštění znovu pošle serveru (glPush.syncSubscription)
self.addEventListener('pushsubscriptionchange', () => {})
