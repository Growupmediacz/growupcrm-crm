<template>
  <!-- GrowUp (design 3. kolo, 07 a 26–34): Nastavení jako celá stránka místo okna.
       Desktop: vlevo skupiny sekcí, vpravo obsah. Mobil: seznam sekcí, po výběru obsah se „‹ Nastavení“. -->
  <div class="flex h-full min-h-0 flex-col gap-5">
    <div class="flex shrink-0 items-end justify-between gap-4 px-1 pt-1">
      <div>
        <button v-if="isMobileView && mobileOpen" class="mb-1 text-[15px] font-semibold text-[var(--accent-600)]" @click="mobileOpen = false">‹ {{ __('Nastavení') }}</button>
        <!-- mobil v sekci: nadpis nese karta sekce, nahoře jen „‹ Nastavení“ (jinak by byl nadpis dvakrát) -->
        <h1 v-if="!(isMobileView && mobileOpen)" class="text-[32px] font-bold leading-tight tracking-[-0.025em] text-ink-gray-9 md:text-[40px]">{{ __('Nastavení') }}</h1>
        <div v-if="!(isMobileView && mobileOpen)" class="text-[15px] text-ink-gray-5">{{ subtitle }}</div>
      </div>
      <button v-if="!isMobileView" class="gl-round flex size-10 items-center justify-center rounded-full" :aria-label="__('Zavřít nastavení')" :title="__('Zavřít')" @click="close">
        <span class="lucide-x size-4" aria-hidden="true" />
      </button>
    </div>
    <div class="flex min-h-0 flex-1 gap-5">
      <nav
        v-if="!isMobileView || !mobileOpen"
        ref="sidebarContainer"
        class="gl-card flex shrink-0 flex-col overflow-y-auto p-3"
        :class="isMobileView ? 'w-full' : 'w-[280px]'"
      >
        <template v-for="tab in tabs" :key="tab.label">
          <div class="px-3 pb-1.5 pt-3 text-[12px] font-bold uppercase tracking-[0.06em] text-ink-gray-5">{{ tab.label }}</div>
          <button
            v-for="item in tab.items"
            :key="item.label"
            :data-page="item.label"
            class="flex min-h-[44px] w-full items-center gap-3 rounded-[14px] px-3 text-left text-[15px] transition"
            :class="!isMobileView && activeTab?.label == item.label ? 'bg-white font-semibold text-[var(--accent-700)] shadow-[0_4px_14px_-8px_rgba(40,50,120,.3)]' : 'text-ink-gray-8 hover:bg-white/60'"
            @click="openPage(item.label)"
          >
            <Icon :icon="item.icon" class="size-[18px] shrink-0" :class="!isMobileView && activeTab?.label == item.label ? 'text-[var(--accent-600)]' : 'text-ink-gray-6'" />
            <span class="flex-1 truncate">{{ item.label }}</span>
            <span v-if="isMobileView" class="lucide-chevron-right size-4 text-ink-gray-4" aria-hidden="true" />
          </button>
        </template>
      </nav>
      <div v-if="!isMobileView || mobileOpen" class="gl3-settings gl-card flex min-h-0 min-w-0 flex-1 flex-col overflow-y-auto">
        <component :is="activeTab.component" v-if="activeTab" v-bind="activeTab.props || {}" />
      </div>
    </div>
  </div>
</template>
<script setup>
import AgencySettings from '@/components/Settings/AgencySettings.vue'
import GlEmailSettings from '@/components/Settings/GlEmailSettings.vue'
import GlLeadSources from '@/components/Settings/GlLeadSources.vue'
import GlAddons from '@/components/Settings/GlAddons.vue'
import GlResponseSettings from '@/components/Settings/GlResponseSettings.vue'
import PlanSettings from '@/components/Settings/PlanSettings.vue'
import { agencyEnabled } from '@/composables/agency'
import { useLeadsOnlyMode } from '@/composables/leadsOnlyMode'

const leadsOnlyMode = useLeadsOnlyMode()
import LucideLayoutDashboard from '~icons/lucide/layout-dashboard'
import LucideNetwork from '~icons/lucide/network'
import MonitorCogIcon from '~icons/lucide/monitor-cog'
import LucideTextCursorInput from '~icons/lucide/text-cursor-input'
import SlidersIcon from '@/components/Icons/SlidersIcon.vue'
import SparkleIcon from '@/components/Icons/SparkleIcon.vue'
import WhatsAppIcon from '@/components/Icons/WhatsAppIcon.vue'
import ERPNextIcon from '@/components/Icons/ERPNextIcon.vue'
import PhoneIcon from '@/components/Icons/PhoneIcon.vue'
import Email2Icon from '@/components/Icons/Email2Icon.vue'
import EmailTemplateIcon from '@/components/Icons/EmailTemplateIcon.vue'
import SettingsIcon from '@/components/Icons/SettingsIcon.vue'
import SettingsIcon2 from '@/components/Icons/SettingsIcon2.vue'
import Users from '@/components/Settings/Users.vue'
import Hierarchy from '@/components/Settings/Hierarchy/Hierarchy.vue'
import InviteUserPage from '@/components/Settings/InviteUserPage.vue'
import ProfilePage from '@/components/Settings/Profile/ProfilePage.vue'
import PreferencesSettings from '@/components/Settings/PreferencesSettings.vue'
import WhatsAppSettings from '@/components/Settings/WhatsAppSettings.vue'
import ERPNextSettings from '@/components/Settings/ERPNextSettings.vue'
import DefaultsSettings from '@/components/Settings/DefaultsSettings.vue'
import BrandSettings from '@/components/Settings/BrandSettings.vue'
import HomeActions from '@/components/Settings/HomeActions.vue'
import GeneralSettings from '@/components/Settings/GeneralSettings.vue'
import DashboardSettings from '@/components/Settings/DashboardSettings.vue'
import EmailTemplatePage from '@/components/Settings/EmailTemplate/EmailTemplatePage.vue'
import TelephonyPage from '@/components/Settings/Telephony/TelephonyPage.vue'
import Icon from '@/components/Icon.vue'
import { usersStore } from '@/stores/users'
import { showSettings, activeSettingsPage, isMobileView } from '@/composables/settings'
import { isWhatsappInstalled } from '@/composables/whatsapp'
import { Avatar, createResource } from 'frappe-ui'
import GlSettingsGroup from '@/components/Settings/GlSettingsGroup.vue'
import { getSettings } from '@/stores/settings'
import { ref, markRaw, computed, watch, h, nextTick, defineComponent } from 'vue'
import AssignmentRulePage from './AssignmentRules/AssignmentRulePage.vue'
import ShieldCheck from '~icons/lucide/shield-check'
import SlaConfig from './Sla/SlaConfig.vue'

const { isManager, getUser } = usersStore()

const user = computed(() => getUser() || {})
const { brand } = getSettings()
// tarif do podtitulku („GrowUpMedia · tarif Agentura“)
const plan = createResource({ url: 'growupcrm.plans.seat_usage', auto: isManager() })

const tabs = computed(() => {
  // GrowUp (design 2. kolo, C6): skupiny Účet · Tým · Komunikace · Práce · Systém.
  // Popisky položek zůstávají (podle nich se otevírá deep link, např. Profile, Users).
  const item = {
    profile: {
      label: __('Profile'),
      icon: () => h(Avatar, { size: 'xs', label: user.value.full_name, image: user.value.user_image }),
      component: markRaw(ProfilePage),
    },
    preferences: { label: __('Preferences'), icon: SlidersIcon, component: markRaw(PreferencesSettings) },
    users: { label: __('Users'), icon: 'user', component: markRaw(Users), condition: () => isManager() },
    plan: {
      label: __('Tarif'),
      icon: 'credit-card',
      component: markRaw(PlanSettings),
      condition: () => isManager(),
    },
    invite: { label: __('Invite User'), icon: 'user-plus', component: markRaw(InviteUserPage), condition: () => isManager() },
    hierarchy: { label: __('Sales Hierarchy'), icon: LucideNetwork, component: markRaw(Hierarchy), condition: () => isManager() },
    // GrowUp: Můj e-mail, Schránka (Outreach) a Účty sloučené do jedné stránky E-mail
    email: { label: __('E-mail'), icon: Email2Icon, component: markRaw(GlEmailSettings) },
    templates: { label: __('Templates'), icon: EmailTemplateIcon, component: markRaw(EmailTemplatePage) },
    projectTemplates: {
      label: __('Šablony projektů'),
      icon: 'folder',
      component: markRaw(defineComponent({ render: () => h(AgencySettings, { kind: 'templates' }) })),
      condition: () => agencyEnabled.value,
    },
    assignment: {
      label: __('Assignment Rules'),
      icon: markRaw(h(SettingsIcon2, { class: 'rotate-90' })),
      component: markRaw(AssignmentRulePage),
    },
    sla: { label: __('SLA Policies'), icon: markRaw(h(ShieldCheck)), component: markRaw(SlaConfig), condition: () => !leadsOnlyMode.value },
    // GrowUp: Formuláře a Synchronizace zakázek v jedné sekci s přehledem napojení
    sources: { label: __('Zdroje zakázek'), component: markRaw(GlLeadSources), icon: markRaw(LucideTextCursorInput) },
    addons: { label: __('Doplňky'), component: markRaw(GlAddons), icon: SparkleIcon },
    response: { label: __('Reakční doba'), component: markRaw(GlResponseSettings), icon: 'clock' },
    general: { label: __('General'), component: markRaw(GeneralSettings), icon: SettingsIcon },
    dashboard: { label: __('Dashboard'), component: markRaw(DashboardSettings), icon: LucideLayoutDashboard },
    defaults: { label: __('Defaults'), component: markRaw(DefaultsSettings), icon: MonitorCogIcon },
    brand: { label: __('Brand'), icon: SparkleIcon, component: markRaw(BrandSettings) },
    home: { label: __('Home Actions'), component: markRaw(HomeActions), icon: 'house' },
    telephony: { label: __('Telephony'), icon: PhoneIcon, component: markRaw(TelephonyPage), condition: () => !leadsOnlyMode.value },
    whatsapp: { label: __('WhatsApp'), icon: WhatsAppIcon, component: markRaw(WhatsAppSettings), condition: () => isWhatsappInstalled.value && isManager() },
    erp: { label: __('ERPNext'), icon: ERPNextIcon, component: markRaw(ERPNextSettings), condition: () => isManager() && !leadsOnlyMode.value },
  }
  // design 3. kolo: 13 sekcí; sloučené sekce mají záložky (GlSettingsGroup)
  const group = (items, initial = 0) =>
    markRaw(defineComponent({ render: () => h(GlSettingsGroup, { items: items.filter((i) => !i.condition || i.condition()), initial }) }))
  const team = {
    label: __('Uživatelé a tarif'),
    icon: 'users',
    component: group(
      [
        { label: __('Uživatelé'), component: markRaw(Users) },
        { label: __('Tarif'), component: markRaw(PlanSettings) },
        { label: __('Pozvat uživatele'), component: markRaw(InviteUserPage) },
        { label: __('Obchodní hierarchie'), component: markRaw(Hierarchy) },
      ],
      teamSub.value,
    ),
    condition: () => isManager(),
  }
  const general = {
    label: __('Obecné'),
    icon: SettingsIcon,
    component: group(
      [
        { label: __('Obecné'), component: markRaw(GeneralSettings) },
        { label: __('Přehled'), component: markRaw(DashboardSettings) },
        { label: __('Výchozí hodnoty'), component: markRaw(DefaultsSettings) },
        { label: __('Akce domů'), component: markRaw(HomeActions) },
      ],
      generalSub.value,
    ),
    condition: () => isManager(),
  }
  item.profile.label = __('Profil')
  item.preferences.label = __('Předvolby')
  item.assignment.label = __('Pravidla přiřazení')
  item.templates.label = __('Šablony e-mailů')
  item.brand.label = __('Značka')
  let _tabs = [
    { label: __('Účet'), items: [item.profile, item.preferences] },
    { label: __('Tým'), items: [team, item.assignment, item.response], condition: () => isManager() },
    { label: __('Komunikace'), items: [item.email, item.templates] },
    { label: __('Práce'), items: [item.sources, item.projectTemplates, item.addons, item.sla], condition: () => isManager() },
    { label: __('Systém'), items: [general, item.brand, item.telephony, item.whatsapp, item.erp], condition: () => isManager() },
  ]

  return _tabs.filter((tab) => {
    if (tab.condition && !tab.condition()) return false
    if (tab.items) {
      tab.items = tab.items.filter((item) => {
        if (item.condition && !item.condition()) return false
        return true
      })
    }
    return true
  })
})

// staré názvy stránek (odkazy z kódu CRM i growup) → nová sekce a případně záložka
const teamSub = ref(0)
const generalSub = ref(0)
const ALIASES = {
  Profile: ['Profil'], [__('Profile')]: ['Profil'],
  Preferences: ['Předvolby'], [__('Preferences')]: ['Předvolby'],
  Users: ['Uživatelé a tarif', 0], [__('Users')]: ['Uživatelé a tarif', 0],
  Tarif: ['Uživatelé a tarif', 1], 'Invite User': ['Uživatelé a tarif', 2], [__('Invite User')]: ['Uživatelé a tarif', 2],
  'Sales Hierarchy': ['Uživatelé a tarif', 3], [__('Sales Hierarchy')]: ['Uživatelé a tarif', 3],
  Templates: ['Šablony e-mailů'], [__('Templates')]: ['Šablony e-mailů'],
  'Assignment Rules': ['Pravidla přiřazení'], [__('Assignment Rules')]: ['Pravidla přiřazení'],
  General: ['Obecné', 0], [__('General')]: ['Obecné', 0], Dashboard: ['Obecné', 1], Defaults: ['Obecné', 2], 'Home Actions': ['Obecné', 3],
  Brand: ['Značka'], [__('Brand')]: ['Značka'],
}

const allItems = () => tabs.value.flatMap((tab) => tab.items)
const activeTab = ref(allItems()[0])
const sidebarContainer = ref(null)
const mobileOpen = ref(false)

const subtitle = computed(() => [brand.name || 'GrowUpCRM', planLabel.value].filter(Boolean).join(' · '))
const planLabel = computed(() => (plan.data?.name ? __('tarif {0}', [plan.data.name]) : ''))

function setActiveTab(tabName) {
  const [label, sub] = ALIASES[tabName] || [tabName]
  if (label === 'Uživatelé a tarif') teamSub.value = sub || 0
  if (label === 'Obecné') generalSub.value = sub || 0
  activeTab.value = (label && allItems().find((t) => t.label === label)) || allItems()[0]
}

function openPage(label) {
  activeSettingsPage.value = label
  setActiveTab(label)
  mobileOpen.value = true
}

function close() {
  showSettings.value = false
}

// Scroll the settings sidebar so the active page is in view (e.g. when opened
// deep-linked from onboarding, so the user sees where they landed).
function scrollActiveIntoView() {
  nextTick(() => {
    const el = sidebarContainer.value?.querySelector(`[data-page="${activeTab.value?.label}"]`)
    el?.scrollIntoView({ block: 'nearest' })
  })
}

watch(
  activeSettingsPage,
  (activePage) => {
    setActiveTab(activePage)
    if (activePage) mobileOpen.value = true
    scrollActiveIntoView()
  },
  { immediate: true },
)
</script>
