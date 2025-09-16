import { ref, computed } from 'vue'
import type { UserItem } from '~/types'

export const useMentions = (users: UserItem[]) => {
	const query = ref('')
	const showSelect = ref(false)

	const filteredUsers = computed(() => {
		if (!query.value) return []
		const q = query.value.toLowerCase()
		return users.filter(u => u.name.toLowerCase().includes(q))
	})

	const updateMention = (text: string) => {
		const atIndex = text.lastIndexOf('@')
		if (atIndex === -1) {
			showSelect.value = false
			query.value = ''
			return
		}

		const afterAt = text.slice(atIndex + 1)
		if (afterAt.includes(' ')) {
			showSelect.value = false
			query.value = ''
			return
		}

		query.value = afterAt
		showSelect.value = true
	}

	const selectUser = (text: string, user: UserItem) => {
		const atIndex = text.lastIndexOf('@')
		if (atIndex === -1) return text

		const before = text.slice(0, atIndex + 1)
		const after = text.slice(atIndex + query.value.length + 1)
		showSelect.value = false
		query.value = ''
		return `${before}${user.name} ${after}`
	}

	return {
		query,
		showSelect,
		filteredUsers,
		updateMention,
		selectUser,
	}
}
