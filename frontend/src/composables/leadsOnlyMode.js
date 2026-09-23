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

// Grafy dashboardu nad Zakázkami. Počítá je appka growupcrm (growupcrm.dashboard),
// total_leads a leads_by_source jsou nativní grafy CRM nad Leady.
export const LEADS_ONLY_CHARTS = {
  number: [
    { label: 'Počet zakázek', value: 'total_leads' },
    { label: 'Rozpracované zakázky', value: 'open_orders' },
    { label: 'Vyhrané zakázky', value: 'won_orders' },
    { label: 'Hodnota vyhraných zakázek', value: 'won_orders_value' },
    { label: 'Úspěšnost', value: 'order_win_rate' },
  ],
  axis: [
    { label: 'Zakázky podle stavu', value: 'orders_by_status' },
    { label: 'Hodnota zakázek podle stavu', value: 'orders_value_by_status' },
    { label: 'Konverze mezi fázemi', value: 'orders_funnel' },
    { label: 'Důvody prohry', value: 'lost_order_reasons' },
  ],
  donut: [{ label: 'Zakázky podle zdroje', value: 'leads_by_source' }],
}
