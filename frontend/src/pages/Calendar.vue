<template>
  <LayoutHeader>
    <!-- GrowUp (design 2. kolo, R2Kalendar): měsíc jako nadpis, šipky, Dnes; vpravo Den/Týden/Měsíc a akce -->
    <template #left-header>
      <ViewBreadcrumbs v-if="narrow" routeName="Calendar" />
      <div v-else class="flex items-center gap-3">
        <h1 class="text-lg-medium whitespace-nowrap">{{ title }}</h1>
        <button class="gl-round flex size-11 items-center justify-center rounded-full" :aria-label="__('Předchozí')" @click="move(-1)">
          <GlIcon name="left" :size="18" />
        </button>
        <button class="gl-round flex size-11 items-center justify-center rounded-full" :aria-label="__('Další')" @click="move(1)">
          <GlIcon name="right" :size="18" />
        </button>
        <button class="gl-quick" @click="goToday">{{ __('Dnes') }}</button>
      </div>
    </template>
    <template #right-header>
      <div v-if="!narrow" class="gl-seg inline-flex">
        <button
          v-for="b in viewButtons"
          :key="b.value"
          class="gl-seg-btn"
          :class="view === b.value && 'gl-seg-on'"
          @click="view = b.value"
        >
          {{ b.label }}
        </button>
      </div>
      <Button :label="__('Naplánovat týden')" iconLeft="calendar" @click="showPlan = true" />
      <Button v-if="!narrow" variant="solid" :label="__('Nová událost')" iconLeft="plus" @click="newEvent(null)" />
    </template>
  </LayoutHeader>
  <!-- GrowUp: mobil podle designu – týden a program dne -->
  <div v-if="narrow" class="flex h-[calc(100vh-56px)] flex-col overflow-hidden px-2">
    <GlCalendarMobile
      :days="days"
      :items="items"
      :selected="anchor"
      @select="(d) => (anchor = d)"
      @move="(dir) => (anchor = addDays(anchor, 7 * dir))"
      @new="(d) => newEvent(withTime(d, 9))"
      @itemClick="openItem"
    />
  </div>
  <div v-else class="flex h-[calc(100vh-88px)] flex-col gap-3 overflow-hidden px-2 pb-2">
    <!-- přehled týmu (oprava 6): počet schůzek tlumeným číslem vedle jména, klik přepne kalendář na daného člověka -->
    <div v-if="isManager" class="flex flex-wrap items-center gap-2 px-1">
      <span class="mr-1 text-[13px] font-medium text-ink-gray-5">{{ __('Tým') }}</span>
      <button
        class="gl-chip flex h-9 items-center rounded-full px-3.5 text-[14px]"
        :class="scope === 'mine' && 'gl-chip-on'"
        @click="scope = 'mine'"
      >
        {{ __('Moje') }}
      </button>
      <button
        class="gl-chip flex h-9 items-center rounded-full px-3.5 text-[14px]"
        :class="scope === 'team' && 'gl-chip-on'"
        @click="scope = 'team'"
      >
        {{ __('Celý tým') }}
      </button>
      <button
        v-for="m in team"
        :key="m.user"
        class="gl-chip flex h-9 items-center gap-2 rounded-full pl-1.5 pr-3.5 text-[14px]"
        :class="scope === 'user:' + m.user && 'gl-chip-on'"
        :title="pluralMeetings(m.meetings)"
        @click="scope = scope === 'user:' + m.user ? 'team' : 'user:' + m.user"
      >
        <UserAvatar :user="m.user" size="sm" />
        <span>{{ firstName(m.full_name) }}</span>
        <span class="num font-semibold text-ink-gray-5">{{ m.meetings }}</span>
      </button>
      <span v-if="team.length" class="text-[13px] text-ink-gray-5">· {{ __('počet schůzek v týdnu') }}</span>
    </div>
    <div class="gl-card relative flex-1 overflow-hidden">
      <div v-if="loading" class="absolute right-4 top-2 z-30 text-xs text-ink-gray-5">{{ __('Načítání…') }}</div>
      <CalendarMonth
        v-if="view === 'month'"
        :days="days"
        :items="items"
        :month="anchor.getMonth()"
        @cellClick="(d) => newEvent(withTime(d, 9))"
        @dayClick="openDay"
        @itemClick="openItem"
      />
      <CalendarTimeGrid
        v-else-if="view === 'week' || view === 'day'"
        :key="view + days[0].getTime()"
        :days="days"
        :items="items"
        @slotClick="newEvent"
        @rangeSelect="({ start, end }) => newEvent(start, end)"
        @itemClick="openItem"
      />
      <CalendarList v-else :days="days" :items="items" @itemClick="openItem" />
    </div>
  </div>
  <CalendarEventModal
    v-model="showEvent"
    :item="activeEvent"
    :start="newStart"
    :end="newEnd"
    :currentUser="currentUser"
    :users="users"
    @saved="reload"
  />
  <GlEventPeek
    :item="peekItem"
    :anchor="peekAnchor"
    @close="peekItem = null"
    @edit="editFromPeek"
    @changed="reload"
  />
  <CalendarTaskModal v-model="showTask" :item="activeTask" @saved="reload" />
  <CalendarPlanWeekModal
    v-model="showPlan"
    :weekStart="range.start"
    :currentUser="currentUser"
    :users="users"
    @saved="reload"
  />
</template>
<script setup>
import CalendarList from '@/components/Calendar/CalendarList.vue'
import GlEventPeek from '@/components/Calendar/GlEventPeek.vue'
import GlCalendarMobile from '@/components/Calendar/GlCalendarMobile.vue'
import CalendarMonth from '@/components/Calendar/CalendarMonth.vue'
import CalendarTimeGrid from '@/components/Calendar/CalendarTimeGrid.vue'
import CalendarEventModal from '@/components/Modals/CalendarEventModal.vue'
import CalendarTaskModal from '@/components/Modals/CalendarTaskModal.vue'
import CalendarPlanWeekModal from '@/components/Modals/CalendarPlanWeekModal.vue'
import LayoutHeader from '@/components/LayoutHeader.vue'
import ViewBreadcrumbs from '@/components/ViewBreadcrumbs.vue'
import {
  addDays,
  daysBetween,
  LIST_DAYS,
  fetchCalendar,
  getRange,
  isoDate,
  pluralMeetings,
  monthYearLabel,
  rangeLabel,
  startOfDay,
  toItems,
} from '@/composables/calendar'
import GlIcon from '@/components/GlIcon.vue'
import UserAvatar from '@/components/UserAvatar.vue'
import { Button, call, toast } from 'frappe-ui'
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'

// Na úzkém displeji (<768 px) jen seznam a den, na širokém měsíc, týden a den.
const narrow = ref(window.innerWidth < 768)
const onResize = () => {
  const n = window.innerWidth < 768
  if (n !== narrow.value) {
    narrow.value = n
    view.value = 'week'
  }
}

// mobil i desktop načítají týden; mobil ho kreslí jako pás dnů (GlCalendarMobile)
const view = ref('week')
const scope = ref('mine')
const anchor = ref(startOfDay(new Date()))
const items = ref([])
const loading = ref(false)
const isManager = ref(false)
const currentUser = ref('')
const users = ref([])
const team = ref([])
const showPlan = ref(false)

const viewButtons = computed(() =>
  narrow.value
    ? [
        { label: __('Seznam'), value: 'list' },
        { label: __('Den'), value: 'day' },
      ]
    : [
        { label: __('Den'), value: 'day' },
        { label: __('Týden'), value: 'week' },
        { label: __('Měsíc'), value: 'month' },
      ],
)

const range = computed(() => getRange(view.value, anchor.value))
const days = computed(() => daysBetween(range.value.start, range.value.end))
const firstName = (n) => (n || '').split(' ')[0]
const title = computed(() => {
  const t = view.value === 'day' ? rangeLabel(days.value) : monthYearLabel(anchor.value)
  return t.charAt(0).toUpperCase() + t.slice(1)
})

function move(dir) {
  const a = anchor.value
  if (view.value === 'day') anchor.value = addDays(a, dir)
  else if (view.value === 'week') anchor.value = addDays(a, 7 * dir)
  else if (view.value === 'list') anchor.value = addDays(a, LIST_DAYS * dir)
  else anchor.value = new Date(a.getFullYear(), a.getMonth() + dir, 1)
}

function goToday() {
  anchor.value = startOfDay(new Date())
}

function openDay(d) {
  anchor.value = d
  view.value = 'day'
}

let requestId = 0
async function reload() {
  const id = ++requestId
  loading.value = true
  try {
    const data = await fetchCalendar(range.value.start, range.value.end, scope.value)
    if (id !== requestId) return
    items.value = toItems(data)
    isManager.value = data.is_manager
    currentUser.value = data.user
    loadTeam()
  } catch (e) {
    if (id === requestId) toast.error(e.messages?.[0] || __('Kalendář se nepodařilo načíst'))
  } finally {
    if (id === requestId) loading.value = false
  }
}

async function loadTeam() {
  if (!isManager.value) return
  try {
    team.value = await call('growupcrm.calendar.get_team_summary', {
      start: isoDate(range.value.start),
      end: isoDate(range.value.end),
    })
  } catch {
    team.value = []
  }
}

watch([range, scope], reload)

// Události a úkoly
const showEvent = ref(false)
const showTask = ref(false)
const activeEvent = ref(null)
const activeTask = ref(null)
const newStart = ref(null)
const newEnd = ref(null)

function withTime(d, hour) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate(), hour, 0)
}

function newEvent(start, end = null) {
  activeEvent.value = null
  newStart.value = start
  newEnd.value = end
  showEvent.value = true
}

// GrowUp: klik na událost ukáže náhled u kurzoru (design), úprava až z něj
const peekItem = ref(null)
const peekAnchor = ref({ x: 0, y: 0 })
const lastPointer = { x: 0, y: 0 }
function rememberPointer(e) {
  lastPointer.x = e.clientX
  lastPointer.y = e.clientY
}
function editFromPeek(item) {
  peekItem.value = null
  activeEvent.value = item
  showEvent.value = true
}

function openItem(item) {
  if (item.kind === 'event') {
    peekAnchor.value = { ...lastPointer }
    peekItem.value = item
  } else {
    activeTask.value = item
    showTask.value = true
  }
}

onMounted(async () => {
  window.addEventListener('resize', onResize)
  window.addEventListener('pointerdown', rememberPointer, true)
  reload()
  users.value = await call('growupcrm.calendar.get_users')
})
onBeforeUnmount(() => {
  window.removeEventListener('resize', onResize)
  window.removeEventListener('pointerdown', rememberPointer, true)
})
</script>
