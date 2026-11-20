// GrowUp (zadání 2027 E1): automatický koncept e-mailu.
// Ukládá se hned do localStorage (přežije obnovení stránky i výpadek sítě) a s krátkým zpožděním na server
// (growupcrm.mail_threads.save_draft), aby šel rozepsat na počítači a dopsat na telefonu.
import { mailApi, htmlText } from '@/composables/glMail'
import { reactive, ref } from 'vue'

const EMPTY = () => ({ to: [], cc: [], bcc: [], subject: '', html: '', attachments: [], in_reply_to: '', signature_added: false })

function localKey(k) {
  const user = window.frappe?.session?.user || (document.cookie.match(/user_id=([^;]+)/) || [])[1] || ''
  return `gl-mail-draft:${decodeURIComponent(user)}:${k.reference_doctype || ''}:${k.reference_name || k.local_id || ''}:${k.thread_id || 'nova'}`
}
function readLocal(k) {
  try {
    return JSON.parse(localStorage.getItem(localKey(k)) || 'null')
  } catch {
    return null
  }
}

/** Je v konceptu něco napsaného (kromě podpisu)? */
export function hasUserText(draft, signatureHtml = '') {
  const text = htmlText(draft.html)
  const sig = htmlText(signatureHtml)
  const rest = sig ? text.replace(sig, '').trim() : text
  return Boolean(rest) || Boolean(draft.attachments?.length)
}

/**
 * @param {() => {reference_doctype, reference_name, thread_id, local_id}} getKey  bez reference_name jen lokálně
 */
export function useDraft(getKey) {
  const draft = reactive(EMPTY())
  const savedAt = ref(null) // čas posledního uložení (pro „koncept uložen 9:44“)
  const saving = ref(false)
  let timer = null
  let serverOk = true

  const server = () => Boolean(getKey().reference_name)

  async function load(defaults = {}) {
    const k = getKey()
    Object.assign(draft, EMPTY(), defaults)
    const local = readLocal(k)
    let remote = null
    if (server()) {
      try {
        remote = await mailApi('get_draft', { reference_doctype: k.reference_doctype, reference_name: k.reference_name, thread_id: k.thread_id || '' })
      } catch {
        serverOk = false
      }
    }
    const remoteTs = remote?.modified ? new Date(String(remote.modified).replace(' ', 'T')).getTime() : 0
    const pick = local && (!remote || (local.updated || 0) >= remoteTs) ? local : remote
    if (pick) {
      Object.assign(draft, {
        to: pick.to || defaults.to || [],
        cc: pick.cc || [],
        bcc: pick.bcc || [],
        subject: pick.subject ?? defaults.subject ?? '',
        html: pick.html || '',
        attachments: pick.attachments || [],
        in_reply_to: pick.in_reply_to || defaults.in_reply_to || '',
        signature_added: Boolean(pick.signature_added),
      })
      savedAt.value = pick.updated ? new Date(pick.updated) : remoteTs ? new Date(remoteTs) : null
    }
    return Boolean(pick)
  }

  function snapshot() {
    return JSON.parse(JSON.stringify(draft))
  }

  function save() {
    const k = getKey()
    const data = { ...snapshot(), updated: Date.now() }
    try {
      localStorage.setItem(localKey(k), JSON.stringify(data))
    } catch {
      /* plné úložiště: zůstane server */
    }
    savedAt.value = new Date()
    clearTimeout(timer)
    if (!server()) return
    timer = setTimeout(async () => {
      saving.value = true
      try {
        await mailApi('save_draft', { reference_doctype: k.reference_doctype, reference_name: k.reference_name, thread_id: k.thread_id || '', draft: data })
        serverOk = true
      } catch {
        serverOk = false
      } finally {
        saving.value = false
      }
    }, 1200)
  }

  async function discard(keepFields = false) {
    const k = getKey()
    clearTimeout(timer)
    localStorage.removeItem(localKey(k))
    if (!keepFields) Object.assign(draft, EMPTY())
    savedAt.value = null
    if (server()) {
      try {
        await mailApi('discard_draft', { reference_doctype: k.reference_doctype, reference_name: k.reference_name, thread_id: k.thread_id || '' })
      } catch {
        /* koncept na serveru zůstane, při dalším otevření se přepíše */
      }
    }
  }

  /** Po odeslání: lokální kopii smazat (server ji smaže sám v send). */
  function forgetLocal() {
    clearTimeout(timer)
    localStorage.removeItem(localKey(getKey()))
  }

  return { draft, savedAt, saving, load, save, discard, forgetLocal, snapshot, isServerOk: () => serverOk }
}

/** Zapsat koncept zvenku (obnova po „Vrátit zpět“). */
export async function writeDraft(key, data) {
  try {
    localStorage.setItem(localKey(key), JSON.stringify({ ...data, updated: Date.now() }))
  } catch {
    /* nic */
  }
  if (key.reference_name) {
    try {
      await mailApi('save_draft', { reference_doctype: key.reference_doctype, reference_name: key.reference_name, thread_id: key.thread_id || '', draft: data })
    } catch {
      /* zůstane lokální kopie */
    }
  }
}
