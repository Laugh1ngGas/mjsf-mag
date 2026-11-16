import { createRouter, createWebHistory } from 'vue-router'
import ProductsLayout from '../layouts/ProductsLayout.vue'
import ProductLayout from '../layouts/ProductLayout.vue'
import ProductCatalogView from '../views/ProductCatalogView.vue'
import ProductOverviewView from '../views/ProductOverviewView.vue'
import ProductReviewsView from '../views/ProductReviewsView.vue'
import AboutView from '../views/AboutView.vue'
import NotFoundView from '../views/NotFoundView.vue'
// Форма входу входить до основного бандла: вона потрібна й тоді, коли мережа недоступна.
import LoginView from '../views/LoginView.vue'
import { pinia } from '../stores/index.js'
import { installAuthGuards } from './guards.js'

// Код приватного розділу завантажується окремими чанками лише після підтвердження сеансу.
const ManageLayout = () => import('../layouts/ManageLayout.vue')
const ManageProductsView = () => import('../views/ManageProductsView.vue')
const ProductEditView = () => import('../views/ProductEditView.vue')

const routes = [
  { path: '/', redirect: { name: 'products' } },
  {
    path: '/products',
    component: ProductsLayout,
    meta: { breadcrumb: { label: 'Каталог', name: 'products' } },
    children: [
      { path: '', name: 'products', component: ProductCatalogView },
      {
        path: ':id',
        component: ProductLayout,
        meta: { breadcrumb: { dynamic: 'product', name: 'product-overview' } },
        children: [
          { path: '', name: 'product-overview', component: ProductOverviewView },
          {
            path: 'reviews',
            name: 'product-reviews',
            component: ProductReviewsView,
            meta: { breadcrumb: { label: 'Відгуки', name: 'product-reviews' } },
          },
        ],
      },
    ],
  },
  {
    path: '/login',
    name: 'login',
    component: LoginView,
    meta: { breadcrumb: { label: 'Вхід', name: 'login' } },
  },
  {
    // Вимога входу задається для спільної приватної оболонки; to.meta успадковує її в дочірніх записах.
    path: '/manage/products',
    component: ManageLayout,
    meta: { requiresAuth: true, breadcrumb: { label: 'Керування', name: 'manage-products' } },
    children: [
      // Порожній дочірній шлях не має власної крихти, тому дубліката «Керування» немає.
      { path: '', name: 'manage-products', component: ManageProductsView },
      {
        path: ':id/edit',
        name: 'manage-edit',
        component: ProductEditView,
        meta: { breadcrumb: { dynamic: 'product', name: 'manage-edit' } },
      },
    ],
  },
  {
    path: '/about',
    name: 'about',
    component: AboutView,
    meta: { breadcrumb: { label: 'Про застосунок', name: 'about' } },
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'not-found',
    component: NotFoundView,
    meta: { breadcrumb: { label: 'Сторінку не знайдено', name: 'not-found' } },
  },
]

export const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition)
      return savedPosition

    // Перемикання розділів одного товару не прокручує сторінку вгору.
    if (to.params.id && to.params.id === from.params.id)
      return false

    return { top: 0 }
  },
})

installAuthGuards(router, pinia)
