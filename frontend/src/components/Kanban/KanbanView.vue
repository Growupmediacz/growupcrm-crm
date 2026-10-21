<template>
  <!-- GrowUp (design 2. kolo, oprava 12): sloupce se posouvají, okraj s přechodem + šipka a ukazatel pozice -->
  <div class="relative flex h-full min-h-0 flex-col">
  <div ref="scroller" class="gl-kanban-scroll flex h-full overflow-x-auto" @scroll="measure">
    <Draggable
      v-if="columns"
      :list="columns"
      item-key="column"
      :delay="isTouchScreenDevice() ? 200 : 0"
      class="flex mx-0 pb-3.5"
      @end="updateColumn"
    >
      <template #item="{ element: column }">
        <div
          v-if="!column.column.delete"
          class="gl3-lane flex flex-1 flex-col gap-3 min-w-[200px] p-3 mr-3"
          :style="{ '--lane': stageHex(column.column.color) }"
        >
          <div class="flex gap-2 items-center group justify-between">
            <div class="flex items-center text-base">
              <Popover>
                <template #target="{ togglePopover }">
                  <button
                    class="flex size-7 items-center justify-center rounded-full hover:bg-surface-gray-2"
                    :aria-label="__('Barva sloupce')"
                    @click="togglePopover"
                  >
                    <span class="size-3 rounded-full bg-[var(--lane)]" />
                  </button>
                </template>
                <template #body>
                  <div
                    class="flex flex-col gap-3 px-3 py-2.5 min-w-40 rounded-lg bg-surface-elevation-2 shadow-2xl ring-1 ring-black ring-opacity-5 focus:outline-none"
                  >
                    <div class="flex gap-1">
                      <Button
                        v-for="color in colors"
                        :key="color"
                        variant="ghost"
                        @click="() => (column.column.color = color)"
                      >
                        <IndicatorIcon :class="parseColor(color)" />
                      </Button>
                    </div>
                    <div class="flex flex-row-reverse">
                      <Button
                        variant="solid"
                        :label="__('Apply')"
                        @click="updateColumn"
                      />
                    </div>
                  </div>
                </template>
              </Popover>
              <div class="truncate text-[17px] font-semibold tracking-[-0.01em] text-ink-gray-9">{{ __(column.column.name) }}</div>
            </div>
            <div class="flex">
              <Dropdown :options="actions(column)">
                <template #default>
                  <Button
                    class="opacity-0 group-hover:opacity-100 pointer-events-none group-hover:pointer-events-auto transition-opacity"
                    icon="lucide-more-horizontal"
                    variant="ghost"
                  />
                </template>
              </Dropdown>
            </div>
          </div>
          <!-- design 3. kolo: pod názvem „3 · 245 000 Kč“ -->
          <div class="num -mt-2.5 pl-8 text-[14px] text-ink-gray-5">
            {{ column.column.all_count }}<template v-if="column.column.sum !== undefined">
              · {{ new Intl.NumberFormat('cs-CZ').format(column.column.sum) }} Kč</template>
          </div>
          <div class="overflow-y-auto flex flex-col gap-2 h-full">
            <Draggable
              :list="column.data"
              group="fields"
              item-key="name"
              class="flex flex-col gap-3.5 flex-1"
              :delay="isTouchScreenDevice() ? 200 : 0"
              :data-column="column.column.name"
              @end="updateColumn"
            >
              <template #item="{ element: fields }">
                <component
                  :is="options.getRoute ? 'router-link' : 'div'"
                  class="gl3-kcard gl-lift p-4 text-base flex flex-col text-ink-gray-9"
                  :data-name="fields.name"
                  @contextmenu.prevent="emit('cardMenu', { x: $event.clientX, y: $event.clientY, lead: fields })"
                  v-bind="{
                    to: options.getRoute ? options.getRoute(fields) : undefined,
                    onClick: options.onClick
                      ? () => options.onClick(fields)
                      : undefined,
                  }"
                >
                  <slot name="card" v-bind="{ fields, column }">
                  <slot
                    name="title"
                    v-bind="{ fields, titleField, itemName: fields.name }"
                  >
                    <div class="h-5 flex items-center">
                      <div v-if="fields[titleField]">
                        {{ fields[titleField] }}
                      </div>
                      <div v-else class="text-ink-gray-4">
                        {{ __('No Title') }}
                      </div>
                    </div>
                  </slot>
                  <div class="border-b h-px my-2.5" />

                  <div class="flex flex-col gap-3.5">
                    <template v-for="value in column.fields" :key="value">
                      <slot
                        name="fields"
                        v-bind="{
                          fields,
                          fieldName: value,
                          itemName: fields.name,
                        }"
                      >
                        <div v-if="fields[value]" class="truncate">
                          {{ fields[value] }}
                        </div>
                      </slot>
                    </template>
                  </div>
                  <div class="border-b h-px mt-2.5 mb-2" />
                  <slot name="actions" v-bind="{ itemName: fields.name }">
                    <div class="flex gap-2 items-center justify-between">
                      <div></div>
                      <Button
                        icon="lucide-plus"
                        variant="ghost"
                        @click.stop.prevent
                      />
                    </div>
                  </slot>
                  </slot>
                </component>
              </template>
            </Draggable>
            <button
              v-if="options.onNewClick"
              class="gl3-kadd flex h-11 items-center justify-center gap-2 rounded-[14px] text-[15px] font-medium"
              @click="options.onNewClick(column)"
            >
              <span class="lucide-plus size-4" aria-hidden="true" />
              {{ __('Přidat') }}
            </button>
            <div
              v-if="column.column.count < column.column.all_count"
              class="flex items-center justify-center"
            >
              <Button
                :label="__('Load More')"
                @click="emit('loadMore', column.column.name)"
              />
            </div>
          </div>
        </div>
      </template>
    </Draggable>
    <!-- design 3. kolo: přidání skrytého sloupce jako malé kulaté „+“, ať se vejde 5 fází -->
    <div class="shrink-0">
      <Combobox
        :model-value="null"
        :options="deletedColumns"
        @update:selected-option="(e) => addColumn(e)"
      >
        <template #trigger="{ open, setOpen }">
          <button
            class="gl-round mr-2 mt-1 flex size-10 items-center justify-center rounded-full text-ink-gray-5"
            :aria-label="__('Add Column')"
            :title="__('Add Column')"
            @click="setOpen(!open)"
          >
            <span class="lucide-plus size-4" aria-hidden="true" />
          </button>
        </template>
        <template #footer>
          <Button
            class="w-full"
            :label="__('Reload Columns')"
            :iconLeft="RefreshIcon"
            @click="updateColumn(null, true)"
          />
        </template>
      </Combobox>
    </div>
  </div>
    <div
      v-if="canRight"
      class="pointer-events-none absolute bottom-6 right-0 top-0 w-24 bg-gradient-to-l from-[rgba(241,243,250,.95)] to-transparent"
    />
    <button
      v-if="canRight"
      class="gl-round absolute right-3 top-40 flex size-11 items-center justify-center rounded-full"
      :aria-label="__('Další sloupce')"
      @click="scrollBy(1)"
    >
      <GlIcon name="right" :size="18" />
    </button>
    <button
      v-if="canLeft"
      class="gl-round absolute left-3 top-40 flex size-11 items-center justify-center rounded-full"
      :aria-label="__('Předchozí sloupce')"
      @click="scrollBy(-1)"
    >
      <GlIcon name="left" :size="18" />
    </button>
    <div v-if="canLeft || canRight" class="mx-auto mb-2 h-1 w-60 shrink-0 overflow-hidden rounded-full bg-[rgba(110,120,200,.16)]" aria-hidden="true">
      <div
        class="h-full rounded-full bg-[#5b5bf6] opacity-60 transition-[margin] duration-150"
        :style="{ width: `${thumb.width}%`, marginLeft: `${thumb.left}%` }"
      />
    </div>
  </div>
</template>
<script setup>
import RefreshIcon from '@/components/Icons/RefreshIcon.vue'
import IndicatorIcon from '@/components/Icons/IndicatorIcon.vue'
import { isTouchScreenDevice, colors, parseColor } from '@/utils'

import { stageHex } from '@/utils/glStage'
import Draggable from 'vuedraggable'
import { Combobox, Dropdown, Popover } from 'frappe-ui'
import GlIcon from '@/components/GlIcon.vue'
import { computed, nextTick, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'

defineProps({
  options: {
    type: Object,
    default: () => ({
      getRoute: null,
      onClick: null,
      onNewClick: null,
    }),
  },
})

const emit = defineEmits(['update', 'loadMore', 'cardMenu'])

const kanban = defineModel({ type: Object })

// posun sloupců: šipky, přechod na okraji a ukazatel pozice
const scroller = ref(null)
const canLeft = ref(false)
const canRight = ref(false)
const thumb = reactive({ width: 100, left: 0 })
function measure() {
  const el = scroller.value
  if (!el) return
  const max = el.scrollWidth - el.clientWidth
  canLeft.value = el.scrollLeft > 4
  canRight.value = el.scrollLeft < max - 4
  thumb.width = Math.min(100, (el.clientWidth / el.scrollWidth) * 100)
  thumb.left = max > 0 ? (el.scrollLeft / max) * (100 - thumb.width) : 0
}
function scrollBy(dir) {
  // o jeden sloupec (288 px + mezera)
  scroller.value?.scrollBy({ left: dir * 300, behavior: 'smooth' })
}
let ro
onMounted(() => {
  ro = new ResizeObserver(measure)
  scroller.value && ro.observe(scroller.value)
  measure()
})
onBeforeUnmount(() => ro?.disconnect())
watch(() => kanban.value?.data, () => nextTick(measure))

const titleField = computed(() => {
  return kanban.value?.data?.title_field
})

const columns = computed(() => {
  if (!kanban.value?.data?.data || kanban.value.data.view_type != 'kanban')
    return []
  let _columns = kanban.value.data.data

  let has_color = _columns.some((column) => column.column?.color)
  if (!has_color) {
    _columns.forEach((column, i) => {
      column.column['color'] = colors[i % colors.length]
    })
  }
  return _columns
})

const deletedColumns = computed(() => {
  const _columns = kanban.value?.data?.kanban_columns || []
  return _columns
    ?.filter((col) => col['delete'])
    .map((col) => {
      return { label: col.name, value: col.name }
    })
})

function actions(column) {
  return [
    {
      group: __('Options'),
      hideLabel: true,
      items: [
        {
          label: __('Delete'),
          icon: 'trash-2',
          onClick: () => {
            column.column['delete'] = true
            updateColumn()
          },
        },
      ],
    },
  ]
}

function addColumn(e) {
  let column = columns.value.find((col) => col.column.name == e.value)
  column.column['delete'] = false
  columns.value.splice(columns.value.indexOf(column), 1)
  columns.value.push(column)
  updateColumn()
}

function updateColumn(d, fetchNewColumns = false) {
  let toColumn = d?.to?.dataset.column
  let fromColumn = d?.from?.dataset.column
  let itemName = d?.item?.dataset.name

  let _columns = []
  columns.value.forEach((col) => {
    col.column['order'] = col.data.map((d) => d.name)
    if (col.column.page_length) {
      delete col.column.page_length
    }
    _columns.push(col.column)
  })

  let data = { kanban_columns: _columns, fetchNewColumns }

  if (toColumn != fromColumn) {
    data = { item: itemName, to: toColumn, kanban_columns: _columns }
  }

  emit('update', data)
}
</script>
