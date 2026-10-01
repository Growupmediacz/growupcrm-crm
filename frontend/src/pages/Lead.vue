<template>
  <LayoutHeader>
    <template #left-header>
      <Breadcrumbs :items="breadcrumbs">
        <template #prefix="{ item }">
          <Icon v-if="item.icon" :icon="item.icon" class="mr-2 h-4" />
        </template>
      </Breadcrumbs>
    </template>
    <template v-if="!errorTitle" #right-header>
      <CustomActions
        v-if="document._actions?.length"
        :actions="document._actions"
      />
      <CustomActions
        v-if="document.actions?.length"
        :actions="document.actions"
      />
      <!-- GrowUp (design 2. kolo, oprava 8): max. 3 tlačítka + „…“; „Další fáze“ s názvem fáze v nápovědě -->
      <template v-if="allFields">
        <AssignTo v-model="assignees.data" doctype="CRM Lead" :docname="leadId" />
        <Button variant="solid" :label="__('Hotovo')" iconLeft="check" @click="allFields = false" />
      </template>
      <template v-else>
        <Button :label="__('Upravit')" iconLeft="edit-2" @click="editing = true" />
        <Button :label="__('Naplánovat')" iconLeft="calendar" @click="showSchedule = true" />
        <Tooltip v-if="nextStage" :text="__('Posune do fáze {0}', [nextStage.label])">
          <Button
            variant="solid"
            iconLeft="arrow-right"
            :label="__('Další fáze')"
            @click="nextStage.onClick()"
          />
        </Tooltip>
      </template>
      <Dropdown :options="moreOptions" placement="right">
        <Button icon="more-horizontal" :aria-label="__('Další akce')" />
      </Dropdown>
    </template>
  </LayoutHeader>
  <div v-if="doc.name" class="flex h-full gap-3 overflow-hidden px-2 pb-2">
    <div class="flex min-w-0 flex-1 flex-col gap-3 overflow-hidden">
      <LeadHero :key="heroKey" :doc="doc" :stageOptions="statuses" @changed="reloadResources" @fill="editing = true" />
      <div class="gl-card gl-chiptabs gl-chiptabs-d relative flex flex-1 overflow-hidden" :class="moreTab && 'gl-chiptabs-more'">
        <h2 class="pointer-events-none absolute left-6 top-[22px] z-[1] text-[20px] font-bold tracking-tight text-ink-gray-9">{{ __('Aktivita') }}</h2>
        <!-- oprava 10: 5 čipů (Vše, Zápisy, Hovory, E-maily, Úkoly), ostatní záložky v nabídce „Více“ -->
        <Dropdown v-if="extraTabs.length" :options="extraTabs" placement="right" class="gl-more-tabs absolute right-5 top-4 z-[1]">
          <button
            class="inline-flex h-9 items-center gap-1 rounded-full px-3.5 text-[14px] font-semibold transition"
            :class="moreTab ? 'bg-[#0e1330] text-white' : 'bg-white/55 text-[var(--ink-gray-6,#5b6280)] hover:bg-white/85'"
          >
            {{ moreTab ? moreTab.label : __('Více') }}
            <GlIcon name="down" :size="14" />
          </button>
        </Dropdown>
    <Tabs
      v-model="tabIndex"
      :tabs="tabs"
      class="flex flex-1 overflow-hidden flex-col [&_[role='tab']]:px-0 [&_[role='tab']]:shrink-0 [&_[role='tablist']]:px-5 [&_[role='tablist']::-webkit-scrollbar]:h-0 [&_[role='tablist']]:min-h-[45px] [&_[role='tablist']]:gap-7.5 [&_[role='tabpanel']:not([hidden])]:flex [&_[role='tabpanel']:not([hidden])]:grow"
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
          @afterSave="reloadResources"
        />
      </template>
    </Tabs>
        <!-- rychlé akce pod aktivitou (design 2. kolo, R2ZakazkaDetail) -->
        <div class="flex shrink-0 flex-wrap gap-2 border-t border-[rgba(110,120,200,.14)] px-5 py-3">
          <button v-for="a in quickActions" :key="a.label" class="gl-quick" @click="a.onClick">
            <GlIcon :name="a.icon" :size="16" />{{ a.label }}
          </button>
        </div>
      </div>
    </div>
    <LeadAside
      v-if="!allFields"
      v-model:editing="editing"
      :doc="doc"
      @email="openEmailBox"
      @call="(p) => ((callPerson = p), (showCall = true))"
      @saved="afterAsideSave"
      @allFields="(editing = false), (allFields = true)"
    />
    <Resizer v-else class="gl-card flex flex-col justify-between" side="right">
      <div
        class="flex h-[45px] cursor-copy items-center border-b px-5 py-2.5 text-lg-medium text-ink-gray-9"
        @click="copyToClipboard(leadId)"
      >
        {{ __(leadId) }}
      </div>
      <FileUploader
        :validateFile="validateIsImageFile"
        @success="(file) => updateField('image', file.file_url)"
      >
        <template #default="{ openFileSelector }">
          <div class="flex items-center justify-start gap-5 border-b p-5">
            <div class="group relative size-12">
              <Avatar
                size="3xl"
                class="size-12"
                :label="title"
                :image="doc.image"
              />
              <component
                :is="doc.image ? Dropdown : 'div'"
                v-bind="
                  doc.image
                    ? {
                        options: [
                          {
                            icon: 'upload',
                            label: doc.image
                              ? __('Change Image')
                              : __('Upload Image'),
                            onClick: openFileSelector,
                          },
                          {
                            icon: 'trash-2',
                            label: __('Remove Image'),
                            onClick: () => updateField('image', ''),
                          },
                        ],
                      }
                    : { onClick: openFileSelector }
                "
                class="!absolute bottom-0 left-0 right-0"
              >
                <div
                  class="z-1 absolute bottom-0.5 left-0 right-0.5 flex h-9 cursor-pointer items-center justify-center rounded-b-full bg-black bg-opacity-40 pt-3 opacity-0 duration-300 ease-in-out group-hover:opacity-100"
                  style="
                    -webkit-clip-path: inset(12px 0 0 0);
                    clip-path: inset(12px 0 0 0);
                  "
                >
                  <CameraIcon class="size-4 cursor-pointer text-white" />
                </div>
              </component>
            </div>
            <div class="flex flex-col gap-2.5 truncate">
              <Tooltip :text="doc.lead_name || __('Set First Name')">
                <div class="truncate text-3xl-medium text-ink-gray-9">
                  {{ title }}
                </div>
              </Tooltip>
              <div class="flex gap-1.5">
                <Button
                  v-if="callEnabled"
                  :tooltip="__('Make a Call')"
                  :icon="PhoneIcon"
                  @click="
                    () =>
                      doc.mobile_no
                        ? makeCall(doc.mobile_no)
                        : toast.error(
                            __('Please set a mobile number to make calls'),
                          )
                  "
                />

                <Button
                  :tooltip="__('Send an Email')"
                  :icon="Email2Icon"
                  @click="
                    doc.email
                      ? openEmailBox()
                      : toast.error(
                          __('Please set an email address to send emails'),
                        )
                  "
                />
                <Button
                  :tooltip="__('Go to Website')"
                  :icon="LinkIcon"
                  @click="
                    doc.website
                      ? openWebsite(doc.website)
                      : toast.error(__('Please set a website to visit'))
                  "
                />

                <Button
                  :tooltip="__('Attach a File')"
                  :icon="AttachmentIcon"
                  @click="showFilesUploader = true"
                />

                <Button
                  v-if="canDelete"
                  :tooltip="__('Delete')"
                  variant="subtle"
                  theme="red"
                  icon="lucide-trash-2"
                  @click="deleteLead"
                />
              </div>
              <ErrorMessage :message="__(error)" />
            </div>
          </div>
        </template>
      </FileUploader>
      <SLASection
        v-if="doc.sla_status"
        v-model="doc"
        @updateField="updateField"
      />
      <div
        v-if="sections.data"
        class="flex flex-1 flex-col justify-between overflow-hidden"
      >
        <SidePanelLayout
          :sections="sections.data"
          doctype="CRM Lead"
          :docname="leadId"
          @reload="sections.reload"
          @beforeFieldChange="beforeStatusChange"
          @afterFieldChange="reloadResources"
        />
      </div>
    </Resizer>
  </div>
  <ErrorPage
    v-else-if="errorTitle"
    :errorTitle="errorTitle"
    :errorMessage="errorMessage"
  />
  <ConvertToDealModal
    v-if="showConvertToDealModal"
    v-model="showConvertToDealModal"
    :lead="doc"
  />
  <FilesUploader
    v-model="showFilesUploader"
    doctype="CRM Lead"
    :docname="leadId"
    @after="
      () => {
        activities?.all_activities?.reload()
        changeTabTo('attachments')
      }
    "
  />
  <DeleteLinkedDocModal
    v-if="showDeleteLinkedDocModal"
    v-model="showDeleteLinkedDocModal"
    :doctype="'CRM Lead'"
    :docname="leadId"
    :title="doc.lead_name"
    name="Leads"
  />
  <CalendarEventModal
    v-if="showSchedule"
    v-model="showSchedule"
    :lead="leadId"
    :start="scheduleStart"
    :currentUser="sessionUser"
    :users="calendarUsers.data || []"
    @saved="() => activities?.all_activities?.reload()"
  />
  <GlWonModal v-if="showWon" v-model="showWon" :lead="doc" :onConfirm="confirmWon" />
  <GlCallModal
    v-if="showCall"
    v-model="showCall"
    :lead="doc"
    :person="callPerson"
    @saved="afterCall"
  />
  <LostReasonModal
    v-if="showLostReasonModal"
    v-model="showLostReasonModal"
    doctype="CRM Lead"
    :document="document"
  />
</template>
<script setup>
import { useLeadsOnlyMode } from '@/composables/leadsOnlyMode'

const leadsOnlyMode = useLeadsOnlyMode()
import DeleteLinkedDocModal from '@/components/DeleteLinkedDocModal.vue'
import ErrorPage from '@/components/ErrorPage.vue'
import Icon from '@/components/Icon.vue'
import Resizer from '@/components/Resizer.vue'
import ActivityIcon from '@/components/Icons/ActivityIcon.vue'
import EmailIcon from '@/components/Icons/EmailIcon.vue'
import Email2Icon from '@/components/Icons/Email2Icon.vue'
import CommentIcon from '@/components/Icons/CommentIcon.vue'
import DetailsIcon from '@/components/Icons/DetailsIcon.vue'
import PhoneIcon from '@/components/Icons/PhoneIcon.vue'
import TaskIcon from '@/components/Icons/TaskIcon.vue'
import NoteIcon from '@/components/Icons/NoteIcon.vue'
import WhatsAppIcon from '@/components/Icons/WhatsAppIcon.vue'
import IndicatorIcon from '@/components/Icons/IndicatorIcon.vue'
import CameraIcon from '@/components/Icons/CameraIcon.vue'
import LinkIcon from '@/components/Icons/LinkIcon.vue'
import AttachmentIcon from '@/components/Icons/AttachmentIcon.vue'
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
import FilesUploader from '@/components/FilesUploader/FilesUploader.vue'
import SidePanelLayout from '@/components/SidePanelLayout.vue'
import SLASection from '@/components/SLASection.vue'
import CustomActions from '@/components/CustomActions.vue'
import ConvertToDealModal from '@/components/Modals/ConvertToDealModal.vue'
import {
  openWebsite,
  setupCustomizations,
  copyToClipboard,
  validateIsImageFile,
  isTranslatable,
} from '@/utils'
import { getView } from '@/utils/view'
import { getSettings } from '@/stores/settings'
import { globalStore } from '@/stores/global'
import { statusesStore } from '@/stores/statuses'
import { getMeta } from '@/stores/meta'
import { useDocument } from '@/data/document'
import { whatsappEnabled } from '@/composables/whatsapp'
import { callEnabled } from '@/composables/telephony'
import {
  createResource,
  FileUploader,
  Dropdown,
  Tooltip,
  Avatar,
  Tabs,
  Breadcrumbs,
  call,
  usePageMeta,
  toast,
} from 'frappe-ui'
import { ref, computed, watch, nextTick, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useActiveTabManager } from '@/composables/useActiveTabManager'
import { useUnsavedChangesWarning } from '@/composables/useUnsavedChangesWarning'
import { useVisitedRecords } from '@/composables/useVisitedRecords'

const { brand } = getSettings()
const { $dialog, $socket, makeCall } = globalStore()
const { statusOptions, getLeadStatus } = statusesStore()
const { doctypeMeta } = getMeta('CRM Lead')

const route = useRoute()
const router = useRouter()

const props = defineProps({
  leadId: { type: String, required: true },
})

const reload = ref(false)
const activities = ref(null)
const errorTitle = ref('')
const errorMessage = ref('')
const showDeleteLinkedDocModal = ref(false)
const showConvertToDealModal = ref(false)
const showFilesUploader = ref(false)

// GrowUp: design detailu zakázky (2. kolo). „Upravit“ přepne kartu Detaily do úprav,
// celý panel CRM (vlastní pole, přiřazení) je až pod „Všechna pole“ / v nabídce „…“.
const editing = ref(!!route.query.edit)
const allFields = ref(false)
async function afterAsideSave() {
  await document.reload()
  activities.value?.all_activities?.reload()
  heroKey.value++
}
const showCall = ref(false)
const callPerson = ref({})
const heroKey = ref(0)
const showWon = ref(false)
const wonStatus = ref('')
async function confirmWon(values) {
  await call('growupcrm.calls.mark_won', { lead: props.leadId, status: wonStatus.value, ...values })
  await document.reload()
  activities.value?.all_activities?.reload()
  sections.reload()
  toast.success(__('Gratulujeme, zakázka je vyhraná'))
}
function afterCall() {
  activities.value?.all_activities?.reload()
  heroKey.value++
}
const showSchedule = ref(false)
const sessionUser = sessionStore().user
const calendarUsers = createResource({ url: 'growupcrm.calendar.get_users', auto: true })
const scheduleStart = computed(() => {
  const d = new Date()
  d.setDate(d.getDate() + 1)
  d.setHours(10, 0, 0, 0)
  return d
})

const {
  triggerOnChange,
  triggerOnRender,
  assignees,
  permissions,
  document,
  scripts,
  error,
} = useDocument('CRM Lead', props.leadId)

const canDelete = computed(() => permissions.data?.permissions?.delete || false)

const doc = computed(() => document.doc || {})
const isLeadConversionDisabled = computed(
  () => doc.value.status && getLeadStatus(doc.value.status)?.type === 'Lost',
)

useUnsavedChangesWarning(() => document.isDirty)

const { markVisited } = useVisitedRecords('CRM Lead')

onMounted(async () => {
  if (document.doc) await triggerOnRender()
  markVisited(props.leadId)
})

watch(error, (err) => {
  if (err) {
    errorTitle.value = __(
      err.exc_type == 'DoesNotExistError'
        ? __('Document not found')
        : __('Error occurred'),
    )
    errorMessage.value = __(err.messages?.[0] || __('An error occurred'))
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
  // GrowUp: Název zakázky (např. „Nový web“) má přednost před jménem osoby
  return doc.value?.order_title || doc.value?.[t] || props.leadId
})

const statuses = computed(() => {
  let customStatuses = document.statuses?.length
    ? document.statuses
    : document._statuses || []
  return statusOptions('lead', customStatuses, triggerStatusChange)
})

usePageMeta(() => {
  return { title: title.value, icon: brand.favicon }
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

const { tabIndex, changeTabTo } = useActiveTabManager(tabs, 'lastLeadTab')

// Čipy: prvních 5 záložek je vidět, zbytek je v „Více“
const VISIBLE_TABS = 5
const extraTabs = computed(() =>
  tabs.value.slice(VISIBLE_TABS).map((t, i) => ({
    label: t.label,
    onClick: () => (tabIndex.value = VISIBLE_TABS + i),
  })),
)
const quickActions = computed(() => [
  { label: __('Zapsat hovor'), icon: 'phone', onClick: () => ((callPerson.value = {}), (showCall.value = true)) },
  { label: __('Zápis'), icon: 'doc', onClick: () => activities.value?.modalRef?.showNote() },
  { label: __('E-mail'), icon: 'mail', onClick: () => openEmailBox() },
  { label: __('Úkol'), icon: 'check', onClick: () => activities.value?.modalRef?.showTask() },
  { label: __('Naplánovat'), icon: 'cal', onClick: () => (showSchedule.value = true) },
])
const moreTab = computed(() => (tabIndex.value >= VISIBLE_TABS ? tabs.value[tabIndex.value] : null))

const sections = createResource({
  url: 'crm.fcrm.doctype.crm_fields_layout.crm_fields_layout.get_sidepanel_sections',
  cache: ['sidePanelSections', 'CRM Lead'],
  params: { doctype: 'CRM Lead' },
  auto: true,
})

async function triggerStatusChange(value) {
  // GrowUp: výhra jde přes dialog „Zakázka vyhrána“ (datum podpisu, finální hodnota)
  if (getLeadStatus(value)?.type === 'Won' && doc.value.status !== value) {
    wonStatus.value = value
    showWon.value = true
    return
  }
  await triggerOnChange('status', value)
  setLostReason()
}

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

const nextStage = computed(() => {
  const order = statuses.value.filter((o) => getLeadStatus(o.value)?.type !== 'Lost')
  const i = order.findIndex((o) => o.value === doc.value.status)
  if (i < 0 || getLeadStatus(doc.value.status)?.type === 'Lost') return null
  return order[i + 1] || null
})

const moreOptions = computed(() => {
  const groups = [
    {
      group: __('Změnit stav'),
      items: statuses.value,
    },
    {
      group: __('Zakázka'),
      items: [
        { label: __('Přiložit soubor'), icon: 'paperclip', onClick: () => (showFilesUploader.value = true) },
        { label: __('Všechna pole'), icon: 'sliders', onClick: () => ((editing.value = false), (allFields.value = true)) },
        { label: __('Kopírovat číslo zakázky'), icon: 'copy', onClick: () => copyToClipboard(props.leadId) },
        !leadsOnlyMode.value && {
          label: __('Convert to Deal'),
          icon: 'repeat',
          condition: () => !isLeadConversionDisabled.value,
          onClick: () => (showConvertToDealModal.value = true),
        },
        canDelete.value && { label: __('Smazat zakázku'), icon: 'trash-2', theme: 'red', onClick: deleteLead },
      ].filter(Boolean),
    },
  ]
  return groups
})

function deleteLead() {
  showDeleteLinkedDocModal.value = true
}

function openEmailBox() {
  let currentTab = tabs.value[tabIndex.value]
  if (!['Emails', 'Comments', 'Activities'].includes(currentTab.name)) {
    activities.value.changeTabTo('emails')
  }
  nextTick(() => (activities.value.emailBox.show = true))
}

function statusLabel(status) {
  if (isTranslatable('CRM Lead Status')) return __(status)
  return status
}

const showLostReasonModal = ref(false)

function setLostReason() {
  if (
    getLeadStatus(document.doc.status).type !== 'Lost' ||
    (document.doc.lost_reason && document.doc.lost_reason !== 'Other') ||
    (document.doc.lost_reason === 'Other' && document.doc.lost_notes)
  ) {
    document.save.submit(null, {
      onSuccess: () => sections.reload(),
    })
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
      onSuccess: () => reloadResources(data),
    })
  }
}

function reloadResources(data) {
  if (Object.hasOwn(data ?? {}, 'lead_owner')) {
    assignees.reload()
  }
  if (
    Object.hasOwn(data ?? {}, 'status') &&
    getLeadStatus(data.status).type != 'Lost'
  ) {
    sections.reload()
  }
}
</script>
