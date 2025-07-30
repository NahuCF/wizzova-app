import AppLayout from '~/components/layouts/AppLayout.vue'
import Campaigns from '~/views/Campaigns.vue'
import ContactFields from '~/views/ContactFields.vue'
import ContactImports from '~/views/ContactImports.vue'
import Contacts from '~/views/Contacts.vue'
import Conversations from '~/views/Conversations.vue'
import EditTemplate from '~/views/EditTemplate.vue'
import ReteView from '~/views/flows/ReteView.vue'
import VueFlowView from '~/views/flows/VueFlowView.vue'
import NewCampaign from '~/views/NewCampaign.vue'
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
        path: '/campaigns',
        children: [
          {
            path: '',
            name: 'campaigns',
            meta: { titleKey: 'campaigns.title' },
            component: Campaigns
          },
          {
            path: 'new',
            name: 'new-campaign',
            meta: { titleKey: 'new_campaign.title' },
            component: NewCampaign
          }
        ]
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
          },
          {
            path: 'import/history',
            name: 'contacts-import',
            meta: { titleKey: 'contacts.title' },
            component: ContactImports
          }
        ]
      },
      {
        path: '/flows',
        children: [
          {
            path: 'vue-flow',
            name: 'vue-flow',
            component: VueFlowView
          },
          {
            path: 'retejs',
            name: 'retejs',
            component: ReteView
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
