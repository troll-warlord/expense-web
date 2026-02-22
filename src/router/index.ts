import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'

import { useAuthStore } from '@/stores/auth'
import { useMasterDataStore } from '@/stores/masterData'

const routes: RouteRecordRaw[] = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/pages/auth/LoginPage.vue'),
    meta: { requiresAuth: false },
  },
  {
    path: '/profile-setup',
    name: 'ProfileSetup',
    component: () => import('@/pages/auth/ProfileSetupPage.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/',
    name: 'Dashboard',
    component: () => import('@/pages/dashboard/DashboardPage.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/transactions',
    name: 'Transactions',
    component: () => import('@/pages/transactions/TransactionsPage.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/settings/categories',
    name: 'Categories',
    component: () => import('@/pages/settings/CategoriesPage.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/settings/payment-methods',
    name: 'PaymentMethods',
    component: () => import('@/pages/settings/PaymentMethodsPage.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/profile',
    name: 'Profile',
    component: () => import('@/pages/profile/ProfilePage.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/:pathMatch(.*)*',
    redirect: '/',
  },
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
  scrollBehavior: () => ({ top: 0 }),
})

// ─── Navigation Guard ─────────────────────────────────────────────────────────

let _appInitialized = false

router.beforeEach(async (to, _from) => {
  const authStore = useAuthStore()

  // On first navigation, attempt to hydrate from stored refresh token
  if (!_appInitialized) {
    _appInitialized = true
    if (!authStore.isAuthenticated) {
      await authStore.initFromStorage()
    }
  }

  const requiresAuth = to.meta.requiresAuth !== false

  if (requiresAuth && !authStore.isAuthenticated) {
    return { name: 'Login', query: { redirect: to.fullPath } }
  }

  if (to.name === 'Login' && authStore.isAuthenticated) {
    return { path: '/' }
  }

  // Profile completeness guards
  if (authStore.isAuthenticated) {
    const profileComplete = authStore.isProfileComplete
    if (to.name === 'ProfileSetup' && profileComplete) {
      return { path: '/' }
    }
    if (requiresAuth && !profileComplete && to.name !== 'ProfileSetup') {
      return { name: 'ProfileSetup' }
    }
  }

  // Load master data once after authentication
  if (authStore.isAuthenticated && requiresAuth) {
    const masterData = useMasterDataStore()
    if (!masterData.loaded) {
      masterData.loadAll().catch(() => {
        /* non-blocking */
      })
    }
  }
})

export default router
