// GrowUp: osobní schránka Google (growupcrm.gmail) – stav pro okno Nová zpráva a návrat z přihlášení Googlem
import { activeSettingsPage, showSettings } from '@/composables/settings'
import { createResource, toast } from 'frappe-ui'

export const mailboxStatus = createResource({ url: 'growupcrm.gmail.get_status', cache: 'gl-mailbox-status' })

export function openMailboxSettings() {
  activeSettingsPage.value = __('E-mail')
  showSettings.value = true
}

// Google po přihlášení vrátí uživatele na ?mailbox=connected: potvrdit a otevřít Nastavení → E-mail
export function handleMailboxReturn() {
  const url = new URL(window.location.href)
  if (url.searchParams.get('mailbox') !== 'connected') return
  url.searchParams.delete('mailbox')
  window.history.replaceState({}, '', url.pathname + url.search + url.hash)
  toast.success(__('Schránka je připojená. Odpovědi klientů se budou objevovat u zakázek.'))
  mailboxStatus.reload()
  openMailboxSettings()
}
