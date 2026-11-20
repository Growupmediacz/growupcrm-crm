// GrowUp (zadání 2027 E1): odeslání e-mailu se zdržením a „Vrátit zpět“.
// E-mail odesílá vždy CRM (growupcrm.mail_threads.send → Frappe make se send_after); během zdržení ho
// cancel_send smaže z fronty a text se vrátí do konceptu. Zdržení je nastavitelné (0 = vypnuto, výchozí 10 s).
import { mailApi, loadMailSettings, undoToast, restoredDraft } from '@/composables/glMail'
import { writeDraft } from '@/composables/glDraft'
import { toast } from 'frappe-ui'

let hideTimer = null

function showUndo(text, seconds, onUndo) {
  clearTimeout(hideTimer)
  Object.assign(undoToast, { visible: true, text, seconds, startedAt: Date.now(), busy: false, onUndo, key: undoToast.key + 1 })
  hideTimer = setTimeout(() => (undoToast.visible = false), seconds * 1000)
}
export function hideUndo() {
  clearTimeout(hideTimer)
  undoToast.visible = false
}

/**
 * @param payload  parametry pro mail_threads.send (bez delay)
 * @param opts.draftKey  klíč konceptu, kam se text vrátí po „Vrátit zpět“
 * @param opts.snapshot  obsah konceptu v okamžiku odeslání
 * @param opts.recipientLabel  komu (pro text toastu)
 */
export async function sendWithUndo(payload, { draftKey, snapshot, recipientLabel = '' } = {}) {
  const settings = await loadMailSettings()
  const delay = Number(settings.undo_seconds) || 0
  const result = await mailApi('send', { ...payload, delay })
  const who = recipientLabel ? ' ' + recipientLabel : ''
  if (delay > 0) {
    showUndo(__('Odesílá se{0} · za {1} s', [who, delay]), delay, async () => {
      undoToast.busy = true
      try {
        const r = await mailApi('cancel_send', { name: result.name })
        hideUndo()
        if (r.cancelled) {
          const key = { ...draftKey, reference_doctype: result.reference_doctype, reference_name: result.reference_name }
          await writeDraft(key, snapshot)
          restoredDraft.value = { key, at: Date.now() }
          toast.success(__('Odeslání vráceno, text je zpět v konceptu'))
        } else if (r.reason === 'not_found') {
          toast.error(__('E-mail už ve frontě není'))
        } else {
          toast.error(__('E-mail už odešel, nejde vrátit'))
        }
      } catch (e) {
        undoToast.busy = false
        toast.error(e?.messages?.[0] || __('Vrácení se nepovedlo'))
      }
    })
  } else {
    toast.success(__('E-mail odeslán{0}', [who]))
  }
  return result
}
