// GrowUp (zadání 2027 E1): e-maily u zakázky – volání backendu growupcrm.mail_threads a drobné pomůcky.
import { call, createResource } from 'frappe-ui'
import { reactive, ref } from 'vue'

const M = 'growupcrm.mail_threads.'
export const mailApi = (method, params = {}) => call(M + method, params)

// nastavení editoru (podpis, zdržení odeslání) – jednou za načtení stránky
export const mailSettings = createResource({ url: M + 'composer_settings' })
export async function loadMailSettings() {
  if (!mailSettings.data && !mailSettings.loading) await mailSettings.fetch()
  else if (mailSettings.loading) await mailSettings.promise
  return mailSettings.data || { signature: '', undo_seconds: 10 }
}
/** Podpis jako HTML pro editor (crm.api.get_user_signature vrací text s \n, případně v <p>). */
export function signatureHtml(sig) {
  if (!sig) return ''
  const body = sig.replace(/^(\s*<br\s*\/?>)+/i, '').replace(/\n/g, '<br>')
  return /^\s*<(p|div|table)\b/i.test(body) ? body : `<p>${body}</p>`
}
export async function setUndoSeconds(seconds) {
  await mailApi('set_undo_seconds', { seconds })
  if (mailSettings.data) mailSettings.data.undo_seconds = seconds
}

export const STATE_LABEL = {
  us: { label: 'Čeká na nás', cls: 'gl-mstate-us' },
  them: { label: 'Čeká na ně', cls: 'gl-mstate-them' },
  done: { label: 'Vyřízeno', cls: 'gl-mstate-done' },
}

export const initials = (s) =>
  (s || '?')
    .replace(/<.*>/, '')
    .split(/[\s@.]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('') || '?'

const DAYS = ['ne', 'po', 'út', 'st', 'čt', 'pá', 'so']
function toDate(v) {
  if (!v) return null
  return v instanceof Date ? v : new Date(String(v).replace(' ', 'T'))
}
const hm = (d) => `${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}`
/** „dnes 9:41“, „včera 19:22“, „po 16. 11. 8:05“, starší „16. 11. 2025“ */
export function mailTime(v, withTime = true) {
  const d = toDate(v)
  if (!d || isNaN(d)) return ''
  const now = new Date()
  const day = (x) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime()
  const diff = Math.round((day(now) - day(d)) / 86400000)
  const t = withTime ? ' ' + hm(d) : ''
  if (diff === 0) return __('dnes') + t
  if (diff === 1) return __('včera') + t
  if (diff < 7 && diff > 0) return `${__(DAYS[d.getDay()])} ${d.getDate()}. ${d.getMonth() + 1}.${t}`
  if (d.getFullYear() === now.getFullYear()) return `${d.getDate()}. ${d.getMonth() + 1}.${t}`
  return `${d.getDate()}. ${d.getMonth() + 1}. ${d.getFullYear()}`
}

export function fileSize(n) {
  n = Number(n) || 0
  if (n >= 1048576) return `${(n / 1048576).toFixed(1).replace('.', ',')} MB`
  if (n >= 1024) return `${Math.round(n / 1024)} kB`
  return n ? `${n} B` : ''
}

/** Text bez značek (prázdný e-mail, náhled). */
export function htmlText(html) {
  if (!html) return ''
  const spaced = html.replace(/<br\s*\/?>|<\/(p|div|li|h\d)>/gi, (m) => m + ' ')
  return (new DOMParser().parseFromString(spaced, 'text/html').body.textContent || '').replace(/\s+/g, ' ').trim()
}

/** Místo k doplnění v návrhu agenta („DOPLNIT CENU“). */
export const PLACEHOLDER_RE = /DOPLNIT(?:\s+[A-ZÁČĎÉĚÍŇÓŘŠŤÚŮÝŽ]+)*/g
export const countPlaceholders = (html) => (htmlText(html).match(PLACEHOLDER_RE) || []).length

/** Předmět odpovědi: „Re: …“ jen jednou. */
export function replySubject(subject, forward = false) {
  const s = (subject || '').replace(/^\s*((re|fw|fwd|odp|aw|wg|sv|vs|tr)\s*(\[\d+\])?\s*:\s*)+/i, '')
  return (forward ? 'Fwd: ' : 'Re: ') + s
}

/** Citace předchozí zprávy, kterou editor připojí až při odeslání (v editoru ji nevidíte). */
export function quoteBlock(msg) {
  if (!msg) return ''
  const who = msg.sender_name ? `${msg.sender_name} &lt;${msg.sender}&gt;` : msg.sender
  return `<br><div class="gmail_quote"><div class="gmail_attr">${__('Dne {0} {1} napsal(a):', [mailTime(msg.at), who])}</div><blockquote class="gmail_quote" style="margin:0 0 0 .8ex;border-left:1px solid #ccc;padding-left:1ex">${msg.html || ''}</blockquote></div>`
}

// po „Vrátit zpět“ se koncept obnoví a otevřená konverzace si editor znovu otevře
export const restoredDraft = ref(null)

// stav toastu „Vrátit zpět“ (jediný v aplikaci, vykresluje GlUndoToast v GlobalModals)
export const undoToast = reactive({ visible: false, text: '', seconds: 0, startedAt: 0, busy: false, onUndo: null, key: 0 })

/** Výchozí hodnoty editoru pro odpověď / odpověď všem / přeposlání zprávy ve vlákně. */
export function replyDraft(thread, { mode = 'reply', message = null } = {}) {
  const msgs = thread?.messages || []
  const human = msgs.filter((m) => !m.automated)
  const m = message || [...human].reverse().find((x) => x.sent_or_received === 'Received') || human[human.length - 1]
  if (!m) return null
  const emails = (list) => (list || []).map((r) => (typeof r === 'string' ? r : r.email)).filter(Boolean)
  const me = (mailSettings.data?.email || '').toLowerCase()
  const to = m.sent_or_received === 'Received' ? [m.sender] : emails(m.recipients)
  const cc = mode === 'all' ? [...emails(m.recipients), ...emails(m.cc)].filter((e) => e.toLowerCase() !== me && !to.includes(e)) : []
  const forward = mode === 'forward'
  return {
    title: forward ? __('Přeposlat') : mode === 'all' ? __('Odpovědět všem') : '',
    defaults: {
      to: forward ? [] : to,
      cc,
      subject: replySubject(m.subject || thread?.subject, forward),
      in_reply_to: forward ? '' : m.name,
      html: forward ? `<p></p>${quoteBlock(m)}` : '',
    },
    quote: forward ? null : m,
  }
}
