export const EDITABLE_FIELDS = ['title', 'price', 'stock', 'description']

export const TITLE_MAX = 120
export const DESCRIPTION_MAX = 2000

// Чернетка — окремий об’єкт рядків для полів форми, а не завантажений товар.
export function createDraft(product) {
  return {
    title: product?.title ?? '',
    price: product ? String(product.price) : '',
    stock: product ? String(product.stock) : '',
    description: product?.description ?? '',
  }
}

const toText = (value) => (value === null || value === undefined ? '' : String(value)).trim()

// Порожній рядок не перетворюється на 0: Number('') дав би хибний результат.
function toNumber(value) {
  const text = toText(value).replace(',', '.')
  return text === '' ? Number.NaN : Number(text)
}

export function normalizeDraft(draft) {
  return {
    title: toText(draft.title),
    price: toNumber(draft.price),
    stock: toNumber(draft.stock),
    description: toText(draft.description),
  }
}

export function validateDraft(draft) {
  const values = normalizeDraft(draft)
  const errors = {}

  if (values.title.length < 1)
    errors.title = 'Вкажіть назву товару.'
  else if (values.title.length > TITLE_MAX)
    errors.title = `Назва має містити не більше ${TITLE_MAX} символів.`

  if (toText(draft.price) === '')
    errors.price = 'Вкажіть ціну.'
  else if (!Number.isFinite(values.price) || values.price <= 0)
    errors.price = 'Ціна має бути додатним числом.'

  if (toText(draft.stock) === '')
    errors.stock = 'Вкажіть залишок.'
  else if (!Number.isInteger(values.stock) || values.stock < 0)
    errors.stock = 'Залишок має бути цілим числом від 0.'

  if (values.description.length < 1)
    errors.description = 'Вкажіть опис товару.'
  else if (values.description.length > DESCRIPTION_MAX)
    errors.description = `Опис має містити не більше ${DESCRIPTION_MAX} символів.`

  return { values, errors, isValid: Object.keys(errors).length === 0 }
}

// Чернетка змінена, якщо хоча б одне поле після trim відрізняється від початкового значення.
export function isDraftChanged(draft, initial) {
  return EDITABLE_FIELDS.some((field) => toText(draft[field]) !== toText(initial[field]))
}
