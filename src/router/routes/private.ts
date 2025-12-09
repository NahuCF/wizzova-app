import AppLayout from '~/components/layouts/AppLayout.vue'
import Broadcasts from '~/views/Broadcasts.vue'
import ContactFields from '~/views/ContactFields.vue'
import ContactImports from '~/views/ContactImports.vue'
import Contacts from '~/views/Contacts.vue'
import Conversations from '~/views/Conversations.vue'
import NewBroadcast from '~/views/NewBroadcast.vue'
import NewTemplate from '~/views/NewTemplate.vue'
import UsersTeamsRoles from '~/views/settings/UsersTeamsRoles.vue'
import Templates from '~/views/Templates.vue'
import BroadcastDetails from '~/views/BroadcastDetails.vue'
import Bots from '~/views/Bots.vue'
import NewBotFlow from '~/views/NewBotVersion.vue'
import BotDetails from '~/views/BotDetails.vue'
import Subscription from '~/views/Subscription.vue'

const routes = [
  {
    path: '/',
    name: 'app',
    component: AppLayout,
    children: [
      {
        path: '/conversations',
        children: [
          {
            path: '',
            name: 'conversations',
            meta: { titleKey: 'conversations.title' },
            component: Conversations
          }
        ]
      },
      {
        path: '/broadcasts',
        children: [
          {
            path: '',
            name: 'broadcasts',
            meta: { titleKey: 'broadcasts.title' },
            component: Broadcasts
          },
          {
            path: 'new',
            name: 'new-broadcast',
            meta: { titleKey: 'new_broadcast.title' },
            component: NewBroadcast
          },
          {
            path: ':id/detail',
            name: 'broadcast-details',
            meta: { titleKey: 'broadcast_details.title' },
            component: BroadcastDetails
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
        path: '/bots',
        children: [
          {
            path: '',
            name: 'bots',
            meta: { titleKey: 'bots.title' },
            component: Bots
          },
          {
            path: ':id/detail',
            name: 'bot-details',
            meta: { titleKey: 'bot_details.title' },
            component: BotDetails
          },
          {
            path: ':id/new',
            name: 'new-botflow',
            meta: { titleKey: 'bot_workflow.title' },
            component: NewBotFlow
          },
          {
            path: ':id/versions/:versionId',
            name: 'edit-botflow',
            meta: { titleKey: 'bot_workflow.title_edit' },
            component: NewBotFlow
          }
        ]
      },
      {
        path: '/subscription',
        name: 'subscription',
        meta: { titleKey: 'subscription.title' },
        component: Subscription
      },
      {
        path: '/settings',
        children: [
          {
            path: 'users-teams-roles',
            name: 'users-teams-roles',
            meta: { 
              titleKey: 'users_teams_roles.title',
              permissions: ['settings.manage_user_roles_and_teams', 'settings.view_user_roles_and_teams']
            },
            component: UsersTeamsRoles
          },
          {
            path: 'contact-fields',
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
            path: 'templates',
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
                component: NewTemplate,
                props: { isEdit: true }
              }
            ],
          },
        ]
      }
    ],
  },
]

export default routes.map((route) => {
  const meta = { public: false }

  return { ...route, meta }
})
