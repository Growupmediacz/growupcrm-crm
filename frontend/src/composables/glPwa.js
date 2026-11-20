// GrowUp (zadání 2027 E2): instalace na plochu a service worker.
// SW: growupcrm.pwa.service_worker (statický soubor gl-sw.js) se scope /crm – ukládá jen statické soubory
// sestavení, nikdy stránku /crm ani data z API (podrobně v hlavičce frontend/public/gl-sw.js).
import { computed, ref } from 'vue'

export const SW_URL = '/api/method/growupcrm.pwa.service_worker'
export const SW_SCOPE = '/crm'

export const swRegistration = ref(null)
const deferredPrompt = ref(null)
export const isStandalone = ref(
  typeof window !== 'undefined' &&
    (window.matchMedia?.('(display-mode: standalone)').matches || window.navigator.standalone === true),
)

const ua = typeof navigator === 'undefined' ? '' : navigator.userAgent
// iPadOS se hlásí jako Mac s dotykem
export const isIOS = /iPhone|iPad|iPod/.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1)
export const canPromptInstall = computed(() => Boolean(deferredPrompt.value))

export async function promptInstall() {
  const ev = deferredPrompt.value
  if (!ev) return false
  deferredPrompt.value = null
  ev.prompt()
  const choice = await ev.userChoice.catch(() => null)
  return choice?.outcome === 'accepted'
}

let started = false
export function initPwa() {
  if (started || typeof window === 'undefined') return
  started = true
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault()
    deferredPrompt.value = e
  })
  window.addEventListener('appinstalled', () => {
    deferredPrompt.value = null
    isStandalone.value = true
  })
  if (!('serviceWorker' in navigator) || import.meta.env.DEV) return
  window.addEventListener('load', registerSW, { once: true })
  if (document.readyState === 'complete') registerSW()
}

let registering = null
export function registerSW() {
  if (registering) return registering
  registering = (async () => {
    try {
      // úklid: starý SW vite-plugin-pwa se scope /assets/crm/frontend/ (neřídil /crm, jen ukládal sestavení)
      const regs = await navigator.serviceWorker.getRegistrations()
      await Promise.all(
        regs
          .filter((r) => new URL(r.scope).pathname.startsWith('/assets/'))
          .map((r) => r.unregister()),
      )
      const reg = await navigator.serviceWorker.register(SW_URL, { scope: SW_SCOPE, updateViaCache: 'none' })
      swRegistration.value = reg
      // odběr oznámení připomenout serveru (jen když už existuje a je povolený)
      import('@/composables/glPush').then((m) => m.syncSubscription())
      // nová verze se ptá při každém návratu do aplikace (telefon ji drží otevřenou dny)
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') reg.update().catch(() => {})
      })
      return reg
    } catch (e) {
      console.warn('GrowUpCRM: service worker se nepodařilo zaregistrovat', e)
      registering = null
      return null
    }
  })()
  return registering
}
