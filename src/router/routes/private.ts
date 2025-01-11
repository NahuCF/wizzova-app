import AppLayout from '~/components/layouts/AppLayout.vue'
import Conversations from '~/views/Conversations.vue'

const routes = [
  {
    path: '/',
    name: 'app',
    component: AppLayout,
    children: [
      {
        path: '/conversations',
        name: 'conversations',
        meta: { titleKey: 'conversations' },
        component: Conversations,
      },
    ],
  },
]

export default routes.map((route) => {
  const meta = { public: false }

  return { ...route, meta }
})
