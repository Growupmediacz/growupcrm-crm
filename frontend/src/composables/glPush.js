// GrowUp (zadání 2027 E2): odběr Web Push (growupcrm.push). Nic se nezapíná samo: odběr vznikne až po
// klepnutí na „Zapnout oznámení v tomto zařízení“ a i pak server posílá jen typy, které si uživatel zapne.
import { call } from 'frappe-ui'
import { computed, ref } from 'vue'
import { isIOS, isStandalone, registerSW, swRegistration } from '@/composables/glPwa'

export const pushSupported =
  typeof window !== 'undefined' && 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window
export const permission = ref(pushSupported ? Notification.permission : 'unsupported')
export const subscribed = ref(false)
export const serverKey = ref(null)

// na iOS jde push jen z aplikace přidané na plochu (iOS 16.4+)
export const needsInstallFirst = computed(() => isIOS && !isStandalone.value)

function b64urlToBytes(s) {
  const pad = '='.repeat((4 - (s.length % 4)) % 4)
  const raw = atob((s + pad).replace(/-/g, '+').replace(/_/g, '/'))
  return Uint8Array.from(raw, (c) => c.charCodeAt(0))
}

async function registration() {
  return swRegistration.value || (await registerSW())
}

export async function loadPushConfig() {
  const cfg = await call('growupcrm.push.get_config')
  serverKey.value = cfg?.public_key || null
  if (pushSupported) {
    const reg = await registration()
    const sub = reg && (await reg.pushManager.getSubscription())
    subscribed.value = Boolean(sub)
    // odběr existuje v prohlížeči: připomenout ho serveru (mohl se obnovit nebo smazat po chybách doručení)
    if (sub && serverKey.value) await call('growupcrm.push.subscribe', { subscription: JSON.stringify(sub.toJSON()), user_agent: navigator.userAgent.slice(0, 140) }).catch(() => {})
  }
  return cfg
}

export async function enablePush() {
  if (!pushSupported) throw new Error(__('Tento prohlížeč oznámení nepodporuje.'))
  if (!serverKey.value) throw new Error(__('Oznámení nejsou na serveru nastavena.'))
  const result = await Notification.requestPermission()
  permission.value = result
  if (result !== 'granted') throw new Error(__('Oznámení jsou v prohlížeči zakázaná. Povolte je v nastavení prohlížeče.'))
  const reg = await registration()
  if (!reg) throw new Error(__('Service worker se nepodařilo spustit.'))
  await navigator.serviceWorker.ready
  let sub = await reg.pushManager.getSubscription()
  if (!sub) {
    sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: b64urlToBytes(serverKey.value) })
  }
  await call('growupcrm.push.subscribe', { subscription: JSON.stringify(sub.toJSON()), user_agent: navigator.userAgent.slice(0, 140) })
  subscribed.value = true
}

export async function disablePush() {
  const reg = await registration()
  const sub = reg && (await reg.pushManager.getSubscription())
  if (sub) {
    await call('growupcrm.push.unsubscribe', { endpoint: sub.endpoint }).catch(() => {})
    await sub.unsubscribe().catch(() => {})
  }
  subscribed.value = false
}

// Při startu aplikace: má-li prohlížeč odběr a povolení, připomene ho serveru (obnova po vypršení,
// smazání po chybách doručení). Nic nového nezakládá a bez povolení nedělá nic.
export async function syncSubscription() {
  if (!pushSupported || Notification.permission !== 'granted') return
  try {
    const reg = await registration()
    const sub = reg && (await reg.pushManager.getSubscription())
    if (sub) await call('growupcrm.push.subscribe', { subscription: JSON.stringify(sub.toJSON()), user_agent: navigator.userAgent.slice(0, 140) })
  } catch (e) {
    // bez oznámení se dá dál pracovat
  }
}
