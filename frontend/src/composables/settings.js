import { ref, watch } from 'vue'
import { isPhone } from '@/composables/glBreakpoint'

export const mobileSidebarOpened = ref(false)

// GrowUp (2027 E2): reaktivně z glBreakpoint (přepne se i při změně šířky)
export const isMobileView = isPhone

export const showSettings = ref(false)

export const disableSettingModalOutsideClick = ref(false)

export const activeSettingsPage = ref('')

// GrowUp (zadání 2027 E3): Nastavení je stránka s adresou /settings/<sekce>.
// showSettings / activeSettingsPage zůstávají jako most pro kód, který ho otevírá po staru:
// nastavení showSettings = true přejde na trasu Settings (sekce podle activeSettingsPage) a příznak se hned vrátí.
const SLUGS = {
  Profil: 'profil',
  Předvolby: 'predvolby',
  'Uživatelé a tarif': 'uzivatele',
  'Pravidla přiřazení': 'prirazeni',
  'Reakční doba': 'reakcni-doba',
  'E-mail': 'email',
  'Šablony e-mailů': 'sablony',
  'Zdroje zakázek': 'zdroje',
  'Šablony projektů': 'sablony-projektu',
  Doplňky: 'doplnky',
  Obecné: 'obecne',
  Značka: 'znacka',
  // staré (anglické) názvy stránek, jak je posílá starší kód
  Profile: 'profil',
  Preferences: 'predvolby',
  Users: 'uzivatele',
  Tarif: 'uzivatele',
  'Invite User': 'uzivatele',
  'Sales Hierarchy': 'uzivatele',
  Templates: 'sablony',
  'Assignment Rules': 'prirazeni',
  General: 'obecne',
  Dashboard: 'obecne',
  Defaults: 'obecne',
  'Home Actions': 'obecne',
  Brand: 'znacka',
}

export function settingsSlug(label) {
  if (!label) return ''
  if (SLUGS[label]) return SLUGS[label]
  return String(label)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export async function openSettings(page) {
  const { default: router } = await import('@/router')
  const section = settingsSlug(page)
  router.push(section ? { name: 'Settings', params: { section } } : { name: 'Settings' })
}

watch(showSettings, (open) => {
  if (!open) return
  showSettings.value = false
  openSettings(activeSettingsPage.value)
})
