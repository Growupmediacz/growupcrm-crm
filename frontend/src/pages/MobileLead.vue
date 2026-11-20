<template>
  <!-- GrowUp (design 2. kolo, oprava 24): mobilní detail zakázky. Další krok na celou šířku s kolečkem Hotovo,
       karta Hodnota / Kontakt, čipy aktivity a pevná spodní lišta akcí. -->
  <LayoutHeader>
    <header class="flex min-w-0 items-center justify-between gap-2 py-2.5 pl-2">
      <router-link :to="{ name: 'Leads' }" class="gl-round inline-flex h-11 items-center gap-1 rounded-full pl-2.5 pr-4 text-[16px] font-semibold text-[var(--accent-700)]">
        <GlIcon name="left" :size="17" />{{ __('Zakázky') }}
      </router-link>
      <Dropdown v-if="doc.name" :options="moreOptions" placement="right">
        <button class="gl-round flex size-11 items-center justify-center rounded-full" :aria-label="__('Další akce')">
          <GlIcon name="more" :size="20" />
        </button>
      </Dropdown>
    </header>
  </LayoutHeader>
  <!-- zadání 2027 E2 (návrh e): jediný posuvník je rodič v MobileLayout, tady žádný vnitřní overflow.
       Nízká hlavička, lepivé záložky, dole GlActionBar. -->
  <div v-if="doc.name" class="gl-actionbar-space">
    <GlMobileLeadHeader
      :key="heroKey"
      :doc="doc"
      :title="title"
      @changed="afterChange"
      @fill="openDetails(true)"
      @plan="activities?.modalRef?.showTask()"
      @stage="showStages = true"
    />

    <div class="gl-ltabs" role="tablist" :aria-label="__('Části zakázky')">
      <button
        v-for="t in leadTabs"
        :key="t.key"
        type="button"
        role="tab"
        :id="`gl-ltab-${t.key}`"
        :aria-selected="leadTab === t.key"
        :aria-controls="`gl-lpanel-${t.key}`"
        :tabindex="leadTab === t.key ? 0 : -1"
        class="gl-ltab"
        :class="leadTab === t.key && 'is-on'"
        @click="leadTab = t.key"
      >
        {{ t.label }}<span v-if="t.badge" class="gl-ltab-badge">{{ t.badge }}</span>
      </button>
    </div>

    <!-- Komunikace (e-maily jako konverzace, zadání 2027 E1); prázdný stav řeší GlThreadList -->
    <div v-show="leadTab === 'comm'" id="gl-lpanel-comm" role="tabpanel" aria-labelledby="gl-ltab-comm" class="px-4">
      <GlMobileConversations ref="conversations" :docname="leadId" :doc="doc" @sent="afterChange" />
    </div>

    <!-- Detaily -->
    <div v-show="leadTab === 'details'" id="gl-lpanel-details" role="tabpanel" aria-labelledby="gl-ltab-details" class="px-4 pt-3">
      <div class="gl-card !rounded-[20px] px-4">
        <div class="flex min-h-[56px] items-center justify-between gap-3 py-2">
          <span class="text-[15px] text-ink-gray-5">{{ __('Hodnota') }}</span>
          <span v-if="doc.order_value" class="num text-[17px] font-bold text-ink-gray-9">{{ valueText }}</span>
          <button v-else type="button" class="min-h-[44px] text-[17px] font-semibold text-[var(--accent-700)]" @click="openDetails(true)">{{ __('Bez hodnoty') }} · {{ __('Doplnit') }}</button>
        </div>
        <button class="flex min-h-[56px] w-full items-center justify-between gap-3 border-t border-[var(--line)] py-2 text-left" @click="openContact">
          <span class="text-[15px] text-ink-gray-5">{{ __('Kontakt') }}</span>
          <span v-if="personName" class="min-w-0 flex-1 truncate text-right text-[17px] font-semibold text-ink-gray-9">{{ personName }}</span>
          <span v-else class="flex-1 text-right text-[17px] font-semibold text-[var(--accent-600)]">+ {{ __('Přidat kontakt') }}</span>
          <GlIcon name="right" :size="16" class="shrink-0 text-ink-gray-4" />
        </button>
      </div>
      <button type="button" class="mt-2 inline-flex min-h-[44px] items-center px-1 text-[15px] font-semibold text-[var(--accent-700)]" @click="openDetails(false)">{{ __('Všechny detaily') }}</button>
    </div>

    <!-- Úkoly a Záznamy: jedna instance Activities (musí zůstat připojená kvůli dialogům), přepíná se jen vnitřní záložka -->
    <div v-show="leadTab === 'tasks' || leadTab === 'records'" :id="`gl-lpanel-${leadTab}`" role="tabpanel" :aria-labelledby="`gl-ltab-${leadTab}`" class="gl-chiptabs px-4 pt-2">
      <Tabs
        v-model="tabIndex"
        as="div"
        :tabs="tabs"
        class="flex flex-col [&_[role='tab']]:px-0 [&_[role='tab']]:shrink-0 [&_[role='tablist']]:min-h-[45px] [&_[role='tablist']]:flex-wrap"
        :class="leadTab === 'tasks' && '[&_[role=\'tablist\']]:hidden'"
      >
        <template #tab-panel>
          <Activities
            ref="activities"
            hideEmails
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

  <GlActionBar v-if="doc.name" :actions="barActions" :ariaLabel="__('Akce zakázky')" />

  <!-- změna fáze ve spodním panelu (stejné onClick jako dřív: dialogy Vyhráno / Prohráno zůstávají) -->
  <GlSheet v-model:open="showStages" :title="__('Změnit fázi')">
    <button
      v-for="o in mobileStages"
      :key="o.value"
      type="button"
      class="flex min-h-[52px] w-full items-center gap-3 rounded-[14px] px-3 text-left text-[16px]"
      :class="o.value === doc.status ? 'bg-[var(--accent-soft)] font-semibold' : ''"
      :aria-current="o.value === doc.status ? 'true' : undefined"
      @click="pickStage(o)"
    >
      <component :is="o.icon" v-if="o.icon" />
      {{ o.label }}
    </button>
  </GlSheet>

  <!-- Detaily a kontakt ve spodním panelu -->
  <GlSheet v-model:open="showDetails" :title="__('Detaily')" size="full">
    <LeadAside v-model:editing="editingDetails" mobile :doc="doc" @email="openEmail" @call="(p) => ((callPerson = p), (showCall = true))" @saved="afterChange" />
  </GlSheet>
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
import CommentIcon from '@/components/Icons/CommentIcon.vue'
import PhoneIcon from '@/components/Icons/PhoneIcon.vue'
import TaskIcon from '@/components/Icons/TaskIcon.vue'
import NoteIcon from '@/components/Icons/NoteIcon.vue'
import AttachmentIcon from '@/components/Icons/AttachmentIcon.vue'
import WhatsAppIcon from '@/components/Icons/WhatsAppIcon.vue'
import IndicatorIcon from '@/components/Icons/IndicatorIcon.vue'
import LostReasonModal from '@/components/Modals/LostReasonModal.vue'
import LayoutHeader from '@/components/LayoutHeader.vue'
import GlMobileLeadHeader from '@/components/Lead/GlMobileLeadHeader.vue'
import GlActionBar from '@/components/Mobile/GlActionBar.vue'
import GlSheet from '@/components/Mobile/GlSheet.vue'
import LeadAside from '@/components/Lead/LeadAside.vue'
import GlIcon from '@/components/GlIcon.vue'
import GlMobileConversations from '@/components/Email/GlMobileConversations.vue'
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
  // GrowUp: Název zakázky (např. „Nový web“) má přednost před jménem osoby, stejně jako na desktopu
  return doc.value?.order_title || doc.value?.[t] || props.leadId
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
const showStages = ref(false)
const leadTab = ref('comm')
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
  openTasks.reload()
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
const conversations = ref(null)
function openEmail() {
  showDetails.value = false
  leadTab.value = 'comm'
  conversations.value?.openNew()
}

// počet otevřených úkolů do odznaku záložky
const openTasks = createResource({
  url: 'frappe.client.get_count',
  params: { doctype: 'CRM Task', filters: { reference_doctype: 'CRM Lead', reference_docname: props.leadId, status: ['not in', ['Done', 'Canceled']] } },
  auto: true,
})
const leadTabs = computed(() => [
  { key: 'comm', label: __('Komunikace') },
  { key: 'details', label: __('Detaily') },
  { key: 'tasks', label: __('Úkoly'), badge: openTasks.data || 0 },
  { key: 'records', label: __('Záznamy') },
])
// vnitřní záložka Activities podle vnější: Úkoly = Tasks, Záznamy = Vše
watch(leadTab, (k) => {
  const name = k === 'tasks' ? 'Tasks' : k === 'records' ? 'Activity' : null
  const i = tabs.value.findIndex((t) => t.name === name)
  if (i >= 0) tabIndex.value = i
})
function pickStage(o) {
  showStages.value = false
  o.onClick?.()
}
// lišta akcí: hlavní je e-mail, nejvýš 4 tlačítka; Naplánovat a Zápis jsou v „⋯“
const hasPhone = computed(() => !!(doc.value.mobile_no || doc.value.phone))
const barActions = computed(() =>
  [
    { key: 'mail', label: __('E-mail'), icon: 'mail', primary: true, onClick: openEmail },
    hasPhone.value && { key: 'call', label: __('Zavolat'), icon: 'phone', onClick: () => ((callPerson.value = {}), (showCall.value = true)) },
    { key: 'task', label: __('Úkol'), icon: 'plus', onClick: () => activities.value?.modalRef?.showTask() },
    { key: 'stage', label: __('Fáze') + ' ›', onClick: () => (showStages.value = true) },
  ].filter(Boolean),
)
const moreOptions = computed(() => [
  { group: __('Změnit stav'), items: mobileStages.value },
  {
    group: __('Přidat'),
    items: [
      { label: __('Naplánovat'), icon: 'cal', onClick: () => (showSchedule.value = true) },
      { label: __('Zápis'), icon: 'doc', onClick: () => activities.value?.modalRef?.showNote() },
    ],
  },
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
<style scoped>
/* lepivé záložky v posuvném rodiči (MobileLayout), cíl 44 px */
.gl-ltabs { position: sticky; top: 0; z-index: 5; display: flex; gap: 4px; padding: 8px 16px; background: var(--mat-bar); backdrop-filter: var(--mat-blur); border-bottom: 1px solid var(--line); }
.gl-ltab { flex: 1; min-width: 0; min-height: 44px; border-radius: 14px; font-size: 15px; font-weight: 600; color: var(--text-2); display: inline-flex; align-items: center; justify-content: center; gap: 6px; }
.gl-ltab.is-on { background: var(--accent-soft); color: var(--accent-700); }
.gl-ltab:focus-visible { outline: none; box-shadow: var(--focus-ring); }
.gl-ltab-badge { min-width: 20px; height: 20px; padding: 0 6px; border-radius: 10px; font-size: 13px; line-height: 20px; color: #fff; background: var(--accent-600); }
</style>
