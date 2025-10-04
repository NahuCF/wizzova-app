import type { ContactItem } from "~/types"

export const useContactUtils = () => {
	const getContactName = (contact?: ContactItem) => {
		if(!contact) return

		const name = contact.fields.find(field => field.name === 'Name')?.value

		if(typeof name === 'string') {
			return name
		}

		return
	}

	const getContactPhone = (contact: ContactItem) => {
		if(!contact) return
		
		const phone = contact.fields.find(field => field.name === 'Phone')?.value

		if(phone && Array.isArray(phone) && phone.length > 0) {
			return phone[0]
		}

		return
	}

	return {
		getContactName,
		getContactPhone
	}
}