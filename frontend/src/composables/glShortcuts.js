// GrowUp (zadání 2027 E3): klávesové zkratky aplikace. Posloupnost „g“ a písmeno přejde na stránku, „?“ otevře přehled.
// ⌘K řeší GlSearch; s ⌘/Ctrl/Alt se nic nespouští. Ignoruje se v polích a když je otevřený dialog.
import GlShortcutsHelp from '@/components/GlShortcutsHelp.vue'
import { outreachEnabled } from '@/composables/agency'
import { useGlNav } from '@/composables/glNav'
import { createApp, h, onBeforeUnmount, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'

// písmeno po „g“ → klíč stránky z glNav (nebo speciální trasa)
export const GL_SHORTCUTS = [
  { key: 'd', label: 'Dnes', page: 'Today' },
  { key: 'z', label: 'Zakázky', page: 'Leads' },
  { key: 'f', label: 'Firmy', page: 'Organizations' },
  { key: 'k', label: 'Kontakty', page: 'ContactsCards' },
  { key: 'o', label: 'Outreach', page: 'Outreach' },
  { key: 't', label: 'Týden ke schválení', route: 'WeekApprove' },
  { key: 'u', label: 'Úkoly', page: 'Tasks' },
  { key: 'n', label: 'Nastavení', route: 'Settings' },
]

const helpOpen = ref(false)
let helpApp = null
let helpHost = null

function showHelp() {
  if (!helpApp) {
    helpHost = document.createElement('div')
    document.body.appendChild(helpHost)
    helpApp = createApp({ render: () => h(GlShortcutsHelp, { open: helpOpen.value, onClose: () => (helpOpen.value = false) }) })
    helpApp.mount(helpHost)
  }
  helpOpen.value = true
}

function destroyHelp() {
  helpOpen.value = false
  helpApp?.unmount()
  helpHost?.remove()
  helpApp = null
  helpHost = null
}

function isTyping(el) {
  if (!el) return false
  const tag = el.tagName
  return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || el.isContentEditable || !!el.closest?.('[contenteditable]:not([contenteditable="false"])')
}

export function useGlShortcuts() {
  const router = useRouter()
  const { pages } = useGlNav()
  let waiting = false
  let timer = null

  const reset = () => {
    waiting = false
    clearTimeout(timer)
  }

  function go(s) {
    if (s.page) {
      if (pages.value.some((p) => p.key === s.page)) router.push({ name: s.page })
    } else if (s.route === 'WeekApprove') {
      if (outreachEnabled.value) router.push({ name: 'WeekApprove' })
    } else if (s.route) {
      router.push({ name: s.route })
    }
  }

  function onKey(e) {
    if (e.metaKey || e.ctrlKey || e.altKey || e.repeat || e.isComposing) return
    if (isTyping(e.target) || isTyping(document.activeElement)) return reset()
    if (document.querySelector('[role="dialog"], [aria-modal="true"]')) return reset()
    if (e.key === '?') {
      e.preventDefault()
      reset()
      return showHelp()
    }
    if (waiting) {
      reset()
      const s = GL_SHORTCUTS.find((x) => x.key === e.key.toLowerCase())
      if (s) {
        e.preventDefault()
        go(s)
      }
      return
    }
    if (e.key === 'g' || e.key === 'G') {
      waiting = true
      timer = setTimeout(reset, 1500)
    }
  }

  onMounted(() => window.addEventListener('keydown', onKey))
  onBeforeUnmount(() => {
    window.removeEventListener('keydown', onKey)
    reset()
    destroyHelp()
  })
}
