import { createRouter, createWebHistory } from 'vue-router'
import AuthLayout from '~/components/layouts/AuthLayout.vue'
import LogIn from '~/views/LogIn.vue'
import SignUp from '~/views/SignUp.vue'
import VerifyAccount from '~/views/VerifyAccount.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: AuthLayout,
      children: [
        {
          path: '/login',
          name: 'login',
          component: LogIn,
        },
        {
          path: '/signup',
          name: 'signup',
          component: SignUp,
        },
        {
          path: '/verify-account',
          name: 'verify-account',
          component: VerifyAccount,
        },
      ],
    },
  ],
})

export default router
