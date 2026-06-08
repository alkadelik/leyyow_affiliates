/**
 * src/router/index.js
 * Affiliate portal routes.
 * Bottom nav tabs: Dashboard, Campaigns, Merchants, Payouts, Profile
 */
import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const LoginView          = () => import('@/views/auth/LoginView.vue')
const RegisterView       = () => import('@/views/auth/RegisterView.vue')
const ForgotPasswordView = () => import('@/views/auth/ForgotPasswordView.vue')
const ResetPasswordView  = () => import('@/views/auth/ResetPasswordView.vue')

const AppShell           = () => import('@/components/layout/AppShell.vue')

const DashboardView      = () => import('@/views/dashboard/DashboardView.vue')
const CampaignsView      = () => import('@/views/campaigns/CampaignsView.vue')
const CampaignDetailView = () => import('@/views/campaigns/CampaignDetailView.vue')
const MerchantsView      = () => import('@/views/merchants/MerchantsView.vue')
const PayoutsView        = () => import('@/views/payouts/PayoutsView.vue')
const ProfileView        = () => import('@/views/profile/ProfileView.vue')

const routes = [
  // Auth — no shell
  { path: '/login',           component: LoginView,          meta: { public: true } },
  { path: '/register',        component: RegisterView,       meta: { public: true } },
  { path: '/forgot-password', component: ForgotPasswordView, meta: { public: true } },
  { path: '/reset-password',  component: ResetPasswordView,  meta: { public: true } },

  // Authenticated — inside AppShell with bottom nav
  {
    path: '/',
    component: AppShell,
    redirect: '/dashboard',
    children: [
      { path: 'dashboard',              name: 'dashboard',         component: DashboardView      },
      { path: 'campaigns',              name: 'campaigns',         component: CampaignsView      },
      { path: 'campaigns/:id',          name: 'campaign-detail',   component: CampaignDetailView },
      { path: 'merchants',              name: 'merchants',         component: MerchantsView      },
      { path: 'payouts',                name: 'payouts',           component: PayoutsView        },
      { path: 'profile',                name: 'profile',           component: ProfileView        },
    ],
  },

  { path: '/:pathMatch(.*)*', redirect: '/dashboard' },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior: () => ({ top: 0 }),
})

router.beforeEach(async to => {
  const auth = useAuthStore()
  if (!auth.isAuthenticated && localStorage.getItem('aff_access_token')) {
    await auth.init()
  }
  if (to.meta.public) {
    if (auth.isAuthenticated) return '/dashboard'
    return true
  }
  if (!auth.isAuthenticated) return '/login'
  return true
})

export default router
