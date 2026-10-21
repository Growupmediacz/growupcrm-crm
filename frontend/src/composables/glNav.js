// GrowUp (design 3. kolo): navigace na jednom místě.
// Úroveň 1 = skupina (levá lišta na desktopu, spodní lišta na mobilu),
// úroveň 2 = stránky skupiny (spodní lišta na desktopu, záložky pod nadpisem na mobilu).
import { agencyEnabled, agentEnabled, analyticsEnabled, outreachEnabled } from '@/composables/agency'
import { useLeadsOnlyMode, LEADS_ONLY_HIDDEN_ROUTES } from '@/composables/leadsOnlyMode'
import { useStorage } from '@vueuse/core'
import { computed } from 'vue'
import { useRoute } from 'vue-router'

// routes = trasy, které patří ke stránce (seznam, detail, podstránky)
const PAGES = [
  { key: 'Today', label: 'Dnes', icon: 'home', routes: ['Today', 'Dashboard'] },
  { key: 'Leads', label: 'Zakázky', icon: 'brief', routes: ['Leads', 'Lead', 'Deals', 'Deal'] },
  { key: 'Organizations', label: 'Firmy', icon: 'building', routes: ['Organizations', 'Organization'] },
  { key: 'ContactsCards', label: 'Kontakty', icon: 'users', routes: ['ContactsCards', 'Contacts', 'Contact'] },
  {
    key: 'Outreach',
    label: 'Outreach',
    icon: 'send',
    routes: ['Outreach', 'OutreachReview', 'OutreachCampaign', 'OutreachTemplate'],
    condition: () => outreachEnabled.value,
  },
  { key: 'Agent', label: 'Agent', icon: 'sparkles', routes: ['Agent'], condition: () => agentEnabled.value },
  { key: 'Tasks', label: 'Úkoly', icon: 'check', routes: ['Tasks'] },
  { key: 'Calendar', label: 'Kalendář', icon: 'cal', routes: ['Calendar'] },
  { key: 'Notes', label: 'Zápisy', icon: 'doc', routes: ['Notes'] },
  { key: 'Call Logs', label: 'Hovory', icon: 'phone', routes: ['Call Logs'] },
  { key: 'Clients', label: 'Klienti', icon: 'star', routes: ['Clients'], condition: () => agencyEnabled.value },
  {
    key: 'Projects',
    label: 'Projekty',
    icon: 'folder',
    routes: ['Projects', 'Project', 'ProjectTemplates'],
    condition: () => agencyEnabled.value,
  },
  { key: 'Plans', label: 'Plány', icon: 'target', routes: ['Plans'], condition: () => agencyEnabled.value },
  { key: 'Analytics', label: 'Analytika', icon: 'chart', routes: ['Analytics'], condition: () => analyticsEnabled.value },
]

const GROUPS = [
  { key: 'today', label: 'Dnes', icon: 'grid', pages: ['Today', 'Leads', 'Organizations', 'ContactsCards', 'Outreach', 'Agent'] },
  { key: 'sales', label: 'Prodej', icon: 'brief', pages: ['Leads', 'Organizations', 'ContactsCards', 'Outreach', 'Agent'] },
  { key: 'work', label: 'Práce', icon: 'check', pages: ['Tasks', 'Calendar', 'Notes', 'Call Logs'] },
  { key: 'delivery', label: 'Dodání', icon: 'folder', pages: ['Clients', 'Projects', 'Plans', 'Analytics'] },
]

// naposledy navštívená stránka každé skupiny (klik na skupinu tam vrátí)
const lastPage = useStorage('gl-nav-last', {})

export function useGlNav() {
  const route = useRoute()
  const leadsOnlyMode = useLeadsOnlyMode()

  const pages = computed(() =>
    PAGES.filter((p) => {
      if (leadsOnlyMode.value && LEADS_ONLY_HIDDEN_ROUTES.includes(p.key)) return false
      return p.condition ? p.condition() : true
    }),
  )
  const pageByKey = (key) => pages.value.find((p) => p.key === key)

  const groups = computed(() =>
    GROUPS.map((g) => ({ ...g, pages: g.pages.map(pageByKey).filter(Boolean) })).filter((g) => g.pages.length),
  )

  const activePage = computed(() => pages.value.find((p) => p.routes.includes(route.name)) || null)

  // Dnes je samostatná skupina, ostatní stránky patří do první skupiny (mimo Dnes), která je obsahuje
  const activeGroup = computed(() => {
    const page = activePage.value
    if (!page) return null
    if (page.key === 'Today') return groups.value.find((g) => g.key === 'today') || null
    return groups.value.find((g) => g.key !== 'today' && g.pages.some((p) => p.key === page.key)) || null
  })

  function groupTarget(group) {
    const remembered = lastPage.value[group.key]
    const page = group.pages.find((p) => p.key === remembered) || group.pages[0]
    return { name: page.key }
  }

  function remember() {
    const g = activeGroup.value
    const p = activePage.value
    if (g && p && g.key !== 'today') lastPage.value = { ...lastPage.value, [g.key]: p.key }
  }

  return { pages, groups, activePage, activeGroup, groupTarget, remember }
}
