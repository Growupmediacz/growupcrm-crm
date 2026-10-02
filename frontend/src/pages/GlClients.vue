<template>
  <!-- GrowUp: modul Klienti (design „Klienti“). Data: growupcrm.clients.get_overview -->
  <LayoutHeader>
    <template #left-header>
      <span class="text-lg-medium text-ink-gray-9">{{ __('Klienti') }}</span>
    </template>
    <template #right-header>
      <div class="gl-seg hidden sm:inline-flex">
        <button class="gl-seg-btn !px-3" :class="layout === 'cards' && 'gl-seg-on'" :aria-label="__('Karty')" @click="layout = 'cards'">
          <GlIcon name="grid" :size="16" />
        </button>
        <button class="gl-seg-btn !px-3" :class="layout === 'list' && 'gl-seg-on'" :aria-label="__('Seznam')" @click="layout = 'list'">
          <GlIcon name="list" :size="16" />
        </button>
      </div>
      <Button v-if="data?.is_manager" variant="solid" iconLeft="plus" @click="showNew = true">
        <span class="hidden sm:inline">{{ __('Nový klient') }}</span>
      </Button>
    </template>
  </LayoutHeader>

  <GlForbidden v-if="overview.error && isForbidden(overview.error)" :message="errorText" />
  <div v-else-if="overview.error" class="px-3 md:px-2"><GlErrorBanner :title="__('Klienty se nepodařilo načíst')" :text="errorText" @retry="overview.reload()" /></div>
  <div v-else-if="!overview.data" class="px-3 md:px-2"><GlSkeleton :rows="5" /></div>
  <div v-else class="flex flex-col gap-4 overflow-y-auto px-3 pb-6 md:px-2">
    <div class="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
      <div v-for="k in cards" :key="k.label" class="gl-card flex flex-col gap-1.5 p-4 md:p-5">
        <div class="flex items-center gap-2 text-[14px] text-ink-gray-7">
          {{ k.label }}
          <span v-if="k.badge" class="rounded-full bg-[rgba(79,70,229,.12)] px-2 py-0.5 text-[12px] font-bold text-[#3b30b8]">{{ k.badge }}</span>
        </div>
        <div class="num text-[30px] font-bold leading-tight tracking-tight text-ink-gray-9 md:text-[38px]">{{ k.value }}</div>
        <div class="truncate text-[13px] text-ink-gray-5">{{ k.sub }}</div>
      </div>
    </div>

    <div v-if="data && !data.clients.length" class="gl-card px-6 py-12 text-center">
      <div class="text-[17px] font-semibold text-ink-gray-9">{{ __('Zatím žádní klienti') }}</div>
      <div class="mt-1 text-[14px] text-ink-gray-5">{{ __('Klient vznikne výhrou zakázky, nebo ho přidejte tlačítkem Nový klient.') }}</div>
    </div>

    <!-- karty -->
    <div v-if="layout === 'cards'" class="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      <div v-for="c in data?.clients || []" :key="c.name" class="gl-card gl-lift flex flex-col gap-4 p-5">
        <div class="flex items-start gap-3">
          <img v-if="c.organization_logo" :src="c.organization_logo" class="size-12 shrink-0 rounded-2xl bg-white object-contain p-1.5" />
          <span v-else class="flex size-12 shrink-0 items-center justify-center rounded-2xl text-[15px] font-bold" :class="tone(c.organization_name)">
            {{ initials(c.organization_name) }}
          </span>
          <router-link :to="{ name: 'Organization', params: { organizationId: c.name } }" class="min-w-0 flex-1">
            <div class="truncate text-[17px] font-bold text-ink-gray-9 hover:text-[#4f46e5]">{{ c.organization_name || c.name }}</div>
            <div class="text-[13px] text-ink-gray-5">{{ sinceLabel(c.client_since) }}</div>
          </router-link>
          <Dropdown :options="menu(c)" placement="right">
            <button class="flex size-8 items-center justify-center rounded-full text-ink-gray-5 hover:bg-white/70" :aria-label="__('Další akce')">
              <GlIcon name="more" :size="18" />
            </button>
          </Dropdown>
        </div>
        <div class="flex items-center gap-2 text-[14px] font-semibold text-ink-gray-9">
          <span class="size-2 shrink-0 rounded-full" :style="{ background: HEALTH_COLORS[c.health] }" />
          <span class="truncate">{{ __(c.health) }}<template v-if="c.health_note"> – {{ c.health_note }}</template></span>
        </div>
        <div class="grid grid-cols-2 gap-2">
          <div class="rounded-2xl bg-[rgba(110,120,200,.075)] px-3 py-2.5">
            <div class="num text-[19px] font-bold text-ink-gray-9">{{ c.monthly ? money(c.monthly) : '' }}</div>
            <div class="text-[12px] text-ink-gray-5">{{ __('měsíčně') }}</div>
          </div>
          <router-link :to="{ name: 'Projects' }" class="rounded-2xl bg-[rgba(110,120,200,.075)] px-3 py-2.5 hover:bg-[rgba(110,120,200,.12)]">
            <div class="num text-[19px] font-bold text-ink-gray-9">{{ c.projects }}</div>
            <div class="text-[12px] text-ink-gray-5">{{ __('aktivní projekty') }}</div>
          </router-link>
        </div>
        <div class="flex items-center gap-2 text-[14px] text-ink-gray-7">
          <GlIcon name="cal" :size="16" class="shrink-0 text-ink-gray-5" />
          <span class="min-w-0 flex-1 truncate">{{ c.next_event ? `${c.next_event.title} · ${shortDate(c.next_event.at)}` : __('Nic naplánovaného') }}</span>
          <span class="flex -space-x-1.5">
            <span v-for="u in c.team" :key="u" class="flex size-7 items-center justify-center rounded-full border-2 border-white bg-[#dde6ff] text-[10px] font-bold text-[#2440a6]" :title="userName(u)">
              {{ initials(userName(u)) }}
            </span>
          </span>
        </div>
      </div>
    </div>

    <!-- seznam -->
    <div v-else class="gl-card overflow-x-auto p-2">
      <table class="w-full min-w-[640px] text-left text-[14px]">
        <thead class="text-[12px] font-bold text-ink-gray-5">
          <tr>
            <th class="px-3 py-2">{{ __('Klient') }}</th>
            <th class="px-3 py-2">{{ __('Stav') }}</th>
            <th class="px-3 py-2 text-right">{{ __('Měsíčně') }}</th>
            <th class="px-3 py-2 text-right">{{ __('Projekty') }}</th>
            <th class="px-3 py-2">{{ __('Nejbližší schůzka') }}</th>
            <th class="px-3 py-2"></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="c in data?.clients || []" :key="c.name" class="border-t border-[rgba(110,120,200,.12)]">
            <td class="px-3 py-2.5">
              <router-link :to="{ name: 'Organization', params: { organizationId: c.name } }" class="font-semibold text-ink-gray-9 hover:text-[#4f46e5]">{{ c.organization_name }}</router-link>
              <div class="text-[12px] text-ink-gray-5">{{ sinceLabel(c.client_since) }}</div>
            </td>
            <td class="px-3 py-2.5">
              <span class="flex items-center gap-1.5"><span class="size-2 rounded-full" :style="{ background: HEALTH_COLORS[c.health] }" />{{ __(c.health) }}</span>
            </td>
            <td class="num px-3 py-2.5 text-right font-semibold">{{ c.monthly ? money(c.monthly) : '' }}</td>
            <td class="num px-3 py-2.5 text-right">{{ c.projects }}</td>
            <td class="px-3 py-2.5 text-ink-gray-7">{{ c.next_event ? `${c.next_event.title} · ${shortDate(c.next_event.at)}` : '' }}</td>
            <td class="px-3 py-2.5 text-right">
              <Dropdown :options="menu(c)" placement="right">
                <button class="flex size-8 items-center justify-center rounded-full text-ink-gray-5 hover:bg-white/70" :aria-label="__('Další akce')"><GlIcon name="more" :size="18" /></button>
              </Dropdown>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>

  <GlNewClientModal v-if="showNew" v-model="showNew" @saved="overview.reload()" />
  <GlNewProjectModal v-if="projectFor" v-model="showProject" :organization="projectFor" @saved="(p) => router.push({ name: 'Project', params: { projectId: p } })" />
  <CalendarEventModal
    v-if="eventFor"
    v-model="showEvent"
    :organization="eventFor.name"
    :subject="__('Schůzka: {0}', [eventFor.organization_name])"
    :start="tomorrowTen"
    :currentUser="sessionUser"
    :users="calendarUsers.data || []"
    @saved="overview.reload()"
  />
  <Dialog v-model:open="showHealthNote" :title="__('Potřebuje pozornost')">
    <template #default>
      <FormControl v-model="healthNote" :label="__('Proč? (krátce)')" type="text" :placeholder="__('Např. nebere telefon')" />
    </template>
    <template #actions>
      <div class="flex justify-end gap-2">
        <Button :label="__('Zrušit')" @click="showHealthNote = false" />
        <Button variant="solid" :label="__('Uložit')" @click="saveHealth(pendingHealth.org, pendingHealth.health, healthNote)" />
      </div>
    </template>
  </Dialog>
</template>
<script setup>
import GlSkeleton from '@/components/GlSkeleton.vue'
import GlEmptyState from '@/components/GlEmptyState.vue'
import GlErrorBanner from '@/components/GlErrorBanner.vue'
import { isForbidden } from '@/utils/glErrors'
import GlForbidden from '@/components/GlForbidden.vue'
import GlIcon from '@/components/GlIcon.vue'
import LayoutHeader from '@/components/LayoutHeader.vue'
import CalendarEventModal from '@/components/Modals/CalendarEventModal.vue'
import GlNewClientModal from '@/components/Modals/GlNewClientModal.vue'
import GlNewProjectModal from '@/components/Modals/GlNewProjectModal.vue'
import { sessionStore } from '@/stores/session'
import { usersStore } from '@/stores/users'
import { Button, Dialog, Dropdown, FormControl, call, createResource, toast, usePageMeta } from 'frappe-ui'
import { useStorage } from '@vueuse/core'
import { computed, h, ref } from 'vue'
import { useRouter } from 'vue-router'

usePageMeta(() => ({ title: __('Klienti') }))
const router = useRouter()
const { getUser } = usersStore()
const sessionUser = sessionStore().user

const layout = useStorage('glClientsLayout', 'cards')
const overview = createResource({ url: 'growupcrm.clients.get_overview', auto: true })
const data = computed(() => overview.data)
const errorText = computed(() => overview.error?.messages?.[0] || __('Klienty se nepodařilo načíst.'))

const HEALTH_COLORS = { 'V pořádku': '#22b35e', 'Potřebuje pozornost': '#e0a100', 'Ohrožený': '#e5484d' }

const money = (n) => `${new Intl.NumberFormat('cs-CZ').format(Math.round(n || 0))} Kč`
const thousands = (n) => (n >= 1000 ? `${new Intl.NumberFormat('cs-CZ').format(Math.round(n / 1000))} tis.` : String(n))
const cards = computed(() => {
  const k = data.value?.kpis
  if (!k) return []
  const word = (n, one, few, many) => (n === 1 ? one : n >= 2 && n <= 4 ? few : many)
  return [
    { label: __('Aktivní klienti'), value: k.clients, sub: __('z toho {0} na retaineru', [k.on_retainer]) },
    {
      label: __('Měsíčně z retainerů'),
      value: money(k.monthly),
      badge: k.monthly_new ? `↗ ${thousands(k.monthly_new)}` : '',
      sub: `${k.on_retainer} ${word(k.on_retainer, __('klient'), __('klienti'), __('klientů'))}`,
    },
    { label: __('Aktivní projekty'), value: k.projects, sub: __('{0} končí tento měsíc', [k.projects_ending]) },
    { label: __('Potřebují pozornost'), value: k.attention, sub: k.attention_names.join(', ') || __('všechno v pořádku') },
  ]
})

const showNew = ref(false)
const showProject = ref(false)
const projectFor = ref(null)
const showEvent = ref(false)
const eventFor = ref(null)
const showHealthNote = ref(false)
const healthNote = ref('')
const pendingHealth = ref({})
const calendarUsers = createResource({ url: 'growupcrm.calendar.get_users', auto: true })
const tomorrowTen = computed(() => {
  const d = new Date()
  d.setDate(d.getDate() + 1)
  d.setHours(10, 0, 0, 0)
  return d
})

const dot = (color) => () => h('span', { class: 'size-2 rounded-full', style: { background: color } })
function menu(c) {
  const health = Object.keys(HEALTH_COLORS).map((s) => ({
    label: __(s),
    icon: dot(HEALTH_COLORS[s]),
    onClick: () => {
      if (s === 'V pořádku') return saveHealth(c.name, s, '')
      pendingHealth.value = { org: c.name, health: s }
      healthNote.value = c.health_note || ''
      showHealthNote.value = true
    },
  }))
  const groups = [
    {
      group: __('Klient'),
      hideLabel: true,
      items: [
        { label: __('Otevřít firmu'), icon: 'external-link', onClick: () => router.push({ name: 'Organization', params: { organizationId: c.name } }) },
        { label: __('Nový projekt'), icon: 'folder-plus', onClick: () => ((projectFor.value = c.name), (showProject.value = true)) },
        { label: __('Naplánovat schůzku'), icon: 'calendar', onClick: () => ((eventFor.value = c), (showEvent.value = true)) },
      ],
    },
    { group: __('Stav vztahu'), items: health },
  ]
  if (data.value?.is_manager) {
    groups.push({
      group: __('Konec'),
      hideLabel: true,
      items: [{ label: __('Ukončit spolupráci'), icon: 'x', theme: 'red', onClick: () => endCooperation(c) }],
    })
  }
  return groups
}

async function saveHealth(org, health, note) {
  try {
    await call('growupcrm.clients.set_health', { organization: org, health, note })
    showHealthNote.value = false
    overview.reload()
  } catch (e) {
    toast.error(e.messages?.[0] || e.message)
  }
}

async function endCooperation(c) {
  if (!confirm(__('Ukončit spolupráci s {0}? Aktivní retainery skončí dnešním dnem.', [c.organization_name]))) return
  try {
    await call('growupcrm.clients.end_cooperation', { organization: c.name })
    toast.success(__('Spolupráce je ukončená'))
    overview.reload()
  } catch (e) {
    toast.error(e.messages?.[0] || e.message)
  }
}

const userName = (u) => getUser(u)?.full_name || u
const TONES = ['bg-[#dde6ff] text-[#2440a6]', 'bg-[#ffe9d6] text-[#b4560f]', 'bg-[#dcf5e6] text-[#0f6b32]', 'bg-[#efe7ff] text-[#6d3fd0]']
const tone = (s) => TONES[[...(s || '')].reduce((a, ch) => a + ch.charCodeAt(0), 0) % TONES.length]
const initials = (s) =>
  (s || '?')
    .replace(/[,.]|s\.r\.o|a\.s/gi, ' ')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('')
const sinceLabel = (d) => {
  if (!d) return __('Klient')
  // „1. října 2026“ → „října 2026“ (2. pád, ne „říjen“)
  const x = new Date(d + 'T00:00')
  const m = x.toLocaleDateString('cs-CZ', { day: 'numeric', month: 'long', year: 'numeric' }).replace(/^\d+\.\s*/, '')
  return __('Klient od {0}', [m])
}
const shortDate = (s) => {
  const d = new Date(String(s).replace(' ', 'T'))
  return `${d.getDate()}. ${d.getMonth() + 1}.`
}
</script>
