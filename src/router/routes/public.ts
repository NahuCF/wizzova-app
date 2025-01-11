import AuthLayout from '~/components/layouts/AuthLayout.vue'
import BasicInformation from '~/views/BasicInformation.vue'
import Chats from '~/views/Conversations.vue'
import ConfirmAccount from '~/views/ConfirmAccount.vue'
import LogIn from '~/views/LogIn.vue'
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
        name: 'login',
        meta: { titleKey: 'login' },
        component: LogIn,
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
