import AppLayout from '~/components/layouts/AppLayout.vue'
import Conversations from '~/views/Conversations.vue'
import NewTemplate from '~/views/NewTemplate.vue'
import Templates from '~/views/Templates.vue'

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
      {
        path: '/templates',
        children: [
          {
            path: '',
            name: 'templates',
            meta: { titleKey: 'templates' },
            component: Templates,
          },
          {
            path: 'new',
            name: 'new-template',
            meta: { titleKey: 'new_template' },
            component: NewTemplate,
          },
        ],
      },
    ],
  },
]

export default routes.map((route) => {
  const meta = { public: false }

  return { ...route, meta }
})
