<template>
  <LayoutHeader>
    <template #left-header>
      <ViewBreadcrumbs routeName="Calendar" />
    </template>
    <template #right-header>
      <Button variant="solid" :label="__('Vytvořit')" iconLeft="plus" @click="newEvent(null)" />
    </template>
  </LayoutHeader>
  <div class="flex h-[calc(100vh-56px)] flex-col overflow-hidden">
    <!-- ovládání -->
    <div class="flex flex-wrap items-center justify-between gap-2 border-b border-outline-gray-2 px-4 py-2">
      <div class="flex items-center gap-1">
        <Button variant="ghost" icon="lucide-chevron-left" :aria-label="__('Předchozí')" @click="move(-1)" />
        <Button variant="ghost" :label="__('Dnes')" @click="goToday" />
        <Button variant="ghost" icon="lucide-chevron-right" :aria-label="__('Další')" @click="move(1)" />
        <span class="ml-2 text-lg font-medium text-ink-gray-8">{{ title }}</span>
      </div>
      <div class="flex items-center gap-2">
        <TabButtons
          v-if="isManager"
          :buttons="[
            { label: __('Moje'), value: 'mine' },
            { label: __('Celý tým'), value: 'team' },
          ]"
          v-model="scope"
        />
        <TabButtons :buttons="viewButtons" v-model="view" />
      </div>
    </div>
    <div class="relative flex-1 overflow-hidden">
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
        @itemClick="openItem"
      />
      <CalendarList v-else :days="days" :items="items" @itemClick="openItem" />
    </div>
  </div>
  <CalendarEventModal
    v-model="showEvent"
    :item="activeEvent"
    :start="newStart"
    :currentUser="currentUser"
    :users="users"
    @saved="reload"
  />
  <CalendarTaskModal v-model="showTask" :item="activeTask" @saved="reload" />
</template>
<script setup>
import CalendarList from '@/components/Calendar/CalendarList.vue'
import CalendarMonth from '@/components/Calendar/CalendarMonth.vue'
import CalendarTimeGrid from '@/components/Calendar/CalendarTimeGrid.vue'
import CalendarEventModal from '@/components/Modals/CalendarEventModal.vue'
import CalendarTaskModal from '@/components/Modals/CalendarTaskModal.vue'
import LayoutHeader from '@/components/LayoutHeader.vue'
import ViewBreadcrumbs from '@/components/ViewBreadcrumbs.vue'
import {
  addDays,
  daysBetween,
  LIST_DAYS,
  fetchCalendar,
  getRange,
  monthYearLabel,
  rangeLabel,
  startOfDay,
  toItems,
} from '@/composables/calendar'
import { Button, TabButtons, call, toast } from 'frappe-ui'
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'

// Na úzkém displeji (<768 px) jen seznam a den, na širokém měsíc, týden a den.
const narrow = ref(window.innerWidth < 768)
const onResize = () => {
  const n = window.innerWidth < 768
  if (n !== narrow.value) {
    narrow.value = n
    view.value = n ? 'list' : 'week'
  }
}

const view = ref(narrow.value ? 'list' : 'week')
const scope = ref('mine')
const anchor = ref(startOfDay(new Date()))
const items = ref([])
const loading = ref(false)
const isManager = ref(false)
const currentUser = ref('')
const users = ref([])

const viewButtons = computed(() =>
  narrow.value
    ? [
        { label: __('Seznam'), value: 'list' },
        { label: __('Den'), value: 'day' },
      ]
    : [
        { label: __('Měsíc'), value: 'month' },
        { label: __('Týden'), value: 'week' },
        { label: __('Den'), value: 'day' },
      ],
)

const range = computed(() => getRange(view.value, anchor.value))
const days = computed(() => daysBetween(range.value.start, range.value.end))
const title = computed(() => {
  const t = view.value === 'month' ? monthYearLabel(anchor.value) : rangeLabel(days.value)
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
  } catch (e) {
    if (id === requestId) toast.error(e.messages?.[0] || __('Kalendář se nepodařilo načíst'))
  } finally {
    if (id === requestId) loading.value = false
  }
}

watch([range, scope], reload)

// Události a úkoly
const showEvent = ref(false)
const showTask = ref(false)
const activeEvent = ref(null)
const activeTask = ref(null)
const newStart = ref(null)

function withTime(d, hour) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate(), hour, 0)
}

function newEvent(start) {
  activeEvent.value = null
  newStart.value = start
  showEvent.value = true
}

function openItem(item) {
  if (item.kind === 'event') {
    activeEvent.value = item
    showEvent.value = true
  } else {
    activeTask.value = item
    showTask.value = true
  }
}

onMounted(async () => {
  window.addEventListener('resize', onResize)
  reload()
  users.value = await call('growupcrm.calendar.get_users')
})
onBeforeUnmount(() => window.removeEventListener('resize', onResize))
</script>
