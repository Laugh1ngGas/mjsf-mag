<script setup>
import { computed } from 'vue'

const props = defineProps({
  product: { type: Object, required: true },
})

const details = computed(() => {
  const p = props.product
  const rows = [
    ['Бренд', p.brand],
    ['Категорія', p.category],
    ['Артикул', p.sku],
    ['Вага', p.weight ? `${p.weight} г` : null],
    ['Розміри', p.dimensions ? `${p.dimensions.width} × ${p.dimensions.height} × ${p.dimensions.depth} см` : null],
    ['Гарантія', p.warrantyInformation],
    ['Доставка', p.shippingInformation],
    ['Повернення', p.returnPolicy],
    ['Мінімальне замовлення', p.minimumOrderQuantity ? `${p.minimumOrderQuantity} шт.` : null],
  ]

  return rows.filter(([, value]) => value)
})
</script>

<template>
  <section class="product-details" aria-labelledby="product-overview-title">
    <h2 id="product-overview-title" class="product-details__title">Огляд</h2>
    <p class="product-details__description">{{ product.description }}</p>

    <dl class="product-details__list">
      <div v-for="[label, value] in details" :key="label" class="product-details__row">
        <dt class="product-details__label">{{ label }}</dt>
        <dd class="product-details__value">{{ value }}</dd>
      </div>
    </dl>

    <ul v-if="product.tags?.length" class="product-details__tags" aria-label="Теги">
      <li v-for="tag in product.tags" :key="tag" class="product-details__tag">{{ tag }}</li>
    </ul>
  </section>
</template>
