import AuthLayout from '~/components/layouts/AuthLayout.vue'
import CompleteProfileLayout from '~/components/layouts/CompleteProfileLayout.vue'
import BasicInformation from '~/views/BasicInformation.vue'
import Chats from '~/views/Chats.vue'
import LogIn from '~/views/LogIn.vue'
import SignUp from '~/views/SignUp.vue'
import VerifyAccount from '~/views/VerifyAccount.vue'
import VerifyWhatsapp from '~/views/VerifyWhatsapp.vue'

const routes = [
  {
    path: '/',
    name: 'auth',
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
        meta: { titleKey: 'sign_up' },
      },
      {
        path: '/chats',
        name: 'chats',
        component: Chats,
      },
    ],
  },
  {
    path: '/',
    name: 'complete-profile',
    component: CompleteProfileLayout,
    children: [
      {
        path: '/verify-account',
        name: 'verify-account',
        component: VerifyAccount,
      },
      {
        path: '/basic-information',
        name: 'basic-information',
        component: BasicInformation,
      },
      {
        path: '/verify-whatsapp',
        name: 'verify-whatsapp',
        component: VerifyWhatsapp,
      },
    ],
  },
]

export default routes.map((route) => {
  const meta = { public: true }

  return { ...route, meta }
})
