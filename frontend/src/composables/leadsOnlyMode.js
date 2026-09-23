// GrowUpCRM: režim „jen Zakázky“. Klienti pracují jen s Leady (v UI Zakázky),
// proto skrýváme Deals, Contacts, Organizations, převod na Deal a nepoužívané
// integrace v nastavení. Skrýváme i onboarding Frappe CRM (kroky převodu na Deal,
// odkazy na nápovědu Frappe). Přepínač je FCRM Settings.leads_only_mode, pole
// přidává appka growupcrm. Bez něj se CRM chová jako upstream.
import { computed } from 'vue'
import { getSettings } from '@/stores/settings'

export const LEADS_ONLY_HIDDEN_ROUTES = ['Deals', 'Contacts', 'Organizations']

export function useLeadsOnlyMode() {
  const { settings } = getSettings()
  return computed(() => Boolean(settings.value?.leads_only_mode))
}
