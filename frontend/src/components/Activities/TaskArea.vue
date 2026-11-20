<template>
  <div v-if="tasks.length">
    <div v-for="(task, i) in tasks" :key="task.name">
      <div
        class="activity flex cursor-pointer gap-6 rounded p-2.5 duration-300 ease-in-out hover:bg-surface-gray-1"
        @click="modalRef.showTask(task)"
      >
        <div class="flex flex-1 flex-col gap-1.5 text-base truncate">
          <div class="font-medium text-ink-gray-9 truncate">
            {{ task.title }}
          </div>
          <div class="flex gap-1.5 text-ink-gray-8">
            <div class="flex items-center gap-1.5">
              <UserAvatar :user="task.assigned_to" size="xs" />
              {{ getUser(task.assigned_to).full_name }}
            </div>
            <div v-if="task.due_date" class="flex items-center justify-center">
              <DotIcon class="size-4 text-ink-gray-5" />
            </div>
            <div v-if="task.due_date">
              <Tooltip
                :text="formatDate(task.due_date, 'ddd, MMM D, YYYY | hh:mm a')"
              >
                <div class="flex gap-2">
                  <CalendarIcon class="size-4" />
                  <div>{{ formatDate(task.due_date, 'D MMM, hh:mm a') }}</div>
                </div>
              </Tooltip>
            </div>
            <div class="flex items-center justify-center">
              <DotIcon class="size-4 text-ink-gray-5" />
            </div>
            <div class="flex gap-2">
              <TaskPriorityIcon class="!h-2 !w-2" :priority="task.priority" />
              {{ task.priority }}
            </div>
          </div>
        </div>
        <div class="flex items-center gap-1">
          <Dropdown
            :options="taskStatusOptions(modalRef.updateTaskStatus, task)"
          >
            <Button
              :tooltip="__('Change Status')"
              variant="ghost"
              class="hover:bg-surface-gray-4"
              @click.stop.prevent
            >
              <component :is="taskStatusIcons[task.status] || CircleIcon" class="size-4 text-ink-gray-7" :aria-label="task.status" />
            </Button>
          </Dropdown>
          <Dropdown
            :options="[
              {
                label: __('Delete'),
                icon: 'lucide-trash-2',
                onClick: () => {
                  $dialog({
                    title: __('Delete Task'),
                    message: __('Are you sure you want to delete this task?'),
                    actions: [
                      {
                        label: __('Delete'),
                        theme: 'red',
                        variant: 'solid',
                        onClick(close) {
                          modalRef.deleteTask(task.name)
                          close()
                        },
                      },
                    ],
                  })
                },
              },
            ]"
          >
            <Button
              icon="lucide-more-horizontal"
              variant="ghost"
              class="hover:bg-surface-gray-4 text-ink-gray-9"
              @click.stop.prevent
            />
          </Dropdown>
        </div>
      </div>
      <div
        v-if="i < tasks.length - 1"
        class="mx-2 h-px border-t border-outline-elevation-2"
      />
    </div>
  </div>
</template>
<script setup>
import CalendarIcon from '~icons/lucide/calendar'
import CircleDashedIcon from '~icons/lucide/circle-dashed'
import CircleIcon from '~icons/lucide/circle'
import CircleDotIcon from '~icons/lucide/circle-dot'
import CircleCheckIcon from '~icons/lucide/circle-check'
import CircleXIcon from '~icons/lucide/circle-x'
import TaskPriorityIcon from '@/components/Icons/TaskPriorityIcon.vue'
import DotIcon from '~icons/lucide/dot'
import UserAvatar from '@/components/UserAvatar.vue'
const taskStatusIcons = {
  Backlog: CircleDashedIcon,
  Todo: CircleIcon,
  'In Progress': CircleDotIcon,
  Done: CircleCheckIcon,
  Canceled: CircleXIcon,
}
import { formatDate, taskStatusOptions } from '@/utils'
import { usersStore } from '@/stores/users'
import { globalStore } from '@/stores/global'
import { Tooltip, Dropdown } from 'frappe-ui'

defineProps({
  tasks: { type: Array, default: () => [] },
  modalRef: { type: Object, default: () => ({}) },
})

const { getUser } = usersStore()
const { $dialog } = globalStore()
</script>
