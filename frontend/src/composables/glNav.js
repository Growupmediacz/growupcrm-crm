// GrowUp (design 3. kolo): navigace na jednom místě.
// Úroveň 1 = skupina (levá lišta na desktopu, spodní lišta na mobilu),
// úroveň 2 = stránky skupiny (pilulky v hlavičce stránky: GlPageTabs na desktopu, GlSectionPills na mobilu; zadání 2027 E3).
import { agencyEnabled, agentEnabled, analyticsEnabled, outreachEnabled } from '@/composables/agency'
import { useLeadsOnlyMode, LEADS_ONLY_HIDDEN_ROUTES } from '@/composables/leadsOnlyMode'
import { usersStore } from '@/stores/users'
import { useStorage } from '@vueuse/core'

// vedoucí obchodu / správce (usersStore se volá až při vyhodnocení, ne při načtení modulu)
const isManager = () => usersStore().isManager()
import { computed } from 'vue'
import { useRoute } from 'vue-router'

// routes = trasy, které patří ke stránce (seznam, detail, podstránky)
// ikony: názvy Lucide (zadání 2027 kolo 2 V1, podle návrhů design/navrhy a KOMPONENTY.md)
const PAGES = [
  { key: 'Today', label: 'Dnes', icon: 'layout-dashboard', routes: ['Today', 'Dashboard'] },
  { key: 'Leads', label: 'Zakázky', icon: 'kanban', routes: ['Leads', 'Lead', 'Deals', 'Deal'] },
  { key: 'Organizations', label: 'Firmy', icon: 'building', routes: ['Organizations', 'Organization'] },
  { key: 'ContactsCards', label: 'Kontakty', icon: 'users', routes: ['ContactsCards', 'Contacts', 'Contact'] },
  {
    key: 'Outreach',
    label: 'Outreach',
    icon: 'send',
    routes: ['Outreach', 'OutreachReview', 'OutreachCampaign', 'OutreachTemplate', 'WeekApprove'],
    condition: () => outreachEnabled.value,
  },
  { key: 'Agent', label: 'Agent', icon: 'bot', routes: ['Agent', 'AgentLog'], condition: () => agentEnabled.value },
  { key: 'Tasks', label: 'Úkoly', icon: 'circle-check', routes: ['Tasks'] },
  { key: 'Calendar', label: 'Kalendář', icon: 'cal', routes: ['Calendar'] },
  { key: 'Notes', label: 'Zápisy', icon: 'notebook-pen', routes: ['Notes'] },
  { key: 'Call Logs', label: 'Hovory', icon: 'phone', routes: ['Call Logs'] },
  { key: 'Clients', label: 'Klienti', icon: 'star', routes: ['Clients'], condition: () => agencyEnabled.value },
  {
    key: 'Projects',
    label: 'Projekty',
    icon: 'folder',
    routes: ['Projects', 'Project', 'ProjectTemplates'],
    condition: () => agencyEnabled.value,
  },
  { key: 'Webs', label: 'Weby', icon: 'globe', routes: ['Webs'], condition: () => agencyEnabled.value },
  { key: 'Plans', label: 'Plány', icon: 'target', routes: ['Plans'], condition: () => agencyEnabled.value },
  // zadání 2027 E3 (G): faktury jen pro vedoucího obchodu / správce (obchodník je nevidí ani v navigaci; API je chrání samo)
  { key: 'Invoices', label: 'Faktury', icon: 'file-text', routes: ['Invoices'], condition: () => agencyEnabled.value && isManager() },
  { key: 'Analytics', label: 'Analytika', icon: 'chart', routes: ['Analytics'], condition: () => analyticsEnabled.value },
]

const GROUPS = [
  { key: 'today', label: 'Dnes', icon: 'layout-dashboard', pages: ['Today', 'Leads', 'Organizations', 'ContactsCards', 'Outreach', 'Agent'] },
  { key: 'sales', label: 'Prodej', icon: 'handshake', pages: ['Leads', 'Organizations', 'ContactsCards', 'Outreach', 'Agent'] },
  { key: 'work', label: 'Práce', icon: 'circle-check', pages: ['Tasks', 'Calendar', 'Notes', 'Call Logs'] },
  { key: 'delivery', label: 'Dodání', icon: 'archive', pages: ['Clients', 'Projects', 'Webs', 'Plans', 'Invoices', 'Analytics'] },
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
