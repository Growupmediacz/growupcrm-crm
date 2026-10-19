<template>
  <Dialog v-model:open="show" :size="'xl'">
    <template #body>
      <div
        v-if="!confirmDeleteInfo.show"
        class="bg-surface-elevation-1 px-4 pb-6 pt-5 sm:px-6"
      >
        <div class="mb-6 flex items-center justify-between">
          <div>
            <h3 class="text-3xl-semibold leading-6 text-ink-gray-9">
              {{
                checkingLinks || linkedDocs?.length == 0
                  ? __('Delete')
                  : __('Delete or unlink linked documents')
              }}
            </h3>
          </div>
          <div class="flex items-center gap-1">
            <Button variant="ghost" icon="lucide-x" @click="show = false" />
          </div>
        </div>
        <div>
          <div v-if="linkedDocs?.length > 0">
            <span class="text-ink-gray-5 text-base">
              {{
                __(
                  'Na tento záznam navazují další. Před smazáním je smažte, nebo je odpojte (zůstanou, jen už nebudou propojené).',
                )
              }}
            </span>
            <LinkedDocsListView
              class="mt-4"
              :rows="linkedDocs"
              :columns="[
                {
                  label: __('Záznam'),
                  key: 'title',
                  width: '19rem',
                },
                {
                  label: __('Typ'),
                  key: 'reference_doctype',
                  width: '12rem',
                },
              ]"
              :linkedDocsResource="linkedDocsResource"
              :unlinkLinkedDoc="unlinkLinkedDoc"
              @selectionsChanged="
                (selections) => viewControls.updateSelections(selections)
              "
            />
          </div>
          <div v-if="checkingLinks" class="text-ink-gray-5 text-base">
            {{ __('Kontroluji propojené záznamy…') }}
          </div>
          <div v-else-if="linkedDocs?.length == 0" class="text-ink-gray-5 text-base">
            {{
              __('Opravdu chcete smazat {0} „{1}“? Smazání nejde vrátit.', [
                doctypeAccusative(props.doctype),
                props.docname,
              ])
            }}
          </div>
        </div>
      </div>
      <div v-if="!confirmDeleteInfo.show" class="px-4 pb-7 pt-0 sm:px-6">
        <div class="flex flex-row-reverse gap-2">
          <Button
            v-if="linkedDocs?.length > 0"
            :label="
              viewControls?.selections?.length == 0
                ? __('Delete All')
                : __('Delete {0} Item(s)', [viewControls?.selections?.length])
            "
            theme="red"
            variant="solid"
            icon-left="trash-2"
            @click="confirmDelete()"
          />
          <Button
            v-if="linkedDocs?.length > 0"
            :label="
              viewControls?.selections?.length == 0
                ? __('Unlink All')
                : __('Unlink {0} Item(s)', [viewControls?.selections?.length])
            "
            variant="subtle"
            theme="gray"
            icon-left="unlock"
            @click="confirmUnlink()"
          />
          <Button
            v-if="!checkingLinks && linkedDocs?.length == 0"
            variant="solid"
            icon-left="lucide-trash-2"
            :label="__('Delete')"
            :loading="isDealCreating"
            theme="red"
            @click="deleteDoc()"
          />
        </div>
      </div>
      <div
        v-if="confirmDeleteInfo.show"
        class="bg-surface-elevation-1 px-4 pb-6 pt-5 sm:px-6"
      >
        <div class="mb-6 flex items-center justify-between">
          <div>
            <h3 class="text-3xl-semibold leading-6 text-ink-gray-9">
              {{ confirmDeleteInfo.title }}
            </h3>
          </div>
          <div class="flex items-center gap-1">
            <Button variant="ghost" icon="lucide-x" @click="show = false" />
          </div>
        </div>
        <div class="text-ink-gray-5 text-base">
          {{ confirmDeleteInfo.message }}
        </div>
        <div class="flex justify-end gap-2 mt-6">
          <Button variant="ghost" @click="cancel()">
            {{ __('Cancel') }}
          </Button>
          <Button
            variant="solid"
            :label="confirmDeleteInfo.title"
            theme="red"
            @click="removeDocLinks()"
          />
        </div>
      </div>
    </template>
  </Dialog>
</template>

<script setup>
import { doctypeAccusative, showDeleteFailures } from '@/utils/glDoctype'
import { createResource, call, toast } from 'frappe-ui'
import { useRouter } from 'vue-router'
import { computed, ref } from 'vue'
import {
  markDocumentAsDeleted,
  unmarkDocumentAsDeleted,
  expireDeletionMarker,
} from '@/data/document'

const show = defineModel({ type: Boolean })
const router = useRouter()
const props = defineProps({
  name: { type: String, required: true },
  doctype: { type: String, required: true },
  docname: { type: String, required: true },
  title: { type: String, default: null },
  reload: { type: Function, default: null },
})
const viewControls = ref({
  selections: [],
  updateSelections: (selections) => {
    viewControls.value.selections = Array.from(selections || [])
  },
})

const confirmDeleteInfo = ref({
  show: false,
  title: '',
})

const linkedDocsResource = createResource({
  url: 'crm.api.doc.get_linked_docs_of_document',
  params: {
    doctype: props.doctype,
    docname: props.docname,
  },
  auto: true,
  validate(params) {
    if (!params?.doctype || !params?.docname) {
      return false
    }
  },
})

// growup: dokud se propojené záznamy nenačtou, nenabízet „Smazat“ (smazání by selhalo a dialog problikl)
const checkingLinks = computed(() => !linkedDocsResource.data && !linkedDocsResource.error)

const linkedDocs = computed(() => {
  return (
    linkedDocsResource.data?.map((doc) => ({
      id: doc.reference_docname,
      ...doc,
    })) || []
  )
})

const cancel = () => {
  confirmDeleteInfo.value.show = false
  viewControls.value.updateSelections([])
}

const unlinkLinkedDoc = (doc) => {
  let selectedDocs = []
  if (viewControls.value.selections.length > 0) {
    Array.from(viewControls.value.selections).forEach((selection) => {
      const docData = linkedDocs.value.find((d) => d.id == selection)
      selectedDocs.push({
        doctype: docData.reference_doctype,
        docname: docData.reference_docname,
      })
    })
  } else {
    selectedDocs = linkedDocs.value.map((doc) => ({
      doctype: doc.reference_doctype,
      docname: doc.reference_docname,
    }))
  }

  call('crm.api.doc.remove_linked_doc_reference', {
    items: selectedDocs,
    remove_contact: props.doctype == 'Contact',
    delete: doc.delete,
    parent_doctype: props.doctype, // growup: odpojení podle všech polí (growupcrm.deletion)
    parent_name: props.docname,
  }).then((res) => {
    showDeleteFailures(res)
    linkedDocsResource.reload()
    confirmDeleteInfo.value = {
      show: false,
      title: '',
    }
  })
}

const confirmDelete = () => {
  const items = viewControls.value.selections.length || linkedDocs.value.length
  confirmDeleteInfo.value = {
    show: true,
    title: __('Smazat propojené záznamy'),
    message: __('Propojené záznamy ({0}) se smažou i s jejich úkoly, zápisy a hovory. Smazání nejde vrátit. Potom smažete i samotný záznam.', [items]),
    delete: true,
  }
}

const confirmUnlink = () => {
  const items = viewControls.value.selections.length || linkedDocs.value.length
  confirmDeleteInfo.value = {
    show: true,
    title: __('Odpojit propojené záznamy'),
    message: __('Propojené záznamy ({0}) se odpojí. Zůstanou v CRM, jen už nebudou propojené. Potom smažete samotný záznam.', [items]),
    delete: false,
  }
}

const removeDocLinks = () => {
  unlinkLinkedDoc({
    reference_doctype: props.doctype,
    reference_docname: props.docname,
    delete: confirmDeleteInfo.value.delete,
  })
  viewControls.value.updateSelections([])
}

const deleteDoc = async () => {
  // Mark before the request starts: the backend's delete_doc fires a
  // realtime doc_update event that can reach the still-mounted document
  // resource before this awaited call resolves on the frontend.
  markDocumentAsDeleted(props.doctype, props.docname)
  try {
    await call('frappe.client.delete', {
      doctype: props.doctype,
      name: props.docname,
    })
  } catch (err) {
    unmarkDocumentAsDeleted(props.doctype, props.docname)
    throw err
  }
  expireDeletionMarker(props.doctype, props.docname)
  const label = props.title
    ? `${props.docname} (${props.title})`
    : props.docname
  toast.success(__('{0} deleted successfully', [label]))
  show.value = false
  router.push({ name: props.name })
  props?.reload?.()
}
</script>
