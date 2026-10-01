// GrowUp: agenturní moduly (Klienti, Projekty, …) jsou zapnuté jen na site GrowUpMedia.
// Jedno volání za běh aplikace; bez přepínače menu ani stránky modulů nejsou vidět.
import { createResource } from 'frappe-ui'
import { computed } from 'vue'

const modules = createResource({
  url: 'growupcrm.clients.get_modules',
  cache: 'growupcrm-modules',
  auto: true,
})

export const agencyEnabled = computed(() => Boolean(modules.data?.agency))
export const analyticsEnabled = computed(() => Boolean(modules.data?.analytics))
