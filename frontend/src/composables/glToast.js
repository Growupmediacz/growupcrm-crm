// GrowUp (design systém 2. kolo): chyba uložení jako oznámení s akcí „Znovu“ („Nepodařilo se uložit · Znovu“)
import { toast } from 'frappe-ui'

export function saveFailed(error, retry, what = __('Nepodařilo se uložit')) {
  const detail = error?.messages?.[0] || error?.message
  toast.error(detail ? `${what}: ${detail}` : what, retry ? { duration: 10000, action: { label: __('Znovu'), onClick: retry } } : undefined)
}
