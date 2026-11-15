<script setup>

const student = {
  specialty: 'F2 Інженерія програмного забезпечення',
  course: '2 курс',
  group: '7.F2.25-2',
  lastName: 'Бойчук',
  firstName: "Богдан",
  middleName: 'Едуардович',
}

const fields = [
  { label: 'Спеціальність', value: student.specialty },
  { label: 'Курс', value: student.course },
  { label: 'Група', value: student.group },
  {
    label: 'ПІБ',
    value: `${student.lastName} ${student.firstName} ${student.middleName}`,
  },
]
</script>

<template>
  <section class="student-card">

    <dl class="student-card__list">
      <div v-for="field in fields" :key="field.label" class="student-card__row">
        <dt class="student-card__label">{{ field.label }}</dt>
        <dd class="student-card__value">{{ field.value }}</dd>
      </div>
    </dl>
  </section>
</template>
