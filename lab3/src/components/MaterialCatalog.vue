<script setup>
import MaterialCard from './MaterialCard.vue'
import MaterialFilterForm from './MaterialFilterForm.vue'
import ModalDialog from './ModalDialog.vue'
import { computed, reactive, ref } from 'vue'
import { materials } from '../data/materials.js'

// Робочий список — копії імпортованих об'єктів; сам масив materials не змінюється.
const items = ref(materials.map((material) => ({ ...material })))
const selectedId = ref(items.value[0]?.id ?? null)

const activeFilters = reactive({
  query: '',
  topic: 'all',
})

function applyFilters(payload) {
  activeFilters.query = payload.query
  activeFilters.topic = payload.topic
}

function clearFilters() {
  activeFilters.query = ''
  activeFilters.topic = 'all'
}

const filteredMaterials = computed(() => {
  const query = activeFilters.query.toLowerCase()

  return items.value.filter((material) => {
    const matchesQuery = material.title.toLowerCase().includes(query)
    const matchesTopic =
      activeFilters.topic === 'all' || material.topic === activeFilters.topic

    return matchesQuery && matchesTopic
  })
})

const totalMinutes = computed(() =>
  filteredMaterials.value.reduce((sum, material) => sum + material.minutes, 0),
)

const selectedMaterial = computed(
  () => items.value.find((material) => material.id === selectedId.value) ?? null,
)

// Єдиний діалог для двох сценаріїв: 'edit' або 'delete'.
// Режим і вміст не очищуються після закриття, щоб лишатися видимими,
// доки триває анімація зникнення; їх перезаповнюють під час наступного відкриття.
const isOpen = ref(false)
const dialogMode = ref('edit')
const dialogTitle = ref('Редагування матеріалу')

const editingId = ref(null)
const draft = ref({ title: '', minutes: '' })
const errors = ref({ title: '', minutes: '' })
const titleInput = ref(null)

const deleteTarget = ref({ id: null, title: '' })
const cancelDeleteButton = ref(null)
const catalogHeading = ref(null)

function openEdit(material) {
  dialogMode.value = 'edit'
  dialogTitle.value = 'Редагування матеріалу'
  editingId.value = material.id
  draft.value = { title: material.title, minutes: material.minutes }
  errors.value = { title: '', minutes: '' }
  isOpen.value = true
}

function openDelete(material) {
  dialogMode.value = 'delete'
  dialogTitle.value = 'Видалення матеріалу'
  deleteTarget.value = { id: material.id, title: material.title }
  isOpen.value = true
}

function validateDraft() {
  const title = String(draft.value.title).trim()
  const minutes = Number(draft.value.minutes)
  const result = { title: '', minutes: '' }

  if (!title) {
    result.title = 'Введіть назву матеріалу.'
  }

  if (draft.value.minutes === '' || !Number.isInteger(minutes) || minutes <= 0) {
    result.minutes = 'Тривалість має бути додатним цілим числом хвилин.'
  }

  errors.value = result
  return result.title || result.minutes ? null : { title, minutes }
}

function saveEdit() {
  const valid = validateDraft()

  if (!valid) {
    return
  }

  items.value = items.value.map((material) =>
    material.id === editingId.value ? { ...material, ...valid } : material,
  )
  isOpen.value = false
}

function confirmDelete() {
  const id = deleteTarget.value.id

  items.value = items.value.filter((material) => material.id !== id)

  if (selectedId.value === id) {
    selectedId.value = items.value[0]?.id ?? null
  }

  isOpen.value = false
}
</script>

<template>
  <section class="material-catalog" aria-labelledby="catalog-title">
    <div class="material-catalog__heading">
      <div>
        <h2
          id="catalog-title"
          ref="catalogHeading"
          class="material-catalog__title"
          tabindex="-1"
        >
          Каталог матеріалів
        </h2>
      </div>
      <p class="material-catalog__summary">
        <strong class="material-catalog__count">
          Знайдено: {{ filteredMaterials.length }}
        </strong>
        <span aria-hidden="true">·</span>
        Загальна тривалість: {{ totalMinutes }} хв
      </p>
    </div>

    <MaterialFilterForm @apply="applyFilters" @clear="clearFilters" />

    <p class="selection-status" aria-live="polite">
      <span class="selection-status__label">Обраний матеріал</span>
      <strong class="selection-status__value">
        {{ selectedMaterial?.title ?? 'не обрано' }}
      </strong>
    </p>

    <div v-if="filteredMaterials.length" class="material-list">
      <MaterialCard
        v-for="material in filteredMaterials"
        :key="material.id"
        :id="material.id"
        :title="material.title"
        :topic="material.topic"
        :description="material.description"
        :minutes="material.minutes"
        :selected="material.id === selectedId"
        @select="selectedId = material.id"
        @edit="openEdit(material)"
        @delete="openDelete(material)"
      />
    </div>

    <p v-else class="empty-state">
      {{
        items.length
          ? 'За заданими умовами матеріалів немає.'
          : 'Каталог порожній: усі матеріали видалено.'
      }}
    </p>

    <ModalDialog
      v-model="isOpen"
      :title="dialogTitle"
      :initial-focus="dialogMode === 'edit' ? titleInput : cancelDeleteButton"
      :fallback-focus="catalogHeading"
    >
      <form
        v-if="dialogMode === 'edit'"
        id="material-edit-form"
        class="flex flex-col gap-4"
        novalidate
        @submit.prevent="saveEdit"
      >
        <div class="flex flex-col gap-1">
          <label for="material-edit-title" class="font-semibold">Назва</label>
          <input
            id="material-edit-title"
            ref="titleInput"
            v-model="draft.title"
            type="text"
            required
            :aria-invalid="errors.title ? 'true' : 'false'"
            :aria-describedby="errors.title ? 'material-edit-title-error' : undefined"
            class="box-border w-full min-h-11 rounded-lg border border-slate-300 bg-white px-3 text-base text-slate-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
          />
          <p
            v-if="errors.title"
            id="material-edit-title-error"
            class="m-0 text-sm text-red-700"
            role="alert"
          >
            {{ errors.title }}
          </p>
        </div>

        <div class="flex flex-col gap-1">
          <label for="material-edit-minutes" class="font-semibold">
            Тривалість, хв
          </label>
          <input
            id="material-edit-minutes"
            v-model.number="draft.minutes"
            type="number"
            inputmode="numeric"
            min="1"
            step="1"
            required
            :aria-invalid="errors.minutes ? 'true' : 'false'"
            :aria-describedby="errors.minutes ? 'material-edit-minutes-error' : undefined"
            class="box-border w-full min-h-11 rounded-lg border border-slate-300 bg-white px-3 text-base text-slate-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
          />
          <p
            v-if="errors.minutes"
            id="material-edit-minutes-error"
            class="m-0 text-sm text-red-700"
            role="alert"
          >
            {{ errors.minutes }}
          </p>
        </div>
      </form>

      <p v-else class="m-0">
        Матеріал <strong>«{{ deleteTarget.title }}»</strong> буде видалено з
        каталогу. Його картка зникне зі списку, а підсумки буде перераховано.
        Цю дію не можна скасувати.
      </p>

      <template v-if="dialogMode === 'edit'" #footer>
        <button
          type="button"
          class="min-h-11 min-w-11 cursor-pointer rounded-lg border border-slate-300 bg-white px-4 font-semibold text-slate-800 hover:bg-slate-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
          @click="isOpen = false"
        >
          Скасувати
        </button>
        <button
          type="submit"
          form="material-edit-form"
          class="min-h-11 min-w-11 cursor-pointer rounded-lg border-0 bg-slate-900 px-4 font-semibold text-white hover:bg-slate-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
        >
          Зберегти
        </button>
      </template>

      <template v-else #footer>
        <button
          ref="cancelDeleteButton"
          type="button"
          class="min-h-11 min-w-11 cursor-pointer rounded-lg border border-slate-300 bg-white px-4 font-semibold text-slate-800 hover:bg-slate-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
          @click="isOpen = false"
        >
          Скасувати
        </button>
        <button
          type="button"
          class="min-h-11 min-w-11 cursor-pointer rounded-lg border-0 bg-red-700 px-4 font-semibold text-white hover:bg-red-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
          @click="confirmDelete"
        >
          Видалити
        </button>
      </template>
    </ModalDialog>
  </section>
</template>
