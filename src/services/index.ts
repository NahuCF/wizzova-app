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
import CampaignService from './CampaignService'

export { default as TemplateLanguageService } from './TemplateLanguageService'
export { default as TemplateCategoryService } from './TemplateCategoryService'
export { default as TemplateHeaderService } from './TemplateHeaderService'

export const API = {
    auth: AuthService,
    campaign: CampaignService,
    contact: ContactService,
    contactField: ContactFieldService,
    country: CountryService,
    currency: CurrencyService,
    group: GroupService,
    industry: IndustryService,
    knownPlace: KnownPLaceService,
    templateCategory: TemplateCategoryService,
    templateHeader: TemplateHeaderService,
    templateLanguage: TemplateLanguageService,
    template: TemplateService,
    timezone: TimezoneService,
    user: UserService
}