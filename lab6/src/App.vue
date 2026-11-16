<template>
  <div class="storefront">
    <header class="storefront__masthead">
      <RouterLink class="storefront__brand" :to="{ name: 'products' }" aria-label="Forma, до каталогу">
        FORMA<span class="storefront__brand-mark">®</span>
      </RouterLink>
      <p class="storefront__edition">Лабораторна / 06</p>
      <p class="storefront__note">Бойчук Б.Е. · 7.F2.25-2 · Windows 11 · Chrome · Node.js 25.1.0</p>
    </header>

    <nav class="storefront__nav" aria-label="Основна навігація">
      <RouterLink class="storefront__nav-link" :to="{ name: 'products' }">Каталог</RouterLink>
      <RouterLink class="storefront__nav-link" :to="{ name: 'about' }">Про застосунок</RouterLink>
    </nav>

    <main class="storefront__main">
      <RouterView />
    </main>

    <footer class="storefront__footer">
      <p>Студент: Бойчук Богдан Едуардович · група 7.F2.25-2</p>
      <p>Середовище: Windows 11 · Chrome · Node.js 25.1.0 · Vue 3.5 · Vue Router 4.6</p>
      <a href="https://dummyjson.com/docs/products" target="_blank" rel="noreferrer">
        Дані: DummyJSON
      </a>
    </footer>
  </div>
</template>
