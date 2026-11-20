import { ref } from 'vue'
import { isPhone } from '@/composables/glBreakpoint'

export const mobileSidebarOpened = ref(false)

// GrowUp (2027 E2): reaktivně z glBreakpoint (přepne se i při změně šířky)
export const isMobileView = isPhone

export const showSettings = ref(false)

export const disableSettingModalOutsideClick = ref(false)

export const activeSettingsPage = ref('')
