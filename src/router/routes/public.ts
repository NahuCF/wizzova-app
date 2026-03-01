import AuthLayout from '~/components/layouts/AuthLayout.vue'
import ConfirmAccount from '~/views/ConfirmAccount.vue'
import ChooseTenant from '~/views/login/ChooseTenant.vue'
import LogIn from '~/views/login/LogIn.vue'
import SignUp from '~/views/SignUp.vue'
import VerifyAccount from '~/views/VerifyAccount.vue'

const routes = [
  {
    path: '/',
    name: 'auth',
    component: AuthLayout,
    children: [
      {
        path: '/login',

        children: [
          {
            path: '',
            name: 'login',
            meta: { titleKey: 'login.title' },
            component: LogIn,
          },
          {
            path: 'choose-tenant',
            name: 'choose-tenant',
            meta: { titleKey: 'choose_tenant.title' },
            component: ChooseTenant,
          },
        ],
      },
      {
        path: '/signup',
        name: 'signup',
        component: SignUp,
        meta: { titleKey: 'sign_up' },
      },
      {
        path: '/confirm-account',
        name: 'confirm-account',
        component: ConfirmAccount,
        meta: { titleKey: 'confirm_account' },
      },
      {
        path: '/verify-account',
        name: 'verify-account',
        component: VerifyAccount,
        meta: { titleKey: 'verify_account' },
      },
    ],
  },
]

export default routes.map((route) => {
  const meta = { public: true }

  return { ...route, meta }
})
