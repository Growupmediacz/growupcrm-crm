<template>
  <!-- GrowUp (design 2. kolo, oprava 24): mobilní detail zakázky. Další krok na celou šířku s kolečkem Hotovo,
       karta Hodnota / Kontakt, čipy aktivity a pevná spodní lišta akcí. -->
  <LayoutHeader>
    <header class="flex min-w-0 items-center justify-between gap-2 py-2.5 pl-2">
      <router-link :to="{ name: 'Leads' }" class="gl-round inline-flex h-11 items-center gap-1 rounded-full pl-2.5 pr-4 text-[16px] font-semibold text-[#4338ca]">
        <GlIcon name="left" :size="17" />{{ __('Zakázky') }}
      </router-link>
      <Dropdown v-if="doc.name" :options="moreOptions" placement="right">
        <button class="gl-round flex size-11 items-center justify-center rounded-full" :aria-label="__('Další akce')">
          <GlIcon name="more" :size="20" />
        </button>
      </Dropdown>
    </header>
  </LayoutHeader>
  <div v-if="doc.name" class="flex min-h-0 flex-1 flex-col overflow-y-auto px-4 pb-28">
    <LeadHero :key="heroKey" :doc="doc" :stageOptions="mobileStages" compact @changed="afterChange" @fill="openDetails(true)" />

    <!-- Hodnota a Kontakt -->
    <div class="gl-card mt-3 !rounded-[20px] px-4">
      <div class="flex min-h-[56px] items-center justify-between gap-3 py-2">
        <span class="text-[15px] text-ink-gray-5">{{ __('Hodnota') }}</span>
        <span v-if="doc.order_value" class="num text-[17px] font-bold text-ink-gray-9">{{ valueText }}</span>
        <span v-else class="flex flex-col items-start">
          <span class="text-[20px] font-semibold text-[var(--empty-color,#5B6285)]">{{ __('Bez hodnoty') }}</span>
        </span>
      </div>
      <button v-if="!doc.order_value" class="gl-fill -mt-2 mb-2 block text-[14px]" @click="openDetails(true)">{{ __('Doplnit') }}</button>
      <button class="flex min-h-[56px] w-full items-center justify-between gap-3 border-t border-[rgba(110,120,200,.14)] py-2 text-left" @click="openContact">
        <span class="text-[15px] text-ink-gray-5">{{ __('Kontakt') }}</span>
        <span v-if="personName" class="min-w-0 flex-1 truncate text-right text-[17px] font-semibold text-ink-gray-9">{{ personName }}</span>
        <span v-else class="flex-1 text-right text-[17px] font-semibold text-[#4F46E5]">+ {{ __('Přidat kontakt') }}</span>
        <GlIcon name="right" :size="16" class="shrink-0 text-ink-gray-4" />
      </button>
    </div>
    <button class="mt-2 self-start px-1 text-[13px] font-semibold text-[#4F46E5]" @click="openDetails(false)">{{ __('Všechny detaily') }}</button>

    <!-- Aktivita -->
    <h2 class="mb-1 mt-4 px-1 text-[22px] font-bold tracking-tight text-ink-gray-9">{{ __('Aktivita') }}</h2>
    <div class="gl-chiptabs flex min-h-[420px] flex-col">
      <Tabs
        v-model="tabIndex"
        as="div"
        :tabs="tabs"
        class="flex flex-1 flex-col [&_[role='tab']]:px-0 [&_[role='tab']]:shrink-0 [&_[role='tablist']]:min-h-[45px] [&_[role='tablist']]:flex-wrap [&_[role='tabpanel']:not([hidden])]:flex [&_[role='tabpanel']:not([hidden])]:grow"
      >
        <template #tab-panel>
          <Activities
            ref="activities"
            v-model:reload="reload"
            v-model:tabIndex="tabIndex"
            doctype="CRM Lead"
            :docname="leadId"
            :tabs="tabs"
            @beforeSave="beforeStatusChange"
            @afterSave="afterChange"
          />
        </template>
      </Tabs>
    </div>
  </div>
  <ErrorPage v-else-if="errorTitle" :errorTitle="errorTitle" :errorMessage="errorMessage" />

  <!-- pevná spodní lišta akcí -->
  <nav v-if="doc.name" class="gl-tabbar fixed inset-x-3 bottom-3 z-30 flex h-[72px] items-stretch gap-1 rounded-[26px] px-2 py-2">
    <button
      v-for="a in actions"
      :key="a.label"
      class="gl-round flex flex-1 flex-col items-center justify-center gap-1 rounded-2xl text-[12px] font-bold text-ink-gray-9 disabled:opacity-40"
      :disabled="a.disabled"
      @click="a.onClick"
    >
      <GlIcon :name="a.icon" :size="20" :class="a.primary ? 'text-[#4F46E5]' : ''" />{{ a.label }}
    </button>
  </nav>

  <!-- Detaily a kontakt ve spodním panelu -->
  <Dialog v-model:open="showDetails" :title="__('Detaily')">
    <template #default>
      <div class="max-h-[70vh] overflow-y-auto">
        <LeadAside v-model:editing="editingDetails" mobile :doc="doc" @email="openEmail" @call="(p) => ((callPerson = p), (showCall = true))" @saved="afterChange" />
      </div>
    </template>
  </Dialog>
  <GlCallModal v-if="showCall" v-model="showCall" :lead="doc" :person="callPerson" @saved="afterChange" />
  <CalendarEventModal
    v-if="showSchedule"
    v-model="showSchedule"
    :lead="leadId"
    :start="scheduleStart"
    :currentUser="sessionUser"
    :users="calendarUsers.data || []"
    @saved="afterChange"
  />
  <GlWonModal v-if="showWon" v-model="showWon" :lead="doc" :onConfirm="confirmWon" />
  <ConvertToDealModal v-if="showConvertToDealModal" v-model="showConvertToDealModal" :lead="doc" />
  <DeleteLinkedDocModal
    v-if="showDeleteLinkedDocModal"
    v-model="showDeleteLinkedDocModal"
    :doctype="'CRM Lead'"
    :docname="leadId"
    :title="doc.lead_name"
    name="Leads"
  />
  <LostReasonModal v-if="showLostReasonModal" v-model="showLostReasonModal" doctype="CRM Lead" :document="document" />
</template>
<script setup>
import { useLeadsOnlyMode } from '@/composables/leadsOnlyMode'

const leadsOnlyMode = useLeadsOnlyMode()
import DeleteLinkedDocModal from '@/components/DeleteLinkedDocModal.vue'
import ErrorPage from '@/components/ErrorPage.vue'
import Icon from '@/components/Icon.vue'
import DetailsIcon from '@/components/Icons/DetailsIcon.vue'
import ActivityIcon from '@/components/Icons/ActivityIcon.vue'
import EmailIcon from '@/components/Icons/EmailIcon.vue'
import CommentIcon from '@/components/Icons/CommentIcon.vue'
import PhoneIcon from '@/components/Icons/PhoneIcon.vue'
import TaskIcon from '@/components/Icons/TaskIcon.vue'
import NoteIcon from '@/components/Icons/NoteIcon.vue'
import AttachmentIcon from '@/components/Icons/AttachmentIcon.vue'
import WhatsAppIcon from '@/components/Icons/WhatsAppIcon.vue'
import IndicatorIcon from '@/components/Icons/IndicatorIcon.vue'
import LostReasonModal from '@/components/Modals/LostReasonModal.vue'
import LayoutHeader from '@/components/LayoutHeader.vue'
import LeadHero from '@/components/Lead/LeadHero.vue'
import LeadAside from '@/components/Lead/LeadAside.vue'
import GlIcon from '@/components/GlIcon.vue'
import GlCallModal from '@/components/Modals/GlCallModal.vue'
import GlWonModal from '@/components/Modals/GlWonModal.vue'
import CalendarEventModal from '@/components/Modals/CalendarEventModal.vue'
import { sessionStore } from '@/stores/session'
import Activities from '@/components/Activities/Activities.vue'
import AssignTo from '@/components/AssignTo.vue'
import SidePanelLayout from '@/components/SidePanelLayout.vue'
import SLASection from '@/components/SLASection.vue'
import CustomActions from '@/components/CustomActions.vue'
import { setupCustomizations, isTranslatable } from '@/utils'
import { getView } from '@/utils/view'
import { getSettings } from '@/stores/settings'
import { globalStore } from '@/stores/global'
import { statusesStore } from '@/stores/statuses'
import { getMeta } from '@/stores/meta'
import { useDocument } from '@/data/document'
import { isMobileView } from '@/composables/settings'
import { whatsappEnabled } from '@/composables/whatsapp'
import { useActiveTabManager } from '@/composables/useActiveTabManager'
import { useVisitedRecords } from '@/composables/useVisitedRecords'
import {
  createResource,
  Dialog,
  Dropdown,
  Tooltip,
  Tabs,
  Breadcrumbs,
  call,
  usePageMeta,
  toast,
} from 'frappe-ui'
import { ref, computed, watch, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import ConvertToDealModal from '@/components/Modals/ConvertToDealModal.vue'

const { brand } = getSettings()
const { $dialog, $socket } = globalStore()
const { statusOptions, getLeadStatus } = statusesStore()
const { doctypeMeta } = getMeta('CRM Lead')

const route = useRoute()
const router = useRouter()

const props = defineProps({
  leadId: { type: String, required: true },
})

const errorTitle = ref('')
const errorMessage = ref('')
const showDeleteLinkedDocModal = ref(false)

const {
  triggerOnChange,
  triggerOnRender,
  assignees,
  document,
  scripts,
  error,
} = useDocument('CRM Lead', props.leadId)

const doc = computed(() => document.doc || {})
const isLeadConversionDisabled = computed(
  () => doc.value.status && getLeadStatus(doc.value.status)?.type === 'Lost',
)

const { markVisited } = useVisitedRecords('CRM Lead')

onMounted(async () => {
  if (document.doc) await triggerOnRender()
  markVisited(props.leadId)
})

watch(error, (err) => {
  if (err) {
    errorTitle.value = __(
      err.exc_type == 'DoesNotExistError'
        ? __('Document Not Found')
        : __('Error Occurred'),
    )
    errorMessage.value = __(err.messages?.[0] || 'An Error Occurred')
  } else {
    errorTitle.value = ''
    errorMessage.value = ''
  }
})

watch(
  () => document.doc,
  async (_doc) => {
    if (scripts.data?.length) {
      let s = await setupCustomizations(scripts.data, {
        doc: _doc,
        $dialog,
        $socket,
        router,
        toast,
        updateField,
        createToast: toast.create,
        deleteDoc: deleteLead,
        call,
      })
      document._actions = s.actions || []
      document._statuses = s.statuses || []
    }
  },
  { once: true },
)

const reload = ref(false)

const breadcrumbs = computed(() => {
  let items = [{ label: __('Leads'), route: { name: 'Leads' } }]

  if (route.query.view || route.query.viewType) {
    let view = getView(route.query.view, route.query.viewType, 'CRM Lead')
    if (view) {
      items.push({
        label: __(view.label),
        icon: view.icon,
        route: {
          name: 'Leads',
          params: { viewType: route.query.viewType },
          query: { view: route.query.view },
        },
      })
    }
  }

  items.push({
    label: title.value,
    route: {
      name: 'Lead',
      params: { leadId: props.leadId },
      query: route.query,
    },
  })
  return items
})

const title = computed(() => {
  let t = doctypeMeta.value?.title_field || 'name'
  return doc.value?.[t] || props.leadId
})

usePageMeta(() => {
  return {
    title: title.value,
    icon: brand.favicon,
  }
})

const tabs = computed(() => {
  let tabOptions = [
    { name: 'Activity', label: __('Vše'), icon: ActivityIcon },
    { name: 'Notes', label: __('Zápisy'), icon: NoteIcon },
    { name: 'Calls', label: __('Hovory'), icon: PhoneIcon },
    { name: 'Emails', label: __('E-maily'), icon: EmailIcon },
    { name: 'Tasks', label: __('Úkoly'), icon: TaskIcon },
    { name: 'Comments', label: __('Komentáře'), icon: CommentIcon },
    { name: 'Data', label: __('Data'), icon: DetailsIcon },
    { name: 'Attachments', label: __('Přílohy'), icon: AttachmentIcon },
    {
      name: 'WhatsApp',
      label: __('WhatsApp'),
      icon: WhatsAppIcon,
      condition: () => whatsappEnabled.value,
    },
  ]
  return tabOptions.filter((tab) => (tab.condition ? tab.condition() : true))
})

const { tabIndex } = useActiveTabManager(tabs, 'lastLeadTab')

const sections = createResource({
  url: 'crm.fcrm.doctype.crm_fields_layout.crm_fields_layout.get_sidepanel_sections',
  cache: ['sidePanelSections', 'CRM Lead'],
  params: { doctype: 'CRM Lead' },
  auto: true,
})

function updateField(name, value) {
  value = Array.isArray(name) ? '' : value
  let oldValues = Array.isArray(name) ? {} : doc.value[name]

  if (Array.isArray(name)) {
    name.forEach((field) => (doc.value[field] = value))
  } else {
    doc.value[name] = value
  }

  document.save.submit(null, {
    onSuccess: () => (reload.value = true),
    onError: (err) => {
      if (Array.isArray(name)) {
        name.forEach((field) => (doc.value[field] = oldValues[field]))
      } else {
        doc.value[name] = oldValues
      }
      toast.error(err.messages?.[0] || __('Error updating field'))
    },
  })
}

function deleteLead() {
  showDeleteLinkedDocModal.value = true
}

// Convert to Deal
const showConvertToDealModal = ref(false)

function statusLabel(status) {
  if (isTranslatable('CRM Lead Status')) return __(status)
  return status
}

const mobileStages = computed(() =>
  statusOptions(
    'lead',
    document.statuses?.length ? document.statuses : document._statuses,
    triggerStatusChange,
  ),
)

async function triggerStatusChange(value) {
  // výhra jde přes dialog „Zakázka vyhrána“ (datum podpisu, finální hodnota)
  if (getLeadStatus(value)?.type === 'Won' && doc.value.status !== value) {
    wonStatus.value = value
    showWon.value = true
    return
  }
  await triggerOnChange('status', value)
  setLostReason()
}

// --- GrowUp: mobilní detail (oprava 24) ---
const activities = ref(null)
const heroKey = ref(0)
const showDetails = ref(false)
const editingDetails = ref(false)
const showCall = ref(false)
const callPerson = ref({})
const showSchedule = ref(false)
const showWon = ref(false)
const wonStatus = ref('')
const sessionUser = sessionStore().user
const calendarUsers = createResource({ url: 'growupcrm.calendar.get_users', auto: true })
const scheduleStart = computed(() => {
  const d = new Date()
  d.setDate(d.getDate() + 1)
  d.setHours(10, 0, 0, 0)
  return d
})
const valueText = computed(() => `${new Intl.NumberFormat('cs-CZ').format(doc.value.order_value || 0)} Kč`)
const personName = computed(() => [doc.value.first_name, doc.value.last_name].filter(Boolean).join(' '))

async function afterChange() {
  await document.reload()
  activities.value?.all_activities?.reload()
  heroKey.value++
}
async function confirmWon(values) {
  await call('growupcrm.calls.mark_won', { lead: props.leadId, status: wonStatus.value, ...values })
  await afterChange()
  toast.success(__('Gratulujeme, zakázka je vyhraná'))
}
function openDetails(edit) {
  editingDetails.value = !!edit
  showDetails.value = true
}
function openContact() {
  if (doc.value.contact_person) router.push({ name: 'Contact', params: { contactId: doc.value.contact_person } })
  else openDetails(false)
}
function openEmail() {
  showDetails.value = false
  activities.value?.changeTabTo('emails')
  setTimeout(() => activities.value?.emailBox && (activities.value.emailBox.show = true), 150)
}

const nextStage = computed(() => {
  const order = mobileStages.value.filter((o) => getLeadStatus(o.value)?.type !== 'Lost')
  const i = order.findIndex((o) => o.value === doc.value.status)
  if (i < 0 || getLeadStatus(doc.value.status)?.type === 'Lost') return null
  return order[i + 1] || null
})
const actions = computed(() => [
  { label: __('Hovor'), icon: 'phone', onClick: () => ((callPerson.value = {}), (showCall.value = true)) },
  { label: __('Zápis'), icon: 'doc', onClick: () => activities.value?.modalRef?.showNote() },
  { label: __('E-mail'), icon: 'mail', onClick: openEmail },
  { label: __('Naplánovat'), icon: 'cal', onClick: () => (showSchedule.value = true) },
  { label: __('Další fáze'), icon: 'arrow', primary: true, disabled: !nextStage.value, onClick: () => nextStage.value?.onClick() },
])
const moreOptions = computed(() => [
  { group: __('Změnit stav'), items: mobileStages.value },
  {
    group: __('Zakázka'),
    items: [
      { label: __('Všechny detaily'), icon: 'sliders', onClick: () => openDetails(false) },
      !leadsOnlyMode.value && {
        label: __('Convert to Deal'),
        icon: 'repeat',
        condition: () => !isLeadConversionDisabled.value,
        onClick: () => (showConvertToDealModal.value = true),
      },
      { label: __('Smazat zakázku'), icon: 'trash-2', theme: 'red', onClick: deleteLead },
    ].filter(Boolean),
  },
])

const showLostReasonModal = ref(false)

function setLostReason() {
  if (
    getLeadStatus(doc.value.status).type !== 'Lost' ||
    (doc.value.lost_reason && doc.value.lost_reason !== 'Other') ||
    (doc.value.lost_reason === 'Other' && doc.value.lost_notes)
  ) {
    document.save.submit()
    return
  }

  showLostReasonModal.value = true
}

function beforeStatusChange(data) {
  if (
    Object.hasOwn(data ?? {}, 'status') &&
    getLeadStatus(data.status).type == 'Lost'
  ) {
    setLostReason()
  } else {
    document.save.submit(null, {
      onSuccess: () => reloadAssignees(data),
    })
  }
}
function reloadAssignees(data) {
  if (Object.hasOwn(data ?? {}, 'lead_owner')) {
    assignees.reload()
  }
}
</script>
