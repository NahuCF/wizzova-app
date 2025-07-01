import AppLayout from '~/components/layouts/AppLayout.vue'
import ContactFields from '~/views/ContactFields.vue'
import Contacts from '~/views/Contacts.vue'
import Conversations from '~/views/Conversations.vue'
import EditTemplate from '~/views/EditTemplate.vue'
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
            meta: { titleKey: 'templates.title' },
            component: Templates,
          },
          {
            path: 'new',
            name: 'new-template',
            meta: { titleKey: 'new_template.title' },
            component: NewTemplate,
          },
          {
            path: ':id/edit',
            name: 'edit-template',
            meta: { titleKey: 'edit_template.title' },
            component: EditTemplate,
          }
        ],
      },
      {
        path: '/contact-fields',
        children: [
          {
            path: '',
            name: 'contact-fields',
            meta: { titleKey: 'contact_fields.title' },
            component: ContactFields
          }
        ]
      },
      {
        path: '/contacts',
        children: [
          {
            path: '',
            name: 'contacts',
            meta: { titleKey: 'contacts.title' },
            component: Contacts
          }
        ]
      }
    ],
  },
]

export default routes.map((route) => {
  const meta = { public: false }

  return { ...route, meta }
})
