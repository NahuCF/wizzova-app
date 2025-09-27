import AuthService from '~/services/AuthService'
import CountryService from './CountryService'
import CurrencyService from './CurrencyService'
import IndustryService from './IndustryService'
import KnownPLaceService from './KnownPLaceService'
import TemplateCategoryService from './TemplateCategoryService'
import TemplateHeaderService from './TemplateHeaderService'
import TemplateLanguageService from './TemplateLanguageService'
import TemplateService from './TemplateService'
import TimezoneService from './TimezoneService'
import ContactFieldService from './ContactFieldService'
import ContactService from './ContactService'
import UserService from './UserService'
import GroupService from './GroupService'
import TenantService from './TenantService'
import MetaService from './MetaService'
import BroadcastService from './BroadcastService'
import TeamService from './TeamService'
import RoleService from './RoleService'
import WabaService from './WabaService'
import ConversationService from './ConversationService'
import MessageService from './MessageService'
import BotService from './BotService.mock'

export { default as TemplateLanguageService } from './TemplateLanguageService'
export { default as TemplateCategoryService } from './TemplateCategoryService'
export { default as TemplateHeaderService } from './TemplateHeaderService'

export const API = {
    auth: AuthService,
    bot: BotService,
    broadcast: BroadcastService,
    contact: ContactService,
    contactField: ContactFieldService,
    conversation: ConversationService,
    country: CountryService,
    currency: CurrencyService,
    group: GroupService,
    industry: IndustryService,
    knownPlace: KnownPLaceService,
    message: MessageService,
    role: RoleService,
    team: TeamService,
    templateCategory: TemplateCategoryService,
    templateHeader: TemplateHeaderService,
    templateLanguage: TemplateLanguageService,
    template: TemplateService,
    timezone: TimezoneService,
    user: UserService,
    tenant: TenantService,
    meta: MetaService,
    waba: WabaService
}